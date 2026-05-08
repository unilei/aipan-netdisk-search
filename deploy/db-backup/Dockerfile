FROM postgres:15-alpine

RUN apk add --no-cache aws-cli tzdata

COPY backup.sh /usr/local/bin/aipan-db-backup
RUN chmod +x /usr/local/bin/aipan-db-backup

ENTRYPOINT ["/usr/local/bin/aipan-db-backup"]
