// src/services/UserService.js
import pool from '../db/db.js';
import bcrypt from 'bcrypt';

export class UserService {
  static async findByEmail(email) {
    const res = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  static async createUser(email, password) {
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      'INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email',
      [email, hash]
    );
    return res.rows[0];
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
}
