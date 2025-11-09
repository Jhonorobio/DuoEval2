
import React from 'react';

export const ChartTooltipWithFullQuestion = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // label can be a number, so we cast it to string
        const questionLabel = String(label).split(' - ')[0];
        const { fullQuestion, score } = payload[0].payload;
        return (
            <div className="bg-white p-2 border border-gray-200 rounded shadow-lg max-w-xs text-left">
                <p className="font-bold text-gray-900">{questionLabel}</p>
                {fullQuestion && <p className="text-sm text-gray-800 my-1">{fullQuestion}</p>}
                <p className="text-indigo-600 font-semibold">{`Puntaje: ${score}`}</p>
            </div>
        );
    }
    return null;
};
