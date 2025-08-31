import pkg from 'pg'
import dotenv from 'dotenv'
import { vaultService } from '../services/VaultService.js'

dotenv.config({ path: '../../../.env' })

const { Pool } = pkg

let pool = null
let isInitializing = false

async function initializePool() {
  if (pool) return pool
  if (isInitializing) {
    // Attendre que l'initialisation en cours se termine
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return pool
  }

  isInitializing = true

  try {
    let dbConfig

    console.log('🔄 Initializing database connection pool...')

    // Essayer de récupérer la config depuis Vault
    try {
      if (!vaultService.isInitialized) {
        console.log('🔐 Initializing Vault service...')
        await vaultService.initialize()
      }

      const vaultConfig = await vaultService.getDatabaseConfig()
      dbConfig = {
        user: vaultConfig.user,
        host: vaultConfig.host,
        database: vaultConfig.database,
        password: vaultConfig.password,
        port: vaultConfig.port,
        // Configuration de robustesse
        max: 20, // Maximum de connexions
        idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
        connectionTimeoutMillis: 2000, // Timeout de connexion 2s
      }
      console.log('✅ Database config loaded from Vault:', {
        host: vaultConfig.host,
        port: vaultConfig.port,
        database: vaultConfig.database,
        user: vaultConfig.user
      })

    } catch (vaultError) {
      console.log('⚠️ Failed to load DB config from Vault, using environment variables:', vaultError.message)

      // Vérifier que toutes les variables d'environnement requises sont définies
      const requiredEnvVars = ['POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_PASSWORD', 'POSTGRES_PORT']
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

      if (missingVars.length > 0) {
        throw new Error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}. Configurez votre .env ou Vault.`)
      }

      // Utiliser uniquement les variables d'environnement
      dbConfig = {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: parseInt(process.env.POSTGRES_PORT),
        // Configuration de robustesse
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
      console.log('✅ Database config loaded from environment:', {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER
      })
    }

    // Créer le pool
    pool = new Pool(dbConfig)

    // Tester la connexion immédiatement
    console.log('🔍 Testing database connection...')
    const testClient = await pool.connect()
    try {
      await testClient.query('SELECT 1')
      console.log('✅ Database connection test successful')
    } finally {
      testClient.release()
    }

    // Gérer les erreurs de connexion
    pool.on('error', (err, client) => {
      console.error('❌ Unexpected error on idle client:', err)
    })

    pool.on('connect', (client) => {
      console.log('🔗 New database connection established')
    })

    pool.on('remove', (client) => {
      console.log('🔌 Database connection removed')
    })

    console.log('✅ Database connection pool initialized successfully')
    return pool

  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error.message)
    isInitializing = false
    throw error
  } finally {
    isInitializing = false
  }
}

export default async function getPool() {
  return await initializePool()
}

// Pour la compatibilité, exporter aussi une instance synchrone
export { getPool }

// Fonction pour tester la santé de la base de données
export async function testDatabaseConnection() {
  try {
    const pool = await getPool()
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version')
      console.log('✅ Database health check passed:', {
        current_time: result.rows[0].current_time,
        postgres_version: result.rows[0].postgres_version.substring(0, 50) + '...'
      })
      return { status: 'healthy', data: result.rows[0] }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error.message)
    return { status: 'unhealthy', error: error.message }
  }
}

// Fonction pour forcer la réinitialisation du pool (utile pour le développement)
export async function resetPool() {
  if (pool) {
    console.log('🔄 Closing existing database pool...')
    await pool.end()
    pool = null
    console.log('✅ Database pool reset')
  }
  return await initializePool()
}
