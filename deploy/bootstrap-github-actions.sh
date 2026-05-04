#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-unilei/aipan-netdisk-search}"
SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-root}"
APP_CONTAINER_NAME="${APP_CONTAINER_NAME:-aipan-netdisk-search-app}"
RUNTIME_GITHUB_OWNER="${RUNTIME_GITHUB_OWNER:-}"
RUNTIME_GITHUB_REPO="${RUNTIME_GITHUB_REPO:-}"
RUNTIME_GITHUB_BRANCH="${RUNTIME_GITHUB_BRANCH:-}"
APP_PORT_DEFAULT="${APP_PORT_DEFAULT:-3000}"
WS_PORT_DEFAULT="${WS_PORT_DEFAULT:-3002}"
DATABASE_SCHEMA_DEFAULT="${DATABASE_SCHEMA_DEFAULT:-public}"
SSH_KEY_PATH=""
SSH_OPTS=()

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command gh
require_command ssh

if [ -z "${SERVER_HOST}" ]; then
  echo "SERVER_HOST is required. Set it to the production server host before running this script." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login -h github.com" >&2
  exit 1
fi

REMOTE_DOCKER_ENV_CMD="docker inspect ${APP_CONTAINER_NAME} --format '{{range .Config.Env}}{{println .}}{{end}}'"

remote_env() {
  local key="$1"
  ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" "${REMOTE_DOCKER_ENV_CMD}" \
    | sed -n "s/^${key}=//p" \
    | tail -n 1
}

remote_port() {
  local container_port="$1"
  ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" "docker port ${APP_CONTAINER_NAME} ${container_port}/tcp 2>/dev/null" \
    | awk -F: 'NF {print $NF}' \
    | tail -n 1
}

set_secret_from_value() {
  local key="$1"
  local value="$2"

  if [ -z "${value}" ]; then
    echo "Skipping empty secret: ${key}" >&2
    return
  fi

  gh secret set "${key}" -R "${REPO}" -b"${value}"
  echo "Secret set: ${key}"
}

set_variable_from_value() {
  local key="$1"
  local value="$2"

  if [ -z "${value}" ]; then
    echo "Skipping empty variable: ${key}" >&2
    return
  fi

  gh variable set "${key}" -R "${REPO}" -b"${value}"
  echo "Variable set: ${key}"
}

read -r -p "Docker Hub username [unilei]: " DOCKERHUB_USERNAME
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-unilei}"

read -r -s -p "Docker Hub token: " DOCKERHUB_TOKEN
echo

read -r -p "SSH private key path [~/.ssh/aipan_github_actions]: " SSH_KEY_PATH
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/aipan_github_actions}"
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/${HOME}}"

if [ ! -f "${SSH_KEY_PATH}" ]; then
  echo "SSH private key file not found: ${SSH_KEY_PATH}" >&2
  exit 1
fi

SSH_OPTS=(-i "${SSH_KEY_PATH}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)

if ! ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" "echo connected" >/dev/null 2>&1; then
  echo "SSH login failed with key: ${SSH_KEY_PATH}" >&2
  echo "Verify that the key matches ${SERVER_USER}@${SERVER_HOST} and can log in manually." >&2
  exit 1
fi

APP_PORT="$(remote_port 3000 || true)"
WS_PORT="$(remote_port 3002 || true)"
DATABASE_SCHEMA="$(remote_env DATABASE_SCHEMA || true)"

POSTGRES_USER="$(remote_env POSTGRES_USER || true)"
POSTGRES_PASSWORD="$(remote_env POSTGRES_PASSWORD || true)"
POSTGRES_DB="$(remote_env POSTGRES_DB || true)"
ADMIN_USER="$(remote_env ADMIN_USER || true)"
ADMIN_PASSWORD="$(remote_env ADMIN_PASSWORD || true)"
ADMIN_EMAIL="$(remote_env ADMIN_EMAIL || true)"
JWT_SECRET="$(remote_env JWT_SECRET || true)"
SETTINGS_ENCRYPTION_KEY="$(remote_env SETTINGS_ENCRYPTION_KEY || true)"
ELASTICSEARCH_NODE="$(remote_env ELASTICSEARCH_NODE || true)"
ELASTICSEARCH_USERNAME="$(remote_env ELASTICSEARCH_USERNAME || true)"
ELASTICSEARCH_PASSWORD="$(remote_env ELASTICSEARCH_PASSWORD || true)"
ELASTICSEARCH_CA_FINGERPRINT="$(remote_env ELASTICSEARCH_CA_FINGERPRINT || true)"
ELASTICSEARCH_USER_RESOURCE_INDEX="$(remote_env ELASTICSEARCH_USER_RESOURCE_INDEX || true)"
USER_RESOURCE_AUTO_REVIEW_ENABLED="$(remote_env USER_RESOURCE_AUTO_REVIEW_ENABLED || true)"
USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID="$(remote_env USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID || true)"
USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID="$(remote_env USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID || true)"
USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE="$(remote_env USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE || true)"
USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER="$(remote_env USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER || true)"
USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL="$(remote_env USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL || true)"
USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED="$(remote_env USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED || true)"
USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS="$(remote_env USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS || true)"
USER_RESOURCE_AUTO_REVIEW_MAX_LINKS="$(remote_env USER_RESOURCE_AUTO_REVIEW_MAX_LINKS || true)"
USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED="$(remote_env USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED || true)"
USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE="$(remote_env USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE || true)"
USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED="$(remote_env USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED || true)"
USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY="$(remote_env USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY || true)"
USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES="$(remote_env USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES || true)"
USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS="$(remote_env USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS || true)"
USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS="$(remote_env USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS || true)"
USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS="$(remote_env USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS || true)"
CURRENT_GITHUB_OWNER="$(remote_env NUXT_PUBLIC_GITHUB_OWNER || true)"
CURRENT_GITHUB_REPO="$(remote_env NUXT_PUBLIC_GITHUB_REPO || true)"
CURRENT_GITHUB_BRANCH="$(remote_env NUXT_PUBLIC_GITHUB_BRANCH || true)"
NUXT_PUBLIC_GITHUB_TOKEN="$(remote_env NUXT_PUBLIC_GITHUB_TOKEN || true)"
NUXT_PUBLIC_QUARK_COOKIE="$(remote_env NUXT_PUBLIC_QUARK_COOKIE || true)"

APP_PORT="${APP_PORT:-${APP_PORT_DEFAULT}}"
WS_PORT="${WS_PORT:-${WS_PORT_DEFAULT}}"
DATABASE_SCHEMA="${DATABASE_SCHEMA:-${DATABASE_SCHEMA_DEFAULT}}"
RUNTIME_GITHUB_OWNER="${RUNTIME_GITHUB_OWNER:-${CURRENT_GITHUB_OWNER}}"
RUNTIME_GITHUB_REPO="${RUNTIME_GITHUB_REPO:-${CURRENT_GITHUB_REPO}}"
RUNTIME_GITHUB_BRANCH="${RUNTIME_GITHUB_BRANCH:-${CURRENT_GITHUB_BRANCH:-master}}"

set_secret_from_value "DOCKERHUB_USERNAME" "${DOCKERHUB_USERNAME}"
set_secret_from_value "DOCKERHUB_TOKEN" "${DOCKERHUB_TOKEN}"
set_secret_from_value "DEPLOY_SSH_USER" "${SERVER_USER}"
gh secret set "DEPLOY_SSH_KEY" -R "${REPO}" < "${SSH_KEY_PATH}"
echo "Secret set: DEPLOY_SSH_KEY"

set_secret_from_value "POSTGRES_USER" "${POSTGRES_USER}"
set_secret_from_value "POSTGRES_PASSWORD" "${POSTGRES_PASSWORD}"
set_secret_from_value "POSTGRES_DB" "${POSTGRES_DB}"
set_secret_from_value "ADMIN_USER" "${ADMIN_USER}"
set_secret_from_value "ADMIN_PASSWORD" "${ADMIN_PASSWORD}"
set_secret_from_value "ADMIN_EMAIL" "${ADMIN_EMAIL}"
set_secret_from_value "JWT_SECRET" "${JWT_SECRET}"
set_secret_from_value "SETTINGS_ENCRYPTION_KEY" "${SETTINGS_ENCRYPTION_KEY}"
set_secret_from_value "DEPLOY_SERVER_HOST" "${SERVER_HOST}"
set_secret_from_value "ELASTICSEARCH_NODE" "${ELASTICSEARCH_NODE}"
set_secret_from_value "ELASTICSEARCH_USERNAME" "${ELASTICSEARCH_USERNAME}"
set_secret_from_value "ELASTICSEARCH_PASSWORD" "${ELASTICSEARCH_PASSWORD}"
set_secret_from_value "NUXT_PUBLIC_GITHUB_TOKEN" "${NUXT_PUBLIC_GITHUB_TOKEN}"
set_secret_from_value "NUXT_PUBLIC_QUARK_COOKIE" "${NUXT_PUBLIC_QUARK_COOKIE}"

set_variable_from_value "APP_PORT" "${APP_PORT}"
set_variable_from_value "WS_PORT" "${WS_PORT}"
set_variable_from_value "DATABASE_SCHEMA" "${DATABASE_SCHEMA}"
set_variable_from_value "ELASTICSEARCH_CA_FINGERPRINT" "${ELASTICSEARCH_CA_FINGERPRINT}"
set_variable_from_value "ELASTICSEARCH_USER_RESOURCE_INDEX" "${ELASTICSEARCH_USER_RESOURCE_INDEX}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_ENABLED" "${USER_RESOURCE_AUTO_REVIEW_ENABLED}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID" "${USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID" "${USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE" "${USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER" "${USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL" "${USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL}"
set_variable_from_value "USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED" "${USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED}"
set_variable_from_value "USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS" "${USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_MAX_LINKS" "${USER_RESOURCE_AUTO_REVIEW_MAX_LINKS}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED" "${USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE" "${USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED" "${USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY" "${USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES" "${USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS" "${USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS" "${USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS}"
set_variable_from_value "USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS" "${USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS}"
set_variable_from_value "NUXT_PUBLIC_GITHUB_OWNER" "${RUNTIME_GITHUB_OWNER}"
set_variable_from_value "NUXT_PUBLIC_GITHUB_REPO" "${RUNTIME_GITHUB_REPO}"
set_variable_from_value "NUXT_PUBLIC_GITHUB_BRANCH" "${RUNTIME_GITHUB_BRANCH}"

echo
echo "GitHub Actions bootstrap finished for ${REPO}."
echo "Review the configured values in: Settings -> Secrets and variables -> Actions"
