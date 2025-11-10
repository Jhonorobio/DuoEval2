

import React, { useMemo, useState, useEffect } from 'react';
import { Grade, Evaluation, EvaluationTarget, Answer, Teacher, Subject } from '../types';
import { CheckCircleIcon, ArrowLeftIcon, XIcon } from '../components/Icons';
import { IconRenderer } from '../components/ui/IconRenderer';
import { EvaluationView } from './Evaluation';

interface DashboardViewProps {
    studentName: string;
    grade: Grade;
    evaluations: Evaluation[];
    onStartEvaluation: (target: EvaluationTarget) => void;
    showCompletionMessage: boolean;
    onCompleteAnother: () => void;
    onChangeGrade: () => void;
    currentEvaluationTarget: EvaluationTarget | null;
    currentAnswers: Answer[];
    currentQuestionIndex: number;
    handleAnswer: (answer: Answer) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    exitEvaluation: () => void;
    grades: Grade[];
    teachers: Teacher[];
    subjects: Subject[];
    primaryQuestions: string[];
    highSchoolQuestions: string[];
}

export const DashboardView: React.FC<DashboardViewProps> = (props) => {
    const { 
        studentName, grade, evaluations, onStartEvaluation, showCompletionMessage, onCompleteAnother, onChangeGrade, 
        currentEvaluationTarget, currentAnswers, currentQuestionIndex, handleAnswer, nextQuestion, 
        previousQuestion, exitEvaluation, grades, teachers, subjects, primaryQuestions, highSchoolQuestions 
    } = props;
    
    const [showCompleted, setShowCompleted] = useState(false);
    const [showAllPending, setShowAllPending] = useState(false);

    const { pendingAssignments, completedAssignments } = useMemo(() => {
        const gradeDef = grades.find(g => g.id === grade.id);
        if (!gradeDef) return { pendingAssignments: [], completedAssignments: [] };
        
        const allAssignments = gradeDef.assignments.map(a => {
            const teacher = teachers.find(t => t.id === a.teacherId);
            const subject = subjects.find(s => s.id === a.subjectId);
            if (!teacher || !subject) return null;
            const isCompleted = evaluations.some(e => e.studentName === studentName && e.gradeId === grade.id && e.teacherId === teacher.id && e.subjectId === subject.id);
            return { teacher, subject, isCompleted };
        }).filter(Boolean) as ({ teacher: Teacher, subject: Subject, isCompleted: boolean})[];

        return {
            pendingAssignments: allAssignments.filter(a => !a.isCompleted),
            completedAssignments: allAssignments.filter(a => a.isCompleted),
        };
    }, [studentName, grade, evaluations, teachers, subjects, grades]);
    
    const [shuffledPendingAssignments, setShuffledPendingAssignments] = useState<typeof pendingAssignments>([]);

    useEffect(() => {
        // Durstenfeld shuffle algorithm
        const shuffle = (array: any[]) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };
        setShuffledPendingAssignments(shuffle(pendingAssignments));
    }, [pendingAssignments]);

    if (currentEvaluationTarget) {
        return (
            <EvaluationView
                target={currentEvaluationTarget}
                question={(currentEvaluationTarget.grade.level === 'PRIMARY' ? primaryQuestions : highSchoolQuestions)[currentQuestionIndex]}
                questionIndex={currentQuestionIndex + 1}
                totalQuestions={(currentEvaluationTarget.grade.level === 'PRIMARY' ? primaryQuestions : highSchoolQuestions).length}
                currentAnswer={currentAnswers[currentQuestionIndex]}
                onAnswer={handleAnswer}
                onNext={nextQuestion}
                onPrevious={previousQuestion}
                onExit={exitEvaluation}
            />
        );
    }

    const BATCH_SIZE = 4;
    const assignmentsToDisplay = showAllPending ? shuffledPendingAssignments : shuffledPendingAssignments.slice(0, BATCH_SIZE);

    const renderSubjectCard = (teacher: Teacher, subject: Subject, isCompleted: boolean) => (
        <div
            key={`${teacher.id}-${subject.id}`}
            className={`bg-white rounded-2xl border-2 p-3 text-center flex flex-col justify-between ${isCompleted ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}
        >
            <div className="flex flex-col items-center flex-grow justify-center mb-3">
                <IconRenderer iconId={subject.iconId} iconUrl={subject.iconUrl} className={`w-12 h-12 ${isCompleted ? 'text-gray-400' : 'text-indigo-600'}`} />
                <p className={`font-extrabold text-3xl mt-2 ${isCompleted ? 'text-gray-600' : 'text-gray-900'}`}>{subject.name}</p>
                <p className="text-xl text-gray-500">{teacher.name}</p>
            </div>
            
            {isCompleted ? (
                <button
                    disabled
                    className="w-full flex items-center justify-center text-gray-600 font-extrabold uppercase text-lg py-2 rounded-2xl border-b-8 border-gray-300 bg-gray-200 cursor-not-allowed"
                >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Completado
                </button>
            ) : (
                <button
                    onClick={() => onStartEvaluation({ grade, teacher, subject })}
                    className="w-full text-white font-extrabold uppercase text-lg py-2 rounded-2xl border-b-8 border-green-700 bg-green-500 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
                >
                    Evaluar
                </button>
            )}
        </div>
    );

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-gray-200">
                 <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight m-0">Grado: {grade.name}</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-xl text-gray-600 m-0">
                           {pendingAssignments.length > 0 ? 'Selecciona una materia para comenzar.' : '¡Has completado todas las materias!'}
                        </p>
                        {completedAssignments.length > 0 && (
                            <button 
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="text-sm font-bold text-sky-700 bg-sky-100 py-1 px-3 rounded-lg transition-colors hover:bg-sky-200 whitespace-nowrap"
                            >
                                {showCompleted ? 'Ocultar' : 'Mostrar'} Completadas ({completedAssignments.length})
                            </button>
                        )}
                    </div>
                </div>
                <button onClick={onChangeGrade} className="flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors flex-shrink-0 ml-4">
                    <ArrowLeftIcon className="w-8 h-8 mr-2" />
                    Regresar
                </button>
            </div>
            
            {showCompletionMessage && (
                <div className="bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-lg mb-6 flex items-center justify-between shadow-md animate-fade">
                    <div className="flex items-center">
                        <CheckCircleIcon className="w-6 h-6 mr-3 text-emerald-600" />
                        <div>
                            <p className="font-bold text-lg">¡Evaluación enviada con éxito!</p>
                            <p>Gracias por tu opinión. Por favor, continúa con las demás.</p>
                        </div>
                    </div>
                    <button onClick={onCompleteAnother} className="text-emerald-600 p-1 rounded-full hover:bg-emerald-200">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {assignmentsToDisplay.map(({ teacher, subject, isCompleted }) => renderSubjectCard(teacher, subject, isCompleted))}
            </div>

            {shuffledPendingAssignments.length > BATCH_SIZE && (
                <div className="text-center my-6">
                    <button
                        onClick={() => setShowAllPending(!showAllPending)}
                        className="font-bold text-lg text-sky-600 bg-sky-100 py-3 px-8 rounded-xl transition-colors hover:bg-sky-200 border-b-4 border-sky-200 hover:border-sky-300 active:translate-y-0.5"
                    >
                        {showAllPending 
                            ? 'Mostrar menos' 
                            : `Ver las ${shuffledPendingAssignments.length - BATCH_SIZE} materias restantes`}
                    </button>
                </div>
            )}

            {showCompleted && completedAssignments.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-gray-200 animate-fade">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Materias Completadas</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {completedAssignments.map(({ teacher, subject, isCompleted }) => renderSubjectCard(teacher, subject, isCompleted))}
                    </div>
                </div>
            )}
        </div>
    );
}
