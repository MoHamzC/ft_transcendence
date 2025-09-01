import FuzzyText from "./FuzzyText";
import React, { useEffect, useState } from 'react';
import TargetCursor from './TargetCursor';
import {useNavigate} from "react-router-dom";
export default function SelectPlayers() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur vient de se connecter
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');

    if (loginSuccess === 'success') {
      setShowWelcome(true);
      // Nettoyer l'URL après 3 secondes
      setTimeout(() => {
        setShowWelcome(false);
        window.history.replaceState({}, '', '/selectplayers');
      }, 3000);
    }
  }, []);

  const [creating, setCreating] = useState(false);
  const [aliases, setAliases] = useState<string[]>([]); // includes current user at index 0 if logged
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const BACKEND_URL = 'http://localhost:5001';

  useEffect(() => {
    // Préparer champs alias par défaut
    setAliases(['', '', '', '']);
  }, []);

  const fetchCurrentUser = async (): Promise<string | null> => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/players/me`, { credentials: 'include' });
      if (!r.ok) return null;
      const data = await r.json();
      return data.name || data.username || null;
    } catch {
      return null;
    }
  };

  const handleChoose = async (n: number) => {
    setError('');
    setInfo('');
    setCreating(true);
    try {
      // Ajuster taille alias array
      setAliases(prev => {
        const a = [...prev];
        if (a.length < n) {
          while (a.length < n) a.push('');
        } else if (a.length > n) {
          a.length = n;
        }
        return a;
      });

      const currentName = await fetchCurrentUser();
      if (currentName) {
        setAliases(prev => {
          const copy = [...prev];
          copy[0] = currentName; // auto fill
          return copy;
        });
      }

      // Create tournament
      const mode = n === 4 ? '4_players' : '8_players';
      console.log('[SelectPlayers] Creating tournament with', n, 'players');
      const createRes = await fetch(`${BACKEND_URL}/api/tournament-temp/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: `Auto ${n}P ${new Date().toLocaleTimeString()}`, mode })
      });
      const createText = await createRes.text();
      let createData: any = null;
      try { createData = JSON.parse(createText); } catch { /* plain text */ }
      console.log('[SelectPlayers] Create response raw:', createText);
      if (!createRes.ok || !createData?.success) {
        const msg = createData?.detail ? `${createData.error}: ${createData.detail}` : (createData?.error || `Create failed (status ${createRes.status})`);
        throw new Error(msg);
      }
      const tid = createData.tournament?.id;
      if (!tid) throw new Error('Tournament ID missing in response');
      setTournamentId(tid);
      setInfo('Tournoi créé. Ajoute les autres joueurs.');
    } catch (e:any) {
      setError(e.message || 'Error');
      console.error('[SelectPlayers] Tournament creation error:', e);
    } finally {
      setCreating(false);
    }
  };

  const updateAlias = (idx: number, value: string) => {
    setAliases(prev => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  const registerParticipants = async () => {
    if (!tournamentId) return;
    try {
      setCreating(true);
      for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        if (!alias.trim()) throw new Error('Alias vide');
        // Skip first if matches current user (will already be registered auto)
        if (i === 0) {
          // we still try join to ensure slot 1 filled if not already
          await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ alias, isTemporary: false })
          });
          continue;
        }
        const resp = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ alias, isTemporary: true })
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Join failed');
      }
      setInfo('Participants enregistrés. Démarrage du tournoi...');
      // Start tournament
  await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/start`, { method: 'POST', credentials: 'include' });
      navigate('/tournament');
    } catch (e:any) {
      setError(e.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const buttonStyle: React.CSSProperties = {
    background: 'oklch(38% 0.189 293.745)',
    color: 'white',
    width: '220px',
    height: '120px',
    fontSize: '2rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '18px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <FuzzyText
        fontSize="clamp(2rem, 4.5vw, 4.5rem)"
      >
        Number of players
      </FuzzyText>

      <div className="mt-8 flex gap-6">
        <button
          onClick={() => handleChoose(4)}
          className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target"
          style={buttonStyle}
        >
            <img src="/src/assets/icon_table_preserved.png" alt="Table Icon" style={{ width: '64px', height: '64px' }} />
            4 Players
        </button>

        <button
          onClick={() => handleChoose(8)}
          className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target"
          style={buttonStyle}
        >
            <img src="/src/assets/pong_multi.png" alt="Pong Multi Icon" style={{ width: '64px', height: '64px' }} />
            8 Players
        </button>
      </div>

      {/* Always show global error/info messages */}
      {(error || info) && (
        <div style={{marginTop:'16px', maxWidth:500, textAlign:'center'}}>
          {error && <div style={{color:'tomato', fontWeight:600}}>{error}</div>}
          {info && <div style={{color:'#00ff88', fontWeight:600}}>{info}</div>}
        </div>
      )}

  {tournamentId && (
        <div style={{marginTop:'40px', width:'80%', maxWidth:'760px'}}>
          <h2 style={{fontSize:'1.5rem', fontWeight:'bold'}}>Participants</h2>
          <p>Remplis les pseudos (le premier est toi si connecté).</p>
          <div style={{display:'grid', gap:'12px', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', marginTop:'12px'}}>
            {aliases.map((a,i)=> (
              <div key={i} style={{display:'flex', flexDirection:'column'}}>
                <label style={{fontSize:'0.8rem'}}>Player {i+1}</label>
                <input disabled={creating} value={a} onChange={e=>updateAlias(i,e.target.value)} style={{padding:'6px 8px', borderRadius:6, border:'1px solid #444', background:'#111', color:'#fff'}} />
              </div>
            ))}
          </div>
          <button disabled={creating} onClick={registerParticipants} style={{marginTop:'16px', padding:'10px 18px', background:'linear-gradient(135deg,#00ff88,#00cc6a)', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer'}}>
            {creating ? 'Processing...' : 'Enregistrer & Démarrer'}
          </button>
          {/* error/info déjà affichés globalement */}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/tournament')}
          className="px-6 py-3 text-white cursor-target rounded-lg active:scale-95 hover:scale-105 transition-all duration-200 mr-4"
          style={{
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#1a1a2e',
            fontWeight: 'bold'
          }}
        >
          🏆 Tournament Mode
        </button>
        <button
          onClick={() => navigate('/pong')}
          className="px-6 py-3 text-white cursor-target rounded-lg active:scale-95 hover:scale-105 transition-all duration-200"
          style={{
            background: 'oklch(25.7% 0.09 281.288)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          Retour aux jeux
        </button>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
