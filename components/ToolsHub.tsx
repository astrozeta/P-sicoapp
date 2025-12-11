
import React, { useState, useEffect } from 'react';
import { User, SurveyAssignment, Entry } from '../types';
import { getAllSurveysForPatient, getEntries } from '../services/dataService';
import SurveyTaker from './SurveyTaker';

interface ToolsHubProps {
  onSelectTool: (tool: 'naretbox') => void;
  user: User;
}

const ToolsHub: React.FC<ToolsHubProps> = ({ onSelectTool, user }) => {
  const [activeSurvey, setActiveSurvey] = useState<SurveyAssignment | null>(null);
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [naretboxCount, setNaretboxCount] = useState(0);
  const [taskTab, setTaskTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
      loadData();
  }, [user.id]);

  const loadData = async () => {
      // Load Surveys
      const userAssignments = await getAllSurveysForPatient(user.id);
      setAssignments(userAssignments);

      // Load Naretbox Stats
      const entries = await getEntries(user.id);
      setNaretboxCount(entries.length);
  };

  const handleSurveyComplete = () => {
      setActiveSurvey(null);
      loadData(); 
      alert("¡Gracias! Tus respuestas han sido enviadas a tu psicólogo.");
  };

  const pending = assignments.filter(a => a.status === 'pending');
  const completed = assignments.filter(a => a.status === 'completed');
  const completionRate = assignments.length > 0 ? Math.round((completed.length / assignments.length) * 100) : 0;

  if (activeSurvey) {
      return <SurveyTaker assignment={activeSurvey} onComplete={handleSurveyComplete} onCancel={() => setActiveSurvey(null)} />;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24 md:pb-8">
      {/* Header with Greeting and Psychologist */}
      <div className="bg-gradient-to-r from-brand-900/40 to-slate-900 border border-slate-800 rounded-3xl p-8 md:flex md:items-center md:justify-between relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 mb-6 md:mb-0">
            <h1 className="text-3xl font-bold text-white mb-2">Hola, {user.name}</h1>
            <p className="text-slate-400 max-w-lg">
                Tu espacio personal de crecimiento y bienestar.
            </p>
        </div>
        
        {user.assignedPsychologistEmail && (
            <div className="relative z-10 bg-slate-950/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 hover:border-brand-500/40 transition-colors shadow-lg max-w-sm w-full md:w-auto">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-2xl shadow-inner">
                    👨‍⚕️
                </div>
                <div className="text-left flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-brand-400 font-bold">Psicólogo Asignado</p>
                    <p className="text-sm text-white font-medium mb-1 truncate">Dr. Nacho Del Valle</p>
                    <a 
                        href={`mailto:${user.assignedPsychologistEmail}`} 
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors bg-slate-800/50 w-fit px-2 py-1 rounded-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Contactar
                    </a>
                </div>
            </div>
        )}
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{completed.length}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tareas Realizadas</p>
                </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-end">
                        <p className="text-2xl font-bold text-white">{completionRate}%</p>
                        <p className="text-xs text-slate-500 mb-1">Completado</p>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{naretboxCount}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registros Naretbox</p>
                </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Tasks */}
          <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                        Mis Tareas
                </h2>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setTaskTab('pending')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${taskTab === 'pending' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Pendientes
                    </button>
                    <button 
                        onClick={() => setTaskTab('completed')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${taskTab === 'completed' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Realizadas
                    </button>
                </div>
              </div>

              {taskTab === 'pending' && (
                  <div className="space-y-4 animate-fade-in">
                      {pending.length === 0 ? (
                          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                              </div>
                              <h3 className="text-slate-300 font-bold mb-1">¡Estás al día!</h3>
                              <p className="text-sm text-slate-500">No tienes tareas pendientes asignadas por tu psicólogo.</p>
                          </div>
                      ) : (
                          pending.map(survey => (
                            <div key={survey.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/50 transition-all group">
                                <div>
                                    <h3 className="font-bold text-slate-100 text-lg group-hover:text-brand-300 transition-colors">{survey.templateTitle}</h3>
                                    <p className="text-slate-500 text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Pendiente • Asignado hace {Math.floor((Date.now() - survey.assignedAt) / (1000 * 60 * 60 * 24))} días
                                    </p>
                                </div>
                                <button 
                                        onClick={() => setActiveSurvey(survey)}
                                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                >
                                        Comenzar Tarea
                                </button>
                            </div>
                        ))
                      )}
                  </div>
              )}

              {taskTab === 'completed' && (
                   <div className="space-y-4 animate-fade-in">
                       {completed.length === 0 ? (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
                                Aún no has completado ninguna tarea.
                            </div>
                       ) : (
                           completed.map(survey => (
                                <div key={survey.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                                    <div>
                                        <h3 className="font-bold text-slate-300">{survey.templateTitle}</h3>
                                        <p className="text-slate-500 text-xs flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Completado el {survey.completedAt && new Date(survey.completedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-emerald-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                           ))
                       )}
                   </div>
              )}
          </div>

          {/* Right Column: Tools Grid */}
          <div>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                Herramientas
            </h2>
            <div className="space-y-4">
                <button 
                    onClick={() => onSelectTool('naretbox')}
                    className="w-full group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-brand-500/50 transition-all text-left hover:shadow-xl hover:shadow-brand-900/10 overflow-hidden hover:-translate-y-1"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 group-hover:text-brand-300 transition-colors">Naretbox</h3>
                            <p className="text-xs text-slate-400 mt-1">Caja Positiva, Caja Negativa.</p>
                        </div>
                    </div>
                </button>

                <div className="opacity-60 relative bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-left cursor-not-allowed grayscale hover:grayscale-0 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-300">Diario Gratitud</h3>
                            <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold uppercase rounded mt-1">Próximamente</span>
                        </div>
                    </div>
                </div>

                <div className="opacity-60 relative bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-left cursor-not-allowed grayscale hover:grayscale-0 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-300">Respiración</h3>
                            <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold uppercase rounded mt-1">Próximamente</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ToolsHub;
