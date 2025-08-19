#!/bin/bash
# Script de démarrage et test pour ft_transcendence
# Usage: ./start-and-test.sh

set -e

echo "🏓 ft_transcendence - Démarrage et Tests"
echo "======================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Fonction pour attendre qu'un service soit prêt
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=$3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service est prêt"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service n'est pas accessible après $max_attempts tentatives"
    return 1
}

# Étape 1: Nettoyer les anciens conteneurs
print_step "Nettoyage des anciens conteneurs"
docker-compose down --remove-orphans
print_success "Nettoyage terminé"

# Étape 2: Construire et démarrer les services
print_step "Construction et démarrage des services"
docker-compose up --build -d
print_success "Services démarrés"

# Étape 3: Vérifier l'état des services
print_step "Vérification de l'état des services"
docker-compose ps

# Étape 4: Attendre que la DB soit prête
print_step "Attente de la base de données"
echo -n "Attente de PostgreSQL"
if wait_for_service "PostgreSQL" "http://localhost:8080" 30; then
    print_success "Base de données accessible via Adminer"
else
    print_error "Impossible d'accéder à la base de données"
    docker-compose logs db
    exit 1
fi

# Étape 5: Attendre que le backend soit prêt
print_step "Attente du backend"
echo -n "Attente du serveur backend"
if wait_for_service "Backend" "http://localhost:5001/healthcheck" 60; then
    print_success "Backend accessible"
else
    print_error "Backend non accessible"
    echo "Logs du backend:"
    docker-compose logs backend
    exit 1
fi

# Étape 6: Vérifier le frontend
print_step "Vérification du frontend"
echo -n "Attente du frontend"
if wait_for_service "Frontend" "http://localhost:5173" 30; then
    print_success "Frontend accessible"
else
    print_error "Frontend non accessible"
    echo "Logs du frontend:"
    docker-compose logs frontend
fi

# Étape 7: Tests du StatsService
print_step "Tests du StatsService"

echo "Test 1: Health check"
response=$(curl -s http://localhost:5001/healthcheck)
if echo "$response" | grep -q "OK"; then
    print_success "Health check réussi"
else
    print_error "Health check échoué"
fi

echo ""
echo "Test 2: Création d'un utilisateur de test"
register_response=$(curl -s -w "%{http_code}" -o /tmp/register.json \
    -X POST http://localhost:5001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@docker.stats","password":"password123456"}')

register_code=$(echo "$register_response" | tail -c 4)
if [[ "$register_code" == "201" ]] || [[ "$register_code" == "409" ]]; then
    print_success "Utilisateur créé ou existe déjà"
else
    print_error "Échec création utilisateur (code: $register_code)"
    cat /tmp/register.json
fi

echo ""
echo "Test 3: Login utilisateur"
login_response=$(curl -s -w "%{http_code}" -o /tmp/login.json \
    -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@docker.stats","password":"password123456"}')

login_code=$(echo "$login_response" | tail -c 4)
if [[ "$login_code" == "200" ]]; then
    TOKEN=$(cat /tmp/login.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [[ -n "$TOKEN" ]]; then
        print_success "Login réussi - Token obtenu"
    else
        print_error "Token non trouvé dans la réponse"
        cat /tmp/login.json
    fi
else
    print_error "Échec login (code: $login_code)"
    cat /tmp/login.json
fi

if [[ -n "$TOKEN" ]]; then
    echo ""
    echo "Test 4: Récupération des statistiques"
    stats_response=$(curl -s -w "%{http_code}" -o /tmp/stats.json \
        -X GET http://localhost:5001/api/user/statistics \
        -H "Authorization: Bearer $TOKEN")
    
    stats_code=$(echo "$stats_response" | tail -c 4)
    if [[ "$stats_code" == "200" ]]; then
        print_success "Statistiques récupérées"
        echo "Contenu:"
        cat /tmp/stats.json | grep -o '"stats":{[^}]*}' || cat /tmp/stats.json
    else
        print_error "Échec récupération stats (code: $stats_code)"
        cat /tmp/stats.json
    fi

    echo ""
    echo "Test 5: Récupération du leaderboard"
    leader_response=$(curl -s -w "%{http_code}" -o /tmp/leaderboard.json \
        -X GET http://localhost:5001/api/user/leaderboard \
        -H "Authorization: Bearer $TOKEN")
    
    leader_code=$(echo "$leader_response" | tail -c 4)
    if [[ "$leader_code" == "200" ]]; then
        print_success "Leaderboard récupéré"
        echo "Contenu:"
        cat /tmp/leaderboard.json
    else
        print_error "Échec récupération leaderboard (code: $leader_code)"
        cat /tmp/leaderboard.json
    fi
fi

echo ""
echo "Test 6: Test sans authentification (doit échouer)"
no_auth_response=$(curl -s -w "%{http_code}" -o /tmp/no_auth.json \
    -X GET http://localhost:5001/api/user/statistics)

no_auth_code=$(echo "$no_auth_response" | tail -c 4)
if [[ "$no_auth_code" == "401" ]]; then
    print_success "Authentification correctement requise"
else
    print_error "Authentification non requise (code: $no_auth_code)"
fi

# Résumé final
echo ""
echo "🎯 Résumé des tests"
echo "=================="
print_info "Services accessibles:"
echo "  • Base de données: http://localhost:8080 (Adminer)"
echo "  • Backend API: http://localhost:5001"
echo "  • Frontend: http://localhost:5173"

if [[ -n "$TOKEN" ]]; then
    echo ""
    print_info "Token JWT pour tests manuels:"
    echo "  $TOKEN"
    echo ""
    print_info "Exemples de requêtes curl:"
    echo "  curl -H 'Authorization: Bearer $TOKEN' http://localhost:5001/api/user/statistics"
    echo "  curl -H 'Authorization: Bearer $TOKEN' http://localhost:5001/api/user/leaderboard"
fi

echo ""
print_info "Pour arrêter les services:"
echo "  docker-compose down"

# Nettoyage
rm -f /tmp/register.json /tmp/login.json /tmp/stats.json /tmp/leaderboard.json /tmp/no_auth.json

print_success "Tests terminés!"
