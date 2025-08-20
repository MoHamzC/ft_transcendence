#!/bin/bash
# test-vault-complete.sh - Test complet de Vault ft_transcendence

# Se positionner à la racine du projet
cd "$(dirname "$0")/../.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 TEST COMPLET VAULT - ft_transcendence${NC}"
echo "============================================"

SCORE=0
TOTAL=8

echo -e "${YELLOW}1. Vérification service Vault...${NC}"
if curl -s http://localhost:8200/v1/sys/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Service Vault actif${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Service Vault non accessible${NC}"
    echo -e "${YELLOW}💡 Lancez: make setup${NC}"
    exit 1
fi

echo -e "${YELLOW}2. Test status Vault...${NC}"
VAULT_STATUS=$(curl -s http://localhost:8200/v1/sys/health)
if echo "$VAULT_STATUS" | grep -q '"initialized":true'; then
    echo -e "${GREEN}✅ Vault initialisé${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Vault non initialisé${NC}"
fi

if echo "$VAULT_STATUS" | grep -q '"sealed":false'; then
    echo -e "${GREEN}✅ Vault déverrouillé${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Vault verrouillé${NC}"
fi

echo -e "${YELLOW}3. Test authentification Vault...${NC}"
AUTH_TEST=$(curl -s -H "X-Vault-Token: myroot" http://localhost:8200/v1/auth/token/lookup-self)
if echo "$AUTH_TEST" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Authentification Vault OK${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Authentification Vault échouée${NC}"
fi

echo -e "${YELLOW}4. Test secrets database...${NC}"
DB_SECRET=$(curl -s -H "X-Vault-Token: myroot" http://localhost:8200/v1/secret/data/database)
if echo "$DB_SECRET" | grep -q '"username"' && echo "$DB_SECRET" | grep -q '"password"'; then
    echo -e "${GREEN}✅ Secrets database présents${NC}"
    echo -e "${BLUE}   📊 Détails secrets database:${NC}"
    if command -v jq >/dev/null 2>&1; then
        echo "$DB_SECRET" | jq '.data.data' 2>/dev/null || echo "   (secrets présents)"
    else
        echo "   (secrets présents - jq non installé)"
    fi
    ((SCORE++))
else
    echo -e "${RED}❌ Secrets database manquants${NC}"
    echo -e "${YELLOW}💡 Lancez: make vault-init${NC}"
fi

echo -e "${YELLOW}5. Test secrets JWT...${NC}"
JWT_SECRET=$(curl -s -H "X-Vault-Token: myroot" http://localhost:8200/v1/secret/data/jwt)
if echo "$JWT_SECRET" | grep -q '"secret"'; then
    echo -e "${GREEN}✅ Secrets JWT présents${NC}"
    echo -e "${BLUE}   🔑 Secret JWT configuré${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Secrets JWT manquants${NC}"
fi

echo -e "${YELLOW}6. Test écriture secret (test)...${NC}"
TEST_WRITE=$(curl -s -X POST -H "X-Vault-Token: myroot" \
    -d '{"data":{"test_key":"test_value","timestamp":"'$(date -Iseconds)'"}}' \
    http://localhost:8200/v1/secret/data/test_write)

if echo "$TEST_WRITE" | grep -q '"version"'; then
    echo -e "${GREEN}✅ Écriture secret réussie${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Écriture secret échouée${NC}"
fi

echo -e "${YELLOW}7. Test lecture secret écrit...${NC}"
TEST_READ=$(curl -s -H "X-Vault-Token: myroot" http://localhost:8200/v1/secret/data/test_write)
if echo "$TEST_READ" | grep -q '"test_key"' && echo "$TEST_READ" | grep -q '"test_value"'; then
    echo -e "${GREEN}✅ Lecture secret réussie${NC}"
    if command -v jq >/dev/null 2>&1; then
        echo -e "${BLUE}   📖 Contenu lu: $(echo "$TEST_READ" | jq '.data.data.test_key' 2>/dev/null || echo "test_value")${NC}"
    else
        echo -e "${BLUE}   📖 Contenu lu: test_value${NC}"
    fi
    ((SCORE++))
else
    echo -e "${RED}❌ Lecture secret échouée${NC}"
fi

echo -e "${YELLOW}8. Test API Vault via HTTPS (si actif)...${NC}"
if curl -k -s https://localhost:3443/api/vault/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Vault accessible via HTTPS${NC}"
    ((SCORE++))
else
    echo -e "${YELLOW}⚠️  API Vault HTTPS non disponible (serveur arrêté)${NC}"
    echo -e "${BLUE}   💡 Pour tester: make enable-https${NC}"
fi

echo ""
echo -e "${BLUE}📊 RÉSULTAT VAULT${NC}"
echo "=================="

PERCENTAGE=$((SCORE * 100 / TOTAL))

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎯 Score Vault: $SCORE/$TOTAL ($PERCENTAGE%) - EXCELLENT${NC}"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}🎯 Score Vault: $SCORE/$TOTAL ($PERCENTAGE%) - BON${NC}"
else
    echo -e "${RED}🎯 Score Vault: $SCORE/$TOTAL ($PERCENTAGE%) - INSUFFISANT${NC}"
fi

echo ""
echo -e "${BLUE}🔧 COMMANDES UTILES${NC}"
echo "==================="
echo "🚀 Setup complet    : make setup"
echo "🔐 Init secrets     : make vault-init"  
echo "🌐 Serveur HTTPS    : make enable-https"
echo "📊 Status Vault     : curl -s http://localhost:8200/v1/sys/health | jq"
echo "🔑 Liste secrets    : curl -s -H 'X-Vault-Token: myroot' http://localhost:8200/v1/secret/metadata"
if command -v jq >/dev/null 2>&1; then
    echo "🔍 Status complet   : curl -s http://localhost:8200/v1/sys/health | jq"
else
    echo "🔍 Status complet   : curl -s http://localhost:8200/v1/sys/health"
fi

if [ $SCORE -eq $TOTAL ]; then
    echo ""
    echo -e "${GREEN}🎉 VAULT 100% FONCTIONNEL !${NC}"
    echo -e "${GREEN}   ✅ Prêt pour production sécurisée${NC}"
    echo -e "${GREEN}   ✅ Secrets chiffrés et centralisés${NC}"
    echo -e "${GREEN}   ✅ API Vault intégrée${NC}"
fi

exit 0
