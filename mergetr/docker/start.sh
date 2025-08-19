#!/bin/sh
# Script de démarrage sécurisé

echo "🚀 Starting ft_transcendence with security..."

# Vérifier les certificats SSL
if [ ! -f /etc/nginx/ssl/cert.pem ]; then
    echo "❌ SSL certificates not found"
    exit 1
fi

# Démarrer le backend Node.js en arrière-plan
echo "🟢 Starting Node.js backend..."
cd /app/backend
export NODE_ENV=production
export VAULT_ADDR=${VAULT_ADDR:-http://vault:8200}
export VAULT_TOKEN=${VAULT_TOKEN:-myroot}
node src/server.js &

# Attendre que le backend soit prêt
echo "⏳ Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if nc -z localhost 3000; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start"
        exit 1
    fi
done

# Démarrer nginx en premier plan
echo "🌐 Starting nginx with HTTPS..."
nginx -g "daemon off;"
