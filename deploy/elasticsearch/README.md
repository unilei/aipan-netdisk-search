# Elasticsearch 单机 VPS 部署

## 1. 准备系统参数

```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-elasticsearch.conf
sudo sysctl --system
```

## 2. 启动 Elasticsearch

```bash
cp .env.example .env
docker compose --env-file .env up -d
```

默认会启动单节点 Elasticsearch，并使用 `.env` 中的 `ELASTIC_PASSWORD` 作为 `elastic` 用户密码。

## 3. 验证集群健康

先把 HTTP CA 证书从容器里拷出来：

```bash
docker cp aipan-elasticsearch:/usr/share/elasticsearch/config/certs/http_ca.crt ./http_ca.crt
```

然后检查健康状态：

```bash
curl --cacert ./http_ca.crt -u "elastic:${ELASTIC_PASSWORD}" https://localhost:9200/_cluster/health
```

## 4. 获取 CA 指纹

应用服务器会用 CA 指纹连接 ES。可在 ES VPS 上执行：

```bash
openssl s_client -connect localhost:9200 -servername localhost -showcerts </dev/null 2>/dev/null \
  | openssl x509 -fingerprint -sha256 -noout -in /dev/stdin
```

把输出中的 SHA256 指纹写到应用侧 `ELASTICSEARCH_CA_FINGERPRINT`。

## 5. 防火墙白名单

- 只允许应用服务器 IP 访问 `9200`
- 不要向公网开放任意来源

示例 `ufw`：

```bash
sudo ufw allow from <APP_SERVER_IP> to any port 9200 proto tcp
sudo ufw deny 9200/tcp
sudo ufw reload
```

## 6. 应用侧配置

把以下变量配置到应用服务器：

- `ELASTICSEARCH_NODE=https://<ES_VPS_IP>:9200`
- `ELASTICSEARCH_USERNAME=elastic`
- `ELASTICSEARCH_PASSWORD=<ELASTIC_PASSWORD>`
- `ELASTICSEARCH_CA_FINGERPRINT=<SHA256 指纹>`
- `ELASTICSEARCH_USER_RESOURCE_INDEX=user-resources`
