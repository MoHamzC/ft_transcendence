#!/bin/bash

# test-tournament-detailed.sh
# Tests détaillés du système de tournois avec vérifications

set -e  # Arrêter en cas d'erreur

BASE_URL="http://localhost:5001/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables globales
TOURNAMENT_ID=""
PARTICIPANT_IDS=()
MATCH_IDS=()

echo -e "${BLUE}🎾 TESTS DÉTAILLÉS DU SYSTÈME DE TOURNOIS${NC}"
echo "=============================================="

# Fonction d'affichage des résultats
log_test() {
    local status=$1
    local message=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${RED}❌ $message${NC}"
        exit 1
    fi
}

# Fonction pour attendre et vérifier
wait_and_check() {
    echo -e "${YELLOW}Attente de 2 secondes...${NC}"
    sleep 2
}

# Vérification que le backend est accessible
echo -e "${YELLOW}1. Vérification de l'accessibilité du backend...${NC}"
if curl -s "$BASE_URL/../health" > /dev/null; then
    log_test "OK" "Backend accessible"
else
    log_test "ERROR" "Backend non accessible à $BASE_URL"
fi

# Test 1: Créer un nouveau tournoi
echo -e "\n${YELLOW}2. Création d'un nouveau tournoi...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/tournaments" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Tournament - Script",
        "description": "Tournoi créé par le script de test",
        "maxPlayers": 4,
        "type": "elimination"
    }')

echo "Réponse brute: $RESPONSE"

if echo "$RESPONSE" | grep -q '"tournament"'; then
    TOURNAMENT_ID=$(echo "$RESPONSE" | jq -r '.tournament.id')
    log_test "OK" "Tournoi créé avec ID: $TOURNAMENT_ID"
else
    log_test "ERROR" "Échec de création du tournoi: $RESPONSE"
fi

wait_and_check

# Test 2: Vérifier les détails du tournoi créé
echo -e "\n${YELLOW}3. Vérification des détails du tournoi...${NC}"
DETAILS=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID")
echo "Détails: $DETAILS"

if echo "$DETAILS" | grep -q "Test Tournament - Script"; then
    log_test "OK" "Détails du tournoi récupérés"
else
    log_test "ERROR" "Impossible de récupérer les détails du tournoi"
fi

# Test 3: Inscrire des joueurs (sans authentification pour simplifier)
echo -e "\n${YELLOW}4. Inscription des joueurs...${NC}"

PLAYERS=("Joueur1" "Joueur2" "Joueur3" "Joueur4")

for i in "${!PLAYERS[@]}"; do
    PLAYER="${PLAYERS[$i]}"
    echo -e "  Inscription de $PLAYER..."
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/tournaments/$TOURNAMENT_ID/register" \
        -H "Content-Type: application/json" \
        -d "{\"alias\": \"$PLAYER\"}")
    
    echo "  Réponse: $REGISTER_RESPONSE"
    
    if echo "$REGISTER_RESPONSE" | grep -q '"participant"'; then
        PARTICIPANT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.participant.id')
        PARTICIPANT_IDS+=("$PARTICIPANT_ID")
        log_test "OK" "$PLAYER inscrit (ID: $PARTICIPANT_ID)"
    else
        log_test "ERROR" "Échec d'inscription de $PLAYER: $REGISTER_RESPONSE"
    fi
    
    sleep 1
done

wait_and_check

# Test 4: Vérifier la liste des participants
echo -e "\n${YELLOW}5. Vérification de la liste des participants...${NC}"
UPDATED_DETAILS=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID")
PARTICIPANT_COUNT=$(echo "$UPDATED_DETAILS" | jq '.participants | length')

if [ "$PARTICIPANT_COUNT" -eq 4 ]; then
    log_test "OK" "4 participants inscrits"
    echo "$UPDATED_DETAILS" | jq '.participants[] | {alias: .alias, order: .registration_order}'
else
    log_test "ERROR" "Nombre de participants incorrect: $PARTICIPANT_COUNT"
fi

# Test 5: Démarrer le tournoi
echo -e "\n${YELLOW}6. Démarrage du tournoi...${NC}"
START_RESPONSE=$(curl -s -X POST "$BASE_URL/tournaments/$TOURNAMENT_ID/start")
echo "Réponse démarrage: $START_RESPONSE"

if echo "$START_RESPONSE" | grep -q '"success"'; then
    log_test "OK" "Tournoi démarré avec succès"
else
    log_test "ERROR" "Échec du démarrage: $START_RESPONSE"
fi

wait_and_check

# Test 6: Vérifier que les matchs ont été générés
echo -e "\n${YELLOW}7. Vérification de la génération des matchs...${NC}"
TOURNAMENT_STATE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID")
MATCH_COUNT=$(echo "$TOURNAMENT_STATE" | jq '.matches | length')

if [ "$MATCH_COUNT" -eq 2 ]; then
    log_test "OK" "2 matchs générés pour les demi-finales"
    echo "$TOURNAMENT_STATE" | jq '.matches[] | {id: .id, round: .round_number, player1: .player1_alias, player2: .player2_alias, status: .status}'
else
    log_test "ERROR" "Nombre de matchs incorrect: $MATCH_COUNT"
fi

# Test 7: Récupérer le prochain match
echo -e "\n${YELLOW}8. Récupération du prochain match...${NC}"
NEXT_MATCH=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID/next-match")
echo "Prochain match: $NEXT_MATCH"

if echo "$NEXT_MATCH" | grep -q '"match"' && ! echo "$NEXT_MATCH" | grep -q 'null'; then
    FIRST_MATCH_ID=$(echo "$NEXT_MATCH" | jq -r '.match.id')
    FIRST_PLAYER1_ID=$(echo "$NEXT_MATCH" | jq -r '.match.player1_id')
    FIRST_PLAYER2_ID=$(echo "$NEXT_MATCH" | jq -r '.match.player2_id')
    log_test "OK" "Prochain match récupéré (ID: $FIRST_MATCH_ID)"
    echo "  Joueur 1: $(echo "$NEXT_MATCH" | jq -r '.match.player1_alias')"
    echo "  Joueur 2: $(echo "$NEXT_MATCH" | jq -r '.match.player2_alias')"
else
    log_test "ERROR" "Impossible de récupérer le prochain match"
fi

# Test 8: Jouer le premier match
echo -e "\n${YELLOW}9. Simulation du premier match...${NC}"
MATCH_RESULT=$(curl -s -X POST "$BASE_URL/matches/$FIRST_MATCH_ID/result" \
    -H "Content-Type: application/json" \
    -d "{
        \"winnerId\": \"$FIRST_PLAYER1_ID\",
        \"player1Score\": 11,
        \"player2Score\": 8
    }")

echo "Résultat match 1: $MATCH_RESULT"

if echo "$MATCH_RESULT" | grep -q '"success"'; then
    log_test "OK" "Premier match terminé"
else
    log_test "ERROR" "Échec de l'enregistrement du résultat: $MATCH_RESULT"
fi

wait_and_check

# Test 9: Jouer le deuxième match
echo -e "\n${YELLOW}10. Simulation du deuxième match...${NC}"
NEXT_MATCH_2=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID/next-match")
SECOND_MATCH_ID=$(echo "$NEXT_MATCH_2" | jq -r '.match.id')
SECOND_PLAYER1_ID=$(echo "$NEXT_MATCH_2" | jq -r '.match.player1_id')

echo "Deuxième match ID: $SECOND_MATCH_ID"
echo "  Joueur 1: $(echo "$NEXT_MATCH_2" | jq -r '.match.player1_alias')"
echo "  Joueur 2: $(echo "$NEXT_MATCH_2" | jq -r '.match.player2_alias')"

MATCH_RESULT_2=$(curl -s -X POST "$BASE_URL/matches/$SECOND_MATCH_ID/result" \
    -H "Content-Type: application/json" \
    -d "{
        \"winnerId\": \"$SECOND_PLAYER1_ID\",
        \"player1Score\": 11,
        \"player2Score\": 6
    }")

if echo "$MATCH_RESULT_2" | grep -q '"success"'; then
    log_test "OK" "Deuxième match terminé"
else
    log_test "ERROR" "Échec du deuxième match: $MATCH_RESULT_2"
fi

wait_and_check

# Test 10: Vérifier la génération de la finale
echo -e "\n${YELLOW}11. Vérification de la génération de la finale...${NC}"
FINAL_STATE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID")
FINAL_MATCH_COUNT=$(echo "$FINAL_STATE" | jq '.matches | length')

if [ "$FINAL_MATCH_COUNT" -eq 3 ]; then
    log_test "OK" "Finale générée (3 matchs total)"
    echo "État des matchs:"
    echo "$FINAL_STATE" | jq '.matches[] | {round: .round_number, match: .match_number, status: .status, winner: .winner_alias}'
else
    log_test "WARN" "Nombre de matchs: $FINAL_MATCH_COUNT (attendu: 3)"
fi

# Test 11: Jouer la finale
echo -e "\n${YELLOW}12. Simulation de la finale...${NC}"
FINAL_MATCH=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID/next-match")
FINAL_MATCH_ID=$(echo "$FINAL_MATCH" | jq -r '.match.id')
FINAL_PLAYER1_ID=$(echo "$FINAL_MATCH" | jq -r '.match.player1_id')

echo "Finale - Match ID: $FINAL_MATCH_ID"
echo "  Finaliste 1: $(echo "$FINAL_MATCH" | jq -r '.match.player1_alias')"
echo "  Finaliste 2: $(echo "$FINAL_MATCH" | jq -r '.match.player2_alias')"

FINAL_RESULT=$(curl -s -X POST "$BASE_URL/matches/$FINAL_MATCH_ID/result" \
    -H "Content-Type: application/json" \
    -d "{
        \"winnerId\": \"$FINAL_PLAYER1_ID\",
        \"player1Score\": 11,
        \"player2Score\": 9
    }")

if echo "$FINAL_RESULT" | grep -q '"success"'; then
    log_test "OK" "Finale terminée"
else
    log_test "ERROR" "Échec de la finale: $FINAL_RESULT"
fi

wait_and_check

# Test 12: Vérifier l'état final du tournoi
echo -e "\n${YELLOW}13. Vérification de l'état final du tournoi...${NC}"
FINAL_TOURNAMENT_STATE=$(curl -s "$BASE_URL/tournaments/$TOURNAMENT_ID")
TOURNAMENT_STATUS=$(echo "$FINAL_TOURNAMENT_STATE" | jq -r '.tournament.status')
WINNER_ID=$(echo "$FINAL_TOURNAMENT_STATE" | jq -r '.tournament.winner_id')

echo "État final du tournoi:"
echo "  Statut: $TOURNAMENT_STATUS"
echo "  Gagnant ID: $WINNER_ID"

if [ "$TOURNAMENT_STATUS" = "finished" ]; then
    log_test "OK" "Tournoi terminé avec succès"
    
    # Trouver l'alias du gagnant
    WINNER_ALIAS=$(echo "$FINAL_TOURNAMENT_STATE" | jq -r --arg winner_id "$WINNER_ID" '.participants[] | select(.id == $winner_id) | .alias')
    echo -e "${GREEN}🏆 Gagnant du tournoi: $WINNER_ALIAS${NC}"
else
    log_test "ERROR" "Le tournoi n'est pas terminé (statut: $TOURNAMENT_STATUS)"
fi

# Résumé final
echo -e "\n${BLUE}=============== RÉSUMÉ DES TESTS ===============${NC}"
echo -e "${GREEN}✅ Tournoi créé et configuré${NC}"
echo -e "${GREEN}✅ 4 joueurs inscrits avec succès${NC}"
echo -e "${GREEN}✅ Tournoi démarré et matchs générés${NC}"
echo -e "${GREEN}✅ Demi-finales jouées${NC}"
echo -e "${GREEN}✅ Finale générée et jouée${NC}"
echo -e "${GREEN}✅ Tournoi terminé avec un gagnant${NC}"
echo ""
echo -e "${BLUE}🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !${NC}"
echo -e "${BLUE}🎾 Le système de tournois fonctionne parfaitement.${NC}"
