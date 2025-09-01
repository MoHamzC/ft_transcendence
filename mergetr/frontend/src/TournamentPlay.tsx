import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import TargetCursor from './TargetCursor';
import FuzzyText from './FuzzyText';
import TournamentService from './services/tournamentService';

const BACKEND_URL = 'http://localhost:5001';

interface MatchRow {
  id: number;
  round_number: number;
  match_number: number;
  player1_id: number;
  player2_id: number;
  player1_alias: string;
  player2_alias: string;
  status: string; // pending, finished, etc
  player1_color?: string | null;
  player2_color?: string | null;
  player1_skin_type?: string | null;
  player2_skin_type?: string | null;
}

export default function TournamentPlay() {
  const { tournamentId } = useParams();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [details, setDetails] = useState<any | null>(null);
  const [localParticipants, setLocalParticipants] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError('');
    try {
      // Prefer the higher-level service which returns tournament details including matches
      try {
        const d = await TournamentService.getTournamentDetails(tournamentId as string);
        setDetails(d);
        const ms = (d.matches || []).map((m: any) => ({
          id: Number(m.id),
          round_number: Number(m.round_number),
          match_number: Number(m.match_number),
          player1_id: Number(m.player1_id),
          player2_id: Number(m.player2_id),
          player1_alias: m.player1_alias || m.player1_name || m.player1 || '',
          player2_alias: m.player2_alias || m.player2_name || m.player2 || '',
          status: m.status || 'pending',
          player1_color: m.player1_color || null,
          player2_color: m.player2_color || null,
          player1_skin_type: m.player1_skin_type || null,
          player2_skin_type: m.player2_skin_type || null,
        } as MatchRow));
        setMatches(ms);
        return;
      } catch (e) {
        // fallback to the older endpoint if service call fails
      }

      const r = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/matches`, { credentials: 'include' });
      const data = await r.json().catch(() => null);
      if (Array.isArray(data)) {
        setMatches(data as MatchRow[]);
      } else if (data && data.matches) {
        setMatches((data.matches as any[]).map((m: any) => ({
          id: Number(m.id),
          round_number: Number(m.round_number),
          match_number: Number(m.match_number),
          player1_id: Number(m.player1_id),
          player2_id: Number(m.player2_id),
          player1_alias: m.player1_alias || m.player1_name || '',
          player2_alias: m.player2_alias || m.player2_name || '',
          status: m.status || 'pending',
          player1_color: m.player1_color || null,
          player2_color: m.player2_color || null,
          player1_skin_type: m.player1_skin_type || null,
          player2_skin_type: m.player2_skin_type || null,
        } as MatchRow)));
      } else {
        setMatches([]);
        if (data && data.error) setError(data.error);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;
    let interval: any = null;
    load();
    interval = setInterval(load, 3000);

    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      if (ev.key.startsWith('tournamentUpdate:')) {
        const tid = ev.key.split(':')[1];
        if (tid === tournamentId) load();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [tournamentId, load]);

  const pendingMatch = matches.find(m => m.status === 'pending');

  const organizeMatchesByRound = (matchesArr: MatchRow[]) => {
    const rounds: { [key: number]: MatchRow[] } = {};
    matchesArr.forEach(match => {
      if (!rounds[match.round_number]) rounds[match.round_number] = [];
      rounds[match.round_number].push(match);
    });
    Object.keys(rounds).forEach(r => rounds[Number(r)].sort((a,b)=>a.match_number-b.match_number));
    return rounds;
  };

  const getRoundName = (roundNumber: number, maxRounds: number) => {
    if (roundNumber === maxRounds) return 'Final';
    if (roundNumber === maxRounds - 1) return 'Semi-final';
    if (roundNumber === maxRounds - 2) return 'Quarter-final';
    return `Round ${roundNumber}`;
  };

  const getMatchStatusClass = (m: MatchRow) => {
    switch (m.status) {
      case 'pending': return 'match-pending';
      case 'in_progress': return 'match-in-progress';
      case 'finished': return 'match-finished';
      default: return '';
    }
  };

  // If an external tab already prepared a match, allow resuming quickly.
  const [savedMatch, setSavedMatch] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentTournamentMatch');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && String(obj.tournamentId) === String(tournamentId)) setSavedMatch(obj);
      }
    } catch (e) {
      // ignore
    }
  }, [tournamentId]);

  // If there are no participants provided by the server, allow entering them locally
  useEffect(() => {
    if (!details) return;
    const serverParts = details.participants || [];
    if (serverParts.length === 0) {
      // initialize localParticipants only once
      if (!localParticipants) {
        const max = details.max_players || 2;
        setLocalParticipants(Array(max).fill(''));
      }
    } else {
      // if server provides participants, clear local inputs
      if (localParticipants) setLocalParticipants(null);
    }
  }, [details]);

  const launchMatch = () => {
    if (!pendingMatch) return;
    const p1Color = pendingMatch.player1_color ?? 'red';
    const p2Color = pendingMatch.player2_color ?? 'blue';
    // Persist only IDs/colors to avoid storing participant personal data
    const ctx: any = {
      tournamentId,
      matchId: pendingMatch.id,
      player1_id: pendingMatch.player1_id,
      player2_id: pendingMatch.player2_id,
      player1_color: p1Color,
      player2_color: p2Color
    };
    localStorage.setItem('currentTournamentMatch', JSON.stringify(ctx));

    // Determine aliases to pass to the game (do not persist them)
    const p1alias = pendingMatch.player1_alias || (localParticipants ? localParticipants[0] : 'Player1');
    const p2alias = pendingMatch.player2_alias || (localParticipants ? localParticipants[1] : 'Player2');

    const qParams: any = {
      ia: 'false',
      tournamentId: String(tournamentId || ''),
      matchId: String(pendingMatch.id),
      playerId: String(pendingMatch.player1_id),
      playerColor: p1Color,
      opponentId: String(pendingMatch.player2_id),
      opponentColor: p2Color
    };
    if (p1alias) qParams.playerName = String(encodeURIComponent(p1alias));
    if (p2alias) qParams.opponentName = String(encodeURIComponent(p2alias));

    const q = new URLSearchParams(qParams).toString();
    window.open(`/export_pong3D/index.html?${q}`, '_blank', 'noopener');
  };

  const resumeSavedMatch = () => {
    if (!savedMatch) return;
    const qParams: any = {
      ia: 'false',
      tournamentId: String(savedMatch.tournamentId || ''),
      matchId: String(savedMatch.matchId || ''),
      playerId: String(savedMatch.player1_id || ''),
      playerColor: savedMatch.player1_color || 'red',
      opponentId: String(savedMatch.player2_id || ''),
      opponentColor: savedMatch.player2_color || 'blue'
    };
    if (savedMatch.player1_alias) qParams.playerName = String(encodeURIComponent(savedMatch.player1_alias));
    if (savedMatch.player2_alias) qParams.opponentName = String(encodeURIComponent(savedMatch.player2_alias));
    const q = new URLSearchParams(qParams).toString();
    // Use same behaviour as other places: change location to open the exported game
    window.location.href = `/export_pong3D/index.html?${q}`;
  };

  const handleMatchClick = (m: MatchRow) => {
    // allow editing pending matches
    if (m.status === 'pending') {
      setSelectedMatch(m);
      setShowScoreModal(true);
    }
  };

  const handleScoreSubmit = async (winnerId: string, player1Score: number, player2Score: number) => {
    if (!selectedMatch) return;
    try {
      await TournamentService.recordMatchResult(String(selectedMatch.id), String(winnerId), player1Score, player2Score);
      setShowScoreModal(false);
      setSelectedMatch(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit score');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      <div className="max-w-4xl w-full mx-4 p-8">
        <div className="flex items-center justify-between mb-8">
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="text-white">
              <div style={{ display: 'inline-block' }}>
                <FuzzyText fontSize="clamp(1.5rem, 3.5vw, 3rem)">Tournament Play</FuzzyText>
              </div>
            </h1>

          </div>
        </div>

        {savedMatch && (
          <div style={{marginBottom:12, display:'flex', justifyContent:'center'}}>
            <button onClick={resumeSavedMatch} className="block text-center px-4 py-2 rounded-xl cursor-target border border-purple-500/20" style={{background:'#ffd880', color:'#111', fontWeight:700}}>
              ▶ Resume saved match
            </button>
          </div>
        )}

        <div
          className="group relative cursor-target active:scale-95 overflow-hidden mb-8"
          style={{ background: 'oklch(25.7% 0.09 281.288)', borderRadius: '1rem' }}
        >
          <div className="absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
            <h3 className="mb-2 text-blue-300 group-hover:text-blue-200 transition-colors duration-300">Matches</h3>
            <p className="text-gray-300 mb-4">See matches for this tournament.</p>

            {error && <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(255,40,40,0.08)', color: '#ff6b6b' }}>{error}</div>}

            {loading && <div className="text-gray-400">Loading matches...</div>}

            {!loading && (
              <div style={{display:'flex', flexDirection:'column', gap:12, marginTop:12}}>
                {/* Participants */}
                {details && (
                  <div style={{marginBottom:12}}>
                    <h4 style={{color:'#9ca3af', marginBottom:8}}>Participants ({(details.participants||[]).length}/{details.max_players})</h4>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      {(details.participants||[]).map((p:any)=> (
                        <div key={p.id} style={{padding:'6px 8px', background:'#0f1724', borderRadius:6, color:'#d1d5db'}}>{p.alias}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bracket-style listing grouped by rounds */}
                {matches.length === 0 && <div className="text-gray-400">No matches at the moment.</div>}
                {Object.entries(organizeMatchesByRound(matches)).sort((a,b)=>Number(a[0])-Number(b[0])).map(([roundNum, ms])=> {
                  const arr = ms as MatchRow[];
                  const maxRounds = Math.max(...Object.keys(organizeMatchesByRound(matches)).map(Number));
                  return (
                    <div key={roundNum} style={{padding:8, borderRadius:8, background:'#071126'}}>
                      <h4 style={{margin:0, color:'#c7d2fe'}}>{getRoundName(Number(roundNum), maxRounds)}</h4>
                      <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:8}}>
                        {arr.map(m => (
                          <div key={m.id} className={`match-card ${getMatchStatusClass(m)}`} onClick={()=>handleMatchClick(m)} style={{display:'flex', justifyContent:'space-between', padding:12, borderRadius:6, background:'#0b0b0d', cursor: m.status==='pending' ? 'pointer':'default'}}>
                            <div>
                              <strong>Match {m.match_number}</strong><br/>
                              <span>{m.player1_alias} vs {m.player2_alias}</span>
                            </div>
                            <div style={{textAlign:'right'}}>
                              {m.status === 'pending' && m.id === pendingMatch?.id ? (
                                <button onClick={launchMatch} className="block text-center px-4 py-2 rounded-xl cursor-target border border-purple-500/20 hover:scale-105 active:scale-95 transition-transform bg-green-300 text-white" style={{fontWeight:700}}>
                                  ▶ Start
                                </button>
                              ) : m.status === 'pending' ? (
                                <span style={{fontSize:'0.8rem', color:'#ffd880'}}>Waiting</span>
                              ) : (
                                <span style={{fontSize:'0.8rem', color:'#7ee787'}}>✔ Finished</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {showScoreModal && selectedMatch && (
                  <ScoreInputModal
                    match={selectedMatch}
                    onSubmit={handleScoreSubmit}
                    onClose={() => { setShowScoreModal(false); setSelectedMatch(null); }}
                  />
                )}
              </div>
            )}

            {!pendingMatch && matches.length > 0 && matches.every(m => m.status === 'finished') && (
              <div style={{marginTop:'24px', fontWeight:600, color:'#00ff88'}}>Tournament finished!</div>
            )}

          </div>
        </div>
      </div>


    </div>
  );
}

// Score Input Modal Component (adapted)
interface ScoreInputModalProps {
  match: MatchRow;
  onSubmit: (winnerId: string, player1Score: number, player2Score: number) => void;
  onClose: () => void;
}

function ScoreInputModal({ match, onSubmit, onClose }: ScoreInputModalProps) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1Score === player2Score) {
      setError('Draws are not allowed in elimination');
      return;
    }
    if (player1Score < 0 || player2Score < 0) {
      setError('Scores cannot be negative');
      return;
    }
    const winnerId = player1Score > player2Score ? String(match.player1_id) : String(match.player2_id);
    onSubmit(winnerId, player1Score, player2Score);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content score-modal">
        <h2 className="modal-title">Submit match result</h2>

        <div className="match-info">
          <div className="players" style={{display:'flex', justifyContent:'center', gap:12}}>
            <span>{match.player1_alias || 'TBD'}</span>
            <span className="vs">VS</span>
            <span>{match.player2_alias || 'TBD'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="score-inputs" style={{display:'flex', gap:12, justifyContent:'center', marginTop:12}}>
            <div className="score-input-group">
              <label>{match.player1_alias}</label>
              <input type="number" min={0} value={player1Score} onChange={(e)=>setPlayer1Score(parseInt(e.target.value)||0)} className="score-input" required />
            </div>
            <div className="score-input-group">
              <label>{match.player2_alias}</label>
              <input type="number" min={0} value={player2Score} onChange={(e)=>setPlayer2Score(parseInt(e.target.value)||0)} className="score-input" required />
            </div>
          </div>

          {error && <div className="alert alert-error" style={{color:'#ff6b6b', marginTop:8}}>{error}</div>}

          <div className="modal-actions" style={{display:'flex', justifyContent:'center', gap:12, marginTop:12}}>
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">Submit result</button>
          </div>
        </form>
      </div>
    </div>
  );
}
