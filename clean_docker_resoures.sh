#!/bin/bash

# aipan-netdisk-search-app Docker清理重启脚本
# 专门用于清理和重启aipan-netdisk-search-app容器
# 作者: 从deploy.sh提取
# 用途: 清理并重启aipan-netdisk-search-app容器

# 颜色设置
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
info() {
  echo -e "${GREEN}[信息]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

warn() {
  echo -e "${YELLOW}[警告]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

error() {
  echo -e "${RED}[错误]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

success() {
  echo -e "${BLUE}[成功]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# 检查环境变量文件
check_env_file() {
  if [ ! -f ".env" ]; then
    warn "未找到.env文件，请确保环境变量配置正确"
    return 1
  fi
  
  info "环境变量文件检查通过 ✓"
  return 0
}

# 检查Docker是否安装
check_docker() {
  if ! command -v docker &> /dev/null; then
    error "Docker未安装，请先安装Docker"
    exit 1
  fi
  
  if ! docker info &> /dev/null; then
    error "Docker服务未运行，请启动Docker服务"
    exit 1
  fi
  
  info "Docker检查通过 ✓"
}



# 安全检查和清理函数
security_scan_and_clean() {
  info "执行安全扫描和清理..."
  echo "==========================================="
  
  # 检查是否存在恶意文件
  info "检查恶意文件..."
  docker exec -it postgres bash -c "
    if [ -f /tmp/kinsing ]; then
      echo '发现恶意文件: /tmp/kinsing'
      rm -f /tmp/kinsing
      echo '已删除恶意文件'
    fi
    
    # 检查其他可疑文件
    find /tmp -name '*.sh' -o -name 'kinsing*' -o -name '*miner*' 2>/dev/null || true
  " || warn "无法连接到postgres容器进行安全检查"
  
  # 检查异常进程
  info "检查异常进程..."
  docker exec -it postgres bash -c "ps aux | grep -E 'kinsing|miner|crypto' | grep -v grep" || true
  
  success "安全扫描完成"
}

# 清理并重启aipan-netdisk-search-app容器
clean_and_restart_aipan_app() {
  info "开始清理并重启aipan-netdisk-search-app容器..."
  echo "==========================================="
  
  # 首先执行安全检查
  security_scan_and_clean
  
  local container_name="aipan-netdisk-search-app"
  
  # 停止所有相关服务
  if [ -f "docker-compose.yml" ]; then
    info "停止所有相关服务..."
    docker-compose down
  fi
  
  # 检查容器是否存在
  if docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
    info "停止容器: $container_name"
    docker stop "$container_name" > /dev/null 2>&1
    
    info "删除容器: $container_name"
    docker rm "$container_name" > /dev/null 2>&1
    
    success "容器 $container_name 已清理"
  else
    info "容器 $container_name 不存在，跳过清理"
  fi
  
  # 清理悬空镜像
  info "清理悬空镜像..."
  docker image prune -f > /dev/null 2>&1
  
  success "aipan-netdisk-search-app清理完成！"
  
  # 重新启动服务
  info "重新启动aipan-netdisk-search-app容器..."
  
  if [ -f "docker-compose.yml" ]; then
     info "使用docker-compose重新启动aipan-netdisk-search服务..."
     # 启动依赖服务
     docker-compose up -d postgres redis
     sleep 5  # 等待数据库启动
     
     # 运行数据库迁移
     docker-compose up prisma-migrate
     
     # 启动主应用
     docker-compose up -d aipan-netdisk-search
     
     if [ $? -eq 0 ]; then
       success "aipan-netdisk-search-app容器启动成功！"
       info "检查容器状态..."
       docker-compose ps
     else
       error "容器启动失败，请检查配置"
       exit 1
     fi
   else
     warn "未找到docker-compose.yml文件，请手动启动服务"
   fi
  
  echo "==========================================="
  info "操作完成！aipan-netdisk-search-app容器已重新启动"
}

# 主函数
main() {
  # 检查Docker
  check_docker
  
  # 检查环境变量
  check_env_file
  
  # 直接执行清理和重启
  clean_and_restart_aipan_app
}

# 执行主函数
main "$@"