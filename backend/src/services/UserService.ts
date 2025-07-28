// importe la connexion sqlite
import db from '../db/db'

// importe bcrypt pour hasher les mots de passe
import bcrypt from 'bcrypt'

// type utilisateur en base
export type User = {
  id: number
  email: string
  passwordHash: string
}

// service centralise pour gerer les utilisateurs
export class UserService {

  // cherche un user en base avec son email
  static findByEmail(email: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    return row ?? null
  }

  // cree un user en hashant son mot de passe
  static createUser(email: string, password: string): User {
    const passwordHash = bcrypt.hashSync(password, 10)
    const stmt = db.prepare('INSERT INTO users (email, passwordHash) VALUES (?, ?)')
    const result = stmt.run(email, passwordHash)
    return {
      id: result.lastInsertRowid as number,
      email,
      passwordHash
    }
  }

  // verifie si le mot de passe correspond au hash
  static verifyPassword(user: User, password: string): boolean {
    return bcrypt.compareSync(password, user.passwordHash)
  }
}
