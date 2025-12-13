import React, { useState, useEffect } from 'react';
import { User, ViewState } from './types';
import LandingPage from './components/LandingPage';
import ToolsHub from './components/ToolsHub';
import NaretboxTool from './components/NaretboxTool';
import AdminDashboard from './components/AdminDashboard';
import PsychologistDashboard from './components/PsychologistDashboard';
import { logoutUser, getCurrentSession } from './services/mockAuthService';

// --- Sidebar Component (Desktop) ---
const Sidebar: React.FC<{ 
    currentView: ViewState, 
    onChangeView: (v: ViewState) => void,
    onLogout: () => void,
    role: string,
    psychActiveTab?: string,
    onPsychTabChange?: (tab: 'overview' | 'patients' | 'tools' | 'review') => void
}> = ({ currentView, onChangeView, onLogout, role, psychActiveTab, onPsychTabChange }) => {
    
    // Explicit handler to ensure navigation state updates correctly
    const handlePsychNav = (tab: 'overview' | 'patients' | 'tools' | 'review') => {
        // 1. Update the tab state first
        if (onPsychTabChange) {
            onPsychTabChange(tab);
        }
        // 2. Then ensure we are on the dashboard view
        if (currentView !== 'psych-dashboard') {
            onChangeView('psych-dashboard');
        }
    };

    return (
        <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 fixed inset-y-0 left-0 z-[100]">
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">N</div>
                <span className="font-bold text-white text-lg tracking-tight">NaretApp</span>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {role === 'patient' && (
                    <>
                        <button 
                            onClick={() => onChangeView('hub')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'hub' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Herramientas
                        </button>
                        <button 
                            onClick={() => onChangeView('tool-naretbox')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'tool-naretbox' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Naretbox
                        </button>
                    </>
                )}
                
                {role === 'psychologist' && onPsychTabChange && (
                    <>
                        <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 mb-1">Navegación</div>
                        <button 
                            onClick={() => handlePsychNav('overview')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'psych-dashboard' && psychActiveTab === 'overview' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Resumen
                        </button>
                        <button 
                            onClick={() => handlePsychNav('patients')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'psych-dashboard' && psychActiveTab === 'patients' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Pacientes
                        </button>
                        <button 
                            onClick={() => handlePsychNav('tools')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'psych-dashboard' && psychActiveTab === 'tools' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Herramientas
                        </button>
                        <button 
                            onClick={() => handlePsychNav('review')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'psych-dashboard' && psychActiveTab === 'review' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Resultados
                        </button>
                    </>
                )}

                {role === 'admin' && (
                    <button 
                        onClick={() => onChangeView('admin-dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentView === 'admin-dashboard' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Administración
                    </button>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="px-4 py-2 mb-2 text-xs text-slate-500 uppercase font-bold">
                    {role === 'admin' ? 'Administrador' : role === 'psychologist' ? 'Psicólogo' : 'Paciente'}
                </div>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

// --- Mobile Navigation Bar ---
const MobileNav: React.FC<{ 
    currentView: ViewState, 
    onChangeView: (v: ViewState) => void,
    role: string,
    psychActiveTab?: string,
    onPsychTabChange?: (tab: 'overview' | 'patients' | 'tools' | 'review') => void
}> = ({ currentView, onChangeView, role, psychActiveTab, onPsychTabChange }) => {
    
    const handlePsychNav = (tab: 'overview' | 'patients' | 'tools' | 'review') => {
        onChangeView('psych-dashboard');
        if (onPsychTabChange) onPsychTabChange(tab);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 pb-safe z-40">
            <div className="flex justify-around items-center px-4 py-3">
                {role === 'patient' && (
                    <>
                        <button 
                            onClick={() => onChangeView('hub')}
                            className={`flex flex-col items-center justify-center transition-colors ${currentView === 'hub' ? 'text-brand-400' : 'text-slate-500'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase">Inicio</span>
                        </button>
                        
                        <button 
                            onClick={() => onChangeView('tool-naretbox')}
                            className={`flex flex-col items-center justify-center transition-colors ${currentView === 'tool-naretbox' ? 'text-brand-400' : 'text-slate-500'}`}
                        >
                            <div className={`p-1 rounded-lg ${currentView === 'tool-naretbox' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/50' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold uppercase mt-1">Naretbox</span>
                        </button>
                    </>
                )}

                {role === 'psychologist' && (
                    <>
                        <button 
                            onClick={() => handlePsychNav('overview')}
                            className={`flex flex-col items-center justify-center transition-colors ${psychActiveTab === 'overview' ? 'text-brand-400' : 'text-slate-500'}`}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase">Resumen</span>
                        </button>
                         <button 
                            onClick={() => handlePsychNav('patients')}
                            className={`flex flex-col items-center justify-center transition-colors ${psychActiveTab === 'patients' ? 'text-brand-400' : 'text-slate-500'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase">Pacientes</span>
                        </button>
                        <button 
                            onClick={() => handlePsychNav('tools')}
                            className={`flex flex-col items-center justify-center transition-colors ${psychActiveTab === 'tools' ? 'text-brand-400' : 'text-slate-500'}`}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase">Herram.</span>
                        </button>
                        <button 
                            onClick={() => handlePsychNav('review')}
                            className={`flex flex-col items-center justify-center transition-colors ${psychActiveTab === 'review' ? 'text-brand-400' : 'text-slate-500'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase">Result.</span>
                        </button>
                    </>
                )}

                {role === 'admin' && (
                    <button 
                        onClick={() => onChangeView('admin-dashboard')}
                        className={`flex flex-col items-center justify-center transition-colors ${currentView === 'admin-dashboard' ? 'text-brand-400' : 'text-slate-500'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase">Admin</span>
                    </button>
                )}
            </div>
        </nav>
    );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [psychView, setPsychView] = useState<'overview' | 'patients' | 'tools' | 'review'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Initial Load with Async Check
  useEffect(() => {
    const initSession = async () => {
        try {
            const session = await getCurrentSession();
            if (session) {
                setUser(session);
                redirectBasedOnRole(session);
            }
        } catch (e) {
            console.error("Error al cargar sesión", e);
        } finally {
            setIsLoading(false);
        }
    };
    initSession();
  }, []);

  const redirectBasedOnRole = (u: User) => {
      if (u.role === 'admin') setCurrentView('admin-dashboard');
      else if (u.role === 'psychologist') setCurrentView('psych-dashboard');
      else setCurrentView('hub');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    redirectBasedOnRole(loggedInUser);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setCurrentView('landing');
  };

  const handleSelectTool = (tool: 'naretbox') => {
      setCurrentView(`tool-${tool}` as ViewState);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">N</div>
        </div>
        <span className="mt-4 text-sm font-medium animate-pulse">Iniciando NaretApp...</span>
    </div>;
  }

  if (!user || currentView === 'landing') {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500 selection:text-white flex">
      
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout} 
        role={user.role}
        psychActiveTab={psychView}
        onPsychTabChange={setPsychView}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen relative z-0">
         
         {/* Mobile Header (Only visible on small screens) */}
         <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
                <span className="font-bold text-white text-lg">NaretApp</span>
             </div>
             <button onClick={handleLogout} className="text-slate-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
         </header>

         <div className="p-6 flex-1 overflow-y-auto">
            {currentView === 'admin-dashboard' && <AdminDashboard />}
            
            {/* IMPORTANT: Key forces re-render on tab change to resolve navigation issues */}
            {currentView === 'psych-dashboard' && (
                <PsychologistDashboard 
                    key={psychView}
                    user={user} 
                    activeSection={psychView} 
                    onSectionChange={setPsychView} 
                />
            )}
            
            {currentView === 'hub' && (
                <ToolsHub onSelectTool={handleSelectTool} user={user} />
            )}
            
            {currentView === 'tool-naretbox' && (
                <NaretboxTool user={user} />
            )}
         </div>

         {/* Spacer for Mobile Nav */}
         <div className="h-16 md:hidden"></div>
      </main>

      <MobileNav 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        role={user.role} 
        psychActiveTab={psychView}
        onPsychTabChange={setPsychView}
      />
      
    </div>
  );
}