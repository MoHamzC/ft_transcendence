# Makefile pour ft_transcendence - Gestion des tournois

# Variables
COMPOSE_FILE = compose.yaml
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m

.PHONY: help up down build test-tournament test-tournament-quick test-unit migrate seed status setup

help:
	@echo "$(GREEN)🎾 ft_transcendence - Commandes de test$(NC)"
	@echo ""
	@echo "$(YELLOW)📦 Docker :$(NC)"
	@echo "  make up              - Démarrer les services"
	@echo "  make down            - Arrêter les services"
	@echo "  make build           - Rebuilder les images"
	@echo ""
	@echo "$(YELLOW)🧪 Tests Tournois :$(NC)"
	@echo "  make test-tournament          - Tests détaillés tournois"
	@echo "  make test-tournament-quick    - Tests rapides tournois"
	@echo "  make test-unit               - Tests unitaires"
	@echo ""
	@echo "$(YELLOW)🗄️  Base de données :$(NC)"
	@echo "  make migrate         - Exécuter les migrations"
	@echo "  make seed           - Insérer données de test"
	@echo "  make status         - Vérifier l'état des services"
	@echo ""
	@echo "$(YELLOW)🚀 Commandes combinées :$(NC)"
	@echo "  make setup          - Démarrer + migrer + tester"

# Démarrer les services
up:
	@echo "$(GREEN)🚀 Démarrage des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)✅ Services démarrés !$(NC)"

# Arrêter les services
down:
	@echo "$(YELLOW)⏹️  Arrêt des services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down

# Rebuilder
build:
	@echo "$(YELLOW)🔨 Rebuild des images...$(NC)"
	docker compose -f $(COMPOSE_FILE) build --no-cache

# Migrations
migrate:
	@echo "$(YELLOW)🗄️  Exécution des migrations...$(NC)"
	@if [ -f .env ]; then export $$(cat .env | grep -E "^POSTGRES_USER|^POSTGRES_DB" | xargs); fi && \
	docker exec -i mergetr-db-1 psql -U admin -d db_transcendence < backend/database/schema.sql && \
	docker exec -i mergetr-db-1 psql -U admin -d db_transcendence < backend/database/tournament_schema.sql
	@echo "$(GREEN)✅ Migrations terminées$(NC)"

# Données de test
seed:
	@echo "$(YELLOW)🌱 Insertion des données de test...$(NC)"
	docker exec -i mergetr-db-1 psql -U $$POSTGRES_USER -d $$POSTGRES_DB < backend/database/test_data_tournaments.sql
	@echo "$(GREEN)✅ Données de test insérées$(NC)"

# Tests détaillés du système de tournois
test-tournament:
	@echo "$(YELLOW)🏆 Tests détaillés du système de tournois...$(NC)"
	chmod +x backend/tests/test-tournament-detailed.sh
	./backend/tests/test-tournament-detailed.sh

# Tests rapides des tournois
test-tournament-quick:
	@echo "$(YELLOW)🏆 Tests rapides des tournois...$(NC)"
	chmod +x backend/tests/test-tournament.sh
	./backend/tests/test-tournament.sh

# Tests unitaires
test-unit:
	@echo "$(YELLOW)🧪 Tests unitaires...$(NC)"
	docker exec mergetr-backend-1 npm test

# Vérifier que tous les services sont prêts
status:
	@echo "$(YELLOW)📊 État des services...$(NC)"
	@docker compose ps
	@echo "\n$(YELLOW)🩺 Test de connectivité...$(NC)"
	@docker exec mergetr-db-1 pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB && echo "$(GREEN)✅ DB OK$(NC)" || echo "$(RED)❌ DB KO$(NC)"
	@curl -s http://localhost:5001/health > /dev/null && echo "$(GREEN)✅ Backend OK$(NC)" || echo "$(RED)❌ Backend KO$(NC)"
	@curl -s http://localhost:5173 > /dev/null && echo "$(GREEN)✅ Frontend OK$(NC)" || echo "$(RED)❌ Frontend KO$(NC)"

# Configuration complète en une commande
setup:
	@echo "$(GREEN)🚀 Configuration complète du projet...$(NC)"
	$(MAKE) up
	@echo "$(YELLOW)⏳ Attente du démarrage des services (30s)...$(NC)"
	@sleep 30
	$(MAKE) status
	$(MAKE) migrate
	@echo "$(GREEN)🎉 Projet configuré ! Vous pouvez maintenant lancer les tests.$(NC)"
