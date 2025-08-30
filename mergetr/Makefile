# Makefile for ft_transcendence
# Automated setup and deployment

.PHONY: help install setup vault-init start stop clean logs test

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)ft_transcendence - Makefile Commands$(NC)"
	@echo "======================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(GREEN)📦 Installing dependencies...$(NC)"
	@cd backend && npm ci
	@cd frontend && npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

setup: install ## Complete setup (install + docker + vault)
	@echo "$(GREEN)🚀 Setting up ft_transcendence...$(NC)"
	@docker-compose up -d db vault
	@echo "$(YELLOW)⏳ Waiting for services to start...$(NC)"
	@sleep 10
	@$(MAKE) vault-init
	@echo "$(GREEN)✅ Setup complete!$(NC)"

vault-init: ## Initialize Vault with secrets
	@echo "$(GREEN)🔐 Initializing Vault secrets...$(NC)"
	@curl -s -X PUT -H "X-Vault-Token: myroot" \
		-d '{"data":{"username":"transcendence","password":"password123","host":"localhost","port":"5434","database":"transcendence"}}' \
		http://localhost:8200/v1/secret/data/database > /dev/null
	@curl -s -X PUT -H "X-Vault-Token: myroot" \
		-d '{"data":{"secret":"your-super-secret-jwt-key-for-development-only"}}' \
		http://localhost:8200/v1/secret/data/jwt > /dev/null
	@echo "$(GREEN)✅ Vault secrets initialized$(NC)"

start: ## Start the complete application
	@echo "$(GREEN)🚀 Starting ft_transcendence...$(NC)"
	@docker-compose up -d db vault
	@echo "$(YELLOW)⏳ Waiting for database and vault...$(NC)"
	@sleep 5
	@$(MAKE) vault-init
	@echo "$(GREEN)🌐 Starting frontend and backend...$(NC)"
	@npm run start:all

start-dev: setup start ## Complete setup and start (first time)

start-https: ## Start complete HTTPS site (production mode)
	@echo "$(GREEN)🔐 Starting ft_transcendence HTTPS site...$(NC)"
	@echo "$(YELLOW)📋 Configuration HTTPS:$(NC)"
	@echo "   - Frontend React/Vite servi via HTTPS"
	@echo "   - Backend API accessible via proxy HTTPS"
	@echo "   - Site HTTPS: https://localhost"
	@echo "   - Certificats SSL auto-signés"
	@echo ""
	@echo "$(GREEN)📦 Building frontend...$(NC)"
	@cd frontend && npm run build
	@echo "$(GREEN)🔐 Generating SSL certificates...$(NC)"
	@mkdir -p ssl
	@if [ ! -f "ssl/cert.pem" ]; then \
		openssl genrsa -out ssl/key.pem 2048; \
		openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 \
			-subj "/C=FR/ST=France/L=Paris/O=42School/OU=ft_transcendence/CN=localhost" \
			-addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"; \
		chmod 600 ssl/key.pem; \
		chmod 644 ssl/cert.pem; \
		echo "$(GREEN)✅ Certificats SSL générés$(NC)"; \
	else \
		echo "$(GREEN)✅ Certificats SSL existants trouvés$(NC)"; \
	fi
	@echo "$(GREEN)🛑 Stopping existing services...$(NC)"
	@docker-compose down 2>/dev/null || true
	@docker-compose -f docker-compose.secure.yml down 2>/dev/null || true
	@echo "$(GREEN)🚀 Starting HTTPS services...$(NC)"
	@docker-compose -f docker-compose.secure.yml up --build -d
	@echo ""
	@echo "$(GREEN)✅ ft_transcendence HTTPS site déployé avec succès!$(NC)"
	@echo "======================================================"
	@echo "$(GREEN)🌐 Site accessible sur: https://localhost$(NC)"
	@echo "$(YELLOW)⚠️  Acceptez l'exception de sécurité pour le certificat auto-signé$(NC)"
	@echo ""
	@echo "$(GREEN)🔍 Commandes utiles:$(NC)"
	@echo "   - Logs: make logs-https"
	@echo "   - Arrêt: make stop-https"
	@echo "   - Statut: make status-https"

stop: ## Stop all services
	@echo "$(YELLOW)🛑 Stopping services...$(NC)"
	@docker-compose down
	@pkill -f "npm run start" || true
	@echo "$(GREEN)✅ All services stopped$(NC)"

stop-https: ## Stop HTTPS services
	@echo "$(YELLOW)🛑 Stopping HTTPS services...$(NC)"
	@docker-compose -f docker-compose.secure.yml down
	@echo "$(GREEN)✅ HTTPS services stopped$(NC)"

clean: stop ## Stop and clean everything
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

logs: ## Show logs
	@echo "$(GREEN)📋 Services logs:$(NC)"
	@docker-compose logs

logs-db: ## Show database logs
	@docker-compose logs db

logs-vault: ## Show vault logs
	@docker-compose logs vault

logs-https: ## Show HTTPS services logs
	@echo "$(GREEN)📋 HTTPS Services logs:$(NC)"
	@docker-compose -f docker-compose.secure.yml logs

test: ## Run tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	@npm run test:http

restart: stop start ## Restart all services

quick-restart: ## Quick restart (without reinstalling)
	@echo "$(YELLOW)🔄 Quick restart...$(NC)"
	-@pkill -f "node src/server.js" 2>/dev/null || true
	-@pkill -f "vite" 2>/dev/null || true
	-@pkill -f "concurrently" 2>/dev/null || true
	@sleep 2
	@docker-compose restart db vault
	@sleep 3
	@$(MAKE) vault-init
	@echo "$(GREEN)🌐 Starting frontend and backend...$(NC)"
	@npm run start:all

status: ## Show services status
	@echo "$(GREEN)📊 Services Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)🔍 Health Checks:$(NC)"
	@curl -s http://localhost:8200/v1/sys/health | grep -q "initialized.*true" && echo "$(GREEN)✅ Vault: OK$(NC)" || echo "$(RED)❌ Vault: Error$(NC)"
	@curl -s http://localhost:3000/healthz | grep -q "ok" && echo "$(GREEN)✅ Backend: OK$(NC)" || echo "$(YELLOW)⏳ Backend: Starting...$(NC)"
	@curl -s http://localhost:5173 > /dev/null && echo "$(GREEN)✅ Frontend: OK$(NC)" || echo "$(YELLOW)⏳ Frontend: Starting...$(NC)"

status-https: ## Show HTTPS services status
	@echo "$(GREEN)📊 HTTPS Services Status:$(NC)"
	@docker-compose -f docker-compose.secure.yml ps
	@echo ""
	@echo "$(GREEN)🔍 HTTPS Health Checks:$(NC)"
	@curl -s -k https://localhost/api/healthz | grep -q "ok" && echo "$(GREEN)✅ HTTPS Site: OK$(NC)" || echo "$(YELLOW)⏳ HTTPS Site: Starting...$(NC)"
	@curl -s -k https://localhost > /dev/null && echo "$(GREEN)✅ HTTPS Frontend: OK$(NC)" || echo "$(YELLOW)⏳ HTTPS Frontend: Starting...$(NC)"

security-test: ## Test security features
	@echo "$(GREEN)🔒 Testing security features...$(NC)"
	@echo "Testing weak password rejection:"
	@curl -s -X POST http://localhost:3000/api/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"test@test.com","password":"weak"}' | grep -q "Password" && echo "$(GREEN)✅ Password validation working$(NC)" || echo "$(RED)❌ Password validation failed$(NC)"

check-ssl: ## Check SSL certificates (if they exist)
	@echo "$(GREEN)🔐 Checking SSL certificates...$(NC)"
	@if [ -f "./docker/nginx/ssl/cert.pem" ]; then \
		echo "$(GREEN)✅ Certificate found$(NC)"; \
		echo "Certificate details:"; \
		openssl x509 -in ./docker/nginx/ssl/cert.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"; \
		echo ""; \
		echo "Certificate validity:"; \
		openssl x509 -in ./docker/nginx/ssl/cert.pem -checkend 86400 && echo "$(GREEN)✅ Certificate valid for next 24h$(NC)" || echo "$(YELLOW)⚠️ Certificate expires soon$(NC)"; \
	else \
		echo "$(YELLOW)⚠️ No SSL certificate found$(NC)"; \
		echo "Generate certificates with: make generate-ssl"; \
	fi

generate-ssl: ## Generate SSL certificates for development
	@echo "$(GREEN)🔐 Generating SSL certificates...$(NC)"
	@mkdir -p ./docker/nginx/ssl
	@cd ./docker/nginx && ./generate-ssl.sh
	@echo "$(GREEN)✅ SSL certificates generated$(NC)"

check-ssl-detailed: ## Detailed SSL certificate information
	@echo "$(GREEN)🔍 Detailed SSL certificate analysis...$(NC)"
	@if [ -f "./docker/nginx/ssl/cert.pem" ]; then \
		echo ""; \
		echo "$(YELLOW)📋 Full certificate details:$(NC)"; \
		openssl x509 -in ./docker/nginx/ssl/cert.pem -text -noout; \
		echo ""; \
		echo "$(YELLOW)🔗 Certificate fingerprint:$(NC)"; \
		openssl x509 -in ./docker/nginx/ssl/cert.pem -fingerprint -noout; \
		echo ""; \
		echo "$(YELLOW)⏰ Certificate dates:$(NC)"; \
		openssl x509 -in ./docker/nginx/ssl/cert.pem -dates -noout; \
	else \
		echo "$(RED)❌ No certificate found$(NC)"; \
	fi

verify-ssl: ## Verify SSL certificate against private key
	@echo "$(GREEN)� Verifying SSL certificate and private key...$(NC)"
	@if [ -f "./docker/nginx/ssl/cert.pem" ] && [ -f "./docker/nginx/ssl/key.pem" ]; then \
		cert_hash=$$(openssl x509 -noout -modulus -in ./docker/nginx/ssl/cert.pem | openssl md5); \
		key_hash=$$(openssl rsa -noout -modulus -in ./docker/nginx/ssl/key.pem | openssl md5); \
		if [ "$$cert_hash" = "$$key_hash" ]; then \
			echo "$(GREEN)✅ Certificate and private key match$(NC)"; \
		else \
			echo "$(RED)❌ Certificate and private key don't match$(NC)"; \
		fi; \
	else \
		echo "$(RED)❌ Certificate or private key missing$(NC)"; \
	fi

test-https-simple: ## Test HTTPS connection (simple check)
	@echo "$(GREEN)🔒 Testing HTTPS connection...$(NC)"
	@curl -k -I https://localhost:3443 2>/dev/null && echo "$(GREEN)✅ HTTPS working$(NC)" || echo "$(YELLOW)⚠️ HTTPS not available$(NC)"

enable-https: ## Enable HTTPS server (project requirement)
	@echo "$(GREEN)🔒 Starting HTTPS server (project requirement)...$(NC)"
	@chmod +x enable-https.sh
	@./enable-https.sh

security-audit: ## Run security audit
	@echo "$(GREEN)🔍 Running security audit...$(NC)"
	@chmod +x tests/security/audit-security.sh
	@./tests/security/audit-security.sh

test-gdpr: ## Test GDPR compliance
	@echo "$(GREEN)📋 Testing GDPR compliance...$(NC)"
	@chmod +x tests/security/test-gdpr-final.sh
	@./tests/security/test-gdpr-final.sh

test-vault: ## Test Vault connectivity and secrets
	@echo "$(GREEN)🔐 Testing Vault...$(NC)"
	@chmod +x tests/vault/test-vault-complete.sh
	@./tests/vault/test-vault-complete.sh

test-https: ## Test HTTPS server and security
	@echo "$(GREEN)🔒 Testing HTTPS...$(NC)"
	@chmod +x tests/security/test-https-complete.sh
	@./tests/security/test-https-complete.sh

test-all: ## Run all security tests (Vault + HTTPS + GDPR + Audit)
	@echo "$(GREEN)🧪 Running ALL security tests...$(NC)"
	@echo "$(YELLOW)================================$(NC)"
	@$(MAKE) security-audit
	@echo ""
	@$(MAKE) test-vault
	@echo ""
	@$(MAKE) test-https
	@echo ""
	@$(MAKE) test-gdpr
	@echo ""
	@echo "$(GREEN)🎉 ALL TESTS COMPLETED!$(NC)"

browse-https: ## Open HTTPS site in browser
	@echo "$(GREEN)🌐 Opening HTTPS site...$(NC)"
	@echo "Click the padlock icon (🔒) in the address bar to see certificate details"
dev: start-dev ## Alias for start-dev

# Default target
all: start-dev
