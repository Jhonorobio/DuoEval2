
import React from 'react';
import { Answer, EvaluationLevel, EvaluationTarget, PrimaryRating, HighSchoolRating } from '../types';
import { XIcon } from '../components/Icons';
import ProgressBar from '../components/ProgressBar';
import { PrimaryRatingSelector } from '../components/evaluation/PrimaryRatingSelector';
import { HighSchoolRatingSelector } from '../components/evaluation/HighSchoolRatingSelector';

interface EvaluationViewProps {
  target: EvaluationTarget;
  question: string;
  questionIndex: number;
  totalQuestions: number;
  currentAnswer: Answer;
  onAnswer: (answer: Answer) => void;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ target, question, questionIndex, totalQuestions, currentAnswer, onAnswer, onNext, onPrevious, onExit }) => {
  const isLastQuestion = questionIndex === totalQuestions;

  return (
    <div className="w-full h-[calc(100vh-2rem)] flex flex-col max-w-4xl mx-auto">
      <header className="flex items-center gap-4 p-2 flex-shrink-0">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-700">
          <XIcon className="w-7 h-7" />
        </button>
        <ProgressBar current={questionIndex} total={totalQuestions} />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        {target.grade.level === EvaluationLevel.HighSchool && (
            <div className="bg-sky-50 border-2 border-sky-200 text-sky-800 p-4 rounded-lg mb-8 text-center max-w-4xl mx-auto">
                <h2 className="font-bold text-2xl mb-1">EVALUACIÓN DOCENTE</h2>
                <p className="text-lg">
                    Tu opinión es muy importante para nuestra institución. Por favor, evalúa el desempeño del docente con la mayor objetividad posible.
                </p>
            </div>
        )}

        <div>
          <p className="text-2xl text-gray-500 font-bold tracking-wider mb-2">
            Pregunta {questionIndex} de {totalQuestions}
          </p>
          <h1 className="text-4xl md:text-5xl leading-tight font-extrabold text-gray-900 max-w-4xl">
            {question}
          </h1>
          <p className="text-2xl text-gray-600 mt-2">
            Evaluando a <span className="font-bold text-gray-800">Prof. {target.teacher.name}</span> en <span className="font-bold text-gray-800">{target.subject.name}</span>.
          </p>
        </div>

        <div className="w-full max-w-2xl mt-12">
          {target.grade.level === EvaluationLevel.Primary ? (
            <PrimaryRatingSelector selectedValue={currentAnswer as PrimaryRating} onSelect={(val) => onAnswer(val)} />
          ) : (
            <HighSchoolRatingSelector selectedValue={currentAnswer as HighSchoolRating} onSelect={(val) => onAnswer(val)} />
          )}
        </div>
      </main>

      <footer className="w-full mt-auto p-4 border-t-2 border-gray-100 flex items-center justify-between flex-shrink-0">
        <button
          onClick={onPrevious}
          disabled={questionIndex === 1}
          className="uppercase font-extrabold text-2xl py-4 px-8 rounded-2xl border-b-8 transition-all duration-150 bg-white text-gray-500 border-gray-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!currentAnswer}
          className="uppercase font-extrabold text-2xl py-4 px-8 rounded-2xl border-b-8 transition-all duration-150 bg-green-500 text-white border-green-700 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-300 disabled:border-gray-500 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLastQuestion ? 'Finalizar' : 'Siguiente'}
        </button>
      </footer>
    </div>
  );
};
