# 爱盼网盘资源搜索

爱盼网盘资源搜索是一个基于 Nuxt 4 的资源聚合搜索平台，提供网盘资源搜索、用户投稿、后台审核、论坛/博客、Alist 源、视频在线播放、发布日志和 Elasticsearch 索引管理等能力。

## 核心能力

- 多源网盘资源搜索，前台仍使用现有来源配置。
- `/api/sources/1` 是站内统一搜索源：先查本地 `Resource`，再查 Elasticsearch 中已发布的 `UserResource`，合并去重后最多返回 100 条。
- 用户投稿需要审核；只有 `published` 状态会同步到 Elasticsearch 并进入前台搜索。
- 后台支持用户资源审核、自动审核、历史投稿入队、ES 索引查看和重建。
- 审核结果会创建站内通知；邮件服务可用时，审核邮件按用户邮箱限流发送。
- GitHub Actions 自动构建 Docker 镜像并部署到生产服务器。
- Elasticsearch 独立部署在单独 VPS，应用通过 HTTPS、Basic Auth 和 CA 指纹校验连接。

## 技术栈

- Nuxt 4 / Vue 3 / Element Plus / Tailwind CSS
- Nitro Server API
- PostgreSQL / Prisma
- Redis / Socket.IO
- Elasticsearch 8
- Docker / Docker Compose
- GitHub Actions

## 重要页面

- 登录：`/login`
- 管理后台：`/admin/dashboard`
- 网盘管理：`/admin/clouddrive`
- 用户资源审核：`/admin/user-resources`
- ES 索引内容：`/admin/search-index/user-resources`
- 发布日志：`/releases`

## 本地开发

复制环境变量示例并补齐必填项：

```bash
cp .env.example .env
```

常用启动流程：

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

默认开发端口由 `package.json` 控制为 `3001`。

## 关键环境变量

基础必填：

- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`

用户投稿搜索和 Elasticsearch：

- `ELASTICSEARCH_NODE`
- `ELASTICSEARCH_USERNAME`
- `ELASTICSEARCH_PASSWORD`
- `ELASTICSEARCH_CA_FINGERPRINT`
- `ELASTICSEARCH_USER_RESOURCE_INDEX`

自动审核和通知：

- `USER_RESOURCE_AUTO_REVIEW_ENABLED`
- `USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID`
- `USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID`
- `USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE`
- `USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER`
- `USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL`
- `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED`
- `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS`
- `USER_RESOURCE_AUTO_REVIEW_MAX_LINKS`
- `USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED`
- `USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE`
- `USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED`
- `USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY`
- `USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES`
- `USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS`
- `USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS`
- `USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS`

本地如果不调试 ES，可以暂时留空 ES 变量；前台 `/api/sources/1` 会降级为只返回本地 `Resource` 结果。生产环境应配置完整 ES 变量。

## 生产部署

当前生产部署由 GitHub Actions 执行：

- 工作流：`.github/workflows/deploy.yml`
- 触发方式：push 到 `master` 或手动 `workflow_dispatch`
- 应用服务器：通过 GitHub Actions Secret `DEPLOY_SERVER_HOST` 配置
- 部署目录：`/www/wwwroot/aipan-docker`
- 应用容器：`aipan-netdisk-search-app`
- ES 节点：通过 GitHub Actions Secret `ELASTICSEARCH_NODE` 配置
- ES 索引：`user-resources`

部署说明见 `README_DEPLOY.md`。GitHub Actions 变量说明见 `deploy/GITHUB_ACTIONS_SETUP.md`。ES VPS 部署说明见 `deploy/elasticsearch/README.md`。

## 用户投稿搜索链路

1. 用户提交或编辑资源后进入 `pending` 状态。
2. 服务端把单资源审核任务加入后台队列。
3. 可自动通过的资源会变为 `published` 并同步 upsert 到 Elasticsearch，文档 id 为 `user-resource-<id>`。
4. 明确不合格的资源会自动变为 `rejected`；无法安全判断的资源保留 `pending` 进入人工审核。
5. 审核完成后创建站内通知；邮箱服务可用时，同一用户同一邮箱默认 24 小时内最多发送一封审核结果邮件。
6. 前台 `/api/sources/1` 同时返回本地 `Resource` 和 ES 中的已发布 `UserResource`。
7. 如果索引漂移，可在 `/admin/search-index/user-resources` 执行重建索引。

## 关键 API

- 前台站内搜索：`POST /api/sources/1`
- 用户投稿列表：`GET /api/admin/user-resources/get`
- 更新投稿状态：`PUT /api/admin/user-resources/[id]/status`
- 自动审核：`POST /api/admin/user-resources/auto-review`
- 历史待审核入队：`POST /api/admin/user-resources/auto-review/enqueue`
- 查看 ES 索引内容：`GET /api/admin/user-resources/search`
- 重建 ES 索引：`POST /api/admin/user-resources/search/reindex`

## 验证命令

```bash
npm run build
node --test tests/search/source1Results.test.mjs tests/search/userResourceSearchIndex.test.mjs tests/userResources/autoReview.test.mjs tests/userResources/autoReviewQueue.test.mjs tests/releases/releaseNotes.test.mjs
```
