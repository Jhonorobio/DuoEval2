import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowLeftIcon, UploadCloudIcon } from '../components/Icons';
import { Section } from '../components/ui/Section';
import { ChartTooltipWithFullQuestion } from '../components/ui/ChartTooltip';

// Fix: Use a generic API key error message.
const API_KEY_ERROR_MESSAGE = 'La clave API de Google no está configurada.';

export const CsvVisualizerView: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const [dataType, setDataType] = useState<'general' | 'teacher' | 'student' | 'comprehensive' | 'unknown' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // State for teacher view
    const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
    const [teacherViewLevel, setTeacherViewLevel] = useState<'Primaria' | 'Bachillerato'>('Primaria');

    // State for general view tab
    const [visualizerGeneralTab, setVisualizerGeneralTab] = useState<'primary' | 'highSchool'>('primary');

    // State for comprehensive view filters
    const [comprehensiveTeacher, setComprehensiveTeacher] = useState<string>('');
    const [comprehensiveTeacherLevel, setComprehensiveTeacherLevel] = useState<'PRIMARY' | 'HIGH_SCHOOL'>('PRIMARY');
    const [comprehensiveChartType, setComprehensiveChartType] = useState<'bar' | 'radar'>('bar');
    const [comprehensiveGrade, setComprehensiveGrade] = useState<string>('');
    const [comprehensiveTeacherForStudent, setComprehensiveTeacherForStudent] = useState<string>('');
    
    // State for AI Summaries
    const [generalAiSummary, setGeneralAiSummary] = useState<string | null>(null);
    const [isGeneratingGeneralSummary, setIsGeneratingGeneralSummary] = useState(false);
    const [generalSummaryError, setGeneralSummaryError] = useState<string | null>(null);
    const [teacherAiSummary, setTeacherAiSummary] = useState<string | null>(null);
    const [isGeneratingTeacherSummary, setIsGeneratingTeacherSummary] = useState(false);
    const [teacherSummaryError, setTeacherSummaryError] = useState<string | null>(null);
    const [teacherFileAiSummary, setTeacherFileAiSummary] = useState<string | null>(null);
    const [isGeneratingTeacherFileSummary, setIsGeneratingTeacherFileSummary] = useState(false);
    const [teacherFileSummaryError, setTeacherFileSummaryError] = useState<string | null>(null);


    useEffect(() => {
        setTeacherAiSummary(null);
        setTeacherSummaryError(null);
    }, [comprehensiveTeacher, comprehensiveTeacherLevel]);
    
    useEffect(() => {
        setTeacherFileAiSummary(null);
        setTeacherFileSummaryError(null);
    }, [teacherViewLevel]);

    useEffect(() => {
        if (dataType === 'general' && parsedData) {
            const hasPrimary = parsedData.some(d => d['Nivel'] === 'Primaria');
            const hasHighSchool = parsedData.some(d => d['Nivel'] === 'Bachillerato');
            if (hasPrimary) {
                setVisualizerGeneralTab('primary');
            } else if (hasHighSchool) {
                setVisualizerGeneralTab('highSchool');
            }
        }
    }, [dataType, parsedData]);


    const processCsv = (csvText: string) => {
        try {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) throw new Error("El archivo CSV está vacío o no tiene datos.");

            const parseLine = (line: string): string[] => {
                const result: string[] = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                       if (inQuotes && line[i+1] === '"') { // Handle escaped quote
                           current += '"';
                           i++;
                           continue;
                       }
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current);
                return result.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            };

            const headers = parseLine(lines[0]);
            
            const data = lines.slice(1).map(line => {
                if (line.trim() === '') return null;
                const values = parseLine(line);
                const obj: Record<string, string> = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                return obj;
            }).filter(Boolean) as any[];


            setParsedData(data);
            detectDataType(data);
        } catch (e: any) {
            setError(`Error al procesar el archivo: ${e.message}`);
            setParsedData(null);
            setDataType('unknown');
        }
    };
    
    const detectDataType = (data: any[]) => {
        if (!data || data.length === 0) {
            setDataType('unknown');
            return;
        }
        const headers = Object.keys(data[0]);
        if (headers.includes('ID Evaluación') && headers.includes('Puntaje')) {
            setDataType('comprehensive');
        } else if (headers.includes('Calificación Promedio') && headers.includes('Total de Encuestas')) {
            setDataType('general');
        } else if (headers.includes('Puntaje Promedio') && headers.includes('Pregunta')) {
            setDataType('teacher');
        } else if (headers.includes('ESTUDIANTE (MATERIA)')) {
            setDataType('student');
        } else {
            setDataType('unknown');
            setError('El formato del archivo CSV no es reconocido.');
        }
    };
    
    const handleFile = (file: File) => {
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            reset();
            setError(null);
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                processCsv(text);
            };
            reader.readAsText(file);
        } else {
            setError('Por favor, sube un archivo con formato .csv');
            reset();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };
    
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const reset = () => {
        setFileName(null);
        setParsedData(null);
        setDataType(null);
        setError(null);
        setComprehensiveTeacher('');
        setComprehensiveGrade('');
        setComprehensiveTeacherForStudent('');
        setGeneralAiSummary(null);
        setIsGeneratingGeneralSummary(false);
        setGeneralSummaryError(null);
        setTeacherAiSummary(null);
        setIsGeneratingTeacherSummary(false);
        setTeacherSummaryError(null);
        setTeacherFileAiSummary(null);
        setIsGeneratingTeacherFileSummary(false);
        setTeacherFileSummaryError(null);
        setVisualizerGeneralTab('primary');
    };

    const teacherLevels = useMemo(() => {
        const levels = new Set<'PRIMARY' | 'HIGH_SCHOOL'>();
        if (dataType !== 'comprehensive' || !parsedData || !comprehensiveTeacher) {
            return levels;
        }
        parsedData.forEach(row => {
            if (row['Profesor'] === comprehensiveTeacher) {
                if (row['Nivel'] === 'PRIMARY' || row['Nivel'] === 'HIGH_SCHOOL') {
                     levels.add(row['Nivel']);
                }
            }
        });
        return levels;
    }, [parsedData, dataType, comprehensiveTeacher]);
    
    const teacherViewAvailableLevels = useMemo(() => {
        const levels = new Set<'Primaria' | 'Bachillerato'>();
        if (dataType !== 'teacher' || !parsedData || !parsedData[0]['Nivel']) {
            return levels;
        }
        parsedData.forEach(row => {
            if (row['Nivel'] === 'Primaria' || row['Nivel'] === 'Bachillerato') {
                levels.add(row['Nivel']);
            }
        });
        return levels;
    }, [dataType, parsedData]);

    useEffect(() => {
        if (teacherLevels.size > 0) {
            if (teacherLevels.has('PRIMARY')) {
                setComprehensiveTeacherLevel('PRIMARY');
            } else if (teacherLevels.has('HIGH_SCHOOL')) {
                setComprehensiveTeacherLevel('HIGH_SCHOOL');
            }
        }
    }, [teacherLevels]);

    useEffect(() => {
        if (teacherViewAvailableLevels.size > 0) {
            if (teacherViewAvailableLevels.has('Primaria')) {
                setTeacherViewLevel('Primaria');
            } else if (teacherViewAvailableLevels.has('Bachillerato')) {
                setTeacherViewLevel('Bachillerato');
            }
        }
    }, [teacherViewAvailableLevels]);

    const comprehensiveData = useMemo(() => {
        if (dataType !== 'comprehensive' || !parsedData) return null;
    
        const teacherStats: Record<string, {
            totalScore: number;
            answerCount: number;
            evaluations: Set<string>;
            levels: Set<string>;
        }> = {};
    
        parsedData.forEach(row => {
            const teacherName = row['Profesor'];
            if (!teacherName) return;
            if (!teacherStats[teacherName]) {
                teacherStats[teacherName] = { totalScore: 0, answerCount: 0, evaluations: new Set(), levels: new Set() };
            }
            const score = parseFloat(row['Puntaje']);
            if (!isNaN(score)) {
                teacherStats[teacherName].totalScore += score;
                teacherStats[teacherName].answerCount++;
            }
            teacherStats[teacherName].evaluations.add(row['ID Evaluación']);
            teacherStats[teacherName].levels.add(row['Nivel']);
        });
    
        const primaryData: any[] = [];
        const highSchoolData: any[] = [];
        const allTeachersInCsv = Object.keys(teacherStats).sort();
    
        allTeachersInCsv.forEach(teacherName => {
            const stats = teacherStats[teacherName];
            const avgScore = stats.answerCount > 0 ? parseFloat((stats.totalScore / stats.answerCount).toFixed(2)) : 0;
            const chartEntry = {
                name: teacherName,
                'Calificación Promedio': avgScore,
                'Total de Encuestas': stats.evaluations.size,
            };
            if (stats.levels.has('PRIMARY')) primaryData.push(chartEntry);
            if (stats.levels.has('HIGH_SCHOOL')) highSchoolData.push(chartEntry);
        });
        
        let teacherSpecificChartData = null;
    
        if (comprehensiveTeacher) {
            const questionScores: Record<string, { scores: number[], order: number }> = {};
            const teacherEvals = parsedData.filter(row => row['Profesor'] === comprehensiveTeacher && row['Nivel'] === comprehensiveTeacherLevel);
    
            if (teacherEvals.length > 0) {
                teacherEvals.forEach(row => {
                    const questionText = row['Pregunta'];
                    const questionNum = parseInt(row['Nº Pregunta'], 10);
                    if (!questionScores[questionText]) {
                        questionScores[questionText] = { scores: [], order: questionNum };
                    }
                    const score = parseFloat(row['Puntaje']);
                    if (!isNaN(score)) {
                        questionScores[questionText].scores.push(score);
                    }
                });
    
                teacherSpecificChartData = Object.entries(questionScores)
                    .sort(([, a], [, b]) => a.order - b.order)
                    .map(([questionText, data], index) => {
                        const averageScore = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
                        return {
                            question: `Q${data.order}`,
                            score: parseFloat(averageScore.toFixed(2)),
                            fullQuestion: questionText,
                        };
                    });
            }
        }
    
        return { primaryData, highSchoolData, allTeachersInCsv, teacherSpecificChartData, teacherLevel: comprehensiveTeacherLevel };
    }, [parsedData, dataType, comprehensiveTeacher, comprehensiveTeacherLevel]);
    
    const handleGenerateGeneralSummary = async () => {
        if (!comprehensiveData) return;
        setIsGeneratingGeneralSummary(true);
        setGeneralAiSummary(null);
        setGeneralSummaryError(null);
        
        // Fix: Use process.env.API_KEY for the API key.
        if (!process.env.API_KEY) {
            setGeneralSummaryError(API_KEY_ERROR_MESSAGE);
            setIsGeneratingGeneralSummary(false);
            return;
        }

        const { primaryData, highSchoolData } = comprehensiveData;

        const formatData = (data: any[]) => 
            data.map(d => `- ${d.name} (Promedio: ${d['Calificación Promedio']}, Encuestas: ${d['Total de Encuestas']})`).join('\n');

        const primaryPromptData = primaryData.length > 0 ? formatData(primaryData) : 'No hay datos para Primaria.';
        const highSchoolPromptData = highSchoolData.length > 0 ? formatData(highSchoolData) : 'No hay datos para Bachillerato.';

        const prompt = `
            Eres un director académico analizando los resultados de las evaluaciones docentes de un archivo de datos.
            A continuación se presentan los promedios generales de los profesores en Primaria y Bachillerato.

            Resultados de Primaria:
            ${primaryPromptData}

            Resultados de Bachillerato:
            ${highSchoolPromptData}

            Por favor, genera un análisis de alto nivel en español y formato Markdown que incluya:
            1.  **Comparativa General**: Compara brevemente el desempeño general entre Primaria y Bachillerato. ¿Hay alguna tendencia notable?
            2.  **Profesores Destacados**: Identifica 1 o 2 profesores con los resultados más altos en cada nivel (si aplica).
            3.  **Áreas de Enfoque**: Identifica 1 o 2 profesores con los resultados más bajos que podrían necesitar más apoyo.
            4.  **Recomendación Estratégica**: Basado en los datos, ¿qué recomendación general darías a la coordinación académica?

            El tono debe ser profesional, objetivo y orientado a la toma de decisiones.
        `;

        try {
            // Fix: Initialize GoogleGenAI with process.env.API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setGeneralAiSummary(response.text);
        } catch (error) {
            console.error("Error generating general AI summary:", error);
            setGeneralSummaryError('Hubo un error al generar el resumen general.');
        } finally {
            setIsGeneratingGeneralSummary(false);
        }
    };

    const handleGenerateTeacherSummary = async () => {
        if (!comprehensiveTeacher || !comprehensiveData?.teacherSpecificChartData) return;
        setIsGeneratingTeacherSummary(true);
        setTeacherAiSummary(null);
        setTeacherSummaryError(null);
        
        // Fix: Use process.env.API_KEY for the API key.
        if (!process.env.API_KEY) {
            setTeacherSummaryError(API_KEY_ERROR_MESSAGE);
            setIsGeneratingTeacherSummary(false);
            return;
        }

        const { teacherSpecificChartData, teacherLevel } = comprehensiveData;
        const isPrimary = teacherLevel === 'PRIMARY';
        const levelText = isPrimary ? 'Primaria' : 'Bachillerato';
        const maxScore = isPrimary ? 3 : 4;
        const dataForPrompt = teacherSpecificChartData.map(d => `- "${d.fullQuestion}": ${d.score.toFixed(2)}`).join('\n');

        const prompt = `
            Eres un experto en pedagogía y análisis de datos educativos.
            A continuación, se presentan los resultados de una evaluación para el profesor(a) ${comprehensiveTeacher} en el nivel de ${levelText}, extraídos de un archivo CSV.
            Los estudiantes calificaron una serie de preguntas en una escala de 1 a ${maxScore}.

            Resultados (Pregunta: Puntaje Promedio):
            ${dataForPrompt}

            Por favor, genera un análisis detallado y constructivo en español y formato Markdown que incluya:
            1.  **Resumen General**: Una breve descripción del desempeño general del profesor según estos datos.
            2.  **Fortalezas Clave**: Identifica 2-3 áreas donde el profesor obtuvo las calificaciones más altas.
            3.  **Áreas de Oportunidad**: Identifica 2-3 áreas con las calificaciones más bajas como oportunidades de mejora.
            4.  **Sugerencias Accionables**: Para cada área de oportunidad, proporciona 1-2 sugerencias concretas y prácticas.

            El tono debe ser profesional, alentador y enfocado en el desarrollo profesional.
        `;
        
        try {
            // Fix: Initialize GoogleGenAI with process.env.API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setTeacherAiSummary(response.text);
        } catch (error) {
            console.error("Error generating teacher AI summary:", error);
            setTeacherSummaryError('Hubo un error al generar el resumen del profesor.');
        } finally {
            setIsGeneratingTeacherSummary(false);
        }
    };
    
    const handleGenerateTeacherFileSummary = async () => {
        if (dataType !== 'teacher' || !parsedData) return;
        
        setIsGeneratingTeacherFileSummary(true);
        setTeacherFileAiSummary(null);
        setTeacherFileSummaryError(null);
        
        // Fix: Use process.env.API_KEY for the API key.
        if (!process.env.API_KEY) {
            setTeacherFileSummaryError(API_KEY_ERROR_MESSAGE);
            setIsGeneratingTeacherFileSummary(false);
            return;
        }

        const filteredTeacherData = parsedData.filter(d => 
            teacherViewAvailableLevels.size === 0 || d['Nivel'] === teacherViewLevel
        );

        const teacherChartData = filteredTeacherData.map((d, i) => ({
            fullQuestion: d['Pregunta'],
            score: parseFloat(d['Puntaje Promedio']),
        }));
        
        if (teacherChartData.length === 0) {
            setTeacherFileSummaryError('No hay datos para generar un resumen.');
            setIsGeneratingTeacherFileSummary(false);
            return;
        }

        const teacherNameMatch = fileName?.match(/profesor_([^_]+)/i);
        const teacherName = teacherNameMatch ? teacherNameMatch[1].replace(/_/g, ' ') : 'este profesor';
        const isPrimary = teacherViewLevel === 'Primaria';
        const levelText = isPrimary ? 'Primaria' : 'Bachillerato';
        const maxScore = teacherChartData.some(d => d.score > 3) ? 4 : 3;
        const dataForPrompt = teacherChartData.map(d => `- "${d.fullQuestion}": ${d.score.toFixed(2)}`).join('\n');

        const prompt = `
            Eres un experto en pedagogía y análisis de datos educativos.
            A continuación, se presentan los resultados de una evaluación para ${teacherName} en el nivel de ${levelText}, extraídos de un archivo CSV de análisis de profesor.
            Los estudiantes calificaron una serie de preguntas en una escala de 1 a ${maxScore}.

            Resultados (Pregunta: Puntaje Promedio):
            ${dataForPrompt}

            Por favor, genera un análisis detallado y constructivo en español y formato Markdown que incluya:
            1.  **Resumen General**: Una breve descripción del desempeño general del profesor según estos datos.
            2.  **Fortalezas Clave**: Identifica 2-3 áreas donde el profesor obtuvo las calificaciones más altas.
            3.  **Áreas de Oportunidad**: Identifica 2-3 áreas con las calificaciones más bajas como oportunidades de mejora.
            4.  **Sugerencias Accionables**: Para cada área de oportunidad, proporciona 1-2 sugerencias concretas y prácticas.

            El tono debe ser profesional, alentador y enfocado en el desarrollo profesional.
        `;
        
        try {
            // Fix: Initialize GoogleGenAI with process.env.API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setTeacherFileAiSummary(response.text);
        } catch (error) {
            console.error("Error generating teacher file AI summary:", error);
            setTeacherFileSummaryError('Hubo un error al generar el resumen del profesor.');
        } finally {
            setIsGeneratingTeacherFileSummary(false);
        }
    };


    const allGradesInCsv = useMemo(() => {
        if (dataType !== 'comprehensive' || !parsedData) return [];
        return [...new Set(parsedData.map(row => row['Grado']))].sort();
    }, [parsedData, dataType]);

    const teachersInSelectedGrade = useMemo(() => {
        if (dataType !== 'comprehensive' || !parsedData || !comprehensiveGrade) return [];
        const teachers = parsedData
            .filter(row => row['Grado'] === comprehensiveGrade)
            .map(row => row['Profesor']);
        return [...new Set(teachers)].sort();
    }, [parsedData, dataType, comprehensiveGrade]);

    const studentTableData = useMemo(() => {
        if (dataType !== 'comprehensive' || !parsedData || !comprehensiveGrade || !comprehensiveTeacherForStudent) {
            return { headers: [], rows: [] };
        }
    
        const relevantEvals = parsedData.filter(row => 
            row['Grado'] === comprehensiveGrade && 
            row['Profesor'] === comprehensiveTeacherForStudent
        );
    
        if (relevantEvals.length === 0) {
            return { headers: [], rows: [] };
        }
    
        const questionNumbers = relevantEvals.map(row => parseInt(row['Nº Pregunta'], 10));
        if (questionNumbers.length === 0 || questionNumbers.some(isNaN)) {
             return { headers: [], rows: [] };
        }
        
        const maxQuestionNum = Math.max(...questionNumbers);
        const headers = ['Estudiante (Materia)', ...Array.from({ length: maxQuestionNum }, (_, i) => `Q${i + 1}`)];
        
        const groupedByEvaluation = relevantEvals.reduce((acc: any, row) => {
            const evalId = row['ID Evaluación'];
            if (!acc[evalId]) {
                acc[evalId] = {
                    student: row['Estudiante'],
                    subject: row['Materia'],
                    answers: {}
                };
            }
            acc[evalId].answers[`Q${row['Nº Pregunta']}`] = row['Respuesta'];
            return acc;
        }, {});
    
        const rows = Object.values(groupedByEvaluation).map((evalData: any) => {
            const rowData: Record<string, string> = {
                'Estudiante (Materia)': `${evalData.student} (${evalData.subject})`
            };
            for (let i = 1; i <= maxQuestionNum; i++) {
                rowData[`Q${i}`] = evalData.answers[`Q${i}`] || '-';
            }
            return rowData;
        });
    
        return { headers, rows };
    }, [parsedData, dataType, comprehensiveGrade, comprehensiveTeacherForStudent]);

    const renderData = () => {
        if (!parsedData) return null;
        
        switch (dataType) {
            case 'general':
                const generalPrimaryData = parsedData
                    .filter(d => d['Nivel'] === 'Primaria')
                    .map(d => ({
                        name: d['Profesor'],
                        'Calificación Promedio': parseFloat(d['Calificación Promedio']),
                        'Total de Encuestas': parseInt(d['Total de Encuestas'], 10)
                    }));
                
                const generalHighSchoolData = parsedData
                    .filter(d => d['Nivel'] === 'Bachillerato')
                    .map(d => ({
                        name: d['Profesor'],
                        'Calificación Promedio': parseFloat(d['Calificación Promedio']),
                        'Total de Encuestas': parseInt(d['Total de Encuestas'], 10)
                    }));

                return (
                    <>
                        <div className="flex border-b border-gray-200 mb-4">
                            {generalPrimaryData.length > 0 && (
                                <button
                                    onClick={() => setVisualizerGeneralTab('primary')}
                                    className={`py-3 px-6 text-xl font-bold transition-colors duration-200 outline-none ${
                                        visualizerGeneralTab === 'primary'
                                            ? 'border-b-4 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Primaria
                                </button>
                            )}
                             {generalHighSchoolData.length > 0 && (
                                <button
                                    onClick={() => setVisualizerGeneralTab('highSchool')}
                                    className={`py-3 px-6 text-xl font-bold transition-colors duration-200 outline-none ${
                                        visualizerGeneralTab === 'highSchool'
                                            ? 'border-b-4 border-purple-500 text-purple-600'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Bachillerato
                                </button>
                            )}
                        </div>
        
                        {visualizerGeneralTab === 'primary' && generalPrimaryData.length > 0 && (
                            <div className="animate-fade h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={generalPrimaryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
        
                        {visualizerGeneralTab === 'highSchool' && generalHighSchoolData.length > 0 && (
                            <div className="animate-fade h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={generalHighSchoolData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                    </>
                );
            case 'teacher':
                const filteredTeacherData = parsedData.filter(d => 
                    teacherViewAvailableLevels.size === 0 || d['Nivel'] === teacherViewLevel
                );
                const teacherChartData = filteredTeacherData.map((d, i) => ({
                    question: `Q${i + 1}`,
                    fullQuestion: d['Pregunta'],
                    score: parseFloat(d['Puntaje Promedio']),
                }));
                const maxScore = teacherChartData.some(d => d.score > 3) ? 4 : 3;
                const isPrimaryTeacherView = teacherViewLevel === 'Primaria';

                return (
                    <>
                        <div className="flex justify-between items-center mb-4">
                             {teacherViewAvailableLevels.size > 1 && (
                                <div className="flex border-b border-gray-200">
                                    <button
                                        onClick={() => setTeacherViewLevel('Primaria')}
                                        disabled={!teacherViewAvailableLevels.has('Primaria')}
                                        className={`py-2 px-4 text-lg font-bold transition-colors duration-200 outline-none ${
                                            teacherViewLevel === 'Primaria' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        Análisis Primaria
                                    </button>
                                    <button
                                        onClick={() => setTeacherViewLevel('Bachillerato')}
                                        disabled={!teacherViewAvailableLevels.has('Bachillerato')}
                                        className={`py-2 px-4 text-lg font-bold transition-colors duration-200 outline-none ${
                                            teacherViewLevel === 'Bachillerato' ? 'border-b-4 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        Análisis Bachillerato
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-4 ml-auto">
                                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setChartType('bar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                                        Barras
                                    </button>
                                    <button onClick={() => setChartType('radar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${chartType === 'radar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                                        Radial
                                    </button>
                                </div>
                                <button
                                    onClick={handleGenerateTeacherFileSummary}
                                    disabled={isGeneratingTeacherFileSummary}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isGeneratingTeacherFileSummary ? 'Generando...' : 'Generar Resumen con IA'}
                                </button>
                            </div>
                        </div>
                        {chartType === 'bar' ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={teacherChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="question" />
                                    <YAxis domain={[0, maxScore]} />
                                    <Tooltip content={<ChartTooltipWithFullQuestion />} />
                                    <Legend />
                                    <Bar dataKey="score" fill={isPrimaryTeacherView ? "#82ca9d" : "#8884d8"} name={`Puntaje Promedio`} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teacherChartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="question" />
                                    <PolarRadiusAxis angle={30} domain={[0, maxScore]}/>
                                    <Radar name="Puntaje Promedio" dataKey="score" stroke={isPrimaryTeacherView ? "#34d399" : "#a78bfa"} fill={isPrimaryTeacherView ? "#a7f3d0" : "#d8b4fe"} fillOpacity={0.6} />
                                    <Tooltip content={<ChartTooltipWithFullQuestion />} />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            {isGeneratingTeacherFileSummary && (
                                <div className="text-center text-gray-600">
                                    <p>La IA está analizando los datos del profesor, esto puede tardar unos segundos...</p>
                                </div>
                            )}
                            {teacherFileSummaryError && (
                                <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg" role="alert">
                                    <p className="font-bold">Error al generar resumen</p>
                                    <p>{teacherFileSummaryError}</p>
                                </div>
                            )}
                            {teacherFileAiSummary && (
                                <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <pre className="whitespace-pre-wrap font-sans text-base text-gray-800">{teacherFileAiSummary}</pre>
                                </div>
                            )}
                        </div>
                   </>
                );
            case 'student':
                const headers = Object.keys(parsedData[0]);
                return (
                  <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-gray-600">
                      <thead className="bg-gray-100 text-sm text-gray-800">
                        <tr>{headers.map(h => <th key={h} scope="col" className="px-6 py-3">{h.length > 30 ? h.substring(0,30)+'...' : h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {parsedData.map((row, i) => (
                          <tr key={i} className="bg-white border-b hover:bg-gray-50">
                            {headers.map(h => <td key={h} className="px-6 py-4 text-sm">{row[h]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
            case 'comprehensive':
                if (!comprehensiveData) return null;
                const { primaryData, highSchoolData, allTeachersInCsv, teacherSpecificChartData, teacherLevel } = comprehensiveData;
                const maxComprehensiveScore = teacherLevel === 'PRIMARY' ? 3 : 4;

                return (
                    <div className="flex flex-col gap-8">
                        <Section title="Análisis General con IA del Archivo">
                            <div className="flex justify-center">
                                <button
                                    onClick={handleGenerateGeneralSummary}
                                    disabled={isGeneratingGeneralSummary}
                                    className="flex items-center gap-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {isGeneratingGeneralSummary ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analizando Archivo...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.5 3.5 0 0 0 5.5 8c0 2 2 3.5 3.5 3.5s3.5-1.5 3.5-3.5A3.5 3.5 0 0 0 9 4.7c-.6-1.1-1.8-1.7-3-1.7Z"></path><path d="m12 12 1.4-1.4a2 2 0 0 1 2.8 0L17 11.4a2 2 0 0 1 0 2.8L12 20l-5-5a2 2 0 0 1 0-2.8l.8-.8a2 2 0 0 1 2.8 0L12 12v0Z"></path></svg>
                                            Generar Resumen General
                                        </>
                                    )}
                                </button>
                            </div>
                             {isGeneratingGeneralSummary && (
                                <div className="mt-6 text-center text-gray-600">
                                    <p>La IA está analizando los datos de todo el archivo, esto puede tardar unos segundos...</p>
                                </div>
                            )}
                            {generalSummaryError && (
                                <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg" role="alert">
                                    <p className="font-bold">Error al generar resumen</p>
                                    <p>{generalSummaryError}</p>
                                </div>
                            )}
                             {generalAiSummary && (
                                <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <pre className="whitespace-pre-wrap font-sans text-base text-gray-800">{generalAiSummary}</pre>
                                </div>
                            )}
                        </Section>

                        <Section title="Resumen General (Primaria) del Archivo">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={primaryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" domain={[0, 5]} label={{ value: 'Promedio', angle: -90, position: 'insideLeft' }}/>
                                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" dataKey="Total de Encuestas" allowDecimals={false} label={{ value: 'Encuestas', angle: 90, position: 'insideRight' }}/>
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="Calificación Promedio" fill="#3b82f6" />
                                    <Bar yAxisId="right" dataKey="Total de Encuestas" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
            
                        <Section title="Resumen General (Bachillerato) del Archivo">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={highSchoolData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" domain={[0, 5]} label={{ value: 'Promedio', angle: -90, position: 'insideLeft' }}/>
                                    <YAxis yAxisId="right" orientation="right" stroke="#ec4899" dataKey="Total de Encuestas" allowDecimals={false} label={{ value: 'Encuestas', angle: 90, position: 'insideRight' }}/>
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="Calificación Promedio" fill="#8b5cf6" />
                                    <Bar yAxisId="right" dataKey="Total de Encuestas" fill="#ec4899" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
                        
                        <Section title="Análisis por Profesor del Archivo">
                            <div className="flex flex-col gap-4">
                                <select value={comprehensiveTeacher} onChange={e => setComprehensiveTeacher(e.target.value)} className="w-full max-w-md p-3 text-lg border-2 border-gray-200 rounded-lg">
                                    <option value="">-- Selecciona un Profesor --</option>
                                    {allTeachersInCsv.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>

                                {comprehensiveTeacher && teacherLevels.size > 1 && (
                                    <div className="flex border-b border-gray-200">
                                        <button
                                            onClick={() => setComprehensiveTeacherLevel('PRIMARY')}
                                            disabled={!teacherLevels.has('PRIMARY')}
                                            className={`py-2 px-4 text-lg font-bold transition-colors duration-200 outline-none ${
                                                comprehensiveTeacherLevel === 'PRIMARY' ? 'border-b-4 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Análisis Primaria
                                        </button>
                                        <button
                                            onClick={() => setComprehensiveTeacherLevel('HIGH_SCHOOL')}
                                            disabled={!teacherLevels.has('HIGH_SCHOOL')}
                                            className={`py-2 px-4 text-lg font-bold transition-colors duration-200 outline-none ${
                                                comprehensiveTeacherLevel === 'HIGH_SCHOOL' ? 'border-b-4 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Análisis Bachillerato
                                        </button>
                                    </div>
                                )}

                                {comprehensiveTeacher && teacherSpecificChartData && (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg self-start">
                                            <button onClick={() => setComprehensiveChartType('bar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${comprehensiveChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>Barras</button>
                                            <button onClick={() => setComprehensiveChartType('radar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${comprehensiveChartType === 'radar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>Radial</button>
                                        </div>
                                         <button
                                            onClick={handleGenerateTeacherSummary}
                                            disabled={isGeneratingTeacherSummary}
                                            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {isGeneratingTeacherSummary ? 'Generando...' : 'Generar Resumen con IA'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {comprehensiveTeacher && teacherSpecificChartData && (
                                <div className="mt-6 h-96">
                                    <h3 className="text-2xl font-semibold mb-2 text-gray-800">Calificación por Pregunta para {comprehensiveTeacher}</h3>
                                    {comprehensiveChartType === 'bar' ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={teacherSpecificChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="question" />
                                                <YAxis domain={[0, maxComprehensiveScore]} />
                                                <Tooltip content={<ChartTooltipWithFullQuestion />} />
                                                <Legend />
                                                <Bar dataKey="score" fill={teacherLevel === 'PRIMARY' ? "#82ca9d" : "#8884d8"} name={`Puntaje Promedio`} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teacherSpecificChartData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="question" />
                                                <PolarRadiusAxis angle={30} domain={[0, maxComprehensiveScore]} />
                                                <Radar name="Puntaje Promedio" dataKey="score" stroke={teacherLevel === 'PRIMARY' ? "#34d399" : "#a78bfa"} fill={teacherLevel === 'PRIMARY' ? "#a7f3d0" : "#d8b4fe"} fillOpacity={0.6} />
                                                <Tooltip content={<ChartTooltipWithFullQuestion />} />
                                                <Legend />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            )}
                            {comprehensiveTeacher && !teacherSpecificChartData && <p className="text-center text-gray-500 mt-4">No hay datos para este profesor.</p>}
                            
                            {comprehensiveTeacher && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    {isGeneratingTeacherSummary && (
                                        <div className="text-center text-gray-600">
                                            <p>La IA está analizando los datos del profesor, esto puede tardar unos segundos...</p>
                                        </div>
                                    )}
                                    {teacherSummaryError && (
                                        <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg" role="alert">
                                            <p className="font-bold">Error al generar resumen</p>
                                            <p>{teacherSummaryError}</p>
                                        </div>
                                    )}
                                    {teacherAiSummary && (
                                        <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                            <pre className="whitespace-pre-wrap font-sans text-base text-gray-800">{teacherAiSummary}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>

                        <Section title="Análisis Detallado por Estudiante">
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <select value={comprehensiveGrade} onChange={e => { setComprehensiveGrade(e.target.value); setComprehensiveTeacherForStudent(''); }} className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg">
                                    <option value="">-- Selecciona un Grado --</option>
                                    {allGradesInCsv.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={comprehensiveTeacherForStudent} onChange={e => setComprehensiveTeacherForStudent(e.target.value)} className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg" disabled={!comprehensiveGrade}>
                                    <option value="">-- Selecciona un Profesor --</option>
                                    {teachersInSelectedGrade.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {studentTableData.rows.length > 0 ? (
                                <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
                                    <table className="w-full text-left text-gray-600">
                                        <thead className="bg-gray-100 text-sm text-gray-800">
                                            <tr>
                                                {studentTableData.headers.map(header => (
                                                    <th key={header} scope="col" className={`px-6 py-3 ${header.startsWith('Q') ? 'text-center' : ''}`}>{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentTableData.rows.map((row, index) => (
                                                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                                    {studentTableData.headers.map(header => (
                                                        <td key={header} className={`px-6 py-4 ${header.startsWith('Q') ? 'text-center' : 'font-bold text-gray-900'}`}>
                                                            {row[header]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                comprehensiveGrade && comprehensiveTeacherForStudent && (
                                    <p className="text-center text-gray-500 mt-4">
                                        No hay datos de estudiantes para la selección actual.
                                    </p>
                                )
                            )}
                        </Section>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade flex flex-col gap-8">
            <div className="flex items-center">
                <button onClick={onBack} className="flex items-center text-gray-400 font-bold text-2xl hover:text-gray-700 transition-colors mr-4">
                    <ArrowLeftIcon className="w-8 h-8 mr-2"/>
                    Regresar
                </button>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight m-0">Visualizador de CSV</h1>
            </div>

            {!parsedData ? (
                <>
                <div 
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative w-full h-80 border-4 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all duration-200 ${isDragging ? 'border-blue-600 bg-blue-50' : ''}`}
                >
                    <UploadCloudIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-2xl font-bold text-gray-700">Arrastra y suelta tu archivo CSV aquí</p>
                    <p className="text-lg text-gray-500 my-4">o</p>
                    <label className="bg-sky-500 text-white font-bold text-lg py-3 px-6 rounded-lg cursor-pointer transition-colors hover:bg-sky-600">
                        Seleccionar Archivo
                        <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>
                 {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg mt-4">
                        <p className="font-bold text-lg">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                </>
            ) : (
                 <Section title={`Visualizando: ${fileName}`}>
                    <div className="flex justify-end mb-4">
                        <button onClick={reset} className="text-sm font-bold text-red-600 bg-red-100 py-2 px-3 rounded-lg transition-colors hover:bg-red-200">
                            Cargar otro archivo
                        </button>
                    </div>
                    {renderData()}
                </Section>
            )}

        </div>
    );
};