# Production host safeguards

The production host runs several applications on a 5 GiB VM. These files keep
one nginx worker or one application container from exhausting global memory.

Install the nginx safeguards as root:

```sh
install -d -m 0755 /etc/systemd/system/nginx.service.d
install -m 0644 deploy/host/nginx.service.override.conf /etc/systemd/system/nginx.service.d/override.conf
install -m 0755 deploy/host/nginx-memory-guard /usr/local/sbin/nginx-memory-guard
install -m 0644 deploy/host/nginx-memory-guard.service /etc/systemd/system/nginx-memory-guard.service
install -m 0644 deploy/host/nginx-memory-guard.timer /etc/systemd/system/nginx-memory-guard.timer
install -m 0644 deploy/host/nginx-vhosts.logrotate /etc/logrotate.d/nginx-vhosts
systemctl daemon-reload
systemctl enable --now nginx-memory-guard.timer
```

The systemd override caps the nginx cgroup at 1.5 GiB RAM and 512 MiB swap.
The timer checks every five minutes and restarts nginx only when an individual
worker's resident plus swapped memory reaches 768 MiB. Configuration is tested
before any restart. Log rotation keeps 14 daily generations and rotates early
when a vhost log exceeds 100 MiB.
