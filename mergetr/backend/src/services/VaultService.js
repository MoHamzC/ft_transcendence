// src/services/VaultService.js
import vault from 'node-vault';

export class VaultService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
    }

    /**
     * Initialise la connexion à Vault
     */
    async initialize() {
        try {
            this.client = vault({
                endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
                token: process.env.VAULT_TOKEN || 'myroot'
            });

            // Vérifier la connexion
            await this.client.status();
            console.log('✅ Vault connected successfully');

            // Marquer comme initialisé AVANT d'initialiser les secrets
            this.isInitialized = true;

            // Initialiser les secrets par défaut en mode dev
            if (process.env.NODE_ENV !== 'production') {
                await this.initializeDevSecrets();
            }

        } catch (error) {
            console.error('❌ Vault connection failed:', error.message);
            this.isInitialized = false; // S'assurer que c'est bien false en cas d'erreur
            throw error;
        }
    }

    /**
     * Initialise les secrets par défaut pour le développement
     */
    async initializeDevSecrets() {
        if (!this.isInitialized) {
            throw new Error('Vault not initialized. Call initialize() first.');
        }

        try {
            console.log('🔐 Initializing development secrets in Vault...')

            // Secrets de base de données - toujours mettre à jour en dev
            const dbConfig = {
                host: process.env.POSTGRES_HOST || 'db',
                port: parseInt(process.env.POSTGRES_PORT) || 5432,
                user: process.env.POSTGRES_USER || 'admin',
                password: process.env.POSTGRES_PASSWORD || 'test',
                database: process.env.POSTGRES_DB || 'db_transcendence'
            }

            await this.writeSecret('secret/database', dbConfig)
            console.log('📝 Database secret updated in Vault')

            // Secret JWT
            const jwtSecret = process.env.JWT_SECRET || `vault_jwt_secret_${Date.now()}`
            await this.writeSecret('secret/jwt', { secret: jwtSecret })
            console.log('📝 JWT secret updated in Vault')

            // Secrets OAuth 42
            const oauth42Config = {
                client_id: process.env.CLIENT_ID_42 || '',
                client_secret: process.env.CLIENT_SECRET_42 || '',
                redirect_uri: process.env.REDIRECT_URI || 'http://localhost:5001/auth/42/callback'
            }
            await this.writeSecret('secret/oauth/42', oauth42Config)
            console.log('📝 OAuth 42 secrets updated in Vault')

            // Secrets OAuth GitHub
            const githubConfig = {
                client_id: process.env.GITHUB_CLIENT_ID || '',
                client_secret: process.env.GITHUB_CLIENT_SECRET || '',
                redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/auth/github/callback'
            }
            await this.writeSecret('secret/oauth/github', githubConfig)
            console.log('📝 GitHub OAuth secrets updated in Vault')

            // Secrets OAuth Google
            const googleConfig = {
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/auth/google/callback'
            }
            await this.writeSecret('secret/oauth/google', googleConfig)
            console.log('📝 Google OAuth secrets updated in Vault')

            // Secrets Email
            const emailConfig = {
                host: process.env.MAIL_HOST || 'smtp.gmail.com',
                user: process.env.MAIL_USER || '',
                password: process.env.MAIL_PASS || ''
            }
            await this.writeSecret('secret/email', emailConfig)
            console.log('📝 Email secrets updated in Vault')

            console.log('✅ All development secrets initialized successfully in Vault')
        } catch (error) {
            console.error('❌ Failed to initialize development secrets:', error.message)
            throw error
        }
    }

    /**
     * Vérifie l'existence des secrets principaux
     */
    async checkExistingSecrets() {
        const secrets = {
            database: false,
            jwt: false,
            oauth42: false,
            github: false,
            google: false,
            email: false
        };

        try {
            // Test database
            await this.readSecret('secret/database');
            secrets.database = true;
        } catch (error) { /* Secret n'existe pas */ }

        try {
            // Test JWT
            await this.readSecret('secret/jwt');
            secrets.jwt = true;
        } catch (error) { /* Secret n'existe pas */ }

        try {
            // Test OAuth 42
            await this.readSecret('secret/oauth/42');
            secrets.oauth42 = true;
        } catch (error) { /* Secret n'existe pas */ }

        try {
            // Test GitHub
            await this.readSecret('secret/oauth/github');
            secrets.github = true;
        } catch (error) { /* Secret n'existe pas */ }

        try {
            // Test Google
            await this.readSecret('secret/oauth/google');
            secrets.google = true;
        } catch (error) { /* Secret n'existe pas */ }

        try {
            // Test Email
            await this.readSecret('secret/email');
            secrets.email = true;
        } catch (error) { /* Secret n'existe pas */ }

        return secrets;
    }

    /**
     * Écrit un secret dans Vault (KV v2)
     * @param {string} path - Chemin du secret
     * @param {object} data - Données à stocker
     */
    async writeSecret(path, data) {
        if (!this.isInitialized) {
            throw new Error('Vault not initialized. Call initialize() first.');
        }

        try {
            // Pour KV v2, on écrit vers "secret/data/path" avec {data: ...}
            const kvPath = path.startsWith('secret/data/') ? path : `secret/data/${path.replace('secret/', '')}`;
            await this.client.write(kvPath, { data });
            console.log(`📝 Secret written to: ${path}`);
        } catch (error) {
            console.error(`❌ Failed to write secret to ${path}:`, error.message);
            throw error;
        }
    }

    /**
     * Lit un secret depuis Vault (KV v2)
     * @param {string} path - Chemin du secret
     * @returns {object} - Données du secret
     */
    async readSecret(path) {
        if (!this.isInitialized) {
            throw new Error('Vault not initialized. Call initialize() first.');
        }

        try {
            // Essayer d'abord le format KV v2
            const kvPath = path.startsWith('secret/data/') ? path : `secret/data/${path.replace('secret/', '')}`;
            const result = await this.client.read(kvPath);
            return result.data.data; // KV v2 structure
        } catch (error) {
            // Si KV v2 échoue, essayer le format direct (KV v1 ou secrets créés manuellement)
            try {
                const result = await this.client.read(path);
                // Pour les secrets créés manuellement, les données sont directement dans result.data
                if (result.data && typeof result.data === 'object') {
                    return result.data;
                }
                // Si c'est une valeur simple, la retourner directement
                return result.data;
            } catch (fallbackError) {
                console.error(`❌ Failed to read secret from ${path} (tried both KV v2 and direct):`, fallbackError.message);
                throw fallbackError;
            }
        }
    }

    /**
     * Supprime un secret de Vault
     * @param {string} path - Chemin du secret
     */
    async deleteSecret(path) {
        if (!this.isInitialized) {
            throw new Error('Vault not initialized. Call initialize() first.');
        }

        try {
            // Pour KV v2, on supprime depuis "secret/data/path"
            const kvPath = path.startsWith('secret/data/') ? path : `secret/data/${path.replace('secret/', '')}`;
            await this.client.delete(kvPath);
            console.log(`🗑️ Secret deleted from: ${path}`);
        } catch (error) {
            console.error(`❌ Failed to delete secret from ${path}:`, error.message);
            throw error;
        }
    }

    /**
     * Récupère la configuration de base de données depuis Vault
     */
    async getDatabaseConfig() {
        return await this.readSecret('secret/database');
    }

    /**
     * Récupère le secret JWT depuis Vault
     */
    async getJWTSecret() {
        const data = await this.readSecret('secret/jwt');
        // Retourner directement la valeur du secret
        let result = data.secret || data;
        if (!result || result === '' || (typeof result === 'object' && !result.secret)) {
            result = process.env.JWT_SECRET || `vault_jwt_secret_${Date.now()}`;
        }
        return result;
    }

    /**
     * Récupère les secrets OAuth pour un provider donné
     * @param {string} provider - '42', 'github', ou 'google'
     */
    async getOAuthSecrets(provider) {
        return await this.readSecret(`secret/oauth/${provider}`);
    }

    /**
     * Récupère la configuration email depuis Vault
     */
    async getEmailConfig() {
        return await this.readSecret('secret/email');
    }

    /**
     * Vérifie si Vault est disponible
     */
    async healthCheck() {
        try {
            if (!this.client) return false;
            await this.client.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Liste tous les secrets disponibles (KV v2)
     */
    async listSecrets(path = 'secret/') {
        try {
            // Pour KV v2, on doit lister depuis "secret/metadata/"
            const metadataPath = path === 'secret/' ? 'secret/metadata/' : `secret/metadata/${path.replace('secret/', '')}`;
            const result = await this.client.list(metadataPath);
            return result.data.keys || [];
        } catch (error) {
            console.error(`❌ Failed to list secrets at ${path}:`, error.message);
            // Fallback : essayer de lister les secrets qu'on connaît
            return ['database/', 'jwt', 'oauth/', 'email'];
        }
    }
}

// Instance singleton
export const vaultService = new VaultService();
