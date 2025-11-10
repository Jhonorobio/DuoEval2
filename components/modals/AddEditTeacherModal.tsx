import React, { useState, useEffect } from 'react';
import { Grade, Subject, Teacher } from '../../types';
import { XCircleIcon } from '../Icons';
import { BigButton } from '../ui/BigButton';

export const AddEditTeacherModal: React.FC<{
    teacherToEdit: Teacher | null;
    allTeachers: Teacher[];
    allGrades: Grade[];
    allSubjects: Subject[];
    onClose: () => void;
    onSave: (data: { id: string | null; name: string; assignments: Record<string, number[]> }) => void;
}> = ({ teacherToEdit, allGrades, allSubjects, onClose, onSave }) => {
    const [name, setName] = useState(teacherToEdit?.name || '');
    const [assignments, setAssignments] = useState<Record<string, number[]>>({});

    useEffect(() => {
        if (teacherToEdit) {
            const initialAssignments: Record<string, number[]> = {};
            allGrades.forEach(grade => {
                grade.assignments.forEach(assignment => {
                    if (assignment.teacherId === teacherToEdit.id) {
                        if (!initialAssignments[assignment.subjectId]) {
                            initialAssignments[assignment.subjectId] = [];
                        }
                        if (!initialAssignments[assignment.subjectId].includes(grade.id)) {
                           initialAssignments[assignment.subjectId].push(grade.id);
                        }
                    }
                });
            });
            setAssignments(initialAssignments);
        }
    }, [teacherToEdit, allGrades]);

    const handleAssignmentToggle = (subjectId: string, gradeId: number) => {
        setAssignments(prev => {
            const newAssignments = { ...prev };
            const gradesForSubject = newAssignments[subjectId] ? [...newAssignments[subjectId]] : [];
            
            const gradeIndex = gradesForSubject.indexOf(gradeId);
            if (gradeIndex > -1) {
                gradesForSubject.splice(gradeIndex, 1);
            } else {
                gradesForSubject.push(gradeId);
            }
    
            if (gradesForSubject.length === 0) {
                delete newAssignments[subjectId];
            } else {
                newAssignments[subjectId] = gradesForSubject;
            }
    
            return newAssignments;
        });
    };

    const handleSubmit = () => {
        if (name.trim() === '') {
            alert('El nombre del profesor no puede estar vacío.');
            return;
        }
        onSave({
            id: teacherToEdit?.id || null,
            name: name.trim(),
            assignments: assignments,
        });
    };
    
    const sortedGrades = [...allGrades].sort((a,b) => a.id - b.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full relative flex flex-col max-w-4xl max-h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-0">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 tracking-tight">
                    {teacherToEdit ? 'Editar Profesor' : 'Agregar Profesor'}
                </h2>
                <div className="mb-6">
                    <label htmlFor="teacherName" className="block text-xl font-bold text-gray-800 mb-2">Nombre del Profesor</label>
                    <input id="teacherName" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full max-w-md p-3 text-lg border-2 border-gray-200 rounded-lg" />
                </div>
                <div className="flex-grow overflow-auto pr-2">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Asignar Materias y Grados</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allSubjects.map(subject => (
                            <div key={subject.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-lg text-gray-900 mb-3">{subject.name}</h4>
                                <div className="flex flex-col gap-2">
                                    {sortedGrades.map(grade => (
                                        <label key={grade.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                checked={(assignments[subject.id] || []).includes(grade.id)}
                                                onChange={() => handleAssignmentToggle(subject.id, grade.id)}
                                            />
                                            <span className="text-gray-800">{grade.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <BigButton onClick={handleSubmit} className="bg-blue-600 border-blue-800 !w-auto !py-3 !px-8 !text-base">
                        Guardar Cambios
                    </BigButton>
                </div>
            </div>
        </div>
    );
};