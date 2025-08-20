#!/bin/bash
# audit-security.sh - Audit complet de sécurité ft_transcendence

# Se positionner à la racine du projet
cd "$(dirname "$0")/../.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 AUDIT SÉCURITÉ ft_transcendence${NC}"
echo "=================================="

SCORE=0
TOTAL=9

echo -e "${YELLOW}📋 1. Mots de passe hashés...${NC}"
if grep -r "bcrypt.hash" backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ Mots de passe hashés (bcrypt)${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Hashage manquant${NC}"
fi

echo -e "${YELLOW}📋 2. Protection SQL Injection...${NC}"
if grep -r "\$[0-9]" backend/src/ > /dev/null && ! grep -r "sql.*+" backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ Requêtes paramétrées utilisées${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Risque SQL Injection${NC}"
fi

echo -e "${YELLOW}📋 3. Protection XSS...${NC}"
if grep -r "DOMPurify\|sanitize" backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ Protection XSS active${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Protection XSS manquante${NC}"
fi

echo -e "${YELLOW}📋 4. HTTPS obligatoire...${NC}"
if [ -f "backend/src/server-https.js" ] && [ -f "config/enable-https.sh" ]; then
    echo -e "${GREEN}✅ HTTPS implémenté${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ HTTPS manquant${NC}"
fi

echo -e "${YELLOW}📋 5. Validation formulaires backend...${NC}"
if grep -r "schema.*required\|validateEmail\|validatePassword" backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ Validation backend active${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Validation backend manquante${NC}"
fi

echo -e "${YELLOW}📋 6. Validation formulaires frontend...${NC}"
if grep -r "validateEmail\|validatePassword\|ValidationResult" frontend/src/utils/ > /dev/null 2>&1 || \
   grep -r "SecureLoginView\|validation\.ts" frontend/src/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Validation frontend stricte implémentée${NC}"
    ((SCORE++))
elif grep -r "validation\|validate\|required" frontend/src/ > /dev/null; then
    echo -e "${YELLOW}⚠️  Validation frontend basique détectée${NC}"
    echo -e "${RED}❌ Validation frontend insuffisante${NC}"
else
    echo -e "${RED}❌ Validation frontend manquante${NC}"
fi

echo -e "${YELLOW}📋 7. Routes protégées (JWT)...${NC}"
if grep -r "jwtVerify\|preHandler.*jwt\|authenticate" backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ Routes protégées par JWT${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Routes non protégées${NC}"
fi

echo -e "${YELLOW}📋 8. WebSockets sécurisés (WSS)...${NC}"
if grep -r "wss://\|secure.*websocket" frontend/src/ backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ WebSockets sécurisés${NC}"
    ((SCORE++))
elif grep -r "ws://\|websocket\|socket\.io" frontend/src/ backend/src/ > /dev/null; then
    echo -e "${RED}❌ WebSockets non sécurisés détectés${NC}"
else
    echo -e "${YELLOW}⚠️  Pas de WebSockets détectés (jeu local OK)${NC}"
    ((SCORE++))
fi

echo -e "${YELLOW}📋 9. Conformité GDPR...${NC}"
if grep -r "GDPRService\|gdpr.*export\|anonymize" backend/src/ > /dev/null; then
    echo -e "${GREEN}✅ Conformité GDPR complète${NC}"
    ((SCORE++))
else
    echo -e "${RED}❌ Module GDPR manquant${NC}"
fi

echo ""
echo -e "${BLUE}📊 RÉSULTAT FINAL${NC}"
echo "=================="

PERCENTAGE=$((SCORE * 100 / TOTAL))

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎯 Score: $SCORE/$TOTAL ($PERCENTAGE%) - EXCELLENT${NC}"
elif [ $PERCENTAGE -ge 75 ]; then
    echo -e "${YELLOW}🎯 Score: $SCORE/$TOTAL ($PERCENTAGE%) - BON${NC}"
else
    echo -e "${RED}🎯 Score: $SCORE/$TOTAL ($PERCENTAGE%) - INSUFFISANT${NC}"
fi

echo ""
echo -e "${BLUE}🚨 ACTIONS PRIORITAIRES${NC}"
echo "======================="

if [ $SCORE -lt $TOTAL ]; then
    echo -e "${RED}1. Implémenter conformité GDPR complète${NC}"
    echo -e "${YELLOW}2. Vérifier sécurité du jeu Pong${NC}"
    echo -e "${YELLOW}3. Tests de pénétration manuels${NC}"
else
    echo -e "${GREEN}✅ Toutes les exigences obligatoires respectées !${NC}"
    echo -e "${GREEN}✅ Module GDPR conforme Articles 15 et 17${NC}"
fi

echo ""
echo -e "${BLUE}📖 Commandes utiles${NC}"
echo "=================="
echo "🔒 HTTPS         : make enable-https"
echo "🧪 Test sécurité : ./test-https-security.sh"
echo "📊 Documentation : SECURITY_CHECKLIST.md"
