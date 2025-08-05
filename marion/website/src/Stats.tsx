import FuzzyText from "./FuzzyText";
import React from "react";
import MyPieChart from "./PieChart";

export default function Stats ()
{

const TheData = [
  { name: "Win", value: 400 },
  { name: "LOser", value: 300 },
  { name: "NUll", value: 300 },
  { name: "Egality", value: 200 },
];
	return (
		<div className="stats">
			<FuzzyText>Stats</FuzzyText>
			<MyPieChart data={TheData}/>
		</div>
	)
}