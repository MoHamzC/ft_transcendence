import React from "react";
import FuzzyText from "./FuzzyText";
import MyPieChart from "./PieChart";

const chartData = [
  { name: "Win", value: 400 },
  { name: "Lose", value: 300 },
  { name: "Null", value: 300 },
  { name: "Draw", value: 200 },
];

export default function Stats() {
  return (
    <div>
	<div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
	  <FuzzyText>Stats </FuzzyText>
	</div>
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
