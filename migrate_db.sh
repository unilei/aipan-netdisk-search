#!/bin/bash

# 数据库迁移脚本 - AIPan网盘搜索应用
# 该脚本将源数据库的内容迁移到目标数据库，并提供各种辅助功能
# 支持完整的Prisma schema结构，包括用户、资源、博客、论坛、聊天、签到、导航等模块

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # 无颜色

# 源数据库和目标数据库连接字符串
SRC_CONN_STRING="${SRC_CONN_STRING:-}"
DST_CONN_STRING="${DST_CONN_STRING:-}"

if [ -z "$SRC_CONN_STRING" ] || [ -z "$DST_CONN_STRING" ]; then
    echo -e "${RED}错误: SRC_CONN_STRING 和 DST_CONN_STRING 环境变量是必填项。${NC}" >&2
    echo "示例: SRC_CONN_STRING='postgresql://user:password@source-host:5432/db' DST_CONN_STRING='postgresql://user:password@target-host:5432/db' ./migrate_db.sh" >&2
    exit 1
fi

# Prisma schema 表列表（按依赖关系排序）
PRISMA_TABLES=(
    "User"
    "ResourceType"
    "Resource"
    "PostCategory"
    "Post"
    "PostToCategory"
    "Alist"
    "Comment"
    "BlogCategory"
    "BlogPost"
    "BlogPostToCategory"
    "UserResource"
    "SystemSettings"
    "SearchRecord"
    "UserVodConfig"
    "ForumCategory"
    "ForumTopic"
    "ForumPost"
    "Notification"
    "ChatRoom"
    "ChatRoomUser"
    "ChatMessage"
    "CheckIn"
    "PointsHistory"
    "NavigationCategory"
    "NavigationItem"
)

# 从连接字符串解析信息的函数
parse_conn_string() {
    local conn_string=$1
    
    # 使用正则表达式提取用户名、密码、主机、端口和数据库名
    local pattern="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+)"
    
    if [[ $conn_string =~ $pattern ]]; then
        echo "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" "${BASH_REMATCH[4]}" "${BASH_REMATCH[5]}"
    else
        echo "无法解析连接字符串: $conn_string" >&2
        return 1
    fi
}

# 解析源数据库连接字符串
read SRC_USER SRC_PASS SRC_HOST SRC_PORT SRC_DB <<< $(parse_conn_string "$SRC_CONN_STRING")

# 解析目标数据库连接字符串
read DST_USER DST_PASS DST_HOST DST_PORT DST_DB <<< $(parse_conn_string "$DST_CONN_STRING")

# 打印脚本信息
echo -e "${BLUE}=== AIPan网盘搜索应用 - 数据库迁移工具 ===${NC}"
echo -e "${BLUE}本工具将帮助您迁移PostgreSQL数据库内容${NC}"
echo ""
echo -e "${YELLOW}源数据库信息:${NC}"
echo "主机: $SRC_HOST"
echo "端口: $SRC_PORT"
echo "数据库: $SRC_DB"
echo "用户名: $SRC_USER"
echo ""
echo -e "${YELLOW}目标数据库信息:${NC}"
echo "主机: $DST_HOST"
echo "端口: $DST_PORT"
echo "数据库: $DST_DB"
echo "用户名: $DST_USER"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装。本脚本需要Docker来运行PostgreSQL客户端。${NC}"
    exit 1
fi

# 验证Prisma表结构函数
verify_prisma_tables() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local db_user=$4
    local db_pass=$5
    
    echo -e "${CYAN}验证Prisma表结构...${NC}"
    
    # 获取数据库中的所有表
    local existing_tables=$(docker run --rm -e PGPASSWORD="$db_pass" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" -t \
        -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")
    
    echo -e "${YELLOW}数据库中现有的表:${NC}"
    echo "$existing_tables" | sed 's/^[ \t]*//;s/[ \t]*$//' | grep -v '^$'
    
    echo -e "${YELLOW}Prisma schema中定义的表:${NC}"
    printf '%s\n' "${PRISMA_TABLES[@]}"
    
    # 检查缺失的表
    echo -e "${PURPLE}检查表结构完整性...${NC}"
    local missing_tables=()
    for table in "${PRISMA_TABLES[@]}"; do
        # 转换为小写进行比较（PostgreSQL表名通常是小写）
        local table_lower=$(echo "$table" | tr '[:upper:]' '[:lower:]')
        if ! echo "$existing_tables" | grep -qi "$table_lower"; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ 所有Prisma表都存在于数据库中${NC}"
        return 0
    else
        echo -e "${RED}✗ 发现缺失的表:${NC}"
        printf '%s\n' "${missing_tables[@]}"
        echo -e "${YELLOW}建议运行 'npx prisma db push' 或 'npx prisma migrate deploy' 来同步数据库结构${NC}"
        return 1
    fi
}

# 获取表数据统计函数
get_table_stats() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local db_user=$4
    local db_pass=$5
    
    echo -e "${CYAN}获取数据库表统计信息...${NC}"
    
    # 创建统计查询SQL
    cat > /tmp/table_stats.sql << 'EOF'
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
EOF

    # 执行统计查询
    docker run --rm -v /tmp/table_stats.sql:/table_stats.sql \
        -e PGPASSWORD="$db_pass" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" -f /table_stats.sql
}

# 按表迁移数据函数
migrate_table_by_table() {
    local src_host=$1
    local src_port=$2
    local src_db=$3
    local src_user=$4
    local src_pass=$5
    local dst_host=$6
    local dst_port=$7
    local dst_db=$8
    local dst_user=$9
    local dst_pass=${10}
    
    echo -e "${CYAN}开始按表迁移数据...${NC}"
    
    local success_count=0
    local error_count=0
    
    for table in "${PRISMA_TABLES[@]}"; do
        echo -e "${YELLOW}迁移表: $table${NC}"
        
        # 转换为小写（PostgreSQL约定）
        local table_lower=$(echo "$table" | tr '[:upper:]' '[:lower:]')
        
        # 检查源表是否存在
        local table_exists=$(docker run --rm -e PGPASSWORD="$src_pass" \
            postgres:16-alpine psql -h "$src_host" -p "$src_port" -d "$src_db" -U "$src_user" -t \
            -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_lower');")
        
        if echo "$table_exists" | grep -q "t"; then
            # 导出表数据
            echo "  导出 $table 数据..."
            docker run --rm -e PGPASSWORD="$src_pass" \
                postgres:16-alpine pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" \
                --table="$table_lower" --data-only --inserts --no-owner --no-acl > "/tmp/${table_lower}_data.sql"
            
            # 导入表数据
            if [ -s "/tmp/${table_lower}_data.sql" ]; then
                echo "  导入 $table 数据..."
                cat "/tmp/${table_lower}_data.sql" | docker run --rm -i -e PGPASSWORD="$dst_pass" \
                    postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" -q
                
                if [ $? -eq 0 ]; then
                    echo -e "  ${GREEN}✓ $table 迁移成功${NC}"
                    success_count=$((success_count + 1))
                else
                    echo -e "  ${RED}✗ $table 迁移失败${NC}"
                    error_count=$((error_count + 1))
                fi
            else
                echo -e "  ${YELLOW}⚠ $table 无数据或导出失败${NC}"
            fi
        else
            echo -e "  ${YELLOW}⚠ 源数据库中不存在表 $table${NC}"
        fi
        
        # 清理临时文件
        rm -f "/tmp/${table_lower}_data.sql"
    done
    
    echo -e "${BLUE}按表迁移完成: ${GREEN}$success_count 成功${NC}, ${RED}$error_count 失败${NC}"
}

# 测试数据库连接函数
test_database_connection() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local db_user=$4
    local db_pass=$5
    local db_label=$6
    
    echo -e "${CYAN}测试 $db_label 数据库连接...${NC}"
    echo "主机: $db_host:$db_port"
    echo "数据库: $db_name"
    echo "用户: $db_user"
    
    # 测试连接
    local result=$(docker run --rm -e PGPASSWORD="$db_pass" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" \
        -c "SELECT version();" 2>&1)
    
    if echo "$result" | grep -q "PostgreSQL"; then
        echo -e "${GREEN}✓ $db_label 数据库连接成功${NC}"
        echo "PostgreSQL版本: $(echo "$result" | grep PostgreSQL | head -1)"
        return 0
    else
        echo -e "${RED}✗ $db_label 数据库连接失败${NC}"
        echo "错误信息: $result"
        return 1
    fi
}

# 同步Prisma schema到数据库函数
sync_prisma_schema() {
    echo -e "${CYAN}同步Prisma schema到数据库...${NC}"
    
    # 检查是否在项目根目录
    if [ ! -f "prisma/schema.prisma" ]; then
        echo -e "${RED}错误: 未找到 prisma/schema.prisma 文件${NC}"
        echo -e "${YELLOW}请确保在项目根目录下运行此脚本${NC}"
        return 1
    fi
    
    # 检查是否安装了Node.js和npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未找到npm命令${NC}"
        echo -e "${YELLOW}请先安装Node.js和npm${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}选择同步方式:${NC}"
    echo "1) db push (推荐用于开发环境，直接同步schema)"
    echo "2) migrate deploy (推荐用于生产环境，应用已有的迁移文件)"
    echo "3) migrate dev (创建新的迁移文件并应用)"
    read -p "请选择 (1-3): " sync_choice
    
    case $sync_choice in
        1)
            echo -e "${YELLOW}执行 npx prisma db push...${NC}"
            npx prisma db push
            ;;
        2)
            echo -e "${YELLOW}执行 npx prisma migrate deploy...${NC}"
            npx prisma migrate deploy
            ;;
        3)
            read -p "请输入迁移名称: " migration_name
            echo -e "${YELLOW}执行 npx prisma migrate dev --name $migration_name...${NC}"
            npx prisma migrate dev --name "$migration_name"
            ;;
        *)
            echo -e "${RED}无效的选择${NC}"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Prisma schema同步成功${NC}"
        return 0
    else
        echo -e "${RED}✗ Prisma schema同步失败${NC}"
        return 1
    fi
}

# 数据完整性检查函数
check_data_integrity() {
    local src_host=$1
    local src_port=$2
    local src_db=$3
    local src_user=$4
    local src_pass=$5
    local dst_host=$6
    local dst_port=$7
    local dst_db=$8
    local dst_user=$9
    local dst_pass=${10}
    
    echo -e "${CYAN}执行数据完整性检查...${NC}"
    
    local total_errors=0
    
    for table in "${PRISMA_TABLES[@]}"; do
        local table_lower=$(echo "$table" | tr '[:upper:]' '[:lower:]')
        
        # 获取源表行数
        local src_count=$(docker run --rm -e PGPASSWORD="$src_pass" \
            postgres:16-alpine psql -h "$src_host" -p "$src_port" -d "$src_db" -U "$src_user" -t \
            -c "SELECT COUNT(*) FROM $table_lower;" 2>/dev/null | tr -d '[:space:]')
        
        # 获取目标表行数
        local dst_count=$(docker run --rm -e PGPASSWORD="$dst_pass" \
            postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -d "$dst_db" -U "$dst_user" -t \
            -c "SELECT COUNT(*) FROM $table_lower;" 2>/dev/null | tr -d '[:space:]')
        
        # 检查表是否存在
        if [ -z "$src_count" ]; then
            echo -e "  ${YELLOW}⚠ 源数据库中不存在表 $table${NC}"
            continue
        fi
        
        if [ -z "$dst_count" ]; then
            echo -e "  ${RED}✗ 目标数据库中不存在表 $table${NC}"
            total_errors=$((total_errors + 1))
            continue
        fi
        
        # 比较行数
        if [ "$src_count" = "$dst_count" ]; then
            echo -e "  ${GREEN}✓ $table: $src_count 行${NC}"
        else
            echo -e "  ${RED}✗ $table: 源($src_count) != 目标($dst_count)${NC}"
            total_errors=$((total_errors + 1))
        fi
    done
    
    if [ $total_errors -eq 0 ]; then
        echo -e "${GREEN}✓ 数据完整性检查通过${NC}"
        return 0
    else
        echo -e "${RED}✗ 发现 $total_errors 个数据完整性问题${NC}"
        return 1
    fi
}

# 设置超级用户函数，使用多种方法
set_superuser() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local target_user=$4
    local admin_user=$5
    local admin_password=$6
    
    if [[ -z "$target_user" ]]; then
        # 如果目标用户为空，使用从连接字符串解析的用户名
        target_user=$DST_USER
    fi
    
    echo -e "${YELLOW}尝试将用户 '$target_user' 设置为超级用户...${NC}"
    
    # 创建SQL命令，尝试三种不同的方法设置超级用户权限
    cat > /tmp/set_superuser.sql << EOF
-- 方法1: 尝试使用标准ALTER USER命令
BEGIN;
ALTER USER $target_user WITH SUPERUSER;
COMMIT;

-- 方法2: 如果方法1失败，尝试直接修改pg_authid系统表
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_authid WHERE rolname = '$target_user' AND rolsuper = 't') THEN
        BEGIN
            UPDATE pg_catalog.pg_authid SET rolsuper = 't' WHERE rolname = '$target_user';
            RAISE NOTICE 'Successfully set superuser using pg_authid update for user: $target_user';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to set superuser using pg_authid: %', SQLERRM;
        END;
    END IF;
END
\$\$;

-- 方法3: 如果前两种方法都失败，尝试使用动态SQL和异常处理
DO \$\$
DECLARE
    cmd text;
BEGIN
    cmd := 'ALTER USER $target_user WITH SUPERUSER';
    BEGIN
        EXECUTE cmd;
        RAISE NOTICE 'Successfully set superuser using dynamic SQL for user: $target_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed with method 3: %', SQLERRM;
        -- 尝试使用DROP和CREATE
        BEGIN
            EXECUTE 'DROP ROLE IF EXISTS $target_user';
            EXECUTE 'CREATE ROLE $target_user WITH SUPERUSER LOGIN PASSWORD ''$DST_PASS''';
            RAISE NOTICE 'Successfully recreated user with superuser privileges: $target_user';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to recreate user: %', SQLERRM;
        END;
    END;
END
\$\$;
EOF

    # 使用Docker运行psql命令
    docker run --rm -v /tmp/set_superuser.sql:/set_superuser.sql \
        -e PGPASSWORD="$admin_password" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$admin_user" -f /set_superuser.sql
    
    # 检查用户是否成功设置为超级用户
    check_command="SELECT rolname, rolsuper FROM pg_roles WHERE rolname='$target_user';"
    result=$(docker run --rm -e PGPASSWORD="$admin_password" postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$admin_user" -t -c "$check_command")
    
    if echo "$result" | grep -q "t"; then
        echo -e "${GREEN}用户 '$target_user' 已成功设置为超级用户!${NC}"
        return 0
    else
        echo -e "${RED}设置超级用户失败。请检查权限或尝试使用不同的管理员账户。${NC}"
        return 1
    fi
}

# 创建超级用户函数
create_superuser() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local new_superuser=$4
    local new_password=$5
    local admin_user=$6
    local admin_password=$7
    
    echo -e "${YELLOW}尝试创建新的超级用户 '$new_superuser'...${NC}"
    
    # 创建SQL命令
    cat > /tmp/create_superuser.sql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$new_superuser') THEN
        CREATE ROLE $new_superuser WITH SUPERUSER LOGIN PASSWORD '$new_password';
        RAISE NOTICE 'Successfully created superuser: $new_superuser';
    ELSE
        ALTER ROLE $new_superuser WITH SUPERUSER LOGIN PASSWORD '$new_password';
        RAISE NOTICE 'Role already exists, updated to superuser: $new_superuser';
    END IF;
END
\$\$;
EOF

    # 使用Docker运行psql命令
    docker run --rm -v /tmp/create_superuser.sql:/create_superuser.sql \
        -e PGPASSWORD="$admin_password" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$admin_user" -f /create_superuser.sql
    
    # 检查用户是否成功创建
    check_command="SELECT rolname, rolsuper FROM pg_roles WHERE rolname='$new_superuser';"
    result=$(docker run --rm -e PGPASSWORD="$admin_password" postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$admin_user" -t -c "$check_command")
    
    if echo "$result" | grep -q "t"; then
        echo -e "${GREEN}超级用户 '$new_superuser' 创建成功!${NC}"
        return 0
    else
        echo -e "${RED}创建超级用户失败。请检查权限或使用不同的管理员账户。${NC}"
        return 1
    fi
}

# 使用超级用户清空数据库函数
empty_database_with_superuser() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local superuser=$4
    local password=$5
    
    echo -e "${YELLOW}使用超级用户 '$superuser' 清空数据库 '$db_name'...${NC}"
    
    # 创建清空数据库的SQL
    cat > /tmp/empty_db.sql << EOF
DO \$\$
DECLARE
    r RECORD;
BEGIN
    -- 禁用触发器
    SET session_replication_role = 'replica';
    
    -- 删除所有表
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema'))
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- 删除所有序列
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema'))
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
    
    -- 删除所有视图
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema NOT IN ('pg_catalog', 'information_schema'))
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.table_name;
    END LOOP;
    
    -- 删除所有自定义类型
    FOR r IN (SELECT typname FROM pg_type 
              WHERE typnamespace IN 
                (SELECT oid FROM pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema')))
    LOOP
        BEGIN
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            RAISE NOTICE 'Dropped type: %', r.typname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop type: % - %', r.typname, SQLERRM;
        END;
    END LOOP;
    
    -- 重新启用触发器
    SET session_replication_role = 'origin';
END
\$\$;
EOF

    # 使用Docker运行psql命令
    docker run --rm -v /tmp/empty_db.sql:/empty_db.sql \
        -e PGPASSWORD="$password" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$superuser" -f /empty_db.sql
    
    echo -e "${GREEN}数据库清空操作完成!${NC}"
}

# 清空数据库函数（使用当前连接用户）
empty_database() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local db_user=$4
    local db_pass=$5
    
    echo -e "${YELLOW}清空数据库 '$db_name'...${NC}"
    
    # 创建清空数据库的SQL，包含错误处理
    cat > /tmp/empty_db.sql << EOF
DO \$\$
DECLARE
    r RECORD;
    schema_rec RECORD;
    error_count INTEGER := 0;
    success_count INTEGER := 0;
BEGIN
    -- 禁用触发器
    SET session_replication_role = 'replica';
    
    -- 循环遍历所有非系统schema
    FOR schema_rec IN (SELECT schema_name FROM information_schema.schemata 
                     WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast'))
    LOOP
        -- 删除每个schema中的所有表
        FOR r IN (SELECT tablename FROM pg_tables 
                WHERE schemaname = schema_rec.schema_name)
        LOOP
            BEGIN
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(schema_rec.schema_name) || '.' || 
                        quote_ident(r.tablename) || ' CASCADE';
                RAISE NOTICE 'Dropped table: %.%', schema_rec.schema_name, r.tablename;
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error dropping table %.%: %', schema_rec.schema_name, r.tablename, SQLERRM;
                error_count := error_count + 1;
            END;
        END LOOP;
        
        -- 删除每个schema中的所有序列
        FOR r IN (SELECT sequence_name FROM information_schema.sequences 
                WHERE sequence_schema = schema_rec.schema_name)
        LOOP
            BEGIN
                EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(schema_rec.schema_name) || '.' || 
                        quote_ident(r.sequence_name) || ' CASCADE';
                RAISE NOTICE 'Dropped sequence: %.%', schema_rec.schema_name, r.sequence_name;
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error dropping sequence %.%: %', schema_rec.schema_name, r.sequence_name, SQLERRM;
                error_count := error_count + 1;
            END;
        END LOOP;
        
        -- 删除每个schema中的所有视图
        FOR r IN (SELECT table_name FROM information_schema.views 
                WHERE table_schema = schema_rec.schema_name)
        LOOP
            BEGIN
                EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(schema_rec.schema_name) || '.' || 
                        quote_ident(r.table_name) || ' CASCADE';
                RAISE NOTICE 'Dropped view: %.%', schema_rec.schema_name, r.table_name;
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error dropping view %.%: %', schema_rec.schema_name, r.table_name, SQLERRM;
                error_count := error_count + 1;
            END;
        END LOOP;
    END LOOP;
    
    -- 重新启用触发器
    SET session_replication_role = 'origin';
    
    RAISE NOTICE '清空数据库操作完成: % 个对象成功删除, % 个对象删除失败', success_count, error_count;
    IF error_count > 0 THEN
        RAISE NOTICE '注意: 某些对象删除失败，这可能是由于权限不足或对象依赖关系造成的';
        RAISE NOTICE '如需完全清空数据库，请使用具有超级用户权限的账户';
    END IF;
END
\$\$;
EOF

    # 使用Docker运行psql命令
    docker run --rm -v /tmp/empty_db.sql:/empty_db.sql \
        -e PGPASSWORD="$db_pass" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" -f /empty_db.sql
    
    echo -e "${GREEN}数据库清空操作完成!${NC}"
}

# 列出超级用户函数
list_superusers() {
    local db_host=$1
    local db_port=$2
    local db_name=$3
    local db_user=$4
    local db_pass=$5
    
    echo -e "${YELLOW}列出数据库 '$db_name' 中的超级用户...${NC}"
    
    # 查询超级用户
    result=$(docker run --rm -e PGPASSWORD="$db_pass" \
        postgres:16-alpine psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" -t \
        -c "SELECT rolname, rolsuper FROM pg_roles WHERE rolsuper = 't';")
    
    if [ -z "$result" ]; then
        echo -e "${RED}无法获取超级用户列表。可能是因为权限不足。${NC}"
    else
        echo -e "${GREEN}数据库超级用户列表:${NC}"
        echo "$result"
    fi
}

# 数据库迁移函数（分步骤迁移：先结构，再数据）
migrate_database() {
    local src_host=$1
    local src_port=$2
    local src_db=$3
    local src_user=$4
    local src_pass=$5
    local dst_host=$6
    local dst_port=$7
    local dst_db=$8
    local dst_user=$9
    local dst_pass=${10}
    
    # 记录开始时间
    start_time=$(date +%s)
    
    echo -e "${YELLOW}开始迁移数据库 '$src_db' 到 '$dst_db'...${NC}"
    echo -e "${BLUE}源：$src_user@$src_host:$src_port/$src_db${NC}"
    echo -e "${BLUE}目标：$dst_user@$dst_host:$dst_port/$dst_db${NC}"
    
    # 可选：使用单步完整迁移而不是分步骤
        # 单步完整迁移询问
    read -p "是否使用单步完整迁移（推荐，包含结构和数据）? (y/n): " use_full_migration
    if [[ $use_full_migration == "y" || $use_full_migration == "Y" ]]; then
        echo -e "${YELLOW}执行完整数据库迁移（结构和数据）...${NC}"
        
        # 完整迁移（结构和数据一次性导出导入）
        echo -e "${YELLOW}导出完整数据库...${NC}"
        docker run --rm -e PGPASSWORD="$src_pass" \
            postgres:16-alpine pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" \
            --no-owner --no-acl --if-exists --clean > /tmp/full_dump.sql
            
        # 导入到目标数据库
        echo -e "${YELLOW}导入完整数据库...${NC}"
        cat /tmp/full_dump.sql | docker run --rm -i -e PGPASSWORD="$dst_pass" \
            postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db"
        
        echo -e "${GREEN}完整数据库迁移完成!${NC}"
    else
        echo -e "${YELLOW}步骤 1: 迁移数据库结构...${NC}"
    
    # 导出源数据库的结构
    docker run --rm -e PGPASSWORD="$src_pass" \
        postgres:16-alpine pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" \
        --schema-only --no-owner --no-acl --if-exists --clean > /tmp/schema.sql
    
    # 导入结构到目标数据库
    cat /tmp/schema.sql | docker run --rm -i -e PGPASSWORD="$dst_pass" \
        postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db"
    
    echo -e "${GREEN}数据库结构迁移完成!${NC}"
    echo -e "${YELLOW}步骤 2: 迁移数据...${NC}"
    
    # 导出源数据库的数据
    echo -e "${YELLOW}正在导出数据，这可能需要一些时间...${NC}"
    docker run --rm -e PGPASSWORD="$src_pass" \
        postgres:16-alpine pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" \
        --data-only --disable-triggers --inserts --no-owner --no-acl > /tmp/data.sql
    
    # 检查数据导出是否成功
    if [ ! -s "/tmp/data.sql" ]; then
        echo -e "${RED}数据导出失败或导出的数据为空!${NC}"
        echo -e "${YELLOW}尝试使用完整备份方法...${NC}"
        
        # 备选方案：使用完整备份然后单独导入
        docker run --rm -e PGPASSWORD="$src_pass" \
            postgres:16-alpine pg_dump -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" \
            --no-owner --no-acl --if-exists --clean > /tmp/full_dump.sql
            
        # 导入完整备份到目标数据库
        echo -e "${YELLOW}导入完整备份到目标数据库...${NC}"
        cat /tmp/full_dump.sql | docker run --rm -i -e PGPASSWORD="$dst_pass" \
            postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db"
    else
        # 导入数据到目标数据库
        echo -e "${YELLOW}导入数据到目标数据库...${NC}"
        cat /tmp/data.sql | docker run --rm -i -e PGPASSWORD="$dst_pass" \
            postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db"
    fi
    fi
    
    # 记录结束时间并计算总耗时
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    # 计算源数据库和目标数据库的表数量，用于验证迁移是否完整
    src_tables=$(docker run --rm -e PGPASSWORD="$src_pass" \
        postgres:16-alpine psql -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" -t \
        -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")
        
    dst_tables=$(docker run --rm -e PGPASSWORD="$dst_pass" \
        postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" -t \
        -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")
    
    src_tables=$(echo $src_tables | tr -d '[:space:]')
    dst_tables=$(echo $dst_tables | tr -d '[:space:]')
    
    # 检查数据行数
    src_rows=$(docker run --rm -e PGPASSWORD="$src_pass" \
        postgres:16-alpine psql -h "$src_host" -p "$src_port" -U "$src_user" -d "$src_db" -t \
        -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables;")
    
    dst_rows=$(docker run --rm -e PGPASSWORD="$dst_pass" \
        postgres:16-alpine psql -h "$dst_host" -p "$dst_port" -U "$dst_user" -d "$dst_db" -t \
        -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables;")
    
    src_rows=$(echo $src_rows | tr -d '[:space:]')
    dst_rows=$(echo $dst_rows | tr -d '[:space:]')
    
    echo -e "${GREEN}数据迁移完成!${NC}"
    echo -e "${BLUE}迁移摘要:${NC}"
    echo "源数据库表数量: $src_tables"
    echo "目标数据库表数量: $dst_tables"
    echo "源数据库总行数: $src_rows"
    echo "目标数据库总行数: $dst_rows"
    echo "总耗时: $(($duration / 60)) 分钟 $(($duration % 60)) 秒"
    
    if [ "$src_tables" = "$dst_tables" ]; then
        echo -e "${GREEN}表结构迁移验证通过: 源数据库和目标数据库表数量一致${NC}"
    else
        echo -e "${RED}表结构迁移验证警告: 源数据库和目标数据库表数量不一致${NC}"
        echo -e "${YELLOW}请检查迁移日志和数据库，确认是否有未迁移的表或结构${NC}"
    fi
    
    # 验证数据是否迁移成功
    if [ "$src_rows" != "0" ] && [ "$dst_rows" != "0" ]; then
        # 如果两者都不为0，比较差异百分比
        if [ "$src_rows" -gt 0 ] && [ "$dst_rows" -gt 0 ]; then
            # 计算行数比例
            src_rows_num=$(echo $src_rows | sed 's/[^0-9]//g')
            dst_rows_num=$(echo $dst_rows | sed 's/[^0-9]//g')
            
            if [ "$src_rows_num" -gt "$dst_rows_num" ]; then
                diff_percent=$(( 100 - ($dst_rows_num * 100 / $src_rows_num) ))
            else
                diff_percent=$(( 100 - ($src_rows_num * 100 / $dst_rows_num) ))
            fi
            
            if [ "$diff_percent" -lt 5 ]; then
                echo -e "${GREEN}数据迁移验证通过: 源数据库和目标数据库数据行数接近 (差异 ${diff_percent}%)${NC}"
            else
                echo -e "${RED}数据迁移验证警告: 源数据库和目标数据库数据行数差异较大 (差异 ${diff_percent}%)${NC}"
                echo -e "${YELLOW}请检查是否有数据未正确迁移${NC}"
            fi
        fi
    elif [ "$dst_rows" = "0" ] || [ -z "$dst_rows" ]; then
        echo -e "${RED}数据迁移验证失败: 目标数据库没有数据!${NC}"
        echo -e "${YELLOW}请检查迁移过程中的错误信息${NC}"
    fi
}

# 显示菜单
show_menu() {
    echo ""
    echo -e "${BLUE}=== AIPan数据库迁移工具 ===${NC}"
    echo -e "${CYAN}基础迁移功能:${NC}"
    echo "1) 完整数据库迁移"
    echo "2) 按表迁移数据（推荐用于Prisma）"
    echo "3) 清空目标数据库"
    echo ""
    echo -e "${CYAN}Prisma专用功能:${NC}"
    echo "4) 验证Prisma表结构"
    echo "5) 获取数据库表统计信息"
    echo "6) 同步Prisma schema到数据库"
    echo ""
    echo -e "${CYAN}用户权限管理:${NC}"
    echo "7) 设置目标数据库用户为超级用户"
    echo "8) 使用超级用户清空数据库"
    echo "9) 创建新的超级用户"
    echo "10) 列出数据库中的超级用户"
    echo ""
    echo -e "${CYAN}其他功能:${NC}"
    echo "11) 测试数据库连接"
    echo "12) 退出"
    echo ""
    echo -n "请选择操作(1-12): "
}

# 主程序
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            read -p "是否在迁移前清空目标数据库? (y/n): " empty_first
            if [[ $empty_first == "y" || $empty_first == "Y" ]]; then
                read -p "是否需要使用超级用户来清空数据库? (y/n): " use_superuser
                if [[ $use_superuser == "y" || $use_superuser == "Y" ]]; then
                    echo "使用超级用户清空数据库:"
                    read -p "请输入超级用户名 [postgres]: " su_user
                    su_user=${su_user:-"postgres"}
                    read -s -p "请输入超级用户密码 [postgres]: " su_pass
                    echo ""
                    su_pass=${su_pass:-"postgres"}
                    empty_database_with_superuser "$DST_HOST" "$DST_PORT" "$DST_DB" "$su_user" "$su_pass"
                else
                    empty_database "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
                fi
            fi
            migrate_database "$SRC_HOST" "$SRC_PORT" "$SRC_DB" "$SRC_USER" "$SRC_PASS" \
                "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
            ;;
        2)
            read -p "是否在迁移前清空目标数据库? (y/n): " empty_first
            if [[ $empty_first == "y" || $empty_first == "Y" ]]; then
                read -p "是否需要使用超级用户来清空数据库? (y/n): " use_superuser
                if [[ $use_superuser == "y" || $use_superuser == "Y" ]]; then
                    echo "使用超级用户清空数据库:"
                    read -p "请输入超级用户名 [postgres]: " su_user
                    su_user=${su_user:-"postgres"}
                    read -s -p "请输入超级用户密码 [postgres]: " su_pass
                    echo ""
                    su_pass=${su_pass:-"postgres"}
                    empty_database_with_superuser "$DST_HOST" "$DST_PORT" "$DST_DB" "$su_user" "$su_pass"
                else
                    empty_database "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
                fi
            fi
            migrate_table_by_table "$SRC_HOST" "$SRC_PORT" "$SRC_DB" "$SRC_USER" "$SRC_PASS" \
                "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
            ;;
        3)
            read -p "是否需要使用超级用户来清空数据库? (y/n): " use_superuser
            if [[ $use_superuser == "y" || $use_superuser == "Y" ]]; then
                echo "使用超级用户清空数据库:"
                read -p "请输入超级用户名 [postgres]: " su_user
                su_user=${su_user:-"postgres"}
                read -s -p "请输入超级用户密码 [postgres]: " su_pass
                echo ""
                su_pass=${su_pass:-"postgres"}
                empty_database_with_superuser "$DST_HOST" "$DST_PORT" "$DST_DB" "$su_user" "$su_pass"
            else
                empty_database "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
            fi
            ;;
        4)
            verify_prisma_tables "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
            ;;
        5)
            get_table_stats "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
            ;;
        6)
            sync_prisma_schema
            ;;
        7)
            echo "设置目标数据库用户 '$DST_USER' 为超级用户:"
            read -p "请输入管理员用户名 [postgres]: " admin_user
            admin_user=${admin_user:-"postgres"}
            read -s -p "请输入管理员密码 [postgres]: " admin_pass
            echo ""
            admin_pass=${admin_pass:-"postgres"}
            set_superuser "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$admin_user" "$admin_pass"
            ;;
        8)
            echo "使用超级用户清空数据库:"
            read -p "请输入超级用户名 [postgres]: " su_user
            su_user=${su_user:-"postgres"}
            read -s -p "请输入超级用户密码 [postgres]: " su_pass
            echo ""
            su_pass=${su_pass:-"postgres"}
            empty_database_with_superuser "$DST_HOST" "$DST_PORT" "$DST_DB" "$su_user" "$su_pass"
            ;;
        9)
            echo "创建新的超级用户:"
            read -p "请输入新超级用户名: " new_superuser
            read -s -p "请输入新超级用户密码: " new_superuser_pass
            echo ""
            read -p "请输入当前管理员用户名 [postgres]: " admin_user
            admin_user=${admin_user:-"postgres"}
            read -s -p "请输入当前管理员密码 [postgres]: " admin_pass
            echo ""
            admin_pass=${admin_pass:-"postgres"}
            create_superuser "$DST_HOST" "$DST_PORT" "$DST_DB" "$new_superuser" "$new_superuser_pass" "$admin_user" "$admin_pass"
            ;;
        10)
            list_superusers "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
            ;;
        11)
            echo -e "${CYAN}测试数据库连接${NC}"
            echo "1) 测试源数据库连接"
            echo "2) 测试目标数据库连接"
            echo "3) 测试两个数据库连接"
            echo "4) 数据完整性检查"
            read -p "请选择 (1-4): " test_choice
            case $test_choice in
                1)
                    test_database_connection "$SRC_HOST" "$SRC_PORT" "$SRC_DB" "$SRC_USER" "$SRC_PASS" "源"
                    ;;
                2)
                    test_database_connection "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS" "目标"
                    ;;
                3)
                    test_database_connection "$SRC_HOST" "$SRC_PORT" "$SRC_DB" "$SRC_USER" "$SRC_PASS" "源"
                    echo ""
                    test_database_connection "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS" "目标"
                    ;;
                4)
                    check_data_integrity "$SRC_HOST" "$SRC_PORT" "$SRC_DB" "$SRC_USER" "$SRC_PASS" \
                        "$DST_HOST" "$DST_PORT" "$DST_DB" "$DST_USER" "$DST_PASS"
                    ;;
                *)
                    echo -e "${RED}无效的选择${NC}"
                    ;;
            esac
            ;;
        12)
            echo -e "${GREEN}感谢使用数据库迁移工具!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效的选择，请重试${NC}"
            ;;
    esac
done
