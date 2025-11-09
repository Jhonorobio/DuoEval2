
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
    onSave: (data: { id: string | null; name: string; subjectIds: string[]; gradeIds: number[] }) => void;
}> = ({ teacherToEdit, allTeachers, allGrades, allSubjects, onClose, onSave }) => {
    const [name, setName] = useState(teacherToEdit?.name || '');
    const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    useEffect(() => {
        if (teacherToEdit) {
            const gradeIds: number[] = [];
            const subjectIds: string[] = [];
            allGrades.forEach(g => {
                g.assignments.forEach(a => {
                    if (a.teacherId === teacherToEdit.id) {
                        gradeIds.push(g.id);
                        subjectIds.push(a.subjectId);
                    }
                });
            });
            setSelectedGrades([...new Set(gradeIds)]);
            setSelectedSubjects([...new Set(subjectIds)]);
        }
    }, [teacherToEdit, allGrades]);

    const handleGradeToggle = (gradeId: number) => {
        setSelectedGrades(prev => 
            prev.includes(gradeId) ? prev.filter(id => id !== gradeId) : [...prev, gradeId]
        );
    };

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
        );
    };

    const handleSubmit = () => {
        if (name.trim() === '') {
            alert('El nombre del profesor no puede estar vacío.');
            return;
        }
        onSave({
            id: teacherToEdit?.id || null,
            name: name.trim(),
            gradeIds: selectedGrades,
            subjectIds: selectedSubjects
        });
    };

    const Checkbox: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
            <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5" />
            <span className="text-gray-800">{label}</span>
        </label>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full relative flex flex-col max-w-4xl max-h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-0">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4 tracking-tight">
                    {teacherToEdit ? 'Editar Profesor' : 'Agregar Profesor'}
                </h2>
                <div className="overflow-y-auto pr-2 flex-grow">
                    <div className="mb-6">
                        <label htmlFor="teacherName" className="block text-xl font-bold text-gray-800 mb-2">Nombre del Profesor</label>
                        <input id="teacherName" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="block text-xl font-bold text-gray-800 mb-2">Grados Asignados</h3>
                            <div className="p-4 border border-gray-200 rounded-lg h-64 overflow-y-auto flex flex-col gap-1">
                                {allGrades.map(g => <Checkbox key={g.id} label={g.name} checked={selectedGrades.includes(g.id)} onChange={() => handleGradeToggle(g.id)} />)}
                            </div>
                        </div>
                        <div>
                            <h3 className="block text-xl font-bold text-gray-800 mb-2">Materias Asignadas</h3>
                            <div className="p-4 border border-gray-200 rounded-lg h-64 overflow-y-auto flex flex-col gap-1">
                                {allSubjects.map(s => <Checkbox key={s.id} label={s.name} checked={selectedSubjects.includes(s.id)} onChange={() => handleSubjectToggle(s.id)} />)}
                            </div>
                        </div>
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
