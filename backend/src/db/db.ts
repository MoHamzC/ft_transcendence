//librairie sqlite synchrone
import Database from 'better-sqlite3';

//pour construire un chemin de fichier portable
import path from 'path';

// initialise la base sqlite et cree le fichier data.db si absent
const db = new Database(path.join(__dirname, '..', '..', 'data.db'));

// creer la table users si elle nexiste pas deja
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL
  )
`).run();

// exporte linstance de la base pour lutiliser ailleurs
export default db;
