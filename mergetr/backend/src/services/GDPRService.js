// backend/src/services/GDPRService.js - Conformité GDPR obligatoire
import pool from '../config/db.js';
import { promises as fs } from 'fs';
import path from 'path';

export class GDPRService {
    /**
     * Anonymisation complète d'un utilisateur (GDPR Art. 17)
     * @param {string} userId - ID de l'utilisateur
     */
    static async anonymizeUser(userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Anonymiser les données personnelles
            await client.query(`
                UPDATE users 
                SET 
                    email = 'anonymized_' || id || '@deleted.local',
                    password_hash = 'anonymized'
                WHERE id = $1
            `, [userId]);
            
            // 2. Anonymiser les statistiques de jeu
            await client.query(`
                UPDATE stats 
                SET games_played = 0, games_won = 0, games_lost = 0
                WHERE user_id = $1
            `, [userId]);
            
            // 3. Supprimer les amitiés
            await client.query(`
                DELETE FROM friendships 
                WHERE requester_id = $1 OR addressee_id = $1
            `, [userId]);
            
            await client.query('COMMIT');
            
            console.log(`✅ Utilisateur ${userId} anonymisé conformément au GDPR`);
            return { success: true, message: 'User anonymized successfully' };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erreur anonymisation GDPR:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Suppression complète d'un compte (GDPR Art. 17)
     * @param {string} userId - ID de l'utilisateur
     */
    static async deleteAccount(userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Supprimer les données liées
            await client.query('DELETE FROM friendships WHERE requester_id = $1 OR addressee_id = $1', [userId]);
            await client.query('DELETE FROM matches WHERE player1_id = $1 OR player2_id = $1', [userId]);
            await client.query('DELETE FROM stats WHERE user_id = $1', [userId]);
            
            // 2. Supprimer l'utilisateur
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            await client.query('COMMIT');
            
            console.log(`✅ Compte ${userId} supprimé conformément au GDPR`);
            return { success: true, message: 'Account deleted successfully' };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erreur suppression GDPR:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Export des données personnelles (GDPR Art. 15)
     * @param {string} userId - ID de l'utilisateur
     */
    static async exportUserData(userId) {
        try {
            // 1. Données utilisateur
            const userResult = await pool.query(`
                SELECT id, email
                FROM users WHERE id = $1
            `, [userId]);

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const userData = userResult.rows[0];

            // 2. Statistiques de jeu
            const statsResult = await pool.query(`
                SELECT games_played, games_won, games_lost
                FROM stats WHERE user_id = $1
            `, [userId]);

            // 3. Parties de jeu
            const gamesResult = await pool.query(`
                SELECT score_player1, score_player2, played_at
                FROM matches WHERE player1_id = $1 OR player2_id = $1
                ORDER BY played_at DESC
                LIMIT 50
            `, [userId]);

            // 4. Amis (utiliser friendships)
            const friendsResult = await pool.query(`
                SELECT u.email as friend_email, f.status, f.created_at as friends_since
                FROM friendships f
                JOIN users u ON (
                    (u.id = f.requester_id AND f.addressee_id = $1) OR
                    (u.id = f.addressee_id AND f.requester_id = $1)
                )
                WHERE f.status = 'accepted'
            `, [userId]);

            // 5. Créer l'export GDPR
            const gdprExport = {
                export_info: {
                    generated_at: new Date().toISOString(),
                    user_id: userId,
                    export_type: 'GDPR_Article_15_Data_Export',
                    format_version: '1.0'
                },
                personal_data: {
                    profile: userData,
                    game_stats: statsResult.rows[0] || null,
                    game_history: gamesResult.rows,
                    friends: friendsResult.rows
                },
                gdpr_rights: {
                    right_to_access: "This export fulfills your right to access under GDPR Article 15",
                    right_to_rectification: "You can request corrections via our platform",
                    right_to_erasure: "You can request account deletion via our platform",
                    right_to_portability: "This data is provided in JSON format for portability"
                }
            };
            
            return gdprExport;
            
        } catch (error) {
            console.error('Erreur export GDPR:', error);
            throw error;
        }
    }
    
    /**
     * Gestion locale des données (minimisation)
     * @param {string} userId - ID de l'utilisateur
     */
    static async cleanupOldData(userId = null) {
        try {
            // 1. Supprimer les sessions expirées (> 30 jours)
            await pool.query(`
                DELETE FROM user_sessions 
                WHERE created_at < NOW() - INTERVAL '30 days'
            `);
            
            // 2. Supprimer les logs anciens (> 90 jours)
            await pool.query(`
                DELETE FROM audit_logs 
                WHERE created_at < NOW() - INTERVAL '90 days'
            `);
            
            // 3. Anonymiser les adresses IP anciennes (> 7 jours)
            await pool.query(`
                UPDATE users 
                SET ip_address = NULL 
                WHERE last_login < NOW() - INTERVAL '7 days'
            `);
            
            console.log('✅ Nettoyage automatique des données effectué');
            return { success: true, message: 'Data cleanup completed' };
            
        } catch (error) {
            console.error('Erreur nettoyage automatique:', error);
            throw error;
        }
    }
    
    /**
     * Vérifier le consentement GDPR
     * @param {string} userId - ID de l'utilisateur
     */
    static async checkConsent(userId) {
        const result = await pool.query(`
            SELECT id, email
            FROM users WHERE id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        // Valeurs par défaut pour les colonnes GDPR qui n'existent pas encore
        const currentPolicyVersion = process.env.PRIVACY_POLICY_VERSION || '1.0';
        
        return {
            has_consent: false, // Par défaut, pas de consentement explicite
            consent_date: null,
            policy_version: currentPolicyVersion,
            needs_update: false // Pas de version précédente à comparer
        };
    }
}
