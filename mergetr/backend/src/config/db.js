import pkg from 'pg'
import { vaultService } from '../services/VaultService.js'

const { Pool } = pkg

let pool = null;

/**
 * Initialise la connexion à la base de données avec les secrets Vault
 */
async function initializePool() {
    try {
        // Initialiser Vault si ce n'est pas déjà fait
        if (!vaultService.isInitialized) {
            await vaultService.initialize();
        }

        // Récupérer la configuration DB depuis Vault
        const dbConfig = await vaultService.getDatabaseConfig();
        
        pool = new Pool({
            user: dbConfig.user,
            host: dbConfig.host,
            database: dbConfig.database,
            password: dbConfig.password,
            port: dbConfig.port,
        });

        console.log('✅ Database pool initialized with Vault secrets');
        return pool;
        
    } catch (error) {
        console.error('❌ Failed to initialize DB pool with Vault:', error.message);
        
        // Fallback sur les variables d'environnement en cas d'échec Vault
        console.log('🔄 Falling back to environment variables...');
        pool = new Pool({
            user: process.env.POSTGRES_USER || 'admin',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.POSTGRES_DB || 'db_transcendence',
            password: process.env.POSTGRES_PASSWORD || 'test',
            port: process.env.DB_PORT || 5432,
        });
        
        console.log('⚠️ Database pool initialized with fallback env vars');
        return pool;
    }
}

/**
 * Retourne le pool de connexions (l'initialise si nécessaire)
 */
async function getPool() {
    if (!pool) {
        await initializePool();
    }
    return pool;
}

// Export par défaut pour compatibilité avec le code existant
export default await getPool();
