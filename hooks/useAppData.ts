

import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { Grade, Teacher, Subject, Evaluation, TeachingAssignment, Answer, EvaluationLevel, RolPregunta, EvaluacionRol, RolEvaluacion } from '../types';

export const useAppData = () => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [primaryQuestions, setPrimaryQuestions] = useState<string[]>([]);
    const [highSchoolQuestions, setHighSchoolQuestions] = useState<string[]>([]);
    const [roleQuestions, setRoleQuestions] = useState<RolPregunta[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [evaluacionesRol, setEvaluacionesRol] = useState<EvaluacionRol[]>([]);
    const [isGradeLockEnabled, setGradeLockEnabled] = useState<boolean>(false);
    const [isTeacherFilterEnabled, setTeacherFilterEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [
                    gradesRes,
                    teachersRes,
                    subjectsRes,
                    questionsRes,
                    settingsRes,
                    evaluationsRes,
                    rolesRes,
                    evaluacionesRolRes
                ] = await Promise.all([
                    supabase.from('grades').select('*, assignments(*)'),
                    supabase.from('teachers').select('*'),
                    supabase.from('subjects').select('*'),
                    supabase.from('questions').select('*').order('order'),
                    supabase.from('settings').select('*'),
                    supabase.from('evaluations').select('*'),
                    supabase.from('questions_rol').select('*').order('order'),
                    supabase.from('evaluaciones_rol').select('*')
                ]);

                if (gradesRes.error) throw new Error(`Error fetching grades: ${gradesRes.error.message}`);
                if (teachersRes.error) throw new Error(`Error fetching teachers: ${teachersRes.error.message}`);
                if (subjectsRes.error) throw new Error(`Error fetching subjects: ${subjectsRes.error.message}`);
                if (questionsRes.error) throw new Error(`Error fetching questions: ${questionsRes.error.message}`);
                if (settingsRes.error) throw new Error(`Error fetching settings: ${settingsRes.error.message}`);
                if (evaluationsRes.error) throw new Error(`Error fetching evaluations: ${evaluationsRes.error.message}`);
                if (rolesRes.error) throw new Error(`Error fetching role questions: ${rolesRes.error.message}`);
                if (evaluacionesRolRes.error) throw new Error(`Error fetching role evaluations: ${evaluacionesRolRes.error.message}`);
                
                let dbGrades = gradesRes.data;
                // Ensure Preschool grade exists in the DB, otherwise creating assignments for it will fail.
                if (!dbGrades.some(g => g.id === 0)) {
                    const { data: newGrade, error: insertError } = await supabase
                        .from('grades')
                        .insert({ id: 0, name: '0°', level: 'PRIMARY' })
                        .select('*, assignments(*)')
                        .single();
                    if (insertError) {
                        console.error("CRITICAL: Failed to create Preschool grade in DB. Assignments to this grade will fail.", insertError);
                    } else if (newGrade) {
                        dbGrades.push(newGrade as any);
                    }
                }

                const gradesData: Grade[] = dbGrades.map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    level: g.level as EvaluationLevel,
                    assignments: g.assignments.map((a: any) => ({
                        teacherId: a.teacher_id,
                        subjectId: a.subject_id,
                    } as TeachingAssignment))
                })).sort((a, b) => a.id - b.id);

                setGrades(gradesData);
                setTeachers(teachersRes.data);
                setSubjects(subjectsRes.data);
                setPrimaryQuestions(questionsRes.data.filter(q => q.level === 'PRIMARY').map(q => q.text));
                setHighSchoolQuestions(questionsRes.data.filter(q => q.level === 'HIGH_SCHOOL').map(q => q.text));
                setRoleQuestions((rolesRes.data || []).map((q: any) => ({
                    id: q.id,
                    order: q.order,
                    role: q.role as RolEvaluacion,
                    text: q.text,
                })));

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

                const fetchedEvaluacionesRol: EvaluacionRol[] = evaluacionesRolRes.data.map((e: any) => ({
                    id: e.id,
                    studentName: e.student_name,
                    role: e.role as RolEvaluacion,
                    answers: e.answers as Answer[],
                    timestamp: new Date(e.timestamp).getTime(),
                }));
                setEvaluacionesRol(fetchedEvaluacionesRol);

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
        roleQuestions, setRoleQuestions,
        evaluacionesRol, setEvaluacionesRol,
        isLoading
    };
};
