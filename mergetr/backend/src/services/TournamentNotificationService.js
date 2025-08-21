// src/services/TournamentNotificationService.js

/* TournamentNotificationService.js — Service pour les notifications temps réel des tournois
    - Gestion des WebSocket pour les notifications
    - Annonces des matchs en temps réel
    - Notifications des résultats et progression du tournoi
*/

import { EventEmitter } from 'events';

class TournamentNotificationService extends EventEmitter {
    constructor() {
        super();
        this.subscribers = new Map(); // tournamentId -> Set<connectionId>
        this.connections = new Map(); // connectionId -> socket
    }

    // Abonner une connexion WebSocket à un tournoi
    subscribe(tournamentId, connectionId, socket) {
        if (!this.subscribers.has(tournamentId)) {
            this.subscribers.set(tournamentId, new Set());
        }
        
        this.subscribers.get(tournamentId).add(connectionId);
        this.connections.set(connectionId, socket);

        console.log(`🔔 Nouvelle souscription au tournoi ${tournamentId} (connexion ${connectionId})`);

        // Envoyer un message de confirmation
        this.sendToConnection(connectionId, {
            type: 'subscription_confirmed',
            tournamentId,
            message: 'Vous êtes maintenant abonné aux notifications de ce tournoi'
        });

        // Gérer la déconnexion
        socket.on('close', () => {
            this.unsubscribe(tournamentId, connectionId);
        });
    }

    // Désabonner une connexion d'un tournoi
    unsubscribe(tournamentId, connectionId) {
        if (this.subscribers.has(tournamentId)) {
            this.subscribers.get(tournamentId).delete(connectionId);
            
            // Nettoyer si plus personne n'écoute ce tournoi
            if (this.subscribers.get(tournamentId).size === 0) {
                this.subscribers.delete(tournamentId);
            }
        }
        
        this.connections.delete(connectionId);
        console.log(`🔕 Désinscription du tournoi ${tournamentId} (connexion ${connectionId})`);
    }

    // Diffuser une notification à tous les abonnés d'un tournoi
    broadcast(tournamentId, notification) {
        const subscribers = this.subscribers.get(tournamentId);
        
        if (!subscribers || subscribers.size === 0) {
            console.log(`📢 Aucun abonné pour le tournoi ${tournamentId}`);
            return;
        }

        console.log(`📢 Diffusion notification tournoi ${tournamentId} : ${notification.message}`);
        
        const message = {
            tournamentId,
            timestamp: new Date().toISOString(),
            ...notification
        };

        // Envoyer à tous les abonnés
        for (const connectionId of subscribers) {
            this.sendToConnection(connectionId, message);
        }

        // Émettre l'événement pour d'autres services
        this.emit('notification_sent', {
            tournamentId,
            subscriberCount: subscribers.size,
            notification: message
        });
    }

    // Envoyer un message à une connexion spécifique
    sendToConnection(connectionId, message) {
        const socket = this.connections.get(connectionId);
        
        if (socket && socket.readyState === 1) { // WebSocket.OPEN
            try {
                socket.send(JSON.stringify(message));
            } catch (error) {
                console.error(`❌ Erreur envoi message à ${connectionId}:`, error);
                // Nettoyer la connexion fermée
                this.connections.delete(connectionId);
            }
        }
    }

    // Annoncer un nouveau match
    announceNextMatch(tournamentId, match) {
        this.broadcast(tournamentId, {
            type: 'next_match_announced',
            message: `🏓 Prochain match : ${match.player1_alias} vs ${match.player2_alias}`,
            data: {
                match,
                call_to_action: 'Préparez-vous pour le match !',
                gameRules: match.gameRules
            },
            priority: 'high'
        });
    }

    // Annoncer le résultat d'un match
    announceMatchResult(tournamentId, result) {
        const { winner, player1, player2, score } = result;
        
        this.broadcast(tournamentId, {
            type: 'match_result',
            message: `🎯 ${winner} remporte le match contre ${player1 === winner ? player2 : player1} !`,
            data: {
                result,
                score,
                celebration: true
            },
            priority: 'high'
        });
    }

    // Annoncer le début d'un tournoi
    announceTournamentStart(tournamentId, tournament, firstMatch) {
        this.broadcast(tournamentId, {
            type: 'tournament_started',
            message: `🚀 Le tournoi "${tournament.name}" commence !`,
            data: {
                tournament,
                firstMatch,
                participantCount: tournament.participant_count
            },
            priority: 'high'
        });
    }

    // Annoncer la fin d'un tournoi
    announceTournamentEnd(tournamentId, winner) {
        this.broadcast(tournamentId, {
            type: 'tournament_finished',
            message: winner ? `🏆 Tournoi terminé ! Félicitations à ${winner} !` : '🏁 Tournoi terminé !',
            data: {
                winner,
                celebration: true,
                tournamentCompleted: true
            },
            priority: 'high'
        });
    }

    // Notifier l'inscription d'un nouveau joueur
    notifyPlayerRegistration(tournamentId, player, currentCount, maxPlayers) {
        this.broadcast(tournamentId, {
            type: 'player_registered',
            message: `👋 ${player.alias} rejoint le tournoi (${currentCount}/${maxPlayers})`,
            data: {
                player,
                currentCount,
                maxPlayers,
                spotsRemaining: maxPlayers - currentCount
            },
            priority: 'medium'
        });
    }

    // Notifier la fin d'un tour
    notifyRoundComplete(tournamentId, roundNumber, nextRound) {
        this.broadcast(tournamentId, {
            type: 'round_complete',
            message: `✅ Tour ${roundNumber} terminé ! Passage au tour ${nextRound}`,
            data: {
                completedRound: roundNumber,
                nextRound,
                progression: true
            },
            priority: 'medium'
        });
    }

    // Obtenir les statistiques de souscription
    getStats() {
        const stats = {
            totalTournaments: this.subscribers.size,
            totalConnections: this.connections.size,
            tournaments: {}
        };

        for (const [tournamentId, subscribers] of this.subscribers) {
            stats.tournaments[tournamentId] = subscribers.size;
        }

        return stats;
    }

    // Nettoyer toutes les connexions
    cleanup() {
        for (const socket of this.connections.values()) {
            try {
                socket.close();
            } catch (error) {
                // Ignorer les erreurs de fermeture
            }
        }
        
        this.subscribers.clear();
        this.connections.clear();
        console.log('🧹 Service de notifications nettoyé');
    }
}

// Instance singleton
export const tournamentNotificationService = new TournamentNotificationService();

export default tournamentNotificationService;
