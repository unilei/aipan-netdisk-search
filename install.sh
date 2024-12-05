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
    read -p "PostgreSQL Password: " db_password
    db_password=${db_password:-postgres}
    read -p "Database Name (default: netdisk): " db_name
    db_name=${db_name:-netdisk}
    read -p "Database Schema (default: public): " db_schema
    db_schema=${db_schema:-public}
    read -p "Database Host (default: localhost): " db_host
    db_host=${db_host:-localhost}
    read -p "Database Port (default: 5432): " db_port
    db_port=${db_port:-5432}

    # 管理员配置
    print_message "\nAdmin Configuration:" "${YELLOW}"
    read -p "Admin User (default: aipan): " admin_user
    admin_user=${admin_user:-aipan}
    read -p "Admin Password (default: aipan): " admin_password
    admin_password=${admin_password:-aipan}
    read -p "Admin Email (default: aipan@email.com): " admin_email
    admin_email=${admin_email:-aipan@email.com}

    # Github 配置
    print_message "\nGitHub Configuration:" "${YELLOW}"
    read -p "GitHub Owner (default: unilei-github): " github_owner
    github_owner=${github_owner:-unilei-github}
    read -p "GitHub Repo (default: aipan-images): " github_repo
    github_repo=${github_repo:-aipan-images}
    read -p "GitHub Branch (default: main): " github_branch
    github_branch=${github_branch:-main}
    read -p "GitHub Token (default: ghp_xxxxx): " github_token
    github_token=${github_token:-ghp_xxxxx}

    # JWT配置
    print_message "\nSecurity Configuration:" "${YELLOW}"
    read -p "JWT Secret (default: aipan.me): " jwt_secret
    jwt_secret=${jwt_secret:-aipan.me}

    # 创建 .env 文件
    cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}?schema=${db_schema}
DATABASE_SCHEMA=${db_schema}

# Admin Configuration
ADMIN_USER=${admin_user}
ADMIN_PASSWORD=${admin_password}
ADMIN_EMAIL=${admin_email}

# Security
JWT_SECRET=${jwt_secret}

# GitHub Configuration
NUXT_PUBLIC_GITHUB_OWNER=${github_owner}
NUXT_PUBLIC_GITHUB_REPO=${github_repo}
NUXT_PUBLIC_GITHUB_TOKEN=${github_token}
NUXT_PUBLIC_GITHUB_BRANCH=${github_branch}
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
    # docker-compose up -d --build
    docker-compose up -d

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
