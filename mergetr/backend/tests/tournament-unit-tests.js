// tests/tournament-unit-tests.js
// Tests unitaires complets pour le système de tournois

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { TournamentService } from '../src/services/TournamentService.js';
import pool from '../src/config/db.js';

describe('🏆 Système de Tournois - Tests Unitaires', () => {
    let testUsers = [];
    let testTournamentId;

    // Création d'utilisateurs de test
    beforeAll(async () => {
        console.log('🔧 Configuration des tests...');
        
        // Créer 8 utilisateurs de test
        for (let i = 1; i <= 8; i++) {
            const userQuery = `
                INSERT INTO users (email, username, password) 
                VALUES ($1, $2, $3) 
                RETURNING id
            `;
            const result = await pool.query(userQuery, [
                `testuser${i}@tournament.com`,
                `testuser${i}`,
                'hashedpassword'
            ]);
            testUsers.push(result.rows[0].id);
        }
        
        console.log(`✅ ${testUsers.length} utilisateurs de test créés`);
    });

    // Nettoyage après tous les tests
    afterAll(async () => {
        console.log('🧹 Nettoyage des données de test...');
        
        // Supprimer les données de test
        await pool.query('DELETE FROM tournament_matches WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournament_participants WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournaments WHERE name LIKE $1', ['Test%']);
        await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@tournament.com']);
        
        await pool.end();
        console.log('✅ Nettoyage terminé');
    });

    // Nettoyage avant chaque test
    beforeEach(async () => {
        // Supprimer les tournois de test existants
        await pool.query('DELETE FROM tournament_matches WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournament_participants WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournaments WHERE name LIKE $1', ['Test%']);
    });

    describe('📝 Création de tournois', () => {
        it('devrait créer un tournoi avec les paramètres par défaut', async () => {
            const tournament = await TournamentService.createTournament('Test Default Tournament');
            
            expect(tournament).toBeDefined();
            expect(tournament.name).toBe('Test Default Tournament');
            expect(tournament.max_players).toBe(8);
            expect(tournament.type).toBe('elimination');
            expect(tournament.status).toBe('registration');
            expect(tournament.id).toBeDefined();
            
            testTournamentId = tournament.id;
        });

        it('devrait créer un tournoi avec des paramètres personnalisés', async () => {
            const tournament = await TournamentService.createTournament(
                'Test Custom Tournament',
                'Description personnalisée',
                16,
                'elimination',
                testUsers[0]
            );
            
            expect(tournament.name).toBe('Test Custom Tournament');
            expect(tournament.description).toBe('Description personnalisée');
            expect(tournament.max_players).toBe(16);
            expect(tournament.created_by).toBe(testUsers[0]);
        });

        it('devrait rejeter un tournoi sans nom', async () => {
            await expect(
                TournamentService.createTournament('')
            ).rejects.toThrow();
        });
    });

    describe('👥 Inscription des joueurs', () => {
        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Registration Tournament');
            testTournamentId = tournament.id;
        });

        it('devrait inscrire un joueur avec succès', async () => {
            const participant = await TournamentService.registerPlayer(
                testTournamentId,
                testUsers[0],
                'Joueur Test 1'
            );
            
            expect(participant).toBeDefined();
            expect(participant.alias).toBe('Joueur Test 1');
            expect(participant.registration_order).toBe(1);
            expect(participant.user_id).toBe(testUsers[0]);
        });

        it('devrait numéroter les inscriptions par ordre', async () => {
            const p1 = await TournamentService.registerPlayer(testTournamentId, testUsers[0], 'Premier');
            const p2 = await TournamentService.registerPlayer(testTournamentId, testUsers[1], 'Deuxième');
            const p3 = await TournamentService.registerPlayer(testTournamentId, testUsers[2], 'Troisième');
            
            expect(p1.registration_order).toBe(1);
            expect(p2.registration_order).toBe(2);
            expect(p3.registration_order).toBe(3);
        });

        it('devrait empêcher les alias dupliqués', async () => {
            await TournamentService.registerPlayer(testTournamentId, testUsers[0], 'SameAlias');
            
            await expect(
                TournamentService.registerPlayer(testTournamentId, testUsers[1], 'SameAlias')
            ).rejects.toThrow();
        });

        it('devrait empêcher l\'inscription du même utilisateur deux fois', async () => {
            await TournamentService.registerPlayer(testTournamentId, testUsers[0], 'Premier');
            
            await expect(
                TournamentService.registerPlayer(testTournamentId, testUsers[0], 'Deuxième')
            ).rejects.toThrow();
        });

        it('devrait refuser l\'inscription quand le tournoi est complet', async () => {
            // Créer un petit tournoi
            const smallTournament = await TournamentService.createTournament('Test Small', '', 2);
            
            await TournamentService.registerPlayer(smallTournament.id, testUsers[0], 'Player1');
            await TournamentService.registerPlayer(smallTournament.id, testUsers[1], 'Player2');
            
            await expect(
                TournamentService.registerPlayer(smallTournament.id, testUsers[2], 'Player3')
            ).rejects.toThrow('Le tournoi est complet');
        });
    });

    describe('🚀 Démarrage de tournoi', () => {
        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Start Tournament');
            testTournamentId = tournament.id;
        });

        it('devrait démarrer un tournoi avec 4 joueurs', async () => {
            // Inscrire 4 joueurs
            for (let i = 0; i < 4; i++) {
                await TournamentService.registerPlayer(testTournamentId, testUsers[i], `Player${i + 1}`);
            }
            
            const result = await TournamentService.startTournament(testTournamentId);
            expect(result.success).toBe(true);
            
            // Vérifier que le statut a changé
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            expect(details.tournament.status).toBe('in_progress');
            expect(details.matches.length).toBe(2); // 2 demi-finales
        });

        it('devrait démarrer un tournoi avec 8 joueurs', async () => {
            // Inscrire 8 joueurs
            for (let i = 0; i < 8; i++) {
                await TournamentService.registerPlayer(testTournamentId, testUsers[i], `Player${i + 1}`);
            }
            
            await TournamentService.startTournament(testTournamentId);
            
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            expect(details.matches.length).toBe(4); // 4 quarts de finale
        });

        it('devrait refuser de démarrer avec moins de 2 joueurs', async () => {
            await TournamentService.registerPlayer(testTournamentId, testUsers[0], 'OnlyPlayer');
            
            await expect(
                TournamentService.startTournament(testTournamentId)
            ).rejects.toThrow('Au moins 2 joueurs sont nécessaires');
        });

        it('devrait gérer un nombre impair de joueurs', async () => {
            // Inscrire 3 joueurs
            for (let i = 0; i < 3; i++) {
                await TournamentService.registerPlayer(testTournamentId, testUsers[i], `Player${i + 1}`);
            }
            
            await TournamentService.startTournament(testTournamentId);
            
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            expect(details.matches.length).toBe(1); // Un seul match possible
        });
    });

    describe('🎮 Gestion des matchs', () => {
        let matchId, participant1Id, participant2Id;

        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Match Tournament');
            testTournamentId = tournament.id;
            
            const p1 = await TournamentService.registerPlayer(testTournamentId, testUsers[0], 'Fighter1');
            const p2 = await TournamentService.registerPlayer(testTournamentId, testUsers[1], 'Fighter2');
            participant1Id = p1.id;
            participant2Id = p2.id;
            
            await TournamentService.startTournament(testTournamentId);
            
            const nextMatch = await TournamentService.getNextMatch(testTournamentId);
            matchId = nextMatch.id;
        });

        it('devrait enregistrer un résultat de match', async () => {
            const result = await TournamentService.recordMatchResult(
                matchId,
                participant1Id,
                11,
                7
            );
            
            expect(result.success).toBe(true);
            
            // Vérifier que le match est marqué comme terminé
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            const match = details.matches.find(m => m.id === matchId);
            expect(match.status).toBe('finished');
            expect(match.winner_id).toBe(participant1Id);
            expect(match.player1_score).toBe(11);
            expect(match.player2_score).toBe(7);
        });

        it('devrait refuser un résultat avec un gagnant invalide', async () => {
            await expect(
                TournamentService.recordMatchResult(matchId, 'invalid-id', 11, 7)
            ).rejects.toThrow();
        });
    });

    describe('🏁 Progression du tournoi', () => {
        it('devrait faire progresser un tournoi complet de 4 joueurs', async () => {
            const tournament = await TournamentService.createTournament('Test Full Tournament');
            testTournamentId = tournament.id;
            
            // Inscrire 4 joueurs
            const participants = [];
            for (let i = 0; i < 4; i++) {
                const p = await TournamentService.registerPlayer(testTournamentId, testUsers[i], `Champion${i + 1}`);
                participants.push(p);
            }
            
            // Démarrer le tournoi
            await TournamentService.startTournament(testTournamentId);
            
            // Jouer les demi-finales
            let nextMatch = await TournamentService.getNextMatch(testTournamentId);
            await TournamentService.recordMatchResult(nextMatch.id, nextMatch.player1_id, 11, 8);
            
            nextMatch = await TournamentService.getNextMatch(testTournamentId);
            await TournamentService.recordMatchResult(nextMatch.id, nextMatch.player1_id, 11, 9);
            
            // Jouer la finale
            nextMatch = await TournamentService.getNextMatch(testTournamentId);
            expect(nextMatch).toBeDefined();
            expect(nextMatch.round_number).toBe(2);
            
            await TournamentService.recordMatchResult(nextMatch.id, nextMatch.player1_id, 11, 10);
            
            // Vérifier que le tournoi est terminé
            const finalState = await TournamentService.getTournamentDetails(testTournamentId);
            expect(finalState.tournament.status).toBe('finished');
            expect(finalState.tournament.winner_id).toBeDefined();
        });
    });

    describe('📊 Récupération des données', () => {
        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Data Tournament');
            testTournamentId = tournament.id;
        });

        it('devrait récupérer les détails complets d\'un tournoi', async () => {
            await TournamentService.registerPlayer(testTournamentId, testUsers[0], 'DataPlayer1');
            await TournamentService.registerPlayer(testTournamentId, testUsers[1], 'DataPlayer2');
            
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            
            expect(details.tournament).toBeDefined();
            expect(details.participants).toHaveLength(2);
            expect(details.participants[0].alias).toBeDefined();
            expect(details.matches).toBeDefined();
        });

        it('devrait lister les tournois', async () => {
            await TournamentService.createTournament('Test List Tournament 1');
            await TournamentService.createTournament('Test List Tournament 2');
            
            const tournaments = await TournamentService.listTournaments();
            expect(tournaments.length).toBeGreaterThanOrEqual(3);
            
            const registrationTournaments = await TournamentService.listTournaments('registration');
            expect(registrationTournaments.length).toBeGreaterThanOrEqual(3);
        });

        it('devrait retourner null pour getNextMatch sur un tournoi vide', async () => {
            const nextMatch = await TournamentService.getNextMatch(testTournamentId);
            expect(nextMatch).toBeNull();
        });
    });

    describe('❌ Gestion des erreurs', () => {
        it('devrait gérer les tournois inexistants', async () => {
            await expect(
                TournamentService.getTournamentDetails('00000000-0000-0000-0000-000000000000')
            ).rejects.toThrow('Tournoi introuvable');
        });

        it('devrait gérer l\'inscription à un tournoi inexistant', async () => {
            await expect(
                TournamentService.registerPlayer('00000000-0000-0000-0000-000000000000', testUsers[0], 'Test')
            ).rejects.toThrow('Tournoi introuvable');
        });

        it('devrait gérer le démarrage d\'un tournoi inexistant', async () => {
            await expect(
                TournamentService.startTournament('00000000-0000-0000-0000-000000000000')
            ).rejects.toThrow();
        });
    });
});
