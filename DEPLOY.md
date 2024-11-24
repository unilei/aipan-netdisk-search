# Resource Navigator 部署指南

## 系统要求

- Node.js >= 18
- PM2 (用于进程管理)
- Nginx (用于反向代理)

## 1. 服务器准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

## 2. 项目部署

### 2.1 克隆项目

```bash
# 创建应用目录
mkdir -p /var/www/resource-navigator
cd /var/www/resource-navigator

# 克隆项目代码
git clone [你的仓库地址] .
```

### 2.2 安装依赖

```bash
# 安装项目依赖
npm install

# 生成 Prisma 客户端
npm run db:generate
```

### 2.3 环境配置

创建 `.env` 文件：

```env
# 数据库配置 (建议在生产环境使用 PostgreSQL)
DATABASE_URL="file:/var/www/resource-navigator/prisma/prod.db"

# Next.js 配置
NEXTAUTH_URL="https://你的域名"
ADMIN_EMAIL="管理员邮箱"
ADMIN_PASSWORD="管理员密码"
NEXTAUTH_SECRET="生成一个随机密钥"

# Telegram 配置
TELEGRAM_BOT_TOKEN="你的Telegram Bot Token"
HTTP_PROXY="你的代理服务器地址"  # 如果需要代理访问 Telegram
```

### 2.4 构建项目

```bash
# 构建 Next.js 项目
npm run build
```

### 2.5 设置 PM2

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'resource-navigator',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'telegram-scraper',
      script: 'scripts/scrape-telegram-v2.ts',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      cron_restart: '0 */6 * * *',  // 每6小时运行一次
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 2.6 启动服务

```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup
```

### 2.7 配置 Nginx

创建 Nginx 配置文件：

```nginx
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 2.8 设置 SSL（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d 你的域名
```

## 3. 数据库备份

创建数据库备份脚本 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/var/www/resource-navigator/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 复制数据库文件
cp /var/www/resource-navigator/prisma/prod.db $BACKUP_DIR/prod_$TIMESTAMP.db

# 保留最近7天的备份
find $BACKUP_DIR -name "prod_*.db" -mtime +7 -delete
```

设置定时任务：

```bash
# 编辑 crontab
crontab -e

# 添加每日备份任务（每天凌晨3点）
0 3 * * * /var/www/resource-navigator/backup.sh
```

## 4. 监控

### 4.1 查看日志

```bash
# 查看应用日志
pm2 logs resource-navigator

# 查看爬虫日志
pm2 logs telegram-scraper
```

### 4.2 监控状态

```bash
# 查看应用状态
pm2 status

# 查看详细监控
pm2 monit
```

## 5. 更新部署

```bash
# 进入项目目录
cd /var/www/resource-navigator

# 拉取最新代码
git pull

# 安装依赖
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart all
```

## 6. 故障处理

1. 如果网站无法访问：
   - 检查 PM2 进程状态：`pm2 status`
   - 检查 Nginx 状态：`sudo systemctl status nginx`
   - 检查应用日志：`pm2 logs`

2. 如果爬虫无法工作：
   - 检查代理配置
   - 检查 Telegram Bot Token
   - 查看爬虫日志：`pm2 logs telegram-scraper`

3. 数据库问题：
   - 检查数据库文件权限
   - 恢复最近的备份
   - 运行数据库迁移：`npm run db:migrate`

## 注意事项

1. 定期检查日志确保服务正常运行
2. 确保服务器防火墙只开放必要端口（80/443）
3. 定期更新系统和依赖包
4. 保持备份文件的安全性
5. 监控服务器资源使用情况
