import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDatabase() {
    try {
        console.log('🔄 Initialisation de la base de données...');

        // Lire le fichier schema.sql
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Supprimer toutes les tables existantes (attention: supprime toutes les données!)
        await pool.query(`
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
        `);

        console.log('🗑️  Schema public recréé');

        // Exécuter le schéma SQL
        await pool.query(schema);

        console.log('✅ Base de données initialisée avec succès!');
        console.log('📋 Tables créées: users, user_settings, friendships, stats, leaderboard, games');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la DB:', error.message);
        throw error;
    }
}

// Vérifie l'existence des tables critiques et applique le schema si manquant (sans drop)
export async function ensureSchema() {
    try {
        const check = await pool.query(`SELECT to_regclass('public.tournaments') AS tournaments, to_regclass('public.tournament_participants') AS participants`);
        const row = check.rows[0];
        if (!row.tournaments || !row.participants) {
            console.log('🛠  Tables de tournoi manquantes – application du schema.sql (mode non destructif)...');
            const schemaPath = path.join(__dirname, '../../database/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema); // contient des CREATE TABLE IF NOT EXISTS
            console.log('✅ Schema tournoi appliqué');
        } else {
            console.log('✅ Schema tournoi déjà présent');
        }
    } catch (err) {
        console.error('❌ ensureSchema error:', err.message);
    }
}

// Option plus douce: ne supprime que les tables spécifiques
export async function resetTables() {
    try {
        console.log('🔄 Reset des tables...');

        const tables = ['games', 'leaderboard', 'stats', 'friendships', 'users'];

        for (const table of tables) {
            await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
            console.log(`🗑️  Table ${table} supprimée`);
        }

        // Relire et exécuter le schéma
        const schemaPath = path.join(__dirname, '../../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);

        console.log('✅ Tables recréées avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors du reset des tables:', error.message);
        throw error;
    }
}
