#!/bin/bash

# =============================================================================
# 🚀 FT_TRANSCENDENCE - SCRIPT DE TESTS COMPLETS
# =============================================================================
# Ce script teste tous les composants de l'application ft_transcendence :
# - HTTPS (Backend + Frontend)
# - HashiCorp Vault
# - Routes GDPR
# - Authentification JWT
# - Services Docker
# - Base de données
# =============================================================================

# Configuration
BACKEND_URL="https://localhost:5001"
FRONTEND_URL="https://localhost:5173"
VAULT_URL="http://localhost:8200"
DB_HOST="localhost"
DB_PORT="5434"

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Compteurs de tests
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction d'affichage des résultats
print_header() {
    echo -e "${BLUE}================================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================================${NC}"
}

print_subheader() {
    echo -e "${CYAN}--- $1 ---${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Fonction de test générique
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="${3:-200}"

    ((TESTS_TOTAL++))

    echo -n "Testing $test_name... "

    # Exécuter la commande et capturer le code de sortie
    if eval "$command" > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

# =============================================================================
# TESTS DOCKER
# =============================================================================

test_docker_services() {
    print_header "🐳 TESTS DES SERVICES DOCKER"

    # Vérifier que Docker Compose est disponible
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose n'est pas installé"
        return 1
    fi

    print_info "Vérification des services Docker..."

    # Lister les services
    echo "Services Docker actifs :"
    docker-compose ps

    # Vérifier chaque service
    services=("node" "frontend" "db" "vault" "adminer")
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service"; then
            print_success "Service $service : ACTIF"
        else
            print_error "Service $service : INACTIF"
        fi
    done
}

# =============================================================================
# TESTS HTTPS
# =============================================================================

test_https() {
    print_header "🔒 TESTS HTTPS"

    print_subheader "Test du Backend HTTPS"
    run_test "Backend HTTPS (port 5001)" "curl -k --connect-timeout 5 $BACKEND_URL/healthcheck"

    print_subheader "Test du Frontend HTTPS"
    run_test "Frontend HTTPS (port 5173)" "curl -k --connect-timeout 5 $FRONTEND_URL"

    print_subheader "Vérification des certificats SSL"
    echo "Certificat Backend :"
    openssl s_client -connect localhost:5001 -servername localhost < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject | sed 's/^/  /'

    echo "Certificat Frontend :"
    openssl s_client -connect localhost:5173 -servername localhost < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject | sed 's/^/  /'

    print_subheader "Test de la validation SSL"
    if curl --connect-timeout 5 $BACKEND_URL/healthcheck 2>&1 | grep -q "self-signed certificate"; then
        print_success "Validation SSL : Fonctionnelle (rejette certificat auto-signé)"
    else
        print_warning "Validation SSL : Non testée (utilise -k)"
    fi
}

# =============================================================================
# TESTS VAULT
# =============================================================================

test_vault() {
    print_header "🔐 TESTS HASHICORP VAULT"

    print_subheader "Santé de Vault"
    run_test "Vault Health" "curl -k $BACKEND_URL/api/vault/health"

    print_subheader "Connexion directe à Vault"
    run_test "Vault Direct Access" "curl -H 'X-Vault-Token: myroot' $VAULT_URL/v1/secret/data/ft_transcendence"

    print_subheader "Secrets disponibles"
    echo "Liste des secrets :"
    curl -k $BACKEND_URL/api/vault/secrets 2>/dev/null | jq -r '.secrets[]' 2>/dev/null || echo "  Impossible de récupérer la liste"

    print_subheader "Test des secrets principaux"
    secrets=("database" "jwt" "email" "oauth/42" "oauth/github" "oauth/google")
    for secret in "${secrets[@]}"; do
        if curl -k "$BACKEND_URL/api/vault/secret/$secret" 2>/dev/null | grep -q "data"; then
            print_success "Secret $secret : ACCESSIBLE"
        else
            print_error "Secret $secret : INACCESSIBLE"
        fi
    done

    print_subheader "Test d'initialisation des secrets"
    run_test "Initialisation Dev Secrets" "curl -k -X POST $BACKEND_URL/api/vault/init-dev-secrets"
}

# =============================================================================
# TESTS GDPR
# =============================================================================

test_gdpr() {
    print_header "📋 TESTS GDPR (RGPD)"

    print_subheader "Route de test GDPR"
    run_test "GDPR Test Route" "curl -k $BACKEND_URL/api/gdpr/test"

    print_subheader "Création d'un utilisateur test"
    echo "Création de l'utilisateur test pour les tests GDPR..."
    
    
    # Créer l'utilisateur via l'API d'inscription
    register_response=$(curl -k -X POST $BACKEND_URL/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"test2@example.com","username":"testuser","password":"TestPassword123"}' 2>/dev/null)
    
    if echo "$register_response" | grep -q "id"; then
        print_success "Utilisateur test créé"
    else
        print_warning "Échec de création utilisateur via API, tentative directe en DB..."
        
        # Fallback: créer directement en DB
        docker compose exec -T db psql -U admin -d db_transcendence -c "INSERT INTO users (email, username, password_hash) VALUES ('test2@example.com', 'testuser', '\$2b\$10\$v1CQWXFYnMAZ7PvXxmCb4OyWIzT9bSjxjgqjpINdidrZ3Rc8q/Gvq');" 2>/dev/null || true
        user_id=$(docker compose exec -T db psql -U admin -d db_transcendence -c "SELECT id FROM users WHERE email = 'test2@example.com';" -t -A 2>/dev/null || echo "")
        
        if [ ! -z "$user_id" ]; then
            docker compose exec -T db psql -U admin -d db_transcendence -c "INSERT INTO user_settings (user_id) VALUES ($user_id);" 2>/dev/null || true
            print_success "Utilisateur test créé (fallback DB)"
        else
            print_error "Impossible de créer l'utilisateur test"
        fi
    fi

    print_subheader "Authentification pour tests GDPR"
    echo "Tentative de login pour obtenir un token JWT..."
    login_response=$(curl -k -X POST $BACKEND_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test2@example.com","password":"TestPassword123"}' 2>/dev/null)

    if echo "$login_response" | grep -q "Login successful"; then
        print_success "Authentification : RÉUSSIE"
        token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "Token JWT obtenu : ${token:0:50}..."

        print_subheader "Tests des routes GDPR authentifiées"

        # Test d'export (nécessite un utilisateur en base)
        if curl -k -H "Authorization: Bearer $token" "$BACKEND_URL/api/gdpr/export" 2>/dev/null | grep -q "export_info"; then
            print_success "GDPR Export : FONCTIONNEL"
        else
            print_warning "GDPR Export : ÉCHEC (aucun utilisateur en base)"
        fi

        # Test d'anonymisation
        run_test "GDPR Anonymize" "curl -k -X POST $BACKEND_URL/api/gdpr/anonymize -H 'Authorization: Bearer $token' -H 'Content-Type: application/json' -d '{\"confirmation\":\"I_UNDERSTAND_THIS_IS_IRREVERSIBLE\"}'"

        # Test de suppression de compte
        run_test "GDPR Account Deletion" "curl -k -X DELETE $BACKEND_URL/api/gdpr/account -H 'Authorization: Bearer $token' -H 'Content-Type: application/json' -d '{\"confirmation\":\"DELETE_MY_ACCOUNT_PERMANENTLY\",\"reason\":\"privacy_concerns\"}'"
        # Supprimer l'utilisateur existant s'il existe
        docker compose exec -T db psql -U admin -d db_transcendence -c "DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = 'test2@example.com');" 2>/dev/null || true
        docker compose exec -T db psql -U admin -d db_transcendence -c "DELETE FROM users WHERE email = 'test2@example.com';" 2>/dev/null || true

    else
        print_error "Authentification : ÉCHEC"
        print_warning "Tests GDPR authentifiés ignorés"
    fi
}

# =============================================================================
# TESTS BASE DE DONNÉES
# =============================================================================

test_database() {
    print_header "🗄️  TESTS BASE DE DONNÉES"

    print_subheader "Connexion à PostgreSQL"
    if docker-compose exec -T db psql -U admin -d db_transcendence -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Connexion PostgreSQL : RÉUSSIE"
    else
        print_error "Connexion PostgreSQL : ÉCHEC"
        return 1
    fi

    print_subheader "Structure de la base"
    echo "Tables présentes :"
    docker-compose exec -T db psql -U admin -d db_transcendence -c "\dt" | sed 's/^/  /'

    print_subheader "Comptage des enregistrements"
    tables=("users" "stats" "matches" "friendships")
    for table in "${tables[@]}"; do
        count=$(docker-compose exec -T db psql -U admin -d db_transcendence -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | grep -o '[0-9]*' | head -1)
        if [ -n "$count" ]; then
            echo "  $table : $count enregistrements"
        else
            echo "  $table : table inexistante ou vide"
        fi
    done
}

# =============================================================================
# TESTS API GÉNÉRAUX
# =============================================================================

test_api_endpoints() {
    print_header "🔗 TESTS ENDPOINTS API"

    print_subheader "Test des endpoints principaux"

    # Test des endpoints GET
    run_test "Backend Health" "curl -k --connect-timeout 5 $BACKEND_URL/healthcheck"
    run_test "GDPR Test Route" "curl -k --connect-timeout 5 $BACKEND_URL/api/gdpr/test"
    run_test "Vault Health" "curl -k --connect-timeout 5 $BACKEND_URL/api/vault/health"

    # Test des endpoints POST
    run_test "Auth Login" "curl -k -X POST --connect-timeout 5 $BACKEND_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"test\"}'"
}

# =============================================================================
# TESTS DE PERFORMANCE
# =============================================================================

test_performance() {
    print_header "⚡ TESTS DE PERFORMANCE"

    print_subheader "Temps de réponse API"
    echo "Test de performance sur 5 requêtes..."

    total_time=0
    for i in {1..5}; do
        start_time=$(date +%s%N)
        curl -k -s $BACKEND_URL/healthcheck > /dev/null
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 )) # Convertir en ms
        total_time=$((total_time + response_time))
        echo "  Requête $i : ${response_time}ms"
    done

    avg_time=$((total_time / 5))
    echo "  Temps moyen : ${avg_time}ms"

    if [ $avg_time -lt 100 ]; then
        print_success "Performance : EXCELLENTE (< 100ms)"
    elif [ $avg_time -lt 500 ]; then
        print_success "Performance : BONNE (< 500ms)"
    else
        print_warning "Performance : À AMÉLIORER (> 500ms)"
    fi
}

# =============================================================================
# FONCTION PRINCIPALE
# =============================================================================

main() {
    print_info "Démarrage des tests complets de ft_transcendence..."
    print_info "Date : $(date)"
    print_info "Backend URL : $BACKEND_URL"
    print_info "Frontend URL : $FRONTEND_URL"
    echo ""

    # Exécuter tous les tests
    test_docker_services
    echo ""
    test_https
    echo ""
    test_database
    echo ""
    test_vault
    echo ""
    test_api_endpoints
    echo ""
    test_gdpr
    echo ""
    test_performance

    # Résumé final
    echo ""
    print_header "📊 RÉSULTATS FINAUX"

    echo "Tests exécutés : $TESTS_TOTAL"
    echo "Tests réussis   : $TESTS_PASSED"
    echo "Tests échoués   : $TESTS_FAILED"

    success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))

    if [ $success_rate -ge 90 ]; then
        echo -e "${GREEN}Taux de réussite : ${success_rate}% - EXCELLENT ! 🎉${NC}"
    elif [ $success_rate -ge 75 ]; then
        echo -e "${YELLOW}Taux de réussite : ${success_rate}% - BON ✅${NC}"
    else
        echo -e "${RED}Taux de réussite : ${success_rate}% - À AMÉLIORER ⚠️${NC}"
    fi

    echo ""
    print_info "Tests terminés à $(date)"
    print_info "Pour relancer les tests : ./test-ft-transcendence.sh"
}

# Exécuter le script si appelé directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi


# curl -k https://localhost:5001/healthz
# curl -k -X POST https://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"TestPassword123"}'
# curl -s http://localhost:8200/v1/sys/health
# curl -H "X-Vault-Token: myroot" http://localhost:8200/v1/secret/data/database
# curl -X POST -H "X-Vault-Token: myroot" -H "Content-Type: application/json" -d '{"data":{"user":"admin","host":"db","database":"db_transcendence","password":"test","port":"5432"}}' http://localhost:8200/v1/secret/data/database
# curl -k -X POST https://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"TestPassword123"}'
# docker-compose exec db psql -U admin -d db_transcendence -c "SELECT version();"
# docker-compose restart node
# curl -k -X POST https://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"TestPassword123"}'
# docker-compose exec db psql -U admin -d db_transcendence -c "SELECT id, email FROM users WHERE email = 'test2@example.com';"
# docker-compose exec db psql -U admin -d db_transcendence -c "SELECT user_id, two_factor_enabled FROM user_settings WHERE user_id = 'b5d5537d-5c04-4f9c-a6e7-a5ee4b3539fa';"
# docker-compose exec db psql -U admin -d db_transcendence -c "INSERT INTO user_settings (user_id, two_factor_enabled) VALUES ('b5d5537d-5c04-4f9c-a6e7-a5ee4b3539fa', false);"
# curl -k -X POST https://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"TestPassword123"}'
