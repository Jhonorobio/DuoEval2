
import React, { useState } from 'react';
import { BigButton } from '../components/ui/BigButton';
import { XCircleIcon } from '../components/Icons';

interface NameEntryViewProps {
  studentName: string;
  setStudentName: (name: string) => void;
  onShowOptions: () => void;
}

export const NameEntryView: React.FC<NameEntryViewProps> = ({ studentName, setStudentName, onShowOptions }) => {
    const [localName, setLocalName] = useState(studentName);
    return (
      <div className="relative w-full text-center flex flex-col items-center justify-center h-[calc(100vh-2rem)] animate-fade">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">¡Bienvenido/a!</h1>
        <h2 className="text-3xl font-bold text-gray-700 mb-8">Por favor, escribe tu nombre para comenzar</h2>
        <div className="relative w-full max-w-sm mb-6">
            <input
                type="text"
                placeholder="Escribe tu nombre completo"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full p-4 pr-10 text-xl border-2 border-gray-200 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Nombre del estudiante"
                onKeyDown={(e) => e.key === 'Enter' && localName.trim() && setStudentName(localName.trim())}
            />
            {localName && (
                <button onClick={() => setLocalName('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700" aria-label="Borrar texto">
                    <XCircleIcon className="w-6 h-6" />
                </button>
            )}
        </div>
        <BigButton
          onClick={() => setStudentName(localName.trim())}
          disabled={localName.trim() === ''}
          className="bg-sky-500 border-sky-700"
        >
          Continuar
        </BigButton>
        <div className="absolute bottom-4 right-4">
            <button
                onClick={onShowOptions}
                className="bg-white text-gray-700 font-bold py-2 px-4 rounded-xl border-2 border-gray-300 border-b-4 transition-all duration-150 ease-in-out text-base uppercase tracking-wider hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0"
            >
                Opciones
            </button>
        </div>
      </div>
    );
}
