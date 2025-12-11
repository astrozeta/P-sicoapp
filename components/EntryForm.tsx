import React, { useState } from 'react';
import { BoxType } from '../types';
import { BOX_COLORS } from '../constants';

interface EntryFormProps {
  type: BoxType;
  onClose: () => void;
  onSave: (text: string, type: BoxType) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ type, onClose, onSave }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text, type);
      onClose();
    }
  };

  const isPositive = type === BoxType.POSITIVE;
  const colors = BOX_COLORS[type];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-md bg-slate-900 md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up border border-slate-700/50`}>
        <div className={`${colors.bg} p-6 border-b ${colors.border}`}>
          <div className="flex justify-between items-start">
            <div>
                <h2 className={`text-2xl font-bold ${colors.textHeader} flex items-center gap-2`}>
                    {isPositive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    )}
                    {isPositive ? 'Caja Positiva' : 'Caja Negativa'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    {isPositive ? 'Guarda ese momento especial.' : 'Libera ese pensamiento.'}
                </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-slate-900">
          <textarea
            autoFocus
            className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-opacity-50 focus:outline-none resize-none text-lg leading-relaxed h-40 transition-all ${colors.inputBg} ${colors.inputBorder} ${colors.placeholder} text-slate-100 focus:ring-${isPositive ? 'emerald-500' : 'slate-500'}`}
            placeholder={isPositive ? "Describe qué ha pasado..." : "Describe qué ha pasado..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="submit"
              disabled={!text.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${!text.trim() ? 'opacity-50 cursor-not-allowed bg-slate-700' : colors.icon}`}
            >
              <span>Guardar</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryForm;