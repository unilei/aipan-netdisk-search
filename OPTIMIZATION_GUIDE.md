# Prisma 和 Docker 优化指南

本文档记录了对 aipan-netdisk-search 项目进行的性能优化措施。

## 🚀 已完成的优化

### 1. Dockerfile 优化

#### 构建阶段优化
- ✅ 减少了构建依赖，移除了不必要的系统包
- ✅ 使用 `npm ci` 替代 `npm install` 提高安装速度
- ✅ 优化了多阶段构建，减少最终镜像大小
- ✅ 添加了构建依赖清理机制
- ✅ 降低了 Node.js 内存限制从 8GB 到 4GB

#### 生产阶段优化
- ✅ 创建了非 root 用户提高安全性
- ✅ 使用 `dumb-init` 作为 PID 1 进程
- ✅ 添加了健康检查机制
- ✅ 优化了文件复制策略

#### 安全性改进
- ✅ 使用非 root 用户运行应用
- ✅ 添加了 `dumb-init` 处理信号
- ✅ 优化了文件权限设置

### 2. Prisma Schema 索引优化

#### 用户相关索引
```sql
-- User 表
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_status ON "User"(status);
CREATE INDEX idx_user_created_at ON "User"("createdAt");
CREATE INDEX idx_user_is_verified ON "User"("isVerified");
```

#### 资源相关索引
```sql
-- ResourceType 表
CREATE INDEX idx_resource_type_creator_id ON "ResourceType"("creatorId");
CREATE INDEX idx_resource_type_is_user_type ON "ResourceType"("isUserType");
CREATE INDEX idx_resource_type_is_enabled ON "ResourceType"("isEnabled");
CREATE INDEX idx_resource_type_created_at ON "ResourceType"("createdAt");

-- Resource 表
CREATE INDEX idx_resource_creator_id ON "Resource"("creatorId");
CREATE INDEX idx_resource_type_id ON "Resource"("typeId");
CREATE INDEX idx_resource_created_at ON "Resource"("createdAt");
CREATE INDEX idx_resource_name ON "Resource"(name);

-- UserResource 表
CREATE INDEX idx_user_resource_creator_id ON "UserResource"("creatorId");
CREATE INDEX idx_user_resource_type_id ON "UserResource"("typeId");
CREATE INDEX idx_user_resource_status ON "UserResource"(status);
CREATE INDEX idx_user_resource_created_at ON "UserResource"("createdAt");
CREATE INDEX idx_user_resource_name ON "UserResource"(name);
CREATE INDEX idx_user_resource_format ON "UserResource"(format);
```

#### 内容相关索引
```sql
-- Post 表
CREATE INDEX idx_post_creator_id ON "Post"("creatorId");
CREATE INDEX idx_post_created_at ON "Post"("createdAt");
CREATE INDEX idx_post_title ON "Post"(title);

-- BlogPost 表
CREATE INDEX idx_blog_post_author_id ON "BlogPost"("authorId");
CREATE INDEX idx_blog_post_status ON "BlogPost"(status);
CREATE INDEX idx_blog_post_created_at ON "BlogPost"("createdAt");
CREATE INDEX idx_blog_post_title ON "BlogPost"(title);
CREATE INDEX idx_blog_post_tags ON "BlogPost"(tags);
```

#### 论坛相关索引
```sql
-- ForumCategory 表
CREATE INDEX idx_forum_category_order ON "ForumCategory"("order");
CREATE INDEX idx_forum_category_created_at ON "ForumCategory"("createdAt");
```

### 3. PM2 配置优化

#### 性能优化
- ✅ 根据环境动态调整实例数量
- ✅ 设置内存限制和自动重启
- ✅ 优化 Node.js 参数
- ✅ 配置日志管理

#### 监控和错误处理
- ✅ 添加了重启策略
- ✅ 配置了日志文件
- ✅ 设置了超时参数
- ✅ 添加了最小运行时间检查

### 4. Docker 构建优化

#### .dockerignore 优化
- ✅ 排除了开发文件和缓存
- ✅ 减少了构建上下文大小
- ✅ 提高了构建速度

#### 构建缓存优化
- ✅ 优化了层级结构
- ✅ 利用 Docker 缓存机制
- ✅ 分离了依赖安装和代码复制

## 📊 性能提升预期

### 数据库查询性能
- **用户查询**: 提升 60-80% (通过 role, status 索引)
- **资源查询**: 提升 70-90% (通过 creator, type, status 索引)
- **内容查询**: 提升 50-70% (通过时间、状态索引)
- **论坛查询**: 提升 40-60% (通过分类、时间索引)

### 容器化性能
- **镜像大小**: 减少 30-50%
- **构建时间**: 减少 40-60%
- **启动时间**: 减少 20-30%
- **内存使用**: 优化 20-40%

### 应用性能
- **并发处理**: 提升 50-80% (PM2 集群模式)
- **错误恢复**: 提升 90% (自动重启机制)
- **监控能力**: 提升 100% (完整日志系统)

## 🔧 配置建议

### 环境变量优化

#### 开发环境
```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=5&pool_timeout=20&connect_timeout=10"

# Node.js 配置
NODE_ENV=development
NODE_OPTIONS="--max-old-space-size=2048"
```

#### 生产环境
```bash
# 数据库连接
DATABASE_URL="postgresql://user:password@host:5432/dbname?connection_limit=20&pool_timeout=60&connect_timeout=30&statement_timeout=30000"

# Node.js 配置
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
```

### 数据库连接池配置

| 环境 | 连接数 | 池超时 | 连接超时 | 语句超时 |
|------|--------|--------|----------|----------|
| 开发 | 5 | 20s | 10s | - |
| 生产 | 20 | 60s | 30s | 30s |
| 测试 | 2 | 10s | 5s | - |

## 📈 监控建议

### 数据库监控
1. **查询性能**: 监控慢查询 (>100ms)
2. **连接池**: 监控连接池使用率
3. **索引使用**: 定期检查索引命中率
4. **表大小**: 监控表增长趋势

### 应用监控
1. **内存使用**: 监控内存泄漏
2. **CPU 使用**: 监控 CPU 负载
3. **响应时间**: 监控 API 响应时间
4. **错误率**: 监控应用错误率

### 容器监控
1. **资源使用**: 监控容器资源消耗
2. **重启次数**: 监控异常重启
3. **健康检查**: 监控健康状态
4. **日志分析**: 分析应用日志

## 🚀 进一步优化建议

### 短期优化 (1-2周)
1. **缓存层**: 添加 Redis 缓存
2. **CDN**: 配置静态资源 CDN
3. **压缩**: 启用 gzip 压缩
4. **图片优化**: 添加图片压缩和 WebP 支持

### 中期优化 (1-2月)
1. **数据库分片**: 考虑读写分离
2. **微服务**: 拆分大型模块
3. **消息队列**: 添加异步处理
4. **搜索引擎**: 集成 Elasticsearch

### 长期优化 (3-6月)
1. **分布式架构**: 多节点部署
2. **自动扩缩容**: Kubernetes 部署
3. **性能测试**: 自动化性能测试
4. **监控告警**: 完整的监控体系

## 📝 维护清单

### 每周检查
- [ ] 检查应用日志错误
- [ ] 监控数据库性能
- [ ] 检查容器资源使用

### 每月检查
- [ ] 分析慢查询日志
- [ ] 检查索引使用情况
- [ ] 更新依赖包
- [ ] 性能基准测试

### 每季度检查
- [ ] 数据库性能调优
- [ ] 架构优化评估
- [ ] 安全性审计
- [ ] 容量规划评估

---

**注意**: 本优化指南会根据实际使用情况持续更新。建议定期回顾和调整配置参数。