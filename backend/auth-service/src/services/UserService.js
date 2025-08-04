// src/services/UserService.js

import pool from '../db/pgClient.js';
import bcrypt from 'bcrypt';

export class UserService
{
    static async findByEmail(email)
    {
        const result = await pool.query(
        {
            text: 'SELECT id, email, password_hash FROM users WHERE email = $1',
            values: [email]
        });

        return result.rows[0] || null;
    }

    static async findById(id)
    {
        const result = await pool.query(
        {
            text: 'SELECT id, email FROM users WHERE id = $1',
            values: [id]
        });

        return result.rows[0] || null;
    }

    static async createUser(email, password)
    {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
        {
            text: 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            values: [email, hash]
        });

        return result.rows[0];
    }

    static verifyPassword(user, password)
    {
        return bcrypt.compareSync(password, user.password_hash);
    }
}
