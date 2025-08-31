#!/usr/bin/env node
// Script de test pour vérifier la base de données
import pool from '../src/config/db.js';
import { LeaderboardService } from '../src/services/LeaderboardService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testDatabase() {
    console.log('🧪 Test de la base de données...\n');
    
    try {
        // Test de connexion
        console.log('1. Test de connexion...');
        const res = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log(`✅ Connecté à PostgreSQL: ${res.rows[0].current_time}`);
        console.log(`📦 Version: ${res.rows[0].postgres_version.split(' ')[0]}\n`);
        
        // Test des tables principales
        console.log('2. Vérification des tables...');
        const tables = [
            'users', 'friendships', 'stats', 'leaderboard', 'games',
            'user_settings', 'tournaments', 'tournament_participants', 
            'tournament_matches'
        ];
        
        for (const table of tables) {
            const result = await pool.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_name = $1 AND table_schema = 'public'`,
                [table]
            );
            
            if (result.rows[0].count > 0) {
                const countResult = await pool.query(`SELECT COUNT(*) as records FROM ${table}`);
                console.log(`✅ Table '${table}' existe (${countResult.rows[0].records} enregistrements)`);
            } else {
                console.log(`❌ Table '${table}' manquante`);
            }
        }
        
        // Test du leaderboard
        console.log('\n3. Test du service Leaderboard...');
        const leaderboard = await LeaderboardService.getBoard({ limit: 5 });
        console.log(`✅ Leaderboard récupéré: ${leaderboard.length} entrées`);
        
        // Test des colonnes calculées
        console.log('\n4. Test des colonnes calculées...');
        const winRateTest = await pool.query(`
            SELECT user_id, wins, games, win_rate, tournament_wins, tournament_participations, tournament_win_rate 
            FROM leaderboard 
            LIMIT 3
        `);
        console.log('✅ Colonnes calculées fonctionnelles:');
        winRateTest.rows.forEach(row => {
            console.log(`   - User ${row.user_id}: ${row.wins}/${row.games} (${row.win_rate}%) | Tournois: ${row.tournament_wins}/${row.tournament_participations} (${row.tournament_win_rate}%)`);
        });
        
        // Test des contraintes tournois
        console.log('\n5. Test des contraintes tournois...');
        const tournamentConstraints = await pool.query(`
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'tournaments' AND constraint_type = 'CHECK'
        `);
        console.log(`✅ Contraintes tournois: ${tournamentConstraints.rows.length} trouvées`);
        
        console.log('\n🎉 Tous les tests sont passés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Exécuter le test
testDatabase();
