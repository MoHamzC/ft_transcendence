import React, { useEffect, useState } from 'react';
import FuzzyText from './FuzzyText';

interface MatchRow {
  id: string;
  date: string;
  opponentId: string;
  opponentUsername: string;
  userScore: number;
  opponentScore: number;
  result: 'win' | 'loss';
}

const MatchHistory: React.FC = () => {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    let abort = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/match-history?limit=${limit}&offset=${page * limit}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Erreur chargement historique');
        }
        const data = await res.json();
        if (abort) return;
        setMatches(data.data || []);
        setTotal(data.pagination?.total || 0);
      } catch (e:any) {
        if (!abort) setError(e.message || 'Erreur inconnue');
      } finally {
        if (!abort) setLoading(false);
      }
    };
    fetchData();
    return () => { abort = true; };
  }, [page]);

  const pages = Math.ceil(total / limit);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', color: 'white', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <FuzzyText fontSize="clamp(2rem,4vw,3.5rem)">Match History</FuzzyText>
      </div>

      {loading && <p style={{ opacity: 0.8 }}>Chargement...</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!loading && matches.length === 0 && !error && (
        <p style={{ opacity: 0.7 }}>Aucun match trouvé.</p>
      )}

      {matches.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.08)' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Adversaire</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => {
                const date = new Date(m.date);
                const dateStr = date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={m.id} style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <td style={tdStyle}>{dateStr}</td>
                    <td style={tdStyle}>{m.opponentUsername}</td>
                    <td style={tdStyle}>{m.userScore} - {m.opponentScore}</td>
                    <td style={{ ...tdStyle, color: m.result === 'win' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {m.result === 'win' ? 'Victoire' : 'Défaite'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={navBtn(page === 0)}>Précédent</button>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Page {page + 1} / {pages}</span>
          <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} style={navBtn(page >= pages - 1)}>Suivant</button>
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase'
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderTop: '1px solid rgba(255,255,255,0.08)'
};

const navBtn = (disabled: boolean): React.CSSProperties => ({
  background: disabled ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '0.8rem',
  fontWeight: 600,
  opacity: disabled ? 0.6 : 1,
  transition: 'all .2s'
});

export default MatchHistory;
