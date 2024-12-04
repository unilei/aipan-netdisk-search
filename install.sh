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

# 检查必要的命令
check_requirements() {
    if ! command -v docker &> /dev/null; then
        print_message "Error: Docker is not installed!" "${RED}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_message "Error: Docker Compose is not installed!" "${RED}"
        exit 1
    fi
}

# 创建 .env 文件
create_env_file() {
    if [ -f .env ]; then
        print_message "Found existing .env file. Do you want to create a new one? (y/N): " "${YELLOW}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    print_message "\nLet's set up your environment variables:" "${GREEN}"

    # 数据库配置
    print_message "\nDatabase Configuration:" "${YELLOW}"
    read -p "PostgreSQL User (default: postgres): " db_user
    db_user=${db_user:-postgres}
    read -p "PostgreSQL Password (default: postgres): " db_password
    db_password=${db_password:-postgres}
    read -p "Database Name (default: netdisk): " db_name
    db_name=${db_name:-netdisk}

    # 管理员配置
    print_message "\nAdmin Configuration:" "${YELLOW}"
    read -p "Admin User: " admin_user
    read -p "Admin Password: " admin_password
    read -p "Admin Email: " admin_email

    # JWT配置
    print_message "\nSecurity Configuration:" "${YELLOW}"
    read -p "JWT Secret (default: random string): " jwt_secret
    jwt_secret=${jwt_secret:-$(openssl rand -hex 32)}

    # 创建 .env 文件
    cat > .env << EOL
# Database Configuration
POSTGRES_USER=${db_user}
POSTGRES_PASSWORD=${db_password}
POSTGRES_DB=${db_name}
DATABASE_URL=postgresql://${db_user}:${db_password}@db:5432/${db_name}

# Admin Configuration
ADMIN_USER=${admin_user}
ADMIN_PASSWORD=${admin_password}
ADMIN_EMAIL=${admin_email}

# Security
JWT_SECRET=${jwt_secret}
EOL

    print_message "\n.env file created successfully!" "${GREEN}"
}

# 获取并验证 docker-compose.yml
check_docker_compose() {
    if [ ! -f docker-compose.yml ]; then
        print_message "Error: docker-compose.yml not found!" "${RED}"
        exit 1
    fi
    print_message "Found docker-compose.yml" "${GREEN}"
}

# 启动服务
start_services() {
    print_message "\nStarting services..." "${YELLOW}"
    
    # 停止现有服务
    docker-compose down

    # 构建并启动服务
    docker-compose up -d --build

    # 检查服务状态
    print_message "\nChecking service status:" "${GREEN}"
    docker-compose ps

    print_message "\nTo view logs, use: docker-compose logs -f" "${YELLOW}"
    print_message "To stop services, use: docker-compose down" "${YELLOW}"
    print_message "\nServices are ready!" "${GREEN}"
    print_message "Application is running at: http://localhost:3000" "${GREEN}"
}

# 主流程
main() {
    print_message "Welcome to AiPan Netdisk Search Installation" "${GREEN}"
    
    # 检查必要的命令
    check_requirements
    
    # 检查 docker-compose.yml
    check_docker_compose
    
    # 创建 .env 文件
    create_env_file
    
    # 启动服务
    start_services
}

# 运行主流程
main
