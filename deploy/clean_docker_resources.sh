#!/bin/sh
set -eu

DEPLOY_DIR="${DEPLOY_DIR:-/www/wwwroot/aipan-docker}"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aipan-docker}"
APP_SERVICE_NAME="${APP_SERVICE_NAME:-aipan-netdisk-search}"

require_file() {
  if [ ! -f "$1" ]; then
    echo "Required file is missing: $1" >&2
    exit 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -p "${COMPOSE_PROJECT_NAME}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -p "${COMPOSE_PROJECT_NAME}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
    return
  fi

  echo "docker compose or docker-compose is required on the server." >&2
  exit 1
}

require_file "${COMPOSE_FILE}"
require_file "${ENV_FILE}"

cd "${DEPLOY_DIR}"

echo "[safe-cleanup] Ensuring ${APP_SERVICE_NAME} is running with the pinned image from ${ENV_FILE}"
compose up -d --no-deps "${APP_SERVICE_NAME}"
compose ps "${APP_SERVICE_NAME}"
