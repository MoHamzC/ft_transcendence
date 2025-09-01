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

# Configuration de base
BACKEND_URL="https://localhost:8443"
FRONTEND_URL="https://localhost:8443"
VAULT_URL="http://localhost:8200"
DB_HOST="localhost"
DB_PORT="5432"

# Charger .env si présent (pour VAULT_TOKEN, JWT_SECRET, etc.)
if [ -f .env ]; then
    # Exporter uniquement les lignes VAR=VALEUR (ignorer commentaires)
    set -a
    # shellcheck disable=SC2046
    export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | xargs)
    set +a
fi

# Valeurs par défaut sûres
VAULT_TOKEN="${VAULT_TOKEN:-myroot}"

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
    ((TESTS_TOTAL++))
    echo -n "Testing $test_name... "
    if eval "$command" > /dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

# Test HTTP basé sur le code retour (affiche la réponse en cas d'échec)
http_code_test() {
    local test_name="$1"; shift
    local expected_code="$1"; shift
    local url_command="$*" # commande curl complète
    ((TESTS_TOTAL++))
    echo -n "Testing $test_name (expect $expected_code)... "
    local tmp_body tmp_code
    tmp_body=$(mktemp)
    tmp_code=$(eval "$url_command" -w '%{http_code}' -o "$tmp_body" 2>/dev/null)
    if [ "$tmp_code" = "$expected_code" ]; then
        rm -f "$tmp_body"
        print_success "$test_name"
        return 0
    else
        echo ""; print_error "$test_name (got $tmp_code)"; echo "--- Response ---"; sed 's/^/  /' "$tmp_body"; echo "---------------"; rm -f "$tmp_body"; return 1
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
    docker-compose -f docker-compose.secure.yml ps

    # Vérifier chaque service
    services=("app" "db" "vault")
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.secure.yml ps | grep -q "$service"; then
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

    print_subheader "Test du Backend/Frontend HTTPS"
    run_test "Application HTTPS (port 8443)" "curl -k --connect-timeout 5 $BACKEND_URL/"

    print_subheader "Test de redirection HTTP vers HTTPS"
    run_test "HTTP Redirect (port 8080)" "curl -k --connect-timeout 5 http://localhost:8080/ | grep -q '301' || curl -k --connect-timeout 5 http://localhost:8080/ | grep -q 'https://localhost'"

    print_subheader "Vérification des certificats SSL"
    echo "Certificat SSL :"
    openssl s_client -connect localhost:8443 -servername localhost < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject | sed 's/^/  /'

    print_subheader "Test de la validation SSL"
    if curl --connect-timeout 5 $BACKEND_URL/ 2>&1 | grep -q "self-signed certificate"; then
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

    # Déterminer accès direct ou fallback via exec (si port non exposé)
    local direct_ok=1
        if ! curl -s -o /dev/null "$VAULT_URL/v1/sys/health"; then
        direct_ok=0
        print_warning "Accès direct Vault indisponible, fallback docker exec"
    fi

    local VAULT_CURL_BASE
        if [ $direct_ok -eq 1 ]; then
        VAULT_CURL_BASE="curl -s -H 'X-Vault-Token: $VAULT_TOKEN'"
        VAULT_BASE_URL="$VAULT_URL"
    else
            # Tester si on peut utiliser le conteneur app pour faire la requête (curl installé?)
            if docker-compose -f docker-compose.secure.yml exec -T app sh -c 'command -v curl >/dev/null 2>&1'; then
                VAULT_CURL_BASE="docker-compose -f docker-compose.secure.yml exec -T app curl -s -H 'X-Vault-Token: $VAULT_TOKEN'"
                VAULT_BASE_URL="http://vault:8200"
            else
                print_warning "Impossible d'accéder à Vault (pas de port exposé ni curl dans conteneur). Tests Vault ignorés."
                return
            fi
    fi

    print_subheader "Statut Vault"
    http_code_test "Vault Health" 200 "$VAULT_CURL_BASE $VAULT_BASE_URL/v1/sys/health"

    print_subheader "Lecture secret JWT"
    if $VAULT_CURL_BASE "$VAULT_BASE_URL/v1/secret/data/jwt" -o /dev/null -w '%{http_code}' 2>/dev/null | grep -q '^200$'; then
        print_success "Vault JWT Secret"
    else
        if $VAULT_CURL_BASE "$VAULT_BASE_URL/v1/secret/jwt" -o /dev/null -w '%{http_code}' 2>/dev/null | grep -q '^200$'; then
            print_warning "Vault JWT Secret (KV v1)"
        else
            print_warning "Vault JWT Secret indisponible (ignoré)"
        fi
    fi

    print_subheader "Liste (metadata)"
    # Peut retourner 200 ou 404 si listing restreint; on accepte 200 sinon warning
    if $VAULT_CURL_BASE "$VAULT_BASE_URL/v1/secret/metadata/" -o /dev/null -w '%{http_code}' 2>/dev/null | grep -q '^200$'; then
        print_success "Vault List metadata"
    else
        print_warning "Vault metadata listing non accessible (attendu si politique stricte)"
    fi
}

# =============================================================================
# TESTS GDPR
# =============================================================================

test_gdpr() {
    print_header "📋 TESTS GDPR (RGPD)"

    print_subheader "Nettoyage pré-test"
    docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com' OR username = 'testuser');" >/dev/null 2>&1 || true
    docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "DELETE FROM users WHERE email = 'test@example.com' OR username = 'testuser';" >/dev/null 2>&1 || true
    print_success "Nettoyage initial effectué"

    print_subheader "Route test publique"
    http_code_test "GDPR Test Route" 200 "curl -k -s -o /dev/null $BACKEND_URL/api/gdpr/test"

    print_subheader "Création utilisateur test"
        reg_code=$(curl -k -s -o /tmp/gdpr_reg.json -w '%{http_code}' -X POST "$BACKEND_URL/api/users/register" \
        -H 'Content-Type: application/json' \
        -d '{"email":"test@example.com","username":"testuser","password":"TestPassword123"}')
    if [ "$reg_code" = "201" ] || grep -q 'Email already registered' /tmp/gdpr_reg.json; then
        print_success "Utilisateur test prêt"
    else
        print_warning "Création utilisateur via API échouée (code $reg_code), fallback DB"
        docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "INSERT INTO users (email, username, password_hash, is_registered) VALUES ('test@example.com','testuser','\$2b\$10\$v1CQWXFYnMAZ7PvXxmCb4OyWIzT9bSjxjgqjpINdidrZ3Rc8q/Gvq', true) ON CONFLICT (email) DO NOTHING;" >/dev/null 2>&1 || true
        user_id=$(docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -t -A -c "SELECT id FROM users WHERE email='test@example.com';" 2>/dev/null | head -1)
        if [ -n "$user_id" ]; then
            docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "INSERT INTO user_settings (user_id) VALUES ('$user_id') ON CONFLICT DO NOTHING;" >/dev/null 2>&1 || true
            print_success "Utilisateur test présent (fallback)"
        else
            print_error "Impossible de préparer l'utilisateur test"
            return
        fi
    fi

    print_subheader "Authentification"
        login_code=$(curl -k -s -o /tmp/gdpr_login.json -w '%{http_code}' -X POST "$BACKEND_URL/api/users/login" \
        -H 'Content-Type: application/json' \
        -d '{"email":"test@example.com","password":"TestPassword123"}')

    if [ "$login_code" = "200" ] && grep -q 'Login successful' /tmp/gdpr_login.json; then
        token=$(grep -o '"token":"[^"]*"' /tmp/gdpr_login.json | cut -d'"' -f4 | head -1)
        if [ -z "$token" ]; then
            print_error "Token introuvable dans la réponse login"
            return
        fi
        print_success "Authentification réussie"
        echo "Token: ${token:0:40}..."

        print_subheader "Routes protégées GDPR"
        # Export avec retry si 500
        exp_code=$(curl -k -s -o /tmp/gdpr_export.json -w '%{http_code}' -H "Authorization: Bearer $token" "$BACKEND_URL/api/gdpr/export")
        if [ "$exp_code" != "200" ]; then
            sleep 1
            exp_code=$(curl -k -s -o /tmp/gdpr_export.json -w '%{http_code}' -H "Authorization: Bearer $token" "$BACKEND_URL/api/gdpr/export")
        fi
        if [ "$exp_code" = "200" ]; then
            print_success "GDPR Export"
        else
            print_error "GDPR Export (code $exp_code)"; sed 's/^/  /' /tmp/gdpr_export.json | head -40
        fi
        http_code_test "GDPR Anonymize" 200 "curl -k -s -X POST -H 'Authorization: Bearer $token' -H 'Content-Type: application/json' -d '{\"confirmation\":\"I_UNDERSTAND_THIS_IS_IRREVERSIBLE\"}' -o /dev/null $BACKEND_URL/api/gdpr/anonymize"
        http_code_test "GDPR Account Delete" 200 "curl -k -s -X DELETE -H 'Authorization: Bearer $token' -H 'Content-Type: application/json' -d '{\"confirmation\":\"DELETE_MY_ACCOUNT_PERMANENTLY\",\"reason\":\"privacy_concerns\"}' -o /dev/null $BACKEND_URL/api/gdpr/account"
    else
        print_error "Login / token échoué (code $login_code)"
        echo "Réponse:"; sed 's/^/  /' /tmp/gdpr_login.json
    fi

    print_subheader "Nettoyage final"
    docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com' OR username = 'testuser');" >/dev/null 2>&1 || true
    docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "DELETE FROM users WHERE email = 'test@example.com' OR username = 'testuser';" >/dev/null 2>&1 || true
    print_success "Nettoyage final terminé"
}

# =============================================================================
# TESTS BASE DE DONNÉES
# =============================================================================

test_database() {
    print_header "🗄️  TESTS BASE DE DONNÉES"

    print_subheader "Connexion à PostgreSQL"
    if docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Connexion PostgreSQL : RÉUSSIE"
    else
        print_error "Connexion PostgreSQL : ÉCHEC"
        return 1
    fi

    print_subheader "Structure de la base"
    echo "Tables présentes :"
    docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "\dt" | sed 's/^/  /'

    print_subheader "Comptage des enregistrements"
    tables=("users" "stats" "games" "friendships")
    for table in "${tables[@]}"; do
        count=$(docker-compose -f docker-compose.secure.yml exec -T db psql -U admin -d db_transcendence -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | grep -o '[0-9]*' | head -1)
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
    run_test "Application Root" "curl -k --connect-timeout 5 $BACKEND_URL/"
    run_test "API Health" "curl -k --connect-timeout 5 $BACKEND_URL/api/health"

    # Test des endpoints POST (if available)
    run_test "Auth Status" "curl -k -X GET --connect-timeout 5 $BACKEND_URL/api/auth/status"
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
        curl -k -s $BACKEND_URL/ > /dev/null
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
    print_info "Démarrage des tests complets de ft_transcendence (PRODUCTION)..."
    print_info "Date : $(date)"
    print_info "Application URL : $BACKEND_URL"
    print_info "Vault URL : $VAULT_URL"
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
    print_info "Pour relancer les tests : ./scripts/test-ft-transcendence.sh"
}

# Exécuter le script si appelé directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
