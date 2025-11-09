
import React from 'react';
import { Grade, EvaluationLevel } from '../types';
import { ArrowLeftIcon } from '../components/Icons';

interface GradeSelectionViewProps {
  studentName: string;
  grades: Grade[];
  onSelectGrade: (grade: Grade) => void;
  onBack: () => void;
}

export const GradeSelectionView: React.FC<GradeSelectionViewProps> = ({ studentName, grades, onSelectGrade, onBack }) => {
  return (
    <div className="w-full text-center animate-fade">
        <div className="relative mb-6 text-center">
             <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors">
                <ArrowLeftIcon className="w-8 h-8 mr-2"/>
                Regresar
             </button>
            <div>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight m-0">Hola, <span className="text-green-500">{studentName}</span>!</h1>
                <p className="text-xl text-gray-600">¡Es hora de evaluar!</p>
            </div>
        </div>
        <div className="flex items-center justify-center my-8">
            <span className="flex-grow border-t border-gray-300"></span>
            <h2 className="px-6 text-3xl font-bold text-gray-600 tracking-wider">Selecciona tu grado</h2>
            <span className="flex-grow border-t border-gray-300"></span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {grades.map(grade => (
            <button
              key={grade.id}
              onClick={() => onSelectGrade(grade)}
              className="p-4 flex flex-col items-center justify-center h-32 bg-white rounded-2xl border-2 border-gray-200 border-b-8 text-center text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:-translate-y-1 active:translate-y-0 active:border-b-4 active:bg-gray-100"
            >
              {grade.name === '0°' ? (
                <>
                  <span className="text-5xl font-extrabold">{grade.name}</span>
                  <span className="text-lg text-gray-500 -mt-2">preescolar</span>
                </>
              ) : (
                <span className="text-5xl font-extrabold">{grade.name}</span>
              )}
            </button>
        ))}
        </div>
    </div>
  )
}
