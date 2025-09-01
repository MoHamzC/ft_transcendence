#!/bin/bash
# start.sh - Script de démarrage pour ft_transcendence en production

set -e

echo "🚀 Starting ft_transcendence production environment..."

# Générer les certificats SSL si nécessaire
if [ ! -f /etc/nginx/ssl/cert.pem ] || [ ! -f /etc/nginx/ssl/key.pem ]; then
    echo "🔐 Generating SSL certificates..."
    mkdir -p /etc/nginx/ssl
    openssl req -x509 -newkey rsa:4096 -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -days 365 -nodes -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=ft_transcendence/CN=localhost"
    chmod 600 /etc/nginx/ssl/key.pem
    chmod 644 /etc/nginx/ssl/cert.pem
fi

# Démarrer supervisor qui gère nginx et le backend
echo "📡 Starting services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
