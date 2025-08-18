import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
	user: process.env.POSTGRES_USER || 'admin',
	host: process.env.DB_HOST || 'localhost', // 'db' pour Docker, 'localhost' pour local
	database: process.env.POSTGRES_DB || 'db_transcendence',
	password: process.env.POSTGRES_PASSWORD || 'test',
	port: process.env.DB_PORT || 5432,
})

export default pool
