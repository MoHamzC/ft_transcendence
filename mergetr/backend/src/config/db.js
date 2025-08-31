import pkg from 'pg'
import dotenv from 'dotenv'
import { vaultService } from '../services/VaultService.js'

dotenv.config({ path: '../../../.env' })

const { Pool } = pkg

let pool = null

async function initializePool() {
  if (pool) return pool

  let dbConfig

  try {
    // Essayer de récupérer la config depuis Vault
    if (!vaultService.isInitialized) {
      await vaultService.initialize()
    }

    const vaultConfig = await vaultService.getDatabaseConfig()
    dbConfig = {
      user: vaultConfig.user,
      host: vaultConfig.host,
      database: vaultConfig.database,
      password: vaultConfig.password,
      port: vaultConfig.port,
    }
    console.log('✅ Database config loaded from Vault')

  } catch (error) {
    console.log('⚠️ Failed to load DB config from Vault, using environment variables:', error.message)

    // Vérifier que toutes les variables d'environnement requises sont définies
    const requiredEnvVars = ['POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_PASSWORD', 'POSTGRES_PORT']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      throw new Error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}. Configurez votre .env ou Vault.`)
    }

    // Utiliser uniquement les variables d'environnement (pas de valeurs par défaut)
    dbConfig = {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT),
    }
  }

  pool = new Pool(dbConfig)
  return pool
}

export default async function getPool() {
  return await initializePool()
}

// Pour la compatibilité, exporter aussi une instance synchrone
export { getPool }
