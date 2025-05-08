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

# 创建配置文件
create_config() {
  info "创建配置文件..."
  
  # 配置端口
  configure_ports
  
  # 确保.env文件存在
  if [ ! -f .env ]; then
    info "创建.env文件..."
    
    # 生成随机凭据
    random_username=$(generate_random_username)
    random_password=$(generate_random_password)
    random_jwt_secret=$(generate_random_jwt_secret)
    
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
    info "请保存这些凭据，它们只会显示一次!"
    
    cat > .env << EOL
# 数据库配置
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=aipan
DATABASE_SCHEMA=public
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/aipan?schema=public
SHADOW_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/aipan_shadow?schema=public

# 管理员配置
ADMIN_USER=${random_username}
ADMIN_PASSWORD=${random_password}
ADMIN_EMAIL=admin@admin.com

# 安全配置
JWT_SECRET=${random_jwt_secret}

# 端口配置
APP_PORT=${APP_PORT}
WS_PORT=${WS_PORT}

# Redis配置
REDIS_URL=redis://redis:6379

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
        AIPan网盘搜索应用 - 管理员凭据
===============================================

请妥善保管以下信息，此文件仅生成一次！

管理员用户名: ${random_username}
管理员密码: ${random_password}
JWT密钥: ${random_jwt_secret}

部署时间: $(date)
===============================================
EOL
    info "管理员凭据已保存到 admin_credentials.txt 文件 ✓"
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
    command: ["/bin/sh", "-c", "cd /app && npx prisma migrate deploy && npx prisma db seed"]
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
      
      # 管理员配置
      - ADMIN_USER=\${ADMIN_USER}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD}
      - ADMIN_EMAIL=\${ADMIN_EMAIL}
      
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

# 启动服务
start_services() {
  # 首先检查并处理已存在的容器
  check_existing_containers
  
  # 确保环境变量可用
  export APP_PORT
  export WS_PORT
  
  info "启动服务..."
  info "使用端口: APP_PORT=$APP_PORT, WS_PORT=$WS_PORT"
  
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
    
    # 保存凭据到安全文件
    cat > admin_credentials_updated.txt << EOL
===============================================
        AIPan网盘搜索应用 - 更新的管理员凭据
===============================================

请妥善保管以下信息，此文件仅生成一次！

管理员用户名: ${ADMIN_USER}
管理员密码: ${ADMIN_PASSWORD}
JWT密钥: ${JWT_SECRET}

更新时间: $(date)
===============================================
EOL
    info "更新的管理员凭据已保存到 admin_credentials_updated.txt 文件 ✓"
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
    info "应用现在可以通过以下地址访问:"
    info "- Web应用: http://localhost:3000"
    info "- WebSocket: ws://localhost:3002"
  else
    error "服务重启失败，请检查日志"
    exit 1
  fi
  
  # 显示日志
  show_logs
  
  info "===== 配置更新完成 ====="
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
    unilei/aipan-netdisk-search:latest \
    /bin/sh -c "cd /app && npx prisma migrate deploy && npx prisma db seed"
  
  if [ $? -eq 0 ]; then
    info "数据库迁移成功! ✓"
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
  echo "  4) 退出"
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
  info "如需停止服务，请运行: docker-compose down"
  info "如需重启服务，请运行: docker-compose restart"
  info "如需查看日志，请运行: docker-compose logs -f"
  info "如需更新配置，请再次运行此脚本并选择选项 2"
}

# 主函数
main() {
  # 显示菜单并处理用户选择
  show_menu
}

# 执行主函数
main
