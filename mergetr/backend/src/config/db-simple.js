import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const { Pool } = pkg

// Configuration directe et simple pour le développement
const config = {
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'db_transcendence',
    password: process.env.POSTGRES_PASSWORD || 'admin123',
    port: parseInt(process.env.POSTGRES_PORT) || 5433,
    // Configuration de robustesse
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
}

console.log('🔍 Database configuration:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user
})

const pool = new Pool(config)

// Gérer les erreurs de connexion
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err)
})

pool.on('connect', () => {
    console.log('🔗 New database connection established')
})

export default pool
