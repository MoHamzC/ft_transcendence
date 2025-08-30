#!/bin/bash
# enable-https.sh - Activer HTTPS obligatoire pour la correction

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔒 Activation HTTPS obligatoire (sujet)${NC}"
echo "========================================"

# Vérifier si Docker est en marche
if ! docker-compose ps | grep -q "vault.*Up"; then
    echo -e "${YELLOW}🐳 Démarrage des services Docker...${NC}"
    docker-compose up -d
    sleep 3
fi

# Générer certificats SSL
echo -e "${YELLOW}🔐 Génération des certificats SSL...${NC}"
mkdir -p ssl
cd ssl

if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    # Certificat auto-signé pour dev
    openssl genrsa -out key.pem 2048
    openssl req -new -x509 -key key.pem -out cert.pem -days 365 -subj "/C=FR/ST=France/L=Paris/O=42School/OU=ft_transcendence/CN=localhost" -batch
    echo -e "${GREEN}✅ Certificats SSL générés${NC}"
else
    echo -e "${GREEN}✅ Certificats SSL déjà présents${NC}"
fi

cd ..

# Démarrer le serveur HTTPS
echo -e "${YELLOW}🚀 Démarrage du serveur HTTPS...${NC}"
cd backend

# Variables d'environnement pour HTTPS
export HTTPS_PORT=3443
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=myroot
export DB_HOST=localhost
export DB_PORT=5434
export NODE_ENV=development

echo -e "${GREEN}🌐 Serveur HTTPS : https://localhost:3443${NC}"
echo -e "${GREEN}📱 Frontend Vite : http://localhost:5173${NC}"
echo -e "${YELLOW}⚠️  Acceptez le certificat auto-signé dans le navigateur${NC}"
echo -e "${RED}⚠️  Ctrl+C pour arrêter${NC}"

# Lancer le serveur HTTPS
node src/server-https.js
