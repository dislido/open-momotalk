
# nginx
```bash
# config
vim /etc/nginx/nginx.conf
# 修改设置后重载生效
nginx -s reload
# 停止
nginx -s stop
nginx -s quit
# 启动
nginx
# 开关服务
# systemctl start nginx.service
# systemctl stop nginx.service
```

# https
## 用certbot获取证书
百度一下

## 获取泛域名证书
xxx.com改成自己的地址
```bash
git clone https://github.com/ywdblog/certbot-letencrypt-wildcardcertificates-alydns-au --depth=1

# 测试 
sudo certbot certonly -d xxx.com -d *.xxx.com --manual --preferred-challenges dns --dry-run  --manual-auth-hook "/root/certbot-letencrypt-wildcardcertificates-alydns-au/au.sh python aly add" --manual-cleanup-hook "/root/certbot-letencrypt-wildcardcertificates-alydns-au/au.sh python aly clean"

# 测试成功去掉`--dry-run`执行
sudo certbot certonly -d xxx.com -d *.xxx.com --manual --preferred-challenges dns --manual-auth-hook "/root/certbot-letencrypt-wildcardcertificates-alydns-au/au.sh python aly add" --manual-cleanup-hook "/root/certbot-letencrypt-wildcardcertificates-alydns-au/au.sh python aly clean"
```
