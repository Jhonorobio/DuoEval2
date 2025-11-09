
import React from 'react';
import { CheckCircleIcon } from '../components/Icons';
import { BigButton } from '../components/ui/BigButton';

export const FinalCompletionView: React.FC<{ studentName: string; onExit: () => void; }> = ({ studentName, onExit }) => {
    return (
        <div className="w-full text-center flex flex-col items-center justify-center h-[calc(100vh-2rem)] animate-fade">
            <CheckCircleIcon className="w-32 h-32 text-green-500 mb-6" />
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">¡Excelente trabajo, {studentName}!</h1>
            <h2 className="text-3xl font-bold text-gray-700 mb-8">Has completado todas las evaluaciones de tu grado.</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Tu opinión es muy valiosa para nosotros y nos ayuda a mejorar. ¡Gracias por tu participación!
            </p>
            <BigButton
              onClick={onExit}
              className="bg-sky-500 border-sky-700"
            >
              Finalizar y Salir
            </BigButton>
        </div>
    );
};
