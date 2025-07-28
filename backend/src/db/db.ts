import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', '..', 'data.db'));

// Création automatique de la table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL
  )
`).run();

export default db;
