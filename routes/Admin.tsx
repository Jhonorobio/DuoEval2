import React, { useState } from 'react';
import supabase from '../supabaseClient';
import { Grade, Subject, Teacher, EvaluationLevel, Evaluation } from '../types';
import { ArrowLeftIcon, XCircleIcon } from '../components/Icons';
import { AdminMenuCard } from '../components/admin/AdminMenuCard';
import { TeacherCard } from '../components/admin/TeacherCard';
import { IconRenderer } from '../components/ui/IconRenderer';
import { EditableQuestionList } from '../components/admin/EditableQuestionList';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { AssignmentsManager } from '../components/admin/AssignmentsManager';

interface AdminViewProps {
    onBack: () => void;
    grades: Grade[];
    setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    subjects: Subject[];
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    primaryQuestions: string[];
    setPrimaryQuestions: React.Dispatch<React.SetStateAction<string[]>>;
    highSchoolQuestions: string[];
    setHighSchoolQuestions: React.Dispatch<React.SetStateAction<string[]>>;
    evaluations: Evaluation[];
    setEvaluations: React.Dispatch<React.SetStateAction<Evaluation[]>>;
    onEditSubjectIcon: (subject: Subject) => void;
    onEditTeacher: (teacher: Teacher | 'new') => void;
}

export const AdminView: React.FC<AdminViewProps> = (props) => {
    const { 
        onBack, grades, setGrades, teachers, setTeachers, subjects, setSubjects, 
        primaryQuestions, setPrimaryQuestions, highSchoolQuestions, setHighSchoolQuestions,
        evaluations, setEvaluations,
        onEditSubjectIcon, onEditTeacher
    } = props;
    
    const [adminSection, setAdminSection] = useState<'main' | 'teachers' | 'subjects' | 'questions' | 'assignments'>('main');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, message: '', onConfirm: () => {} });

    const handleRemoveTeacher = (teacherToRemove: Teacher) => {
        const isAssigned = grades.some(g => g.assignments.some(a => a.teacherId === teacherToRemove.id));
        const hasEvaluations = evaluations.some(e => e.teacherId === teacherToRemove.id);

        let confirmMessage = `¿Estás seguro de que quieres quitar a "${teacherToRemove.name}"?`;
        
        const warnings = [];
        if (isAssigned) {
            warnings.push("se eliminarán sus asignaciones a grados y materias");
        }
        if (hasEvaluations) {
            warnings.push("se borrarán permanentemente TODOS los datos de sus evaluaciones");
        }
        
        if (warnings.length > 0) {
            confirmMessage = `Al quitar a "${teacherToRemove.name}", ${warnings.join(' y ')}. \n\nEsta acción no se puede deshacer. ¿Deseas continuar?`;
        }
        
        const confirmAction = async () => {
            try {
                // 1. ALWAYS attempt to delete evaluations.
                const { error: evalError } = await supabase
                    .from('evaluations')
                    .delete()
                    .eq('teacher_id', teacherToRemove.id);
                if (evalError) throw evalError;

                // 2. ALWAYS attempt to delete assignments.
                const { error: assignmentError } = await supabase
                    .from('assignments')
                    .delete()
                    .eq('teacher_id', teacherToRemove.id);
                if (assignmentError) throw assignmentError;
                
                // 3. Delete the teacher
                const { error: teacherError } = await supabase.from('teachers').delete().eq('id', teacherToRemove.id);
                if (teacherError) throw teacherError;

                // 4. Update local state
                setTeachers(prev => prev.filter(t => t.id !== teacherToRemove.id));
                
                const newGrades = grades.map(g => ({
                    ...g,
                    assignments: g.assignments.filter(a => a.teacherId !== teacherToRemove.id)
                }));
                setGrades(newGrades);
                
                setEvaluations(prev => prev.filter(e => e.teacherId !== teacherToRemove.id));

            } catch (error) {
                console.error("Error deleting teacher:", error);
                alert("No se pudo quitar al profesor. Error: " + (error as Error).message);
            }
            setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
        };
        
        setConfirmModalState({
            isOpen: true,
            message: confirmMessage,
            onConfirm: confirmAction,
        });
    };
    
    const handleAddSubject = async () => {
        if (newSubjectName.trim() === '') return;
        const newItem = { id: `s${Date.now()}`, name: newSubjectName.trim(), iconId: 'bookOpen' };
        
        const { error } = await supabase.from('subjects').insert(newItem);
        if (error) {
            console.error("Error adding subject:", error);
        } else {
            setSubjects(prev => [...prev, newItem]);
            setNewSubjectName('');
        }
    };

    const handleRemoveSubject = (idToRemove: string) => {
        const item = subjects.find(i => i.id === idToRemove);
        if (!item) return;

        const isAssigned = grades.some(g => g.assignments.some(a => a.subjectId === idToRemove));
        const hasEvaluations = evaluations.some(e => e.subjectId === idToRemove);
        
        let confirmMessage = `¿Estás seguro de que quieres quitar "${item.name}"?`;
        
        const warnings = [];
        if (isAssigned) {
            warnings.push("se eliminarán sus asignaciones a grados y profesores");
        }
        if (hasEvaluations) {
            warnings.push("se borrarán permanentemente TODOS los datos de sus evaluaciones");
        }

        if (warnings.length > 0) {
            confirmMessage = `Al quitar "${item.name}", ${warnings.join(' y ')}. \n\nEsta acción no se puede deshacer. ¿Deseas continuar?`;
        }

        const confirmAction = async () => {
             try {
                // 1. ALWAYS attempt to delete evaluations
                const { error: evalError } = await supabase
                    .from('evaluations')
                    .delete()
                    .eq('subject_id', idToRemove);
                if (evalError) throw evalError;
                
                // 2. ALWAYS attempt to delete assignments
                const { error: assignmentError } = await supabase
                    .from('assignments')
                    .delete()
                    .eq('subject_id', idToRemove);
                if (assignmentError) throw assignmentError;
                
                // 3. Delete the subject
                const { error: subjectError } = await supabase.from('subjects').delete().eq('id', idToRemove);
                if (subjectError) throw subjectError;
                
                // 4. Update local state
                setSubjects(prev => prev.filter(i => i.id !== idToRemove));
                
                const newGrades = grades.map(g => ({
                    ...g,
                    assignments: g.assignments.filter(a => a.subjectId !== idToRemove)
                }));
                setGrades(newGrades);
                
                setEvaluations(prev => prev.filter(e => e.subjectId !== idToRemove));

            } catch (error) {
                console.error("Error deleting subject:", error);
                alert("No se pudo quitar la materia. Error: " + (error as Error).message);
            }
             setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
        };
        
        setConfirmModalState({
            isOpen: true,
            message: confirmMessage,
            onConfirm: confirmAction,
        });
    };

    const handleUpdateQuestions = async (level: EvaluationLevel, newQuestions: string[]) => {
        try {
            const { error: deleteError } = await supabase.from('questions').delete().eq('level', level);
            if (deleteError) throw deleteError;

            const newQuestionsData = newQuestions.map((text, index) => ({
                level,
                text,
                order: index + 1,
            }));

            if (newQuestionsData.length > 0) {
              const { error: insertError } = await supabase.from('questions').insert(newQuestionsData);
              if (insertError) throw insertError;
            }
            
            if (level === EvaluationLevel.Primary) {
                setPrimaryQuestions(newQuestions);
            } else {
                setHighSchoolQuestions(newQuestions);
            }

        } catch (error) {
            console.error("Error updating questions:", error);
        }
    }

    const requestDeleteQuestion = (level: EvaluationLevel, index: number) => {
        const questions = level === EvaluationLevel.Primary ? primaryQuestions : highSchoolQuestions;
        const questionText = questions[index];
        
        const confirmAction = () => {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            handleUpdateQuestions(level, updatedQuestions);
            setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
        };

        setConfirmModalState({
            isOpen: true,
            message: `¿Estás seguro de que quieres quitar esta pregunta?\n\n"${questionText}"`,
            onConfirm: confirmAction,
        });
    };

    const renderContent = () => {
        switch(adminSection) {
            case 'teachers':
                return (
                    <div>
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-3xl font-bold text-gray-800">Gestión de Profesores</h3>
                            <button onClick={() => onEditTeacher('new')} className="bg-blue-600 border-b-4 border-blue-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500">
                                Agregar Profesor
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {teachers.map(teacher => (
                               <TeacherCard 
                                   key={teacher.id}
                                   teacher={teacher}
                                   grades={grades}
                                   subjects={subjects}
                                   onEdit={() => onEditTeacher(teacher)}
                                   onDelete={() => handleRemoveTeacher(teacher)}
                                />
                           ))}
                        </div>
                    </div>
                );
            case 'subjects':
                 return (
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-3xl font-bold text-gray-800 mb-4">Gestionar Materias</h3>
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); handleAddSubject(); }}>
                                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Nombre de la materia" className="flex-grow p-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                <button type="submit" className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-green-700 hover:bg-green-400 cursor-pointer transition-colors">Agregar</button>
                            </form>
                            <ul className="list-none p-0 m-0 flex flex-col gap-2">
                                {subjects.map(s => (
                                     <li key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                           <IconRenderer iconId={s.iconId} iconUrl={s.iconUrl} className="w-6 h-6 text-gray-700" />
                                           <span className="text-lg text-gray-900">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onEditSubjectIcon(s)} className="text-sm font-bold py-2 px-4 rounded-lg transition-colors text-violet-700 bg-violet-100 hover:bg-violet-200">Editar Ícono</button>
                                            <button onClick={() => handleRemoveSubject(s.id)} className="text-gray-600 hover:text-red-600"><XCircleIcon className="w-6 h-6" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                 );
            case 'questions':
                return (
                    <div className="max-w-4xl mx-auto">
                        <EditableQuestionList 
                            title="Preguntas de Primaria" 
                            questions={primaryQuestions} 
                            setQuestions={handleUpdateQuestions} 
                            level={EvaluationLevel.Primary}
                            requestConfirmDelete={(index) => requestDeleteQuestion(EvaluationLevel.Primary, index)}
                        />
                        <EditableQuestionList 
                            title="Preguntas de Bachillerato" 
                            questions={highSchoolQuestions} 
                            setQuestions={handleUpdateQuestions} 
                            level={EvaluationLevel.HighSchool} 
                            requestConfirmDelete={(index) => requestDeleteQuestion(EvaluationLevel.HighSchool, index)}
                        />
                    </div>
                );
             case 'assignments':
                return (
                    <AssignmentsManager
                        grades={grades}
                        setGrades={setGrades}
                        teachers={teachers}
                        subjects={subjects}
                    />
                );
            case 'main':
            default:
                return (
                    <div className="grid md:grid-cols-2 gap-6">
                        <AdminMenuCard title="Gestionar Profesores" onClick={() => setAdminSection('teachers')} />
                        <AdminMenuCard title="Gestionar Materias" onClick={() => setAdminSection('subjects')} />
                        <AdminMenuCard title="Gestionar Preguntas" onClick={() => setAdminSection('questions')} />
                        <AdminMenuCard title="Asignaciones por Grado" onClick={() => setAdminSection('assignments')} />
                    </div>
                );
        }
    }

    return (
        <div className="animate-fade flex flex-col gap-8">
            <div className="flex items-center">
                 {adminSection !== 'main' ? (
                     <button onClick={() => setAdminSection('main')} className="flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors mr-4">
                        <ArrowLeftIcon className="w-8 h-8 mr-2" />
                        Menú
                    </button>
                 ) : (
                    <button onClick={onBack} className="flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors mr-4">
                        <ArrowLeftIcon className="w-8 h-8 mr-2" />
                        Regresar
                    </button>
                 )}
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight m-0">Panel de Administración</h1>
            </div>
            {renderContent()}

            {confirmModalState.isOpen && (
                <ConfirmationModal
                    onClose={() => setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} })}
                    onConfirm={confirmModalState.onConfirm}
                    title="Confirmar Eliminación"
                    message={confirmModalState.message}
                />
            )}
        </div>
    );
};