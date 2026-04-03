#!/bin/sh
set -eu

DEPLOY_DIR="${DEPLOY_DIR:-/www/wwwroot/aipan-docker}"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_SOURCE_FILE="${DEPLOY_DIR}/.env.production"
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

mkdir -p "${DEPLOY_DIR}"

if [ -f "${ENV_SOURCE_FILE}" ]; then
  mv "${ENV_SOURCE_FILE}" "${ENV_FILE}"
fi

require_file "${COMPOSE_FILE}"
require_file "${ENV_FILE}"

# Keep the default compose filename in sync for manual server operations.
cp "${COMPOSE_FILE}" "${DEPLOY_DIR}/docker-compose.yml"

if [ -z "${DOCKERHUB_USERNAME:-}" ] || [ -z "${DOCKERHUB_TOKEN:-}" ]; then
  echo "DOCKERHUB_USERNAME and DOCKERHUB_TOKEN must be provided." >&2
  exit 1
fi

cd "${DEPLOY_DIR}"

echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin

compose pull "${APP_SERVICE_NAME}" prisma-migrate
compose up -d postgres redis
compose up --abort-on-container-exit --exit-code-from prisma-migrate prisma-migrate
compose up -d --remove-orphans "${APP_SERVICE_NAME}"
compose ps
