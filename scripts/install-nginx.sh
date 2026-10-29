#! /bin/bash

set -eux

apt-get update
apt-get install -y nginx

cat > /var/www/html/index.html << 'HTML'
<!DOCTYPE html>
<html>
  <head>
    <title>My AWS Project</title>
  </head>
  <body>
    <h1>Hello from Terraform!</h1>
    <p>Nginx was installed automatically.</p>
  </body>
</html>
HTML

systemctl enable --now nginx
