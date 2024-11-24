# AIPAN Resource Navigator

AIPAN Resource Navigator 是一个现代化的资源管理与分享平台，基于 Next.js 13+ 和 TypeScript 构建。它提供了一个直观的界面来管理、分类和分享各种资源，支持实时搜索、分类浏览和个性化收藏功能。

## 主要特性

- 🚀 **现代技术栈**：
  - Next.js 13+ App Router
  - TypeScript
  - Tailwind CSS
  - Prisma ORM
  - NextAuth.js

- 📱 **响应式设计**：
  - 完全响应式布局
  - 移动端优先设计
  - 支持下拉刷新
  - 无限滚动加载

- 🔍 **智能搜索**：
  - 实时搜索功能
  - 按分类筛选
  - 标签系统
  - 搜索结果高亮

- 👤 **用户系统**：
  - 用户认证与授权
  - 个人收藏功能
  - 管理员权限控制
  - 用户资源管理

- 🎯 **核心功能**：
  - 资源分类管理
  - 标签系统
  - 收藏功能
  - 资源详情展示
  - 资源链接管理

## 技术特点

1. **现代化前端架构**
   - 使用 Next.js 13+ App Router 实现服务端渲染
   - TypeScript 确保类型安全
   - Tailwind CSS 实现响应式设计
   - Shadcn UI 组件库提供美观的界面

2. **性能优化**
   - 图片懒加载
   - 无限滚动
   - 数据缓存
   - 优化的资源加载

3. **用户体验**
   - 平滑的动画效果
   - 即时的用户反馈
   - 直观的操作界面
   - 友好的错误提示

4. **后端架构**
   - Prisma ORM 数据库操作
   - NextAuth.js 认证系统
   - API 路由系统
   - 数据验证和安全处理

## 项目结构

```
resource-navigator/
├── app/                    # Next.js 13+ App Router 目录
│   ├── admin/             # 管理后台
│   ├── api/               # API 路由
│   ├── categories/        # 分类页面
│   └── ...
├── components/            # React 组件
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具函数和配置
├── prisma/               # Prisma 配置和模型
└── public/               # 静态资源
```

## 安装和使用

1. **克隆项目**
```bash
git clone [repository-url]
cd resource-navigator
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
- 复制 `.env.example` 到 `.env`
- 配置必要的环境变量

4. **数据库设置**
```bash
npx prisma generate
npx prisma db push
```

5. **启动开发服务器**
```bash
npm run dev
```

## 贡献指南

欢迎提交 Pull Request 和 Issue。在提交之前，请确保：

1. 代码符合项目的代码规范
2. 添加必要的测试
3. 更新相关文档
4. 提交信息清晰明了

## 许可证

MIT License
