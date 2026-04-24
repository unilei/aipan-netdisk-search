# Elasticsearch 单机 VPS 部署

本目录只负责独立 ES VPS 的部署资产。应用服务器不在这里启动 ES。

当前约定：

- ES VPS：`66.103.211.214`
- 应用服务器白名单 IP：`209.54.106.114`
- ES 端口：`9200`
- 应用侧索引名：`user-resources`
- 应用连接方式：`HTTPS + Basic Auth + CA fingerprint`

## 1. 准备系统参数

在 ES VPS 上执行：

```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-elasticsearch.conf
sudo sysctl --system
```

## 2. 配置 ES 环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```bash
ELASTICSEARCH_VERSION=8.19.12
ELASTICSEARCH_PORT=9200
ELASTIC_PASSWORD=<生成一个强密码>
ES_JAVA_OPTS=-Xms1g -Xmx1g
```

`ELASTIC_PASSWORD` 是应用侧 `ELASTICSEARCH_PASSWORD` 的来源，不要提交到仓库。

## 3. 启动 Elasticsearch

```bash
docker compose --env-file .env up -d
```

查看状态：

```bash
docker ps --filter name=aipan-elasticsearch
docker logs -f aipan-elasticsearch
```

## 4. 获取 HTTP CA 证书

```bash
docker cp aipan-elasticsearch:/usr/share/elasticsearch/config/certs/http_ca.crt ./http_ca.crt
```

本机验证：

```bash
curl --cacert ./http_ca.crt -u "elastic:${ELASTIC_PASSWORD}" https://localhost:9200/_cluster/health
```

## 5. 获取 CA 指纹

应用服务器通过 CA 指纹校验 ES TLS 证书：

```bash
openssl s_client -connect localhost:9200 -servername localhost -showcerts </dev/null 2>/dev/null \
  | openssl x509 -fingerprint -sha256 -noout -in /dev/stdin
```

把输出中 `SHA256 Fingerprint=` 后面的值写入应用侧 `ELASTICSEARCH_CA_FINGERPRINT`。

## 6. 防火墙白名单

`9200` 只允许应用服务器 `209.54.106.114` 访问。

示例 `ufw`：

```bash
sudo ufw allow from 209.54.106.114 to any port 9200 proto tcp
sudo ufw deny 9200/tcp
sudo ufw reload
sudo ufw status
```

如果使用云厂商安全组，也需要在安全组里只放行 `209.54.106.114/32 -> 9200`。

## 7. 应用侧配置

应用侧 `.env` 或 GitHub Actions 变量需要配置：

```bash
ELASTICSEARCH_NODE=https://66.103.211.214:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=<ELASTIC_PASSWORD>
ELASTICSEARCH_CA_FINGERPRINT=<SHA256 指纹>
ELASTICSEARCH_USER_RESOURCE_INDEX=user-resources
```

GitHub Actions 中建议：

- Secrets：`ELASTICSEARCH_USERNAME`、`ELASTICSEARCH_PASSWORD`
- Variables：`ELASTICSEARCH_NODE`、`ELASTICSEARCH_CA_FINGERPRINT`、`ELASTICSEARCH_USER_RESOURCE_INDEX`

## 8. 应用内运维

后台页面：

- 查看索引内容：`/admin/search-index/user-resources`
- 审核用户资源：`/admin/user-resources`

管理员 API：

- 查看索引：`GET /api/admin/user-resources/search`
- 重建索引：`POST /api/admin/user-resources/search/reindex`
- 自动审核：`POST /api/admin/user-resources/auto-review`

重建索引只处理 `UserResource` 且只导入 `published` 状态资源，不会修改本地 `Resource` 表。
