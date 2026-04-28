# 爱盼迷网盘资源搜索

爱盼迷是一个基于 Nuxt 4 的资源聚合搜索平台，包含网盘资源搜索、用户投稿、后台审核、论坛/博客、Alist 源、视频在线播放等功能。

## 当前核心能力

- 多源网盘资源搜索，前台搜索继续使用现有来源配置。
- `/api/sources/1` 是站内统一搜索源：先查本地 `Resource`，再查 Elasticsearch 中已发布的 `UserResource`，合并去重后最多返回 100 条。
- 用户投稿只在审核通过后进入 Elasticsearch；待审核和已拒绝资源不会进入前台搜索。
- 后台 `用户资源` 页面用于人工审核和自动审核。
- 后台 `ES索引内容` 页面用于查看 Elasticsearch 中的已发布用户投稿索引，并支持重建索引。
- 用户在个人中心提交或编辑资源后，服务端会自动加入审核队列；每条结果都会发站内通知，邮件按用户邮箱限流发送。
- `/releases` 发布日志页面用于展示网站最近新增功能。
- GitHub Actions 自动构建 Docker 镜像并部署到生产应用服务器。
- Elasticsearch 独立部署在单独 VPS，应用通过 HTTPS + Basic Auth + CA 指纹校验连接。

## 技术栈

- Nuxt 4 / Vue 3 / Element Plus / Tailwind CSS
- Nitro Server API
- PostgreSQL / Prisma
- Redis / Socket.IO
- Elasticsearch 8
- Docker / Docker Compose
- GitHub Actions

## 重要后台页面

- 登录：`/login`
- 管理后台：`/admin/dashboard`
- 网盘管理：`/admin/clouddrive`
- 用户资源审核：`/admin/user-resources`
- ES 索引内容：`/admin/search-index/user-resources`
- 发布日志：`/releases`

## 环境变量

本地开发从示例文件复制：

```bash
cp .env.example .env
```

必填项：

- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`

用户投稿搜索相关变量：

- `ELASTICSEARCH_NODE`
- `ELASTICSEARCH_USERNAME`
- `ELASTICSEARCH_PASSWORD`
- `ELASTICSEARCH_CA_FINGERPRINT`
- `ELASTICSEARCH_USER_RESOURCE_INDEX`

自动审核相关变量：

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

本地如果不需要调试 ES，可暂时留空 ES 变量；前台 `/api/sources/1` 会自动降级为只返回本地 `Resource` 结果。生产环境必须配置完整 ES 变量。

## 本地开发

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

默认开发端口由 `package.json` 控制为 `3001`。

## 生产部署

当前生产部署由 GitHub Actions 执行：

- 工作流：`.github/workflows/deploy.yml`
- 触发方式：push 到 `main` 或手动 `workflow_dispatch`
- 应用服务器：`209.54.106.114`
- 部署目录：`/www/wwwroot/aipan-docker`
- 应用容器：`aipan-netdisk-search-app`
- ES VPS：`66.103.211.214`
- ES 索引：`user-resources`

详细部署说明见 `README_DEPLOY.md`。ES VPS 单独部署说明见 `deploy/elasticsearch/README.md`。

## 用户投稿搜索链路

1. 用户提交或编辑资源后进入 `pending` 状态。
2. 服务端立即把单资源审核任务加入后台队列，不需要管理员手动点击“自动审核”。
3. 可自动通过的资源会变为 `published` 并同步 upsert 到 Elasticsearch，文档 id 为 `user-resource-<id>`。
4. 明确不合格的资源会自动变为 `rejected`；无法安全判断的资源保留 `pending` 进入人工审核。
5. 审核处理完成后会创建站内通知；邮箱服务可用时，同一用户同一邮箱默认 24 小时内最多发送一封审核结果邮件。
6. 前台 `/api/sources/1` 同时返回本地 `Resource` 和 ES 中的已发布 `UserResource`。
7. 如果出现索引漂移，可在 `/admin/search-index/user-resources` 执行重建索引。
8. 已经存在的历史待审核资源，可在 `/admin/user-resources` 点击“历史投稿入队”交给同一队列后台处理。

## 自动审核规则

自动审核有三条入口：用户提交/编辑资源后会自动进入队列；管理员可以在 `/admin/user-resources` 手动执行批量自动审核；历史待审核资源可以点击“历史投稿入队”交给后台队列处理。批量操作默认建议先执行“仅预检查”。

队列默认优先使用 Redis，Redis 不可用时降级为当前进程内队列。生产环境可以用 `USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY` 控制每个应用进程同时处理的审核数量，避免大量投稿同时触发数据库、ES 和链接检查压力。

当前自动审核会检查：

- 标题、描述、资源类型是否完整。
- 链接是否为空。
- 链接服务和域名是否在支持范围内。
- 是否和本地 `Resource` 或已发布/待审核 `UserResource` 重复。
- 可选检查分享链接是否可访问。

不确定可达性或无法安全判断的资源会跳过，保留人工审核；不会盲目自动通过。

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

## 更多文档

- Docker/生产部署：`README_DEPLOY.md`
- ES VPS 部署：`deploy/elasticsearch/README.md`
- Docker 本地说明：`README_DOCKER.md`
- 旧版迁移说明：`README_MIGRATE.md`
