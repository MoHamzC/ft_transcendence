import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type PieData = {
  name: string;
  value: number;
};

type Props = {
  data: PieData[];
};

const COLORS: string[] = ["#0b3d91", "#1e2a78", "#5c5d67", "#f9fafc", "#a6c8ff", "#2e8b57"];

const MyPieChart: React.FC<Props> = ({ data }) => {
  return (
    <div style={{ width: "100%", height: 400  }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={130}
            innerRadius={0}
            paddingAngle={0}
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
