
import React from 'react';
import { Subject } from '../../types';
import { AVAILABLE_ICONS } from '../ui/IconRenderer';
import { XCircleIcon } from '../Icons';

export const SubjectIconModal: React.FC<{
    subject: Subject;
    onClose: () => void;
    onSave: (subjectId: string, iconId: string) => void;
}> = ({ subject, onClose, onSave }) => {

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full relative max-w-3xl">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-0">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 tracking-tight">
                    Seleccionar Ícono para "{subject.name}"
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                    {Object.entries(AVAILABLE_ICONS).map(([id, Icon]) => (
                        <button 
                            key={id} 
                            onClick={() => {
                                onSave(subject.id, id);
                                onClose();
                            }}
                            className={`p-4 flex items-center justify-center rounded-lg transition-colors border-2 bg-gray-100 cursor-pointer hover:bg-gray-200 ${subject.iconId === id ? 'bg-blue-100 border-blue-600' : 'border-transparent'}`}
                        >
                            <Icon className="w-10 h-10 text-gray-800" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
