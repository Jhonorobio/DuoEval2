
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowLeftIcon, UploadCloudIcon } from '../components/Icons';
import { Section } from '../components/ui/Section';
import { ChartTooltipWithFullQuestion } from '../components/ui/ChartTooltip';

export const CsvVisualizerView: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const [dataType, setDataType] = useState<'general' | 'teacher' | 'student' | 'unknown' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');

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
        if (headers.includes('Calificación Promedio') && headers.includes('Total de Encuestas')) {
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
    };

    const renderData = () => {
        if (!parsedData) return null;
        
        switch (dataType) {
            case 'general':
                const generalChartData = parsedData.map(d => ({
                    name: d['Profesor'],
                    'Calificación Promedio': parseFloat(d['Calificación Promedio']),
                    'Total de Encuestas': parseInt(d['Total de Encuestas'], 10)
                }));
                const isPrimary = fileName?.includes('primaria');
                return (
                    <ResponsiveContainer width="100%" height={400}>
                       <BarChart data={generalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                          <YAxis yAxisId="left" stroke={isPrimary ? "#3b82f6" : "#8b5cf6"} domain={[0, 5]} label={{ value: 'Promedio', angle: -90, position: 'insideLeft' }}/>
                          <YAxis yAxisId="right" orientation="right" stroke={isPrimary ? "#10b981" : "#ec4899"} dataKey="Total de Encuestas" allowDecimals={false} label={{ value: 'Encuestas', angle: 90, position: 'insideRight' }}/>
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="Calificación Promedio" fill={isPrimary ? "#3b82f6" : "#8b5cf6"} />
                          <Bar yAxisId="right" dataKey="Total de Encuestas" fill={isPrimary ? "#10b981" : "#ec4899"} />
                       </BarChart>
                    </ResponsiveContainer>
                );
            case 'teacher':
                const teacherChartData = parsedData.map((d, i) => ({
                    question: `Q${i+1}`,
                    fullQuestion: d['Pregunta'],
                    score: parseFloat(d['Puntaje Promedio']),
                }));
                const maxScore = teacherChartData.some(d => d.score > 3) ? 4 : 3;
                return (
                    <>
                        <div className="flex justify-end mb-4">
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setChartType('bar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                                    Barras
                                </button>
                                <button onClick={() => setChartType('radar')} className={`py-1 px-3 rounded-md text-sm font-semibold transition-all ${chartType === 'radar' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                                    Radial
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
                                    <Bar dataKey="score" fill="#8884d8" name={`Puntaje Promedio`} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teacherChartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="question" />
                                    <PolarRadiusAxis angle={30} domain={[0, maxScore]}/>
                                    <Radar name="Puntaje Promedio" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Tooltip content={<ChartTooltipWithFullQuestion />} />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
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
