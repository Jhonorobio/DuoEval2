import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Evaluation, Grade, Teacher, Subject, Answer, EvaluationLevel, PrimaryRating } from '../types';
import { PRIMARY_RATING_OPTIONS } from '../constants';
import { downloadCSV } from '../utils/csv';
import { ArrowLeftIcon, XCircleIcon, DownloadIcon, UploadCloudIcon } from '../components/Icons';
import { Section } from '../components/ui/Section';
import { ChartTooltipWithFullQuestion } from '../components/ui/ChartTooltip';
import { StatisticsAuthModal } from '../components/modals/StatisticsAuthModal';

interface StatisticsViewProps { 
    evaluations: Evaluation[]; 
    onBack: () => void;
    grades: Grade[];
    teachers: Teacher[];
    subjects: Subject[];
    primaryQuestions: string[];
    highSchoolQuestions: string[];
    onDeleteAll: () => Promise<void>;
    onNavigateToVisualizer: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ evaluations, onBack, grades, teachers, subjects, primaryQuestions, highSchoolQuestions, onDeleteAll, onNavigateToVisualizer }) => {
  const [activeGeneralTab, setActiveGeneralTab] = useState<'primary' | 'highSchool'>('primary');
  const [selectedTeacherForAnalysis, setSelectedTeacherForAnalysis] = useState<string>('');
  const [selectedGradeForStudent, setSelectedGradeForStudent] = useState<string>('');
  const [selectedTeacherForStudent, setSelectedTeacherForStudent] = useState<string>('');
  const [teacherChartType, setTeacherChartType] = useState<'bar' | 'radar'>('bar');
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [teacherAnalysisTab, setTeacherAnalysisTab] = useState<'primary' | 'highSchool'>('primary');

  const teachersInSelectedGrade = useMemo(() => {
    if (!selectedGradeForStudent) return [];
    const grade = grades.find(g => g.id.toString() === selectedGradeForStudent);
    if (!grade) return [];
    const teacherIdsInGrade = [...new Set(grade.assignments.map(a => a.teacherId))];
    return teachers.filter(t => teacherIdsInGrade.includes(t.id));
  }, [selectedGradeForStudent, teachers, grades]);

  useEffect(() => {
    setSelectedTeacherForStudent('');
  }, [selectedGradeForStudent]);

  const getScore = (answer: Answer, isPrimary: boolean): number => {
    if (isPrimary) {
        if (answer === PrimaryRating.Never) return 1;
        if (answer === PrimaryRating.Sometimes) return 2;
        if (answer === PrimaryRating.Always) return 3;
        return 0;
    }
    return typeof answer === 'number' ? answer : 0;
  }
  
  const { primaryGeneralData, highSchoolGeneralData } = useMemo(() => {
    const teacherStats: Record<string, {
        totalScore: number;
        totalAnswers: number;
        surveyCount: number;
        levels: Set<EvaluationLevel>;
        name: string;
    }> = {};

    teachers.forEach(t => {
        teacherStats[t.id] = { totalScore: 0, totalAnswers: 0, surveyCount: 0, levels: new Set(), name: t.name };
    });

    evaluations.forEach(evaluation => {
        const grade = grades.find(g => g.id === evaluation.gradeId);
        if (!grade || !teacherStats[evaluation.teacherId]) return;

        const isPrimary = grade.level === EvaluationLevel.Primary;
        const stats = teacherStats[evaluation.teacherId];
        stats.levels.add(grade.level);
        stats.surveyCount++;

        evaluation.answers.forEach(answer => {
            const score = getScore(answer, isPrimary);
            if (score > 0) {
                stats.totalScore += score;
                stats.totalAnswers++;
            }
        });
    });

    const primaryData: any[] = [];
    const highSchoolData: any[] = [];

    Object.values(teacherStats).forEach(stats => {
        if (stats.surveyCount > 0) {
            const avgScore = stats.totalAnswers > 0 ? parseFloat((stats.totalScore / stats.totalAnswers).toFixed(2)) : 0;
            const chartEntry = {
                name: stats.name,
                'Calificación Promedio': avgScore,
                'Total de Encuestas': stats.surveyCount,
            };
            if (stats.levels.has(EvaluationLevel.Primary)) {
                primaryData.push(chartEntry);
            }
            if (stats.levels.has(EvaluationLevel.HighSchool)) {
                highSchoolData.push(chartEntry);
            }
        }
    });

    return { primaryGeneralData: primaryData, highSchoolGeneralData: highSchoolData };
  }, [evaluations, teachers, grades]);

  const teacherLevels = useMemo(() => {
    const levels = new Set<EvaluationLevel>();
    if (!selectedTeacherForAnalysis) return levels;

    evaluations.forEach(e => {
        if (e.teacherId === selectedTeacherForAnalysis) {
            const grade = grades.find(g => g.id === e.gradeId);
            if (grade) levels.add(grade.level as EvaluationLevel);
        }
    });
    return levels;
  }, [selectedTeacherForAnalysis, evaluations, grades]);

  useEffect(() => {
    if (teacherLevels.has(EvaluationLevel.Primary)) {
      setTeacherAnalysisTab('primary');
    } else if (teacherLevels.has(EvaluationLevel.HighSchool)) {
      setTeacherAnalysisTab('highSchool');
    }
  }, [teacherLevels]);

  const teacherAnalysisData = useMemo(() => {
    if (!selectedTeacherForAnalysis) return [];
    
    const isPrimary = teacherAnalysisTab === 'primary';
    const targetLevel = isPrimary ? EvaluationLevel.Primary : EvaluationLevel.HighSchool;
    
    const filteredEvals = evaluations.filter(e => {
        if (e.teacherId !== selectedTeacherForAnalysis) return false;
        const grade = grades.find(g => g.id === e.gradeId);
        return grade?.level === targetLevel;
    });

    if (filteredEvals.length === 0) return [];

    const questions = isPrimary ? primaryQuestions : highSchoolQuestions;
    
    return questions.map((q, index) => {
      const scores = filteredEvals.map(e => getScore(e.answers[index], isPrimary)).filter(score => score > 0);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
      return {
        question: `Q${index + 1}`,
        score: parseFloat(averageScore.toFixed(2)),
        fullQuestion: q,
      };
    });
  }, [evaluations, selectedTeacherForAnalysis, primaryQuestions, highSchoolQuestions, grades, teacherAnalysisTab]);
  
  const studentAnalysisData = useMemo(() => {
    if (!selectedGradeForStudent || !selectedTeacherForStudent) return [];
    return evaluations.filter(e => 
        e.gradeId.toString() === selectedGradeForStudent && 
        e.teacherId === selectedTeacherForStudent
    );
  }, [evaluations, selectedGradeForStudent, selectedTeacherForStudent]);
  
  const formatAnswer = (answer: Answer, isPrimary: boolean): string | number => {
      if (isPrimary) {
          return PRIMARY_RATING_OPTIONS.find(o => o.value === answer)?.label || '-';
      }
      return answer;
  }

  const gradeForStudentAnalysis = grades.find(g => g.id.toString() === selectedGradeForStudent);

  const handleExportPrimaryGeneral = () => {
    const formattedData = primaryGeneralData.map(item => ({
        'Profesor': item.name,
        'Calificación Promedio': item['Calificación Promedio'],
        'Total de Encuestas': item['Total de Encuestas']
    }));
    downloadCSV(formattedData, 'calificacion_general_primaria.csv');
  };

  const handleExportHighSchoolGeneral = () => {
      const formattedData = highSchoolGeneralData.map(item => ({
          'Profesor': item.name,
          'Calificación Promedio': item['Calificación Promedio'],
          'Total de Encuestas': item['Total de Encuestas']
      }));
      downloadCSV(formattedData, 'calificacion_general_bachillerato.csv');
  };

  const handleExportTeacherAnalysis = () => {
      if (!selectedTeacherForAnalysis) return;
      const teacherName = teachers.find(t => t.id === selectedTeacherForAnalysis)?.name || 'desconocido';
      const level = teacherAnalysisTab === 'primary' ? 'primaria' : 'bachillerato';

      const formattedData = teacherAnalysisData.map((item) => ({
          'Pregunta': item.fullQuestion,
          'Puntaje Promedio': item.score,
      }));

      downloadCSV(formattedData, `analisis_${level}_profesor_${teacherName.replace(/\s+/g, '_')}.csv`);
  };

  const handleExportStudentAnalysis = () => {
      if (!gradeForStudentAnalysis || !selectedTeacherForStudent) return;
      const teacherName = teachers.find(t => t.id === selectedTeacherForStudent)?.name || 'desconocido';
      const gradeName = gradeForStudentAnalysis.name;
      const isPrimary = gradeForStudentAnalysis.level === EvaluationLevel.Primary;
      const questions = isPrimary ? primaryQuestions : highSchoolQuestions;

      const formattedData = studentAnalysisData.map(evalItem => {
          const subject = subjects.find(s => s.id === evalItem.subjectId);
          const subjectName = subject ? subject.name : '';
          const row: Record<string, any> = { 'ESTUDIANTE (MATERIA)': `${evalItem.studentName} (${subjectName})` };
          evalItem.answers.forEach((ans, index) => {
              row[questions[index] || `PREGUNTA ${index + 1}`] = formatAnswer(ans, isPrimary);
          });
          return row;
      });

      downloadCSV(formattedData, `respuestas_estudiantes_${gradeName.replace(/\s+/g, '_')}_${teacherName.replace(/\s+/g, '_')}.csv`);
  };

  const handleExportAllData = () => {
    const allData: any[] = [];

    evaluations.forEach(evaluation => {
        const grade = grades.find(g => g.id === evaluation.gradeId);
        const teacher = teachers.find(t => t.id === evaluation.teacherId);
        const subject = subjects.find(s => s.id === evaluation.subjectId);

        if (!grade || !teacher || !subject) return;

        const isPrimary = grade.level === EvaluationLevel.Primary;
        const questions = isPrimary ? primaryQuestions : highSchoolQuestions;

        evaluation.answers.forEach((answer, index) => {
            allData.push({
                'ID Evaluación': evaluation.id,
                'Estudiante': evaluation.studentName,
                'Grado': grade.name,
                'Profesor': teacher.name,
                'Materia': subject.name,
                'Nivel': grade.level,
                'Fecha': new Date(evaluation.timestamp).toLocaleString(),
                'Nº Pregunta': index + 1,
                'Pregunta': questions[index] || 'N/A',
                'Respuesta': formatAnswer(answer, isPrimary),
                'Puntaje': getScore(answer, isPrimary),
            });
        });
    });

    if (allData.length > 0) {
        downloadCSV(allData, 'estadisticas_completas_evaluacion.csv');
    } else {
        alert('No hay datos para exportar.');
    }
  };

  const renderTeacherChart = (isPrimary: boolean) => {
    const maxScore = isPrimary ? 3 : 4;
    const barColor = isPrimary ? "#82ca9d" : "#8884d8";
    const radarStroke = isPrimary ? "#34d399" : "#a78bfa";
    const radarFill = isPrimary ? "#a7f3d0" : "#d8b4fe";

    return (
        <div className="mt-6">
            {teacherChartType === 'bar' ? (
                <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teacherAnalysisData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="question" />
                            <YAxis domain={[0, maxScore]} />
                            <Tooltip content={<ChartTooltipWithFullQuestion />} />
                            <Legend />
                            <Bar dataKey="score" fill={barColor} name={`Puntaje Promedio`} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teacherAnalysisData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="question" />
                            <PolarRadiusAxis angle={30} domain={[0, maxScore]} />
                            <Radar name="Puntaje Promedio" dataKey="score" stroke={radarStroke} fill={radarFill} fillOpacity={0.6} />
                            <Tooltip content={<ChartTooltipWithFullQuestion />} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

  if (evaluations.length === 0) {
    return (
        <div className="animate-fade">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors mr-4">
                    <ArrowLeftIcon className="w-8 h-8 mr-2"/>
                    Regresar
                </button>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight m-0">Estadísticas de Evaluación</h1>
            </div>
            <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-100">
              <p className="text-2xl text-gray-500 m-0">Aún no hay datos para mostrar.</p>
              <p className="text-lg text-gray-400 mt-2">Completa algunas evaluaciones para ver las estadísticas.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="animate-fade flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
            <button onClick={onBack} className="flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors mr-4">
                <ArrowLeftIcon className="w-8 h-8 mr-2" />
                Regresar
            </button>
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight m-0">Estadísticas</h1>
        </div>
        {evaluations.length > 0 && (
            <div className="flex items-center gap-2">
                 <button 
                    onClick={onNavigateToVisualizer}
                    className="flex items-center text-sm font-bold py-2 px-4 rounded-lg transition-colors text-purple-700 bg-purple-100 hover:bg-purple-200"
                >
                    <UploadCloudIcon className="w-5 h-5 mr-2" />
                    Visualizar CSV
                </button>
                <button 
                    onClick={handleExportAllData}
                    className="flex items-center text-sm font-bold py-2 px-4 rounded-lg transition-colors text-sky-700 bg-sky-100 hover:bg-sky-200"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Descargar Todo
                </button>
                <button 
                    onClick={() => setDeleteConfirmVisible(true)}
                    className="flex items-center text-sm font-bold py-2 px-4 rounded-lg transition-colors text-red-600 bg-red-100 hover:bg-red-200"
                >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Borrar Todos los Datos
                </button>
            </div>
        )}
      </div>

      <Section 
        title="Calificación General" 
        onExport={activeGeneralTab === 'primary' ? handleExportPrimaryGeneral : handleExportHighSchoolGeneral}
      >
        <div className="flex border-b border-gray-200 mb-4">
            <button
                onClick={() => setActiveGeneralTab('primary')}
                className={`py-3 px-6 text-xl font-bold transition-colors duration-200 outline-none ${
                    activeGeneralTab === 'primary'
                        ? 'border-b-4 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                Primaria
            </button>
            <button
                onClick={() => setActiveGeneralTab('highSchool')}
                className={`py-3 px-6 text-xl font-bold transition-colors duration-200 outline-none ${
                    activeGeneralTab === 'highSchool'
                        ? 'border-b-4 border-purple-500 text-purple-600'
                        : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                Bachillerato
            </button>
        </div>

        {activeGeneralTab === 'primary' && (
            <div className="animate-fade">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={primaryGeneralData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" domain={[0, 3]} ticks={[0,1,2,3]} label={{ value: 'Promedio', angle: -90, position: 'insideLeft' }}/>
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" dataKey="Total de Encuestas" allowDecimals={false} label={{ value: 'Encuestas', angle: 90, position: 'insideRight' }}/>
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Calificación Promedio" fill="#3b82f6" />
                        <Bar yAxisId="right" dataKey="Total de Encuestas" fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}

        {activeGeneralTab === 'highSchool' && (
            <div className="animate-fade">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={highSchoolGeneralData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                        <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" domain={[0, 4]} ticks={[0,1,2,3,4]} label={{ value: 'Promedio', angle: -90, position: 'insideLeft' }}/>
                        <YAxis yAxisId="right" orientation="right" stroke="#ec4899" dataKey="Total de Encuestas" allowDecimals={false} label={{ value: 'Encuestas', angle: 90, position: 'insideRight' }}/>
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Calificación Promedio" fill="#8b5cf6" />
                        <Bar yAxisId="right" dataKey="Total de Encuestas" fill="#ec4899" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}
      </Section>
      
      <Section title="Análisis por Profesor" onExport={selectedTeacherForAnalysis ? handleExportTeacherAnalysis : undefined}>
          <div className="flex flex-col gap-4">
            <select value={selectedTeacherForAnalysis} onChange={e => setSelectedTeacherForAnalysis(e.target.value)} className="w-full max-w-md p-3 text-lg border-2 border-gray-200 rounded-lg">
                <option value="">-- Selecciona un Profesor --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
             {selectedTeacherForAnalysis && teacherAnalysisData.length > 0 && (
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start">
                    <button onClick={() => setTeacherChartType('bar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${teacherChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                        Barras
                    </button>
                    <button onClick={() => setTeacherChartType('radar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${teacherChartType === 'radar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                        Radial
                    </button>
                </div>
            )}
          </div>
          {selectedTeacherForAnalysis && teacherAnalysisData.length > 0 && (
              <>
                 {teacherLevels.size > 1 && (
                    <div className="flex border-b border-gray-200 mt-4">
                        <button
                            onClick={() => setTeacherAnalysisTab('primary')}
                            className={`py-2 px-4 text-lg font-bold transition-colors duration-200 outline-none ${
                                teacherAnalysisTab === 'primary' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Análisis Primaria
                        </button>
                        <button
                            onClick={() => setTeacherAnalysisTab('highSchool')}
                             className={`py-2 px-4 text-lg font-bold transition-colors duration-200 outline-none ${
                                teacherAnalysisTab === 'highSchool' ? 'border-b-4 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Análisis Bachillerato
                        </button>
                    </div>
                )}

                {teacherAnalysisTab === 'primary' && renderTeacherChart(true)}
                {teacherAnalysisTab === 'highSchool' && renderTeacherChart(false)}
              </>
          )}
          {selectedTeacherForAnalysis && teacherAnalysisData.length === 0 && teacherLevels.size > 0 && (
             <p className="text-center text-gray-500 mt-4">No hay datos para este profesor en el nivel de {teacherAnalysisTab === 'primary' ? 'Primaria' : 'Bachillerato'}.</p>
          )}
          {selectedTeacherForAnalysis && teacherLevels.size === 0 && (
            <p className="text-center text-gray-500 mt-4">No hay datos de evaluación para este profesor.</p>
          )}
      </Section>

      <Section title="Análisis Detallado por Estudiante" onExport={studentAnalysisData.length > 0 ? handleExportStudentAnalysis : undefined}>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
              <select value={selectedGradeForStudent} onChange={e => setSelectedGradeForStudent(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg">
                  <option value="">-- Selecciona un Grado --</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select value={selectedTeacherForStudent} onChange={e => setSelectedTeacherForStudent(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg" disabled={!selectedGradeForStudent}>
                  <option value="">-- Selecciona un Profesor --</option>
                  {teachersInSelectedGrade.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
          </div>
          {studentAnalysisData.length > 0 && gradeForStudentAnalysis ? (
            <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
                <table className="w-full text-left text-gray-600">
                    <thead className="bg-gray-100 text-sm text-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3">ESTUDIANTE (MATERIA)</th>
                            {(gradeForStudentAnalysis.level === EvaluationLevel.Primary ? primaryQuestions : highSchoolQuestions)
                                .map((_, index) => <th key={index} scope="col" className="text-center px-4 py-3">Q{index+1}</th>)
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {studentAnalysisData.map(evalItem => {
                            const subject = subjects.find(s => s.id === evalItem.subjectId);
                            const subjectName = subject ? subject.name : 'N/A';
                            return (
                                <tr key={evalItem.id} className="bg-white border-b hover:bg-gray-50">
                                    <th scope="row" className="font-bold text-gray-900 whitespace-nowrap px-6 py-4">
                                        {evalItem.studentName} ({subjectName})
                                    </th>
                                    {evalItem.answers.map((ans, index) => (
                                        <td key={index} className="text-center px-4 py-4">
                                            {formatAnswer(ans, gradeForStudentAnalysis.level === EvaluationLevel.Primary)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-4">
              Selecciona un grado y profesor para ver las respuestas de los estudiantes.
            </p>
          )}
      </Section>
      {isDeleteConfirmVisible && (
        <StatisticsAuthModal
            onClose={() => setDeleteConfirmVisible(false)}
            onSuccess={async () => {
                await onDeleteAll();
                setDeleteConfirmVisible(false);
            }}
            title="Confirmar Eliminación"
            message="Esta acción es irreversible y borrará TODOS los datos de las evaluaciones. Ingresa la contraseña para confirmar."
        />
      )}
    </div>
  );
};