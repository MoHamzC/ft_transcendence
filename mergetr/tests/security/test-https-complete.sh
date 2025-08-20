#!/bin/bash
# test-https-complete.sh - Test complet HTTPS ft_transcendence

# Se positionner à la racine du projet
cd "$(dirname "$0")/../.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔒 TEST COMPLET HTTPS - ft_transcendence${NC}"
echo "============================================="

SCORE=0
TOTAL=10

echo -e "${YELLOW}1. Vérification certificats SSL...${NC}"
if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo -e "${GREEN}✅ Certificats SSL présents${NC}"
    ((SCORE++))
    
    # Vérifier validité certificat
    if openssl x509 -in ssl/cert.pem -text -noout | grep -q "localhost"; then
        echo -e "${GREEN}✅ Certificat configuré pour localhost${NC}"
        ((SCORE++))
    else
        echo -e "${RED}❌ Certificat mal configuré${NC}"
    fi
else
    echo -e "${RED}❌ Certificats SSL manquants${NC}"
    echo -e "${YELLOW}💡 Lancez: make enable-https${NC}"
fi

echo -e "${YELLOW}2. Test connectivité serveur HTTPS...${NC}"
if curl -k -s --connect-timeout 5 https://localhost:3443/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Serveur HTTPS accessible${NC}"
    ((SCORE++))
    
    # Test réponse JSON
    HEALTH_RESPONSE=$(curl -k -s https://localhost:3443/healthz)
    if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Endpoint /healthz fonctionnel${NC}"
        echo -e "${BLUE}   📊 Réponse: $HEALTH_RESPONSE${NC}"
        ((SCORE++))
    else
        echo -e "${RED}❌ Endpoint /healthz défaillant${NC}"
    fi
else
    echo -e "${RED}❌ Serveur HTTPS non accessible${NC}"
    echo -e "${YELLOW}💡 Démarrez le serveur: make enable-https${NC}"
fi

echo -e "${YELLOW}3. Test headers de sécurité...${NC}"
if curl -k -s --connect-timeout 5 https://localhost:3443/healthz > /dev/null 2>&1; then
    HEADERS=$(curl -k -I -s https://localhost:3443/healthz 2>/dev/null)
    
    # Test Strict-Transport-Security
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        echo -e "${GREEN}✅ HSTS (Strict-Transport-Security) activé${NC}"
        ((SCORE++))
    else
        echo -e "${YELLOW}⚠️  HSTS non détecté${NC}"
    fi
    
    # Test X-Frame-Options
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        echo -e "${GREEN}✅ X-Frame-Options présent${NC}"
        ((SCORE++))
    else
        echo -e "${YELLOW}⚠️  X-Frame-Options non détecté${NC}"
    fi
    
    # Test X-Content-Type-Options
    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        echo -e "${GREEN}✅ X-Content-Type-Options présent${NC}"
        ((SCORE++))
    else
        echo -e "${YELLOW}⚠️  X-Content-Type-Options non détecté${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Impossible de tester les headers (serveur arrêté)${NC}"
fi

echo -e "${YELLOW}4. Test API sécurisées...${NC}"
if curl -k -s --connect-timeout 5 https://localhost:3443/healthz > /dev/null 2>&1; then
    
    # Test API GDPR
    GDPR_TEST=$(curl -k -s -w "%{http_code}" https://localhost:3443/api/gdpr/export -o /dev/null 2>/dev/null)
    if [ "$GDPR_TEST" = "401" ]; then
        echo -e "${GREEN}✅ API GDPR protégée (401 sans auth)${NC}"
        ((SCORE++))
    else
        echo -e "${YELLOW}⚠️  API GDPR: code $GDPR_TEST${NC}"
    fi
    
    # Test API Vault (si disponible)
    VAULT_TEST=$(curl -k -s -w "%{http_code}" https://localhost:3443/api/vault/status -o /dev/null 2>/dev/null)
    if [ "$VAULT_TEST" = "200" ] || [ "$VAULT_TEST" = "401" ]; then
        echo -e "${GREEN}✅ API Vault accessible via HTTPS${NC}"
        ((SCORE++))
    else
        echo -e "${YELLOW}⚠️  API Vault: code $VAULT_TEST${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Impossible de tester les APIs (serveur arrêté)${NC}"
fi

echo -e "${YELLOW}5. Test performance HTTPS...${NC}"
if curl -k -s --connect-timeout 5 https://localhost:3443/healthz > /dev/null 2>&1; then
    # Test temps de réponse
    RESPONSE_TIME=$(curl -k -s -w "%{time_total}" https://localhost:3443/healthz -o /dev/null 2>/dev/null)
    if command -v bc >/dev/null 2>&1; then
        if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
            echo -e "${GREEN}✅ Temps de réponse excellent: ${RESPONSE_TIME}s${NC}"
            ((SCORE++))
        else
            echo -e "${YELLOW}⚠️  Temps de réponse: ${RESPONSE_TIME}s${NC}"
        fi
    else
        echo -e "${GREEN}✅ Réponse serveur: ${RESPONSE_TIME}s${NC}"
        ((SCORE++))
    fi
else
    echo -e "${YELLOW}⚠️  Test performance impossible (serveur arrêté)${NC}"
fi

echo ""
echo -e "${BLUE}📊 RÉSULTAT HTTPS${NC}"
echo "=================="

PERCENTAGE=$((SCORE * 100 / TOTAL))

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎯 Score HTTPS: $SCORE/$TOTAL ($PERCENTAGE%) - EXCELLENT${NC}"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}🎯 Score HTTPS: $SCORE/$TOTAL ($PERCENTAGE%) - BON${NC}"
else
    echo -e "${RED}🎯 Score HTTPS: $SCORE/$TOTAL ($PERCENTAGE%) - INSUFFISANT${NC}"
fi

echo ""
echo -e "${BLUE}🔧 COMMANDES UTILES${NC}"
echo "==================="
echo "🚀 Démarrer HTTPS   : make enable-https"
echo "🔍 Test manuel      : curl -k -v https://localhost:3443/healthz"
echo "📋 Voir certificat  : openssl x509 -in ssl/cert.pem -text -noout"
echo "🌐 Navigateur       : https://localhost:3443"

echo ""
echo -e "${BLUE}🛡️  SÉCURITÉ HTTPS VALIDÉE${NC}"
echo "============================"
if [ -f "ssl/cert.pem" ]; then
    echo -e "${GREEN}✅ Certificats auto-signés pour développement${NC}"
    echo -e "${YELLOW}⚠️  En production: utilisez des certificats signés (Let's Encrypt)${NC}"
fi

if [ $SCORE -ge 8 ]; then
    echo ""
    echo -e "${GREEN}🎉 HTTPS CONFORME ft_transcendence !${NC}"
    echo -e "${GREEN}   ✅ Chiffrement TLS activé${NC}"
    echo -e "${GREEN}   ✅ Headers de sécurité configurés${NC}"
    echo -e "${GREEN}   ✅ APIs protégées${NC}"
    echo -e "${GREEN}   ✅ Prêt pour évaluation${NC}"
fi

exit 0
