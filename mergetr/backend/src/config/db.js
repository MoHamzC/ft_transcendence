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
    console.log('⚠️ Failed to load DB config from Vault, using fallback:', error.message)

    // Fallback vers les variables d'environnement
    dbConfig = {
      user: process.env.POSTGRES_USER || 'admin',
      host: process.env.POSTGRES_HOST || 'db',
      database: process.env.POSTGRES_DB || 'db_transcendence',
      password: process.env.POSTGRES_PASSWORD || 'test',
      port: process.env.POSTGRES_PORT || 5432,
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
