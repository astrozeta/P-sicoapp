
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
                </div>
            )}

            {/* PATIENTS TAB */}
            {activeSection === 'patients' && (
                <div className="space-y-6 animate-fade-in">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-slate-200">Listado</h2>
                         <div className="flex gap-3 w-full md:w-auto">
                            <input type="text" value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} placeholder="Buscar por nombre..." className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none"/>
                            <button onClick={() => setIsCreatingPatient(true)} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Nuevo Paciente</button>
                        </div>
                    </div>
                    {isCreatingPatient && (
                        <div className="p-6 bg-slate-900 border border-slate-700 rounded-3xl mb-6">
                            <form onSubmit={handleCreatePatient} className="grid grid-cols-2 gap-4">
                                <input className="bg-slate-800 p-2 text-white rounded" placeholder="Nombre" value={pName} onChange={e => setPName(e.target.value)} required />
                                <input className="bg-slate-800 p-2 text-white rounded" placeholder="Email" value={pEmail} onChange={e => setPEmail(e.target.value)} required />
                                <input className="bg-slate-800 p-2 text-white rounded" placeholder="Password" value={pPassword} onChange={e => setPPassword(e.target.value)} required />
                                <button type="submit" className="bg-brand-500 text-white rounded p-2">Crear</button>
                            </form>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p => (
                            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 transition-all cursor-pointer" onClick={() => { setSelectedPatientId(p.id); setIsViewingPatientDetails(true); }}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500">{p.name.charAt(0)}</div>
                                    <div><h3 className="font-bold text-white">{p.name} {p.surnames}</h3><p className="text-sm text-slate-400">{p.email}</p></div>
                                </div>
                                <div className="text-xs text-brand-400 font-bold uppercase tracking-wider">Ver Expediente Clínico &rarr;</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOOLS TAB */}
            {activeSection === 'tools' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex gap-4 border-b border-slate-800">
                        <button onClick={() => setToolSubTab('surveys')} className={`pb-3 px-2 font-bold ${toolSubTab === 'surveys' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500'}`}>Encuestas y Tests</button>
                        <button onClick={() => setToolSubTab('resources')} className={`pb-3 px-2 font-bold ${toolSubTab === 'resources' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500'}`}>Recursos Educativos</button>
                    </div>

                    {toolSubTab === 'surveys' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Mis Plantillas</h3>
                                <button onClick={() => setIsBuilderMode(true)} className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Crear Nueva</button>
                            </div>

                            {/* Builder UI */}
                            {isBuilderMode && (
                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                                    <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" placeholder="Título de la Encuesta" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} />
                                    
                                    <div className="space-y-2">
                                        {questions.map((q, idx) => (
                                            <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                                                <span className="text-white text-sm">{idx + 1}. {q.text}</span>
                                                <span className="text-xs text-slate-500 uppercase">{q.type}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                        <button onClick={() => {
                                            const text = prompt("Texto de la pregunta:");
                                            if(text) setQuestions([...questions, { id: crypto.randomUUID(), type: 'text', text }]);
                                        }} className="bg-slate-800 p-2 rounded text-slate-300 text-sm hover:text-white">Añadir Texto Libre</button>
                                        <button onClick={() => {
                                            const text = prompt("Texto de la pregunta (1-10):");
                                            if(text) setQuestions([...questions, { id: crypto.randomUUID(), type: 'scale', text }]);
                                        }} className="bg-slate-800 p-2 rounded text-slate-300 text-sm hover:text-white">Añadir Escala 1-10</button>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4">
                                        <button onClick={() => setIsBuilderMode(false)} className="text-slate-500 px-4">Cancelar</button>
                                        <button onClick={handleCreateTemplate} className="bg-emerald-500 text-white px-4 py-2 rounded font-bold">Guardar Plantilla</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl opacity-75">
                                    <h4 className="font-bold text-white mb-1">{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</h4>
                                    <p className="text-xs text-slate-500">Sistema (Solo lectura)</p>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl opacity-75">
                                    <h4 className="font-bold text-white mb-1">{BDI_II_ASSESSMENT.title}</h4>
                                    <p className="text-xs text-slate-500">Sistema (Solo lectura)</p>
                                </div>
                                {displayTemplates.map(t => (
                                    <div key={t.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center group cursor-pointer hover:border-brand-500/50" onClick={() => setViewingTemplate(t)}>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">{t.title}</h4>
                                            <p className="text-xs text-slate-500">{t.questions.length} preguntas</p>
                                        </div>
                                        <span className="text-brand-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ver &rarr;</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {toolSubTab === 'resources' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Biblioteca de Recursos</h3>
                                <button onClick={() => setIsResourceMode(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Añadir Recurso</button>
                            </div>

                            {/* Resource Builder */}
                            {isResourceMode && (
                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                                    <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" placeholder="Título" value={resTitle} onChange={e => setResTitle(e.target.value)} />
                                    <textarea className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" placeholder="Descripción breve" value={resDesc} onChange={e => setResDesc(e.target.value)} />
                                    <div className="flex gap-2">
                                        <select className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" value={resType} onChange={e => setResType(e.target.value as any)}>
                                            <option value="image">Imagen</option>
                                            <option value="pdf">PDF</option>
                                            <option value="video">Video</option>
                                            <option value="link">Enlace</option>
                                        </select>
                                        <input className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-lg text-white" placeholder="URL del recurso" value={resUrl} onChange={e => setResUrl(e.target.value)} />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button onClick={() => setIsResourceMode(false)} className="text-slate-500 px-4">Cancelar</button>
                                        <button onClick={handleCreateResource} className="bg-emerald-500 text-white px-4 py-2 rounded font-bold">Guardar</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resources.map(r => (
                                    <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm">{r.title}</h4>
                                            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">{r.type}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{r.description}</p>
                                        <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs mt-3 block hover:underline truncate">{r.url}</a>
                                    </div>
                                ))}
                                {resources.length === 0 && <p className="text-slate-500 italic">No hay recursos creados.</p>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SCHEDULE TAB (Weekly Calendar) */}
            {activeSection === 'schedule' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-200">Agenda Semanal</h2>
                            <p className="text-xs text-slate-500">Gestión visual de citas y bloqueos.</p>
                        </div>
                        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                            <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="px-4 text-sm font-bold text-white min-w-[150px] text-center">
                                {currentWeekStart.toLocaleDateString()} - {new Date(currentWeekStart.getTime() + 4 * 86400000).toLocaleDateString()}
                            </span>
                            <button onClick={handleNextWeek} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Calendar Header */}
                            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-slate-800 bg-slate-950/50">
                                <div className="p-4 border-r border-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                    HORA
                                </div>
                                {weekDays.map((day, i) => (
                                    <div key={i} className="p-4 border-r border-slate-800 last:border-0 text-center">
                                        <p className="text-sm font-bold text-white uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                        <p className="text-xs text-slate-500">{day.getDate()}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Body */}
                            {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
                                <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-slate-800 last:border-0 hover:bg-slate-800/20 transition-colors">
                                    <div className="border-r border-slate-800 p-2 text-center text-xs text-slate-500 font-mono flex items-start justify-center pt-3">
                                        {hour}:00
                                    </div>
                                    {weekDays.map((day, i) => {
                                        // Find appointment logic
                                        const cellTime = new Date(day);
                                        cellTime.setHours(hour, 0, 0, 0);
                                        const cellTimestamp = cellTime.getTime();
                                        const existingAppt = appointments.find(a => {
                                            const start = a.startTime;
                                            return Math.abs(start - cellTimestamp) < 60000; // Match within minute
                                        });

                                        return (
                                            <div 
                                                key={i} 
                                                className={`
                                                    border-r border-slate-800 last:border-0 h-24 p-1 relative group cursor-pointer transition-colors
                                                    ${!existingAppt ? 'hover:bg-slate-800/40' : ''}
                                                `}
                                                onClick={() => handleSlotClick(cellTime, existingAppt)}
                                            >
                                                {existingAppt ? (
                                                    <div className={`
                                                        w-full h-full rounded-lg p-2 text-xs flex flex-col justify-between shadow-lg border
                                                        ${existingAppt.status === 'blocked' 
                                                            ? 'bg-slate-800 border-slate-700 bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPgo8cmVjdCB3aWR0aD0nNCcgaGVpZ2h0PSc0JyBmaWxsPScjMWUyOTNiJy8+CjxwYXRoIGQ9J00wIDRMNCAwJyBzdHJva2U9JyMzMzQxNTUnIHN0cm9rZS13aWR0aD0nMicvPgo8L3N2Zz4=")]' 
                                                            : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500'
                                                        }
                                                    `}>
                                                        <div className="font-bold text-white truncate">
                                                            {existingAppt.status === 'blocked' ? 'BLOQUEADO' : getPatientName(existingAppt.patientId || '')}
                                                        </div>
                                                        <div className="text-[10px] opacity-80 truncate">
                                                            {existingAppt.status === 'blocked' ? 'No disponible' : 'Ver detalles'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">+ Bloquear</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* REVIEW TAB */}
            {activeSection === 'review' && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-xl font-bold text-slate-200">Revisión General</h2>
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Actividad Reciente</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-slate-300 text-sm">
                                <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Paciente</th>
                                        <th className="px-4 py-3">Actividad</th>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3 text-right">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {assignments.filter(a => a.status === 'completed').slice(0, 10).map(a => (
                                        <tr key={a.id} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-3 font-bold text-white">{getPatientName(a.patientId)}</td>
                                            <td className="px-4 py-3">{a.templateTitle}</td>
                                            <td className="px-4 py-3 text-slate-500">{new Date(a.completedAt || 0).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => setViewingAssignment(a)} className="text-brand-400 hover:text-brand-300 font-bold text-xs">Ver Resultados</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {assignments.filter(a => a.status === 'completed').length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">No hay actividad reciente.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* FULL CLINICAL RECORD MODAL */}
            {isViewingPatientDetails && selectedPatientId && createPortal(
                <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-scale-in overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shrink-0">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">{currentPatient?.name.charAt(0)}</div>
                             <div>
                                 <h2 className="text-xl font-bold text-white">{currentPatient?.name} {currentPatient?.surnames}</h2>
                                 <div className="flex gap-4 text-xs text-slate-400">
                                     <span>{currentPatient?.email}</span>
                                     <span>|</span>
                                     <span>{currentPatient?.phone || 'Sin teléfono'}</span>
                                 </div>
                             </div>
                         </div>
                         <button onClick={() => setIsViewingPatientDetails(false)} className="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg hover:text-white">Cerrar Expediente</button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-slate-900 border-b border-slate-800 px-4 flex gap-6 overflow-x-auto shrink-0">
                        {[
                            { id: 'general', label: '1. Información Básica' },
                            { id: 'clinical', label: '2. Historial Clínico' },
                            { id: 'treatment', label: '3. Tratamiento' },
                            { id: 'evaluations', label: '4. Evaluaciones' },
                            { id: 'admin', label: '5. Administrativo' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveRecordTab(tab.id as any)}
                                className={`py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeRecordTab === tab.id ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
                        <div className="max-w-6xl mx-auto space-y-8">
                            
                            {/* TAB 1: GENERAL INFO */}
                            {activeRecordTab === 'general' && (
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <div className="flex justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white">Datos del Paciente</h3>
                                        <button onClick={() => isEditingBasic ? saveBasicInfo() : setIsEditingBasic(true)} className="text-brand-400 font-bold text-sm">
                                            {isEditingBasic ? 'Guardar Cambios' : 'Editar Información'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Fecha Nacimiento</label>
                                            {isEditingBasic ? <input type="date" className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.birthDate || ''} onChange={e => setBasicForm({...basicForm, birthDate: e.target.value})} /> : <p className="text-white">{currentPatient?.birthDate || 'No registrada'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Edad</label>
                                            <p className="text-white">{currentPatient?.birthDate ? Math.floor((Date.now() - new Date(currentPatient.birthDate).getTime()) / 31557600000) + ' años' : '-'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Género</label>
                                            {isEditingBasic ? <select className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.gender || ''} onChange={e => setBasicForm({...basicForm, gender: e.target.value})}><option value="">Selec...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="No Binario">No Binario</option><option value="Otro">Otro</option></select> : <p className="text-white">{currentPatient?.gender || '-'}</p>}
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Dirección</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.address || ''} onChange={e => setBasicForm({...basicForm, address: e.target.value})} /> : <p className="text-white">{currentPatient?.address || '-'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Email</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.email || ''} onChange={e => setBasicForm({...basicForm, email: e.target.value})} /> : <p className="text-white">{currentPatient?.email || '-'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Teléfono</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.phone || ''} onChange={e => setBasicForm({...basicForm, phone: e.target.value})} /> : <p className="text-white">{currentPatient?.phone || '-'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Ocupación</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.occupation || ''} onChange={e => setBasicForm({...basicForm, occupation: e.target.value})} /> : <p className="text-white">{currentPatient?.occupation || '-'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Estado Civil</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.maritalStatus || ''} onChange={e => setBasicForm({...basicForm, maritalStatus: e.target.value})} /> : <p className="text-white">{currentPatient?.maritalStatus || '-'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Seguro Médico</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.insuranceNumber || ''} onChange={e => setBasicForm({...basicForm, insuranceNumber: e.target.value})} /> : <p className="text-white">{currentPatient?.insuranceNumber || 'N/A'}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Fuente de Referencia</label>
                                            {isEditingBasic ? <input className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" value={basicForm.referralSource || ''} onChange={e => setBasicForm({...basicForm, referralSource: e.target.value})} /> : <p className="text-white">{currentPatient?.referralSource || '-'}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CLINICAL HISTORY */}
                            {activeRecordTab === 'clinical' && (
                                <div className="space-y-6">
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex justify-between mb-4">
                                            <h3 className="text-lg font-bold text-white">Antecedentes Médicos y Diagnóstico</h3>
                                            <button onClick={() => isEditingClinical ? saveClinicalInfo() : setIsEditingClinical(true)} className="text-brand-400 font-bold text-sm">
                                                {isEditingClinical ? 'Guardar' : 'Editar'}
                                            </button>
                                        </div>
                                        <div className="space-y-6">
                                            {/* Reason & Diagnosis */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-bold">Motivo Consulta</label>
                                                    {isEditingClinical ? <textarea className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 mt-1" rows={3} value={clinicalForm.reasonForConsult || ''} onChange={e => setClinicalForm({...clinicalForm, reasonForConsult: e.target.value})} /> : <p className="text-white mt-1 bg-slate-800/50 p-3 rounded-lg border border-slate-800 text-sm leading-relaxed">{clinicalProfile?.reasonForConsult || 'Sin datos'}</p>}
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-bold">Diagnóstico</label>
                                                    {isEditingClinical ? <textarea className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 mt-1" rows={3} value={clinicalForm.diagnosis || ''} onChange={e => setClinicalForm({...clinicalForm, diagnosis: e.target.value})} /> : <p className="text-white mt-1 bg-slate-800/50 p-3 rounded-lg border border-slate-800 text-sm font-bold">{clinicalProfile?.diagnosis || '-'}</p>}
                                                </div>
                                            </div>

                                            {/* Risk */}
                                            <div className="pb-6 border-b border-slate-800">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <label className="text-xs text-slate-500 uppercase font-bold">Evaluación de Riesgo</label>
                                                    {isEditingClinical ? (
                                                        <select className="bg-slate-800 text-white p-1 rounded border border-slate-700 text-sm" value={clinicalForm.riskLevel || 'Bajo'} onChange={e => setClinicalForm({...clinicalForm, riskLevel: e.target.value as any})}><option value="Bajo">Bajo</option><option value="Medio">Medio</option><option value="Alto">Alto</option></select>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${clinicalProfile?.riskLevel === 'Alto' ? 'bg-red-500 text-white' : clinicalProfile?.riskLevel === 'Medio' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>{clinicalProfile?.riskLevel || 'Bajo'}</span>
                                                    )}
                                                </div>
                                                {isEditingClinical ? <textarea className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700" placeholder="Detalles de riesgo (suicidio, autolesión, etc.)" value={clinicalForm.riskDetails || ''} onChange={e => setClinicalForm({...clinicalForm, riskDetails: e.target.value})} /> : <p className="text-slate-300 text-sm italic">{clinicalProfile?.riskDetails || 'Sin detalles de riesgo específicos.'}</p>}
                                            </div>

                                            {/* History Breakdown */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-bold">Condiciones Preexistentes</label>
                                                    {isEditingClinical ? <textarea className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 mt-1" placeholder="Separar por comas..." value={Array.isArray(clinicalForm.preexistingConditions) ? clinicalForm.preexistingConditions.join(', ') : (clinicalForm.preexistingConditions || '')} onChange={e => setClinicalForm({...clinicalForm, preexistingConditions: e.target.value as any})} /> : (
                                                        <ul className="list-disc list-inside text-sm text-slate-300 mt-1">
                                                            {clinicalProfile?.preexistingConditions?.length ? clinicalProfile.preexistingConditions.map((c,i) => <li key={i}>{c}</li>) : <li>Ninguna reportada</li>}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-bold">Medicación Actual</label>
                                                    {isEditingClinical ? <textarea className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 mt-1" value={clinicalForm.currentMedication || ''} onChange={e => setClinicalForm({...clinicalForm, currentMedication: e.target.value})} /> : <p className="text-slate-300 text-sm mt-1">{clinicalProfile?.currentMedication || 'Ninguna'}</p>}
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 uppercase font-bold">Tratamientos Anteriores</label>
                                                    {isEditingClinical ? <textarea className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 mt-1" value={clinicalForm.previousTreatments || ''} onChange={e => setClinicalForm({...clinicalForm, previousTreatments: e.target.value})} /> : <p className="text-slate-300 text-sm mt-1">{clinicalProfile?.previousTreatments || 'Ninguno'}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SESSIONS LIST */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-white">Historial de Sesiones</h3>
                                            <button onClick={() => setIsAddingSession(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-brand-600">Nueva Sesión</button>
                                        </div>
                                        
                                        {isAddingSession && (
                                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 animate-slide-up">
                                                <h4 className="font-bold text-white mb-4">Registrar Sesión</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <input type="date" className="bg-slate-900 border border-slate-700 rounded p-2 text-white" onChange={e => setSessionForm({...sessionForm, date: e.target.value as any})} />
                                                    <input type="number" placeholder="Progreso (0-100)" className="bg-slate-900 border border-slate-700 rounded p-2 text-white" onChange={e => setSessionForm({...sessionForm, progress: parseInt(e.target.value)})} />
                                                </div>
                                                <textarea placeholder="Objetivos de la sesión" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-2" rows={2} onChange={e => setSessionForm({...sessionForm, objectives: e.target.value})} />
                                                <textarea placeholder="Resumen / Notas clínicas" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-3" rows={3} onChange={e => setSessionForm({...sessionForm, summary: e.target.value})} />
                                                <textarea placeholder="Próximos pasos" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-4" rows={2} onChange={e => setSessionForm({...sessionForm, nextSteps: e.target.value})} />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setIsAddingSession(false)} className="text-slate-400 px-4 py-2">Cancelar</button>
                                                    <button onClick={addSession} className="bg-brand-500 text-white px-4 py-2 rounded font-bold">Guardar</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {sessions.length === 0 ? <p className="text-slate-500 italic">No hay sesiones registradas.</p> : sessions.map(s => (
                                                <div key={s.id} className="border-l-2 border-brand-500 pl-4 py-2 relative">
                                                    <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-brand-500 border-2 border-slate-900"></div>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs font-bold text-brand-400">{new Date(s.date).toLocaleDateString()}</span>
                                                        <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">Progreso: {s.progress}%</span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-sm mt-1">{s.objectives}</h4>
                                                    <p className="text-slate-400 text-sm mt-1">{s.summary}</p>
                                                    {s.nextSteps && <p className="text-xs text-slate-500 mt-2 bg-slate-800/30 p-2 rounded">Next: {s.nextSteps}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: TREATMENT & GOALS */}
                            {activeRecordTab === 'treatment' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Enfoque Terapéutico</h3>
                                            <div className="relative">
                                                <textarea 
                                                    className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-brand-500 outline-none h-32 resize-none"
                                                    placeholder="Describa el enfoque (ej. Terapia Cognitivo Conductual...)"
                                                    value={clinicalProfile?.therapeuticApproach || ''}
                                                    onChange={e => setClinicalProfile(prev => prev ? ({...prev, therapeuticApproach: e.target.value}) : null)}
                                                    onBlur={() => saveClinicalProfile({ ...clinicalProfile, therapeuticApproach: clinicalProfile?.therapeuticApproach, userId: selectedPatientId })}
                                                />
                                                <span className="absolute bottom-2 right-2 text-[10px] text-slate-500">Auto-guardado al salir</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold text-white">Tareas Activas</h3>
                                                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{activeTasks.length} pendientes</span>
                                            </div>
                                            <ul className="space-y-2">
                                                {activeTasks.map(t => (
                                                    <li key={t.id} className="flex items-center gap-2 text-sm text-slate-300">
                                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                        {t.templateTitle} (Asignado: {new Date(t.assignedAt).toLocaleDateString()})
                                                    </li>
                                                ))}
                                                {activeTasks.length === 0 && <li className="text-slate-500 italic text-sm">No hay tareas pendientes.</li>}
                                            </ul>
                                        </div>
                                        
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Feedback del Paciente</h3>
                                            <div className="relative">
                                                <textarea 
                                                    className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-brand-500 outline-none h-32 resize-none"
                                                    placeholder="Registro de comentarios sobre la eficacia del tratamiento..."
                                                    value={clinicalProfile?.patientFeedback || ''}
                                                    onChange={e => setClinicalProfile(prev => prev ? ({...prev, patientFeedback: e.target.value}) : null)}
                                                    onBlur={() => saveClinicalProfile({ ...clinicalProfile, patientFeedback: clinicalProfile?.patientFeedback, userId: selectedPatientId })}
                                                />
                                                <span className="absolute bottom-2 right-2 text-[10px] text-slate-500">Auto-guardado al salir</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-white">Objetivos Terapéuticos</h3>
                                            <button onClick={() => setIsAddingGoal(true)} className="text-brand-400 text-sm font-bold border border-brand-500/30 px-3 py-1 rounded hover:bg-brand-500/10">+ Añadir Objetivo</button>
                                        </div>

                                        {isAddingGoal && (
                                            <div className="flex gap-2 mb-4 animate-slide-up">
                                                <input className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white" placeholder="Descripción del objetivo" value={goalForm.desc} onChange={e => setGoalForm({...goalForm, desc: e.target.value})} />
                                                <select className="bg-slate-800 border border-slate-700 rounded p-2 text-white" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value})}>
                                                    <option value="short_term">Corto Plazo</option>
                                                    <option value="long_term">Largo Plazo</option>
                                                </select>
                                                <button onClick={addGoal} className="bg-emerald-500 text-white px-4 rounded font-bold">OK</button>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {goals.map(g => (
                                                <div key={g.id} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                    <button 
                                                        onClick={() => updateTreatmentGoalStatus(g.id, g.status === 'achieved' ? 'pending' : 'achieved').then(() => loadPatientRecord(selectedPatientId))}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center ${g.status === 'achieved' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}
                                                    >
                                                        {g.status === 'achieved' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className={`text-sm ${g.status === 'achieved' ? 'text-slate-500 line-through' : 'text-white'}`}>{g.description}</p>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold">{g.type === 'short_term' ? 'Corto Plazo' : 'Largo Plazo'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {goals.length === 0 && <p className="text-slate-500 italic text-sm">Sin objetivos definidos.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: EVALUATIONS (Surveys & Naretbox) */}
                            {activeRecordTab === 'evaluations' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Emociones (Naretbox)</h3>
                                              <div className="h-48 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={modalStats.naretData}>
                                                        <Bar dataKey="Positivo" fill="#10b981" radius={[2, 2, 0, 0]} />
                                                        <Bar dataKey="Negativo" fill="#475569" radius={[2, 2, 0, 0]} />
                                                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Evolución BDI-II (Depresión)</h3>
                                            {modalStats.bdiData.length > 1 ? (
                                                <div className="h-48 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={modalStats.bdiData}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                                                            <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 63]} />
                                                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                                            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic border border-dashed border-slate-700 rounded-xl">
                                                    Se necesitan al menos 2 evaluaciones BDI-II para ver la tendencia.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                            <h3 className="text-lg font-bold text-white">Historial de Evaluaciones</h3>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <select className="bg-slate-950 text-white p-2 rounded-lg border border-slate-700 text-sm flex-1 md:flex-none" onChange={(e) => setSelectedTemplateId(e.target.value)} value={selectedTemplateId}>
                                                        <option value="">Nueva Evaluación...</option>
                                                        <option value={INITIAL_MENTAL_HEALTH_ASSESSMENT.id}>{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</option>
                                                        <option value={BDI_II_ASSESSMENT.id}>{BDI_II_ASSESSMENT.title}</option>
                                                        {displayTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                                </select>
                                                <button onClick={() => { handleAssign().then(() => loadPatientRecord(selectedPatientId)); }} className="bg-brand-500 text-white px-4 rounded-lg font-bold text-sm">Asignar</button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {patientSurveys.filter(s => s.status === 'completed').map(s => (
                                                <div key={s.id} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-800 hover:border-brand-500/50 cursor-pointer group" onClick={() => setViewingAssignment(s)}>
                                                    <div>
                                                        <p className="text-white font-bold text-sm group-hover:text-brand-300 transition-colors">{s.templateTitle}</p>
                                                        <p className="text-xs text-slate-500">{new Date(s.completedAt || 0).toLocaleDateString()}</p>
                                                    </div>
                                                    <button className="bg-slate-900 text-slate-400 hover:text-white px-3 py-1 rounded text-xs font-bold border border-slate-700">Ver Informe</button>
                                                </div>
                                            ))}
                                            {patientSurveys.filter(s => s.status === 'completed').length === 0 && <p className="text-slate-500 italic text-center py-4">No hay evaluaciones completadas.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: ADMINISTRATIVE (Finance & Reminders) */}
                            {activeRecordTab === 'admin' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Financials */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-white">Facturación</h3>
                                            <button onClick={() => setIsAddingFinance(true)} className="text-emerald-400 text-xs font-bold border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-500/10">+ Pago</button>
                                        </div>

                                        {isAddingFinance && (
                                            <div className="bg-slate-950 p-3 rounded mb-4 animate-slide-up space-y-2">
                                                <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="Concepto" onChange={e => setFinanceForm({...financeForm, concept: e.target.value})} />
                                                <div className="flex gap-2">
                                                    <input type="number" className="w-1/3 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="Monto" onChange={e => setFinanceForm({...financeForm, amount: parseFloat(e.target.value)})} />
                                                    <select className="w-1/3 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" onChange={e => setFinanceForm({...financeForm, status: e.target.value as any})}>
                                                        <option value="pending">Pendiente</option>
                                                        <option value="paid">Pagado</option>
                                                    </select>
                                                    <select className="w-1/3 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" onChange={e => setFinanceForm({...financeForm, method: e.target.value as any})}>
                                                        <option value="card">Tarjeta</option>
                                                        <option value="cash">Efectivo</option>
                                                        <option value="transfer">Transf.</option>
                                                    </select>
                                                </div>
                                                <button onClick={addFinance} className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded">Guardar Registro</button>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {financials.map(f => (
                                                <div key={f.id} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0">
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{f.concept}</p>
                                                        <p className="text-xs text-slate-500">{new Date(f.date).toLocaleDateString()} • {f.method === 'card' ? 'Tarjeta' : f.method === 'transfer' ? 'Transferencia' : 'Efectivo'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white font-mono">${f.amount}</p>
                                                        <span className={`text-[10px] uppercase font-bold px-1 rounded ${f.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                            {f.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {financials.length === 0 && <p className="text-slate-500 italic text-xs">Sin registros financieros.</p>}
                                        </div>
                                    </div>

                                    {/* Reminders */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-white">Recordatorios</h3>
                                            <button onClick={() => setIsAddingReminder(true)} className="text-indigo-400 text-xs font-bold border border-indigo-500/30 px-3 py-1 rounded hover:bg-indigo-500/10">+ Añadir</button>
                                        </div>
                                        
                                        {isAddingReminder && (
                                             <div className="bg-slate-950 p-3 rounded mb-4 animate-slide-up space-y-2">
                                                <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="Tarea / Recordatorio" onChange={e => setReminderForm({...reminderForm, title: e.target.value})} />
                                                <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" onChange={e => setReminderForm({...reminderForm, date: e.target.value})} />
                                                <div className="flex gap-2">
                                                    <button onClick={addReminder} className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded">Guardar</button>
                                                    <button onClick={() => alert("Función de envío de notificación en desarrollo.")} className="flex-1 bg-slate-800 text-slate-300 text-xs font-bold py-2 rounded border border-slate-700">Notificar al Paciente</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {reminders.map(r => (
                                                <div key={r.id} className="flex items-center gap-3 p-2 bg-slate-800/30 rounded border border-slate-800">
                                                    <div className={`w-2 h-2 rounded-full ${r.isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm ${r.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>{r.title}</p>
                                                        <p className="text-xs text-slate-500">{new Date(r.date).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                             {reminders.length === 0 && <p className="text-slate-500 italic text-xs">Sin recordatorios pendientes.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal for Survey Results - PORTALED */}
            {viewingAssignment && createPortal(
                <div 
                    className="fixed top-0 left-0 w-screen h-screen z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={() => setViewingAssignment(null)}
                >
                    <div 
                        className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white">{viewingAssignment.templateTitle}</h3>
                                <p className="text-sm text-slate-400">Resultados del {new Date(viewingAssignment.completedAt || 0).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setViewingAssignment(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <SurveyResultView assignment={viewingAssignment} templates={templates} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
            {/* Modal for Template PREVIEW - PORTALED */}
            {viewingTemplate && createPortal(
                <div 
                    className="fixed top-0 left-0 w-screen h-screen z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={() => setViewingTemplate(null)}
                >
                    <div 
                        className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white">{viewingTemplate.title}</h3>
                                <p className="text-sm text-slate-400">Vista Previa de Preguntas</p>
                            </div>
                            <button onClick={() => setViewingTemplate(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {viewingTemplate.questions.map((q, idx) => (
                                <div key={q.id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            {q.type === 'scale' ? 'Escala' : q.type === 'multiple_choice' ? 'Opción Múltiple' : 'Texto'}
                                        </span>
                                        <span className="text-slate-500 text-xs">Pregunta {idx + 1}</span>
                                    </div>
                                    <p className="text-white font-medium mb-3">{q.text}</p>
                                    {q.options && (
                                        <div className="space-y-2 pl-4 border-l border-slate-700">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className="text-sm text-slate-400 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                            <button onClick={() => setViewingTemplate(null)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700">Cerrar Vista Previa</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal for Patient Report - PORTALED */}
            {selectedReport && createPortal(
                <div 
                    className="fixed top-0 left-0 w-screen h-screen z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
                    onClick={() => setSelectedReport(null)}
                >
                    <div 
                        className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white">Informe Diario</h3>
                                <p className="text-sm text-slate-400">{new Date(selectedReport.date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">Caja Positiva</h4>
                                <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                                    {selectedReport.content.positives.length > 0 ? selectedReport.content.positives.map((p, i) => <li key={i}>{p}</li>) : <li className="italic text-slate-600">Sin entradas</li>}
                                </ul>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-slate-400 font-bold mb-2 uppercase text-xs tracking-wider">Caja Negativa</h4>
                                <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                                    {selectedReport.content.negatives.length > 0 ? selectedReport.content.negatives.map((p, i) => <li key={i}>{p}</li>) : <li className="italic text-slate-600">Sin entradas</li>}
                                </ul>
                            </div>
                            <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                                <h4 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-wider">Resumen IA / Sistema</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">{selectedReport.content.summary}</p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PsychologistDashboard;

