// services/tournamentService.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://localhost:8443';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  mode: '4_players' | '8_players';
  max_players: number;
  type: 'elimination' | 'round_robin';
  status: 'registration' | 'in_progress' | 'finished' | 'cancelled';
  participant_count: number;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  winner_alias?: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id?: string;
  alias: string;
  player_slot: number;
  registration_order: number;
  is_eliminated: boolean;
  is_authenticated: boolean;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  player1_alias: string;
  player2_alias: string;
  winner_alias?: string;
  status: 'pending' | 'in_progress' | 'finished';
  started_at?: string;
  finished_at?: string;
}

export interface TournamentDetails extends Tournament {
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

export interface AuthModeInfo {
  mode: string;
  description: string;
  endpoint: string;
  requires: string[];
  providers?: string[];
}

export interface AuthSupportInfo {
  supported: AuthModeInfo[];
  autoDetection: {
    priority: string[];
  };
}

export interface RegistrationSlot {
  slot: number;
  occupied: boolean;
  alias?: string;
  is_authenticated?: boolean;
  user_id?: string;
}

export interface RegistrationStatus {
  tournamentStatus: string;
  maxPlayers: number;
  slots: RegistrationSlot[];
  occupiedSlots: number;
  ready: boolean;
  autoRegistrationSuggestions?: any[];
}

export interface AuthData {
  type: 'authenticated' | 'anonymous';
  userId?: string;
  userAlias?: string;
  username?: string;
  email?: string;
  provider?: string;
  source?: string;
  accessToken?: string;
  sessionId?: string;
}

export interface RegistrationOptions {
  playerSlot: number;
  authMode?: 'auto' | 'oauth' | 'jwt' | 'token' | 'session' | 'anonymous';
  authData?: AuthData;
  alias?: string;
  accessToken?: string;
  provider?: string;
}

export interface RegistrationResult {
  success: boolean;
  participant: TournamentParticipant;
  autoRegistered?: boolean;
  authMethod?: string;
  message: string;
  authMode?: string;
  detectedProvider?: string;
}

export class TournamentService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;

    // Build headers conditionally: only set Content-Type when a body exists
    const headers: Record<string, string> = {
      ...((options && options.headers) as Record<string, string>),
    };

    // If a body is provided and it's not a FormData, ensure JSON content-type
    if (options && options.body !== undefined && !(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Pour inclure les cookies d'auth
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tournament API request failed:', error);
      throw error;
    }
  }

  // Créer un nouveau tournoi
  static async createTournament(
    name: string,
    description: string,
    mode: '4_players' | '8_players'
  ): Promise<{ success: boolean; tournament: Tournament }> {
    return this.request('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, mode }),
    });
  }

  // Lister les tournois
  static async getTournaments(status?: string): Promise<{ tournaments: Tournament[] }> {
    const queryParam = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/api/tournaments${queryParam}`);
  }

  // Récupérer les détails d'un tournoi
  static async getTournamentDetails(tournamentId: string): Promise<TournamentDetails> {
    return this.request(`/api/tournaments/${tournamentId}`);
  }

  // Vérifier si on peut rejoindre un tournoi
  static async checkAlias(
    tournamentId: string,
    alias: string
  ): Promise<{ canJoin: boolean; reason?: string }> {
    return this.request(`/api/tournaments/${tournamentId}/check-alias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias }),
    });
  }

  // S'inscrire à un tournoi avec mode d'authentification spécifique
  static async registerToTournament(
    tournamentId: string,
    options: RegistrationOptions
  ): Promise<RegistrationResult> {
    return this.request(`/api/tournaments/${tournamentId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
  }

  // Inscription OAuth
  static async registerWithOAuth(
    tournamentId: string,
    playerSlot: number,
    accessToken: string,
    provider: string = 'oauth'
  ): Promise<RegistrationResult> {
    return this.request(`/api/tournaments/${tournamentId}/register/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerSlot, accessToken, provider }),
    });
  }

  // Inscription avec JWT
  static async registerWithJWT(
    tournamentId: string,
    playerSlot: number,
    token?: string
  ): Promise<RegistrationResult> {
    const body: any = { playerSlot };
    if (token) body.token = token;

    return this.request(`/api/tournaments/${tournamentId}/register/jwt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // Inscription anonyme
  static async registerAnonymous(
    tournamentId: string,
    playerSlot: number,
    alias: string
  ): Promise<RegistrationResult> {
    return this.request(`/api/tournaments/${tournamentId}/register/anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerSlot, alias }),
    });
  }

  // Inscription avec session
  static async registerWithSession(
    tournamentId: string,
    playerSlot: number,
    alias?: string
  ): Promise<RegistrationResult> {
    const body: any = { playerSlot };
    if (alias) body.alias = alias;

    return this.request(`/api/tournaments/${tournamentId}/register/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // Obtenir les modes d'authentification supportés
  static async getAuthModes(): Promise<AuthSupportInfo> {
    return this.request('/api/tournaments/auth/modes');
  }

  // Tester la détection d'authentification
  static async testAuthDetection(alias?: string): Promise<{
    detected: boolean;
    authData: AuthData | null;
    fallbackToAnonymous: boolean;
    message: string;
  }> {
    const body: any = {};
    if (alias) body.alias = alias;

    return this.request('/api/tournaments/auth/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // Obtenir l'état des inscriptions avec slots
  static async getRegistrationStatus(tournamentId: string): Promise<RegistrationStatus> {
    return this.request(`/api/tournaments/${tournamentId}/registration-status`);
  }

  // Vérifier si le tournoi est prêt à démarrer
  static async checkTournamentReadiness(tournamentId: string): Promise<{
    ready: boolean;
    registered: number;
    total: number;
    message: string;
  }> {
    return this.request(`/api/tournaments/${tournamentId}/readiness`);
  }

  // Désinscrire un joueur d'un slot
  static async unregisterPlayer(tournamentId: string, playerSlot: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/tournaments/${tournamentId}/register/${playerSlot}`, {
      method: 'DELETE',
    });
  }

  // Démarrer un tournoi
  static async startTournament(tournamentId: string): Promise<{ success: boolean; message: string; nextMatch?: TournamentMatch }> {
    return this.request(`/api/tournaments/${tournamentId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Body JSON vide au lieu de undefined
    });
  }

  // Récupérer le prochain match
  static async getNextMatch(tournamentId: string): Promise<{ match: TournamentMatch | null; message?: string; announcement?: string }> {
    return this.request(`/api/tournaments/${tournamentId}/next-match`);
  }

  // Enregistrer le résultat d'un match
  static async recordMatchResult(
    matchId: string,
    winnerId: string,
    player1Score: number,
    player2Score: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/matches/${matchId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId, player1Score, player2Score }),
    });
  }
}

export default TournamentService;
