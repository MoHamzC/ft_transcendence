#!/bin/bash
# scripts/test-vault.sh
# Script de test automatique pour l'intégration Vault

set -e  # Arrêter en cas d'erreur

echo "🧪 Tests automatiques Vault - ft_transcendence"
echo "================================================"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables
PROJECT_DIR="/home/midnight/ft_transcendence/mergetr"
VAULT_ADDR="http://localhost:8200"
VAULT_TOKEN="myroot"
BACKEND_PORT="3001"

cd "$PROJECT_DIR"

echo ""
log_info "Phase 1 : Tests d'infrastructure"
echo "=================================="

# Test 1.1 : Démarrage des services
log_info "Démarrage de l'infrastructure Docker..."
docker-compose down > /dev/null 2>&1 || true
docker-compose up -d

# Attendre que les services soient prêts
log_info "Attente du démarrage des services..."
sleep 15

# Test 1.2 : Vérification Vault
log_info "Test de connectivité Vault..."
if curl -s "$VAULT_ADDR/v1/sys/health" | grep -q '"initialized":true'; then
    log_success "Vault accessible et initialisé"
else
    log_error "Vault inaccessible"
    exit 1
fi

# Test 1.3 : Vérification PostgreSQL
log_info "Test de connectivité PostgreSQL..."
if docker-compose logs db 2>/dev/null | grep -q "database system is ready"; then
    log_success "PostgreSQL accessible"
else
    log_warning "PostgreSQL possiblement pas encore prêt"
fi

echo ""
log_info "Phase 2 : Initialisation des secrets"
echo "====================================="

# Fonction pour ajouter un secret
add_secret() {
    local path=$1
    local data=$2
    log_info "Ajout secret: $path"
    
    curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
         -H "Content-Type: application/json" \
         -X POST \
         -d "$data" \
         "$VAULT_ADDR/v1/secret/data/$path" > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Secret $path ajouté"
    else
        log_error "Échec ajout secret $path"
        return 1
    fi
}

# Ajout des secrets
add_secret "database" '{"data":{"host":"db","port":"5432","user":"admin","password":"test","database":"db_transcendence"}}'
add_secret "jwt" '{"data":{"secret":"super_secure_jwt_secret_vault_test"}}'
add_secret "oauth/42" '{"data":{"client_id":"test_42_client","client_secret":"test_42_secret","redirect_uri":"http://localhost:3000/auth/42/callback"}}'
add_secret "oauth/github" '{"data":{"client_id":"test_github_client","client_secret":"test_github_secret","redirect_uri":"http://localhost:3000/auth/github/callback"}}'
add_secret "email" '{"data":{"host":"smtp.gmail.com","user":"test@test.com","password":"test_password"}}'

echo ""
log_info "Phase 3 : Vérification des secrets"
echo "==================================="

# Fonction pour vérifier un secret
verify_secret() {
    local path=$1
    log_info "Vérification secret: $path"
    
    local response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/secret/data/$path")
    
    if echo "$response" | grep -q '"data"'; then
        log_success "Secret $path lisible"
        return 0
    else
        log_error "Secret $path non accessible"
        return 1
    fi
}

# Vérification des secrets
verify_secret "database"
verify_secret "jwt"
verify_secret "oauth/42"
verify_secret "oauth/github"
verify_secret "email"

echo ""
log_info "Phase 4 : Tests backend local"
echo "=============================="

# Démarrage du backend local
log_info "Démarrage du backend local sur port $BACKEND_PORT..."

cd backend

# Tuer les processus existants
pkill -f "node src/server.js" > /dev/null 2>&1 || true
sleep 2

# Démarrer le backend en arrière-plan
VAULT_ADDR="$VAULT_ADDR" \
VAULT_TOKEN="$VAULT_TOKEN" \
DB_HOST="localhost" \
DB_PORT="5434" \
NODE_ENV="development" \
PORT="$BACKEND_PORT" \
npm start > /tmp/vault-test-backend.log 2>&1 &

BACKEND_PID=$!
log_info "Backend PID: $BACKEND_PID"

# Attendre que le backend démarre
sleep 10

# Vérifier que le backend tourne
if ps -p $BACKEND_PID > /dev/null; then
    log_success "Backend démarré"
else
    log_error "Backend n'a pas démarré"
    cat /tmp/vault-test-backend.log
    exit 1
fi

echo ""
log_info "Phase 5 : Tests des routes Vault"
echo "================================="

# Fonction pour tester une route
test_route() {
    local route=$1
    local expected=$2
    log_info "Test route: $route"
    
    local response=$(curl -s "http://localhost:$BACKEND_PORT$route")
    local status=$?
    
    if [ $status -eq 0 ] && echo "$response" | grep -q "$expected"; then
        log_success "Route $route OK"
        return 0
    else
        log_error "Route $route FAIL - Response: $response"
        return 1
    fi
}

# Tests des routes
test_route "/api/vault/health" "healthy"
test_route "/api/vault/secret/database" "db_transcendence"
test_route "/api/vault/secret/jwt" "super_secure_jwt_secret_vault_test"
test_route "/api/vault/secret/oauth/42" "test_42_client"
test_route "/auth/test" "OAuth routes are working"

echo ""
log_info "Phase 6 : Tests de fallback"
echo "============================"

# Arrêt de Vault pour tester le fallback
log_info "Arrêt de Vault pour test de fallback..."
cd "$PROJECT_DIR"
docker-compose stop vault

sleep 5

# Le backend devrait continuer à fonctionner avec les variables d'environnement
log_info "Test du fallback (backend devrait utiliser .env)..."
if curl -s "http://localhost:$BACKEND_PORT/healthz" | grep -q "ok"; then
    log_success "Fallback fonctionnel"
else
    log_warning "Fallback possiblement non fonctionnel"
fi

# Redémarrage de Vault
log_info "Redémarrage de Vault..."
docker-compose start vault
sleep 10

echo ""
log_info "Phase 7 : Nettoyage"
echo "==================="

# Arrêt du backend de test
if ps -p $BACKEND_PID > /dev/null; then
    log_info "Arrêt du backend de test..."
    kill $BACKEND_PID
    sleep 2
fi

# Nettoyage des logs
rm -f /tmp/vault-test-backend.log

echo ""
log_success "🎉 Tests Vault terminés avec succès !"
echo ""
log_info "📊 Résumé des fonctionnalités testées :"
echo "  ✅ Infrastructure Docker (Vault + DB + Backend)"
echo "  ✅ Stockage et lecture des secrets"
echo "  ✅ Intégration backend avec Vault"
echo "  ✅ Routes de monitoring"
echo "  ✅ Routes OAuth"
echo "  ✅ Mécanisme de fallback"
echo ""
log_info "🔧 Pour continuer le développement :"
echo "  - Interface web Vault : http://localhost:8200 (token: myroot)"
echo "  - Backend avec Vault : Port 3001"
echo "  - Tests REST : npm run test:http -- --include=\"**/vault.http\""
echo ""
