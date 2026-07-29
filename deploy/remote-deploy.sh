#!/bin/sh
set -eu

DEPLOY_DIR="${DEPLOY_DIR:-/www/wwwroot/aipan-docker}"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_SOURCE_FILE="${DEPLOY_DIR}/.env.production"
ENV_FILE="${DEPLOY_DIR}/.env"
ROLLBACK_ENV_FILE="${DEPLOY_DIR}/.env.rollback"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aipan-docker}"
APP_SERVICE_NAME="${APP_SERVICE_NAME:-aipan-netdisk-search}"
CANDIDATE_CONTAINER_NAME="${CANDIDATE_CONTAINER_NAME:-aipan-release-candidate}"
DEPLOY_HEALTH_TIMEOUT_SECONDS="${DEPLOY_HEALTH_TIMEOUT_SECONDS:-90}"
DEPLOY_HEALTH_POLL_SECONDS="${DEPLOY_HEALTH_POLL_SECONDS:-2}"

ROLLBACK_AVAILABLE=0
CUTOVER_STARTED=0
CUTOVER_VERIFIED=0

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

require_positive_integer() {
  case "$2" in
    ""|*[!0-9]*|0)
      echo "$1 must be a positive integer." >&2
      exit 1
      ;;
  esac
}

remove_candidate() {
  docker rm -f "${CANDIDATE_CONTAINER_NAME}" >/dev/null 2>&1 || true
}

service_container_id() {
  compose ps -q "$1" | tail -n 1
}

wait_for_application() {
  container_id="$1"
  label="$2"
  elapsed=0

  if [ -z "${container_id}" ]; then
    echo "${label} container was not created." >&2
    return 1
  fi

  while [ "${elapsed}" -lt "${DEPLOY_HEALTH_TIMEOUT_SECONDS}" ]; do
    container_status="$(docker inspect --format '{{.State.Status}}' "${container_id}" 2>/dev/null || true)"

    case "${container_status}" in
      exited|dead|removing)
        echo "${label} container stopped before becoming ready (${container_status})." >&2
        return 1
        ;;
      running)
        if docker exec "${container_id}" node -e \
          "fetch('http://127.0.0.1:3000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))" \
          >/dev/null 2>&1; then
          echo "${label} is ready."
          return 0
        fi
        ;;
    esac

    sleep "${DEPLOY_HEALTH_POLL_SECONDS}"
    elapsed=$((elapsed + DEPLOY_HEALTH_POLL_SECONDS))
  done

  echo "${label} did not become ready within ${DEPLOY_HEALTH_TIMEOUT_SECONDS}s." >&2
  return 1
}

restore_previous_env() {
  if [ "${ROLLBACK_AVAILABLE}" -ne 1 ]; then
    echo "No previous environment file is available for rollback." >&2
    return 1
  fi

  cp "${ROLLBACK_ENV_FILE}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
}

rollback_application() {
  echo "Deployment failed during application replacement; restoring the previous release." >&2

  if ! restore_previous_env; then
    return 1
  fi

  if ! compose up -d --no-deps "${APP_SERVICE_NAME}"; then
    echo "Rollback could not recreate ${APP_SERVICE_NAME}." >&2
    return 1
  fi

  rollback_container_id="$(service_container_id "${APP_SERVICE_NAME}")"
  if ! wait_for_application "${rollback_container_id}" "Rolled-back application"; then
    echo "Rollback container did not become healthy." >&2
    return 1
  fi

  echo "Previous release restored successfully." >&2
}

handle_exit() {
  status=$?
  trap - EXIT
  set +e
  remove_candidate

  if [ "${status}" -ne 0 ] && [ "${CUTOVER_VERIFIED}" -ne 1 ]; then
    if [ "${CUTOVER_STARTED}" -eq 1 ]; then
      rollback_application
    elif [ "${ROLLBACK_AVAILABLE}" -eq 1 ]; then
      restore_previous_env
    fi
  fi

  exit "${status}"
}

trap handle_exit EXIT
trap 'exit 1' HUP INT TERM

require_positive_integer "DEPLOY_HEALTH_TIMEOUT_SECONDS" "${DEPLOY_HEALTH_TIMEOUT_SECONDS}"
require_positive_integer "DEPLOY_HEALTH_POLL_SECONDS" "${DEPLOY_HEALTH_POLL_SECONDS}"

mkdir -p "${DEPLOY_DIR}"

if [ -f "${ENV_SOURCE_FILE}" ]; then
  if [ -f "${ENV_FILE}" ]; then
    cp "${ENV_FILE}" "${ROLLBACK_ENV_FILE}"
    chmod 600 "${ROLLBACK_ENV_FILE}"
    ROLLBACK_AVAILABLE=1
  fi

  mv "${ENV_SOURCE_FILE}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
fi

require_file "${COMPOSE_FILE}"
require_file "${ENV_FILE}"
if [ -f "${DEPLOY_DIR}/clean_docker_resources.sh" ]; then
  chmod +x "${DEPLOY_DIR}/clean_docker_resources.sh"
fi

# Keep the default compose filename in sync for manual server operations.
cp "${COMPOSE_FILE}" "${DEPLOY_DIR}/docker-compose.yml"

if [ -z "${DOCKERHUB_USERNAME:-}" ] || [ -z "${DOCKERHUB_TOKEN:-}" ]; then
  echo "DOCKERHUB_USERNAME and DOCKERHUB_TOKEN must be provided." >&2
  exit 1
fi

cd "${DEPLOY_DIR}"

echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin

compose pull "${APP_SERVICE_NAME}" prisma-migrate postgres-backup
compose up -d postgres redis
compose up --abort-on-container-exit --exit-code-from prisma-migrate prisma-migrate

# Boot the release without host ports first. A broken image is rejected while the
# current application is still serving traffic.
remove_candidate
compose run -d --no-deps \
  --name "${CANDIDATE_CONTAINER_NAME}" \
  -e TVBOX_SYNC_ENABLED=false \
  -e USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED=false \
  "${APP_SERVICE_NAME}" >/dev/null
wait_for_application "${CANDIDATE_CONTAINER_NAME}" "Release candidate"
remove_candidate

# Compose cannot keep two containers bound to the same host ports. Keep the
# unavoidable replacement window focused on the application, then verify it
# before starting ancillary services.
CUTOVER_STARTED=1
compose up -d --no-deps "${APP_SERVICE_NAME}"
app_container_id="$(service_container_id "${APP_SERVICE_NAME}")"
wait_for_application "${app_container_id}" "Application"
CUTOVER_VERIFIED=1

compose up -d --no-deps postgres-backup
compose ps
