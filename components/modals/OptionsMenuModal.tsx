
import React from 'react';
import { ChartIcon, DownloadIcon, SettingsIcon, XCircleIcon } from '../Icons';

export const OptionsMenuModal: React.FC<{
    onClose: () => void;
    onShowAdmin: () => void;
    onShowCsvVisualizer: () => void;
    onShowStats: () => void;
    isGradeLockEnabled: boolean;
    onToggleGradeLock: () => void;
    isTeacherFilterEnabled: boolean;
    onToggleTeacherFilter: () => void;
}> = ({ onClose, onShowAdmin, onShowCsvVisualizer, onShowStats, isGradeLockEnabled, onToggleGradeLock, isTeacherFilterEnabled, onToggleTeacherFilter }) => {
    
    const OptionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
        <button 
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 text-left text-xl font-bold text-gray-800 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
        >
            {icon}
            {label}
        </button>
    );

    const ToggleSwitch: React.FC<{ label: string, isEnabled: boolean, onToggle: () => void }> = ({ label, isEnabled, onToggle }) => (
        <div className="flex items-center justify-between gap-3 p-4 bg-gray-100 rounded-lg shadow-inner">
            <span className="text-xl font-bold text-gray-800">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
                <div className="w-14 h-7 bg-gray-300 rounded-full transition-colors peer-checked:bg-sky-500"></div>
                <span className="absolute top-0.5 left-1 h-6 w-6 bg-white rounded-full transition-transform peer-checked:translate-x-7"></span>
            </label>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade">
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full relative flex flex-col max-w-md">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-0">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 tracking-tight">Opciones</h2>

                <div className="flex flex-col gap-4 mb-6">
                    <OptionButton icon={<SettingsIcon className="w-7 h-7 text-sky-500" />} label="Administrar" onClick={onShowAdmin} />
                    <OptionButton icon={<DownloadIcon className="w-7 h-7 text-green-500" />} label="Visualizar CSV" onClick={onShowCsvVisualizer} />
                    <OptionButton icon={<ChartIcon className="w-7 h-7 text-purple-500" />} label="Estadísticas" onClick={onShowStats} />
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
                    <ToggleSwitch label="Bloquear Grado" isEnabled={isGradeLockEnabled} onToggle={onToggleGradeLock} />
                    <ToggleSwitch label="Filtro Profesor" isEnabled={isTeacherFilterEnabled} onToggle={onToggleTeacherFilter} />
                </div>
            </div>
        </div>
    );
};
