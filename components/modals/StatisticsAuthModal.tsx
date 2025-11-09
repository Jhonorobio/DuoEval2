
import React, { useState } from 'react';
import { BigButton } from '../ui/BigButton';
import { XCircleIcon } from '../Icons';

export const StatisticsAuthModal: React.FC<{ 
    onClose: () => void; 
    onSuccess: () => void;
    title?: string;
    message?: string;
}> = ({ onClose, onSuccess, title, message }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            onSuccess();
        } else {
            setError('Contraseña incorrecta.');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade">
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full relative max-w-sm">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-0">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 tracking-tight">{title || 'Acceso Restringido'}</h2>
                <p className="text-lg text-gray-600 text-center mb-6">{message || 'Ingresa la contraseña para ver las estadísticas.'}</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full p-3 text-xl border-2 rounded-xl mb-4 box-border ${error ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Contraseña"
                        autoFocus
                    />
                    {error && <p className="text-red-600 text-center mb-4">{error}</p>}
                    <BigButton onClick={() => {}} className="bg-sky-500 border-sky-700">
                        Acceder
                    </BigButton>
                </form>
            </div>
        </div>
    );
};
