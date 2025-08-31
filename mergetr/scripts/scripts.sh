#!/bin/bash
# scripts.sh - Liste et exécution des scripts disponibles

set -e

# Couleurs
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fonction d'affichage
show_header() {
    echo -e "${BLUE}================================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================================${NC}"
}

show_script() {
    echo -e "${GREEN}📄 $1${NC}"
    echo -e "${CYAN}   $2${NC}"
    echo -e "${YELLOW}   Usage: ./$1${NC}"
    echo ""
}

# Vérifier si un argument est passé
if [ $# -eq 1 ]; then
    script_name="$1.sh"
    if [ -f "$script_name" ]; then
        echo -e "${GREEN}🚀 Exécution de $script_name...${NC}"
        echo ""
        ./"$script_name"
        exit 0
    else
        echo -e "${RED}❌ Script '$script_name' non trouvé${NC}"
        echo ""
        echo -e "${YELLOW}📋 Scripts disponibles :${NC}"
    fi
fi

# Afficher la liste des scripts
show_header "📁 SCRIPTS FT_TRANSCENDENCE - Centrale de Contrôle"

echo -e "${PURPLE}🎯 Scripts organisés par catégorie :${NC}"
echo ""

echo -e "${BLUE}🚀 DÉMARRAGE & INITIALISATION${NC}"
echo -e "${BLUE}------------------------------${NC}"
show_script "start-robust.sh" "Démarrage one-click automatique avec initialisation complète"
show_script "init-database.sh" "Initialisation automatique de la base de données PostgreSQL"
show_script "init-vault-auto.sh" "Initialisation automatique de Vault et configuration des secrets"

echo -e "${BLUE}🧪 TESTS & VALIDATION${NC}"
echo -e "${BLUE}----------------------${NC}"
show_script "test-ft-transcendence.sh" "Tests complets automatiques (28 tests de validation)"

echo -e "${BLUE}🔒 SÉCURITÉ & AUDIT${NC}"
echo -e "${BLUE}-------------------${NC}"
show_script "audit-security.sh" "Audit de sécurité complet du système"

echo -e "${BLUE}🛠️ UTILITAIRES${NC}"
echo -e "${BLUE}-------------${NC}"
show_script "open-adminer.sh" "Ouvrir Adminer (interface graphique base de données)"

echo ""
echo -e "${GREEN}💡 Utilisation :${NC}"
echo -e "${CYAN}  ./scripts.sh              # Afficher cette liste${NC}"
echo -e "${CYAN}  ./scripts.sh <nom_script> # Exécuter un script directement${NC}"
echo ""
echo -e "${YELLOW}📍 Exemples :${NC}"
echo -e "${YELLOW}  ./scripts.sh start-robust    # Démarrage complet${NC}"
echo -e "${YELLOW}  ./scripts.sh test-ft         # Tests complets${NC}"
echo -e "${YELLOW}  ./scripts.sh audit-security  # Audit sécurité${NC}"

echo ""
echo -e "${PURPLE}📊 Statistiques : 6 scripts • 4 catégories • 100% automatisés${NC}"
echo ""
show_header "🎉 FT_TRANSCENDENCE - Prêt pour l'action !"
