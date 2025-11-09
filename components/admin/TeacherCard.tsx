
import React, { useMemo } from 'react';
import { Grade, Subject, Teacher } from '../../types';
import { UserCircleIcon } from '../Icons';

export const TeacherCard: React.FC<{
    teacher: Teacher;
    grades: Grade[];
    subjects: Subject[];
    onEdit: () => void;
    onDelete: () => void;
}> = ({ teacher, grades, subjects, onEdit, onDelete }) => {
    const assignments = useMemo(() => {
        const teacherSubjects = new Map<string, string>();
        const teacherGrades = new Set<string>();
        grades.forEach(grade => {
            grade.assignments.forEach(assignment => {
                if (assignment.teacherId === teacher.id) {
                    const subject = subjects.find(s => s.id === assignment.subjectId);
                    if (subject) { teacherSubjects.set(subject.id, subject.name); }
                    teacherGrades.add(grade.name);
                }
            });
        });
        return {
            subjects: Array.from(teacherSubjects.values()),
            grades: Array.from(teacherGrades)
        };
    }, [teacher, grades, subjects]);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col">
            <div className="flex items-start gap-4 flex-grow">
                <div className="bg-gray-100 rounded-full p-3 flex-shrink-0 mt-1">
                    <UserCircleIcon className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                    <h4 className="text-2xl font-extrabold text-gray-900 m-0">{teacher.name}</h4>
                    <div className="mt-2 flex flex-col gap-2">
                        <div>
                             <h5 className="text-sm font-bold text-gray-600 m-0">Materias</h5>
                             <div className="flex flex-wrap gap-1.5 mt-1">
                                {assignments.subjects.length > 0 ? assignments.subjects.map(s => <span key={s} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">{s}</span>) : <span className="text-xs text-gray-400">Ninguna</span>}
                             </div>
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-gray-600 m-0">Grados</h5>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {assignments.grades.length > 0 ? assignments.grades.map(g => <span key={g} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{g}</span>) : <span className="text-xs text-gray-400">Ninguno</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={onEdit} className="text-sm font-bold py-2 px-4 rounded-lg transition-colors text-blue-600 bg-blue-100 hover:bg-blue-200">Editar</button>
                <button onClick={onDelete} className="text-sm font-bold py-2 px-4 rounded-lg transition-colors text-red-600 bg-red-100 hover:bg-red-200">Quitar</button>
            </div>
        </div>
    );
};
