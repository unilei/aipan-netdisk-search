#!/bin/bash
# 简易部署脚本 - 适用于从Docker Hub拉取镜像并部署到服务器
# 作者: Lei

# 颜色设置
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示带颜色的消息
info() {
  echo -e "${GREEN}[信息]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[警告]${NC} $1"
}

error() {
  echo -e "${RED}[错误]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
  info "检查Docker是否已安装..."
  if ! command -v docker &> /dev/null; then
    error "Docker未安装。请先安装Docker: https://docs.docker.com/get-docker/"
    exit 1
  fi
  info "Docker已安装 ✓"
  
  info "检查Docker Compose是否已安装..."
  if ! command -v docker-compose &> /dev/null; then
    warn "Docker Compose未安装，尝试使用Docker插件方式..."
    if ! docker compose version &> /dev/null; then
      error "Docker Compose未安装。请先安装Docker Compose: https://docs.docker.com/compose/install/"
      exit 1
    fi
    USE_DOCKER_PLUGIN=true
    info "使用Docker插件方式的Compose ✓"
  else
    USE_DOCKER_PLUGIN=false
    info "Docker Compose已安装 ✓"
  fi
}

# 生成随机字符串
generate_random_string() {
  length=$1
  min_length=$2
  
  # 如果没有指定最小长度，则设置为长度本身
  if [ -z "$min_length" ]; then
    min_length=$length
  fi
  
  # 确保最小长度不小于5
  if [ "$min_length" -lt 5 ]; then
    min_length=5
  fi
  
  # 设置语言环境为C，避免字节序列问题
  LC_ALL=C
  
  # 生成随机字符串，只使用安全的ASCII字符
  result=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c $length)
  
  # 验证生成的字符串长度
  actual_length=${#result}
  if [ "$actual_length" -lt "$min_length" ]; then
    # 如果长度不足，生成一个确定长度的字符串
    # 使用更可靠的方法
    result=""
    for i in $(seq 1 $length); do
      # 生成一个0-61的随机数
      rand=$(LC_ALL=C od -An -N1 -i /dev/urandom | tr -d ' ' | awk '{print $1 % 62}')
      
      # 根据随机数选择字符
      if [ $rand -lt 10 ]; then
        # 0-9
        char=$(($rand + 48))
        result="$result$(printf \\$(printf '%03o' $char))"
      elif [ $rand -lt 36 ]; then
        # A-Z
        char=$(($rand - 10 + 65))
        result="$result$(printf \\$(printf '%03o' $char))"
      else
        # a-z
        char=$(($rand - 36 + 97))
        result="$result$(printf \\$(printf '%03o' $char))"
      fi
    done
  fi
  
  echo "$result"
}

# 生成随机用户名
generate_random_username() {
  prefix="admin"
  suffix=$(generate_random_string 6 5)
  echo "${prefix}_${suffix}"
}

# 生成随机邮箱
generate_random_email() {
  username=$(generate_random_string 8 6)
  domains=("aipan.me")
  domain_index=$((RANDOM % ${#domains[@]}))
  domain=${domains[$domain_index]}
  echo "${username}@${domain}"
}

# 生成随机密码
generate_random_password() {
  length=16
  min_length=12
  generate_random_string $length $min_length
}

# 生成随机JWT密钥
generate_random_jwt_secret() {
  length=48
  min_length=32
  generate_random_string $length $min_length
}

# 验证配置是否有效
validate_config() {
  local has_error=false
  
  # 检查管理员用户名
  if [ -z "$ADMIN_USER" ] || [ ${#ADMIN_USER} -lt 5 ]; then
    error "管理员用户名为空或太短（应至少5个字符）"
    has_error=true
  fi
  
  # 检查管理员密码
  if [ -z "$ADMIN_PASSWORD" ] || [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    error "管理员密码为空或太短（应至少8个字符）"
    has_error=true
  fi
  
  # 检查JWT密钥
  if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 16 ]; then
    error "JWT密钥为空或太短（应至少16个字符）"
    has_error=true
  fi
  
  if [ "$has_error" = true ]; then
    return 1
  else
    return 0
  fi
}

# 设置默认端口
APP_PORT=3000
WS_PORT=3002

# 检查端口是否被占用
check_port_availability() {
  port=$1
  if command -v nc &> /dev/null; then
    nc -z localhost $port &> /dev/null
    return $?
  elif command -v lsof &> /dev/null; then
    lsof -i :$port &> /dev/null
    return $?
  else
    # 如果没有nc和lsof，尝试使用/dev/tcp
    (echo > /dev/tcp/localhost/$port) &> /dev/null
    return $?
  fi
}

# 获取可用端口
get_available_port() {
  start_port=$1
  current_port=$start_port
  
  while check_port_availability $current_port; do
    info "端口 $current_port 已被占用，尝试下一个端口..."
    current_port=$((current_port + 1))
    if [ $current_port -gt $((start_port + 100)) ]; then
      error "无法找到可用端口，请手动指定端口"
      return $start_port
    fi
  done
  
  return $current_port
}

# 配置端口
configure_ports() {
  info "配置应用端口..."
  
  # 检查应用端口
  info "是否要自定义应用端口？默认为 $APP_PORT (y/n) [默认: n]"
  read -r customize_app_port
  
  if [[ "$customize_app_port" =~ ^[Yy]$ ]]; then
    info "请输入应用端口号 [默认: $APP_PORT]: "
    read -r input_app_port
    
    if [ -n "$input_app_port" ] && [ "$input_app_port" -eq "$input_app_port" ] 2>/dev/null; then
      APP_PORT=$input_app_port
    else
      warn "无效的端口号，使用默认值 $APP_PORT"
    fi
  fi
  
  # 检查应用端口是否可用
  if check_port_availability $APP_PORT; then
    warn "应用端口 $APP_PORT 已被占用"
    info "是否要自动选择另一个可用端口？ (y/n) [默认: y]"
    read -r auto_select_app_port
    
    if [[ ! "$auto_select_app_port" =~ ^[Nn]$ ]]; then
      get_available_port $APP_PORT
      APP_PORT=$?
      info "已选择新的应用端口: $APP_PORT"
    fi
  fi
  
  # 检查WebSocket端口
  info "是否要自定义WebSocket端口？默认为 $WS_PORT (y/n) [默认: n]"
  read -r customize_ws_port
  
  if [[ "$customize_ws_port" =~ ^[Yy]$ ]]; then
    info "请输入WebSocket端口号 [默认: $WS_PORT]: "
    read -r input_ws_port
    
    if [ -n "$input_ws_port" ] && [ "$input_ws_port" -eq "$input_ws_port" ] 2>/dev/null; then
      WS_PORT=$input_ws_port
    else
      warn "无效的端口号，使用默认值 $WS_PORT"
    fi
  fi
  
  # 检查WebSocket端口是否可用
  if check_port_availability $WS_PORT; then
    warn "WebSocket端口 $WS_PORT 已被占用"
    info "是否要自动选择另一个可用端口？ (y/n) [默认: y]"
    read -r auto_select_ws_port
    
    if [[ ! "$auto_select_ws_port" =~ ^[Nn]$ ]]; then
      get_available_port $WS_PORT
      WS_PORT=$?
      info "已选择新的WebSocket端口: $WS_PORT"
    fi
  fi
  
  info "应用将使用以下端口:"
  info "- 应用端口: $APP_PORT"
  info "- WebSocket端口: $WS_PORT"
}

# 配置 PostgreSQL
configure_postgres() {
  info "配置 PostgreSQL 数据库..."
  
  # 设置默认值
  local default_pg_user="postgres"
  local default_pg_password="postgres"
  local default_pg_db="aipan"
  local default_pg_schema="public"
  
  # 询问是否要自定义 PostgreSQL 配置
  info "是否要自定义 PostgreSQL 数据库配置？(y/n) [默认: n]"
  read -r customize_pg
  
  if [[ "$customize_pg" =~ ^[Yy]$ ]]; then
    # 用户名
    info "请输入 PostgreSQL 用户名 [默认: $default_pg_user]: "
    read -r input_pg_user
    if [ -n "$input_pg_user" ]; then
      POSTGRES_USER="$input_pg_user"
    else
      POSTGRES_USER="$default_pg_user"
    fi
    
    # 密码
    info "请输入 PostgreSQL 密码 [默认: $default_pg_password]: "
    read -r input_pg_password
    if [ -n "$input_pg_password" ]; then
      POSTGRES_PASSWORD="$input_pg_password"
    else
      POSTGRES_PASSWORD="$default_pg_password"
    fi
    
    # 数据库名
    info "请输入 PostgreSQL 数据库名 [默认: $default_pg_db]: "
    read -r input_pg_db
    if [ -n "$input_pg_db" ]; then
      POSTGRES_DB="$input_pg_db"
    else
      POSTGRES_DB="$default_pg_db"
    fi
    
    # 模式
    info "请输入 PostgreSQL 数据库模式 [默认: $default_pg_schema]: "
    read -r input_pg_schema
    if [ -n "$input_pg_schema" ]; then
      DATABASE_SCHEMA="$input_pg_schema"
    else
      DATABASE_SCHEMA="$default_pg_schema"
    fi
  else
    # 使用默认值
    POSTGRES_USER="$default_pg_user"
    POSTGRES_PASSWORD="$default_pg_password"
    POSTGRES_DB="$default_pg_db"
    DATABASE_SCHEMA="$default_pg_schema"
  fi
  
  # 构建数据库连接字符串
  DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=${DATABASE_SCHEMA}"
  SHADOW_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}_shadow?schema=${DATABASE_SCHEMA}"
  
  # 确保数据库用户名在连接字符串中正确使用
  info "注意: 数据库用户名将被设置为 '$POSTGRES_USER'"
  info "请确保该用户在数据库中具有足够的权限"
  
  info "PostgreSQL 配置完成 ✓"
  info "- 用户名: $POSTGRES_USER"
  info "- 数据库: $POSTGRES_DB"
  info "- 模式: $DATABASE_SCHEMA"
}

# 配置 Redis
configure_redis() {
  info "配置 Redis..."
  
  # 设置默认值
  local default_redis_host="redis"
  local default_redis_port="6379"
  
  # 询问是否要自定义 Redis 配置
  info "是否要自定义 Redis 配置？(y/n) [默认: n]"
  read -r customize_redis
  
  if [[ "$customize_redis" =~ ^[Yy]$ ]]; then
    # 主机
    info "请输入 Redis 主机 [默认: $default_redis_host]: "
    read -r input_redis_host
    if [ -n "$input_redis_host" ]; then
      REDIS_HOST="$input_redis_host"
    else
      REDIS_HOST="$default_redis_host"
    fi
    
    # 端口
    info "请输入 Redis 端口 [默认: $default_redis_port]: "
    read -r input_redis_port
    if [ -n "$input_redis_port" ] && [ "$input_redis_port" -eq "$input_redis_port" ] 2>/dev/null; then
      REDIS_PORT="$input_redis_port"
    else
      REDIS_PORT="$default_redis_port"
    fi
  else
    # 使用默认值
    REDIS_HOST="$default_redis_host"
    REDIS_PORT="$default_redis_port"
  fi
  
  # 构建 Redis 连接字符串
  REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
  
  info "Redis 配置完成 ✓"
  info "- 连接 URL: $REDIS_URL"
}

# 创建配置文件
create_config() {
  info "创建配置文件..."
  
  # 配置端口
  configure_ports
  
  # 配置 PostgreSQL
  configure_postgres
  
  # 配置 Redis
  configure_redis
  
  # 确保.env文件存在
  if [ ! -f .env ]; then
    info "创建.env文件..."
    
    # 生成随机凭据
    random_username=$(generate_random_username)
    random_password=$(generate_random_password)
    random_jwt_secret=$(generate_random_jwt_secret)
    random_email=$(generate_random_email)
    
    # 验证生成的凭据
    if [ -z "$random_username" ] || [ ${#random_username} -lt 5 ]; then
      warn "生成的管理员用户名无效，重新生成"
      random_username="admin_$(generate_random_string 8 8)"
    fi
    
    if [ -z "$random_password" ] || [ ${#random_password} -lt 8 ]; then
      warn "生成的管理员密码无效，重新生成"
      random_password=$(generate_random_string 16 12)
    fi
    
    if [ -z "$random_jwt_secret" ] || [ ${#random_jwt_secret} -lt 16 ]; then
      warn "生成的JWT密钥无效，重新生成"
      random_jwt_secret=$(generate_random_string 48 32)
    fi
    
    info "已生成随机管理员用户名: ${random_username}"
    info "已生成随机管理员密码: ${random_password}"
    info "已生成随机管理员邮箱: ${random_email}"
    info "请保存这些凭据，它们只会显示一次!"
    
    cat > .env << EOL
# 数据库配置
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_SCHEMA=${DATABASE_SCHEMA}
DATABASE_URL=${DATABASE_URL}
SHADOW_DATABASE_URL=${SHADOW_DATABASE_URL}

# 管理员配置
ADMIN_USER=${random_username}
ADMIN_PASSWORD=${random_password}
ADMIN_EMAIL=${random_email}

# 安全配置
JWT_SECRET=${random_jwt_secret}

# 端口配置
APP_PORT=${APP_PORT}
WS_PORT=${WS_PORT}

# Redis配置
REDIS_URL=${REDIS_URL}

# GitHub Configuration
NUXT_PUBLIC_GITHUB_OWNER=""
NUXT_PUBLIC_GITHUB_REPO=""
NUXT_PUBLIC_GITHUB_TOKEN=""
NUXT_PUBLIC_GITHUB_BRANCH=""

# Quark Configuration
NUXT_PUBLIC_QUARK_COOKIE=""

# 环境配置
NODE_ENV=production
EOL
    info ".env文件已创建 ✓"
    
    # 保存凭据到安全文件
    cat > admin_credentials.txt << EOL
===============================================
        AIPan网盘搜索应用 - 配置信息
===============================================

请妥善保管以下信息，此文件仅生成一次！

## 管理员信息
管理员用户名: ${random_username}
管理员密码: ${random_password}
管理员邮箱: ${random_email}

## 安全配置
JWT密钥: ${random_jwt_secret}

## 端口配置
应用端口: ${APP_PORT}
WebSocket端口: ${WS_PORT}

## PostgreSQL 配置
用户名: ${POSTGRES_USER}
密码: ${POSTGRES_PASSWORD}
数据库名: ${POSTGRES_DB}
数据库模式: ${DATABASE_SCHEMA}
连接字符串: ${DATABASE_URL}

## Redis 配置
连接URL: ${REDIS_URL}

部署时间: $(date)
===============================================
EOL
    info "所有配置信息已保存到 admin_credentials.txt 文件 ✓"
    info "请妥善保管此文件，并在安全的地方备份!"
    
  else
    info ".env文件已存在 ✓"
  fi
  
  # 创建docker-compose.yml文件
  info "创建docker-compose.yml文件..."
  cat > docker-compose.yml << EOL
version: '3.8'

services:
  # 数据库迁移服务
  prisma-migrate:
    image: unilei/aipan-netdisk-search:latest
    container_name: aipan-prisma-migrate
    restart: "no"
    environment:
      - DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?schema=\${DATABASE_SCHEMA}
      - SHADOW_DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}_shadow?schema=\${DATABASE_SCHEMA}
      # 确保 Prisma 使用正确的数据库用户名
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
    command: ["/bin/sh", "-c", "cd /app && if [ ! -f ./prisma-esm-fix.mjs ]; then echo 'Creating prisma-esm-fix.mjs file...' && echo \"import { fileURLToPath } from 'url'; import { dirname } from 'path'; import { createRequire } from 'module'; if (typeof global.__filename === 'undefined') { global.__filename = fileURLToPath(import.meta.url); } if (typeof global.__dirname === 'undefined') { global.__dirname = dirname(global.__filename); } if (typeof global.require === 'undefined') { global.require = createRequire(import.meta.url); } console.log('[Prisma ESM Fix] 已加载 ES Module 环境修复');\" > ./prisma-esm-fix.mjs; fi && node --import=./prisma-esm-fix.mjs -e \"console.log('Running Prisma migrations with ESM fix')\" && npx prisma migrate deploy && npx prisma db seed"]
    depends_on:
      - postgres
    networks:
      - aipan-network

  # 主应用服务
  aipan-netdisk-search:
    image: unilei/aipan-netdisk-search:latest
    container_name: aipan-netdisk-search-app
    restart: always
    ports:
      - "\${APP_PORT}:3000"  # Web应用端口
      - "\${WS_PORT}:3002"  # WebSocket端口
    environment:
      # 数据库配置
      - DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?schema=\${DATABASE_SCHEMA}
      - NUXT_DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?schema=\${DATABASE_SCHEMA}
      - DATABASE_SCHEMA=\${DATABASE_SCHEMA}
      - NUXT_DATABASE_SCHEMA=\${DATABASE_SCHEMA}
      - SHADOW_DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}_shadow?schema=\${DATABASE_SCHEMA}
      # 数据库连接信息
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
      
      # 管理员配置
      - ADMIN_USER=\${ADMIN_USER}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD}
      - ADMIN_EMAIL=\${ADMIN_EMAIL}
      # Nuxt 版本的管理员配置（用于 useRuntimeConfig 访问）
      - NUXT_ADMIN_USER=\${ADMIN_USER}
      - NUXT_ADMIN_PASSWORD=\${ADMIN_PASSWORD}
      - NUXT_ADMIN_EMAIL=\${ADMIN_EMAIL}
      
      # 安全配置
      - JWT_SECRET=\${JWT_SECRET}
      - NUXT_JWT_SECRET=\${JWT_SECRET}
      
      # GitHub配置
      - NUXT_PUBLIC_GITHUB_OWNER=\${NUXT_PUBLIC_GITHUB_OWNER}
      - NUXT_PUBLIC_GITHUB_REPO=\${NUXT_PUBLIC_GITHUB_REPO}
      - NUXT_PUBLIC_GITHUB_TOKEN=\${NUXT_PUBLIC_GITHUB_TOKEN}
      - NUXT_PUBLIC_GITHUB_BRANCH=\${NUXT_PUBLIC_GITHUB_BRANCH}
      
      # Quark配置
      - NUXT_PUBLIC_QUARK_COOKIE=\${NUXT_PUBLIC_QUARK_COOKIE}
      
      # WebSocket配置
      - WS_PORT=\${WS_PORT}
      
      # Redis配置
      - REDIS_URL=\${REDIS_URL}
      
      # 环境配置
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
      - prisma-migrate
    networks:
      - aipan-network

  postgres:
    image: postgres:15-alpine
    container_name: aipan-postgres
    restart: always
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - aipan-network

  redis:
    image: redis:alpine
    container_name: aipan-redis
    restart: always
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    networks:
      - aipan-network

volumes:
  postgres-data:
  redis-data:

networks:
  aipan-network:
    driver: bridge
EOL
  info "docker-compose.yml文件已创建 ✓"
}

# 拉取镜像
pull_images() {
  info "拉取最新的Docker镜像..."
  docker pull unilei/aipan-netdisk-search:latest
  docker pull postgres:15-alpine
  docker pull redis:alpine
  info "镜像拉取完成 ✓"
}

# 检查并处理已存在的容器
check_existing_containers() {
  info "检查已存在的容器..."
  
  # 定义要检查的容器名称
  containers=("aipan-netdisk-search-app" "aipan-postgres" "aipan-redis" "aipan-prisma-migrate")
  
  for container in "${containers[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
      warn "发现已存在的容器: $container"
      
      # 检查容器是否正在运行
      if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
        info "停止容器: $container"
        docker stop "$container" > /dev/null 2>&1
      fi
      
      info "移除容器: $container"
      docker rm "$container" > /dev/null 2>&1
      
      if [ $? -eq 0 ]; then
        info "容器 $container 已成功移除 ✓"
      else
        error "无法移除容器 $container，请手动执行: docker rm -f $container"
        exit 1
      fi
    fi
  done
  
  info "容器检查完成 ✓"
}

# 检查并清理无用的Docker资源
clean_docker_resources() {
  info "清理无用的Docker资源..."
  
  # 询问是否清理
  info "是否清理无用的Docker资源？这将删除未使用的容器、网络和数据卷 (y/n) [默认: n]"
  read -r clean_docker
  
  if [[ "$clean_docker" =~ ^[Yy]$ ]]; then
    # 删除停止的容器
    info "删除停止的容器..."
    docker container prune -f > /dev/null 2>&1
    
    # 删除未使用的网络
    info "删除未使用的网络..."
    docker network prune -f > /dev/null 2>&1
    
    # 删除未使用的数据卷
    info "删除未使用的数据卷..."
    docker volume prune -f > /dev/null 2>&1
    
    info "Docker资源清理完成 ✓"
  else
    info "跳过Docker资源清理"
  fi
}

# 初始化数据库用户和权限
initialize_database_user() {
  info "初始化数据库用户和权限..."
  
  # 检查是否需要创建自定义用户
  if [ "$POSTGRES_USER" != "postgres" ]; then
    info "检测到自定义数据库用户: $POSTGRES_USER"
    
    # 等待PostgreSQL容器启动
    info "等待PostgreSQL容器启动..."
    sleep 5
    
    # 检查PostgreSQL容器是否在运行
    if ! docker ps --format '{{.Names}}' | grep -q "^aipan-postgres$"; then
      warn "PostgreSQL容器未运行，无法初始化用户"
      return 1
    fi
    
    # 检查用户是否已存在
    info "检查用户是否已存在..."
    user_exists=$(docker exec aipan-postgres psql -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname='$POSTGRES_USER'" | tr -d '[:space:]')
    
    if [ "$user_exists" != "1" ]; then
      info "创建数据库用户: $POSTGRES_USER"
      docker exec aipan-postgres psql -U postgres -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';" || {
        error "创建用户失败"
        return 1
      }
    else
      info "用户 $POSTGRES_USER 已存在，更新密码"
      docker exec aipan-postgres psql -U postgres -c "ALTER USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';" || {
        error "更新用户密码失败"
        return 1
      }
    fi
    
    # 检查数据库是否已存在
    db_exists=$(docker exec aipan-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" | tr -d '[:space:]')
    
    if [ "$db_exists" != "1" ]; then
      info "创建数据库: $POSTGRES_DB"
      docker exec aipan-postgres psql -U postgres -c "CREATE DATABASE $POSTGRES_DB;" || {
        error "创建数据库失败"
        return 1
      }
    else
      info "数据库 $POSTGRES_DB 已存在"
    fi
    
    # 检查影子数据库是否已存在
    shadow_db_exists=$(docker exec aipan-postgres psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}_shadow'" | tr -d '[:space:]')
    
    if [ "$shadow_db_exists" != "1" ]; then
      info "创建影子数据库: ${POSTGRES_DB}_shadow"
      docker exec aipan-postgres psql -U postgres -c "CREATE DATABASE ${POSTGRES_DB}_shadow;" || {
        error "创建影子数据库失败"
        return 1
      }
    else
      info "影子数据库 ${POSTGRES_DB}_shadow 已存在"
    fi
    
    # 授予用户权限
    info "授予用户 $POSTGRES_USER 对数据库的权限"
    docker exec aipan-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" || {
      error "授予数据库权限失败"
      return 1
    }
    
    docker exec aipan-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB}_shadow TO $POSTGRES_USER;" || {
      error "授予影子数据库权限失败"
      return 1
    }
    
    # 授予模式权限
    info "授予用户 $POSTGRES_USER 对模式 $DATABASE_SCHEMA 的权限"
    docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "CREATE SCHEMA IF NOT EXISTS $DATABASE_SCHEMA;" || {
      warn "创建模式失败或模式已存在"
    }
    
    docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "GRANT ALL ON SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
      error "授予模式权限失败"
      return 1
    }
    
    # 授予用户对该模式下所有表的权限
    docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "ALTER USER $POSTGRES_USER WITH SUPERUSER;" || {
      warn "无法将用户设置为超级用户，尝试授予表级权限"
      
      # 如果无法设置超级用户，尝试授予表级权限
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
        warn "授予表级权限失败，可能是因为表尚未创建"
      }
      
      # 设置默认权限，使未来创建的表也自动授予权限
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "ALTER DEFAULT PRIVILEGES IN SCHEMA $DATABASE_SCHEMA GRANT ALL PRIVILEGES ON TABLES TO $POSTGRES_USER;" || {
        warn "设置默认表权限失败"
      }
      
      # 授予序列权限
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
        warn "授予序列权限失败"
      }
      
      # 设置默认序列权限
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "ALTER DEFAULT PRIVILEGES IN SCHEMA $DATABASE_SCHEMA GRANT ALL PRIVILEGES ON SEQUENCES TO $POSTGRES_USER;" || {
        warn "设置默认序列权限失败"
      }
    }
    
    # 对影子数据库执行相同操作
    docker exec aipan-postgres psql -U postgres -d ${POSTGRES_DB}_shadow -c "CREATE SCHEMA IF NOT EXISTS $DATABASE_SCHEMA;" || {
      warn "创建影子数据库模式失败或模式已存在"
    }
    
    docker exec aipan-postgres psql -U postgres -d ${POSTGRES_DB}_shadow -c "GRANT ALL ON SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
      error "授予影子数据库模式权限失败"
      return 1
    }
    
    # 授予影子数据库的表级权限
    docker exec aipan-postgres psql -U postgres -d ${POSTGRES_DB}_shadow -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
      warn "授予影子数据库表级权限失败，可能是因为表尚未创建"
    }
    
    # 设置影子数据库默认权限
    docker exec aipan-postgres psql -U postgres -d ${POSTGRES_DB}_shadow -c "ALTER DEFAULT PRIVILEGES IN SCHEMA $DATABASE_SCHEMA GRANT ALL PRIVILEGES ON TABLES TO $POSTGRES_USER;" || {
      warn "设置影子数据库默认表权限失败"
    }
    
    # 授予影子数据库序列权限
    docker exec aipan-postgres psql -U postgres -d ${POSTGRES_DB}_shadow -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
      warn "授予影子数据库序列权限失败"
    }
    
    # 设置影子数据库默认序列权限
    docker exec aipan-postgres psql -U postgres -d ${POSTGRES_DB}_shadow -c "ALTER DEFAULT PRIVILEGES IN SCHEMA $DATABASE_SCHEMA GRANT ALL PRIVILEGES ON SEQUENCES TO $POSTGRES_USER;" || {
      warn "设置影子数据库默认序列权限失败"
    }
    
    info "数据库用户和权限初始化完成 ✓"
  else
    info "使用默认postgres用户，跳过用户初始化"
  fi
  
  return 0
}

# 启动服务
start_services() {
  # 首先检查并处理已存在的容器
  check_existing_containers
  
  # 确保环境变量可用
  export APP_PORT
  export WS_PORT
  
  info "启动服务..."
  info "使用端口: APP_PORT=$APP_PORT, WS_PORT=$WS_PORT"
  
  # 首先启动PostgreSQL容器
  info "启动PostgreSQL容器..."
  if [ "$USE_DOCKER_PLUGIN" = true ]; then
    docker compose up -d postgres
  else
    docker-compose up -d postgres
  fi
  
  # 初始化数据库用户和权限
  initialize_database_user
  
  # 启动所有服务
  info "启动所有服务..."
  if [ "$USE_DOCKER_PLUGIN" = true ]; then
    APP_PORT=$APP_PORT WS_PORT=$WS_PORT docker compose up -d
  else
    APP_PORT=$APP_PORT WS_PORT=$WS_PORT docker-compose up -d
  fi
  
  if [ $? -eq 0 ]; then
    info "服务启动成功! ✓"
    info "应用现在可以通过以下地址访问:"
    info "- Web应用: http://localhost:${APP_PORT}"
    info "- WebSocket: ws://localhost:${WS_PORT}"
  else
    error "服务启动失败，请检查日志"
    exit 1
  fi
}

# 显示日志
show_logs() {
  info "是否查看应用日志? (y/n)"
  read -r view_logs
  if [[ "$view_logs" =~ ^[Yy]$ ]]; then
    info "显示应用日志 (按Ctrl+C退出)..."
    if [ "$USE_DOCKER_PLUGIN" = true ]; then
      docker compose logs -f aipan-netdisk-search
    else
      docker-compose logs -f aipan-netdisk-search
    fi
  fi
}

# 更新配置
update_config() {
  info "===== 更新配置 ====="
  
  # 检查.env文件是否存在
  if [ ! -f .env ]; then
    error ".env文件不存在，请先运行完整部署脚本"
    exit 1
  fi
  
  # 加载现有配置
  source .env
  
  # 验证现有配置
  if ! validate_config; then
    warn "检测到现有配置中存在问题，将自动修复"
    
    # 如果管理员用户名无效，重新生成
    if [ -z "$ADMIN_USER" ] || [ ${#ADMIN_USER} -lt 5 ]; then
      ADMIN_USER=$(generate_random_username)
      info "已生成新的管理员用户名: $ADMIN_USER"
    fi
    
    # 如果管理员密码无效，重新生成
    if [ -z "$ADMIN_PASSWORD" ] || [ ${#ADMIN_PASSWORD} -lt 8 ]; then
      ADMIN_PASSWORD=$(generate_random_password)
      info "已生成新的管理员密码: $ADMIN_PASSWORD"
    fi
    
    # 如果JWT密钥无效，重新生成
    if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 16 ]; then
      JWT_SECRET=$(generate_random_jwt_secret)
      info "已生成新的JWT密钥"
    fi
    
    # 更新.env文件
    sed -i "" "s/^ADMIN_USER=.*/ADMIN_USER=$ADMIN_USER/" .env
    sed -i "" "s/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" .env
    sed -i "" "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    
    info "已自动修复配置问题 ✓"
    
    # 从.env文件中读取其他配置
    if [ -f .env ]; then
      source .env
    fi
    
    # 保存凭据到安全文件
    cat > admin_credentials_updated.txt << EOL
===============================================
        AIPan网盘搜索应用 - 更新的配置信息
===============================================

请妥善保管以下信息，此文件仅生成一次！

## 管理员信息
管理员用户名: ${ADMIN_USER}
管理员密码: ${ADMIN_PASSWORD}
管理员邮箱: ${ADMIN_EMAIL}

## 安全配置
JWT密钥: ${JWT_SECRET}

## 端口配置
应用端口: ${APP_PORT}
WebSocket端口: ${WS_PORT}

## PostgreSQL 配置
用户名: ${POSTGRES_USER}
密码: ${POSTGRES_PASSWORD}
数据库名: ${POSTGRES_DB}
数据库模式: ${DATABASE_SCHEMA}
连接字符串: ${DATABASE_URL}

## Redis 配置
连接URL: ${REDIS_URL}

更新时间: $(date)
===============================================
EOL
    info "所有配置信息已保存到 admin_credentials_updated.txt 文件 ✓"
    warn "请立即查看并备份 admin_credentials_updated.txt 文件，其中包含所有重要的配置信息！"
  fi
  
  info "是否要编辑.env文件? (y/n)"
  read -r edit_env
  if [[ "$edit_env" =~ ^[Yy]$ ]]; then
    # 使用默认编辑器打开.env文件
    if [ -n "$EDITOR" ]; then
      $EDITOR .env
    elif command -v nano &> /dev/null; then
      nano .env
    elif command -v vim &> /dev/null; then
      vim .env
    else
      info "请使用您喜欢的文本编辑器编辑.env文件，然后按回车继续..."
      read -r
    fi
    
    # 编辑后再次验证配置
    source .env
    if ! validate_config; then
      error "配置仍然无效，请确保管理员用户名、密码和JWT密钥符合长度要求"
      info "将使用默认值继续"
    fi
  fi
  
  # 确保环境变量可用
  export APP_PORT
  export WS_PORT
  
  # 重启服务
  info "重启服务以应用新配置..."
  info "使用端口: APP_PORT=$APP_PORT, WS_PORT=$WS_PORT"
  
  # 检查容器是否存在
  if ! docker ps -a | grep -q "aipan-netdisk-search-app"; then
    warn "未找到运行中的容器，将执行完整部署而非重启"
    check_existing_containers
    
    if [ "$USE_DOCKER_PLUGIN" = true ]; then
      APP_PORT=$APP_PORT WS_PORT=$WS_PORT docker compose up -d
    else
      APP_PORT=$APP_PORT WS_PORT=$WS_PORT docker-compose up -d
    fi
  else
    # 正常重启容器
    if [ "$USE_DOCKER_PLUGIN" = true ]; then
      APP_PORT=$APP_PORT WS_PORT=$WS_PORT docker compose restart
    else
      APP_PORT=$APP_PORT WS_PORT=$WS_PORT docker-compose restart
    fi
  fi
  
  if [ $? -eq 0 ]; then
    info "服务已成功重启！新配置已生效 ✓"
    
    # 显示配置摘要
    info "应用配置摘要:"
    info "- 管理员用户名: $ADMIN_USER"
    info "- 应用端口: $APP_PORT"
    info "- WebSocket端口: $WS_PORT"
    info "- PostgreSQL 数据库: $POSTGRES_DB (用户: $POSTGRES_USER)"
    info "- Redis 连接: $REDIS_URL"
    info "所有配置信息已保存到 admin_credentials_updated.txt 文件"
    warn "请立即查看并备份 admin_credentials_updated.txt 文件，其中包含所有重要的配置信息！"
    
    info "应用现在可以通过以下地址访问:"
    info "- Web应用: http://localhost:$APP_PORT"
    info "- WebSocket: ws://localhost:$WS_PORT"
  else
    error "服务重启失败，请检查日志"
    exit 1
  fi
  
  # 显示日志
  show_logs
  
  info "===== 配置更新完成 ====="
}

# 重新生成 Prisma 客户端
regenerate_prisma_client() {
  info "===== 重新生成 Prisma 客户端 ====="
  
  # 检查并处理已存在的容器
  if docker ps -a --format '{{.Names}}' | grep -q "^aipan-prisma-generate$"; then
    info "移除旧的 Prisma 生成容器..."
    docker rm -f aipan-prisma-generate > /dev/null 2>&1
  fi
  
  # 运行 Prisma 客户端生成
  info "正在生成 Prisma 客户端..."
  docker run --rm \
    --name aipan-prisma-generate \
    -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=${DATABASE_SCHEMA}" \
    unilei/aipan-netdisk-search:latest \
    /bin/sh -c "cd /app && if [ ! -f ./prisma-esm-fix.mjs ]; then echo 'Creating prisma-esm-fix.mjs file...' && echo \"import { fileURLToPath } from 'url'; import { dirname } from 'path'; import { createRequire } from 'module'; if (typeof global.__filename === 'undefined') { global.__filename = fileURLToPath(import.meta.url); } if (typeof global.__dirname === 'undefined') { global.__dirname = dirname(global.__filename); } if (typeof global.require === 'undefined') { global.require = createRequire(import.meta.url); } console.log('[Prisma ESM Fix] 已加载 ES Module 环境修复');\" > ./prisma-esm-fix.mjs; fi && node --import=./prisma-esm-fix.mjs -e \"console.log('Generating Prisma client with ESM fix')\""
  
  if [ $? -eq 0 ]; then
    info "Prisma 客户端生成成功! ✓"
    
    # 询问是否重启应用
    info "是否要重启应用以使用新生成的 Prisma 客户端? (y/n)"
    read -r restart_app
    
    if [[ "$restart_app" =~ ^[Yy]$ ]]; then
      # 重启应用容器
      info "重启应用容器..."
      if [ "$USE_DOCKER_PLUGIN" = true ]; then
        docker compose restart aipan-netdisk-search
      else
        docker-compose restart aipan-netdisk-search
      fi
      
      if [ $? -eq 0 ]; then
        info "应用容器重启成功! ✓"
      else
        error "应用容器重启失败"
      fi
    fi
  else
    error "Prisma 客户端生成失败，请检查日志"
    return 1
  fi
  
  info "===== Prisma 客户端生成完成 ====="
  return 0
}

# 运行数据库迁移
run_database_migration() {
  info "===== 运行数据库迁移 ====="
  
  # 检查并处理已存在的迁移容器
  if docker ps -a --format '{{.Names}}' | grep -q "^aipan-prisma-migrate$"; then
    info "移除旧的迁移容器..."
    docker rm -f aipan-prisma-migrate > /dev/null 2>&1
  fi
  
  # 检查PostgreSQL容器是否运行
  if ! docker ps --format '{{.Names}}' | grep -q "^aipan-postgres$"; then
    warn "PostgreSQL容器未运行，无法执行迁移"
    info "是否启动PostgreSQL容器? (y/n)"
    read -r start_postgres
    
    if [[ "$start_postgres" =~ ^[Yy]$ ]]; then
      info "启动PostgreSQL容器..."
      if [ "$USE_DOCKER_PLUGIN" = true ]; then
        docker compose up -d postgres
      else
        docker-compose up -d postgres
      fi
      
      # 等待PostgreSQL启动
      info "等待PostgreSQL启动..."
      sleep 10
    else
      error "无法执行数据库迁移，PostgreSQL容器未运行"
      return 1
    fi
  fi
  
  # 运行数据库迁移
  info "运行数据库迁移..."
  docker run --rm \
    --name aipan-prisma-migrate \
    --network aipan-network \
    -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=${DATABASE_SCHEMA}" \
    -e SHADOW_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}_shadow?schema=${DATABASE_SCHEMA}" \
    unilei/aipan-netdisk-search:latest \
    /bin/sh -c "cd /app && if [ ! -f ./prisma-esm-fix.mjs ]; then echo 'Creating prisma-esm-fix.mjs file...' && echo \"import { fileURLToPath } from 'url'; import { dirname } from 'path'; import { createRequire } from 'module'; if (typeof global.__filename === 'undefined') { global.__filename = fileURLToPath(import.meta.url); } if (typeof global.__dirname === 'undefined') { global.__dirname = dirname(global.__filename); } if (typeof global.require === 'undefined') { global.require = createRequire(import.meta.url); } console.log('[Prisma ESM Fix] 已加载 ES Module 环境修复');\" > ./prisma-esm-fix.mjs; fi && node --import=./prisma-esm-fix.mjs -e \"console.log('Running Prisma migrations with ESM fix')\" npx prisma migrate deploy && npx prisma db seed"
  
  if [ $? -eq 0 ]; then
    info "数据库迁移成功! ✓"
    
    # 迁移后更新表权限
    if [ "$POSTGRES_USER" != "postgres" ]; then
      info "迁移后更新表权限..."
      
      # 授予用户对所有表的权限
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
        warn "迁移后授予表权限失败"
      }
      
      # 授予用户对所有序列的权限
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $DATABASE_SCHEMA TO $POSTGRES_USER;" || {
        warn "迁移后授予序列权限失败"
      }
      
      # 尝试将表的所有权设置为用户
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "SELECT 'ALTER TABLE ' || schemaname || '.' || tablename || ' OWNER TO $POSTGRES_USER;' FROM pg_tables WHERE schemaname = '$DATABASE_SCHEMA' \gexec" || {
        warn "设置表所有权失败"
      }
      
      # 尝试将序列的所有权设置为用户
      docker exec aipan-postgres psql -U postgres -d $POSTGRES_DB -c "SELECT 'ALTER SEQUENCE ' || sequence_schema || '.' || sequence_name || ' OWNER TO $POSTGRES_USER;' FROM information_schema.sequences WHERE sequence_schema = '$DATABASE_SCHEMA' \gexec" || {
        warn "设置序列所有权失败"
      }
      
      info "表权限更新完成 ✓"
    fi
  else
    error "数据库迁移失败，请检查日志"
    return 1
  fi
  
  info "===== 数据库迁移完成 ====="
  return 0
}

# 显示菜单
show_menu() {
  echo ""
  info "===== AIPan网盘搜索部署脚本 ====="
  echo ""
  echo "  1) 完整部署 (首次部署或重新部署)"
  echo "  2) 更新配置 (仅修改配置并重启服务)"
  echo "  3) 运行数据库迁移 (初始化或更新数据库结构)"
  echo "  4) 重新生成 Prisma 客户端 (解决 Prisma 相关问题)"
  echo "  5) 退出"
  echo ""
  info "请选择操作 [默认: 1]: "
  read -r choice
  
  case "$choice" in
    2)
      update_config
      ;;
    3)
      # 加载现有配置
      if [ -f .env ]; then
        source .env
      else
        error ".env文件不存在，请先运行完整部署"
        exit 1
      fi
      run_database_migration
      ;;
    4)
      # 加载现有配置
      if [ -f .env ]; then
        source .env
      else
        error ".env文件不存在，请先运行完整部署"
        exit 1
      fi
      regenerate_prisma_client
      ;;
    5)
      info "感谢使用AIPan网盘搜索部署脚本"
      exit 0
      ;;
    *)
      full_deployment
      ;;
  esac
}

# 完整部署函数
full_deployment() {
  info "===== 开始完整部署 ====="
  info "此过程将部署AIPan网盘搜索应用及其所有依赖"
  
  # 检查Docker
  check_docker
  
  # 创建配置文件
  create_config
  
  # 询问是否需要自定义配置
  info "是否需要自定义配置? (y/n) [默认: n]"
  read -r customize
  if [[ "$customize" =~ ^[Yy]$ ]]; then
    info "请编辑.env文件，完成后按任意键继续..."
    read -n 1 -s -r
    info "配置已更新 ✓"
  fi
  
  # 拉取镜像
  pull_images
  
  # 启动服务
  start_services
  
  # 显示日志
  show_logs
  
  info "===== 部署完成 ====="
  
  # 显示配置摘要
  info "应用配置摘要:"
  info "- 管理员用户名: $ADMIN_USER"
  info "- 应用端口: $APP_PORT"
  info "- WebSocket端口: $WS_PORT"
  info "- PostgreSQL 数据库: $POSTGRES_DB (用户: $POSTGRES_USER)"
  info "- Redis 连接: $REDIS_URL"
  info "所有配置信息已保存到 admin_credentials.txt 文件"
  warn "请立即查看并备份 admin_credentials.txt 文件，其中包含所有重要的配置信息！"
  
  info "应用访问地址:"
  info "- Web应用: http://localhost:$APP_PORT"
  info "- WebSocket: ws://localhost:$WS_PORT"
  
  info "常用命令:"
  info "- 停止服务: docker-compose down"
  info "- 重启服务: docker-compose restart"
  info "- 查看日志: docker-compose logs -f"
  info "- 更新配置: 再次运行 ./deploy.sh 并选择选项 2"
}

# 主函数
main() {
  # 显示菜单并处理用户选择
  show_menu
}

# 执行主函数
main
