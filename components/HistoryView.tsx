import React from 'react';
import { Entry, BoxType } from '../types';
import { BOX_COLORS } from '../constants';

interface HistoryViewProps {
  entries: Entry[];
  onDelete: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ entries, onDelete }) => {
  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.dateStr]) {
      acc[entry.dateStr] = [];
    }
    acc[entry.dateStr].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-lg font-medium">Las cajas están vacías.</p>
        <p className="text-sm text-slate-500">Comienza a registrar tu día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {sortedDates.map((date, dateIndex) => (
        <div key={date} className="animate-slide-up" style={{ animationDelay: `${dateIndex * 100}ms` }}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1 sticky top-20 bg-slate-950/90 backdrop-blur py-2 z-10 border-b border-slate-800/50">
            {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="space-y-4">
            {groupedEntries[date].sort((a, b) => b.timestamp - a.timestamp).map((entry, entryIndex) => {
              const colors = BOX_COLORS[entry.type];
              return (
                <div 
                  key={entry.id} 
                  className={`relative overflow-hidden bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg flex justify-between items-start group transition-all hover:border-slate-600 hover:shadow-xl hover:-translate-y-1`}
                  style={{ animationDelay: `${(dateIndex * 100) + (entryIndex * 50)}ms` }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${entry.type === BoxType.POSITIVE ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  
                  <div className="flex-1 pl-2">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                            {entry.type === BoxType.POSITIVE ? 'Positiva' : 'Negativa'}
                        </span>
                        <span className="text-xs text-slate-500">
                           {new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                     <p className="text-slate-200 leading-relaxed text-base">{entry.text}</p>
                  </div>
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    title="Eliminar entrada"
                    aria-label="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryView;