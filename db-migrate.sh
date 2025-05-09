#!/bin/bash
# PostgreSQL 数据库迁移脚本
# 作者: Lei

# 颜色设置
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

step() {
  echo -e "${BLUE}[步骤]${NC} $1"
}

# 检查PostgreSQL客户端是否安装
check_postgres_client() {
  info "检查PostgreSQL客户端是否已安装..."
  if ! command -v psql &> /dev/null; then
    error "PostgreSQL客户端未安装。请先安装PostgreSQL客户端工具。"
    info "例如，在Ubuntu上: sudo apt install postgresql-client"
    info "在macOS上: brew install postgresql"
    exit 1
  fi
  info "PostgreSQL客户端已安装 ✓"
}

# 检查Docker是否安装
check_docker() {
  info "检查Docker是否已安装..."
  if ! command -v docker &> /dev/null; then
    warn "Docker未安装。将使用本地PostgreSQL客户端进行迁移。"
    USE_DOCKER=false
  else
    info "Docker已安装 ✓"
    info "将优先使用Docker容器进行迁移操作。"
    USE_DOCKER=true
  fi
}

# 连接测试函数
test_connection() {
  local conn_string="$1"
  local db_name="$2"
  
  if [ "$USE_DOCKER" = true ]; then
    docker run --rm postgres:15-alpine psql "$conn_string" -c "SELECT 1" > /dev/null 2>&1
  else
    PGPASSWORD="$(echo $conn_string | grep -oP '(?<=:)([^:@/]+)(?=@)')" psql -h "$(echo $conn_string | grep -oP '(?<=@)([^:/]+)')" -p "$(echo $conn_string | grep -oP '(?<=:)(\d+)(?=/)')" -U "$(echo $conn_string | grep -oP '(?<=://)([^:]+)')" -d "$db_name" -c "SELECT 1" > /dev/null 2>&1
  fi
  
  return $?
}

# 解析连接字符串函数
parse_connection_string() {
  local conn_string="$1"
  
  # 提取各个部分
  local user=$(echo $conn_string | grep -oP '(?<=://)([^:]+)')
  local password=$(echo $conn_string | grep -oP '(?<=:)([^:@/]+)(?=@)')
  local host=$(echo $conn_string | grep -oP '(?<=@)([^:/]+)')
  local port=$(echo $conn_string | grep -oP '(?<=:)(\d+)(?=/)')
  local dbname=$(echo $conn_string | grep -oP '(?<=/)[^/?]+')
  
  echo "用户名: $user"
  echo "密码: ${password:0:3}**** (已隐藏)" # 只显示密码前几位
  echo "主机: $host"
  echo "端口: $port"
  echo "数据库: $dbname"
}

# 获取表列表
get_tables() {
  local conn_string="$1"
  local db_name="$2"
  
  if [ "$USE_DOCKER" = true ]; then
    docker run --rm postgres:15-alpine psql "$conn_string" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | grep -v "^$" | tr -d ' '
  else
    PGPASSWORD="$(echo $conn_string | grep -oP '(?<=:)([^:@/]+)(?=@)')" psql -h "$(echo $conn_string | grep -oP '(?<=@)([^:/]+)')" -p "$(echo $conn_string | grep -oP '(?<=:)(\d+)(?=/)')" -U "$(echo $conn_string | grep -oP '(?<=://)([^:]+)')" -d "$db_name" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | grep -v "^$" | tr -d ' '
  fi
}

# 迁移单个表
migrate_table() {
  local src_conn="$1"
  local dst_conn="$2"
  local table="$3"
  
  step "迁移表: $table"
  
  # 1. 转储表结构和数据
  info "导出表 $table 的结构和数据..."
  
  if [ "$USE_DOCKER" = true ]; then
    docker run --rm postgres:15-alpine pg_dump "$src_conn" --table="$table" -f "/tmp/$table.sql"
    
    # 2. 导入到目标数据库
    info "导入表 $table 到目标数据库..."
    docker run --rm -v "/tmp/$table.sql:/tmp/$table.sql" postgres:15-alpine psql "$dst_conn" -f "/tmp/$table.sql"
    
    # 清理临时文件
    rm -f "/tmp/$table.sql"
  else
    # 解析源连接字符串
    local src_user=$(echo $src_conn | grep -oP '(?<=://)([^:]+)')
    local src_password=$(echo $src_conn | grep -oP '(?<=:)([^:@/]+)(?=@)')
    local src_host=$(echo $src_conn | grep -oP '(?<=@)([^:/]+)')
    local src_port=$(echo $src_conn | grep -oP '(?<=:)(\d+)(?=/)')
    local src_dbname=$(echo $src_conn | grep -oP '(?<=/)[^/?]+')
    
    # 解析目标连接字符串
    local dst_user=$(echo $dst_conn | grep -oP '(?<=://)([^:]+)')
    local dst_password=$(echo $dst_conn | grep -oP '(?<=:)([^:@/]+)(?=@)')
    local dst_host=$(echo $dst_conn | grep -oP '(?<=@)([^:/]+)')
    local dst_port=$(echo $dst_conn | grep -oP '(?<=:)(\d+)(?=/)')
    local dst_dbname=$(echo $dst_conn | grep -oP '(?<=/)[^/?]+')
    
    # 导出和导入
    PGPASSWORD="$src_password" pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_dbname" --table="$table" -f "/tmp/$table.sql"
    PGPASSWORD="$dst_password" psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_dbname" -f "/tmp/$table.sql"
    
    # 清理临时文件
    rm -f "/tmp/$table.sql"
  fi
  
  if [ $? -eq 0 ]; then
    info "表 $table 迁移成功 ✓"
  else
    error "表 $table 迁移失败，请检查错误"
    return 1
  fi
}

# 完整数据库迁移
migrate_full_database() {
  local src_conn="$1"
  local dst_conn="$2"
  
  step "执行完整数据库迁移"
  
  # 解析源连接字符串获取数据库名
  local src_dbname=$(echo $src_conn | grep -oP '(?<=/)[^/?]+')
  # 解析目标连接字符串获取数据库名
  local dst_dbname=$(echo $dst_conn | grep -oP '(?<=/)[^/?]+')
  
  info "从 $src_dbname 迁移到 $dst_dbname"
  
  if [ "$USE_DOCKER" = true ]; then
    # 使用Docker容器执行迁移
    info "使用Docker容器执行完整数据库迁移..."
    docker run --rm postgres:15-alpine pg_dump "$src_conn" --clean --if-exists | docker run --rm -i postgres:15-alpine psql "$dst_conn"
  else
    # 解析源连接字符串
    local src_user=$(echo $src_conn | grep -oP '(?<=://)([^:]+)')
    local src_password=$(echo $src_conn | grep -oP '(?<=:)([^:@/]+)(?=@)')
    local src_host=$(echo $src_conn | grep -oP '(?<=@)([^:/]+)')
    local src_port=$(echo $src_conn | grep -oP '(?<=:)(\d+)(?=/)')
    
    # 解析目标连接字符串
    local dst_user=$(echo $dst_conn | grep -oP '(?<=://)([^:]+)')
    local dst_password=$(echo $dst_conn | grep -oP '(?<=:)([^:@/]+)(?=@)')
    local dst_host=$(echo $dst_conn | grep -oP '(?<=@)([^:/]+)')
    local dst_port=$(echo $dst_conn | grep -oP '(?<=:)(\d+)(?=/)')
    
    # 使用本地PostgreSQL客户端执行迁移
    info "使用本地PostgreSQL客户端执行完整数据库迁移..."
    PGPASSWORD="$src_password" pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_dbname" --clean --if-exists | PGPASSWORD="$dst_password" psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_dbname"
  fi
  
  if [ $? -eq 0 ]; then
    info "完整数据库迁移成功! ✓"
  else
    error "数据库迁移失败，请检查错误"
    return 1
  fi
}

# 主函数
main() {
  # 检查必要的工具
  check_postgres_client
  check_docker
  
  # 欢迎信息
  echo ""
  info "===== PostgreSQL 数据库迁移工具 ====="
  echo ""
  
  # 获取源数据库连接信息
  info "请输入源数据库连接字符串 (格式: postgresql://user:password@host:port/dbname)"
  read -r SRC_CONN_STRING
  
  # 获取目标数据库连接信息
  info "请输入目标数据库连接字符串 (格式: postgresql://user:password@host:port/dbname)"
  read -r DST_CONN_STRING
  
  # 解析源数据库名
  SRC_DB_NAME=$(echo $SRC_CONN_STRING | grep -oP '(?<=/)[^/?]+')
  
  # 解析目标数据库名
  DST_DB_NAME=$(echo $DST_CONN_STRING | grep -oP '(?<=/)[^/?]+')
  
  # 显示连接信息
  echo ""
  info "源数据库连接信息:"
  parse_connection_string "$SRC_CONN_STRING"
  echo ""
  info "目标数据库连接信息:"
  parse_connection_string "$DST_CONN_STRING"
  echo ""
  
  # 测试连接
  info "测试源数据库连接..."
  if ! test_connection "$SRC_CONN_STRING" "$SRC_DB_NAME"; then
    error "无法连接到源数据库，请检查连接字符串"
    exit 1
  fi
  info "源数据库连接测试成功 ✓"
  
  info "测试目标数据库连接..."
  if ! test_connection "$DST_CONN_STRING" "$DST_DB_NAME"; then
    error "无法连接到目标数据库，请检查连接字符串"
    exit 1
  fi
  info "目标数据库连接测试成功 ✓"
  
  # 询问迁移类型
  info "请选择迁移类型:"
  echo "1) 完整数据库迁移"
  echo "2) 选择性表迁移"
  read -r MIGRATION_TYPE
  
  case $MIGRATION_TYPE in
    1)
      # 确认操作
      warn "这将覆盖目标数据库中的所有数据。是否继续? (y/n)"
      read -r CONFIRM
      if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        migrate_full_database "$SRC_CONN_STRING" "$DST_CONN_STRING"
      else
        info "操作已取消"
        exit 0
      fi
      ;;
    2)
      # 获取源数据库中的表
      info "获取源数据库中的表列表..."
      TABLES=($(get_tables "$SRC_CONN_STRING" "$SRC_DB_NAME"))
      
      if [ ${#TABLES[@]} -eq 0 ]; then
        warn "源数据库中没有找到表"
        exit 1
      fi
      
      # 显示表列表
      info "源数据库中的表:"
      for i in "${!TABLES[@]}"; do
        echo "$((i+1))) ${TABLES[$i]}"
      done
      
      # 询问要迁移的表
      info "请输入要迁移的表编号 (用空格分隔多个表编号，输入 'all' 迁移所有表):"
      read -r TABLE_SELECTION
      
      if [ "$TABLE_SELECTION" == "all" ]; then
        # 迁移所有表
        warn "这将覆盖目标数据库中的所有表数据。是否继续? (y/n)"
        read -r CONFIRM
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
          for table in "${TABLES[@]}"; do
            migrate_table "$SRC_CONN_STRING" "$DST_CONN_STRING" "$table"
          done
        else
          info "操作已取消"
          exit 0
        fi
      else
        # 迁移选定的表
        SELECTED_INDICES=($TABLE_SELECTION)
        SELECTED_TABLES=()
        
        for index in "${SELECTED_INDICES[@]}"; do
          # 调整为0基索引
          idx=$((index-1))
          if [ $idx -ge 0 ] && [ $idx -lt ${#TABLES[@]} ]; then
            SELECTED_TABLES+=(${TABLES[$idx]})
          else
            warn "无效的表编号: $index"
          fi
        done
        
        if [ ${#SELECTED_TABLES[@]} -eq 0 ]; then
          error "没有有效的表被选中"
          exit 1
        fi
        
        # 确认操作
        warn "这将覆盖目标数据库中的以下表: ${SELECTED_TABLES[*]}。是否继续? (y/n)"
        read -r CONFIRM
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
          for table in "${SELECTED_TABLES[@]}"; do
            migrate_table "$SRC_CONN_STRING" "$DST_CONN_STRING" "$table"
          done
        else
          info "操作已取消"
          exit 0
        fi
      fi
      ;;
    *)
      error "无效的选择"
      exit 1
      ;;
  esac
  
  info "===== 数据库迁移完成 ====="
}

# 执行主函数
main
