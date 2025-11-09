
import React, { useState } from 'react';
import { EvaluationLevel } from '../../types';
import { ArrowDownIcon, ArrowUpIcon, XCircleIcon } from '../Icons';

export const EditableQuestionList: React.FC<{
    title: string;
    questions: string[];
    setQuestions: (level: EvaluationLevel, newQuestions: string[]) => Promise<void>;
    level: EvaluationLevel;
    requestConfirmDelete: (index: number) => void;
}> = ({ title, questions, setQuestions, level, requestConfirmDelete }) => {
    const [newQuestion, setNewQuestion] = useState('');

    const handleAddQuestion = () => {
        if (newQuestion.trim() === '') return;
        const updatedQuestions = [...questions, newQuestion.trim()];
        setQuestions(level, updatedQuestions);
        setNewQuestion('');
    };

    const handleRemoveQuestion = (indexToRemove: number) => {
        requestConfirmDelete(indexToRemove);
    };

    const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
            return;
        }
        const newQuestions = [...questions];
        const item = newQuestions[index];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        newQuestions[index] = newQuestions[swapIndex];
        newQuestions[swapIndex] = item;
        setQuestions(level, newQuestions);
    };
    
    return (
        <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">{title}</h3>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); handleAddQuestion(); }}>
                    <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Nueva pregunta"
                        className="flex-grow p-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button type="submit" className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-green-700 hover:bg-green-400 cursor-pointer transition-colors">
                        Agregar
                    </button>
                </form>
                <ul className="list-none p-0 m-0 flex flex-col gap-2">
                    {questions.map((q, index) => (
                        <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-lg text-gray-900 flex-grow mr-4">{q}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handleMoveQuestion(index, 'up')} disabled={index === 0} className="text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ArrowUpIcon className="w-6 h-6" />
                                </button>
                                <button onClick={() => handleMoveQuestion(index, 'down')} disabled={index === questions.length - 1} className="text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ArrowDownIcon className="w-6 h-6" />
                                </button>
                                <button onClick={() => handleRemoveQuestion(index)} className="text-gray-600 hover:text-red-600">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
