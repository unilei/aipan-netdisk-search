# GitHub Actions 部署变量配置指南

本文档对应以下自动部署工作流：

- [`deploy.yml`](/Users/lei/workspace/aipan-netdisk-search/.github/workflows/deploy.yml)

工作流触发条件：

- push 到 `main`
- 手动运行 `workflow_dispatch`

部署目标：

- 服务器：`209.54.106.114`
- 部署目录：`/www/wwwroot/aipan-docker`
- Compose project：`aipan-docker`
- 应用服务名：`aipan-netdisk-search`

## 一、必填 Secrets

### 1. `DOCKERHUB_USERNAME`

用途：

- GitHub Actions 登录 Docker Hub
- 作为镜像命名空间，最终镜像名会是 `DOCKERHUB_USERNAME/aipan-netdisk-search`

如何获取：

- 登录 Docker Hub
- 右上角头像 -> `Account Settings`
- 你的用户名就是这个值

注意：

- Docker Hub 上需要存在仓库 `你的用户名/aipan-netdisk-search`
- 如果你想用别的镜像仓库名，需要改 [`deploy.yml`](/Users/lei/workspace/aipan-netdisk-search/.github/workflows/deploy.yml)

### 2. `DOCKERHUB_TOKEN`

用途：

- GitHub Actions 推送镜像到 Docker Hub
- 服务器拉取私有或受限镜像时登录 Docker Hub

如何获取：

1. 登录 Docker Hub
2. 进入 `Account Settings`
3. 找到 `Personal access tokens`
4. 新建一个 token
5. 给它 `Read, Write, Delete` 或至少可推拉镜像的权限

### 3. `DEPLOY_SSH_USER`

用途：

- GitHub Actions SSH 登录服务器时使用

如何获取：

- 就是服务器上的 Linux 用户名
- 推荐用专门部署用户，例如 `deploy`
- 如果你暂时不想折腾权限，也可以先用 `root`

要求：

- 这个用户能登录 `209.54.106.114`
- 这个用户能执行 Docker
- 这个用户对 `/www/wwwroot/aipan-docker` 有写权限

### 4. `DEPLOY_SSH_KEY`

用途：

- GitHub Actions 通过私钥 SSH 登录服务器

如何获取：

1. 在你的本地电脑生成一对 key

```bash
ssh-keygen -t ed25519 -C "github-actions-aipan" -f ~/.ssh/aipan_github_actions
```

2. 公钥内容查看：

```bash
cat ~/.ssh/aipan_github_actions.pub
```

3. 把公钥追加到服务器目标用户的 `authorized_keys`

如果目标用户是 `deploy`：

```bash
ssh root@209.54.106.114
useradd -m -s /bin/bash deploy || true
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

然后把上面看到的公钥内容追加进 `/home/deploy/.ssh/authorized_keys`

4. 私钥内容查看：

```bash
cat ~/.ssh/aipan_github_actions
```

把这整段私钥内容保存到 GitHub Secret `DEPLOY_SSH_KEY`

### 5. `POSTGRES_USER`

用途：

- 生产 PostgreSQL 用户名

如何获取：

- 如果你服务器已经有现成部署，直接复用当前生产环境值
- 常见位置：
  - 服务器现有 `.env`
  - 旧的 Docker Compose 环境文件
  - `docker inspect aipan-postgres`

如果是新部署：

- 你自己定义一个，例如 `postgres`

### 6. `POSTGRES_PASSWORD`

用途：

- 生产 PostgreSQL 密码

如何获取：

- 如果是已有生产环境，必须和当前生产密码保持一致
- 如果是新部署，可新生成

生成方式：

```bash
openssl rand -base64 32
```

### 7. `POSTGRES_DB`

用途：

- 生产数据库名

如何获取：

- 如果已有生产环境，使用当前数据库名
- 如果新部署，可以用 `aipan`

### 8. `ADMIN_USER`

用途：

- 应用后台管理员用户名

如何获取：

- 如果已有生产环境，复用当前管理员用户名
- 如果新部署，自定义，例如 `admin`

### 9. `ADMIN_PASSWORD`

用途：

- 应用后台管理员密码

如何获取：

- 如果已有生产环境，复用当前密码
- 如果新部署，建议生成随机值

生成方式：

```bash
openssl rand -base64 24
```

### 10. `ADMIN_EMAIL`

用途：

- 管理员邮箱

如何获取：

- 使用你自己的邮箱，或当前生产环境已有值

### 11. `JWT_SECRET`

用途：

- 应用 JWT 签名密钥

如何获取：

- 如果已有生产环境，必须复用原值，否则所有旧 token 会失效
- 如果新部署，建议新生成

生成方式：

```bash
openssl rand -base64 48
```

### 12. `SETTINGS_ENCRYPTION_KEY`

用途：

- 加密数据库中保存的后台邮箱服务密钥
- 用于 Resend API Key 等敏感系统配置

如何获取：

- 如果已有生产环境，必须复用当前值，否则历史已保存的加密配置将无法解密
- 如果是新部署，建议生成一个新的随机值

生成方式：

```bash
openssl rand -base64 48
```

### 13. `ELASTICSEARCH_USERNAME`

用途：

- 应用连接独立 Elasticsearch VPS
- 当前通常为 `elastic`

如何获取：

- 使用 ES 首次启动时配置的用户
- 生产环境当前由 GitHub Secret 注入，不要写入仓库

### 14. `ELASTICSEARCH_PASSWORD`

用途：

- 应用连接独立 Elasticsearch VPS

如何获取：

- 使用 ES VPS 上 `.env` 中的 `ELASTIC_PASSWORD`
- 如果重置 ES 密码，需要同步更新这个 Secret

## 二、可选 Secrets

### 15. `NUXT_PUBLIC_GITHUB_TOKEN`

用途：

- 应用运行时访问 GitHub 仓库
- 通常用于图片仓库或资源写入

如何获取：

1. 登录 GitHub
2. 进入 `Settings`
3. 进入 `Developer settings`
4. 进入 `Personal access tokens`
5. 创建 Fine-grained token 或 classic token

建议权限：

- 对目标仓库至少有 `Contents: Read and write`

### 16. `NUXT_PUBLIC_QUARK_COOKIE`

用途：

- 应用使用夸克网盘相关功能时需要

如何获取：

1. 在浏览器登录夸克网盘
2. 打开开发者工具
3. 找到 `quark.cn` 或对应网盘域名的请求
4. 复制完整 `Cookie` 请求头

如果不用夸克相关功能：

- 可以留空

## 三、可选 Variables

### 1. `APP_PORT`

用途：

- 宿主机对外暴露的 Web 端口

默认值：

- `3000`

如何确定：

- 如果你没有 Nginx/Caddy 反代，通常保持 `3000`
- 如果你有反向代理，一般代理到 `3000`

### 2. `WS_PORT`

用途：

- 宿主机对外暴露的 WebSocket 端口

默认值：

- `3002`

如何确定：

- 保持默认即可，除非服务器端口冲突

### 3. `DATABASE_SCHEMA`

用途：

- PostgreSQL schema

默认值：

- `public`

如何确定：

- 看你当前 Prisma 连接串末尾是否带 `?schema=...`
- 大多数情况用 `public`

### 4. `ELASTICSEARCH_NODE`

用途：

- 应用连接独立 ES VPS 的 HTTPS 地址

当前生产值形如：

- `https://66.103.211.214:9200`

### 5. `ELASTICSEARCH_CA_FINGERPRINT`

用途：

- 应用使用官方 ES 客户端进行 TLS CA 指纹校验

如何获取：

```bash
openssl s_client -connect localhost:9200 -servername localhost -showcerts </dev/null 2>/dev/null \
  | openssl x509 -fingerprint -sha256 -noout -in /dev/stdin
```

### 6. `ELASTICSEARCH_USER_RESOURCE_INDEX`

用途：

- 已发布用户投稿写入的 ES 索引名

当前值：

- `user-resources`

### 7. `USER_RESOURCE_AUTO_REVIEW_ENABLED`

用途：

- 控制用户提交或编辑资源后是否自动触发审核

默认值：

- `true`

### 8. `USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE`

用途：

- 控制自动审核是否请求网盘分享页检查可达性

默认值：

- `false`

说明：

- 设为 `true` 时，无法确认可达性的资源会进入人工审核，不会自动通过。

### 9. `USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID`

用途：

- 控制明确不合格资源是否自动拒绝

默认值：

- `true`

### 10. `USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL`

用途：

- 控制自动审核完成后是否尝试发送邮件

默认值：

- `true`

说明：

- 邮件仍依赖后台邮箱服务配置；邮箱未启用时只发送站内通知。
- 邮件发送还会受 `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_*` 限流保护，避免同一用户同一邮箱被每条投稿重复发送邮件。

### 11. `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED`

用途：

- 控制用户资源审核结果邮件是否按用户邮箱限流

默认值：

- `true`

### 12. `USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS`

用途：

- 控制同一用户、同一邮箱两封审核结果邮件之间的最小间隔

默认值：

- `86400`

说明：

- 默认 24 小时内最多发送一封审核结果邮件；每条资源仍会创建站内通知。

### 13. `USER_RESOURCE_AUTO_REVIEW_MAX_LINKS`

用途：

- 控制单个用户投稿允许的最大链接数量

默认值：

- `5`

### 14. `NUXT_PUBLIC_GITHUB_OWNER`

用途：

- 应用运行时访问的 GitHub 仓库 owner

如何获取：

- 目标仓库 URL 的第一段
- 例如 `https://github.com/unilei-github/aipan-images`
- 则 owner 是 `unilei-github`

### 15. `NUXT_PUBLIC_GITHUB_REPO`

用途：

- 应用运行时访问的 GitHub 仓库名

如何获取：

- 目标仓库 URL 的第二段
- 例如 `https://github.com/unilei-github/aipan-images`
- 则 repo 是 `aipan-images`

### 16. `NUXT_PUBLIC_GITHUB_BRANCH`

用途：

- 应用运行时访问的 GitHub 分支

默认值：

- `main`

如何获取：

- 就是目标 GitHub 仓库的默认分支

## 四、服务器前置准备

如果服务器还没准备好，先执行这些：

```bash
ssh root@209.54.106.114
mkdir -p /www/wwwroot/aipan-docker
```

如果你使用 `deploy` 用户：

```bash
useradd -m -s /bin/bash deploy || true
usermod -aG docker deploy
mkdir -p /www/wwwroot/aipan-docker
chown -R deploy:deploy /www/wwwroot/aipan-docker
```

验证：

```bash
ssh deploy@209.54.106.114
docker --version
docker compose version
```

注意：

- 当前工作流默认 SSH 端口是 `22`
- 如果你的服务器不是 `22`，需要修改 [`deploy.yml`](/Users/lei/workspace/aipan-netdisk-search/.github/workflows/deploy.yml)

## 五、在 GitHub 里添加 Secrets 和 Variables

路径：

- GitHub 仓库 -> `Settings` -> `Secrets and variables` -> `Actions`

### 手工添加

- `New repository secret`
- `New repository variable`

### 用 GitHub CLI 添加

先登录：

```bash
gh auth login
```

添加 Secrets 示例：

```bash
gh secret set DOCKERHUB_USERNAME -b"你的DockerHub用户名"
gh secret set DOCKERHUB_TOKEN -b"你的DockerHubToken"
gh secret set DEPLOY_SSH_USER -b"deploy"
gh secret set DEPLOY_SSH_KEY < ~/.ssh/aipan_github_actions
gh secret set POSTGRES_USER -b"postgres"
gh secret set POSTGRES_PASSWORD -b"你的数据库密码"
gh secret set POSTGRES_DB -b"aipan"
gh secret set ADMIN_USER -b"admin"
gh secret set ADMIN_PASSWORD -b"你的管理员密码"
gh secret set ADMIN_EMAIL -b"你的邮箱"
gh secret set JWT_SECRET -b"你的JWT密钥"
gh secret set SETTINGS_ENCRYPTION_KEY -b"你的系统配置加密密钥"
gh secret set ELASTICSEARCH_USERNAME -b"elastic"
gh secret set ELASTICSEARCH_PASSWORD -b"你的ES密码"
```

可选 Secrets：

```bash
gh secret set NUXT_PUBLIC_GITHUB_TOKEN -b"你的GitHub运行时Token"
gh secret set NUXT_PUBLIC_QUARK_COOKIE -b"你的Quark Cookie"
```

添加 Variables 示例：

```bash
gh variable set APP_PORT -b"3000"
gh variable set WS_PORT -b"3002"
gh variable set DATABASE_SCHEMA -b"public"
gh variable set ELASTICSEARCH_NODE -b"https://66.103.211.214:9200"
gh variable set ELASTICSEARCH_CA_FINGERPRINT -b"你的ES HTTP CA SHA256指纹"
gh variable set ELASTICSEARCH_USER_RESOURCE_INDEX -b"user-resources"
gh variable set USER_RESOURCE_AUTO_REVIEW_ENABLED -b"true"
gh variable set USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID -b"true"
gh variable set USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE -b"false"
gh variable set USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID -b"true"
gh variable set USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER -b"true"
gh variable set USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL -b"true"
gh variable set USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED -b"true"
gh variable set USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS -b"86400"
gh variable set USER_RESOURCE_AUTO_REVIEW_MAX_LINKS -b"5"
gh variable set USER_RESOURCE_AUTO_REVIEW_QUEUE_ENABLED -b"true"
gh variable set USER_RESOURCE_AUTO_REVIEW_QUEUE_MODE -b"auto"
gh variable set USER_RESOURCE_AUTO_REVIEW_WORKER_ENABLED -b"true"
gh variable set USER_RESOURCE_AUTO_REVIEW_WORKER_CONCURRENCY -b"2"
gh variable set USER_RESOURCE_AUTO_REVIEW_QUEUE_MAX_RETRIES -b"3"
gh variable set USER_RESOURCE_AUTO_REVIEW_QUEUE_RETRY_DELAY_MS -b"30000"
gh variable set USER_RESOURCE_AUTO_REVIEW_QUEUE_POLL_INTERVAL_MS -b"2000"
gh variable set USER_RESOURCE_AUTO_REVIEW_QUEUE_DEDUPE_TTL_SECONDS -b"3600"
gh variable set NUXT_PUBLIC_GITHUB_OWNER -b"unilei-github"
gh variable set NUXT_PUBLIC_GITHUB_REPO -b"aipan-images"
gh variable set NUXT_PUBLIC_GITHUB_BRANCH -b"main"
```

如果当前生产容器已经有完整环境变量，也可以直接运行：

```bash
./deploy/bootstrap-github-actions.sh
```

脚本会从生产容器读取数据库、管理员、ES、GitHub 和 Quark 配置，并写入 GitHub Actions。

## 六、第一次发布流程

1. 配好 Docker Hub 仓库
2. 配好服务器 SSH 用户和密钥
3. 把 Secrets 和 Variables 全部填进 GitHub
4. 把代码合并或 push 到 `main`
5. 进入 GitHub `Actions` 页面查看 `Build And Deploy Production`
6. 等待 workflow 执行完成
7. 到服务器验证容器状态

```bash
ssh deploy@209.54.106.114
cd /www/wwwroot/aipan-docker
docker compose -p aipan-docker --env-file .env -f docker-compose.prod.yml ps
docker compose -p aipan-docker --env-file .env -f docker-compose.prod.yml logs -f aipan-netdisk-search
```

## 七、我建议你按这个顺序做

1. 先确认你要用的 Docker Hub 用户名
2. 再确认服务器登录用户是 `root` 还是 `deploy`
3. 再决定是复用现有生产数据库，还是新建一套
4. 最后一次性把 GitHub Secrets 和 Variables 配完

如果你愿意，我下一步可以继续直接给你一份“按你实际环境填写后的最终变量清单”。
