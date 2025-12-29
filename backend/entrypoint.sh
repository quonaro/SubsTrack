#!/bin/bash
set -e

# Run migrations (if any - aerich might need config)
# For now, we rely on Tortoise.generate_schemas in main.py for initial setup on fresh DB

# Start the application
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
