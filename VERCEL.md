# Vercel 部署指南

本文档详细说明了如何将 AiPan NetDisk Search 项目部署到 Vercel 平台。

## 1. 准备工作

### 1.1 Vercel 账号准备
1. 访问 [Vercel 官网](https://vercel.com)
2. 使用 GitHub 账号登录或注册新账号
3. 如果是新账号，完成邮箱验证

### 1.2 项目准备
1. 确保你的项目已经推送到 GitHub 仓库
2. 确保项目根目录包含以下文件：
   - `vercel.json`（已配置）
   - `package.json`
   - `.env.example`

## 2. 部署步骤

### 2.1 导入项目
1. 登录 Vercel 控制台
2. 点击 "Import Project" 或 "New Project"
3. 选择你的 GitHub 仓库
4. 如果没有看到你的仓库，点击 "Configure GitHub App" 添加仓库访问权限

### 2.2 配置部署选项
1. **项目名称**：输入你想要的项目名称
2. **Framework Preset**：选择 "Nuxt.js"
3. **Root Directory**：保持默认（如果你的项目在根目录）

### 2.3 环境变量配置
在 Vercel 项目设置中配置以下环境变量：

```bash
# 数据库配置（PostgreSQL）
DATABASE_URL="postgresql://username:password@host:5432/database_name"
DATABASE_SCHEMA="public"
SHADOW_DATABASE_URL="postgresql://username:password@host:5432/shadow_database_name"

# 管理员配置
ADMIN_USER="admin"
ADMIN_PASSWORD="your_password"
ADMIN_EMAIL="admin@example.com"

# JWT配置
JWT_SECRET="your_jwt_secret"

# 其他必要的环境变量
```

注意：
- 确保使用生产环境的 PostgreSQL 数据库 URL
- 数据库需要支持 Prisma 的所有功能，建议使用：
  - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
  - [Supabase](https://supabase.com/)
  - [Railway](https://railway.app/)
- 所有密码和密钥都要使用强密码
- 不要使用开发环境的配置

### 2.4 数据库迁移
在首次部署前，需要确保数据库已经完成迁移：

1. 本地运行迁移命令：
   ```bash
   # 确保本地环境变量配置正确
   npx prisma migrate deploy
   ```

2. 或者在部署后通过 Vercel CLI 运行：
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

### 2.5 部署配置

1. **构建命令**：
   ```bash
   npx prisma generate && npm run build
   ```

2. **输出目录**：
   ```bash
   .output
   ```

3. **Node.js 版本**：
   - 在项目设置中将 Node.js 版本设置为 20.18.0

4. **数据库连接**：
   - 确保数据库允许来自 Vercel 服务器的连接
   - 如果使用外部数据库，配置适当的防火墙规则
   - 建议使用连接池优化性能

## 3. 部署

1. 点击 "Deploy" 开始部署
2. 等待部署完成
3. 部署完成后，Vercel 会提供一个默认域名（例如：your-project.vercel.app）

## 4. 部署后配置

### 4.1 自定义域名（可选）
1. 在项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 按照 Vercel 的说明配置 DNS 记录

### 4.2 环境变量更新
如果需要更新环境变量：
1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加或修改环境变量
4. 重新部署项目以应用更改

### 4.3 自动部署
默认情况下，Vercel 会：
- 自动部署 main/master 分支的更改
- 为每个 PR 创建预览部署
- 可以在项目设置中修改这些行为

## 5. 监控和维护

### 5.1 部署监控
1. 查看部署状态和日志
2. 监控项目性能
3. 查看访问分析

### 5.2 常见问题处理
1. 部署失败：
   - 检查构建日志
   - 验证环境变量配置
   - 确认依赖项版本兼容性

2. 性能问题：
   - 使用 Vercel Analytics 监控性能
   - 检查数据库连接
   - 优化API响应时间

### 5.3 回滚部署
如果新部署出现问题：
1. 在 Deployments 页面找到之前的稳定版本
2. 点击 "..." 菜单
3. 选择 "Promote to Production"

## 6. 最佳实践

1. **环境变量管理**：
   - 使用不同的环境变量用于开发和生产
   - 定期更新敏感信息
   - 不要在代码中硬编码敏感信息

2. **部署策略**：
   - 使用 Git 分支进行功能开发
   - 在合并到主分支前测试预览部署
   - 保持依赖包更新

3. **监控和日志**：
   - 定期检查部署日志
   - 监控性能指标
   - 设置警报通知

## 7. 注意事项

1. **数据库注意事项**：
   - 确保 PostgreSQL 数据库版本兼容（建议 12+）
   - 定期备份数据库
   - 监控数据库连接数
   - 设置适当的连接池大小
   - 考虑使用 Prisma Accelerate 优化性能

2. **环境变量**：
   - 所有必需的环境变量都已配置
   - 数据库连接字符串格式正确
   - 生产环境使用独立的数据库

3. **API和数据模型**：
   - 所有 Prisma 模型都已正确迁移
   - API 路由正确配置
   - CORS 设置适当（已在 vercel.json 中配置）

4. **性能优化**：
   - 使用适当的数据库索引
   - 优化查询性能
   - 考虑使用缓存策略

5. **监控和日志**：
   - 监控数据库查询性能
   - 设置数据库告警
   - 记录关键操作日志

如遇到问题，请查看：
- Vercel 部署日志
- Prisma 错误日志
- 数据库日志
- 项目 GitHub Issues
- Vercel 文档中心
