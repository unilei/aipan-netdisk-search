#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查 docker-compose 是否存在
if ! command -v docker-compose &> /dev/null; then
    print_message "Error: docker-compose is not installed!" "${RED}"
    exit 1
fi

print_message "Starting update process..." "${GREEN}"

# 拉取最新的镜像
print_message "\nPulling latest Docker image..." "${YELLOW}"
docker pull unilei/aipan-netdisk-search:latest

# 停止当前运行的容器
print_message "\nStopping current containers..." "${YELLOW}"
docker-compose down

# 使用新镜像启动容器
print_message "\nStarting containers with new image..." "${YELLOW}"
docker-compose up -d

# 清理未使用的镜像
print_message "\nCleaning up old images..." "${YELLOW}"
docker image prune -f

# 显示运行状态
print_message "\nCurrent container status:" "${GREEN}"
docker-compose ps

print_message "\nUpdate completed successfully!" "${GREEN}"
print_message "To view logs, use: docker-compose logs -f" "${YELLOW}"
