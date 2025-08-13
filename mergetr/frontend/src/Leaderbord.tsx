import FuzzyText from "./FuzzyText";

const randomPlayers = [
	{ name: "char", score: 950 },
	{ name: "chat", score: 870 },
	{ name: "doux", score: 920 },
	{ name: "mignon", score: 860 },
	{ name: "chaton", score: 990 },
	{ name: "oiseau", score: 780 },
	{ name: "bbchat", score: 830 },
	{ name: "mgin", score: 910 },
	{ name: "hih", score: 800 },
	{ name: "bb", score: 880 },
];

export default function LeaderboardPage() {
  return (
    <div>
      <Leaderboard title="Leaderboard" players={randomPlayers} />
    </div>
  );
}

type Player = {
  name: string;
  score: number;
};

type Leaderboardstuff = {
  title: string;
  players: Player[];
};

export function Leaderboard({ title, players }: Leaderboardstuff) {
  return (
    <div className="leaderboard">
      <FuzzyText>{title}</FuzzyText>
      <table style={{ margin: "auto", color: "white" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => (
              <tr key={player.name + idx}>
                <td>{idx + 1}</td>
                <td>{player.name}</td>
                <td>{player.score}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}