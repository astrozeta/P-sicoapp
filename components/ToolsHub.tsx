
import React, { useState, useEffect } from 'react';
import { User, SurveyAssignment, EducationalResource } from '../types';
import { getAllSurveysForPatient, getEntries, getAssignedResourcesForPatient } from '../services/dataService';
import SurveyTaker from './SurveyTaker';

interface ToolsHubProps {
  onSelectTool: (tool: 'naretbox') => void;
  user: User;
}

const ToolsHub: React.FC<ToolsHubProps> = ({ onSelectTool, user }) => {
  const [activeSurvey, setActiveSurvey] = useState<SurveyAssignment | null>(null);
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [naretboxCount, setNaretboxCount] = useState(0);
  const [taskTab, setTaskTab] = useState<'pending' | 'completed'>('pending');

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
  const completionRate = assignments.length > 0 ? Math.round((completed.length / assignments.length) * 100) : 0;

  if (activeSurvey) { return <SurveyTaker assignment={activeSurvey} onComplete={handleSurveyComplete} onCancel={() => setActiveSurvey(null)} />; }

  return (
    <div className="space-y-8 animate-fade-in pb-24 md:pb-8">
      {/* Header (same as before) */}
      <div className="bg-gradient-to-r from-brand-900/40 to-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Hola, {user.name}</h1>
        <p className="text-slate-400 relative z-10">Tu espacio personal de crecimiento.</p>
      </div>

      {/* Stats Row (same as before) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
               <div><p className="text-2xl font-bold text-white">{completed.length}</p><p className="text-xs text-slate-500 font-bold uppercase">Tareas Hechas</p></div>
          </div>
           <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
               <div><p className="text-2xl font-bold text-white">{naretboxCount}</p><p className="text-xs text-slate-500 font-bold uppercase">Registros Naretbox</p></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Tasks */}
          <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-1 h-6 bg-brand-500 rounded-full"></span>Mis Tareas</h2>
              {/* Task Tabs Logic (same as before) */}
              <div className="space-y-4">
                  {pending.map(survey => (
                    <div key={survey.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
                        <div><h3 className="font-bold text-slate-100">{survey.templateTitle}</h3><p className="text-xs text-slate-500">Pendiente</p></div>
                        <button onClick={() => setActiveSurvey(survey)} className="bg-brand-500 text-white font-bold py-2 px-4 rounded-xl text-sm">Comenzar</button>
                    </div>
                  ))}
              </div>

              {/* NEW: Library Section */}
              <div className="mt-8">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><span className="w-1 h-6 bg-indigo-500 rounded-full"></span>Mi Biblioteca</h2>
                  {resources.length === 0 ? (
                      <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-6 text-center text-slate-500 text-sm">Tu psicólogo aún no te ha enviado recursos.</div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {resources.map(res => (
                              <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-indigo-500 transition-colors group">
                                  <div className="flex items-start gap-3">
                                      <div className="text-2xl">{res.type === 'pdf' ? '📄' : res.type === 'image' ? '🖼️' : '🔗'}</div>
                                      <div>
                                          <h3 className="font-bold text-slate-200 text-sm group-hover:text-white">{res.title}</h3>
                                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{res.description}</p>
                                      </div>
                                  </div>
                              </a>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* Right Column: Tools */}
          <div>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><span className="w-1 h-6 bg-brand-500 rounded-full"></span>Herramientas</h2>
            <button onClick={() => onSelectTool('naretbox')} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-brand-500/50 transition-all text-left flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500 text-white rounded-xl flex items-center justify-center font-bold">N</div>
                <div><h3 className="font-bold text-slate-100">Naretbox</h3><p className="text-xs text-slate-400">Diario emocional.</p></div>
            </button>
          </div>
      </div>
    </div>
  );
};

export default ToolsHub;
