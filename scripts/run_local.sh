#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export ENVIRONMENT="${ENVIRONMENT:-development}"
export ADMIN_TOKEN="${ADMIN_TOKEN:-local-admin-change-me}"
exec uvicorn app.main:app --host 127.0.0.1 --port "${PORT:-8000}" --reload
