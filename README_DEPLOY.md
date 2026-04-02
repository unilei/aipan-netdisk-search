# AIPan网盘搜索应用部署指南

本文档提供了如何在服务器上部署AIPan网盘搜索应用的简易指南，适合非技术人员使用。

## 前置条件

- 一台安装了Docker的服务器（Linux、Windows或macOS均可）
- 服务器上已安装Docker和Docker Compose
- 服务器开放了3000和3002端口

## 快速部署步骤

### 1. 下载部署脚本

将`deploy.sh`脚本下载到服务器上的任意目录。

### 2. 给脚本添加执行权限

```bash
chmod +x deploy.sh
```

### 3. 运行部署脚本

```bash
./deploy.sh
```

脚本会显示一个菜单，提供以下选项：

1. **完整部署**（首次部署或重新部署）
   - 检查Docker和Docker Compose是否已安装
   - 创建必要的配置文件
   - 生成随机管理员凭据
   - 拉取所需的Docker镜像
   - 启动所有服务

2. **更新配置**（仅修改配置并重启服务）
   - 编辑现有的`.env`文件
   - 重启服务以应用新配置

3. **退出**

### 4. 访问应用

部署完成后，您可以通过以下地址访问应用：
- Web应用: http://服务器IP:3000
- WebSocket: ws://服务器IP:3002

## 配置管理

### 首次部署

首次部署时，脚本会自动生成随机的管理员凭据（用户名、密码和JWT密钥）。这些凭据会显示在控制台中，并保存在`admin_credentials.txt`文件中。请妥善保管这些信息！

### 更新配置

如果您需要修改配置（例如更改管理员密码或其他设置），可以再次运行脚本并选择选项 2（更新配置）。脚本会帮助您编辑`.env`文件，并在编辑完成后自动重启服务以应用新配置。

主要配置项包括：
- 数据库用户名和密码
- 管理员账户信息
- JWT密钥（用于安全认证）
- GitHub配置
- Quark配置

## 常见操作

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 查看日志

```bash
docker-compose logs -f
```

### 更新到最新版本

```bash
docker pull unilei/aipan-netdisk-search:latest
docker-compose down
docker-compose up -d
```

## 常见问题

### 端口冲突

如果遇到端口冲突（3000或3002端口已被占用），请编辑`docker-compose.yml`文件，修改端口映射：

```yaml
ports:
  - "新端口:3000"  # 例如 "8080:3000"
  - "新端口:3002"  # 例如 "8082:3002"
```

### 数据库连接问题

如果应用无法连接到数据库，请检查`.env`文件中的数据库配置是否正确。

### 数据备份

数据存储在Docker卷中，如需备份，请使用以下命令：

```bash
docker volume ls  # 列出所有卷
docker volume inspect postgres-data  # 查看数据库卷的详细信息
```

## GitHub Actions 自动部署

仓库里已经补好了 `main` 分支的自动部署工作流：

- 推送到 `main` 后自动构建并推送 Docker 镜像到 Docker Hub
- 然后通过 SSH 登录 `209.54.106.114`
- 同步生产 compose、远端部署脚本和 `.env`
- 拉取新镜像，执行 Prisma 迁移，最后重启应用

### 需要配置的 GitHub Secrets

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
- `NUXT_PUBLIC_GITHUB_TOKEN`，可选
- `NUXT_PUBLIC_QUARK_COOKIE`，可选

### 可选的 GitHub Variables

- `APP_PORT`，默认 `3000`
- `WS_PORT`，默认 `3002`
- `DATABASE_SCHEMA`，默认 `public`
- `NUXT_PUBLIC_GITHUB_OWNER`
- `NUXT_PUBLIC_GITHUB_REPO`
- `NUXT_PUBLIC_GITHUB_BRANCH`，默认 `main`

### 生产部署文件

- 工作流：[`deploy.yml`](/Users/lei/workspace/aipan-netdisk-search/.github/workflows/deploy.yml)
- 生产 compose：[`docker-compose.prod.yml`](/Users/lei/workspace/aipan-netdisk-search/deploy/docker-compose.prod.yml)
- 远端部署脚本：[`remote-deploy.sh`](/Users/lei/workspace/aipan-netdisk-search/deploy/remote-deploy.sh)
- 环境模板：[`deploy/.env.production.example`](/Users/lei/workspace/aipan-netdisk-search/deploy/.env.production.example)

## 获取帮助

如有任何问题，请联系技术支持团队。
