import { pool } from '../db/pgClient.js';

export class SettingsService
{
    static async getSettings(userId)
    {
        const { rows } = await pool.query(
            `SELECT theme, notifications, language
             FROM user_settings WHERE user_id = $1`,
            [userId]
        );
        if (rows[0])
        {
            return rows[0];
        }
        // Valeurs par défaut si aucun paramètre n'est encore enregistré
        return {
            theme: 'dark',
            notifications: true,
            language: 'fr'
        };
    }

    static async updateSettings(userId, settings)
    {
        // Upsert (insert ou update)
        await pool.query(
            `INSERT INTO user_settings (user_id, theme, notifications, language)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE
             SET theme = $2, notifications = $3, language = $4`,
            [userId, settings.theme, settings.notifications, settings.language]
        );
    }
}
