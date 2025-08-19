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
            
            // Initialiser les secrets par défaut en mode dev
            if (process.env.NODE_ENV !== 'production') {
                await this.initializeDevSecrets();
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Vault connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Initialise les secrets par défaut pour le développement
     */
    async initializeDevSecrets() {
        try {
            // Vérifier d'abord si les secrets existent déjà
            const existingSecrets = await this.checkExistingSecrets();
            
            // Secrets de base de données
            if (!existingSecrets.database) {
                await this.writeSecret('secret/database', {
                    host: process.env.DB_HOST || 'db',
                    port: process.env.DB_PORT || 5432,
                    user: process.env.POSTGRES_USER || 'admin',
                    password: process.env.POSTGRES_PASSWORD || 'test',
                    database: process.env.POSTGRES_DB || 'db_transcendence'
                });
            }

            // Secret JWT
            if (!existingSecrets.jwt) {
                await this.writeSecret('secret/jwt', {
                    secret: process.env.JWT_SECRET || `vault_jwt_secret_${Date.now()}`
                });
            }

            // Secrets OAuth 42
            if (!existingSecrets.oauth42) {
                await this.writeSecret('secret/oauth/42', {
                    client_id: process.env.CLIENT_ID_42 || 'your_42_client_id',
                    client_secret: process.env.CLIENT_SECRET_42 || 'your_42_client_secret',
                    redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/42/callback'
                });
            }

            // Secrets OAuth GitHub
            if (!existingSecrets.github) {
                await this.writeSecret('secret/oauth/github', {
                    client_id: process.env.GITHUB_CLIENT_ID || 'your_github_client_id',
                    client_secret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret',
                    redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback'
                });
            }

            // Secrets OAuth Google
            if (!existingSecrets.google) {
                await this.writeSecret('secret/oauth/google', {
                    client_id: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
                });
            }

            // Secrets Email
            if (!existingSecrets.email) {
                await this.writeSecret('secret/email', {
                    host: process.env.MAIL_HOST || 'smtp.gmail.com',
                    user: process.env.MAIL_USER || 'your_email@gmail.com',
                    password: process.env.MAIL_PASS || 'your_app_password'
                });
            }

            console.log('✅ Dev secrets initialized in Vault');
        } catch (error) {
            console.error('❌ Failed to initialize dev secrets:', error.message);
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
            // Pour KV v2, on doit lire depuis "secret/data/path" et récupérer result.data.data
            const kvPath = path.startsWith('secret/data/') ? path : `secret/data/${path.replace('secret/', '')}`;
            const result = await this.client.read(kvPath);
            return result.data.data; // KV v2 structure
        } catch (error) {
            console.error(`❌ Failed to read secret from ${path}:`, error.message);
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
        return data.secret;
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
