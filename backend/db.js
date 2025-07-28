import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
	user: 'admin',
	host: 'db',
	database: 'db_transcendence',
	password: 'test',
	port: 5432,
})

export default pool
