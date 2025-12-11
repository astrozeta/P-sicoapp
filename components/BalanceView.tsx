import React, { useState, useEffect } from 'react';
import { Entry, BoxType, AnalysisResult } from '../types';
import { analyzeDailyBalance } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BalanceViewProps {
  entries: Entry[];
  onSendReport?: () => void;
  hasPsychologist?: boolean;
}

const BalanceView: React.FC<BalanceViewProps> = ({ entries, onSendReport, hasPsychologist }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter for today only for the "Daily Balance"
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.dateStr === todayStr);
  
  const positiveCount = todayEntries.filter(e => e.type === BoxType.POSITIVE).length;
  const negativeCount = todayEntries.filter(e => e.type === BoxType.NEGATIVE).length;

  const data = [
    { name: 'Positivo', value: positiveCount },
    { name: 'Negativo', value: negativeCount },
  ];

  const COLORS = ['#10b981', '#475569']; // Emerald-500, Slate-600

  const handleAnalyze = async () => {
    setIsLoading(true);
    const result = await analyzeDailyBalance(todayEntries);
    setAnalysis(result);
    setIsLoading(false);
  };

  useEffect(() => {
    // Reset analysis if viewing a different day or if component remounts
  }, [entries]);

  if (todayEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8 text-center text-slate-500 animate-fade-in">
        <div className="bg-slate-900 p-6 rounded-full mb-6 ring-1 ring-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-300">Sin datos hoy</h3>
        <p className="max-w-xs mx-auto">Añade eventos en las cajas para generar tu balance diario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
        
      {/* Stats Card */}
      <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
        <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
            Resumen de Hoy
        </h2>
        
        {/* Fixed height container to ensure chart renders correctly */}
        <div className="h-64 w-full relative mx-auto max-w-sm"> 
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-400 font-medium ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
             {/* Center Stats */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
                <span className="text-3xl font-bold text-white">{positiveCount + negativeCount}</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Total</span>
             </div>
        </div>

        <div className="flex gap-4 mt-2">
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-emerald-400">{positiveCount}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Positivos</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-slate-300">{negativeCount}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Negativos</p>
            </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-1 shadow-2xl overflow-hidden border border-indigo-500/30">
        <div className="bg-slate-950/20 backdrop-blur-sm p-6 rounded-[22px] relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Naret AI Balance
            </h2>

            {!analysis ? (
                <div className="relative z-10">
                    <p className="text-indigo-200/80 mb-6 leading-relaxed">
                        Deja que la IA analice tu día, encuentre patrones y te ayude a ver el lado positivo de las cosas difíciles.
                    </p>
                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full bg-white text-indigo-950 font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-indigo-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analizando Día...
                            </>
                        ) : (
                            'Generar Balance'
                        )}
                    </button>
                </div>
            ) : (
                <div className="animate-scale-in relative z-10">
                    <div className="mb-6">
                        <h3 className="font-bold text-indigo-300 text-xs uppercase tracking-widest mb-2">Resumen</h3>
                        <p className="text-indigo-50 leading-relaxed text-lg whitespace-pre-line">{analysis.summary}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Re-enfoque Positivo
                        </h3>
                        <p className="text-white italic text-base font-light whitespace-pre-line">"{analysis.advice}"</p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        {hasPsychologist && onSendReport && (
                            <button
                                onClick={onSendReport}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                Enviar Informe al Psicólogo
                            </button>
                        )}
                        <button 
                            onClick={() => setAnalysis(null)}
                            className="w-full py-2 text-sm text-indigo-300 hover:text-white transition-colors border border-dashed border-indigo-500/30 rounded-lg hover:border-indigo-400"
                        >
                            Reiniciar análisis
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BalanceView;