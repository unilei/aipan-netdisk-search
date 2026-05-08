#!/bin/sh
set -u

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*"
}

require_env() {
  name="$1"
  value="$(eval "printf '%s' \"\${$name:-}\"")"

  if [ -z "$value" ]; then
    log "Missing required environment variable: $name"
    return 1
  fi
}

wait_forever() {
  while :; do
    sleep 86400
  done
}

to_number() {
  value="$(printf '%s' "$1" | sed 's/^0*//')"
  if [ -z "$value" ]; then
    value="0"
  fi
  printf '%s' "$value"
}

validate_time() {
  case "${DB_BACKUP_TIME:-03:00}" in
    [0-2][0-9]:[0-5][0-9]) ;;
    *)
      log "DB_BACKUP_TIME must use HH:MM format, got: ${DB_BACKUP_TIME:-}"
      return 1
      ;;
  esac

  hour="$(to_number "${DB_BACKUP_TIME%:*}")"
  if [ "$hour" -gt 23 ]; then
    log "DB_BACKUP_TIME hour must be between 00 and 23, got: ${DB_BACKUP_TIME}"
    return 1
  fi
}

validate_config() {
  DB_BACKUP_TIME="${DB_BACKUP_TIME:-03:00}"
  DB_BACKUP_RETENTION="${DB_BACKUP_RETENTION:-10}"
  DB_BACKUP_RUN_ON_STARTUP="${DB_BACKUP_RUN_ON_STARTUP:-false}"
  POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
  POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  R2_PREFIX="${R2_PREFIX:-aipan/postgres}"
  AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"

  validate_time || return 1

  case "$DB_BACKUP_RETENTION" in
    ''|*[!0-9]*)
      log "DB_BACKUP_RETENTION must be a positive integer, got: $DB_BACKUP_RETENTION"
      return 1
      ;;
  esac

  if [ "$DB_BACKUP_RETENTION" -lt 1 ]; then
    log "DB_BACKUP_RETENTION must be at least 1"
    return 1
  fi

  require_env POSTGRES_USER || return 1
  require_env POSTGRES_PASSWORD || return 1
  require_env POSTGRES_DB || return 1
  require_env R2_ACCESS_KEY_ID || return 1
  require_env R2_SECRET_ACCESS_KEY || return 1
  require_env R2_BUCKET || return 1

  if [ -z "${R2_ENDPOINT:-}" ]; then
    require_env R2_ACCOUNT_ID || return 1
    R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
  fi
}

normalized_prefix() {
  prefix="${R2_PREFIX#/}"
  while [ "${prefix%/}" != "$prefix" ]; do
    prefix="${prefix%/}"
  done
  printf '%s' "$prefix"
}

aws_r2() {
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" \
    aws --endpoint-url "$R2_ENDPOINT" "$@"
}

create_dump() {
  output_path="$1"
  sql_path="${output_path%.gz}"

  log "Creating PostgreSQL dump for database ${POSTGRES_DB}"
  if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-owner \
    --no-acl \
    > "$sql_path"; then
    log "pg_dump failed"
    return 1
  fi

  if ! gzip -f "$sql_path"; then
    log "gzip compression failed"
    return 1
  fi
}

upload_dump() {
  dump_path="$1"
  object_key="$2"

  log "Uploading backup to s3://${R2_BUCKET}/${object_key}"
  if ! aws_r2 s3 cp "$dump_path" "s3://${R2_BUCKET}/${object_key}" --only-show-errors; then
    log "R2 upload failed"
    return 1
  fi
}

prune_old_backups() {
  prefix="$(normalized_prefix)"
  error_file="$(mktemp "${TMPDIR:-/tmp}/aipan-db-backup-list-error.XXXXXX")"
  list_output="$(aws_r2 s3api list-objects-v2 \
    --bucket "$R2_BUCKET" \
    --prefix "${prefix}/" \
    --query 'sort_by(Contents,&LastModified)[].Key' \
    --output text 2>"$error_file")"

  list_status=$?
  if [ "$list_status" -ne 0 ]; then
    log "Could not list R2 backups for retention cleanup"
    cat "$error_file" >&2
    rm -f "$error_file"
    return 1
  fi
  rm -f "$error_file"

  backup_count=0
  backup_keys_file="$(mktemp "${TMPDIR:-/tmp}/aipan-db-backup-keys.XXXXXX")"
  printf '%s\n' "$list_output" | tr '\t' '\n' | while IFS= read -r key; do
    case "$key" in
      "${prefix}"/*.sql.gz)
        printf '%s\n' "$key"
        ;;
    esac
  done > "$backup_keys_file"

  backup_count="$(wc -l < "$backup_keys_file" | tr -d ' ')"
  delete_count=$((backup_count - DB_BACKUP_RETENTION))

  if [ "$delete_count" -le 0 ]; then
    rm -f "$backup_keys_file"
    log "Retention cleanup skipped; ${backup_count} backup(s), keeping ${DB_BACKUP_RETENTION}"
    return 0
  fi

  log "Deleting ${delete_count} old backup(s); keeping ${DB_BACKUP_RETENTION}"
  deleted=0
  while IFS= read -r key; do
    if [ -z "$key" ]; then
      continue
    fi

    if [ "$deleted" -ge "$delete_count" ]; then
      break
    fi

    if ! aws_r2 s3api delete-object --bucket "$R2_BUCKET" --key "$key" >/dev/null; then
      rm -f "$backup_keys_file"
      log "Failed to delete old backup: $key"
      return 1
    fi

    deleted=$((deleted + 1))
    log "Deleted old backup: $key"
  done < "$backup_keys_file"

  rm -f "$backup_keys_file"
}

run_backup_once() {
  timestamp="$(date '+%Y%m%d-%H%M%S')"
  prefix="$(normalized_prefix)"
  object_key="${prefix}/${POSTGRES_DB}-${timestamp}.sql.gz"
  temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/aipan-db-backup.XXXXXX")"
  dump_path="${temp_dir}/${POSTGRES_DB}-${timestamp}.sql.gz"

  trap 'rm -rf "$temp_dir"' EXIT INT TERM

  if ! create_dump "$dump_path"; then
    rm -rf "$temp_dir"
    trap - EXIT INT TERM
    return 1
  fi

  if ! upload_dump "$dump_path" "$object_key"; then
    rm -rf "$temp_dir"
    trap - EXIT INT TERM
    return 1
  fi

  if ! prune_old_backups; then
    rm -rf "$temp_dir"
    trap - EXIT INT TERM
    return 1
  fi

  rm -rf "$temp_dir"
  trap - EXIT INT TERM
  log "Database backup finished: ${object_key}"
}

seconds_until_next_run() {
  hour="$(to_number "${DB_BACKUP_TIME%:*}")"
  minute="$(to_number "${DB_BACKUP_TIME#*:}")"
  target_seconds=$((hour * 3600 + minute * 60))

  now_hour="$(to_number "$(date '+%H')")"
  now_minute="$(to_number "$(date '+%M')")"
  now_second="$(to_number "$(date '+%S')")"
  now_seconds=$((now_hour * 3600 + now_minute * 60 + now_second))

  if [ "$target_seconds" -le "$now_seconds" ]; then
    printf '%s' $((86400 - now_seconds + target_seconds))
    return
  fi

  printf '%s' $((target_seconds - now_seconds))
}

main() {
  case "${1:-}" in
    --help|-h)
      printf '%s\n' "Usage: aipan-db-backup [--once]"
      exit 0
      ;;
  esac

  if [ "${DB_BACKUP_ENABLED:-true}" = "false" ]; then
    log "Database backup service is disabled by DB_BACKUP_ENABLED=false"
    wait_forever
  fi

  validate_config || exit 1

  case "${1:-}" in
    --once)
      run_backup_once
      exit $?
      ;;
    "")
      ;;
    *)
      log "Unknown argument: $1"
      exit 1
      ;;
  esac

  if [ "$DB_BACKUP_RUN_ON_STARTUP" = "true" ]; then
    run_backup_once || log "Startup database backup failed; waiting for next scheduled run"
  fi

  while :; do
    sleep_seconds="$(seconds_until_next_run)"
    log "Next database backup in ${sleep_seconds}s at ${DB_BACKUP_TIME}"
    sleep "$sleep_seconds"
    run_backup_once || log "Scheduled database backup failed; waiting for next scheduled run"
  done
}

main "$@"
