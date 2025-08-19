// tests/TournamentService.test.js

/* Tests unitaires pour TournamentService
    - Test de création de tournoi
    - Test d'inscription des joueurs
    - Test de démarrage et progression du tournoi
    - Test des cas d'erreur
*/

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { TournamentService } from '../src/services/TournamentService.js';
import pool from '../src/config/db.js';

describe('TournamentService', () => {
    let testTournamentId;
    let testUserId1, testUserId2, testUserId3, testUserId4;

    beforeAll(async () => {
        // Créer des utilisateurs de test
        const user1 = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id',
            ['test1@test.com', 'testuser1', 'hashedpass']
        );
        testUserId1 = user1.rows[0].id;

        const user2 = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id',
            ['test2@test.com', 'testuser2', 'hashedpass']
        );
        testUserId2 = user2.rows[0].id;

        const user3 = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id',
            ['test3@test.com', 'testuser3', 'hashedpass']
        );
        testUserId3 = user3.rows[0].id;

        const user4 = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id',
            ['test4@test.com', 'testuser4', 'hashedpass']
        );
        testUserId4 = user4.rows[0].id;
    });

    afterAll(async () => {
        // Nettoyer les données de test
        await pool.query('DELETE FROM tournament_matches WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournament_participants WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournaments WHERE name LIKE $1', ['Test%']);
        await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@test.com']);
        await pool.end();
    });

    beforeEach(async () => {
        // Nettoyer avant chaque test
        await pool.query('DELETE FROM tournament_matches WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournament_participants WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE $1)', ['Test%']);
        await pool.query('DELETE FROM tournaments WHERE name LIKE $1', ['Test%']);
    });

    describe('createTournament', () => {
        it('devrait créer un tournoi avec succès', async () => {
            const tournament = await TournamentService.createTournament(
                'Test Tournament',
                'Description du test',
                8,
                'elimination'
            );

            expect(tournament).toBeDefined();
            expect(tournament.name).toBe('Test Tournament');
            expect(tournament.status).toBe('registration');
            expect(tournament.max_players).toBe(8);
            
            testTournamentId = tournament.id;
        });

        it('devrait utiliser des valeurs par défaut', async () => {
            const tournament = await TournamentService.createTournament('Test Default');
            
            expect(tournament.max_players).toBe(8);
            expect(tournament.type).toBe('elimination');
            expect(tournament.status).toBe('registration');
        });
    });

    describe('registerPlayer', () => {
        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Registration');
            testTournamentId = tournament.id;
        });

        it('devrait inscrire un joueur avec succès', async () => {
            const participant = await TournamentService.registerPlayer(
                testTournamentId,
                testUserId1,
                'Player1'
            );

            expect(participant).toBeDefined();
            expect(participant.alias).toBe('Player1');
            expect(participant.registration_order).toBe(1);
        });

        it('devrait empêcher les doublons d\'alias', async () => {
            await TournamentService.registerPlayer(testTournamentId, testUserId1, 'SameAlias');
            
            await expect(
                TournamentService.registerPlayer(testTournamentId, testUserId2, 'SameAlias')
            ).rejects.toThrow();
        });

        it('devrait empêcher l\'inscription au-delà de la limite', async () => {
            // Créer un tournoi avec 2 places maximum
            const smallTournament = await TournamentService.createTournament('Small Tournament', '', 2);
            
            await TournamentService.registerPlayer(smallTournament.id, testUserId1, 'Player1');
            await TournamentService.registerPlayer(smallTournament.id, testUserId2, 'Player2');
            
            await expect(
                TournamentService.registerPlayer(smallTournament.id, testUserId3, 'Player3')
            ).rejects.toThrow('Le tournoi est complet');
        });
    });

    describe('startTournament', () => {
        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Start Tournament');
            testTournamentId = tournament.id;
        });

        it('devrait démarrer un tournoi avec suffisamment de joueurs', async () => {
            // Inscrire 4 joueurs
            await TournamentService.registerPlayer(testTournamentId, testUserId1, 'Player1');
            await TournamentService.registerPlayer(testTournamentId, testUserId2, 'Player2');
            await TournamentService.registerPlayer(testTournamentId, testUserId3, 'Player3');
            await TournamentService.registerPlayer(testTournamentId, testUserId4, 'Player4');

            const result = await TournamentService.startTournament(testTournamentId);
            
            expect(result.success).toBe(true);

            // Vérifier que le statut a changé
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            expect(details.tournament.status).toBe('in_progress');
            expect(details.matches.length).toBe(2); // 2 matchs pour 4 joueurs
        });

        it('devrait échouer avec moins de 2 joueurs', async () => {
            await TournamentService.registerPlayer(testTournamentId, testUserId1, 'Player1');
            
            await expect(
                TournamentService.startTournament(testTournamentId)
            ).rejects.toThrow('Au moins 2 joueurs sont nécessaires');
        });
    });

    describe('recordMatchResult', () => {
        let matchId, participant1Id, participant2Id;

        beforeEach(async () => {
            const tournament = await TournamentService.createTournament('Test Match Result');
            testTournamentId = tournament.id;

            const p1 = await TournamentService.registerPlayer(testTournamentId, testUserId1, 'Player1');
            const p2 = await TournamentService.registerPlayer(testTournamentId, testUserId2, 'Player2');
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
                9
            );

            expect(result.success).toBe(true);

            // Vérifier que le match est terminé
            const details = await TournamentService.getTournamentDetails(testTournamentId);
            const match = details.matches.find(m => m.id === matchId);
            expect(match.status).toBe('finished');
            expect(match.winner_id).toBe(participant1Id);
        });
    });

    describe('getTournamentDetails', () => {
        it('devrait récupérer les détails complets d\'un tournoi', async () => {
            const tournament = await TournamentService.createTournament('Test Details');
            testTournamentId = tournament.id;

            await TournamentService.registerPlayer(testTournamentId, testUserId1, 'Player1');
            await TournamentService.registerPlayer(testTournamentId, testUserId2, 'Player2');

            const details = await TournamentService.getTournamentDetails(testTournamentId);

            expect(details.tournament).toBeDefined();
            expect(details.participants).toHaveLength(2);
            expect(details.matches).toBeDefined();
        });

        it('devrait échouer pour un tournoi inexistant', async () => {
            await expect(
                TournamentService.getTournamentDetails('00000000-0000-0000-0000-000000000000')
            ).rejects.toThrow('Tournoi introuvable');
        });
    });

    describe('getNextMatch', () => {
        it('devrait retourner le prochain match à jouer', async () => {
            const tournament = await TournamentService.createTournament('Test Next Match');
            testTournamentId = tournament.id;

            await TournamentService.registerPlayer(testTournamentId, testUserId1, 'Player1');
            await TournamentService.registerPlayer(testTournamentId, testUserId2, 'Player2');
            await TournamentService.startTournament(testTournamentId);

            const nextMatch = await TournamentService.getNextMatch(testTournamentId);

            expect(nextMatch).toBeDefined();
            expect(nextMatch.status).toBe('pending');
            expect(nextMatch.player1_alias).toBeDefined();
            expect(nextMatch.player2_alias).toBeDefined();
        });

        it('devrait retourner null si aucun match en attente', async () => {
            const tournament = await TournamentService.createTournament('Test No Match');
            testTournamentId = tournament.id;

            const nextMatch = await TournamentService.getNextMatch(testTournamentId);
            expect(nextMatch).toBeNull();
        });
    });
});
