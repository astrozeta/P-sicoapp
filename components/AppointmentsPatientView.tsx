
import React, { useState, useEffect } from 'react';
import { Appointment, User } from '../types';
import { getAppointments, createAppointment, deleteAppointmentSlot } from '../services/dataService';

interface Props {
    user: User;
    onClose: () => void;
}

const AppointmentsPatientView: React.FC<Props> = ({ user, onClose }) => {
    const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
    const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'my_appointments' | 'book_new'>('my_appointments');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        if (!user.assignedPsychologistId) {
            setIsLoading(false);
            return;
        }

        const allAppointments = await getAppointments(user.id, 'patient');
        
        // 1. Separate my appointments
        const mine = allAppointments.filter(a => a.status === 'booked' && a.patientId === user.id);
        setMyAppointments(mine);

        // 2. Generate Available Slots
        const slots: Date[] = [];
        const today = new Date();
        // Generate for next 14 days
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Skip Weekends (0 = Sunday, 6 = Saturday)
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            // Generate 9:00 to 18:00 (Start times)
            for (let hour = 9; hour < 18; hour++) {
                const slotTime = new Date(date);
                slotTime.setHours(hour, 0, 0, 0);
                const slotTimestamp = slotTime.getTime();

                // Check if this time overlaps with ANY existing appointment (booked or blocked)
                const isOccupied = allAppointments.some(appt => {
                    const start = appt.startTime;
                    const end = appt.endTime;
                    // Overlap check: SlotStart < ApptEnd && SlotEnd > ApptStart
                    // Standard 1 hour slots
                    const slotEnd = slotTimestamp + 3600000; 
                    return (slotTimestamp < end && slotEnd > start);
                });

                if (!isOccupied) {
                    slots.push(slotTime);
                }
            }
        }
        setAvailableSlots(slots);
        setIsLoading(false);
    };

    const handleBook = async (slotDate: Date) => {
        if (!confirm(`¿Confirmar reserva para el ${slotDate.toLocaleString()}?`)) return;
        
        if (!user.assignedPsychologistId) return;

        try {
            await createAppointment({
                psychologistId: user.assignedPsychologistId,
                patientId: user.id,
                startTime: slotDate.getTime(),
                endTime: slotDate.getTime() + 3600000, // 1 hour
                status: 'booked',
                meetLink: 'https://meet.google.com/new' // Placeholder
            });
            alert("Cita reservada con éxito.");
            loadData();
            setView('my_appointments');
        } catch (e) {
            console.error(e);
            alert("Error al reservar. Puede que el hueco ya no esté disponible.");
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;
        try {
            await deleteAppointmentSlot(id); // Effectively cancelling simply removes the record in this model
            alert("Cita cancelada.");
            loadData();
        } catch (e) {
            alert("Error al cancelar.");
        }
    };

    // Group available slots by date string for UI
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        const dateKey = slot.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {} as Record<string, Date[]>);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-slide-up" onClick={onClose}>
            <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white">Gestión de Citas</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white px-3 py-2 bg-slate-800 rounded-lg">Cerrar</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setView('my_appointments')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${view === 'my_appointments' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        Mis Citas Programadas
                    </button>
                    <button 
                        onClick={() => setView('book_new')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${view === 'book_new' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        Reservar Nueva
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center text-slate-500 py-10">Cargando agenda...</div>
                ) : (
                    <>
                        {view === 'my_appointments' && (
                            <div className="space-y-4">
                                {myAppointments.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                                        <p className="text-slate-400 mb-2">No tienes citas próximas.</p>
                                        <button onClick={() => setView('book_new')} className="text-indigo-400 font-bold hover:underline">Reservar ahora</button>
                                    </div>
                                ) : (
                                    myAppointments.map(app => (
                                        <div key={app.id} className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                                    <p className="text-white font-bold text-lg">
                                                        {new Date(app.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                                <p className="text-slate-400">
                                                    {new Date(app.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(app.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {app.meetLink && (
                                                    <a href={app.meetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400 text-sm mt-2 font-bold hover:underline">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                        Unirse a Videollamada
                                                    </a>
                                                )}
                                            </div>
                                            <button onClick={() => handleCancel(app.id)} className="text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm hover:bg-red-500/10">
                                                Cancelar
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {view === 'book_new' && (
                            <div className="space-y-6">
                                {!user.assignedPsychologistId ? (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-center">
                                        No tienes un psicólogo asignado. Contacta con soporte.
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                                        <p className="text-slate-400">No hay huecos disponibles en los próximos 14 días.</p>
                                    </div>
                                ) : (
                                    Object.entries(slotsByDate).map(([dateStr, slots]) => (
                                        <div key={dateStr} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                            <div className="bg-slate-950/50 p-3 border-b border-slate-800">
                                                <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">{dateStr}</h3>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {slots.map(slot => (
                                                    <button 
                                                        key={slot.getTime()}
                                                        onClick={() => handleBook(slot)}
                                                        className="bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 py-3 px-2 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-indigo-500 flex flex-col items-center gap-1 group"
                                                    >
                                                        <span>{slot.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-[10px] text-slate-500 group-hover:text-indigo-200">Disponible</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AppointmentsPatientView;
