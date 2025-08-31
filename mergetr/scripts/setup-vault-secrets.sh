#!/bin/sh
# setup-vault-secrets.sh - Script manuel pour créer les secrets Vault

echo "🔐 Configuration m    vault kv put secret/oauth/google \
        client_id="${GOOGLE_CLIENT_ID:-}" \
        client_secret="${GOOGLE_CLIENT_SECRET:-}" \
        redirect_uri="http://localhost:3000/auth/google/callback"lle des secrets Vault pour ft_transcendence..."
echo ""

# Variables d'environnement Vault
export VAULT_ADDR="http://localhost:8200"
export VAULT_TOKEN="myroot"

# Fonction pour vérifier si un secret existe
secret_exists() {
    vault kv get "secret/$1" >/dev/null 2>&1
    return $?
}

# Fonction pour attendre que Vault soit prêt
wait_for_vault() {
    echo "⏳ Attente de Vault..."
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
            echo "✅ Vault est prêt !"
            return 0
        fi

        echo "⏳ Tentative $attempt/$max_attempts - Vault pas encore prêt..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ Timeout: Vault n'est pas prêt après $max_attempts tentatives"
    return 1
}

# Vérifier la connexion à Vault
if ! wait_for_vault; then
    echo "❌ Impossible de se connecter à Vault. Assurez-vous que Vault est démarré."
    exit 1
fi

echo ""
echo "🔧 Configuration du moteur de secrets..."

# Activer le moteur de secrets KV version 2 (si pas déjà fait)
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "ℹ️  Moteur de secrets déjà activé ou configuré"

echo ""
echo "💾 Création des secrets..."

# Créer les secrets de base de données
if ! secret_exists "database"; then
    echo "📝 Création du secret database..."
    vault kv put secret/database \
        host="db" \
        port="5432" \
        user="${POSTGRES_USER:-admin}" \
        password="${POSTGRES_PASSWORD:-CHANGE_THIS_DB_PASSWORD}" \
        database="${POSTGRES_DB:-db_transcendence}"
    echo "✅ Secret database créé"
else
    echo "ℹ️  Secret database existe déjà"
fi

# Créer le secret JWT
if ! secret_exists "jwt"; then
    echo "🔑 Création du secret JWT..."
    jwt_secret="${JWT_SECRET:-CHANGE_THIS_JWT_SECRET_$(date +%s)}"
    vault kv put secret/jwt \
        secret="$jwt_secret"
    echo "✅ Secret JWT créé"
    echo "   🔒 JWT Secret: $jwt_secret"
else
    echo "ℹ️  Secret jwt existe déjà"
fi

# Créer les secrets OAuth 42
if ! secret_exists "oauth/42"; then
    echo "🔐 Création du secret OAuth 42..."
    vault kv put secret/oauth/42 \
        client_id="${CLIENT_ID_42:-}" \
        client_secret="${CLIENT_SECRET_42:-}" \
        redirect_uri="http://localhost:3000/auth/42/callback"
    echo "✅ Secret OAuth 42 créé"
else
    echo "ℹ️  Secret oauth/42 existe déjà"
fi

# Créer les secrets OAuth GitHub
if ! secret_exists "oauth/github"; then
    echo "🔐 Création du secret OAuth GitHub..."
    vault kv put secret/oauth/github \
        client_id="${GITHUB_CLIENT_ID:-}" \
        client_secret="${GITHUB_CLIENT_SECRET:-}" \
        redirect_uri="http://localhost:3000/auth/github/callback"
    echo "✅ Secret OAuth GitHub créé"
else
    echo "ℹ️  Secret oauth/github existe déjà"
fi

# Créer les secrets OAuth Google
if ! secret_exists "oauth/google"; then
    echo "🔐 Création du secret OAuth Google..."
    vault kv put secret/oauth/google \
        client_id="${GOOGLE_CLIENT_ID:-YOUR_GOOGLE_CLIENT_ID}" \
        client_secret="${GOOGLE_CLIENT_SECRET:-YOUR_GOOGLE_CLIENT_SECRET}" \
        redirect_uri="http://localhost:3000/auth/google/callback"
    echo "✅ Secret OAuth Google créé"
else
    echo "ℹ️  Secret oauth/google existe déjà"
fi

echo ""
echo "🎉 Configuration des secrets terminée !"
echo ""
echo "📊 Secrets créés :"
echo "  🗄️  database    : Informations de connexion PostgreSQL"
echo "  🔑 jwt         : Clé secrète JWT"
echo "  🔐 oauth/42    : Configuration OAuth 42"
echo "  🔐 oauth/github: Configuration OAuth GitHub"
echo "  🔐 oauth/google: Configuration OAuth Google"
echo ""
echo "💡 Pensez à remplacer les valeurs par défaut des OAuth par vos vraies clés d'API"
echo "🔒 Token Vault: myroot"
echo "🌐 Vault UI: http://localhost:8200"
