"""Command-line interface for JIRA API operations."""

import json
import sys
from typing import List, Optional

import typer
from rich import print as rprint
from rich.console import Console
from rich.prompt import Confirm, Prompt
from rich.table import Table

from jira_api.config import JiraConfig, get_config, save_config
from jira_api.core.client import JiraClient
from jira_api.exceptions import JiraAPIError
from jira_api.services.issue_service import IssueService
from jira_api.services.project_service import ProjectService
from jira_api.services.user_service import UserService

app = typer.Typer(help="JIRA API Command Line Interface")
console = Console()

# Sub-applications for different command groups
issue_app = typer.Typer(help="Issue operations")
user_app = typer.Typer(help="User operations")
project_app = typer.Typer(help="Project operations")

app.add_typer(issue_app, name="issue")
app.add_typer(user_app, name="user")
app.add_typer(project_app, name="project")


def get_client() -> JiraClient:
    """Get a configured JIRA client.

    Returns:
        JiraClient instance

    Raises:
        typer.Exit: If configuration is not available
    """
    config = get_config()
    if not config:
        rprint("[red]Error: JIRA configuration not found.[/red]")
        rprint("Run 'jira-api configure' to set up your credentials.")
        raise typer.Exit(1)

    try:
        return JiraClient(
            base_url=config.base_url,
            email=config.email,
            api_token=config.api_token,
        )
    except Exception as e:
        rprint(f"[red]Error creating JIRA client: {e}[/red]")
        raise typer.Exit(1)


@app.command()
def configure() -> None:
    """Configure JIRA API credentials interactively."""
    rprint("[bold]JIRA API Configuration[/bold]")
    
    # Check if environment variables are already set
    from jira_api.config import Settings
    settings = Settings()
    
    env_config_available = (
        settings.jira_base_url and 
        settings.jira_email and 
        settings.jira_api_token
    )
    
    if env_config_available:
        rprint("[green]Found existing environment variable configuration:[/green]")
        rprint(f"  JIRA_BASE_URL: {settings.jira_base_url}")
        rprint(f"  JIRA_EMAIL: {settings.jira_email}")
        rprint(f"  JIRA_API_TOKEN: {'*' * len(settings.jira_api_token)}")
        
        if Confirm.ask("Use existing environment variable configuration?"):
            base_url = settings.jira_base_url
            email = settings.jira_email
            api_token = settings.jira_api_token
        else:
            rprint("Please provide new JIRA instance details:")
            base_url = Prompt.ask("JIRA base URL (e.g., https://company.atlassian.net)")
            email = Prompt.ask("Your email address")
            api_token = Prompt.ask("API token", password=True)
    else:
        rprint("Please provide your JIRA instance details:")
        base_url = Prompt.ask("JIRA base URL (e.g., https://company.atlassian.net)")
        email = Prompt.ask("Your email address")
        api_token = Prompt.ask("API token", password=True)

    # Validate the configuration by testing connection
    rprint("\n[yellow]Testing connection...[/yellow]")
    
    try:
        with JiraClient(base_url, email, api_token) as client:
            # Try to get user info to verify credentials
            user_service = UserService(client)
            user = user_service.get_user_by_email(email)
            
            if user:
                rprint(f"[green]✓ Connection successful! Welcome, {user.display_name}[/green]")
            else:
                rprint("[green]✓ Connection successful![/green]")
    
    except JiraAPIError as e:
        rprint(f"[red]✗ Connection failed: {e}[/red]")
        if not Confirm.ask("Save configuration anyway?"):
            rprint("Configuration cancelled.")
            raise typer.Exit(1)

    config = JiraConfig(base_url=base_url, email=email, api_token=api_token)
    save_config(config)
    
    rprint("[green]Configuration saved successfully![/green]")


@app.command()
def server(
    host: str = typer.Option("0.0.0.0", "--host", help="Host to bind to"),
    port: int = typer.Option(8000, "--port", help="Port to bind to"),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload"),
) -> None:
    """Start the FastAPI server."""
    try:
        import uvicorn
        from jira_api.server import app as fastapi_app
        
        rprint(f"[green]Starting JIRA API server on {host}:{port}[/green]")
        uvicorn.run(fastapi_app, host=host, port=port, reload=reload)
    except ImportError:
        rprint("[red]Error: uvicorn not installed. Install with 'pip install uvicorn'[/red]")
        raise typer.Exit(1)


# Issue Commands

@issue_app.command("get")
def get_issue(
    key: str = typer.Argument(..., help="Issue key (e.g., PROJ-123)"),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """Get details of an issue."""
    try:
        with get_client() as client:
            issue_service = IssueService(client)
            issue = issue_service.get_issue(key)

        if json_output:
            print(issue.model_dump_json(indent=2))
        else:
            _display_issue_table(issue)

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("create")
def create_issue(
    project: str = typer.Option(..., "--project", "-p", help="Project key"),
    summary: str = typer.Option(..., "--summary", "-s", help="Issue summary"),
    issue_type: str = typer.Option(..., "--type", "-t", help="Issue type ID"),
    description: Optional[str] = typer.Option(None, "--description", "-d", help="Issue description"),
    assignee: Optional[str] = typer.Option(None, "--assignee", "-a", help="Assignee email"),
    labels: Optional[str] = typer.Option(None, "--labels", "-l", help="Comma-separated labels"),
) -> None:
    """Create a new issue."""
    try:
        with get_client() as client:
            issue_service = IssueService(client)
            project_service = ProjectService(client)
            
            # Get project details to validate project exists
            project_obj = project_service.get_project(project)
            
            label_list = [l.strip() for l in labels.split(",")] if labels else []
            
            issue = issue_service.create_issue(
                project_id=project_obj.id,
                summary=summary,
                issue_type_id=issue_type,
                description=description,
                assignee_email=assignee,
                labels=label_list,
            )

        rprint(f"[green]✓ Issue created successfully: {issue.key}[/green]")
        _display_issue_table(issue)

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("create-by-name")
def create_issue_by_type_name(
    project: str = typer.Option(..., "--project", "-p", help="Project key"),
    summary: str = typer.Option(..., "--summary", "-s", help="Issue summary"),
    issue_type_name: str = typer.Option(..., "--type-name", "-t", help="Issue type name (e.g., 'Bug', 'Story', 'Task')"),
    description: Optional[str] = typer.Option(None, "--description", "-d", help="Issue description"),
    assignee: Optional[str] = typer.Option(None, "--assignee", "-a", help="Assignee email"),
    labels: Optional[str] = typer.Option(None, "--labels", "-l", help="Comma-separated labels"),
) -> None:
    """Create a new issue using issue type name instead of ID."""
    try:
        with get_client() as client:
            issue_service = IssueService(client)
            
            label_list = [l.strip() for l in labels.split(",")] if labels else []
            
            issue = issue_service.create_issue_by_type_name(
                project_key=project,
                summary=summary,
                issue_type_name=issue_type_name,
                description=description,
                assignee_email=assignee,
                labels=label_list,
            )

        rprint(f"[green]✓ Issue created successfully: {issue.key}[/green]")
        _display_issue_table(issue)

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("list-types")
def list_issue_types(
    project: str = typer.Argument(..., help="Project key"),
) -> None:
    """List available issue types for a project."""
    try:
        with get_client() as client:
            issue_types = client.get_project_issue_types(project)

        if not issue_types:
            rprint(f"[yellow]No issue types found for project {project}[/yellow]")
            return

        table = Table(title=f"Issue Types for Project {project}")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Description", style="white")
        table.add_column("Subtask", style="yellow")

        for issue_type in issue_types:
            table.add_row(
                issue_type.get("id", ""),
                issue_type.get("name", ""),
                issue_type.get("description", "")[:50] + "..." if len(issue_type.get("description", "")) > 50 else issue_type.get("description", ""),
                "✓" if issue_type.get("subtask", False) else "✗",
            )

        console.print(table)

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("update")
def update_issue(
    key: str = typer.Argument(..., help="Issue key (e.g., PROJ-123)"),
    summary: Optional[str] = typer.Option(None, "--summary", "-s", help="New summary"),
    add_labels: Optional[str] = typer.Option(None, "--add-labels", help="Labels to add (comma-separated)"),
    remove_labels: Optional[str] = typer.Option(None, "--remove-labels", help="Labels to remove (comma-separated)"),
) -> None:
    """Update an existing issue."""
    if not any([summary, add_labels, remove_labels]):
        rprint("[red]Error: At least one update option must be provided[/red]")
        raise typer.Exit(1)

    try:
        with get_client() as client:
            issue_service = IssueService(client)
            
            if summary:
                issue_service.update_issue_summary(key, summary)
                rprint(f"[green]✓ Updated summary for {key}[/green]")
            
            if add_labels:
                labels_to_add = [l.strip() for l in add_labels.split(",")]
                issue_service.add_labels_to_issue(key, labels_to_add)
                rprint(f"[green]✓ Added labels to {key}: {', '.join(labels_to_add)}[/green]")
            
            if remove_labels:
                labels_to_remove = [l.strip() for l in remove_labels.split(",")]
                issue_service.remove_labels_from_issue(key, labels_to_remove)
                rprint(f"[green]✓ Removed labels from {key}: {', '.join(labels_to_remove)}[/green]")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("assign")
def assign_issue(
    key: str = typer.Argument(..., help="Issue key (e.g., PROJ-123)"),
    email: str = typer.Argument(..., help="Assignee email address"),
) -> None:
    """Assign an issue to a user."""
    try:
        with get_client() as client:
            issue_service = IssueService(client)
            issue_service.assign_issue_by_email(key, email)

        rprint(f"[green]✓ Assigned {key} to {email}[/green]")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("transitions")
def get_issue_transitions(
    key: str = typer.Argument(..., help="Issue key (e.g., PROJ-123)"),
) -> None:
    """List available transitions for an issue."""
    try:
        with get_client() as client:
            issue_service = IssueService(client)
            transitions = issue_service.get_available_transitions(key)

        if not transitions:
            rprint(f"[yellow]No transitions available for {key}[/yellow]")
            return

        table = Table(title=f"Available Transitions for {key}")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("To Status", style="yellow")

        for transition in transitions:
            table.add_row(transition.id, transition.name, transition.to.name)

        console.print(table)

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@issue_app.command("transition")
def transition_issue(
    key: str = typer.Argument(..., help="Issue key (e.g., PROJ-123)"),
    name: str = typer.Argument(..., help="Transition name"),
    comment: Optional[str] = typer.Option(None, "--comment", "-c", help="Transition comment"),
    resolution: Optional[str] = typer.Option(None, "--resolution", "-r", help="Resolution name"),
) -> None:
    """Transition an issue to a new status."""
    try:
        with get_client() as client:
            issue_service = IssueService(client)
            issue_service.transition_issue_by_name(key, name, comment, resolution)

        rprint(f"[green]✓ Transitioned {key} using '{name}'[/green]")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


# User Commands

@user_app.command("search")
def search_users(
    query: str = typer.Argument(..., help="Search query"),
    max_results: int = typer.Option(50, "--max", "-m", help="Maximum results"),
) -> None:
    """Search for users."""
    try:
        with get_client() as client:
            user_service = UserService(client)
            users = user_service.search_users(query, max_results)

        if not users:
            rprint(f"[yellow]No users found matching '{query}'[/yellow]")
            return

        _display_users_table(users, f"Users matching '{query}'")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@user_app.command("get")
def get_user(
    identifier: str = typer.Argument(..., help="User account ID or email"),
) -> None:
    """Get details of a specific user."""
    try:
        with get_client() as client:
            user_service = UserService(client)
            user = user_service.get_user_by_identifier(identifier)

        if not user:
            rprint(f"[yellow]User '{identifier}' not found[/yellow]")
            return

        _display_users_table([user], f"User Details: {identifier}")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


# Project Commands

@project_app.command("get")
def get_project(
    key: str = typer.Argument(..., help="Project key"),
    versions: bool = typer.Option(False, "--versions", help="Show project versions"),
) -> None:
    """Get details of a project."""
    try:
        with get_client() as client:
            project_service = ProjectService(client)
            project = project_service.get_project(key)

        _display_project_table(project)

        if versions:
            project_versions = project_service.get_project_versions(key)
            if project_versions:
                rprint("\n")
                _display_versions_table(project_versions, f"Versions for {key}")
            else:
                rprint(f"[yellow]No versions found for project {key}[/yellow]")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


@project_app.command("create-version")
def create_version(
    project_key: str = typer.Argument(..., help="Project key"),
    name: str = typer.Argument(..., help="Version name"),
    description: Optional[str] = typer.Option(None, "--description", "-d", help="Version description"),
) -> None:
    """Create a new version for a project."""
    try:
        with get_client() as client:
            project_service = ProjectService(client)
            version = project_service.create_version(project_key, name, description)

        rprint(f"[green]✓ Version '{name}' created for project {project_key}[/green]")
        _display_versions_table([version], f"Created Version")

    except JiraAPIError as e:
        rprint(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


# Helper functions for displaying data

def _display_issue_table(issue) -> None:
    """Display issue information in a formatted table."""
    table = Table(title=f"Issue: {issue.key}")
    table.add_column("Field", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Key", issue.key)
    table.add_row("Summary", issue.fields.summary)
    table.add_row("Status", issue.fields.status.name)
    table.add_row("Type", issue.fields.issue_type.name)
    table.add_row("Project", f"{issue.fields.project.name} ({issue.fields.project.key})")
    
    if issue.fields.assignee:
        table.add_row("Assignee", issue.fields.assignee.display_name)
    else:
        table.add_row("Assignee", "Unassigned")
    
    if issue.fields.reporter:
        table.add_row("Reporter", issue.fields.reporter.display_name)
    
    if issue.fields.priority:
        table.add_row("Priority", issue.fields.priority.name)
    
    if issue.fields.labels:
        table.add_row("Labels", ", ".join(issue.fields.labels))
    
    if issue.fields.created:
        table.add_row("Created", issue.fields.created.strftime("%Y-%m-%d %H:%M:%S"))
    
    if issue.fields.updated:
        table.add_row("Updated", issue.fields.updated.strftime("%Y-%m-%d %H:%M:%S"))

    console.print(table)


def _display_users_table(users: List, title: str) -> None:
    """Display users information in a formatted table."""
    table = Table(title=title)
    table.add_column("Display Name", style="green")
    table.add_column("Email", style="cyan")
    table.add_column("Account ID", style="yellow")
    table.add_column("Active", style="white")

    for user in users:
        table.add_row(
            user.display_name,
            user.email_address or "N/A",
            user.account_id,
            "✓" if user.active else "✗",
        )

    console.print(table)


def _display_project_table(project) -> None:
    """Display project information in a formatted table."""
    table = Table(title=f"Project: {project.key}")
    table.add_column("Field", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Key", project.key)
    table.add_row("Name", project.name)
    table.add_row("ID", project.id)
    
    if project.description:
        table.add_row("Description", project.description)
    
    table.add_row("Type", project.project_type_key)
    
    if project.lead:
        table.add_row("Lead", project.lead.get("displayName", "N/A"))

    console.print(table)


def _display_versions_table(versions: List, title: str) -> None:
    """Display versions information in a formatted table."""
    table = Table(title=title)
    table.add_column("Name", style="green")
    table.add_column("Released", style="cyan")
    table.add_column("Archived", style="yellow")
    table.add_column("Description", style="white")

    for version in versions:
        table.add_row(
            version.name,
            "✓" if version.released else "✗",
            "✓" if version.archived else "✗",
            version.description or "N/A",
        )

    console.print(table)


def main() -> None:
    """Main entry point for the CLI."""
    app()


if __name__ == "__main__":
    main()