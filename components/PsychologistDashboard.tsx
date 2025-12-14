
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { User, SurveyTemplate, QuestionType, SurveyQuestion, PatientReport, SurveyAssignment, EducationalResource, ClinicalProfile, ClinicalSession, TreatmentGoal, FinancialRecord, Reminder, Appointment } from '../types';
import { getMyPatients, registerUser } from '../services/mockAuthService';
import { 
    saveSurveyTemplate, getTemplatesByPsychologist, assignSurveyToPatient, getReportsForPatient, getAssignmentsByPsychologist, getReportsByPsychologist, getAllSurveysForPatient, saveResource, getResourcesByPsychologist, assignResourceToPatient,
    // New Services
    updatePatientBasicInfo, getClinicalProfile, saveClinicalProfile, getClinicalSessions, saveClinicalSession, getTreatmentGoals, saveTreatmentGoal, updateTreatmentGoalStatus, getFinancials, saveFinancialRecord, getReminders, saveReminder,
    // Appointments
    getAppointments, createAppointment, deleteAppointmentSlot
} from '../services/dataService';
import { INITIAL_MENTAL_HEALTH_ASSESSMENT, BDI_II_ASSESSMENT } from '../constants';
import { calculateMentalHealthScore, calculateBDIScore } from '../services/scoringService';

interface Props {
    user: User;
    activeSection: 'overview' | 'patients' | 'tools' | 'review' | 'schedule';
    onSectionChange: (section: 'overview' | 'patients' | 'tools' | 'review' | 'schedule') => void;
}

const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: React.ReactNode; colorClass: string; onClick?: () => void }> = ({ title, value, subtitle, icon, colorClass, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 transition-all shadow-lg ${onClick ? 'cursor-pointer hover:border-brand-500/50 hover:-translate-y-1 hover:shadow-brand-900/10' : ''}`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{title}</p>
            {subtitle && <p className="text-[10px] text-slate-600 mt-1">{subtitle}</p>}
        </div>
    </div>
);

const SurveyResultView: React.FC<{ assignment: SurveyAssignment, templates: SurveyTemplate[] }> = ({ assignment, templates }) => {
    const staticTemplates = [INITIAL_MENTAL_HEALTH_ASSESSMENT, BDI_II_ASSESSMENT];
    const template = templates.find(t => t.id === assignment.templateId) || staticTemplates.find(t => t.id === assignment.templateId);

    if (!template) return <div className="text-slate-400 p-4">Plantilla no encontrada para esta asignación.</div>;

    // Calculate score if applicable
    let scoreDisplay = null;
    if (assignment.responses) {
        if (template.id === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) {
            const res = calculateMentalHealthScore(assignment.responses);
            scoreDisplay = (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h4 className="text-white font-bold mb-2">Resultados de Evaluación</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-2 bg-slate-900 rounded-lg"><p className="text-xs text-slate-500 uppercase">Depresión</p><p className={`font-bold ${res.depression.color}`}>{res.depression.level}</p></div>
                        <div className="p-2 bg-slate-900 rounded-lg"><p className="text-xs text-slate-500 uppercase">Ansiedad</p><p className={`font-bold ${res.anxiety.color}`}>{res.anxiety.level}</p></div>
                        <div className="p-2 bg-slate-900 rounded-lg"><p className="text-xs text-slate-500 uppercase">Estrés</p><p className={`font-bold ${res.stress.color}`}>{res.stress.level}</p></div>
                    </div>
                    {res.redFlags.length > 0 && <div className="mt-3 p-2 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">⚠️ {res.redFlags.join(', ')}</div>}
                </div>
            );
        } else if (template.id === BDI_II_ASSESSMENT.id) {
            const res = calculateBDIScore(assignment.responses);
            scoreDisplay = (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                        <h4 className="text-white font-bold">Puntaje BDI-II</h4>
                        <p className={`text-xl font-bold ${res.color}`}>{res.level}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-white">{res.score}</p>
                        <p className="text-xs text-slate-500 uppercase">Total</p>
                    </div>
                    {res.hasSuicidalRisk && <div className="mt-3 p-2 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30 w-full col-span-2 text-center font-bold">⚠️ RIESGO DE SUICIDIO DETECTADO</div>}
                </div>
            );
        }
    }

    return (
        <div className="space-y-6">
            {scoreDisplay}
            {template.questions.map((q, idx) => {
                const response = assignment.responses?.find(r => r.questionId === q.id);
                return (
                    <div key={q.id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pregunta {idx + 1}</span>
                             {q.section && <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">{q.section}</span>}
                        </div>
                        <p className="text-white font-medium mb-3">{q.text}</p>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-brand-400 font-bold text-sm">Respuesta: </span>
                            <span className="text-slate-200 text-sm">{response ? String(response.answer) : 'Sin respuesta'}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const PsychologistDashboard: React.FC<Props> = ({ user, activeSection, onSectionChange }) => {
    // --- MAIN STATE ---
    const [patients, setPatients] = useState<User[]>([]);
    const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
    const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
    const [allReports, setAllReports] = useState<PatientReport[]>([]);
    const [resources, setResources] = useState<EducationalResource[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    // Tools Sub-Tab
    const [toolSubTab, setToolSubTab] = useState<'surveys' | 'resources'>('surveys');
    
    // Schedule Sub-Tab (Visual vs List)
    const [scheduleViewType, setScheduleViewType] = useState<'calendar' | 'list'>('calendar');

    // Patient Search
    const [patientSearchTerm, setPatientSearchTerm] = useState('');

    // Create Patient State
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [pName, setPName] = useState('');
    const [pSurnames, setPSurnames] = useState('');
    const [pEmail, setPEmail] = useState('');
    const [pPhone, setPPhone] = useState('');
    const [pPassword, setPPassword] = useState('');
    const [createMsg, setCreateMsg] = useState('');
    
    // Builder State
    const [isBuilderMode, setIsBuilderMode] = useState(false);
    const [newTemplateTitle, setNewTemplateTitle] = useState('');
    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    
    // Resource State
    const [isResourceMode, setIsResourceMode] = useState(false);
    const [resTitle, setResTitle] = useState('');
    const [resDesc, setResDesc] = useState('');
    const [resType, setResType] = useState<'image' | 'pdf' | 'video' | 'link'>('image');
    const [resUrl, setResUrl] = useState('');

    // Appointment Calendar State
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

    // --- PATIENT MODAL / CLINICAL RECORD STATE ---
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [isViewingPatientDetails, setIsViewingPatientDetails] = useState(false);
    const [activeRecordTab, setActiveRecordTab] = useState<'general' | 'clinical' | 'treatment' | 'evaluations' | 'admin'>('general');
    
    // Loaded Data for Selected Patient
    const [currentPatient, setCurrentPatient] = useState<User | null>(null);
    const [clinicalProfile, setClinicalProfile] = useState<ClinicalProfile | null>(null);
    const [sessions, setSessions] = useState<ClinicalSession[]>([]);
    const [goals, setGoals] = useState<TreatmentGoal[]>([]);
    const [financials, setFinancials] = useState<FinancialRecord[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [selectedPatientReports, setSelectedPatientReports] = useState<PatientReport[]>([]);
    const [patientSurveys, setPatientSurveys] = useState<SurveyAssignment[]>([]);

    // Forms State (Inside Modal)
    const [isEditingBasic, setIsEditingBasic] = useState(false);
    const [basicForm, setBasicForm] = useState<Partial<User>>({});
    
    const [isEditingClinical, setIsEditingClinical] = useState(false);
    const [clinicalForm, setClinicalForm] = useState<Partial<ClinicalProfile>>({});
    
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [sessionForm, setSessionForm] = useState<Partial<ClinicalSession>>({});

    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [goalForm, setGoalForm] = useState({ desc: '', type: 'short_term' });

    const [isAddingFinance, setIsAddingFinance] = useState(false);
    const [financeForm, setFinanceForm] = useState<Partial<FinancialRecord>>({});

    const [isAddingReminder, setIsAddingReminder] = useState(false);
    const [reminderForm, setReminderForm] = useState({ title: '', date: '' });

    // Assignment & Viewing
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    const [assignMsg, setAssignMsg] = useState('');
    const [selectedReport, setSelectedReport] = useState<PatientReport | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<SurveyAssignment | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<SurveyTemplate | null>(null);

    // Review Tab Filter
    const [filterRisk, setFilterRisk] = useState(false);

    // --- EFFECTS ---

    useEffect(() => {
        fetchGlobalData();
        // Set week start to current Monday
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0,0,0,0);
        setCurrentWeekStart(d);
    }, [user.id, activeSection]);

    // Load Patient Specific Data when Modal Opens
    useEffect(() => {
        if (selectedPatientId && isViewingPatientDetails) {
            loadPatientRecord(selectedPatientId);
        }
    }, [selectedPatientId, isViewingPatientDetails]);

    const fetchGlobalData = async () => {
        try {
            const myPatients = await getMyPatients(user.id);
            setPatients(myPatients);
            const myTemplates = await getTemplatesByPsychologist(user.id);
            setTemplates(myTemplates);
            const myAssignments = await getAssignmentsByPsychologist(user.id);
            setAssignments(myAssignments);
            const myReports = await getReportsByPsychologist(user.id);
            setAllReports(myReports);
            const myResources = await getResourcesByPsychologist(user.id);
            setResources(myResources);
            const myApps = await getAppointments(user.id, 'psychologist');
            setAppointments(myApps);
        } catch (error) { console.error(error); }
    };

    const loadPatientRecord = async (pid: string) => {
        const p = patients.find(u => u.id === pid);
        setCurrentPatient(p || null);
        setBasicForm(p || {});

        const cProfile = await getClinicalProfile(pid);
        setClinicalProfile(cProfile);
        setClinicalForm(cProfile || { riskLevel: 'Bajo' });

        const sess = await getClinicalSessions(pid);
        setSessions(sess);

        const g = await getTreatmentGoals(pid);
        setGoals(g);

        const f = await getFinancials(pid);
        setFinancials(f);

        const r = await getReminders(pid);
        setReminders(r);

        const reps = await getReportsForPatient(pid);
        setSelectedPatientReports(reps);

        const sur = await getAllSurveysForPatient(pid);
        setPatientSurveys(sur);
    };

    // --- ACTIONS ---

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerUser(pName, pEmail, pPassword, 'patient', user.id, pSurnames, pPhone);
            setCreateMsg('Paciente registrado con éxito');
            await fetchGlobalData();
            setPName(''); setPSurnames(''); setPEmail(''); setPPhone(''); setPPassword('');
            setTimeout(() => { setCreateMsg(''); setIsCreatingPatient(false); }, 2000);
        } catch (error: any) { setCreateMsg('Error: ' + error.message); }
    };

    const handleCreateTemplate = async () => {
        if(!newTemplateTitle.trim() || questions.length === 0) return;
        const temp: SurveyTemplate = {
            id: crypto.randomUUID(),
            psychologistId: user.id,
            title: newTemplateTitle,
            description: 'Plantilla personalizada',
            questions,
            createdAt: Date.now()
        };
        await saveSurveyTemplate(temp);
        await fetchGlobalData();
        setIsBuilderMode(false); setNewTemplateTitle(''); setQuestions([]);
    };

    const handleCreateResource = async () => {
        if(!resTitle || !resUrl) return;
        await saveResource({
            id: crypto.randomUUID(),
            psychologistId: user.id,
            title: resTitle,
            description: resDesc,
            type: resType,
            url: resUrl,
            createdAt: Date.now()
        });
        await fetchGlobalData();
        setIsResourceMode(false); setResTitle(''); setResDesc(''); setResUrl('');
    };

    // --- CALENDAR LOGIC ---

    const handlePrevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const handleSlotClick = async (date: Date, existingAppt?: Appointment) => {
        if (existingAppt) {
            if (confirm(existingAppt.status === 'booked' 
                ? `¿Cancelar la cita con ${getPatientName(existingAppt.patientId || '')}?` 
                : "¿Desbloquear este horario?")) {
                try {
                    await deleteAppointmentSlot(existingAppt.id);
                    await fetchGlobalData();
                } catch(e) { alert("Error al eliminar."); }
            }
        } else {
            // Block logic for empty slot
            if (confirm(`¿Bloquear el horario del ${date.toLocaleString()}?`)) {
                 try {
                    await createAppointment({
                        psychologistId: user.id,
                        startTime: date.getTime(),
                        endTime: date.getTime() + 3600000, // 1 hour block
                        status: 'blocked' 
                    });
                    await fetchGlobalData();
                } catch(e) { alert("Error al bloquear horario."); }
            }
        }
    };

    // Generate week days
    const weekDays = useMemo(() => {
        const days = [];
        for(let i=0; i<5; i++) { // Mon-Fri
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentWeekStart]);

    // Save Basic Info
    const saveBasicInfo = async () => {
        if (!selectedPatientId) return;
        try {
            await updatePatientBasicInfo(selectedPatientId, basicForm);
            setIsEditingBasic(false);
            const updatedPatients = patients.map(p => p.id === selectedPatientId ? { ...p, ...basicForm } : p);
            setPatients(updatedPatients);
            setCurrentPatient(prev => prev ? ({ ...prev, ...basicForm }) : null);
        } catch (e) { alert("Error al guardar información básica"); }
    };

    const saveClinicalInfo = async () => {
        if (!selectedPatientId) return;
        try {
            const profileToSave = { ...clinicalForm, userId: selectedPatientId };
            if(typeof profileToSave.preexistingConditions === 'string') {
                profileToSave.preexistingConditions = (profileToSave.preexistingConditions as string).split(',').map((s: string) => s.trim());
            }
            await saveClinicalProfile(profileToSave);
            setClinicalProfile(profileToSave as ClinicalProfile);
            setIsEditingClinical(false);
        } catch (e) { alert("Error al guardar perfil clínico"); }
    };

    const addSession = async () => {
        if (!selectedPatientId) return;
        try {
            await saveClinicalSession({
                patientId: selectedPatientId,
                psychologistId: user.id,
                date: sessionForm.date ? new Date(sessionForm.date as any).getTime() : Date.now(),
                objectives: sessionForm.objectives || '',
                summary: sessionForm.summary || '',
                notes: sessionForm.notes || '',
                progress: sessionForm.progress || 0,
                nextSteps: sessionForm.nextSteps || ''
            });
            const fresh = await getClinicalSessions(selectedPatientId);
            setSessions(fresh);
            setIsAddingSession(false);
            setSessionForm({});
        } catch (e) { alert("Error al guardar sesión"); }
    };

    const addGoal = async () => {
        if (!selectedPatientId) return;
        try {
            await saveTreatmentGoal({
                patientId: selectedPatientId,
                description: goalForm.desc,
                type: goalForm.type as any,
                status: 'pending',
                createdAt: Date.now()
            });
            const fresh = await getTreatmentGoals(selectedPatientId);
            setGoals(fresh);
            setIsAddingGoal(false);
            setGoalForm({ desc: '', type: 'short_term' });
        } catch (e) { alert("Error al añadir objetivo"); }
    };

    const addFinance = async () => {
        if (!selectedPatientId) return;
        try {
            await saveFinancialRecord({
                patientId: selectedPatientId,
                date: financeForm.date ? new Date(financeForm.date as any).getTime() : Date.now(),
                concept: financeForm.concept || 'Sesión Terapia',
                amount: financeForm.amount || 0,
                status: financeForm.status as any || 'pending',
                method: financeForm.method as any || 'card'
            });
            const fresh = await getFinancials(selectedPatientId);
            setFinancials(fresh);
            setIsAddingFinance(false);
            setFinanceForm({});
        } catch (e) { alert("Error al guardar registro financiero"); }
    };

    const addReminder = async () => {
        if(!selectedPatientId) return;
        try {
             await saveReminder({
                 patientId: selectedPatientId,
                 psychologistId: user.id,
                 title: reminderForm.title,
                 date: new Date(reminderForm.date).getTime(),
                 isCompleted: false
             });
             const fresh = await getReminders(selectedPatientId);
             setReminders(fresh);
             setIsAddingReminder(false);
             setReminderForm({ title: '', date: '' });
        } catch(e) { alert("Error al crear recordatorio"); }
    };

    const handleAssign = async () => {
        if (!selectedPatientId || !selectedTemplateId) {
            alert("Selecciona un paciente y una plantilla.");
            return;
        }
        
        const staticTemplates = [INITIAL_MENTAL_HEALTH_ASSESSMENT, BDI_II_ASSESSMENT];
        const template = templates.find(t => t.id === selectedTemplateId) || staticTemplates.find(t => t.id === selectedTemplateId);
        
        if (!template) {
            alert("Error: Plantilla no encontrada.");
            return;
        }

        try {
            await assignSurveyToPatient(template, selectedPatientId, user.id);
            alert("Evaluación asignada correctamente.");
            const sur = await getAllSurveysForPatient(selectedPatientId);
            setPatientSurveys(sur);
            setSelectedTemplateId('');
        } catch (e) {
            alert("Error al asignar la evaluación.");
            console.error(e);
        }
    };

    const modalStats = useMemo(() => {
        const naretData = (selectedPatientReports || [])
            .sort((a, b) => a.date - b.date)
            .slice(-7)
            .map(r => ({
                date: new Date(r.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
                Positivo: r.content.positives.length,
                Negativo: r.content.negatives.length
            }));

        const bdiData = (patientSurveys || [])
            .filter(s => s.status === 'completed' && s.templateId === BDI_II_ASSESSMENT.id && s.responses)
            .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))
            .map(s => ({
                date: new Date(s.completedAt || 0).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
                score: calculateBDIScore(s.responses!).score
            }));

        return { naretData, bdiData };
    }, [selectedPatientReports, patientSurveys]);

    const activeTasks = useMemo(() => patientSurveys.filter(s => s.status === 'pending'), [patientSurveys]);

    // Filter appointments for Today
    const todaysAppointments = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 86400000;

        return appointments
            .filter(a => a.startTime >= startOfDay && a.startTime < endOfDay)
            .sort((a, b) => a.startTime - b.startTime);
    }, [appointments]);

    const getPatientName = (id: string) => { const p = patients.find(pat => pat.id === id); return p ? `${p.name} ${p.surnames || ''}` : 'Usuario desconocido'; };
    const displayTemplates = templates.filter(t => t.id !== INITIAL_MENTAL_HEALTH_ASSESSMENT.id && t.id !== BDI_II_ASSESSMENT.id);

    return (
        <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto pb-24 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Panel del Psicólogo</h1>
                    <p className="text-slate-400 mt-1">Gestión integral de pacientes y herramientas.</p>
                </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeSection === 'overview' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard 
                            title="Total Pacientes" 
                            value={patients.length} 
                            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} 
                            colorClass="bg-brand-500/20 text-brand-400"
                        />
                         <StatCard 
                            title="Informes Recibidos" 
                            value={allReports.length} 
                            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
                            colorClass="bg-emerald-500/20 text-emerald-400"
                        />
                    </div>

                    {/* TODAY'S AGENDA WIDGET */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Agenda de Hoy
                            </h3>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>

                        {todaysAppointments.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                                <div className="inline-flex p-3 rounded-full bg-slate-800/50 mb-3 text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 font-medium">Todo despejado.</p>
                                <p className="text-xs text-slate-500 mt-1">No tienes citas programadas para hoy.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todaysAppointments.map(appt => (
                                    <div key={appt.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 transition-all group">
                                        <div className="text-center px-4 border-r border-slate-800 min-w-[80px]">
                                            <p className="text-white font-mono font-bold text-lg">{new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm truncate">
                                                {appt.status === 'blocked' ? 'Tiempo Bloqueado' : getPatientName(appt.patientId || '')}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                {appt.status === 'blocked' ? 'No disponible' : 'Consulta General'}
                                                {appt.meetLink && appt.status !== 'blocked' && (
                                                    <a href={appt.meetLink} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline ml-2 font-bold flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                        Video
                                                    </a>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${appt.status === 'blocked' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                                {appt.status === 'blocked' ? 'Bloqueado' : 'Confirmada'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PATIENTS TAB */}
            {activeSection === 'patients' && (
                <div className="animate-slide-up">
                    <div className="flex justify-between mb-6">
                        <input 
                             type="text" 
                             placeholder="Buscar paciente..." 
                             className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 w-full max-w-md"
                             value={patientSearchTerm}
                             onChange={e => setPatientSearchTerm(e.target.value)}
                        />
                        <button 
                             onClick={() => setIsCreatingPatient(true)}
                             className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                             </svg>
                             Nuevo Paciente
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(patient => (
                            <div key={patient.id} onClick={() => { setSelectedPatientId(patient.id); setIsViewingPatientDetails(true); }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-indigo-500 transition-colors group">
                                 <div className="flex items-center gap-4 mb-4">
                                     <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold text-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                         {patient.name.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{patient.name} {patient.surnames}</h3>
                                         <p className="text-sm text-slate-500">{patient.email}</p>
                                     </div>
                                 </div>
                                 <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-4">
                                     <span>ID: {patient.id.slice(0,6)}...</span>
                                     <span className="flex items-center gap-1 text-emerald-500">
                                         <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                         Activo
                                     </span>
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOOLS TAB */}
            {activeSection === 'tools' && (
                <div className="animate-slide-up">
                    <div className="flex space-x-4 mb-8 border-b border-slate-800 pb-2">
                        <button 
                            onClick={() => setToolSubTab('surveys')}
                            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${toolSubTab === 'surveys' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500 hover:text-white'}`}
                        >
                            Encuestas
                        </button>
                        <button 
                            onClick={() => setToolSubTab('resources')}
                            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${toolSubTab === 'resources' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500 hover:text-white'}`}
                        >
                            Recursos Educativos
                        </button>
                    </div>

                    {toolSubTab === 'surveys' && (
                        <div>
                             <div className="flex justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Plantillas Disponibles</h2>
                                <button onClick={() => setIsBuilderMode(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-700">Crear Nueva</button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {[INITIAL_MENTAL_HEALTH_ASSESSMENT, BDI_II_ASSESSMENT, ...displayTemplates].map(t => (
                                     <div key={t.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                         <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-white">{t.title}</h3>
                                            {t.id === INITIAL_MENTAL_HEALTH_ASSESSMENT.id || t.id === BDI_II_ASSESSMENT.id ? (
                                                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-1 rounded uppercase">Estándar</span>
                                            ) : (
                                                <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded uppercase">Personalizada</span>
                                            )}
                                         </div>
                                         <p className="text-sm text-slate-500 mt-2 mb-4 line-clamp-2">{t.description}</p>
                                         <p className="text-xs text-slate-600">{t.questions.length} preguntas</p>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}

                    {toolSubTab === 'resources' && (
                        <div>
                            <div className="flex justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Biblioteca de Recursos</h2>
                                <button onClick={() => setIsResourceMode(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-700">Añadir Recurso</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resources.map(r => (
                                    <div key={r.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-4">
                                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl">
                                            {r.type === 'pdf' ? '📄' : r.type === 'video' ? '🎥' : r.type === 'image' ? '🖼️' : '🔗'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{r.title}</h3>
                                            <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline break-all block mt-1">{r.url}</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* REVIEW TAB */}
            {activeSection === 'review' && (
                <div className="animate-slide-up">
                    <h2 className="text-xl font-bold text-white mb-6">Últimos Reportes</h2>
                    <div className="space-y-4">
                        {allReports.length === 0 ? (
                            <p className="text-slate-500">No hay reportes recientes.</p>
                        ) : (
                            allReports.map(report => (
                                <div key={report.id} onClick={() => { setSelectedReport(report); setSelectedPatientId(report.patientId); }} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white">{getPatientName(report.patientId)}</span>
                                        <span className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-emerald-400">{report.content.positives.length} Positivos</span>
                                        <span className="text-slate-400">{report.content.negatives.length} Negativos</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* SCHEDULE TAB */}
            {activeSection === 'schedule' && (
                <div className="animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                             <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                             </button>
                             <h2 className="text-lg font-bold text-white">Semana del {currentWeekStart.toLocaleDateString()}</h2>
                             <button onClick={handleNextWeek} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                             </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px] grid grid-cols-6 gap-2">
                            <div className="pt-10">
                                {Array.from({length: 9}).map((_, i) => (
                                    <div key={i} className="h-16 text-right pr-4 text-xs text-slate-500 font-mono">
                                        {(9+i).toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className="space-y-2">
                                    <div className="text-center pb-2 border-b border-slate-800">
                                        <p className="text-xs text-slate-500 uppercase">{day.toLocaleDateString(undefined, {weekday: 'short'})}</p>
                                        <p className="text-white font-bold">{day.getDate()}</p>
                                    </div>
                                    <div className="space-y-2">
                                         {Array.from({length: 9}).map((_, i) => {
                                             const slotTime = new Date(day);
                                             slotTime.setHours(9+i, 0, 0, 0);
                                             
                                             const appt = appointments.find(a => 
                                                 a.startTime <= slotTime.getTime() && a.endTime > slotTime.getTime()
                                             );

                                             return (
                                                 <div 
                                                    key={i} 
                                                    onClick={() => handleSlotClick(slotTime, appt)}
                                                    className={`h-14 rounded-lg border flex items-center justify-center text-xs font-bold cursor-pointer transition-all
                                                        ${appt 
                                                            ? (appt.status === 'blocked' 
                                                                ? 'bg-slate-800 border-slate-700 text-slate-500' 
                                                                : 'bg-indigo-600 border-indigo-500 text-white')
                                                            : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-transparent hover:text-slate-500'}
                                                    `}
                                                 >
                                                     {appt && (appt.status === 'blocked' ? 'Bloqueado' : getPatientName(appt.patientId || ''))}
                                                     {!appt && '+ Available'}
                                                 </div>
                                             );
                                         })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}

            {/* Create Patient Modal */}
            {isCreatingPatient && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-lg border border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-4">Registrar Nuevo Paciente</h2>
                        {createMsg && <div className="mb-4 p-3 bg-brand-500/20 text-brand-300 rounded-lg text-sm">{createMsg}</div>}
                        <form onSubmit={handleCreatePatient} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Nombre" value={pName} onChange={e => setPName(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white w-full" required />
                                <input placeholder="Apellidos" value={pSurnames} onChange={e => setPSurnames(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white w-full" />
                            </div>
                            <input type="email" placeholder="Email" value={pEmail} onChange={e => setPEmail(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white w-full" required />
                            <input type="tel" placeholder="Teléfono" value={pPhone} onChange={e => setPPhone(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white w-full" />
                            <input type="password" placeholder="Contraseña Temporal" value={pPassword} onChange={e => setPPassword(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white w-full" required />
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsCreatingPatient(false)} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Template Builder Modal */}
            {isBuilderMode && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-2xl border border-slate-800 h-[80vh] flex flex-col">
                        <h2 className="text-2xl font-bold text-white mb-6">Constructor de Encuestas</h2>
                        <input placeholder="Título de la Encuesta" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white w-full mb-4" />
                        
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                             {questions.map((q, idx) => (
                                 <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                     <p className="text-white font-bold">{q.text}</p>
                                     <p className="text-xs text-slate-500 uppercase mt-1">{q.type}</p>
                                 </div>
                             ))}
                             <div className="bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700">
                                 <p className="text-center text-slate-500 text-sm">Añade preguntas (Funcionalidad simplificada para demo)</p>
                                 <div className="flex justify-center gap-2 mt-2">
                                     <button onClick={() => setQuestions([...questions, { id: crypto.randomUUID(), type: 'text', text: 'Nueva Pregunta de Texto' }])} className="text-xs bg-slate-700 text-white px-2 py-1 rounded">Texto</button>
                                     <button onClick={() => setQuestions([...questions, { id: crypto.randomUUID(), type: 'scale', text: 'Nueva Escala 1-10' }])} className="text-xs bg-slate-700 text-white px-2 py-1 rounded">Escala</button>
                                 </div>
                             </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setIsBuilderMode(false)} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800">Cancelar</button>
                            <button onClick={handleCreateTemplate} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Guardar Plantilla</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Modal */}
            {isResourceMode && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-6">Añadir Recurso</h2>
                        <div className="space-y-4">
                            <input placeholder="Título" value={resTitle} onChange={e => setResTitle(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white" />
                            <textarea placeholder="Descripción" value={resDesc} onChange={e => setResDesc(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white h-24 resize-none" />
                            <select value={resType} onChange={e => setResType(e.target.value as any)} className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white">
                                <option value="image">Imagen</option>
                                <option value="pdf">PDF</option>
                                <option value="video">Video</option>
                                <option value="link">Enlace Web</option>
                            </select>
                            <input placeholder="URL del recurso" value={resUrl} onChange={e => setResUrl(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-white" />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setIsResourceMode(false)} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800">Cancelar</button>
                            <button onClick={handleCreateResource} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PATIENT DETAIL MODAL (HUGE) */}
            {isViewingPatientDetails && currentPatient && createPortal(
                <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-slide-up">
                    {/* Header */}
                    <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-xl z-20">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsViewingPatientDetails(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-white">{currentPatient.name} {currentPatient.surnames}</h2>
                                <p className="text-xs text-slate-400">{currentPatient.email} • ID: {currentPatient.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {['general', 'clinical', 'treatment', 'evaluations', 'admin'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveRecordTab(tab as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${activeRecordTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
                        
                        {/* GENERAL TAB */}
                        {activeRecordTab === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-white">Información Personal</h3>
                                        <button onClick={() => { if(isEditingBasic) saveBasicInfo(); else setIsEditingBasic(true); }} className="text-xs text-indigo-400 hover:text-indigo-300 uppercase font-bold">
                                            {isEditingBasic ? 'Guardar' : 'Editar'}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Teléfono', key: 'phone' },
                                            { label: 'Dirección', key: 'address' },
                                            { label: 'Ocupación', key: 'occupation' },
                                            { label: 'Estado Civil', key: 'maritalStatus' },
                                            { label: 'Fecha Nacimiento', key: 'birthDate', type: 'date' },
                                            { label: 'Seguro Médico', key: 'insuranceNumber' }
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label className="text-xs text-slate-500 uppercase font-bold">{field.label}</label>
                                                {isEditingBasic ? (
                                                    <input 
                                                        type={field.type || 'text'}
                                                        value={(basicForm as any)[field.key] || ''}
                                                        onChange={e => setBasicForm({...basicForm, [field.key]: e.target.value})}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1"
                                                    />
                                                ) : (
                                                    <p className="text-white">{(currentPatient as any)[field.key] || 'No registrado'}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                     <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                         <h3 className="font-bold text-white mb-4">Notas Rápidas</h3>
                                         <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 h-32 resize-none" placeholder="Añadir nota privada..." />
                                     </div>
                                     <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                         <h3 className="font-bold text-white mb-4">Próxima Cita</h3>
                                         <button onClick={() => { setIsViewingPatientDetails(false); onSectionChange('schedule'); }} className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                                             Agendar Cita
                                         </button>
                                     </div>
                                </div>
                            </div>
                        )}

                        {/* CLINICAL TAB */}
                        {activeRecordTab === 'clinical' && (
                             <div className="space-y-8">
                                 {/* Clinical Profile */}
                                 <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                                     <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-white text-lg">Perfil Clínico</h3>
                                        <button onClick={() => { if(isEditingClinical) saveClinicalInfo(); else setIsEditingClinical(true); }} className="text-xs text-indigo-400 hover:text-indigo-300 uppercase font-bold">
                                            {isEditingClinical ? 'Guardar Cambios' : 'Editar Perfil'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold">Diagnóstico Principal</label>
                                            {isEditingClinical ? (
                                                <input value={clinicalForm.diagnosis || ''} onChange={e => setClinicalForm({...clinicalForm, diagnosis: e.target.value})} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white mt-1" />
                                            ) : (
                                                <p className="text-white font-medium text-lg">{clinicalProfile?.diagnosis || 'No definido'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase font-bold">Nivel de Riesgo</label>
                                            {isEditingClinical ? (
                                                <select value={clinicalForm.riskLevel || 'Bajo'} onChange={e => setClinicalForm({...clinicalForm, riskLevel: e.target.value as any})} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white mt-1">
                                                    <option value="Bajo">Bajo</option>
                                                    <option value="Medio">Medio</option>
                                                    <option value="Alto">Alto</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${clinicalProfile?.riskLevel === 'Alto' ? 'bg-red-500/20 text-red-400' : clinicalProfile?.riskLevel === 'Medio' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {clinicalProfile?.riskLevel || 'Bajo'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Motivo de Consulta</label>
                                            {isEditingClinical ? (
                                                <textarea value={clinicalForm.reasonForConsult || ''} onChange={e => setClinicalForm({...clinicalForm, reasonForConsult: e.target.value})} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white mt-1" />
                                            ) : (
                                                <p className="text-slate-300">{clinicalProfile?.reasonForConsult || '-'}</p>
                                            )}
                                        </div>
                                    </div>
                                 </div>

                                 {/* Sessions History */}
                                 <div>
                                     <div className="flex justify-between items-center mb-4">
                                         <h3 className="font-bold text-white text-lg">Historial de Sesiones</h3>
                                         <button onClick={() => setIsAddingSession(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Nueva Sesión</button>
                                     </div>
                                     
                                     {isAddingSession && (
                                         <div className="bg-slate-800 p-6 rounded-2xl mb-6 border border-slate-700 animate-fade-in">
                                             <h4 className="font-bold text-white mb-4">Registrar Sesión</h4>
                                             <div className="grid grid-cols-2 gap-4 mb-4">
                                                 <input type="date" onChange={e => setSessionForm({...sessionForm, date: e.target.value as any})} className="bg-slate-900 border-slate-700 rounded-lg p-2 text-white" />
                                                 <input type="number" placeholder="Progreso (0-100)" onChange={e => setSessionForm({...sessionForm, progress: parseInt(e.target.value)})} className="bg-slate-900 border-slate-700 rounded-lg p-2 text-white" />
                                             </div>
                                             <textarea placeholder="Resumen de la sesión..." onChange={e => setSessionForm({...sessionForm, summary: e.target.value})} className="w-full bg-slate-900 border-slate-700 rounded-lg p-3 text-white h-24 mb-4" />
                                             <div className="flex justify-end gap-2">
                                                 <button onClick={() => setIsAddingSession(false)} className="text-slate-400 px-4 py-2">Cancelar</button>
                                                 <button onClick={addSession} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Guardar</button>
                                             </div>
                                         </div>
                                     )}

                                     <div className="space-y-4">
                                         {sessions.length === 0 ? <p className="text-slate-500 italic">No hay sesiones registradas.</p> : sessions.map(s => (
                                             <div key={s.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                                                 <div className="flex justify-between mb-2">
                                                     <span className="font-bold text-white">{new Date(s.date).toLocaleDateString()}</span>
                                                     <span className="text-xs text-indigo-400 font-bold">Progreso: {s.progress}%</span>
                                                 </div>
                                                 <p className="text-slate-300 text-sm">{s.summary}</p>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        )}

                        {/* TREATMENT TAB */}
                        {activeRecordTab === 'treatment' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-white text-lg">Objetivos Terapéuticos</h3>
                                    <button onClick={() => setIsAddingGoal(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm border border-slate-700">+ Objetivo</button>
                                </div>

                                {isAddingGoal && (
                                     <div className="flex gap-4 items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                                         <input placeholder="Descripción del objetivo" value={goalForm.desc} onChange={e => setGoalForm({...goalForm, desc: e.target.value})} className="flex-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-white" />
                                         <select value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value})} className="bg-slate-800 border-slate-700 rounded-lg p-2 text-white">
                                             <option value="short_term">Corto Plazo</option>
                                             <option value="long_term">Largo Plazo</option>
                                         </select>
                                         <button onClick={addGoal} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Guardar</button>
                                     </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Corto Plazo</h4>
                                        <div className="space-y-2">
                                            {goals.filter(g => g.type === 'short_term').map(g => (
                                                <div key={g.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                                                    <input type="checkbox" checked={g.status === 'achieved'} onChange={() => {}} className="rounded bg-slate-800 border-slate-600" />
                                                    <span className={g.status === 'achieved' ? 'text-slate-500 line-through' : 'text-slate-200'}>{g.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Largo Plazo</h4>
                                        <div className="space-y-2">
                                            {goals.filter(g => g.type === 'long_term').map(g => (
                                                <div key={g.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                                                    <input type="checkbox" checked={g.status === 'achieved'} onChange={() => {}} className="rounded bg-slate-800 border-slate-600" />
                                                    <span className={g.status === 'achieved' ? 'text-slate-500 line-through' : 'text-slate-200'}>{g.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EVALUATIONS TAB */}
                        {activeRecordTab === 'evaluations' && (
                            <div className="space-y-8">
                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-64">
                                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Balance Emocional (Últimos 7 días)</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={modalStats.naretData}>
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                                                <YAxis stroke="#64748b" fontSize={10} />
                                                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} />
                                                <Legend />
                                                <Bar dataKey="Positivo" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Negativo" fill="#64748b" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Evolución BDI-II</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={modalStats.bdiData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                                                <YAxis stroke="#64748b" fontSize={10} />
                                                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b'}} />
                                                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{fill: '#8884d8'}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Assign Tool Area */}
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h4 className="font-bold text-white mb-4">Asignar Nueva Evaluación</h4>
                                    <div className="flex gap-4">
                                        <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="flex-1 bg-slate-900 border-slate-700 rounded-xl p-3 text-white">
                                            <option value="">Seleccionar Plantilla...</option>
                                            <option value={INITIAL_MENTAL_HEALTH_ASSESSMENT.id}>{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</option>
                                            <option value={BDI_II_ASSESSMENT.id}>{BDI_II_ASSESSMENT.title}</option>
                                            {displayTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                        </select>
                                        <button onClick={handleAssign} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl">Asignar</button>
                                    </div>
                                </div>

                                {/* History List */}
                                <div>
                                    <h4 className="font-bold text-white mb-4">Historial de Evaluaciones</h4>
                                    <div className="space-y-3">
                                        {patientSurveys.map(s => (
                                            <div key={s.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white">{s.templateTitle}</p>
                                                    <p className="text-xs text-slate-500">Asignado: {new Date(s.assignedAt).toLocaleDateString()} {s.completedAt ? `• Completado: ${new Date(s.completedAt).toLocaleDateString()}` : ''}</p>
                                                </div>
                                                {s.status === 'completed' ? (
                                                    <button onClick={() => { setViewingAssignment(s); }} className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">Ver Resultados</button>
                                                ) : (
                                                    <span className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">Pendiente</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ADMIN TAB */}
                        {activeRecordTab === 'admin' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">Registro Financiero</h3>
                                        <button onClick={() => setIsAddingFinance(true)} className="text-xs bg-slate-800 px-3 py-1 rounded text-white">+ Registro</button>
                                    </div>
                                    {isAddingFinance && (
                                        <div className="bg-slate-800 p-4 rounded-xl mb-4 text-sm">
                                            <input type="date" onChange={e => setFinanceForm({...financeForm, date: e.target.value as any})} className="bg-slate-900 border-slate-700 rounded p-2 text-white w-full mb-2" />
                                            <input type="number" placeholder="Monto" onChange={e => setFinanceForm({...financeForm, amount: parseInt(e.target.value)})} className="bg-slate-900 border-slate-700 rounded p-2 text-white w-full mb-2" />
                                            <button onClick={addFinance} className="w-full bg-emerald-600 text-white rounded p-2 font-bold">Guardar</button>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {financials.map(f => (
                                            <div key={f.id} className="bg-slate-900 p-3 rounded-lg flex justify-between">
                                                <span className="text-slate-300">{new Date(f.date).toLocaleDateString()}</span>
                                                <span className="text-white font-mono font-bold">${f.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">Recordatorios</h3>
                                        <button onClick={() => setIsAddingReminder(true)} className="text-xs bg-slate-800 px-3 py-1 rounded text-white">+ Recordatorio</button>
                                    </div>
                                    {isAddingReminder && (
                                        <div className="bg-slate-800 p-4 rounded-xl mb-4 text-sm">
                                            <input type="text" placeholder="Título" onChange={e => setReminderForm({...reminderForm, title: e.target.value})} className="bg-slate-900 border-slate-700 rounded p-2 text-white w-full mb-2" />
                                            <input type="date" onChange={e => setReminderForm({...reminderForm, date: e.target.value})} className="bg-slate-900 border-slate-700 rounded p-2 text-white w-full mb-2" />
                                            <button onClick={addReminder} className="w-full bg-indigo-600 text-white rounded p-2 font-bold">Guardar</button>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {reminders.map(r => (
                                            <div key={r.id} className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                                                <span className="text-slate-300">{r.title}</span>
                                                <span className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
            
            {/* View Assignment Result Modal */}
            {viewingAssignment && createPortal(
                <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-2xl rounded-3xl p-8 border border-slate-800 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{viewingAssignment.templateTitle}</h3>
                            <button onClick={() => setViewingAssignment(null)} className="text-slate-400 hover:text-white">Cerrar</button>
                        </div>
                        <SurveyResultView assignment={viewingAssignment} templates={templates} />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PsychologistDashboard;

