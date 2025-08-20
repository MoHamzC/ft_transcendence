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
                    username = 'anonymized_user_' || id,
                    first_name = NULL,
                    last_name = NULL,
                    phone = NULL,
                    birth_date = NULL,
                    profile_picture = NULL,
                    bio = NULL,
                    last_login = NULL,
                    ip_address = NULL,
                    user_agent = NULL,
                    anonymized_at = NOW(),
                    gdpr_status = 'anonymized'
                WHERE id = $1
            `, [userId]);
            
            // 2. Anonymiser les messages/posts
            await client.query(`
                UPDATE messages 
                SET content = '[Message anonymisé - GDPR]', 
                    anonymized_at = NOW()
                WHERE user_id = $1
            `, [userId]);
            
            // 3. Anonymiser les scores de jeu (garder les stats anonymes)
            await client.query(`
                UPDATE game_scores 
                SET player_name = 'Joueur Anonyme',
                    anonymized_at = NOW()
                WHERE user_id = $1
            `, [userId]);
            
            // 4. Conserver uniquement les données nécessaires pour l'intégrité
            // (scores globaux, statistiques anonymes, etc.)
            
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
            
            // 1. Supprimer les données sensibles
            await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM friend_requests WHERE requester_id = $1 OR addressee_id = $1', [userId]);
            await client.query('DELETE FROM friends WHERE user1_id = $1 OR user2_id = $1', [userId]);
            
            // 2. Anonymiser au lieu de supprimer (pour préserver l'intégrité des jeux)
            await this.anonymizeUser(userId);
            
            // 3. Marquer comme supprimé
            await client.query(`
                UPDATE users 
                SET 
                    deleted_at = NOW(),
                    gdpr_status = 'deleted',
                    deletion_reason = 'User request - GDPR Art. 17'
                WHERE id = $1
            `, [userId]);
            
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
                SELECT id, email, username, first_name, last_name, 
                       created_at, last_login, profile_picture, bio
                FROM users WHERE id = $1 AND deleted_at IS NULL
            `, [userId]);
            
            if (userResult.rows.length === 0) {
                throw new Error('User not found or deleted');
            }
            
            const userData = userResult.rows[0];
            
            // 2. Historique des jeux
            const gamesResult = await pool.query(`
                SELECT game_type, score, opponent, played_at, duration
                FROM game_history WHERE user_id = $1
                ORDER BY played_at DESC
            `, [userId]);
            
            // 3. Messages
            const messagesResult = await pool.query(`
                SELECT content, sent_at, receiver_id
                FROM messages WHERE user_id = $1
                ORDER BY sent_at DESC
            `, [userId]);
            
            // 4. Amis
            const friendsResult = await pool.query(`
                SELECT u.username, f.created_at as friends_since
                FROM friends f
                JOIN users u ON (u.id = f.user1_id OR u.id = f.user2_id)
                WHERE (f.user1_id = $1 OR f.user2_id = $1) AND u.id != $1
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
                    game_history: gamesResult.rows,
                    messages: messagesResult.rows,
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
            SELECT gdpr_consent, gdpr_consent_date, privacy_policy_version
            FROM users WHERE id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        const user = result.rows[0];
        const currentPolicyVersion = process.env.PRIVACY_POLICY_VERSION || '1.0';
        
        return {
            has_consent: user.gdpr_consent,
            consent_date: user.gdpr_consent_date,
            policy_version: user.privacy_policy_version,
            needs_update: user.privacy_policy_version !== currentPolicyVersion
        };
    }
}
