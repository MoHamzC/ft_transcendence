#!/bin/bash
# scripts/init-vault.sh
# Script d'initialisation de Vault pour le développement

echo "🔐 Initialisation de Vault pour ft_transcendence..."

# Attendre que Vault soit prêt
echo "⏳ Attente de Vault..."
until curl -s http://localhost:8200/v1/sys/health > /dev/null; do
    sleep 2
done

echo "✅ Vault est prêt !"

# Variables d'environnement Vault
export VAULT_ADDR="http://localhost:8200"
export VAULT_TOKEN="myroot"

# Activer le moteur de secrets KV version 2
echo "🔧 Configuration du moteur de secrets..."
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "Moteur de secrets déjà activé"

# Créer les secrets de base de données
echo "💾 Ajout des secrets de base de données..."
vault kv put secret/database \
    host="db" \
    port="5432" \
    user="admin" \
    password="test" \
    database="db_transcendence"

# Créer le secret JWT
echo "🔑 Ajout du secret JWT..."
vault kv put secret/jwt \
    secret="super_secure_jwt_secret_key_change_in_production_$(date +%s)"

# Créer les secrets OAuth 42
echo "🔐 Ajout des secrets OAuth 42..."
vault kv put secret/oauth/42 \
    client_id="your_42_client_id" \
    client_secret="your_42_client_secret" \
    redirect_uri="http://localhost:3000/auth/42/callback"

# Créer les secrets OAuth GitHub
echo "🔐 Ajout des secrets OAuth GitHub..."
vault kv put secret/oauth/github \
    client_id="your_github_client_id" \
    client_secret="your_github_client_secret" \
    redirect_uri="http://localhost:3000/auth/github/callback"

# Créer les secrets OAuth Google
echo "🔐 Ajout des secrets OAuth Google..."
vault kv put secret/oauth/google \
    client_id="your_google_client_id" \
    client_secret="your_google_client_secret" \
    redirect_uri="http://localhost:3000/auth/google/callback"

# Créer les secrets Email
echo "📧 Ajout des secrets Email..."
vault kv put secret/email \
    host="smtp.gmail.com" \
    user="your_email@gmail.com" \
    password="your_app_password"

# Créer une politique pour l'application
echo "📋 Création de la politique d'accès..."
vault policy write transcendence-app - <<EOF
path "secret/data/*" {
  capabilities = ["read"]
}

path "secret/metadata/*" {
  capabilities = ["list", "read"]
}
EOF

echo "✅ Vault initialisé avec succès !"
echo ""
echo "📊 Secrets créés :"
vault kv list secret/

echo ""
echo "🔍 Pour voir un secret :"
echo "vault kv get secret/database"
echo ""
echo "🌐 Interface web Vault : http://localhost:8200"
echo "🔑 Token de dev : myroot"
