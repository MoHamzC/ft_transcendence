#!/bin/bash
# generate-ssl.sh - Génération des certificats SSL pour ft_transcendence

set -e

echo "🔐 Génération des certificats SSL pour HTTPS..."

# Créer le répertoire ssl s'il n'existe pas
mkdir -p /etc/nginx/ssl

# Générer la clé privée
openssl genrsa -out /etc/nginx/ssl/key.pem 2048

# Générer le certificat auto-signé
openssl req -new -x509 -key /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -days 365 \
    -subj "/C=FR/ST=France/L=Paris/O=42School/OU=ft_transcendence/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"

# Permissions appropriées
chmod 600 /etc/nginx/ssl/key.pem
chmod 644 /etc/nginx/ssl/cert.pem

echo "✅ Certificats SSL générés:"
echo "   - Certificat: /etc/nginx/ssl/cert.pem"
echo "   - Clé privée: /etc/nginx/ssl/key.pem"
echo "   - Validité: 365 jours"
echo "   - Domaines: localhost, 127.0.0.1"
