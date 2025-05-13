# 数据库迁移说明

## 源数据库连接字符串
postgresql://aipan:aipan12345678@66.103.211.214:5432/aipan

## 目标数据库连接字符串
postgresql://aipanme:aipanme123@142.171.105.185:5432/aipan?schema=public

<!-- postgresql://postgres:postgres@142.171.105.185:5432/aipan -->

## 迁移命令
./db-migrate.sh

## 注意事项

### 数据库操作命令

#### 方法1：使用连接字符串

```bash
# 使用超级用户创建数据库
docker run --rm -it postgres:16-alpine psql 'postgresql://aipanme:aipanme123@142.171.105.185:5432/postgres' -c 'CREATE DATABASE aipan;'

# 使用超级用户清空数据库
docker run --rm -it postgres:16-alpine psql 'postgresql://aipanme:aipanme123@142.171.105.185:5432/aipan' -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
```

#### 方法2：使用环境变量传递密码

```bash
# 使用超级用户创建数据库
docker run --rm -e PGPASSWORD="aipanme123" postgres:16-alpine psql -h 142.171.105.185 -p 5432 -U aipanme -d postgres -c 'CREATE DATABASE aipan;'

# 使用超级用户清空数据库
docker run --rm -e PGPASSWORD="aipanme123" postgres:16-alpine psql -h 142.171.105.185 -p 5432 -U aipanme -d aipan -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
```

### 如果遇到权限问题

如果遇到权限问题，可能需要使用数据库管理员账号（通常是 postgres 用户）：

```bash
# 使用postgres用户创建数据库
docker run --rm -e PGPASSWORD="postgres" postgres:16-alpine psql -h 142.171.105.185 -p 5432 -U postgres -d postgres -c 'CREATE DATABASE aipan;'

# 使用postgres用户授予权限
docker run --rm -e PGPASSWORD="postgres" postgres:16-alpine psql -h 142.171.105.185 -p 5432 -U postgres -d postgres -c 'ALTER USER aipanme WITH SUPERUSER;'

# 或者授予特定权限
docker run --rm -e PGPASSWORD="postgres" postgres:16-alpine psql -h 142.171.105.185 -p 5432 -U postgres -d postgres -c 'ALTER USER aipanme WITH CREATEDB;'
docker run --rm -e PGPASSWORD="postgres" postgres:16-alpine psql -h 142.171.105.185 -p 5432 -U postgres -d aipan -c 'GRANT ALL PRIVILEGES ON DATABASE aipan TO aipanme;'
```
