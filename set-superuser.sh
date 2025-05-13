#!/bin/bash

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

# 从README_MIGRATE.md文件获取数据库连接字符串
README_FILE="README_MIGRATE.md"
if [ -f "$README_FILE" ]; then
  # 提取目标数据库连接字符串
  DST_CONN_STRING=$(grep -A 1 "目标数据库连接字符串" "$README_FILE" | tail -n 1)
  
  info "已从$README_FILE文件加载数据库配置"
else
  error "$README_FILE文件不存在，请确保您在正确的目录中"
  exit 1
fi

# 解析目标数据库连接字符串
if [[ "$DST_CONN_STRING" =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASSWORD="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
  
  # 移除可能的查询参数
  DB_NAME=$(echo "$DB_NAME" | cut -d'?' -f1)
else
  error "无法解析目标数据库连接字符串: $DST_CONN_STRING"
  exit 1
fi

# 确认当前用户
info "目标数据库主机: $DB_HOST"
info "目标数据库端口: $DB_PORT"
info "目标数据库名称: $DB_NAME"
info "目标数据库用户: $DB_USER"

# 提示输入超级用户信息
info "请输入PostgreSQL超级用户名 [默认: postgres]:"
echo -n "> "
read super_user
super_user=${super_user:-"postgres"}

info "请输入超级用户密码:"
echo -n "> "
read -s super_password
echo ""

# 使用超级用户连接到数据库
info "尝试使用超级用户连接到数据库..."

# 创建一个临时SQL文件
SQL_FILE=$(mktemp)
echo "SELECT current_user, current_database();" > "$SQL_FILE"

# 使用Docker执行SQL命令
docker run --rm -v "$SQL_FILE:/tmp/test.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/test.sql" > /tmp/test_output 2>&1

# 检查连接结果
if grep -q "ERROR:" /tmp/test_output || grep -q "fe_sendauth" /tmp/test_output; then
  error "无法使用超级用户连接到数据库:"
  cat /tmp/test_output
  rm "$SQL_FILE" /tmp/test_output
  exit 1
fi

info "连接成功!"
cat /tmp/test_output
rm "$SQL_FILE" /tmp/test_output

# 验证用户是否真的有超级用户权限
info "验证 $super_user 用户是否有超级用户权限..."
SQL_FILE=$(mktemp)
echo "SELECT usesuper FROM pg_user WHERE usename = '$super_user';" > "$SQL_FILE"
docker run --rm -v "$SQL_FILE:/tmp/check_super.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/check_super.sql" > /tmp/check_super_output 2>&1

if grep -q "ERROR:" /tmp/check_super_output; then
  error "验证超级用户权限时出错:"
  cat /tmp/check_super_output
  rm "$SQL_FILE" /tmp/check_super_output
  exit 1
fi

IS_SUPERUSER=false
if grep -q "t" /tmp/check_super_output; then
  info "$super_user 用户有超级用户权限"
  IS_SUPERUSER=true
else
  warn "$super_user 用户没有超级用户权限，将使用替代方案"
fi
rm "$SQL_FILE" /tmp/check_super_output

# 检查数据库是否存在
info "检查数据库 $DB_NAME 是否存在..."
SQL_FILE=$(mktemp)
echo "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" > "$SQL_FILE"
docker run --rm -v "$SQL_FILE:/tmp/check.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/check.sql" > /tmp/check_output 2>&1

if grep -q "ERROR:" /tmp/check_output; then
  error "检查数据库时出错:"
  cat /tmp/check_output
  rm "$SQL_FILE" /tmp/check_output
  exit 1
fi

if ! grep -q "(1 row)" /tmp/check_output; then
  info "数据库 $DB_NAME 不存在，正在创建..."
  SQL_FILE2=$(mktemp)
  echo "CREATE DATABASE $DB_NAME;" > "$SQL_FILE2"
  docker run --rm -v "$SQL_FILE2:/tmp/create.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/create.sql" > /tmp/create_output 2>&1
  
  if grep -q "ERROR:" /tmp/create_output; then
    error "创建数据库时出错:"
    cat /tmp/create_output
    rm "$SQL_FILE" "$SQL_FILE2" /tmp/check_output /tmp/create_output
    exit 1
  fi
  
  info "数据库 $DB_NAME 创建成功"
  rm "$SQL_FILE2" /tmp/create_output
else
  info "数据库 $DB_NAME 已存在"
fi
rm "$SQL_FILE" /tmp/check_output

# 检查用户是否存在
info "检查用户 $DB_USER 是否存在..."
SQL_FILE=$(mktemp)
echo "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER';" > "$SQL_FILE"
docker run --rm -v "$SQL_FILE:/tmp/user_check.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/user_check.sql" > /tmp/user_check_output 2>&1

if grep -q "ERROR:" /tmp/user_check_output; then
  error "检查用户时出错:"
  cat /tmp/user_check_output
  rm "$SQL_FILE" /tmp/user_check_output
  exit 1
fi

if ! grep -q "(1 row)" /tmp/user_check_output; then
  info "用户 $DB_USER 不存在，正在创建..."
  SQL_FILE2=$(mktemp)
  echo "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > "$SQL_FILE2"
  docker run --rm -v "$SQL_FILE2:/tmp/user_create.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/user_create.sql" > /tmp/user_create_output 2>&1
  
  if grep -q "ERROR:" /tmp/user_create_output; then
    error "创建用户时出错:"
    cat /tmp/user_create_output
    rm "$SQL_FILE" "$SQL_FILE2" /tmp/user_check_output /tmp/user_create_output
    exit 1
  fi
  
  info "用户 $DB_USER 创建成功"
  rm "$SQL_FILE2" /tmp/user_create_output
else
  info "用户 $DB_USER 已存在"
fi
rm "$SQL_FILE" /tmp/user_check_output

# 将用户设置为超级用户或授予必要权限
if [ "$IS_SUPERUSER" = true ]; then
  info "将用户 $DB_USER 设置为超级用户..."
  SQL_FILE=$(mktemp)
  echo "ALTER USER $DB_USER WITH SUPERUSER;" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/set_super.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/set_super.sql" > /tmp/set_super_output 2>&1

  if grep -q "ERROR:" /tmp/set_super_output; then
    error "设置超级用户权限时出错:"
    cat /tmp/set_super_output
    rm "$SQL_FILE" /tmp/set_super_output
    exit 1
  fi

  info "用户 $DB_USER 已成功设置为超级用户"
  rm "$SQL_FILE" /tmp/set_super_output
else
  # 替代方案：授予必要的数据库权限而不是超级用户权限
  info "授予用户 $DB_USER 对数据库 $DB_NAME 的必要权限..."
  SQL_FILE=$(mktemp)
  
  # 如果数据库存在，授予所有权限
  echo "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/grant.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/grant.sql" > /tmp/grant_output 2>&1
  
  if grep -q "ERROR:" /tmp/grant_output; then
    warn "授予数据库权限时出错，尝试其他方法:"
    cat /tmp/grant_output
  else
    info "已授予数据库权限"
  fi
  
  # 连接到数据库并授予schema权限
  echo "\\c $DB_NAME;\nGRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $DB_USER;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO $DB_USER;\nALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO $DB_USER;" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/grant_schema.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d $DB_NAME -f /tmp/grant_schema.sql" > /tmp/grant_schema_output 2>&1
  
  if grep -q "ERROR:" /tmp/grant_schema_output; then
    warn "授予schema权限时出错，可能需要手动设置:"
    cat /tmp/grant_schema_output
  else
    info "已授予schema权限"
  fi
  
  # 尝试授予创建数据库的权限
  echo "ALTER USER $DB_USER WITH CREATEDB;" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/createdb.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/createdb.sql" > /tmp/createdb_output 2>&1
  
  if grep -q "ERROR:" /tmp/createdb_output; then
    warn "授予创建数据库权限时出错，可能需要手动设置:"
    cat /tmp/createdb_output
  else
    info "已授予创建数据库权限"
  fi
  
  info "已尽可能授予用户 $DB_USER 所需的权限"
  rm "$SQL_FILE" /tmp/grant_output /tmp/grant_schema_output /tmp/createdb_output 2>/dev/null
fi

# 验证用户权限
info "验证用户权限..."
SQL_FILE=$(mktemp)

if [ "$IS_SUPERUSER" = true ]; then
  echo "SELECT usename, usesuper FROM pg_user WHERE usename = '$DB_USER';" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/verify.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/verify.sql" > /tmp/verify_output 2>&1
  
  if grep -q "ERROR:" /tmp/verify_output; then
    error "验证用户权限时出错:"
    cat /tmp/verify_output
    rm "$SQL_FILE" /tmp/verify_output
    exit 1
  fi
  
  info "用户权限验证结果:"
  cat /tmp/verify_output
else
  # 验证数据库权限
  echo "\\c $DB_NAME;\nSELECT has_database_privilege('$DB_USER', '$DB_NAME', 'CONNECT') as can_connect,\n       has_database_privilege('$DB_USER', '$DB_NAME', 'CREATE') as can_create,\n       has_schema_privilege('$DB_USER', 'public', 'USAGE') as can_use_schema,\n       has_schema_privilege('$DB_USER', 'public', 'CREATE') as can_create_in_schema;" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/verify.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d $DB_NAME -f /tmp/verify.sql" > /tmp/verify_output 2>&1
  
  if grep -q "ERROR:" /tmp/verify_output; then
    warn "验证数据库权限时出错，可能需要手动验证:"
    cat /tmp/verify_output
  else
    info "数据库权限验证结果:"
    cat /tmp/verify_output
  fi
  
  # 验证创建数据库权限
  echo "SELECT rolcreatedb FROM pg_roles WHERE rolname = '$DB_USER';" > "$SQL_FILE"
  docker run --rm -v "$SQL_FILE:/tmp/verify_createdb.sql" postgres:16-alpine sh -c "PGPASSWORD='$super_password' psql -h $DB_HOST -p $DB_PORT -U $super_user -d postgres -f /tmp/verify_createdb.sql" > /tmp/verify_createdb_output 2>&1
  
  if grep -q "ERROR:" /tmp/verify_createdb_output; then
    warn "验证创建数据库权限时出错:"
    cat /tmp/verify_createdb_output
  else
    info "创建数据库权限验证结果:"
    cat /tmp/verify_createdb_output
  fi
fi

rm "$SQL_FILE" /tmp/verify_output /tmp/verify_createdb_output 2>/dev/null

info "安全设置完成!"
if [ "$IS_SUPERUSER" = true ]; then
  info "用户 $DB_USER 已设置为超级用户"
else
  info "已尽可能授予用户 $DB_USER 必要的数据库权限"  
fi

# 提供使用新凭据的示例
info "使用新凭据连接的示例:"
info "docker run --rm -e PGPASSWORD=\"$DB_PASSWORD\" postgres:16-alpine psql \"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\""

# 更新README_MIGRATE.md中的注意事项
info "更新README_MIGRATE.md中的注意事项..."
TEMP_README=$(mktemp)

if [ "$IS_SUPERUSER" = true ]; then
  # 如果有超级用户权限，使用超级用户命令
  awk -v user="$DB_USER" -v pass="$DB_PASSWORD" -v host="$DB_HOST" -v port="$DB_PORT" -v db="$DB_NAME" '
  /## 注意事项/ {
    print $0
    print "    # 使用超级用户创建数据库"
    print "    docker run --rm -it postgres:16-alpine sh -c \"PGPASSWORD='\''" pass "'\'' psql -h " host " -p " port " -U " user " -d postgres -c '\''CREATE DATABASE " db ";'\''\"" 
    print ""
    print "    # 使用超级用户清空数据库"
    print "    docker run --rm -it postgres:16-alpine sh -c \"PGPASSWORD='\''" pass "'\'' psql -h " host " -p " port " -U " user " -d " db " -c '\''DROP SCHEMA public CASCADE; CREATE SCHEMA public;'\''\"" 
    next
  }
  /docker run --rm -it postgres/ { next }
  { print }
  ' "$README_FILE" > "$TEMP_README"
else
  # 如果没有超级用户权限，使用标准权限命令
  awk -v user="$DB_USER" -v pass="$DB_PASSWORD" -v host="$DB_HOST" -v port="$DB_PORT" -v db="$DB_NAME" -v super_user="$super_user" -v super_pass="$super_password" '
  /## 注意事项/ {
    print $0
    print "    # 使用管理员用户创建数据库"
    print "    docker run --rm -it postgres:16-alpine sh -c \"PGPASSWORD='\''" super_pass "'\'' psql -h " host " -p " port " -U " super_user " -d postgres -c '\''CREATE DATABASE " db ";'\''\"" 
    print ""
    print "    # 使用标准用户连接数据库"
    print "    docker run --rm -it postgres:16-alpine sh -c \"PGPASSWORD='\''" pass "'\'' psql -h " host " -p " port " -U " user " -d " db "\"" 
    print ""
    print "    # 清空数据库架构（需要管理员权限）"
    print "    docker run --rm -it postgres:16-alpine sh -c \"PGPASSWORD='\''" super_pass "'\'' psql -h " host " -p " port " -U " super_user " -d " db " -c '\''DROP SCHEMA public CASCADE; CREATE SCHEMA public;'\''\"" 
    next
  }
  /docker run --rm -it postgres/ { next }
  { print }
  ' "$README_FILE" > "$TEMP_README"
fi

# 检查是否成功更新
if [ $? -eq 0 ]; then
  mv "$TEMP_README" "$README_FILE"
  if [ "$IS_SUPERUSER" = true ]; then
    info "README_MIGRATE.md已更新，添加了使用超级用户的命令示例"
  else
    info "README_MIGRATE.md已更新，添加了使用标准权限和管理员权限的命令示例"
  fi
else
  error "更新README_MIGRATE.md失败"
  rm "$TEMP_README"
fi

info "所有操作已完成!"
