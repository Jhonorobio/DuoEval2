
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData, EvaluationLevel } from '../types';

interface StatisticsChartProps {
  data: ChartData[];
  level: EvaluationLevel;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ data, level }) => {
  const maxScore = level === EvaluationLevel.Primary ? 3 : 4;
  const barColor = level === EvaluationLevel.Primary ? "#82ca9d" : "#8884d8";

  return (
    <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 20,
                    left: -10,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" />
                <YAxis domain={[0, maxScore]} ticks={[...Array(maxScore + 1).keys()]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill={barColor} name={`Puntaje Promedio (de ${maxScore})`} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default StatisticsChart;
