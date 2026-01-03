# Base stage
FROM python:3.12-slim as base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

# Install system dependencies
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    curl \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV UV_PROJECT_ENVIRONMENT=/venv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Development stage
FROM base as development
ENV DEV=true
# Copy the rest of the application for dev, though volumes usually override this
COPY . .
# Install project in dev mode
RUN uv sync --frozen
CMD ["uv", "run", "app/main.py"]

# Production stage
FROM base as production
# Copy the rest of the application
COPY . .

# Install project
RUN uv sync --frozen --no-dev

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


ENTRYPOINT ["/entrypoint.sh"]
