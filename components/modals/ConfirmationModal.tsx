
import React from 'react';
import { XCircleIcon } from '../Icons';

interface ConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onClose, onConfirm, title, message }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade">
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full relative flex flex-col max-w-lg">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-0">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 tracking-tight">{title}</h2>
                <p className="text-lg text-gray-600 text-center mb-6 whitespace-pre-wrap">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="font-bold py-3 px-6 rounded-lg transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="font-bold py-3 px-6 rounded-lg transition-colors bg-red-600 text-white border-b-4 border-red-800 hover:bg-red-500"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};
