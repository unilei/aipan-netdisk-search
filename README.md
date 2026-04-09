# 爱盘-网盘资源搜索 Web

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/unilei/aipan-netdisk-search.git&project-name=aipan-netdisk-search&repository-name=aipan-netdisk-search)

🔥 爱盘-网盘资源搜索是一个开源的网盘资源聚合搜索平台。

## 功能特点

- 🎯 多源聚合搜索
- 📺 在线视频播放
- 🗄️ Alist 源聚合
- 📝 博客系统
- 🔐 后台管理系统
- 📊 资源管理
- 🚀 批量导入导出

## 技术栈

- 💻 Frontend
  - Nuxt.js 3
  - Vue 3
  - TailwindCSS
  - Element Plus

- 🛠 Backend
  - Node.js v20.18.0
  - PostgreSQL
  - Prisma ORM
    - 连接池优化
    - 共享客户端实例
  - JWT Authentication

## 在线演示

- 👉 [爱盘-网盘资源搜索](https://www.aipan.me)
- 💝 [欢迎打赏](https://www.aipan.me/donate)

## 快速开始

### 环境要求

- Node.js v20.18.0
- PostgreSQL 12+
- pnpm 包管理器

### 部署方式

1. **Vercel 部署**（推荐）
   - 查看 [Vercel 部署文档](/README_VERCEL.md)
   - 点击上方 "Deploy with Vercel" 按钮一键部署

2. **Docker 部署**（推荐）
   - 查看 [Docker 部署文档](/DEPLOY.md#docker-部署推荐)

3. **传统部署**
   - 查看 [传统部署文档](/DEPLOY.md#传统部署)

## 最新更新

- ✨ TV 播放功能
- 🔄 Alist 源聚合播放
- 🗑️ 批量删除功能
- 📝 博客功能
- 📤 批量上传数据
  - [CSV 示例](/assets/readme/demo/demo-multi.csv)
  - [XLSX 示例](https://r2cf.aipan.me/readme/demo/demo-multi.xls)
- 🔐 后台管理系统
  - 访问路径：`/login`、`/admin/dashboard`、`/admin/clouddrive`
  - 支持自定义网盘资源管理

## 项目结构

```
aipan-netdisk-search/
├── assets/          # 静态资源
├── components/      # Vue 组件
├── layouts/         # 布局组件
├── pages/          # 页面组件
├── prisma/         # 数据库模型和迁移
├── public/         # 公共文件
├── server/         # 服务端 API
├── stores/         # Pinia 状态管理
└── utils/          # 工具函数
```

## 开发指南

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env

# 必填：用于加密后台保存的邮箱服务密钥
# SETTINGS_ENCRYPTION_KEY=请设置一个随机长字符串

# 3. 数据库设置
npx prisma generate
npx prisma migrate deploy

# 4. 启动开发服务器
pnpm run dev
```

## API 说明

后台管理 API 路径：
- 登录：`/login`
- 仪表盘：`/admin/dashboard`
- 系统配置：`/admin/settings`
- 网盘管理：`/admin/clouddrive`

### 邮箱验证配置

- 在后台 `系统配置` 页面配置 Resend API Key、发件邮箱、站点地址和验证有效期
- Resend 的 API Key 不需要放入 `.env`，由管理员在后台保存
- `SETTINGS_ENCRYPTION_KEY` 用于加密数据库里的邮箱服务密钥，生产环境请单独配置，不要复用默认值

## 注意事项

- 项目使用第三方 API，对 IP 有访问限制
- 建议自行部署使用
- 确保数据库配置正确
- 定期备份重要数据

## 贡献指南

1. 创建特性分支：`git checkout -b feature/AmazingFeature`
2. 提交更改：`git commit -m 'Add some AmazingFeature'`
3. 推送分支：`git push origin feature/AmazingFeature`
4. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 截图展示

![部署成功截图](https://r2cf.aipan.me/readme/screen-6.png)

## 支持项目

如果这个项目对你有帮助，欢迎：

1. 🌟 给项目点个 Star
2. 💝 [打赏支持](https://www.aipan.me/donate)

## 联系方式

- 项目地址：[GitHub](https://github.com/unilei/aipan-netdisk-search)
- 问题反馈：[Issues](https://github.com/unilei/aipan-netdisk-search/issues)
- 功能建议：[Discussions](https://github.com/unilei/aipan-netdisk-search/discussions)
