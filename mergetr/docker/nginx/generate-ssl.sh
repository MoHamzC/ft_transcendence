#!/bin/bash
# generate-ssl.sh - Script de génération des certificats SSL

set -e

echo "🔐 Generating SSL certificates for ft_transcendence..."

# Créer le répertoire SSL s'il n'existe pas
mkdir -p /etc/nginx/ssl

# Générer un certificat auto-signé
openssl req -x509 -newkey rsa:4096 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -days 365 \
    -nodes \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=ft_transcendence/CN=localhost"

# Définir les permissions appropriées
chmod 600 /etc/nginx/ssl/key.pem
chmod 644 /etc/nginx/ssl/cert.pem

echo "✅ SSL certificates generated successfully!"
echo "📄 Certificate: /etc/nginx/ssl/cert.pem"
echo "🔑 Private key: /etc/nginx/ssl/key.pem"
