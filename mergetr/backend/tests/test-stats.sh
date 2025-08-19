#!/bin/bash
# Script de test automatique pour StatsService - ft_transcendence
# Usage: ./test-stats.sh
# Fonctionne dans l'environnement Docker

set -e

echo "🏓 Tests StatsService - ft_transcendence (Docker)"
echo "=============================================="

# Variables
BASE_URL="http://localhost:5001"
API_PREFIX="/api/user"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Attendre que le serveur soit prêt (max 30 secondes)
print_info "Attente du démarrage du serveur..."
for i in {1..30}; do
    if curl -s -f "$BASE_URL/healthcheck" > /dev/null 2>&1; then
        print_result 0 "Serveur accessible"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Serveur non accessible après 30 secondes${NC}"
        echo "Vérifiez que Docker Compose est démarré avec:"
        echo "  docker-compose up -d"
        exit 1
    fi
    sleep 1
done

# Fonction pour créer un utilisateur et récupérer le token
create_user_and_login() {
    local email=$1
    local password=$2
    
    # Créer l'utilisateur
    print_info "Création de l'utilisateur $email..."
    response=$(curl -s -w "%{http_code}" -o /tmp/register_response.json \
        -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    http_code=$(echo $response | tail -c 4)
    if [[ "$http_code" == "201" ]]; then
        print_result 0 "Utilisateur $email créé"
    elif [[ "$http_code" == "409" ]]; then
        print_result 0 "Utilisateur $email existe déjà"
    else
        print_result 1 "Échec création utilisateur $email (code: $http_code)"
        return 1
    fi
    
    # Login
    print_info "Connexion de $email..."
    response=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
        -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    http_code=$(echo $response | tail -c 4)
    if [[ "$http_code" == "200" ]]; then
        token=$(jq -r '.token' /tmp/login_response.json)
        if [[ "$token" != "null" && "$token" != "" ]]; then
            print_result 0 "Login réussi pour $email"
            echo "$token"
            return 0
        fi
    fi
    
    print_result 1 "Échec login pour $email (code: $http_code)"
    return 1
}

# Test 1: Créer des utilisateurs de test
echo -e "\n📝 Test 1: Création des utilisateurs de test"
token1=$(create_user_and_login "player1@stats.test" "password123456")
token2=$(create_user_and_login "player2@stats.test" "password123456")
token3=$(create_user_and_login "player3@stats.test" "password123456")

# Test 2: Récupérer les statistiques initiales
echo -e "\n📊 Test 2: Récupération des statistiques initiales"
response=$(curl -s -w "%{http_code}" -o /tmp/stats_response.json \
    -X GET "$BASE_URL$API_PREFIX/statistics" \
    -H "Authorization: Bearer $token1")

http_code=$(echo $response | tail -c 4)
if [[ "$http_code" == "200" ]]; then
    stats=$(cat /tmp/stats_response.json)
    games_played=$(echo $stats | jq -r '.stats.gamesPlayed')
    games_won=$(echo $stats | jq -r '.stats.gamesWon')
    games_lost=$(echo $stats | jq -r '.stats.gamesLost')
    win_rate=$(echo $stats | jq -r '.stats.winRate')
    
    print_result 0 "Statistiques récupérées"
    echo "   • Parties jouées: $games_played"
    echo "   • Parties gagnées: $games_won"
    echo "   • Parties perdues: $games_lost"
    echo "   • Taux de victoire: $win_rate%"
    
    # Vérifier les valeurs initiales
    if [[ "$games_played" == "0" && "$games_won" == "0" && "$games_lost" == "0" && "$win_rate" == "0" ]]; then
        print_result 0 "Valeurs initiales correctes"
    else
        print_result 1 "Valeurs initiales incorrectes"
    fi
else
    print_result 1 "Échec récupération statistiques (code: $http_code)"
fi

# Test 3: Récupérer le leaderboard
echo -e "\n🏆 Test 3: Récupération du leaderboard"
response=$(curl -s -w "%{http_code}" -o /tmp/leaderboard_response.json \
    -X GET "$BASE_URL$API_PREFIX/leaderboard" \
    -H "Authorization: Bearer $token1")

http_code=$(echo $response | tail -c 4)
if [[ "$http_code" == "200" ]]; then
    leaderboard=$(cat /tmp/leaderboard_response.json)
    count=$(echo $leaderboard | jq '.leaderboard | length')
    print_result 0 "Leaderboard récupéré ($count entrées)"
    
    # Afficher le top 3
    echo "   Top 3:"
    echo $leaderboard | jq -r '.leaderboard[0:3][] | "   • \(.email): \(.wins) victoires sur \(.games) parties"'
else
    print_result 1 "Échec récupération leaderboard (code: $http_code)"
fi

# Test 4: Test pagination
echo -e "\n📄 Test 4: Test de pagination"
response=$(curl -s -w "%{http_code}" -o /tmp/pagination_response.json \
    -X GET "$BASE_URL$API_PREFIX/leaderboard?limit=2&offset=0" \
    -H "Authorization: Bearer $token1")

http_code=$(echo $response | tail -c 4)
if [[ "$http_code" == "200" ]]; then
    count=$(cat /tmp/pagination_response.json | jq '.leaderboard | length')
    if [[ "$count" -le "2" ]]; then
        print_result 0 "Pagination fonctionne (limit=2, résultats=$count)"
    else
        print_result 1 "Pagination ne fonctionne pas (attendu ≤2, reçu $count)"
    fi
else
    print_result 1 "Échec test pagination (code: $http_code)"
fi

# Test 5: Test authentification
echo -e "\n🔐 Test 5: Test d'authentification"
response=$(curl -s -w "%{http_code}" -o /tmp/no_auth_response.json \
    -X GET "$BASE_URL$API_PREFIX/statistics")

http_code=$(echo $response | tail -c 4)
if [[ "$http_code" == "401" ]]; then
    print_result 0 "Authentification requise correctement appliquée"
else
    print_result 1 "Authentification non appliquée (code: $http_code)"
fi

# Test 6: Test token invalide
echo -e "\n🔒 Test 6: Test token invalide"
response=$(curl -s -w "%{http_code}" -o /tmp/invalid_token_response.json \
    -X GET "$BASE_URL$API_PREFIX/statistics" \
    -H "Authorization: Bearer invalid.token.here")

http_code=$(echo $response | tail -c 4)
if [[ "$http_code" == "401" || "$http_code" == "403" ]]; then
    print_result 0 "Token invalide correctement rejeté"
else
    print_result 1 "Token invalide accepté (code: $http_code)"
fi

echo -e "\n🎯 Tests terminés!"
echo "========================================"

# Nettoyage
rm -f /tmp/*_response.json

echo -e "\n💡 Pour exécuter les tests HTTP manuellement:"
echo "   cd backend/tests"
echo "   # Éditer les fichiers .http et remplacer YOUR_JWT_TOKEN par:"
echo "   # $token1"
