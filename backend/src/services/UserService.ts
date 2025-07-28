import db from '../db/db';
import bcrypt from 'bcrypt';

export type User = {
  id: number;
  email: string;
  passwordHash: string;
};

export class UserService {
  static findByEmail(email: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return row ?? null;
  }

  static createUser(email: string, password: string): User {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, passwordHash) VALUES (?, ?)');
    const result = stmt.run(email, passwordHash);
    return {
      id: result.lastInsertRowid as number,
      email,
      passwordHash
    };
  }

  static verifyPassword(user: User, password: string): boolean {
    return bcrypt.compareSync(password, user.passwordHash);
  }
}
