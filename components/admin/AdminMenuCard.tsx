
import React from 'react';

export const AdminMenuCard: React.FC<{title: string, onClick: () => void}> = ({ title, onClick }) => (
    <button onClick={onClick} className="p-8 bg-white rounded-2xl border-2 border-gray-200 border-b-8 text-center text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:-translate-y-1 active:translate-y-0 active:border-b-4 active:bg-gray-100">
        <h3 className="text-3xl font-extrabold m-0">{title}</h3>
    </button>
);
