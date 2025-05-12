# 数据库迁移说明

## 源数据库连接字符串
postgresql://aipan:aipan12345678@66.103.211.214:5432/aipan

## 目标数据库连接字符串
postgresql://postgres:postgres@142.171.105.185:5432/aipan

## 迁移命令
./db-migrate.sh

## 注意事项
    docker run --rm -it postgres:16-alpine psql 'postgresql://postgres:postgres@142.171.105.185:5432/postgres' -c 'CREATE DATABASE aipan;'
