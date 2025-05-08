# Docker 多平台构建指南

本文档提供了如何构建支持多平台（AMD64 和 ARM64）的 Docker 镜像并将其上传到 Docker Hub 的详细指南。

## 前置条件

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 启用 Docker Buildx
- 拥有 Docker Hub 账户

## 构建和推送多平台镜像

我们提供了一个自动化脚本 `build-and-push.sh`，简化了多平台 Docker 镜像的构建和推送过程。

### 使用默认值

```bash
./build-and-push.sh
```

这将构建镜像 `unilei/aipan-netdisk-search:latest`

### 指定自定义镜像名称和标签

```bash
./build-and-push.sh yourusername/aipan-netdisk-search v1.0.0
```

这将构建镜像 `yourusername/aipan-netdisk-search:v1.0.0`

## 脚本功能

`build-and-push.sh` 脚本执行以下操作：

1. 检查网络连接和 Docker Hub 可用性
2. 确保您已登录 Docker Hub
3. 设置 Docker Buildx 环境
4. 同时构建 AMD64 和 ARM64 架构的镜像
5. 将镜像推送到 Docker Hub
6. 验证镜像是否成功上传

## 常见问题

### 验证失败

如果您看到类似以下的错误：

```
[WARN] 验证失败，等待 10 秒后重试... (尝试 1/3)
[WARN] 验证失败，等待 10 秒后重试... (尝试 2/3)
[WARN] 无法验证镜像是否成功上传，这可能是由于 API 限制或网络问题
```

这通常是由于以下原因导致的：

- Docker Hub API 的限制或临时服务中断
- 网络连接问题
- 镜像上传后需要一些时间才能在 API 中可见

即使验证失败，镜像仍然可能已成功上传。请手动检查 Docker Hub 上的镜像。

### Docker Hub 连接问题

如果您遇到 `ERROR: failed to authorize: failed to fetch oauth token: Post "https://auth.docker.io/token": Service Unavailable` 类似的错误，请尝试：

1. 检查您的网络连接
2. 访问 [Docker 状态页面](https://status.docker.com/) 查看是否有已知的服务中断
3. 重新登录 Docker Hub：
   ```bash
   docker logout
   docker login
   ```
4. 等待一段时间后重试

## 使用多平台镜像

成功构建和推送后，您的镜像将同时支持 AMD64 和 ARM64 架构。这意味着它可以在以下环境中运行：

- 基于 x86_64/AMD64 的服务器和桌面机
- 基于 ARM64 的设备，如 Apple Silicon Mac 和某些服务器

Docker 将自动选择适合当前平台的镜像变体。

## 本地开发

对于本地开发，您可以使用 `docker-compose.local.yml`：

```bash
docker-compose -f docker-compose.local.yml up -d
```

这将启动一个完整的开发环境，包括应用程序、PostgreSQL 和 Redis。
