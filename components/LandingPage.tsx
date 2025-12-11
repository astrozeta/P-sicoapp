import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/mockAuthService';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let user;
      if (isRegister) {
        if (!name.trim()) throw new Error("El nombre es obligatorio.");
        user = await registerUser(name, email, password);
      } else {
        user = await loginUser(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row">
      {/* Left Side: Marketing */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-900/20 to-slate-900/20 z-0"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] z-0"></div>
         
         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-brand-500/30">N</div>
                <h1 className="text-3xl font-bold tracking-tight text-white">NaretApp</h1>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-100 leading-tight">
                Tu espacio para el <br/>
                <span className="text-brand-500">bienestar mental.</span>
            </h2>
            
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                Un hub de herramientas psicológicas diseñadas para ayudarte a gestionar emociones, mejorar tu autoconocimiento y mantener el contacto con tu especialista.
            </p>

            <div className="flex gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Naretbox
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    Contacto Profesional
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                    IA Insights
                </div>
            </div>
         </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="md:w-1/2 bg-slate-900 border-l border-slate-800 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">{isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h3>
                <p className="text-slate-400 mt-2 text-sm">
                    {isRegister ? 'Comienza tu viaje de autodescubrimiento.' : 'Accede a tus herramientas guardadas.'}
                </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {isRegister && (
                    <div className="animate-slide-up">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nombre Completo</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all placeholder-slate-600"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all placeholder-slate-600"
                        placeholder="tu@email.com"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contraseña</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all placeholder-slate-600"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.99] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? 'Procesando...' : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
                </button>
            </form>

            <div className="text-center pt-4">
                <button 
                    onClick={() => {
                        setIsRegister(!isRegister);
                        setError(null);
                    }}
                    className="text-sm text-slate-400 hover:text-white transition-colors underline decoration-slate-700 hover:decoration-white"
                >
                    {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;