#!/bin/bash

if [ -f "./nginx/nginx.conf" ]; then
    CONFIG_FILE="./nginx/nginx.conf"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    CONFIG_FILE="/etc/nginx/conf.d/default.conf"
else
    echo "❌ Error: Nginx configuration file not found!"
    exit 1
fi

echo "Using config file: $CONFIG_FILE"

server_count=$(awk '/upstream/,/}/ {if ($1 == "server") count++} END {print +count}' "$CONFIG_FILE")

echo "Found backend servers count: $server_count"

if [ "$server_count" -eq 1 ]; then
    echo "✅ Nginx is configured to work with only ONE backend server."
elif [ "$server_count" -gt 1 ]; then
    echo "⚠️ Nginx is working with multiple backend servers (Load Balancing)."
else
    echo "❌ No backend servers found in the configuration."
fi