# 生产部署指南

本文档描述当前项目最新生产部署方式。应用服务部署在应用机，Elasticsearch 单独部署在另一台 VPS，二者不在同一个 compose 内。

## 生产架构

- 应用服务器：`209.54.106.114`
- 应用部署目录：`/www/wwwroot/aipan-docker`
- Compose project：`aipan-docker`
- 应用服务名：`aipan-netdisk-search`
- 应用容器名：`aipan-netdisk-search-app`
- PostgreSQL/Redis：随应用服务器 compose 启动
- Elasticsearch VPS：`66.103.211.214`
- Elasticsearch 访问方式：`HTTPS + Basic Auth + CA fingerprint`
- Elasticsearch 端口：`9200`，只允许应用服务器 IP `209.54.106.114` 访问
- 用户投稿索引：`user-resources`

## 部署方式

生产发布通过 GitHub Actions：

- 工作流：`.github/workflows/deploy.yml`
- push 到 `main` 自动部署
- 也支持在 GitHub Actions 页面手动运行 `workflow_dispatch`
- 镜像会推送到 Docker Hub，标签包含 `latest` 和 `sha-<commit>`
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
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`
- `ELASTICSEARCH_USERNAME`
- `ELASTICSEARCH_PASSWORD`

可选 Secrets：

- `NUXT_PUBLIC_GITHUB_TOKEN`
- `NUXT_PUBLIC_QUARK_COOKIE`

## GitHub Actions Variables

推荐配置 Variables：

- `APP_PORT`，默认 `3000`
- `WS_PORT`，默认 `3002`
- `DATABASE_SCHEMA`，默认 `public`
- `ELASTICSEARCH_NODE`，生产值形如 `https://66.103.211.214:9200`
- `ELASTICSEARCH_CA_FINGERPRINT`
- `ELASTICSEARCH_USER_RESOURCE_INDEX`，当前为 `user-resources`
- `NUXT_PUBLIC_GITHUB_OWNER`
- `NUXT_PUBLIC_GITHUB_REPO`
- `NUXT_PUBLIC_GITHUB_BRANCH`，默认 `main`

可以用脚本从当前生产容器同步大部分 GitHub 配置：

```bash
./deploy/bootstrap-github-actions.sh
```

脚本会读取生产容器环境变量，并写入 GitHub Secrets/Variables。它不会生成 ES 密码；ES 用户名、密码、节点地址和 CA 指纹需要生产环境中已经存在。

## 应用环境变量

生产 compose 使用 `deploy/.env.production.example` 作为模板。核心变量如下：

```bash
APP_IMAGE=unilei/aipan-netdisk-search:latest
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

ELASTICSEARCH_NODE=https://your-es-host:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=change-me
ELASTICSEARCH_CA_FINGERPRINT=AA:BB:CC:DD
ELASTICSEARCH_USER_RESOURCE_INDEX=user-resources
```

注意：

- `SETTINGS_ENCRYPTION_KEY` 用于解密后台系统配置，已有生产环境必须复用原值。
- `JWT_SECRET` 变更会导致已有登录 token 失效。
- ES 变量不完整时，`/api/sources/1` 会降级为只返回本地 `Resource`，但审核同步和 ES 索引页面会不可用。

## Elasticsearch VPS

ES 不在应用服务器 compose 内启动。部署说明见 `deploy/elasticsearch/README.md`。

应用侧需要：

- `ELASTICSEARCH_NODE=https://66.103.211.214:9200`
- `ELASTICSEARCH_USERNAME=elastic`
- `ELASTICSEARCH_PASSWORD=<ES 密码>`
- `ELASTICSEARCH_CA_FINGERPRINT=<HTTP CA SHA256 指纹>`
- `ELASTICSEARCH_USER_RESOURCE_INDEX=user-resources`

ES VPS 侧必须：

- 设置 `vm.max_map_count=262144`
- 使用 Elasticsearch 8 单节点 Docker Compose
- 开启 HTTPS
- `9200` 只对白名单应用服务器 IP `209.54.106.114` 开放

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

无法安全判断的资源会跳过，保留人工审核。自动处理完成后会创建站内通知，并在邮箱服务启用时发送邮件。

自动审核运行时变量：

```bash
USER_RESOURCE_AUTO_REVIEW_ENABLED=true
USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID=true
USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID=true
USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE=false
USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER=true
USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL=true
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
- 自动审核队列默认 `auto` 模式：优先使用 `REDIS_URL` 指向的 Redis，Redis 不可用时降级为进程内队列。
- `USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY` 是每个应用进程的审核并发上限。PM2 cluster 有多个进程时，总并发约等于进程数乘以该值。
- 处理历史投稿时，进入 `/admin/user-resources` 点击“历史投稿入队”，系统会把现有 `pending` 资源加入同一队列。

## 常用生产验证

查看容器状态：

```bash
ssh root@209.54.106.114
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
curl --cacert ./http_ca.crt -u "elastic:<ES_PASSWORD>" https://66.103.211.214:9200/_cluster/health
```

验证前台站内搜索：

```bash
curl -s http://127.0.0.1:3000/api/sources/1 \
  -H 'content-type: application/json' \
  -d '{"keyword":"测试关键词"}'
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
