#!/bin/bash
# PostgreSQL 数据库迁移脚本
# 作者: Lei

# 颜色设置
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 临时日志文件
temp_log_file="$(mktemp)"

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

# 测试连接函数
test_connection() {
  local conn_string="$1"
  local db_name="$2"
  local verbose="${3:-false}"
  
  # 使用更可靠的方法解析连接字符串
  # 先检查是否是postgresql://开头
  if [[ "$conn_string" == postgresql://* ]]; then
    # 提取用户名和密码部分 (postgresql://user:pass@host:port/db)
    local userpass=${conn_string#postgresql://}
    local userpass=${userpass%%@*}
    local user=${userpass%%:*}
    local password=""
    if [[ "$userpass" == *:* ]]; then
      password=${userpass#*:}
    fi
    local password_hidden="****"
    if [ ${#password} -gt 4 ]; then
      password_hidden="${password:0:4}****"
    fi
    
    # 提取主机和端口
    local hostport=${conn_string#*@}
    local hostport=${hostport%%/*}
    local host=${hostport%%:*}
    local port="5432"
    if [[ "$hostport" == *:* ]]; then
      port=${hostport#*:}
    fi
    
    # 提取数据库名
    if [ -z "$db_name" ]; then
      local dbpart=${conn_string#*@}
      local dbpart=${dbpart#*/}
      db_name=${dbpart%%\?*}
      if [[ "$dbpart" == "$dbpart" ]]; then
        db_name=$dbpart
      fi
    fi
  else
    user="unknown"
    password=""
    password_hidden="****"
    host="unknown"
    port="5432"
    if [ -z "$db_name" ]; then
      db_name="unknown"
    fi
  fi
  
  # 显示连接信息
  if [ "$verbose" = "true" ]; then
    info "测试连接到: $host:$port/$db_name (用户: $user, 密码: $password_hidden)"
  fi
  
  # 清空日志文件
  > "$temp_log_file"
  
  # 根据是否使用Docker执行不同的命令
  if [ "$USE_DOCKER" = true ]; then
    # 使用环境变量传递密码
    docker run --rm -e PGPASSWORD="$password" postgres:16-alpine psql -h "$host" -p "$port" -U "$user" -d "$db_name" -c "SELECT 1;" > "$temp_log_file" 2>&1
  else
    PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$db_name" -c "SELECT 1;" > "$temp_log_file" 2>&1
  fi
  
  local result=$?
  
  # 如果连接失败且要求详细输出
  if [ $result -ne 0 ] && [ "$verbose" = "true" ]; then
    error "连接失败，错误详情:"
    cat "$temp_log_file"
    
    # 分析常见错误并提供建议
    if grep -q "could not translate host" "$temp_log_file"; then
      error "主机名 '$host' 无法解析。请检查主机名是否正确或尝试使用IP地址。"
    elif grep -q "connection refused" "$temp_log_file"; then
      error "连接被拒绝。请确认PostgreSQL服务器正在运行并且在端口 $port 上监听。"
      error "请检查防火墙设置并确保端口 $port 已开放。"
    elif grep -q "password authentication failed" "$temp_log_file"; then
      error "密码验证失败。请检查用户名 '$user' 和密码是否正确。"
    elif grep -q "role.*does not exist" "$temp_log_file"; then
      error "用户 '$user' 不存在。请在数据库中创建该用户或使用现有用户。"
    elif grep -q "database.*does not exist" "$temp_log_file"; then
      error "数据库 '$db_name' 不存在。"
      
      # 询问是否创建数据库
      warn "是否创建数据库 $db_name?"
      echo -n "请输入 (y/n): "
      read CREATE_DB
      # 如果用户没有输入，默认为'n'
      CREATE_DB=${CREATE_DB:-n}
      info "用户选择: $CREATE_DB"
      
      if [[ "$CREATE_DB" =~ ^[Yy]$ ]]; then
        info "正在创建数据库 $db_name..."
        
        # 构建连接到postgres数据库的连接字符串
        local postgres_conn="postgresql://$user:$password@$host:$port/postgres"
        
        if [ "$USE_DOCKER" = true ]; then
          # 使用环境变量传递密码
          docker run --rm -e PGPASSWORD="$password" postgres:16-alpine psql -h "$host" -p "$port" -U "$user" -d "postgres" -c "CREATE DATABASE $db_name;" > "$temp_log_file" 2>&1
        else
          PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "postgres" -c "CREATE DATABASE $db_name;" > "$temp_log_file" 2>&1
        fi
        
        local create_result=$?
        if [ $create_result -eq 0 ]; then
          info "数据库 $db_name 创建成功 ✓"
          info "重新测试连接..."
          
          # 重新测试连接
          > "$temp_log_file"  # 清空日志文件
          if [ "$USE_DOCKER" = true ]; then
            # 使用环境变量传递密码
            docker run --rm -e PGPASSWORD="$password" postgres:16-alpine psql -h "$host" -p "$port" -U "$user" -d "$db_name" -c "SELECT 1;" > "$temp_log_file" 2>&1
          else
            PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$db_name" -c "SELECT 1;" > "$temp_log_file" 2>&1
          fi
          
          local new_result=$?
          if [ $new_result -eq 0 ]; then
            info "连接到新创建的数据库成功 ✓"
            return 0
          else
            error "无法连接到新创建的数据库，请检查错误"
            cat "$temp_log_file"
          fi
        else
          error "创建数据库失败，请检查错误:"
          cat "$temp_log_file"
          info "手动创建数据库的命令:"
          if [ "$USE_DOCKER" = true ]; then
            info "docker run --rm -it postgres:16-alpine psql '$postgres_conn' -c 'CREATE DATABASE $db_name;'"
          else
            info "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d 'postgres' -c 'CREATE DATABASE $db_name;'"
          fi
        fi
      else
        info "已取消创建数据库。请手动创建数据库后重新运行迁移脚本。"
        info "手动创建数据库的命令:"
        if [ "$USE_DOCKER" = true ]; then
          info "docker run --rm -it postgres:16-alpine psql 'postgresql://$user:$password@$host:$port/postgres' -c 'CREATE DATABASE $db_name;'"
        else
          info "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d 'postgres' -c 'CREATE DATABASE $db_name;'"
        fi
      fi
    elif grep -q "network is unreachable" "$temp_log_file"; then
      error "网络不可达。如果使用Docker，请检查Docker网络设置。如果是远程服务器，请检查网络连接和VPN设置。"
    fi
  fi
  
  return $result
}

# 解析连接字符串函数
parse_connection_string() {
  local conn_string="$1"
  
  # 使用更可靠的方法解析连接字符串
  if [[ "$conn_string" == postgresql://* ]]; then
    # 提取用户名和密码部分 (postgresql://user:pass@host:port/db)
    local userpass=${conn_string#postgresql://}
    local userpass=${userpass%%@*}
    local user=${userpass%%:*}
    local password=""
    if [[ "$userpass" == *:* ]]; then
      password=${userpass#*:}
    fi
    local password_hidden="****"
    if [ ${#password} -gt 4 ]; then
      password_hidden="${password:0:4}****"
    fi
    
    # 提取主机和端口
    local hostport=${conn_string#*@}
    local hostport=${hostport%%/*}
    local host=${hostport%%:*}
    local port="5432"
    if [[ "$hostport" == *:* ]]; then
      port=${hostport#*:}
    fi
    
    # 提取数据库名
    local dbpart=${conn_string#*@}
    local dbpart=${dbpart#*/}
    local db_name=${dbpart%%\?*}
    if [[ "$dbpart" == "$db_name" ]]; then
      db_name=$dbpart
    fi
  else
    local user="unknown"
    local password_hidden="****"
    local host="unknown"
    local port="5432"
    local db_name="unknown"
  fi
  
  echo "  主机: $host"
  echo "  端口: $port"
  echo "  用户: $user"
  echo "  密码: $password_hidden"
  echo "  数据库: $db_name"
}

# 获取表列表
get_tables() {
  local conn_string="$1"
  local db_name="$2"
  local tables_list=""
  
  if [ "$USE_DOCKER" = true ]; then
    tables_list=$(docker run --rm postgres:16-alpine psql "$conn_string" -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | grep -v "^$" | sed 's/^ *//')
  else
    # 使用更可靠的方法解析连接字符串
    local user="unknown"
    local password=""
    local host="localhost"
    local port="5432"
    
    if [[ "$conn_string" == postgresql://* ]]; then
      # 提取用户名和密码
      local userpass=${conn_string#postgresql://}
      local userpass=${userpass%%@*}
      user=${userpass%%:*}
      if [[ "$userpass" == *:* ]]; then
        password=${userpass#*:}
      fi
      
      # 提取主机和端口
      local hostport=${conn_string#*@}
      local hostport=${hostport%%/*}
      host=${hostport%%:*}
      if [[ "$hostport" == *:* ]]; then
        port=${hostport#*:}
      fi
    fi
    
    tables_list=$(PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$db_name" -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" | grep -v "^$" | sed 's/^ *//')
  fi
  
  echo "$tables_list"
}

# 迁移单个表
migrate_table() {
  local src_conn="$1"
  local dst_conn="$2"
  local table_name="$3"
  local temp_dump_file="/tmp/pg_dump_${table_name}_$$.sql"
  
  step "迁移表: $table_name"
  
  # 提取源连接信息
  local src_user="unknown"
  local src_password=""
  local src_host="localhost"
  local src_port="5432"
  local src_db="unknown"
  
  if [[ "$src_conn" == postgresql://* ]]; then
    # 提取用户名和密码
    local userpass=${src_conn#postgresql://}
    local userpass=${userpass%%@*}
    src_user=${userpass%%:*}
    if [[ "$userpass" == *:* ]]; then
      src_password=${userpass#*:}
    fi
    
    # 提取主机和端口
    local hostport=${src_conn#*@}
    local hostport=${hostport%%/*}
    src_host=${hostport%%:*}
    if [[ "$hostport" == *:* ]]; then
      src_port=${hostport#*:}
    fi
    
    # 提取数据库名
    local dbpart=${src_conn#*@}
    local dbpart=${dbpart#*/}
    src_db=${dbpart%%\?*}
    if [[ "$dbpart" == "$src_db" ]]; then
      src_db=$dbpart
    fi
  fi
  
  # 提取目标连接信息
  local dst_user="unknown"
  local dst_password=""
  local dst_host="localhost"
  local dst_port="5432"
  local dst_db="unknown"
  
  if [[ "$dst_conn" == postgresql://* ]]; then
    # 提取用户名和密码
    local userpass=${dst_conn#postgresql://}
    local userpass=${userpass%%@*}
    dst_user=${userpass%%:*}
    if [[ "$userpass" == *:* ]]; then
      dst_password=${userpass#*:}
    fi
    
    # 提取主机和端口
    local hostport=${dst_conn#*@}
    local hostport=${hostport%%/*}
    dst_host=${hostport%%:*}
    if [[ "$hostport" == *:* ]]; then
      dst_port=${hostport#*:}
    fi
    
    # 提取数据库名
    local dbpart=${dst_conn#*@}
    local dbpart=${dbpart#*/}
    dst_db=${dbpart%%\?*}
    if [[ "$dbpart" == "$dst_db" ]]; then
      dst_db=$dbpart
    fi
  fi
  
  # 导出表
  info "导出表 $table_name 从 $src_host/$src_db..."
  if [ "$USE_DOCKER" = true ]; then
    # 使用环境变量传递密码
    docker run --rm -e PGPASSWORD="$src_password" postgres:16-alpine pg_dump --no-owner --no-acl -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" -t "$table_name" -f "/tmp/$table_name.sql" > /dev/null 2>&1
    docker cp $(docker ps -lq):/tmp/$table_name.sql "$temp_dump_file"
  else
    PGPASSWORD="$src_password" pg_dump --no-owner --no-acl -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" -t "$table_name" -f "$temp_dump_file" > /dev/null 2>&1
  fi
  
  if [ ! -f "$temp_dump_file" ] || [ ! -s "$temp_dump_file" ]; then
    error "导出表 $table_name 失败"
    return 1
  fi
  
  # 导入表
  info "导入表 $table_name 到 $dst_host/$dst_db..."
  if [ "$USE_DOCKER" = true ]; then
    docker cp "$temp_dump_file" $(docker ps -lq):/tmp/$table_name.sql
    # 使用环境变量传递密码
    docker run --rm -e PGPASSWORD="$dst_password" postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" -f "/tmp/$table_name.sql" > /dev/null 2>&1
  else
    PGPASSWORD="$dst_password" psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" -f "$temp_dump_file" > /dev/null 2>&1
  fi
  
  local result=$?
  rm -f "$temp_dump_file"
  
  if [ $result -eq 0 ]; then
    info "表 $table_name 迁移成功 ✓"
    return 0
  else
    error "表 $table_name 迁移失败"
    return 1
  fi
}

# 完整数据库迁移
migrate_full_database() {
  local src_conn="$1"
  local dst_conn="$2"
  local start_time=$(date +%s)
  
  step "执行完整数据库迁移"
  
  # 提取源连接信息
  local src_user="unknown"
  local src_password=""
  local src_host="localhost"
  local src_port="5432"
  local src_db="unknown"
  
  if [[ "$src_conn" == postgresql://* ]]; then
    # 提取用户名和密码
    local userpass=${src_conn#postgresql://}
    local userpass=${userpass%%@*}
    src_user=${userpass%%:*}
    if [[ "$userpass" == *:* ]]; then
      src_password=${userpass#*:}
    fi
    
    # 提取主机和端口
    local hostport=${src_conn#*@}
    local hostport=${hostport%%/*}
    src_host=${hostport%%:*}
    if [[ "$hostport" == *:* ]]; then
      src_port=${hostport#*:}
    fi
    
    # 提取数据库名
    local dbpart=${src_conn#*@}
    local dbpart=${dbpart#*/}
    src_db=${dbpart%%\?*}
    if [[ "$dbpart" == "$src_db" ]]; then
      src_db=$dbpart
    fi
  fi
  
  # 提取目标连接信息
  local dst_user="unknown"
  local dst_password=""
  local dst_host="localhost"
  local dst_port="5432"
  local dst_db="unknown"
  
  if [[ "$dst_conn" == postgresql://* ]]; then
    # 提取用户名和密码
    local userpass=${dst_conn#postgresql://}
    local userpass=${userpass%%@*}
    dst_user=${userpass%%:*}
    if [[ "$userpass" == *:* ]]; then
      dst_password=${userpass#*:}
    fi
    
    # 提取主机和端口
    local hostport=${dst_conn#*@}
    local hostport=${hostport%%/*}
    dst_host=${hostport%%:*}
    if [[ "$hostport" == *:* ]]; then
      dst_port=${hostport#*:}
    fi
    
    # 提取数据库名
    local dbpart=${dst_conn#*@}
    local dbpart=${dbpart#*/}
    dst_db=${dbpart%%\?*}
    if [[ "$dbpart" == "$dst_db" ]]; then
      dst_db=$dbpart
    fi
  fi
  
  local temp_dump_file="/tmp/pg_dump_full_$$.sql"
  
  # 导出完整数据库
  info "使用Docker容器执行完整数据库迁移..."
  if [ "$USE_DOCKER" = true ]; then
    # 使用环境变量传递密码
    docker run --rm -e PGPASSWORD="$src_password" postgres:16-alpine pg_dump --no-owner --no-acl -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" | \
    docker run -i --rm -e PGPASSWORD="$dst_password" postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" > "$temp_log_file" 2>&1
  else
    PGPASSWORD="$src_password" pg_dump --no-owner --no-acl -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" | \
    PGPASSWORD="$dst_password" psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" > "$temp_log_file" 2>&1
  fi
  
  local result=$?
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # 检查迁移结果
  if [ $result -eq 0 ]; then
    if grep -q "ERROR:" "$temp_log_file" || grep -q "error:" "$temp_log_file"; then
      error "数据库迁移过程中发生错误，请检查以下日志:"
      cat "$temp_log_file"
      return 1
    else
      # 获取源数据库和目标数据库的表数量进行比较
      local src_tables_count=$(get_tables "$src_conn" "$src_db" | wc -l)
      local dst_tables_count=$(get_tables "$dst_conn" "$dst_db" | wc -l)
      
      info "迁移完成! 耗时: $duration 秒"
      info "源数据库表数量: $src_tables_count"
      info "目标数据库表数量: $dst_tables_count"
      
      if [ "$src_tables_count" -eq "$dst_tables_count" ]; then
        info "表数量一致，迁移成功 ✓"
      else
        warn "表数量不一致，可能有部分表未成功迁移"
      fi
      
      return 0
    fi
  else
    error "数据库迁移失败，请检查错误"
    cat "$temp_log_file"
    return 1
  fi
}

# 主函数
main() {
  # 先检查Docker，如果可用则优先使用Docker
  check_docker
  
  # 只有当Docker不可用时才检查PostgreSQL客户端
  if [ "$USE_DOCKER" = false ]; then
    check_postgres_client
  fi
  
  # 欢迎信息
  echo ""
  info "===== PostgreSQL 数据库迁移工具 ====="
  
  # 读取连接字符串
  if [ -f "README_MIGRATE.md" ]; then
    # 使用grep查找以postgresql://开头的行
    SRC_CONN_STRING=$(grep -m 1 "^postgresql://" README_MIGRATE.md | tr -d '\r')
    DST_CONN_STRING=$(grep -m 2 "^postgresql://" README_MIGRATE.md | tail -n 1 | tr -d '\r')
  else
    # 如果没有配置文件，要求用户输入
    echo "请输入源数据库连接字符串 (格式: postgresql://user:password@host:port/dbname)"
    read -r SRC_CONN_STRING
    echo "请输入目标数据库连接字符串 (格式: postgresql://user:password@host:port/dbname)"
    read -r DST_CONN_STRING
  fi
  
  # 提取数据库名称
  SRC_DB_NAME=$(echo $SRC_CONN_STRING | sed -E 's|^postgresql://[^/]+/([^?]+).*$|\1|' || echo "unknown")
  DST_DB_NAME=$(echo $DST_CONN_STRING | sed -E 's|^postgresql://[^/]+/([^?]+).*$|\1|' || echo "unknown")
  
  # 显示连接信息
  SRC_HOST=$(echo $SRC_CONN_STRING | sed -E 's|^postgresql://[^@]+@([^:/]+).*$|\1|' || echo "unknown")
  DST_HOST=$(echo $DST_CONN_STRING | sed -E 's|^postgresql://[^@]+@([^:/]+).*$|\1|' || echo "unknown")
  
  info "源数据库: $SRC_HOST/$SRC_DB_NAME"
  info "目标数据库: $DST_HOST/$DST_DB_NAME"
  
  # 测试连接
  info "测试源数据库连接..."
  if ! test_connection "$SRC_CONN_STRING" "$SRC_DB_NAME" "true"; then
    error "无法连接到源数据库，请检查上面的错误信息和建议"
    exit 1
  fi
  info "源数据库连接测试成功 ✓"
  
  info "测试目标数据库连接..."
  if ! test_connection "$DST_CONN_STRING" "$DST_DB_NAME" "true"; then
    error "无法连接到目标数据库，请检查上面的错误信息和建议"
    exit 1
  fi
  info "目标数据库连接测试成功 ✓"
  
  # 询问迁移类型
  info "请选择迁移类型:"
  echo "1) 完整数据库迁移"
  echo "2) 选择性表迁移"
  echo -n "请输入选项编号 (1 或 2): "
  read MIGRATION_TYPE
  
  # 如果用户没有输入，默认选择1
  MIGRATION_TYPE=${MIGRATION_TYPE:-1}
  info "选择了选项: $MIGRATION_TYPE"
  
  case $MIGRATION_TYPE in
    1)
      # 确认操作
      warn "这将覆盖目标数据库中的所有数据。是否继续?"
      echo -n "请输入 (y/n): "
      read CONFIRM
      # 如果用户没有输入，默认为'n'
      CONFIRM=${CONFIRM:-n}
      info "用户选择: $CONFIRM"
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
      echo -n "请输入表编号或 'all': "
      read TABLE_SELECTION
      # 如果用户没有输入，默认为'all'
      TABLE_SELECTION=${TABLE_SELECTION:-all}
      info "用户选择表: $TABLE_SELECTION"
      
      if [ "$TABLE_SELECTION" == "all" ]; then
        # 确认操作
        warn "这将覆盖目标数据库中的所有表数据。是否继续?"
        echo -n "请输入 (y/n): "
        read CONFIRM
        # 如果用户没有输入，默认为'n'
        CONFIRM=${CONFIRM:-n}
        info "用户选择: $CONFIRM"
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