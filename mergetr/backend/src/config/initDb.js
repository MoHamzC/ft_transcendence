import fs from 'fs/promises'; // Utilise la version asynchrone de fs
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databaseDir = path.join(__dirname, '..', '..', 'database');

// Fonction pour lire et exécuter un fichier SQL
async function executeSqlFile(client, filePath, fileName) {
    try {
        const sql = await fs.readFile(filePath, 'utf8');
        await client.query(sql);
        console.log(`✅ Schéma '${fileName}' appliqué avec succès.`);
    } catch (error) {
        // Gère le cas où le fichier n'existe pas
        if (error.code === 'ENOENT') {
            console.warn(`⚠️  Fichier SQL '${fileName}' non trouvé, ignoré.`);
        } else {
            throw error; // Propage les autres erreurs
        }
    }
}

export async function initDatabase() {
    const client = await pool.connect();
    try {
        console.log('🔄 Initialisation de la base de données...');

        // Réinitialiser proprement
        await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
        
        // 1. Schéma principal
        const schemaSQL = await fs.readFile(path.join(databaseDir, 'schema.sql'), 'utf8');
        await client.query(schemaSQL);
        console.log('✅ Schéma principal appliqué');

        // 2. Schéma tournois (MANQUANT !)
        const tournamentSQL = await fs.readFile(path.join(databaseDir, 'tournament_schema.sql'), 'utf8');
        await client.query(tournamentSQL);
        console.log('✅ Schéma tournois appliqué');

        // 3. Données de test (optionnel)
        try {
            const testDataSQL = await fs.readFile(path.join(databaseDir, 'test_data_tournaments.sql'), 'utf8');
            await client.query(testDataSQL);
            console.log('✅ Données de test insérées');
        } catch (testError) {
            if (testError.code === 'ENOENT') {
                console.log('⚠️  Fichier de données de test non trouvé, ignoré.');
            } else {
                console.warn('⚠️  Erreur lors de l\'insertion des données de test:', testError.message);
            }
        }

        console.log('🎉 Base de données initialisée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur init DB:', error.message);
        throw error;
    } finally {
        client.release();
    }
}
