import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    setLocalSettings(settings);
    if(typeof Notification !== 'undefined') {
        setPermissionStatus(Notification.permission);
    }
  }, [settings, isOpen]);

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones.");
      return;
    }
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === 'granted') {
      setLocalSettings(prev => ({ ...prev, notificationsEnabled: true }));
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 animate-scale-in">
        <div className="bg-slate-900 p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-200">Configuración</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-6 space-y-8">
            
            {/* Time Setting */}
            <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Hora del Balance</label>
                <div className="relative">
                    <input 
                        type="time" 
                        value={localSettings.notificationTime}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, notificationTime: e.target.value }))}
                        className="bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-2xl w-full focus:ring-2 focus:ring-indigo-500 outline-none block text-center"
                    />
                </div>
            </div>

            {/* Notification Toggle */}
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Notificaciones Push</span>
                    <button 
                        onClick={() => {
                            if (permissionStatus !== 'granted' && !localSettings.notificationsEnabled) {
                                handleRequestPermission();
                            } else {
                                setLocalSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));
                            }
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${localSettings.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localSettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <p className="text-xs text-slate-500">
                    Recibe un aviso en tu móvil o PC para no olvidar llenar tus cajas.
                </p>

                {localSettings.notificationsEnabled && permissionStatus !== 'granted' && (
                    <button 
                        onClick={handleRequestPermission}
                        className="mt-3 w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-2 rounded-lg font-bold text-xs hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                             <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        Activar Permisos del Navegador
                    </button>
                )}
            </div>
        </div>

        <div className="p-4 bg-slate-900/50 flex justify-end">
            <button 
                onClick={handleSave}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-500 transition-colors"
            >
                Guardar
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;