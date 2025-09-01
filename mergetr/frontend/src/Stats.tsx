import { useEffect, useState } from "react";
import FuzzyText from "./FuzzyText";
import MyPieChart from "./PieChart";


const chartData = [
  { name: "Win", value: 400 },
  { name: "Lose", value: 300 },
  { name: "Null", value: 300 },
  { name: "Draw", value: 200 },
];

const BACKEND_URL = 'http://localhost:5001';

  const userId = "288dcb99-07e9-4046-bce4-46097d892b97";

function UserStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/stats/user/${userId}`, {
          method: 'GET',
          credentials: 'include',
        });
        const body = await res.json();
        if (body.success) {
          setStats(body.data);
          setError('');
        } else {
          setError(body.error || 'Erreur inconnue');
        }
      } catch (err) {
        setError('Erreur réseau');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats) return null;
  return (
    <div className="user-stats" style={{ marginBottom: '2rem', textAlign: 'center' }}>
      <h2>Stats of {stats.username}</h2>
      <div>Games Played: {stats.gamesPlayed}</div>
      <div>Wins: {stats.gamesWon}</div>
      <div>Losses: {stats.gamesLost}</div>
      <div>Win Rate: {stats.winRate}%</div>
      <div style={{ fontSize: '0.9em', color: '#aaa' }}>
        Created At: {new Date(stats.createdAt).toLocaleDateString()}<br/>
        Updated At: {new Date(stats.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}

export default function Stats() {

 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <FuzzyText>Stats</FuzzyText>
      </div>
      <UserStats userId={userId} />
      <div
        className="stats"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "5rem",
          padding: "2rem",
        }}
      >
        <div style={{ width: 300, height: 300 }} className="chart hover:scale-105 active:scale-95">
          <MyPieChart data={chartData} />
        </div>
        <div style={{ width: 300, height: 300 }} className="chart hover:scale-105 active:scale-95">
          <MyPieChart data={chartData} />
        </div>
      </div>
    </div>
  );
}
