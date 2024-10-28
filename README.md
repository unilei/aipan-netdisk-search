# 爱盼-网盘资源搜索Web [欢迎打赏](https://www.aipan.me/donate)

🔥 爱盼-网盘资源搜索：是一个免费开源项目!

[欢迎打赏](https://www.aipan.me/donate)

-------------------
👉 [爱盼-网盘资源搜索](https://www.aipan.me)
 
### 🔥更新日志
- tv播放 
- 新增Alist源聚合播放
- 新增批量删除功能
- 新增博客功能 （分支：[feat-admin-panel](https://github.com/unilei/aipan-netdisk-search/tree/feat-add-admin-panel)）
- 新增批量上传数据 [csv示例](/assets//readme//demo/demo-multi.csv) [xlsx 示例](https://r2cf.aipan.me/readme/demo/demo-multi.xls)
- 增加后台管理, 访问路径：`/login` | `/admin/dashboard` | `/admin/clouddrive`
- 后台可以增加自己的网盘资源
---- 
 
### 建议
项目使用的是第三方的API，对ip有访问限制，建议自己部署使用。

## 快速开始

### 在 Vercel 上部署

`手动安装一样的，只需要配置对应的env就行了`

[Vercel部署文档](/README_VERCEL.md)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/unilei/aipan-netdisk-search.git&project-name=aipan-netdisk-search&repository-name=aipan-netdisk-search)

 
### Docker执行，推荐使用docker compose
 
#### Docker-compose

##### 第一步

```在项目根目录创建.env文件```

##### 编译

```bash
docker compose build
```
##### 运行

```bash
docker compose up -d
```

##### 停止

```bash
docker compose down
```

## 自己部署（不推荐）
### 1. 克隆项目

```bash
git clone https://github.com/unilei/aipan-netdisk-search.git
```

### 2. 安装依赖
```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

### 3. 设置prisma

```bash

npx prisma generate
npx prisma migrate deploy

```
### 3. 运行到浏览器

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev
```

### 4. 在浏览器打开 [http://localhost:3001](http://localhost:3001)

![success_deploy.jpg](https://r2cf.aipan.me/readme/screen-6.png)
![success_deploy.jpg](https://r2cf.aipan.me/readme/screen-5.png)
![success_deploy.jpg](https://r2cf.aipan.me/readme/screen-1.png)
![success_deploy.jpg](https://r2cf.aipan.me/readme/screen-2.png)
![success_deploy.jpg](https://r2cf.aipan.me/readme/screen-3.png)
![success_deploy.jpg](https://r2cf.aipan.me/readme/screen-4.png)

#### 如何部署到自己服务器？ NUXT.JS 打包部署文档

[部署文档](https://nuxt.com/docs/getting-started/deployment)
