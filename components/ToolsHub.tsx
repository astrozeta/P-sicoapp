
import React, { useState, useEffect } from 'react';
import { User, SurveyAssignment, EducationalResource } from '../types';
import { getAllSurveysForPatient, getEntries, getAssignedResourcesForPatient } from '../services/dataService';
import SurveyTaker from './SurveyTaker';
import AppointmentsPatientView from './AppointmentsPatientView';

interface ToolsHubProps {
  onSelectTool: (tool: 'naretbox') => void;
  user: User;
}

const ToolsHub: React.FC<ToolsHubProps> = ({ onSelectTool, user }) => {
  const [activeSurvey, setActiveSurvey] = useState<SurveyAssignment | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [naretboxCount, setNaretboxCount] = useState(0);

  useEffect(() => {
      loadData();
  }, [user.id]);

  const loadData = async () => {
      // Load Surveys
      const userAssignments = await getAllSurveysForPatient(user.id);
      setAssignments(userAssignments);
      // Load Resources
      const userResources = await getAssignedResourcesForPatient(user.id);
      setResources(userResources);
      // Load Naretbox Stats
      const entries = await getEntries(user.id);
      setNaretboxCount(entries.length);
  };

  const handleSurveyComplete = () => { setActiveSurvey(null); loadData(); alert("¡Gracias! Tus respuestas han sido enviadas a tu psicólogo."); };
  
  const pending = assignments.filter(a => a.status === 'pending');
  const completed = assignments.filter(a => a.status === 'completed');

  if (activeSurvey) { return <SurveyTaker assignment={activeSurvey} onComplete={handleSurveyComplete} onCancel={() => setActiveSurvey(null)} />; }
  if (showAppointments) { return <AppointmentsPatientView user={user} onClose={() => setShowAppointments(false)} />; }

  return (
    <div className="space-y-8 animate-fade-in pb-24 md:pb-8 max-w-7xl mx-auto">
      
      {/* Header Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Hola, {user.name}</h1>
            <p className="text-slate-400">Este es el resumen de tu progreso hoy.</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setShowAppointments(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-3 transition-all"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-bold">Gestionar Citas</span>
          </button>
          <button 
            onClick={() => onSelectTool('naretbox')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="font-bold">Diario Emocional</span>
          </button>
      </div>

      {/* NOTIFICATION AREA */}
      {pending.length > 0 && (
          <div className="bg-gradient-to-r from-brand-900/40 to-slate-900 border border-brand-500/30 rounded-2xl p-6 flex items-start md:items-center gap-4 animate-slide-up shadow-lg shadow-brand-900/10">
              <div className="bg-brand-500/20 p-3 rounded-xl text-brand-500 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
              </div>
              <div>
                  <h3 className="text-white font-bold text-lg">Tienes nuevas actividades asignadas</h3>
                  <p className="text-brand-200/80 text-sm mt-1">Tu psicólogo te ha enviado {pending.length} {pending.length === 1 ? 'tarea' : 'tareas'} para realizar. Revisa la lista de pendientes.</p>
              </div>
          </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
               </div>
               <div><p className="text-2xl font-bold text-white">{pending.length}</p><p className="text-xs text-slate-500 font-bold uppercase">Pendientes</p></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div><p className="text-2xl font-bold text-white">{completed.length}</p><p className="text-xs text-slate-500 font-bold uppercase">Completadas</p></div>
          </div>
           <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <div><p className="text-2xl font-bold text-white">{naretboxCount}</p><p className="text-xs text-slate-500 font-bold uppercase">Entradas Diario</p></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: PENDING TASKS */}
          <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                  Por hacer
              </h2>
              
              {pending.length === 0 ? (
                  <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                      <p className="text-slate-400 font-medium">¡Todo al día!</p>
                      <p className="text-slate-600 text-sm mt-1">No tienes tareas pendientes por ahora.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {pending.map(survey => (
                        <div key={survey.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border-brand-500/30 transition-colors group">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                                <div>
                                    <h3 className="font-bold text-slate-100 group-hover:text-white transition-colors">{survey.templateTitle}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Asignado el {new Date(survey.assignedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveSurvey(survey)} 
                                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-6 rounded-xl text-sm shadow-lg shadow-brand-900/20 transition-all active:scale-95"
                            >
                                Iniciar
                            </button>
                        </div>
                      ))}
                  </div>
              )}

              {/* COMPLETED TASKS HISTORY */}
              {completed.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-800">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Historial Reciente</h3>
                      <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity">
                          {completed.slice(0, 3).map(survey => (
                              <div key={survey.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                  <div className="flex items-center gap-3">
                                      <div className="text-emerald-500">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                      </div>
                                      <span className="text-slate-400 text-sm line-through decoration-slate-600">{survey.templateTitle}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-600">{new Date(survey.completedAt || 0).toLocaleDateString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* RIGHT COLUMN: RESOURCES (LIBRARY) */}
          <div>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                Recursos Educativos
            </h2>
            
            {resources.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-6 text-center text-slate-500 text-sm">
                    Tu biblioteca está vacía por el momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {resources.map(res => (
                        <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-indigo-500 transition-colors group flex items-start gap-4">
                             <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl group-hover:bg-indigo-500/20 transition-colors">
                                 {res.type === 'pdf' ? '📄' : res.type === 'image' ? '🖼️' : '🔗'}
                             </div>
                             <div className="flex-1">
                                 <h3 className="font-bold text-slate-200 text-sm group-hover:text-white mb-1 flex items-center gap-2">
                                     {res.title}
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                 </h3>
                                 <p className="text-xs text-slate-500 line-clamp-2">{res.description}</p>
                                 <p className="text-[10px] text-indigo-400 mt-2 font-bold uppercase tracking-wider">Ver Recurso</p>
                             </div>
                        </a>
                    ))}
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ToolsHub;
