// src/services/OAuthService.js
import { vaultService } from './VaultService.js';

export class OAuthService {
    
    /**
     * Récupère les secrets OAuth pour un provider spécifique
     * @param {string} provider - '42', 'github', ou 'google'
     * @returns {object} - Configuration OAuth
     */
    static async getOAuthConfig(provider) {
        try {
            // Initialiser Vault si nécessaire
            if (!vaultService.isInitialized) {
                await vaultService.initialize();
            }
            
            const config = await vaultService.getOAuthSecrets(provider);
            return config;
            
        } catch (error) {
            console.error(`❌ Failed to get OAuth config for ${provider}:`, error.message);
            
            // Fallback sur les variables d'environnement
            return OAuthService.getFallbackConfig(provider);
        }
    }
    
    /**
     * Configuration de fallback utilisant les variables d'environnement
     * @param {string} provider 
     * @returns {object}
     */
    static getFallbackConfig(provider) {
        console.log(`⚠️ Using fallback OAuth config for ${provider}`);
        
        switch (provider) {
            case '42':
                return {
                    client_id: process.env.CLIENT_ID_42,
                    client_secret: process.env.CLIENT_SECRET_42,
                    redirect_uri: process.env.REDIRECT_URI
                };
                
            case 'github':
                return {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    redirect_uri: process.env.GITHUB_REDIRECT_URI
                };
                
            case 'google':
                return {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI
                };
                
            default:
                throw new Error(`Unknown OAuth provider: ${provider}`);
        }
    }
    
    /**
     * Génère l'URL d'autorisation pour 42
     * @param {object} config - Configuration OAuth
     * @returns {string} - URL d'autorisation
     */
    static generate42AuthUrl(config) {
        return 'https://api.intra.42.fr/oauth/authorize?' +
            `client_id=${config.client_id}&` +
            `redirect_uri=${config.redirect_uri}&` +
            'response_type=code&' +
            'scope=public';
    }
    
    /**
     * Génère l'URL d'autorisation pour GitHub
     * @param {object} config - Configuration OAuth
     * @returns {string} - URL d'autorisation
     */
    static generateGitHubAuthUrl(config) {
        return 'https://github.com/login/oauth/authorize?' +
            `client_id=${config.client_id}&` +
            `redirect_uri=${config.redirect_uri}&` +
            'response_type=code&' +
            'scope=public';
    }
    
    /**
     * Génère l'URL d'autorisation pour Google
     * @param {object} config - Configuration OAuth
     * @returns {string} - URL d'autorisation
     */
    static generateGoogleAuthUrl(config) {
        return 'https://accounts.google.com/o/oauth2/auth?' +
            `client_id=${config.client_id}&` +
            `redirect_uri=${config.redirect_uri}&` +
            'response_type=code&' +
            'scope=email profile';
    }
    
    /**
     * Échange le code d'autorisation contre un token d'accès (42)
     */
    static async exchange42Token(code, config) {
        const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: config.client_id,
                client_secret: config.client_secret,
                redirect_uri: config.redirect_uri
            })
        });
        
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
        }
        
        return await tokenResponse.json();
    }
    
    /**
     * Échange le code d'autorisation contre un token d'accès (GitHub)
     */
    static async exchangeGitHubToken(code, config) {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: config.client_id,
                client_secret: config.client_secret,
                redirect_uri: config.redirect_uri
            })
        });
        
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
        }
        
        return await tokenResponse.json();
    }
    
    /**
     * Échange le code d'autorisation contre un token d'accès (Google)
     */
    static async exchangeGoogleToken(code, config) {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: config.client_id,
                client_secret: config.client_secret,
                redirect_uri: config.redirect_uri
            })
        });
        
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
        }
        
        return await tokenResponse.json();
    }
}
