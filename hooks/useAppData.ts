
import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { Grade, Teacher, Subject, Evaluation, TeachingAssignment, Answer } from '../types';

export const useAppData = () => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [primaryQuestions, setPrimaryQuestions] = useState<string[]>([]);
    const [highSchoolQuestions, setHighSchoolQuestions] = useState<string[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isGradeLockEnabled, setGradeLockEnabled] = useState<boolean>(false);
    const [isTeacherFilterEnabled, setTeacherFilterEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [
                    gradesRes,
                    assignmentsRes,
                    teachersRes,
                    subjectsRes,
                    questionsRes,
                    settingsRes,
                    evaluationsRes
                ] = await Promise.all([
                    supabase.from('grades').select('*'),
                    supabase.from('assignments').select('*'),
                    supabase.from('teachers').select('*'),
                    supabase.from('subjects').select('*'),
                    supabase.from('questions').select('*').order('order'),
                    supabase.from('settings').select('*'),
                    supabase.from('evaluations').select('*')
                ]);

                if (gradesRes.error || assignmentsRes.error || teachersRes.error || subjectsRes.error || questionsRes.error || settingsRes.error || evaluationsRes.error) {
                    throw new Error('Failed to fetch data');
                }
                
                const assignmentsData: TeachingAssignment[] = assignmentsRes.data.map((a: any) => ({
                    teacherId: a.teacher_id,
                    subjectId: a.subject_id,
                    gradeId: a.grade_id,
                }));

                const gradesData: Grade[] = gradesRes.data.map((g: any) => ({
                    ...g,
                    assignments: assignmentsData.filter(a => (a as any).gradeId === g.id)
                }));

                setGrades(gradesData);
                setTeachers(teachersRes.data);
                setSubjects(subjectsRes.data);
                setPrimaryQuestions(questionsRes.data.filter(q => q.level === 'PRIMARY').map(q => q.text));
                setHighSchoolQuestions(questionsRes.data.filter(q => q.level === 'HIGH_SCHOOL').map(q => q.text));

                const settingsMap = new Map(settingsRes.data.map(s => [s.key, s.value]));
                setGradeLockEnabled(settingsMap.get('grade_lock_enabled') === true);
                setTeacherFilterEnabled(settingsMap.get('teacher_filter_enabled') === true);

                const fetchedEvaluations: Evaluation[] = evaluationsRes.data.map((e: any) => ({
                    id: e.id,
                    studentName: e.student_name,
                    gradeId: e.grade_id,
                    teacherId: e.teacher_id,
                    subjectId: e.subject_id,
                    answers: e.answers as Answer[],
                    timestamp: new Date(e.timestamp).getTime(),
                }));
                setEvaluations(fetchedEvaluations);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return {
        grades, setGrades,
        teachers, setTeachers,
        subjects, setSubjects,
        primaryQuestions, setPrimaryQuestions,
        highSchoolQuestions, setHighSchoolQuestions,
        evaluations, setEvaluations,
        isGradeLockEnabled, setGradeLockEnabled,
        isTeacherFilterEnabled, setTeacherFilterEnabled,
        isLoading
    };
};
