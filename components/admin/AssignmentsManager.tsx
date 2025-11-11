import React, { useState, useMemo } from 'react';
import { Grade, Teacher, Subject } from '../../types';
import supabase from '../../supabaseClient';

interface AssignmentsManagerProps {
    grades: Grade[];
    setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
    teachers: Teacher[];
    subjects: Subject[];
}

export const AssignmentsManager: React.FC<AssignmentsManagerProps> = ({ grades, setGrades, teachers, subjects }) => {
    const sortedGrades = useMemo(() => [...grades].sort((a, b) => a.id - b.id), [grades]);
    const sortedSubjects = useMemo(() => [...subjects].sort((a, b) => a.name.localeCompare(b.name)), [subjects]);
    
    const [selectedGradeId, setSelectedGradeId] = useState<string>(sortedGrades[0]?.id.toString() ?? '');

    const handleAssignmentChange = async (subjectId: string, newTeacherId: string) => {
        const gradeId = parseInt(selectedGradeId, 10);
        const finalTeacherId = newTeacherId === '' ? null : newTeacherId;

        try {
            await supabase.from('assignments').delete().match({ grade_id: gradeId, subject_id: subjectId });

            if (finalTeacherId) {
                const { error: insertError } = await supabase.from('assignments').insert({ grade_id: gradeId, teacher_id: finalTeacherId, subject_id: subjectId });
                if (insertError) throw insertError;
            }

            setGrades(prevGrades => prevGrades.map(grade => {
                if (grade.id === gradeId) {
                    const otherAssignments = grade.assignments.filter(a => a.subjectId !== subjectId);
                    const newAssignments = finalTeacherId ? [...otherAssignments, { teacherId: finalTeacherId, subjectId }] : otherAssignments;
                    return { ...grade, assignments: newAssignments };
                }
                return grade;
            }));

        } catch (error: any) {
            console.error("Error updating assignment:", error);
            alert(`Hubo un error al actualizar la asignación: ${error.message}`);
        }
    };
    
    const getTeacherFor = (subjectId: string): string => {
        if (!selectedGradeId) return '';
        const gradeId = parseInt(selectedGradeId, 10);
        const grade = grades.find(g => g.id === gradeId);
        const assignment = grade?.assignments.find(a => a.subjectId === subjectId);
        return assignment?.teacherId || '';
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Asignaciones por Grado</h3>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="mb-6">
                    <label htmlFor="grade-select" className="text-xl font-bold text-gray-700 mr-3">Selecciona un Grado:</label>
                    <select id="grade-select" value={selectedGradeId} onChange={e => setSelectedGradeId(e.target.value)} className="p-3 text-lg border-2 border-gray-200 rounded-lg">
                        {sortedGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4 text-lg font-bold text-gray-800">Materia</th>
                                <th className="p-4 text-lg font-bold text-gray-800">Profesor Asignado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSubjects.map((subject, index) => (
                                <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="p-4 font-semibold text-gray-900">{subject.name}</td>
                                    <td className="p-4">
                                        <select
                                            value={getTeacherFor(subject.id)}
                                            onChange={e => handleAssignmentChange(subject.id, e.target.value)}
                                            className="w-full max-w-xs p-2 text-base border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            aria-label={`Profesor para ${subject.name}`}
                                        >
                                            <option value="">-- Sin Asignar --</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};