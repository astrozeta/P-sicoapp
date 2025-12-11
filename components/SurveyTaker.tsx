
import React, { useState, useEffect } from 'react';
import { SurveyAssignment, SurveyTemplate, QuestionType, SurveyQuestion } from '../types';
import { submitSurvey, getSurveyTemplates } from '../services/dataService';
import { INITIAL_MENTAL_HEALTH_ASSESSMENT } from '../constants';

interface Props {
    assignment: SurveyAssignment;
    onComplete: () => void;
    onCancel: () => void;
}

const SurveyTaker: React.FC<Props> = ({ assignment, onComplete, onCancel }) => {
    const [template, setTemplate] = useState<SurveyTemplate | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTemplate = async () => {
             // Check if it's the standard assessment first
             if (assignment.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) {
                 setTemplate(INITIAL_MENTAL_HEALTH_ASSESSMENT);
                 setIsLoading(false);
                 return;
             }

             const allTemplates = await getSurveyTemplates();
             const t = allTemplates.find(t => t.id === assignment.templateId);
             setTemplate(t || null);
             setIsLoading(false);
        }
        fetchTemplate();
    }, [assignment.templateId]);

    if (isLoading) return <div className="text-slate-400 p-8 text-center">Cargando encuesta...</div>;

    if (!template) return <div className="text-red-400 p-8 text-center">Error: Plantilla no encontrada</div>;

    const handleAnswer = (qId: string, val: any) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < template.questions.length) {
            alert('Por favor responde todas las preguntas.');
            return;
        }
        
        const formattedResponses = Object.entries(answers).map(([qid, ans]) => ({
            questionId: qid,
            answer: ans
        }));

        await submitSurvey(assignment.id, formattedResponses);
        onComplete();
    };

    let currentSection = "";

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-slide-up overflow-y-auto">
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center z-10">
                <div>
                    <h2 className="text-xl font-bold text-white max-w-[200px] md:max-w-md truncate">{template.title}</h2>
                    <p className="text-slate-400 text-sm">Tarea Asignada</p>
                </div>
                <button onClick={onCancel} className="text-slate-500 hover:text-white px-3 py-2">Cerrar</button>
            </div>

            <div className="max-w-2xl mx-auto w-full p-6 space-y-8 flex-1">
                {template.description && (
                    <div className="bg-brand-900/20 border border-brand-500/20 p-4 rounded-xl text-brand-200 text-sm">
                        {template.description}
                    </div>
                )}

                {template.questions.map((q, idx) => {
                    const showSection = q.section && q.section !== currentSection;
                    if (q.section) currentSection = q.section;

                    return (
                        <div key={q.id}>
                            {showSection && (
                                <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-slate-800 pb-2">
                                    {q.section}
                                </h3>
                            )}
                            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-6">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">
                                    {q.text}
                                </h3>

                                {q.type === 'text' && (
                                    <textarea 
                                        className="w-full bg-slate-800 rounded-xl p-4 text-white border border-slate-700 focus:border-brand-500 outline-none h-32 resize-none"
                                        placeholder="Escribe tu respuesta..."
                                        value={answers[q.id] || ''}
                                        onChange={e => handleAnswer(q.id, e.target.value)}
                                    />
                                )}

                                {q.type === 'scale' && (
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => handleAnswer(q.id, num)}
                                                className={`w-10 h-10 rounded-lg font-bold transition-all ${answers[q.id] === num ? 'bg-brand-500 text-white scale-110 shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <div className="w-full flex justify-between text-xs text-slate-500 mt-2 px-2">
                                            <span>Muy mal</span>
                                            <span>Excelente</span>
                                        </div>
                                    </div>
                                )}

                                {q.type === 'multiple_choice' && q.options && (
                                    <div className="space-y-2">
                                        {q.options.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => handleAnswer(q.id, opt)}
                                                className={`w-full text-left p-4 rounded-xl transition-all border ${answers[q.id] === opt ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-750'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div className="pt-8 pb-16">
                    <button 
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
                    >
                        Enviar Respuestas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SurveyTaker;
