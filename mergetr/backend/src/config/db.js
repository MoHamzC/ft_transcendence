import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const { Pool } = pkg

const pool = new Pool({
	user: process.env.POSTGRES_USER || 'admin',
	host: process.env.POSTGRES_HOST || 'db',
	database: process.env.POSTGRES_DB || 'db_transcendence',
	password: process.env.POSTGRES_PASSWORD || 'test',
	port: process.env.POSTGRES_PORT || 5432,
})

export default pool
