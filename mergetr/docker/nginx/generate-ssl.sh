#!/bin/bash
# Script pour générer des certificats SSL auto-signés pour le développement

# Créer le répertoire SSL
mkdir -p /etc/nginx/ssl

# Générer une clé privée
openssl genrsa -out /etc/nginx/ssl/key.pem 2048

# Générer un certificat auto-signé
openssl req -new -x509 -key /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -days 365 -subj "/C=FR/ST=France/L=Paris/O=42School/OU=ft_transcendence/CN=localhost"

echo "✅ Certificats SSL générés pour le développement"
echo "⚠️  En production, utilisez des certificats valides (Let's Encrypt, etc.)"
