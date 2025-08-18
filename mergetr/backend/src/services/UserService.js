// src/services/UserService.js
import pool from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 10);

export class DuplicateEmailError extends Error
{
    constructor(email)
    {
        super('Email already in use');
        this.name = 'DuplicateEmailError';
        this.email = email;
    }
}

function normalizeEmail(email)
{
    return String(email ?? '').trim().toLowerCase();
}

export class UserService
{
    static async findByEmailForAuth(email)
    {
        const e = normalizeEmail(email);

        const { rows } = await pool.query(
        {
            text: 'SELECT id, email, password_hash FROM users WHERE email = $1',
            values: [ e ]
        });
        return rows[0] ?? null;
    }

    static async findPublicById(id)
    {
        const { rows } = await pool.query(
        {
            text: 'SELECT id, email FROM users WHERE id = $1',
            values: [ id ]
        });
        return rows[0] ?? null;
    }

    static async createUser(email, password)
    {
        const e = normalizeEmail(email);

        // Validation renforcée du mot de passe (SÉCURITÉ OBLIGATOIRE)
        if (!password || password.length < 12)
        {
            throw new Error('Password must be at least 12 characters long');
        }

        if (password.length > 128)
        {
            throw new Error('Password must be less than 128 characters');
        }

        // Vérifier la complexité (SÉCURITÉ OBLIGATOIRE)
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) {
            throw new Error('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character');
        }

        // Utiliser 12 rounds minimum pour sécurité (OBLIGATOIRE ft_transcendence)
        const hash = await bcrypt.hash(password, Math.max(SALT_ROUNDS, 12));

        const { rows } = await pool.query(
        {
            text:
                `INSERT INTO users(email, password_hash)
                 VALUES ($1,$2)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id, email`,
            values: [ e, hash ]
        });

        if (!rows[0])
        {
            throw new DuplicateEmailError(e);
        }

        return rows[0];
    }

    static async authenticate(email, password)
    {
        const user = await this.findByEmailForAuth(email);
        if (!user)
        {
            // Utiliser une comparaison factice pour éviter les timing attacks (SÉCURITÉ)
            await bcrypt.compare('dummy_password', '$2b$12$dummy.hash.to.prevent.timing.attacks');
            return null;
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        return ok ? { id: user.id, email: user.email } : null;
    }
}
