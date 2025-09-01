import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TargetCursor from './TargetCursor';
import FuzzyText from './FuzzyText';

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
}

export default function TournamentPlay() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/matches`, { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json();
      if (data.success) {
        setMatches(data.matches);
        setLoading(false);
      }
    } catch (e:any) {
      setError(e.message);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;
    let interval: any = null;
    load();
    interval = setInterval(load, 3000);

    // Instant refresh via storage event (déclenché par l'onglet du jeu)
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      if (ev.key.startsWith('tournamentUpdate:')) {
        const tid = ev.key.split(':')[1];
        if (tid === tournamentId) {
          load();
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [tournamentId, load]);

  const pendingMatch = matches.find(m => m.status === 'pending');

  const launchMatch = () => {
    if (!pendingMatch) return;
    const ctx = {
      tournamentId,
      matchId: pendingMatch.id,
      player1_id: pendingMatch.player1_id,
      player2_id: pendingMatch.player2_id,
      player1_alias: pendingMatch.player1_alias,
      player2_alias: pendingMatch.player2_alias
    };
    localStorage.setItem('currentTournamentMatch', JSON.stringify(ctx));
    // Lancer la version 3D exportée (pas d'IA pour un match tournoi => ia=false)
    const q = new URLSearchParams({
      ia: 'false',
      tournamentId: String(tournamentId || ''),
      matchId: String(pendingMatch.id),
  p1: pendingMatch.player1_alias,
  p2: pendingMatch.player2_alias,
  // Exposer les participant IDs pour le moteur Godot (ils seront interprétés comme PL_id / PR_id)
  PL_id: String(pendingMatch.player1_id),
  PR_id: String(pendingMatch.player2_id)
    }).toString();
  // Ouvrir dans un nouvel onglet pour garder l'écran tournoi visible
  window.open(`/export_pong3D/index.html?${q}`, '_blank', 'noopener');
  };

  return (
    <div className="tournament-container" style={{ justifySelf: 'stretch', alignSelf: 'stretch' }}>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <div className="tournament-header">
        <h1><FuzzyText>Tournament Play</FuzzyText></h1>
        <p>Live progression for tournament {tournamentId}</p>
      </div>
      {error && <div className="message error-message">{error}</div>}
      {loading && <div>Loading matches...</div>}
      {!loading && (
        <div className="main-content" style={{maxWidth: '900px', margin:'0 auto'}}>
          <h2>Matches</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'12px', marginTop:'16px'}}>
            {matches.map(m => (
              <div key={m.id} style={{padding:'12px 16px', border:'1px solid #333', borderRadius:8, background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <strong>Round {m.round_number} - Match {m.match_number}</strong><br />
                  <span>{m.player1_alias} vs {m.player2_alias}</span><br />
                  <span style={{fontSize:'0.75rem', opacity:0.7}}>Status: {m.status}</span>
                </div>
                {m.status === 'pending' && m.id === pendingMatch?.id && (
                  <button onClick={launchMatch} className="action-btn" style={{background:'linear-gradient(135deg,#00ff88,#00cc6a)', color:'#1a1a2e', padding:'8px 18px', borderRadius:6, fontWeight:600}}>
                    ▶ Start
                  </button>
                )}
                {m.status !== 'pending' && <span style={{fontSize:'0.8rem'}}>✔</span>}
              </div>
            ))}
          </div>
          {!pendingMatch && matches.length > 0 && matches.every(m => m.status === 'finished') && (
            <div style={{marginTop:'24px', fontWeight:600, color:'#00ff88'}}>Tournament finished!</div>
          )}
        </div>
      )}
      <div className="bottom-actions" style={{marginTop:'40px'}}>
        <button onClick={()=>navigate('/tournament')} className="action-btn back-btn">← Back</button>
      </div>
    </div>
  );
}
