import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FuzzyText from "./FuzzyText";
import MyPieChart from "./PieChart";
import TargetCursor from "./TargetCursor";
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
    <div
      className="cursor-target bg-[#161b3d] hover:scale-101 active:scale-99 transition-transform duration-200 border border-white/10 rounded-[15px] p-6 mb-6"
      style={{
        maxWidth: 640,
        margin: '0 auto 1rem',
        boxShadow: '0 8px 28px -10px rgba(0,0,0,0.65)',
      }}
    >
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <h3 style={{ color: '#c084fc', fontSize: '1.25rem', margin: '0 0 12px', textAlign: 'center' }}>
        User stats
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
        <div style={{ color: '#c084fc', fontWeight: 600 }}>Username</div>
        <div style={{ color: '#ffffff' }}>{stats.username}</div>

        <div style={{ color: '#c084fc', fontWeight: 600 }}>Games Played</div>
        <div style={{ color: '#ffffff' }}>{stats.gamesPlayed}</div>

        <div style={{ color: '#c084fc', fontWeight: 600 }}>Wins</div>
        <div style={{ color: '#ffffff' }}>{stats.gamesWon}</div>

        <div style={{ color: '#c084fc', fontWeight: 600 }}>Losses</div>
        <div style={{ color: '#ffffff' }}>{stats.gamesLost}</div>

        <div style={{ color: '#c084fc', fontWeight: 600 }}>Draws</div>
        <div style={{ color: '#ffffff' }}>{stats.draws ?? 0}</div>

        <div style={{ color: '#c084fc', fontWeight: 600 }}>Win Rate</div>
        <div style={{ color: '#ffffff' }}>{stats.winRate ?? '—'}%</div>

        <div style={{ color: '#c084fc', fontWeight: 600 }}>Created</div>
        <div style={{ color: '#ffffff' }}>{stats.createdAt ? new Date(stats.createdAt).toLocaleDateString() : '—'}</div>
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
        console.error('Error init/fetch stats:', err);
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

  const totalGames = (() => {
    if (!stats) return 0;
    if (typeof stats.gamesPlayed === 'number' && stats.gamesPlayed > 0) return stats.gamesPlayed;
    const wins = stats.gamesWon ?? 0;
    const losses = stats.gamesLost ?? 0;
    const draws = stats.draws ?? 0;
    return wins + losses + draws;
  })();
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <FuzzyText>Stats</FuzzyText>
      </div>

      {loading && <div style={{ textAlign: 'center' }}>Loading stats...</div>}
      {error && <div style={{ textAlign: 'center', color: '#aa0000' }}>{error}</div>}

      
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '2rem',
          padding: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 420px', minWidth: 320, maxWidth: 640 }}>
          <UserStats stats={stats} />
        </div>

        {totalGames > 0 ? (
          <div style={{ width: 320, height: 320 }} className="chart hover:scale-105 active:scale-95">
            <MyPieChart data={chartData} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
