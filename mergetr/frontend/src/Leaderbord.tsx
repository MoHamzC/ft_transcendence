import FuzzyText from "./FuzzyText";
import Podium from "./Podium";
import './Leaderbord.css';

import TargetCursor from "./TargetCursor";
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
      <div className="leaderboard-header">
        <FuzzyText>{title}</FuzzyText>
      </div>
      <Podium/>   
      
      <div className="leaderboard-list">
        <table className="simple-leaderboard-table">
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
              <tr key={player.name + idx} className="cursor-target">
                <td className="col-rank">{idx + 1}</td>
                <td className="col-name">{player.name}</td>
                <td className="col-score">{player.score}</td>
              </tr>
            ))}
        </tbody>
        </table>
      </div>
  
      <TargetCursor />
    </div>
  );
}