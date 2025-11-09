
import React from 'react';
import { DownloadIcon } from '../Icons';

export const Section: React.FC<{title: string, children: React.ReactNode, onExport?: () => void}> = ({title, children, onExport}) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-4xl font-bold text-gray-800 tracking-tight">{title}</h2>
            {onExport && (
                 <button 
                    onClick={onExport}
                    className="flex items-center gap-2 text-sm font-bold text-sky-700 bg-sky-100 py-2 px-3 rounded-lg transition-colors hover:bg-sky-200"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Exportar
                </button>
            )}
        </div>
        {children}
    </div>
);
