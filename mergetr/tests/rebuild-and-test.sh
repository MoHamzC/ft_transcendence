#!/bin/bash
# scripts/rebuild-and-test.sh
# Script de reconstruction complète et test

echo "🔨 Reconstruction et test complet Vault"
echo "======================================="

PROJECT_DIR="/home/midnight/ft_transcendence/mergetr"
cd "$PROJECT_DIR"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo ""
log_info "Étape 1 : Arrêt des services existants"
docker-compose down

echo ""
log_info "Étape 2 : Reconstruction de l'image backend"
docker-compose build --no-cache node

echo ""
log_info "Étape 3 : Installation des dépendances locales"
cd backend && npm install && cd ..

echo ""
log_info "Étape 4 : Démarrage complet avec rebuild"
docker-compose up -d

echo ""
log_info "Étape 5 : Exécution des tests automatiques"
sleep 15  # Attendre que les services soient prêts
./scripts/test-vault.sh

echo ""
log_success "🎉 Reconstruction et tests terminés !"
echo ""
echo "💡 Services disponibles :"
echo "  - Vault UI : http://localhost:8200 (token: myroot)"
echo "  - Backend Docker : http://localhost:3000"
echo "  - Backend Test : http://localhost:3001 (lors des tests)"
echo "  - PostgreSQL : localhost:5434"
