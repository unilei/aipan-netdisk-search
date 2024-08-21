# 爱盼-网盘资源搜索Web
爱盼-网盘资源搜索：是一个免费开源项目!
👉 [爱盼-网盘资源搜索](https://so.aicompasspro.com)

### 更新
- 增加后台管理, 访问路径：/login | /admin/dashboard | /admin/clouddrive
- 后台可以增加自己的网盘资源

### 建议
项目使用的是第三方的API，对ip有访问限制，建议自己部署使用。

## 快速开始

### 在 Vercel 上部署

#### 之前已经部署过本项目
- 第1步，点击 storge 
![第1步](/assets/readme/vercel/exist/1.png)

- 第2步，选择postgres数据库
![第2步](/assets/readme/vercel/exist/2.png)

- 第3步，创建数据库名字 aipannetdisk， 选择数据库地理位置
![第3步](/assets/readme/vercel/exist/3.png)

- 第4步，复制POSTGRES_PRISMA_URL, ：后面的字符串，就是链接地址
![第4步](/assets/readme/vercel/exist/4.png)

- 第5步，切换部署的 git 分支 feat-add-admin-panel
![第5步](/assets/readme/vercel/exist/5.png)

- 第6步，创建部署时的.env 
![第6步](/assets/readme/vercel/exist/6.png)

- 第7步，创建项目安装时的命令， `npm install && npx prisma generate && npx prisma migrate deploy`
![第7步](/assets/readme/vercel/exist/7.png)

- 第8步，创建新的部署
![第8步](/assets/readme/vercel/exist/8.png)

- 第9步，选择要部署的git分支
![第9步](/assets/readme/vercel/exist/9.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/unilei/aipan-netdisk-search.git&project-name=aipan-netdisk-search&repository-name=aipan-netdisk-search)

### 在 Vercel 上手动部署 操作方法

```
1. fork 本项目
2. 在 [Vercel] 官网点击 [New Project]
3. 点击 [Import Git Repository] 并选择你 fork 的此项目并点击 [import]
4. 然后直接点 [Deploy] 接着等部署完成即可
```

 
### 打赏
![打赏](/assets/donation/wechat_pay.jpg)

### 交流
![交流](/assets/readme/wechat.jpg)
