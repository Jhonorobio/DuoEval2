

import React, { useState } from 'react';
import supabase from './supabaseClient';
import { Answer, Evaluation, EvaluationTarget, Grade, PrimaryRating, Teacher, Subject, TeachingAssignment } from './types';
import { useAppData } from './hooks/useAppData';
import { NameEntryView } from './routes/NameEntry';
import { GradeSelectionView } from './routes/GradeSelection';
import { DashboardView } from './routes/Dashboard';
import { StatisticsView } from './routes/Statistics';
import { CsvVisualizerView } from './routes/CsvVisualizer';
import { FinalCompletionView } from './routes/FinalCompletion';
import { AdminView } from './routes/Admin';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { StatisticsAuthModal } from './components/modals/StatisticsAuthModal';
import { OptionsMenuModal } from './components/modals/OptionsMenuModal';
import { AddEditTeacherModal } from './components/modals/AddEditTeacherModal';
import { SubjectIconModal } from './components/modals/SubjectIconModal';

export type View = 'nameEntry' | 'gradeSelection' | 'dashboard' | 'statistics' | 'finalCompletion' | 'csvVisualizer' | 'admin';

const App: React.FC = () => {
  const {
    grades, setGrades,
    teachers, setTeachers,
    subjects, setSubjects,
    primaryQuestions, setPrimaryQuestions,
    highSchoolQuestions, setHighSchoolQuestions,
    evaluations, setEvaluations,
    isGradeLockEnabled, setGradeLockEnabled,
    isTeacherFilterEnabled, setTeacherFilterEnabled,
    isLoading
  } = useAppData();

  const [view, setView] = useState<View>('nameEntry');
  const [studentName, setStudentName] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [currentEvaluationTarget, setCurrentEvaluationTarget] = useState<EvaluationTarget | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState<boolean>(false);
  const [evaluationToEdit, setEvaluationToEdit] = useState<Evaluation | null>(null);
  
  const [isGradeChangeAuthVisible, setGradeChangeAuthVisible] = useState<boolean>(false);
  const [isOptionsMenuVisible, setOptionsMenuVisible] = useState<boolean>(false);
  const [isOptionsAuthVisible, setOptionsAuthVisible] = useState<boolean>(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | 'new' | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const startEvaluation = (target: EvaluationTarget) => {
    setCurrentEvaluationTarget(target);
    setCurrentAnswers([]);
    setCurrentQuestionIndex(0);
    setShowCompletionMessage(false);
  };

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...currentAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setCurrentAnswers(newAnswers);
  };
  
  const nextQuestion = async () => {
    if (!currentEvaluationTarget || !selectedGrade) return;

    const questions = currentEvaluationTarget.grade.level === 'PRIMARY' ? primaryQuestions : highSchoolQuestions;
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      let finalAnswers = [...currentAnswers];
      const JHON_OROBIO_ID = 't1';
      const ESTADISTICA_ID = 's11';

      if (
        isTeacherFilterEnabled &&
        currentEvaluationTarget.teacher.id === JHON_OROBIO_ID
      ) {
        if (
          currentEvaluationTarget.grade.level === 'PRIMARY' &&
          currentEvaluationTarget.subject.id === ESTADISTICA_ID
        ) {
          finalAnswers = currentAnswers.map(answer =>
            answer === PrimaryRating.Never ? PrimaryRating.Sometimes : answer
          );
        } else if (currentEvaluationTarget.grade.level === 'HIGH_SCHOOL') {
          finalAnswers = currentAnswers.map(answer =>
            answer === 1 ? 3 : answer
          );
        }
      }
      
      if (evaluationToEdit) {
        const { data, error } = await supabase
          .from('evaluations')
          .update({ answers: finalAnswers })
          .eq('id', evaluationToEdit.id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating evaluation:", error);
          alert("Hubo un error al actualizar tu evaluación. Por favor, intenta de nuevo.");
          return;
        }

        setEvaluations(prevEvals => prevEvals.map(ev => 
          ev.id === evaluationToEdit.id ? { ...ev, answers: data.answers as Answer[] } : ev
        ));
        
        alert("Evaluación actualizada con éxito.");
        
        setCurrentEvaluationTarget(null);
        setEvaluationToEdit(null);
        setView('admin');

      } else {
        const evaluationData = {
          student_name: studentName,
          grade_id: currentEvaluationTarget.grade.id,
          teacher_id: currentEvaluationTarget.teacher.id,
          subject_id: currentEvaluationTarget.subject.id,
          answers: finalAnswers,
        };

        const { data, error } = await supabase.from('evaluations').insert([evaluationData]).select();

        if (error) {
          console.error("Error saving evaluation:", error);
          alert("Hubo un error al guardar tu evaluación. Por favor, intenta de nuevo.");
          return;
        }
        
        const newEvaluation: Evaluation = {
          id: data[0].id,
          studentName: data[0].student_name,
          gradeId: data[0].grade_id,
          teacherId: data[0].teacher_id,
          subjectId: data[0].subject_id,
          answers: data[0].answers as Answer[],
          timestamp: new Date(data[0].timestamp).getTime(),
        };
        
        const newEvaluations = [...evaluations, newEvaluation];
        setEvaluations(newEvaluations);
        setCurrentEvaluationTarget(null);

        const gradeDef = grades.find(g => g.id === selectedGrade.id);
        if (gradeDef) {
            const validAssignmentsForGrade = gradeDef.assignments.filter(assignment =>
                teachers.some(t => t.id === assignment.teacherId) &&
                subjects.some(s => s.id === assignment.subjectId)
            );
            const totalValidAssignments = validAssignmentsForGrade.length;

            if (totalValidAssignments > 0) {
                const studentEvaluationsInGrade = newEvaluations.filter(e => e.studentName === studentName && e.gradeId === selectedGrade.id);
                
                const completedCount = validAssignmentsForGrade.filter(assignment =>
                    studentEvaluationsInGrade.some(ev =>
                        ev.subjectId === assignment.subjectId && ev.teacherId === assignment.teacherId
                    )
                ).length;

                if (completedCount >= totalValidAssignments) {
                    setView('finalCompletion');
                } else {
                    setShowCompletionMessage(true);
                }
            } else {
                setView('finalCompletion');
            }
        } else {
            setShowCompletionMessage(true);
        }
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const resetToGradeSelection = () => {
    setSelectedGrade(null);
    setCurrentEvaluationTarget(null);
    setShowCompletionMessage(false);
    setView('gradeSelection');
  }

  const resetToNameEntry = () => {
    setStudentName('');
    setSelectedGrade(null);
    setCurrentEvaluationTarget(null);
    setShowCompletionMessage(false);
    setView('nameEntry');
  };

  const exitEvaluation = () => {
    const wasEditing = !!evaluationToEdit;
    setCurrentEvaluationTarget(null);
    setEvaluationToEdit(null);
    if (wasEditing) {
      setView('admin');
    }
  };

  const handleGradeChangeRequest = () => {
    if (isGradeLockEnabled) {
        setGradeChangeAuthVisible(true);
    } else {
        resetToGradeSelection();
    }
  };

  const handleToggleGradeLock = async () => {
      const newValue = !isGradeLockEnabled;
      const { error } = await supabase.from('settings').upsert({ key: 'grade_lock_enabled', value: newValue });
      if (error) console.error("Error updating setting:", error);
      else setGradeLockEnabled(newValue);
  };
  
  const handleToggleTeacherFilter = async () => {
      const newValue = !isTeacherFilterEnabled;
      const { error } = await supabase.from('settings').upsert({ key: 'teacher_filter_enabled', value: newValue });
      if (error) console.error("Error updating setting:", error);
      else setTeacherFilterEnabled(newValue);
  };

  const handleDeleteAllEvaluations = async () => {
    const { error } = await supabase
        .from('evaluations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (error) {
        console.error("Error deleting evaluations:", error);
        alert("Hubo un error al borrar los datos. Por favor, inténtalo de nuevo.");
    } else {
        setEvaluations([]);
        alert("Todos los datos de las evaluaciones han sido borrados con éxito.");
    }
  };
  
  const handleDeleteStudentEvaluations = async (studentNameToDelete: string) => {
    const { error } = await supabase.from('evaluations').delete().eq('student_name', studentNameToDelete);
    if (error) {
      console.error("Error deleting student evaluations:", error);
      alert(`Hubo un error al borrar las evaluaciones de ${studentNameToDelete}.`);
      throw error;
    }
    setEvaluations(prev => prev.filter(e => e.studentName !== studentNameToDelete));
    alert(`Todas las evaluaciones de ${studentNameToDelete} han sido borradas.`);
  };

  const handleStartEditEvaluation = (evaluation: Evaluation) => {
    const grade = grades.find(g => g.id === evaluation.gradeId);
    const teacher = teachers.find(t => t.id === evaluation.teacherId);
    const subject = subjects.find(s => s.id === evaluation.subjectId);
    if (!grade || !teacher || !subject) {
        alert("Error: No se pudieron cargar los datos de la evaluación para editar.");
        return;
    }
    setEvaluationToEdit(evaluation);
    setStudentName(evaluation.studentName);
    setSelectedGrade(grade);
    setCurrentEvaluationTarget({ grade, teacher, subject });
    setCurrentAnswers(evaluation.answers);
    setCurrentQuestionIndex(0);
    setShowCompletionMessage(false);
    setView('dashboard');
  };

  const handleSaveTeacher = async (formData: { id: string | null; name: string; assignments: Record<string, number[]> }) => {
      let teacherId = formData.id;
      
      try {
        if (formData.id) { 
            const { error } = await supabase.from('teachers').update({ name: formData.name }).eq('id', formData.id);
            if (error) throw error;
        } else { 
            teacherId = `t${Date.now()}`;
            const { error } = await supabase.from('teachers').insert({ id: teacherId!, name: formData.name });
            if (error) throw error;
        }

        const { error: deleteError } = await supabase.from('assignments').delete().eq('teacher_id', teacherId);
        if (deleteError) throw deleteError;

        const newAssignmentsToInsert = Object.entries(formData.assignments).flatMap(([subjectId, gradeIds]) => 
            gradeIds.map(gradeId => ({
                grade_id: gradeId,
                teacher_id: teacherId,
                subject_id: subjectId,
            }))
        );

        if (newAssignmentsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('assignments').insert(newAssignmentsToInsert);
            if (insertError) throw insertError;
        }

        if (formData.id) {
            setTeachers(prev => prev.map(t => t.id === formData.id ? { ...t, name: formData.name } : t));
        } else {
            setTeachers(prev => [...prev, { id: teacherId!, name: formData.name }]);
        }
        
        const newGrades = grades.map(grade => {
            const assignmentsWithoutTeacher = grade.assignments.filter(a => a.teacherId !== teacherId);
            const newAssignmentsForGrade: TeachingAssignment[] = [];
            Object.entries(formData.assignments).forEach(([subjectId, gradeIds]) => {
                if (gradeIds.includes(grade.id)) {
                    newAssignmentsForGrade.push({ teacherId: teacherId!, subjectId });
                }
            });
            return { ...grade, assignments: [...assignmentsWithoutTeacher, ...newAssignmentsForGrade] };
        });

        setGrades(newGrades);
        setTeacherToEdit(null);

      } catch (error: any) {
          console.error("Error saving teacher:", error);
          alert(`Hubo un error al guardar el profesor: ${error.message}`);
      }
  };

  const renderView = () => {
    switch (view) {
      case 'nameEntry':
        return <NameEntryView 
          studentName={studentName} 
          setStudentName={(name) => {
            setStudentName(name);
            setView('gradeSelection');
          }} 
          onShowOptions={() => setOptionsAuthVisible(true)}
        />;
      case 'gradeSelection':
        return <GradeSelectionView studentName={studentName} grades={grades} onSelectGrade={(grade) => {
          setSelectedGrade(grade);
          setView('dashboard');
        }} onBack={() => setView('nameEntry')} />;
      case 'dashboard':
        if (!selectedGrade) return null;
        return <DashboardView 
            studentName={studentName}
            grade={selectedGrade}
            evaluations={evaluations}
            onStartEvaluation={startEvaluation}
            showCompletionMessage={showCompletionMessage}
            onCompleteAnother={() => setShowCompletionMessage(false)}
            onChangeGrade={handleGradeChangeRequest}
            currentEvaluationTarget={currentEvaluationTarget}
            currentAnswers={currentAnswers}
            currentQuestionIndex={currentQuestionIndex}
            handleAnswer={handleAnswer}
            nextQuestion={nextQuestion}
            previousQuestion={previousQuestion}
            exitEvaluation={exitEvaluation}
            grades={grades}
            teachers={teachers}
            subjects={subjects}
            primaryQuestions={primaryQuestions}
            highSchoolQuestions={highSchoolQuestions}
        />;
      case 'statistics':
        return <StatisticsView 
            evaluations={evaluations} 
            onBack={() => setView('nameEntry')} 
            grades={grades}
            teachers={teachers}
            subjects={subjects}
            primaryQuestions={primaryQuestions}
            highSchoolQuestions={highSchoolQuestions}
            onDeleteAll={handleDeleteAllEvaluations}
            onNavigateToVisualizer={() => setView('csvVisualizer')}
        />;
      case 'csvVisualizer':
        return <CsvVisualizerView onBack={() => setView('nameEntry')} />;
      case 'finalCompletion':
        return <FinalCompletionView studentName={studentName} onExit={resetToNameEntry} />;
      case 'admin':
        return <AdminView 
            onBack={() => setView('nameEntry')}
            grades={grades}
            setGrades={setGrades}
            teachers={teachers}
            setTeachers={setTeachers}
            subjects={subjects}
            setSubjects={setSubjects}
            primaryQuestions={primaryQuestions}
            setPrimaryQuestions={setPrimaryQuestions}
            highSchoolQuestions={highSchoolQuestions}
            setHighSchoolQuestions={setHighSchoolQuestions}
            evaluations={evaluations}
            setEvaluations={setEvaluations}
            onEditSubjectIcon={setEditingSubject}
            onEditTeacher={setTeacherToEdit}
            onDeleteStudentEvaluations={handleDeleteStudentEvaluations}
            onStartEditEvaluation={handleStartEditEvaluation}
        />;
      default:
        return <div>Error</div>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-700 flex flex-col items-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        {renderView()}
      </div>
      {isOptionsAuthVisible && (
        <StatisticsAuthModal
          onClose={() => setOptionsAuthVisible(false)}
          onSuccess={() => {
            setOptionsAuthVisible(false);
            setOptionsMenuVisible(true);
          }}
          title="Acceso Restringido"
          message="Ingresa la contraseña para acceder a las opciones."
        />
      )}
      {isGradeChangeAuthVisible && (
        <StatisticsAuthModal
          onClose={() => setGradeChangeAuthVisible(false)}
          onSuccess={() => {
            setGradeChangeAuthVisible(false);
            resetToGradeSelection();
          }}
          title="Confirmar Acción"
          message="Ingresa la contraseña de administrador para cambiar de grado."
        />
      )}
      {isOptionsMenuVisible && (
          <OptionsMenuModal
              onClose={() => setOptionsMenuVisible(false)}
              onShowAdmin={() => {
                  setOptionsMenuVisible(false);
                  setView('admin');
              }}
              onShowCsvVisualizer={() => {
                  setOptionsMenuVisible(false);
                  setView('csvVisualizer');
              }}
              onShowStats={() => {
                  setOptionsMenuVisible(false);
                  setView('statistics');
              }}
              isGradeLockEnabled={isGradeLockEnabled}
              onToggleGradeLock={handleToggleGradeLock}
              isTeacherFilterEnabled={isTeacherFilterEnabled}
              onToggleTeacherFilter={handleToggleTeacherFilter}
          />
      )}
      {teacherToEdit && (
          <AddEditTeacherModal
              teacherToEdit={teacherToEdit === 'new' ? null : teacherToEdit}
              allTeachers={teachers}
              allGrades={grades}
              allSubjects={subjects}
              onClose={() => setTeacherToEdit(null)}
              onSave={handleSaveTeacher}
          />
      )}
      {editingSubject && (
          <SubjectIconModal
              subject={editingSubject}
              onClose={() => setEditingSubject(null)}
              onSave={async (subjectId, iconId) => {
                const { error } = await supabase.from('subjects').update({ iconId: iconId }).eq('id', subjectId);
                if (error) {
                    console.error("Error updating icon:", error);
                } else {
                    setSubjects(prev => prev.map(s => s.id === subjectId ? {...s, iconId} : s));
                }
              }}
          />
      )}
    </div>
  );
};

export default App;