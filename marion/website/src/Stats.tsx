import FuzzyText from "./FuzzyText";
import React from "react";
import MyPieChart from "./PieChart";

export default function Stats ()
{

const myData = [
  { name: "Frontend", value: 400 },
  { name: "Backend", value: 300 },
  { name: "Design", value: 300 },
  { name: "DevOps", value: 200 },
];
	return (
		<div className="stats">
			<FuzzyText>Stats</FuzzyText>
			<MyPieChart/>
		</div>
	)
}