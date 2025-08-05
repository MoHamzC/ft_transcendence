import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Typage des données
type PieData = {
  name: string;
  value: number;
};

const data: PieData[] = [
  { name: "Win", value: 400 },
  { name: "Null", value: 300 },
  { name: "Egality", value: 300 },
  { name: "Victory", value: 200 },
];

const COLORS: string[] = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

const MyPieChart: React.FC = () => { //use fonction ? 
  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={130}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MyPieChart;
