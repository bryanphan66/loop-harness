# Ops-board — trang tinh, khong build step, khong runtime nao ngoai nginx.
#
# Du lieu KHONG nam trong image: `run-log.jsonl` va `board.json` duoc mount vao
# /usr/share/nginx/html luc chay. Co y nhu vay — image bat bien, du lieu thay
# doi moi gio; nhet du lieu vao image nghia la phai build lai moi lan co so moi.
#
# Thieu ca 2 file -> trang tu roi ve DU LIEU MAU va bao thang tren banner.
FROM nginx:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html

# Du lieu la dong -> khong cache. Trang tinh -> cache ngan.
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  root /usr/share/nginx/html;' \
  '  charset utf-8;' \
  '  location = /healthz { return 200 "ok\\n"; add_header Content-Type text/plain; }' \
  '  location ~* \.(jsonl|json)$ { add_header Cache-Control "no-store"; }' \
  '  location / { try_files $uri $uri/ /index.html; add_header Cache-Control "no-cache"; }' \
  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
