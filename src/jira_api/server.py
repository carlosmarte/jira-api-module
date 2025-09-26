"""FastAPI server for JIRA API operations."""

import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from jira_api.config import Settings, get_config
from jira_api.core.client import JiraClient
from jira_api.exceptions import JiraAPIError
from jira_api.models.issue import Issue, IssueCreate, IssueTransition, IssueUpdate
from jira_api.models.project import Project, ProjectVersion, ProjectVersionCreate
from jira_api.models.user import User
from jira_api.services.issue_service import IssueService
from jira_api.services.project_service import ProjectService
from jira_api.services.user_service import UserService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global settings
settings = Settings()
security = HTTPBasic(auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting JIRA API Server")
    
    # Validate configuration on startup
    config = get_config()
    if not config:
        logger.warning("No JIRA configuration found. Server will require per-request credentials.")
    else:
        logger.info(f"Using JIRA instance: {config.base_url}")
    
    yield
    
    logger.info("Shutting down JIRA API Server")


app = FastAPI(
    title="JIRA API Server",
    description="RESTful API for interacting with Jira Cloud REST API v3",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_jira_client() -> JiraClient:
    """Get a JIRA client instance.

    Returns:
        JiraClient instance

    Raises:
        HTTPException: If configuration is not available
    """
    config = get_config()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JIRA configuration not found. Please configure the server with environment variables.",
        )

    try:
        return JiraClient(
            base_url=config.base_url,
            email=config.email,
            api_token=config.api_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create JIRA client: {e}",
        )


def verify_api_key(credentials: Optional[HTTPBasicCredentials] = Depends(security)) -> bool:
    """Verify API key if configured.

    Args:
        credentials: HTTP Basic credentials

    Returns:
        True if authentication is successful or not required

    Raises:
        HTTPException: If authentication fails
    """
    if not settings.server_api_key:
        # No API key configured, allow access
        return True

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Basic"},
        )

    # Use username field for API key (password can be empty)
    if credentials.username != settings.server_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Basic"},
        )

    return True


# Health Check

@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "service": "jira-api-server"}


# User Endpoints

@app.get("/users/search", response_model=List[User], tags=["Users"])
async def search_users(
    query: str = Query(..., description="Search query for users"),
    max_results: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    _: bool = Depends(verify_api_key),
) -> List[User]:
    """Search for users."""
    try:
        with get_jira_client() as client:
            user_service = UserService(client)
            return user_service.search_users(query, max_results)
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


@app.get("/users/{identifier}", response_model=User, tags=["Users"])
async def get_user(
    identifier: str,
    _: bool = Depends(verify_api_key),
) -> User:
    """Get a user by account ID or email."""
    try:
        with get_jira_client() as client:
            user_service = UserService(client)
            user = user_service.get_user_by_identifier(identifier)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User '{identifier}' not found",
                )
            
            return user
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


# Issue Endpoints

@app.post("/issues", response_model=Issue, tags=["Issues"])
async def create_issue(
    issue_data: IssueCreate,
    _: bool = Depends(verify_api_key),
) -> Issue:
    """Create a new issue."""
    try:
        with get_jira_client() as client:
            issue_service = IssueService(client)
            return issue_service.create_issue(
                project_id=issue_data.project_id,
                summary=issue_data.summary,
                issue_type_id=issue_data.issue_type_id,
                description=issue_data.description,
                priority_id=issue_data.priority_id,
                assignee_email=None,  # Use account ID directly
                labels=issue_data.labels,
            )
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


@app.get("/issues/{issue_key}", response_model=Issue, tags=["Issues"])
async def get_issue(
    issue_key: str,
    _: bool = Depends(verify_api_key),
) -> Issue:
    """Get an issue by key."""
    try:
        with get_jira_client() as client:
            issue_service = IssueService(client)
            return issue_service.get_issue(issue_key)
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


@app.patch("/issues/{issue_key}", tags=["Issues"])
async def update_issue(
    issue_key: str,
    update_data: IssueUpdate,
    _: bool = Depends(verify_api_key),
) -> dict:
    """Update an issue."""
    try:
        with get_jira_client() as client:
            issue_service = IssueService(client)
            
            if update_data.summary:
                issue_service.update_issue_summary(issue_key, update_data.summary)
            
            if update_data.labels_add:
                issue_service.add_labels_to_issue(issue_key, update_data.labels_add)
            
            if update_data.labels_remove:
                issue_service.remove_labels_from_issue(issue_key, update_data.labels_remove)
            
            return {"message": f"Issue {issue_key} updated successfully"}
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


@app.put("/issues/{issue_key}/assign/{email}", tags=["Issues"])
async def assign_issue(
    issue_key: str,
    email: str,
    _: bool = Depends(verify_api_key),
) -> dict:
    """Assign an issue to a user."""
    try:
        with get_jira_client() as client:
            issue_service = IssueService(client)
            issue_service.assign_issue_by_email(issue_key, email)
            
            return {"message": f"Issue {issue_key} assigned to {email}"}
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


@app.get("/issues/{issue_key}/transitions", response_model=List[IssueTransition], tags=["Issues"])
async def get_issue_transitions(
    issue_key: str,
    _: bool = Depends(verify_api_key),
) -> List[IssueTransition]:
    """Get available transitions for an issue."""
    try:
        with get_jira_client() as client:
            issue_service = IssueService(client)
            return issue_service.get_available_transitions(issue_key)
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


class TransitionRequest(BaseModel):
    """Request model for issue transitions."""
    
    transition_name: str
    comment: Optional[str] = None
    resolution_name: Optional[str] = None


@app.post("/issues/{issue_key}/transitions", tags=["Issues"])
async def transition_issue(
    issue_key: str,
    transition_request: TransitionRequest,
    _: bool = Depends(verify_api_key),
) -> dict:
    """Transition an issue to a new status."""
    try:
        with get_jira_client() as client:
            issue_service = IssueService(client)
            issue_service.transition_issue_by_name(
                issue_key,
                transition_request.transition_name,
                transition_request.comment,
                transition_request.resolution_name,
            )
            
            return {"message": f"Issue {issue_key} transitioned using '{transition_request.transition_name}'"}
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


# Project Endpoints

@app.get("/projects/{project_key}", response_model=Project, tags=["Projects"])
async def get_project(
    project_key: str,
    _: bool = Depends(verify_api_key),
) -> Project:
    """Get a project by key."""
    try:
        with get_jira_client() as client:
            project_service = ProjectService(client)
            return project_service.get_project(project_key)
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


@app.get("/projects/{project_key}/versions", response_model=List[ProjectVersion], tags=["Projects"])
async def get_project_versions(
    project_key: str,
    released: Optional[bool] = Query(None, description="Filter by release status"),
    _: bool = Depends(verify_api_key),
) -> List[ProjectVersion]:
    """Get project versions."""
    try:
        with get_jira_client() as client:
            project_service = ProjectService(client)
            return project_service.get_project_versions(project_key, released_only=released)
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


class VersionCreateRequest(BaseModel):
    """Request model for creating project versions."""
    
    name: str
    description: Optional[str] = None


@app.post("/projects/{project_key}/versions", response_model=ProjectVersion, tags=["Projects"])
async def create_project_version(
    project_key: str,
    version_request: VersionCreateRequest,
    _: bool = Depends(verify_api_key),
) -> ProjectVersion:
    """Create a new project version."""
    try:
        with get_jira_client() as client:
            project_service = ProjectService(client)
            return project_service.create_version(
                project_key,
                version_request.name,
                version_request.description,
            )
    except JiraAPIError as e:
        raise HTTPException(status_code=e.status_code or 400, detail=str(e))


def start_server() -> None:
    """Start the FastAPI server (entry point for CLI)."""
    import uvicorn
    
    uvicorn.run(
        "jira_api.server:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.server_reload,
    )


if __name__ == "__main__":
    start_server()