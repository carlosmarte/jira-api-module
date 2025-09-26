# Installation

## Requirements

- Python 3.9 or higher
- A Jira Cloud instance
- Jira API token (not password)

## Install from PyPI

```bash
pip install jira-api
```

## Install from Source

```bash
# Clone the repository
git clone https://github.com/carlosmarte/jira-api-module.git
cd jira-api-module

# Install with Poetry (recommended)
poetry install

# Or install with pip
pip install -e .
```

## Verify Installation

```bash
# Check if CLI is available
jira-api --help

# Check package import
python -c "import jira_api; print(jira_api.__version__)"
```

## Development Installation

For contributing to the project:

```bash
# Clone and install in development mode
git clone https://github.com/carlosmarte/jira-api-module.git
cd jira-api-module

# Install with development dependencies
poetry install --with dev

# Install pre-commit hooks
poetry run pre-commit install
```

## Docker Installation

```bash
# Run the server in Docker
docker run -p 8000:8000 \
  -e JIRA_BASE_URL="https://company.atlassian.net" \
  -e JIRA_EMAIL="your-email@company.com" \
  -e JIRA_API_TOKEN="your-api-token" \
  jira-api-server
```

## Next Steps

After installation, proceed to [Configuration](configuration.md) to set up your Jira credentials.