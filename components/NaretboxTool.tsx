
import React, { useState, useEffect } from 'react';
import { Entry, BoxType, AppSettings, User, PatientReport } from '../types';
import { SETTINGS_STORAGE_KEY } from '../constants';
import { savePatientReport, getEntries, saveEntry as saveEntryDb, deleteEntry as deleteEntryDb } from '../services/dataService';
import EntryForm from './EntryForm';
import HistoryView from './HistoryView';
import BalanceView from './BalanceView';
import SettingsModal from './SettingsModal';

const WidgetButton: React.FC<{ type: BoxType; onClick: () => void }> = ({ type, onClick }) => {
    const isPositive = type === BoxType.POSITIVE;
    return (
        <button
            onClick={onClick}
            className={`
                relative w-full aspect-[4/5] md:aspect-video lg:aspect-square rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-xl transition-all active:scale-95 group hover:shadow-2xl border
                ${isPositive 
                    ? 'bg-gradient-to-br from-emerald-800 to-emerald-950 border-emerald-700/30' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600/30'
                }
            `}
        >
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-opacity duration-500 ${isPositive ? 'bg-emerald-500/20 group-hover:opacity-40' : 'bg-slate-400/10 group-hover:opacity-20'}`}></div>
            
            <div className={`z-10 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-110 ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>
                {isPositive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                )}
            </div>
            
            <div className="z-10 text-left">
                <h3 className={`text-2xl font-bold leading-tight mb-1 ${isPositive ? 'text-emerald-100' : 'text-slate-200'}`}>
                    {isPositive ? 'Positiva' : 'Negativa'}
                </h3>
                <p className={`text-xs font-medium uppercase tracking-wide opacity-70 ${isPositive ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {isPositive ? 'Registrar lo bueno' : 'Soltar lo malo'}
                </p>
            </div>
        </button>
    )
}

interface NaretboxToolProps {
    user: User;
}

const NaretboxTool: React.FC<NaretboxToolProps> = ({ user }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'balance'>('home');
  const [activeModal, setActiveModal] = useState<BoxType | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    notificationTime: '20:00',
    notificationsEnabled: false
  });
  
  // Report State
  const [isSending, setIsSending] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Daily Reset Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.dateStr === todayStr);

  // Load Data
  useEffect(() => {
    const fetchEntries = async () => {
        const data = await getEntries(user.id);
        setEntries(data);
    };
    fetchEntries();

    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [user.id]);

  // Notification Logic
  useEffect(() => {
    const checkNotification = () => {
      if (!settings.notificationsEnabled) return;
      
      const now = new Date();
      const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      if (currentTime === settings.notificationTime) {
          const lastNotified = sessionStorage.getItem('last_notified_time');
          if (lastNotified !== currentTime) {
              if (Notification.permission === 'granted') {
                  new Notification("Naretbox: Balance del Día", {
                      body: "Tómate un momento para revisar tus cajas y encontrar tu balance.",
                      icon: "/favicon.ico",
                      tag: 'daily-balance'
                  });
              }
              sessionStorage.setItem('last_notified_time', currentTime);
          }
      }
    };

    const interval = setInterval(checkNotification, 10000); 
    return () => clearInterval(interval);
  }, [settings]);

  const saveEntry = async (text: string, type: BoxType) => {
    const newEntryPart: Omit<Entry, 'id'> = {
      text,
      type,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0]
    };
    
    // Optimistic update
    const tempId = crypto.randomUUID();
    const tempEntry = { ...newEntryPart, id: tempId };
    setEntries(prev => [...prev, tempEntry]);

    try {
        await saveEntryDb(user.id, newEntryPart);
        // Reload to get real ID
        const fresh = await getEntries(user.id);
        setEntries(fresh);
    } catch (e) {
        console.error(e);
        // Rollback on error
        setEntries(prev => prev.filter(p => p.id !== tempId));
        alert("Error al guardar en la nube.");
    }
  };

  const deleteEntry = async (id: string) => {
    // Optimistic delete
    const backup = entries;
    setEntries(prev => prev.filter(e => e.id !== id));
    
    try {
        await deleteEntryDb(id);
    } catch(e) {
        console.error(e);
        setEntries(backup);
        alert("Error al borrar.");
    }
  }

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleSendReport = async () => {
    if (!user.assignedPsychologistId) {
        alert("No tienes un psicólogo asignado para enviar reportes.");
        return;
    }

    if (todayEntries.length === 0) {
        if(!confirm("No hay entradas de hoy. ¿Quieres enviar un reporte vacío o de días anteriores?")) {
            return;
        }
    }

    setIsSending(true);

    const positives = todayEntries.filter(e => e.type === BoxType.POSITIVE).map(e => e.text);
    const negatives = todayEntries.filter(e => e.type === BoxType.NEGATIVE).map(e => e.text);

    // 1. SAVE TO DATABASE (Internal App Communication)
    const report: PatientReport = {
        id: crypto.randomUUID(),
        patientId: user.id,
        psychologistId: user.assignedPsychologistId,
        date: Date.now(),
        content: {
            positives,
            negatives,
            summary: `Reporte generado con ${positives.length} entradas positivas y ${negatives.length} negativas.`
        },
        wasEmailed: false // Sent internally
    };
    
    try {
        await savePatientReport(report);
        setReportSuccess(true);
        setTimeout(() => setReportSuccess(false), 4000);
    } catch(e) {
        console.error("Error saving report", e);
        alert("Hubo un error al enviar el informe. Por favor intenta de nuevo.");
    } finally {
        setIsSending(false);
    }
  };

  // Internal Navigation for Mobile/Desktop
  const NavButton = ({ tab, label }: { tab: typeof activeTab, label: string }) => (
     <button 
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
     >
        {label}
     </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8 animate-fade-in relative">
        
      {/* Success Notification */}
      {reportSuccess && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-up flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
              </div>
              <div>
                  <p className="font-bold">¡Informe Enviado!</p>
                  <p className="text-xs text-emerald-100">Tu psicólogo ha recibido tu balance diario.</p>
              </div>
          </div>
      )}

      {/* Tool Header (Desktop friendly sub-nav) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-sm">N</span>
                Naretbox
            </h2>
            <p className="text-slate-400 text-sm">Registro emocional diario.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-full border border-slate-800 self-start md:self-auto">
            <NavButton tab="home" label="Inicio" />
            <NavButton tab="history" label="Historial" />
            <NavButton tab="balance" label="Balance" />
        </div>

        <div className="flex items-center gap-2 absolute top-0 right-0 md:relative">
            <button 
                onClick={handleSendReport}
                disabled={isSending}
                title="Enviar reporte al psicólogo"
                className={`p-2 transition-colors rounded-full ${isSending ? 'text-brand-500 bg-brand-900/20' : 'text-slate-400 hover:text-brand-400 hover:bg-slate-800'}`}
            >
                {isSending ? (
                     <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'home' && (
            <div className="animate-fade-in space-y-10">
                <div className="grid grid-cols-2 gap-6 md:gap-10 max-w-2xl mx-auto">
                    <WidgetButton type={BoxType.POSITIVE} onClick={() => setActiveModal(BoxType.POSITIVE)} />
                    <WidgetButton type={BoxType.NEGATIVE} onClick={() => setActiveModal(BoxType.NEGATIVE)} />
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800/50 max-w-2xl mx-auto">
                    <div className="flex justify-between items-end mb-5">
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Entradas de Hoy</h3>
                         {todayEntries.length > 0 && (
                            <button onClick={() => setActiveTab('history')} className="text-xs text-brand-400 font-bold hover:text-brand-300">Ver historial completo</button>
                        )}
                    </div>
                    
                    {/* Only show entries for TODAY here to enforce the "reset" feel */}
                    {todayEntries.length === 0 ? (
                        <div className="text-center py-6 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-slate-300 font-bold">¡Un nuevo día comienza!</p>
                                <p className="text-slate-500 text-sm mt-1">Tus cajas se han reiniciado. ¿Qué hay de nuevo hoy?</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayEntries
                                .sort((a,b) => b.timestamp - a.timestamp)
                                .map(entry => (
                                <div key={entry.id} className="flex items-center gap-4 text-sm p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.type === BoxType.POSITIVE ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></div>
                                    <p className="truncate text-slate-300 flex-1">{entry.text}</p>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {new Date(entry.timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <HistoryView entries={entries} onDelete={deleteEntry} />
            </div>
        )}

        {activeTab === 'balance' && (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <BalanceView 
                    entries={entries} 
                    onSendReport={handleSendReport} 
                    hasPsychologist={!!user.assignedPsychologistId}
                />
            </div>
        )}
      </div>

      {/* Entry Modal */}
      {activeModal && (
          <EntryForm 
            type={activeModal} 
            onClose={() => setActiveModal(null)} 
            onSave={saveEntry}
          />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings}
        onSave={saveSettings}
      />
    </div>
  );
};

export default NaretboxTool;
