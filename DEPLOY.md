# 部署文档

本文档详细说明了如何通过Docker 部署和传统部署。

## 环境要求

- Node.js v20.18.0
- PostgreSQL 数据库（版本 12+）
- pnpm 包管理器
- Docker & Docker Compose (如果使用 Docker 部署)

## 1. Docker 部署（推荐）

### 1.1 准备工作

1. 确保安装了 Docker 和 Docker Compose
2. 执行install.sh脚本，输入你的环境变量
   ```bash
   sh install.sh
   ```
3. 更新执行update.sh脚本
   ```bash
   sh update.sh   
   ```
   
## 2. 传统部署

### 2.1 环境准备

1. 安装 Node.js (v20.18.0)：
   ```bash
   # 使用 nvm 安装 Node.js
   nvm install 20.18.0
   nvm use 20.18.0
   ```

2. 安装并配置 PostgreSQL 数据库：
   - 创建数据库和用户
   - 设置适当的访问权限
   - 确保数据库可以从应用服务器访问

### 2.2 项目部署

1. 克隆项目：
   ```bash
   git clone <项目地址>
   cd aipan-netdisk-search
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

4. 数据库设置：
   ```bash
   # 生成 Prisma 客户端
   npx prisma generate
   
   # 执行数据库迁移
   npx prisma migrate deploy
   ```

5. 构建项目：
   ```bash
   npm run build
   ```

6. 启动服务：
   ```bash
   # 使用 PM2 启动（推荐）
   cp ecosystem.config.cjs.example ecosystem.config.cjs
   # 编辑 ecosystem.config.cjs 配置文件
   pm2 start ecosystem.config.cjs

   # 或直接启动
   npm run start
   ```

## 3. 环境变量说明

必要的环境变量配置：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@host:5432/database_name"
DATABASE_SCHEMA="public"
SHADOW_DATABASE_URL="postgresql://username:password@host:5432/shadow_database_name"

# 管理员配置
ADMIN_USER="admin"
ADMIN_PASSWORD="your_password"
ADMIN_EMAIL="admin@example.com"

# JWT配置
JWT_SECRET="your_jwt_secret"

## 4. 数据库管理

### 4.1 数据模型
项目使用 Prisma ORM，主要数据模型包括：
- User（用户）
- ResourceType（资源类型）
- Resource（资源）
- Post（文章）
- PostCategory（文章分类）
- Alist（Alist 源）

### 4.2 数据库维护
1. 查看迁移状态：
   ```bash
   npx prisma migrate status
   ```

2. 创建新的迁移：
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

3. 重置数据库：
   ```bash
   npx prisma migrate reset
   ```

### 4.3 数据库备份
建议定期备份数据库：
```bash
pg_dump -U username -h hostname database_name > backup.sql
```

## 5. 常见问题

### 5.1 数据库连接问题
- 检查数据库连接字符串格式
- 确认数据库服务器防火墙设置
- 验证数据库用户权限

### 5.2 端口占用问题
如果 3000 端口被占用，可以通过以下方式修改：
- Docker 部署：修改 `docker-compose.yml` 中的端口映射
- 传统部署：修改 `.env` 文件中的 `NUXT_PORT`

### 5.3 性能优化
- 使用连接池管理数据库连接
- 配置适当的 PM2 实例数
- 优化数据库查询和索引
- 考虑使用 Prisma Accelerate

## 6. 监控和维护

### 6.1 应用监控
1. 使用 PM2 监控：
   ```bash
   pm2 monit
   ```

2. 查看应用日志：
   ```bash
   # PM2 日志
   pm2 logs

   # Docker 日志
   docker-compose logs -f
   ```

### 6.2 数据库监控
- 监控连接数
- 监控查询性能
- 监控磁盘使用情况

### 6.3 定期维护
1. 更新依赖包
2. 检查安全更新
3. 数据库备份
4. 日志清理
5. 性能优化

## 7. 安全建议

1. 数据库安全：
   - 使用强密码
   - 限制数据库访问IP
   - 定期更新数据库版本
   - 加密敏感数据

2. 应用安全：
   - 使用 HTTPS
   - 定期更新依赖
   - 使用安全的 JWT 密钥
   - 实施速率限制

3. 服务器安全：
   - 配置防火墙
   - 定期安全更新
   - 监控异常访问
   - 限制端口访问

## 8. 数据库配置最佳实践

### 8.1 连接池配置

项目使用了优化的数据库连接池配置，位于 `lib/prisma.js`。主要配置项包括：

```javascript
const pool = {
  max: 10,        // 最大连接数
  min: 2,         // 最小连接数
  idleTimeoutMillis: 60000,    // 空闲连接超时时间
  connectionTimeoutMillis: 5000 // 连接超时时间
}
```

### 8.2 注意事项

1. **连接池管理**：
   - 不要在每个API端点创建新的Prisma实例
   - 使用共享的Prisma客户端（从 `~/lib/prisma` 导入）
   - 避免创建过多的数据库连接

2. **性能优化**：
   - 合理配置连接池大小
   - 使用适当的查询超时设置
   - 监控数据库连接状态

如有任何问题，请查看：
- 应用日志
- Prisma 错误日志
- 数据库日志
- Docker 日志
