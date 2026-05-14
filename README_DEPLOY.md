# 生产部署指南

本文档描述当前项目最新生产部署方式。应用服务部署在应用机，Elasticsearch 单独部署在另一台 VPS，二者不在同一个 compose 内。

## 生产架构

- 应用服务器：通过 GitHub Actions Secret `DEPLOY_SERVER_HOST` 配置
- 应用部署目录：`/www/wwwroot/aipan-docker`
- Compose project：`aipan-docker`
- 应用服务名：`aipan-netdisk-search`
- 应用容器名：`aipan-netdisk-search-app`
- PostgreSQL/Redis：随应用服务器 compose 启动
- PostgreSQL 备份：`postgres-backup` sidecar 每天定时上传到 Cloudflare R2，后台支持手动备份和下载
- Elasticsearch VPS：通过 GitHub Actions Secret `ELASTICSEARCH_NODE` 配置
- Elasticsearch 访问方式：`HTTPS + Basic Auth + CA fingerprint`
- Elasticsearch 端口：`9200`，只允许应用服务器出口 IP 访问
- 用户投稿索引：`user-resources`

## 部署方式

生产发布通过 GitHub Actions：

- 工作流：`.github/workflows/deploy.yml`
- push 到 `master` 自动部署
- 也支持在 GitHub Actions 页面手动运行 `workflow_dispatch`
- 应用镜像会推送到 Docker Hub，标签包含 `latest` 和 `sha-<commit>`
- 数据库备份镜像会推送到同一仓库，标签包含 `db-backup-latest` 和 `db-backup-sha-<commit>`
- 服务器会拉取新镜像、执行 Prisma migration，然后重启应用容器

相关文件：

- `.github/workflows/deploy.yml`
- `deploy/docker-compose.prod.yml`
- `deploy/remote-deploy.sh`
- `deploy/.env.production.example`
- `deploy/bootstrap-github-actions.sh`

## GitHub Actions Secrets

必填 Secrets：

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `DEPLOY_SSH_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_SERVER_HOST`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`
- `ELASTICSEARCH_NODE`
- `ELASTICSEARCH_USERNAME`
- `ELASTICSEARCH_PASSWORD`
- `R2_ACCOUNT_ID`，如果配置了 `R2_ENDPOINT` 可以不填
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

可选 Secrets：

- `NUXT_PUBLIC_GITHUB_TOKEN`
- `NUXT_PUBLIC_QUARK_COOKIE`

## GitHub Actions Variables

推荐配置 Variables：

- `APP_PORT`，默认 `3000`
- `WS_PORT`，默认 `3002`
- `DATABASE_SCHEMA`，默认 `public`
- `DB_BACKUP_ENABLED`，默认 `true`
- `DB_BACKUP_TIME`，默认 `03:00`
- `DB_BACKUP_RETENTION`，默认 `10`
- `DB_BACKUP_RUN_ON_STARTUP`，默认 `false`
- `R2_PREFIX`，默认 `aipan/postgres`
- `R2_ENDPOINT`，默认通过 `R2_ACCOUNT_ID` 生成 `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
- `ELASTICSEARCH_CA_FINGERPRINT`
- `ELASTICSEARCH_USER_RESOURCE_INDEX`，当前为 `user-resources`
- `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED`，默认 `true`
- `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS`，默认 `86400`
- `NUXT_PUBLIC_GITHUB_OWNER`
- `NUXT_PUBLIC_GITHUB_REPO`
- `NUXT_PUBLIC_GITHUB_BRANCH`，默认 `master`

可以用脚本从当前生产容器同步大部分 GitHub 配置：

```bash
SERVER_HOST=<APP_SERVER_HOST> ./deploy/bootstrap-github-actions.sh
```

脚本会读取生产容器环境变量，并写入 GitHub Secrets/Variables。它不会生成 ES 密码；ES 用户名、密码、节点地址和 CA 指纹需要生产环境中已经存在。

## 应用环境变量

生产 compose 使用 `deploy/.env.production.example` 作为模板。核心变量如下：

```bash
APP_IMAGE=unilei/aipan-netdisk-search:latest
DB_BACKUP_IMAGE=unilei/aipan-netdisk-search:db-backup-latest
APP_PORT=3000
WS_PORT=3002

POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=aipan
DATABASE_SCHEMA=public

ADMIN_USER=admin
ADMIN_PASSWORD=change-me
ADMIN_EMAIL=admin@example.com

JWT_SECRET=change-me
SETTINGS_ENCRYPTION_KEY=change-me
REDIS_URL=redis://redis:6379

DB_BACKUP_ENABLED=true
DB_BACKUP_TIME=03:00
DB_BACKUP_RETENTION=10
DB_BACKUP_RUN_ON_STARTUP=false
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET=<r2-bucket-name>
R2_PREFIX=aipan/postgres
R2_ENDPOINT=
TZ=Asia/Shanghai

ELASTICSEARCH_NODE=https://your-es-host:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=change-me
ELASTICSEARCH_CA_FINGERPRINT=AA:BB:CC:DD
ELASTICSEARCH_USER_RESOURCE_INDEX=user-resources

PANSOU_API_URLS=http://pansou:8888/api/search
PANSOU_CLOUD_TYPES=
PANSOU_RESULT_MODE=merge
PANSOU_SOURCE_MODE=all
PANSOU_REQUEST_TIMEOUT_MS=15000
PANSOU_MAX_RESULTS=300
```

注意：

- `SETTINGS_ENCRYPTION_KEY` 用于解密后台系统配置，已有生产环境必须复用原值。
- `JWT_SECRET` 变更会导致已有登录 token 失效。
- ES 变量不完整时，`/api/sources/1` 会降级为只返回本地 `Resource`，但审核同步和 ES 索引页面会不可用。
- `PANSOU_CLOUD_TYPES` 留空时不会向 PanSou 传 `cloud_types` 过滤条件，可返回 PanSou 服务端支持的全部链接类型。
- `PANSOU_API_URLS` 必须显式配置，建议指向自建 PanSou 实例。缺失时 `/api/sources/pansou` 会返回配置错误，生产 compose 也会拒绝启动。若 PanSou 独立运行，需要把 `pansou` 容器连接到应用 compose 网络，让应用容器可访问 `http://pansou:8888`。

## PostgreSQL R2 备份

生产 compose 会启动 `postgres-backup` sidecar 执行定时备份。应用容器也会安装 `pg_dump` 和 `aws` CLI，用同一套 R2 配置支持后台手动备份、备份列表和下载。

默认策略：

- 时间：每天 `03:00`，按容器 `TZ=Asia/Shanghai` 计算
- 保留：最新 `10` 份
- 路径：`aipan/postgres/<POSTGRES_DB>-YYYYMMDD-HHMMSS.sql.gz`
- 启动时不立即备份：`DB_BACKUP_RUN_ON_STARTUP=false`

后台入口：

- `/admin/database-backups`
- 支持立即备份、刷新备份记录、下载 `.sql.gz` 备份文件

命令行手动触发一次备份：

```bash
cd /www/wwwroot/aipan-docker
docker compose -p aipan-docker --env-file .env -f docker-compose.prod.yml run --rm postgres-backup --once
```

查看备份日志：

```bash
docker logs -f aipan-postgres-backup
```

R2 凭证需要使用 Cloudflare R2 API Token / Access Key，并授予目标 bucket 的对象读写权限。`R2_ENDPOINT` 可以留空；留空时脚本会用 `R2_ACCOUNT_ID` 自动生成 endpoint。

## Elasticsearch VPS

ES 不在应用服务器 compose 内启动。部署说明见 `deploy/elasticsearch/README.md`。

应用侧需要：

- `ELASTICSEARCH_NODE=https://<ELASTICSEARCH_HOST>:9200`
- `ELASTICSEARCH_USERNAME=elastic`
- `ELASTICSEARCH_PASSWORD=<ES 密码>`
- `ELASTICSEARCH_CA_FINGERPRINT=<HTTP CA SHA256 指纹>`
- `ELASTICSEARCH_USER_RESOURCE_INDEX=user-resources`

ES VPS 侧必须：

- 设置 `vm.max_map_count=262144`
- 使用 Elasticsearch 8 单节点 Docker Compose
- 开启 HTTPS
- `9200` 只对白名单应用服务器出口 IP 开放

## 用户投稿和搜索索引

后台页面：

- 用户资源审核：`/admin/user-resources`
- ES 索引内容：`/admin/search-index/user-resources`

行为规则：

- 用户投稿只索引 `status = published` 的 `UserResource`
- 待审核和已拒绝投稿不会进入 ES，也不会出现在前台搜索
- 审核通过会 upsert ES 文档
- 改回 `pending` 或 `rejected` 会删除 ES 文档
- ES 文档 id 固定为 `user-resource-<id>`
- ES 索引内容页支持查看和重建索引

前台搜索：

- 前台仍然请求 `POST /api/sources/1`
- 不新增独立搜索来源
- `/api/sources/1` 会先查本地 `Resource`，再查 ES 中已发布 `UserResource`
- 本地结果在前，用户投稿结果在后
- 同名和重复链接会合并去重
- 最多返回 100 条
- ES 故障时降级为本地结果

## 自动审核

入口：

- 用户个人中心提交或编辑资源后，服务端自动触发单资源审核
- 管理员后台 `/admin/user-resources` 可手动执行批量自动审核

自动审核支持：

- 仅预检查，不修改数据库
- 执行自动审核
- 可选检查分享链接可达性
- 可选自动拒绝不合格资源

当前检查条件：

- 标题、描述、资源类型完整
- 至少包含一个链接
- 链接服务和域名在支持范围内
- 不与本地 `Resource` 或现有 `UserResource` 重复
- 可选网络可达性检查

无法安全判断的资源会跳过，保留人工审核。自动处理完成后会创建站内通知；邮箱服务启用时，审核结果邮件按用户邮箱限流发送。

自动审核运行时变量：

```bash
USER_RESOURCE_AUTO_REVIEW_ENABLED=true
USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID=true
USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID=true
USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE=false
USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER=true
USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL=true
USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED=true
USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS=86400
USER_RESOURCE_AUTO_REVIEW_MAX_LINKS=5
USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED=true
USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE=auto
USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED=true
USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY=2
USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES=3
USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS=30000
USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS=2000
USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS=3600
```

说明：

- `USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE=false` 是默认值，避免网盘反爬导致大量投稿进入人工审核。
- 如果要强制检查分享页是否可访问，把它设为 `true`；无法确认可达性的资源会保留 `pending` 并通知用户进入人工审核。
- 邮件发送复用后台 `系统配置 -> 邮箱服务` 的 Resend 配置，未启用时只发送站内通知。
- `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS=86400` 表示同一用户、同一邮箱 24 小时内最多发送一封审核结果邮件；每条审核结果仍会创建站内通知。
- 自动审核队列默认 `auto` 模式：优先使用 `REDIS_URL` 指向的 Redis，Redis 不可用时降级为进程内队列。
- `USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY` 是每个应用进程的审核并发上限。PM2 cluster 有多个进程时，总并发约等于进程数乘以该值。
- 处理历史投稿时，进入 `/admin/user-resources` 点击“历史投稿入队”，系统会把现有 `pending` 资源加入同一队列。

## 常用生产验证

查看容器状态：

```bash
ssh root@<APP_SERVER_HOST>
cd /www/wwwroot/aipan-docker
docker compose -p aipan-docker --env-file .env -f docker-compose.prod.yml ps
```

查看应用镜像：

```bash
docker ps --filter name=aipan-netdisk-search-app --format '{{.Image}} {{.Status}}'
```

查看应用日志：

```bash
docker logs -f aipan-netdisk-search-app
```

验证 ES 健康状态：

```bash
curl --cacert ./http_ca.crt -u "elastic:<ES_PASSWORD>" https://<ELASTICSEARCH_HOST>:9200/_cluster/health
```

验证前台站内搜索：

```bash
curl -s http://127.0.0.1:3000/api/sources/1 \
  -H 'content-type: application/json' \
  -d '{"keyword":"测试关键词"}'
```

验证 PanSou 搜索源：

```bash
docker exec aipan-netdisk-search-app node -e "fetch('http://pansou:8888/api/health').then(r=>r.json()).then(console.log)"
curl -s http://127.0.0.1:3000/api/sources/pansou \
  -H 'host: aipan.me' \
  -H 'referer: https://aipan.me/search' \
  -H 'content-type: application/json' \
  -d '{"name":"测试关键词"}'
```

## 回滚

GitHub Actions 镜像会带 `sha-<commit>` 标签。如果需要回滚：

1. 在 Docker Hub 找到上一个可用镜像标签。
2. 修改服务器 `/www/wwwroot/aipan-docker/.env` 中的 `APP_IMAGE`。
3. 执行：

```bash
cd /www/wwwroot/aipan-docker
docker compose -p aipan-docker --env-file .env -f docker-compose.prod.yml up -d aipan-netdisk-search
```
