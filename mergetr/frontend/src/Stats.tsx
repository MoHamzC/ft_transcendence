import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FuzzyText from "./FuzzyText";
import MyPieChart from "./PieChart";

const BACKEND_URL = 'http://localhost:5001';

type StatsData = {
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  draws?: number;
  winRate?: number;
  createdAt?: string;
  updatedAt?: string;
};

function UserStats({ stats }: { stats?: StatsData | null }) {
  if (!stats) return null;
  return (
    <div className="user-stats" style={{ marginBottom: '2rem', textAlign: 'center' }}>
      <h2>Stats of {stats.username}</h2>
      <div>Games Played: {stats.gamesPlayed}</div>
      <div>Wins: {stats.gamesWon}</div>
      <div>Losses: {stats.gamesLost}</div>
      <div>Draws: {stats.draws ?? 0}</div>
      <div>Win Rate: {stats.winRate ?? 0}%</div>
      <div style={{ fontSize: '0.9em', color: '#aaa' }}>
        Created At: {stats.createdAt ? new Date(stats.createdAt).toLocaleDateString() : '—'}<br />
        Updated At: {stats.updatedAt ? new Date(stats.updatedAt).toLocaleDateString() : '—'}
      </div>
    </div>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // récupérer l'utilisateur connecté (inspiré de Profile.tsx)
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const authResponse = await fetch(`${BACKEND_URL}/api/users/protected`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!authResponse.ok) {
          navigate('/login');
          return;
        }

        const userResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!userResponse.ok) {
          throw new Error(`Error ${userResponse.status}: Can't get user data`);
        }

        const data = await userResponse.json();
        if (!data.user || !data.user.id) {
          throw new Error('Missing user data');
        }

        if (mounted) setUserId(data.user.id);
      } catch (err) {
        console.error('Error loading user for Stats:', err);
        if (mounted) setError(err instanceof Error ? err.message : 'User error');
      }
    }

    void loadUser();
    return () => { mounted = false; };
  }, [navigate]);

  // init + fetch des stats quand userId est disponible
  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    async function initAndFetchStats() {
      setLoading(true);
      setError(null);
      try {
        
        await fetch(`${BACKEND_URL}/api/stats/init/${userId}`, {
          method: 'POST',
          credentials: 'include',
        });

        
        const res = await fetch(`${BACKEND_URL}/api/stats/user/${userId}`, {
          method: 'GET',
          credentials: 'include',
        });
        const body = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = body?.error || `HTTP ${res.status}`;
          if (mounted) setError(msg);
        } else {
          if (body?.success) {
            if (mounted) setStats(body.data);
          } else {
            const msg = body?.error || 'Unexpected response';
            if (mounted) setError(msg);
          }
        }
      } catch (err) {
        console.error('Erreur init/fetch stats:', err);
        if (mounted) setError('Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void initAndFetchStats();
    return () => { mounted = false; };
  }, [userId]);

  const chartData = (() => {
    if (!stats) return [
      { name: "Wins", value: 0 },
      { name: "Losses", value: 0 },
      { name: "Draws", value: 0 },
    ];
    const wins = stats.gamesWon ?? 0;
    const losses = stats.gamesLost ?? 0;
    const draws = stats.draws ?? 0;
    const total = (stats.gamesPlayed ?? (wins + losses + draws)) || 1;
    const other = Math.max(0, total - (wins + losses + draws));
    return [
      { name: "Wins", value: wins },
      { name: "Losses", value: losses },
      { name: "Draws", value: draws },
      { name: "Other", value: other },
    ];
  })();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <FuzzyText>Stats</FuzzyText>
      </div>

      {loading && <div style={{ textAlign: 'center' }}>Loading stats...</div>}
      {error && <div style={{ textAlign: 'center', color: '#aa0000' }}>{error}</div>}

      <UserStats stats={stats} />

      <div
        className="stats"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2rem",
          padding: "2rem",
          flexWrap: "wrap",
        }}
      >
        {(stats?.gamesWon || stats?.gamesLost || stats?.draws) ? (
          <div style={{ width: 320, height: 320 }} className="chart hover:scale-105 active:scale-95">
            <MyPieChart data={chartData} />
          </div>
        ) : null}

        
      </div>
    </div>
  );
}
