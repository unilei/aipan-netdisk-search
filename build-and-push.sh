#!/bin/bash
# 多平台 Docker 镜像构建和推送脚本
# 支持 amd64 和 arm64 架构

# 颜色设置
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示带颜色的消息
info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查网络连接
info "检查网络连接..."
if ! ping -c 1 -W 3 google.com > /dev/null 2>&1 && ! ping -c 1 -W 3 baidu.com > /dev/null 2>&1; then
  warn "网络连接可能有问题，请检查您的网络设置"
  warn "尝试继续构建，但可能会遇到连接问题"
  sleep 2
fi

# 检查 Docker Hub 连接
info "检查 Docker Hub 连接..."
if ! curl -s --connect-timeout 5 https://hub.docker.com > /dev/null; then
  warn "Docker Hub 网站似乎无法访问，可能是网络问题或服务中断"
  warn "您可以访问 https://status.docker.com/ 查看服务状态"
  warn "是否继续构建? (y/n)"
  read -r continue_build
  if [[ ! "$continue_build" =~ ^[Yy]$ ]]; then
    info "构建已取消"
    exit 0
  fi
fi

# 确保 Docker 已登录
info "检查 Docker 登录状态..."
if ! docker info | grep -q "Username"; then
  warn "您尚未登录 Docker Hub，请先登录"
  docker login
  if [ $? -ne 0 ]; then
    error "Docker 登录失败，退出构建"
    exit 1
  fi
fi

# 确保 Docker Buildx 可用
info "检查 Docker Buildx..."
if ! docker buildx version > /dev/null 2>&1; then
  error "Docker Buildx 不可用。请确保您使用的是 Docker Desktop 或已安装 Buildx 插件。"
  exit 1
fi

# 创建或使用 buildx builder
info "设置 buildx builder..."
if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
  info "创建新的 buildx builder: multiarch-builder"
  docker buildx create --name multiarch-builder --use
else
  info "使用现有的 buildx builder: multiarch-builder"
  docker buildx use multiarch-builder
fi

# 设置镜像名称和标签
IMAGE_NAME=${1:-"unilei/aipan-netdisk-search"}
TAG=${2:-"latest"}

info "开始构建多平台镜像: ${IMAGE_NAME}:${TAG}"
info "构建平台: linux/amd64, linux/arm64"

# 构建并推送多平台镜像
info "正在构建和推送镜像，这可能需要一些时间..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BUILDPLATFORM="linux/amd64" \
  --build-arg NODE_ENV="production" \
  --build-arg DATABASE_URL="postgresql://postgres:postgres@postgres:5432/aipan?schema=public" \
  -t ${IMAGE_NAME}:${TAG} \
  --push \
  .

# 检查构建结果
if [ $? -eq 0 ]; then
  info "构建和推送成功!"
  
  # 验证镜像是否成功上传
  info "验证镜像是否成功上传..."
  
  # 提取用户名部分
  USERNAME=$(echo "${IMAGE_NAME}" | cut -d'/' -f1)
  REPO=$(echo "${IMAGE_NAME}" | cut -d'/' -f2)
  
  # 使用 curl 访问 Docker Hub API
  info "正在检查 Docker Hub 上的镜像..."
  
  # 等待一些时间，给 Docker Hub 时间处理上传的镜像
  sleep 5
  
  # 尝试验证，最多重试 3 次
  max_retries=3
  retry_count=0
  verify_success=false
  
  while [ $retry_count -lt $max_retries ] && [ $verify_success == false ]; do
    # 使用 Docker Hub API 检查镜像
    if curl -s "https://hub.docker.com/v2/repositories/${USERNAME}/${REPO}/tags/${TAG}/" | grep -q "\"name\": \"${TAG}\""; then
      verify_success=true
      info "镜像验证成功! ${IMAGE_NAME}:${TAG} 已在 Docker Hub 上可用"
      
      # 尝试获取架构信息
      ARCH_INFO=$(curl -s "https://hub.docker.com/v2/repositories/${USERNAME}/${REPO}/tags/${TAG}/" | grep -o '"architecture":"[^"]*"\|"os":"[^"]*"')
      if [ ! -z "$ARCH_INFO" ]; then
        info "镜像架构信息:"
        echo "$ARCH_INFO"
      fi
    else
      retry_count=$((retry_count+1))
      if [ $retry_count -lt $max_retries ]; then
        warn "验证失败，等待 10 秒后重试... (尝试 $retry_count/$max_retries)"
        sleep 10
      fi
    fi
  done
  
  if [ $verify_success == false ]; then
    warn "无法验证镜像是否成功上传，这可能是由于 API 限制或网络问题"
    warn "镜像可能已成功上传，请手动检查 Docker Hub: https://hub.docker.com/r/${USERNAME}/${REPO}/tags"
  fi
  
  info "镜像 ${IMAGE_NAME}:${TAG} 现在支持 amd64 和 arm64 架构"
  info "您可以在 Docker Hub 上查看: https://hub.docker.com/r/${IMAGE_NAME}/tags"
else
  error "构建或推送过程中出现错误，请检查日志"
  exit 1
fi
