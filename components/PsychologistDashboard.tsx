
import React, { useState, useEffect } from 'react';
import { User, SurveyTemplate, QuestionType, SurveyQuestion, PatientReport, SurveyAssignment } from '../types';
import { getMyPatients, registerUser } from '../services/mockAuthService';
import { saveSurveyTemplate, getTemplatesByPsychologist, assignSurveyToPatient, getReportsForPatient, getAssignmentsByPsychologist, getReportsByPsychologist, getAllSurveysForPatient } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { INITIAL_MENTAL_HEALTH_ASSESSMENT } from '../constants';
import { calculateMentalHealthScore } from '../services/scoringService';

interface Props {
    user: User;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; colorClass: string; onClick?: () => void }> = ({ title, value, icon, colorClass, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 transition-all shadow-lg ${onClick ? 'cursor-pointer hover:border-brand-500/50 hover:-translate-y-1 hover:shadow-brand-900/10' : ''}`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{title}</p>
        </div>
    </div>
);

const PsychologistDashboard: React.FC<Props> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'tools' | 'review'>('overview');
    const [patients, setPatients] = useState<User[]>([]);
    const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
    const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
    const [allReports, setAllReports] = useState<PatientReport[]>([]);
    
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
    
    // Assignment State & Viewing Reports
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [assignMsg, setAssignMsg] = useState('');
    const [selectedPatientReports, setSelectedPatientReports] = useState<PatientReport[]>([]);
    const [patientPendingTasks, setPatientPendingTasks] = useState<SurveyAssignment[]>([]);
    const [patientCompletedTasks, setPatientCompletedTasks] = useState<SurveyAssignment[]>([]);
    const [isViewingPatientDetails, setIsViewingPatientDetails] = useState(false);
    
    // Detailed Views (Modals)
    const [selectedReport, setSelectedReport] = useState<PatientReport | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<SurveyAssignment | null>(null); // For Modal

    // Review Tab State & Filters
    const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null); // For Inline Accordion (Review Tab)
    const [filterPatient, setFilterPatient] = useState('all');
    const [filterType, setFilterType] = useState<'all' | 'survey' | 'naretbox'>('all');
    const [filterTemplate, setFilterTemplate] = useState('all');
    const [filterRisk, setFilterRisk] = useState(false);

    const fetchData = async () => {
        try {
            const myPatients = await getMyPatients(user.id);
            setPatients(myPatients);
            const myTemplates = await getTemplatesByPsychologist(user.id);
            setTemplates(myTemplates);
            const myAssignments = await getAssignmentsByPsychologist(user.id);
            setAssignments(myAssignments);
            const myReports = await getReportsByPsychologist(user.id);
            setAllReports(myReports);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id, activeTab]);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            if(selectedPatientId) {
                const reports = await getReportsForPatient(selectedPatientId);
                setSelectedPatientReports(reports);
                
                const allAssignments = await getAllSurveysForPatient(selectedPatientId);
                setPatientPendingTasks(allAssignments.filter(a => a.status === 'pending'));
                setPatientCompletedTasks(allAssignments.filter(a => a.status === 'completed'));
            } else {
                setSelectedPatientReports([]);
                setPatientPendingTasks([]);
                setPatientCompletedTasks([]);
            }
        };
        fetchPatientDetails();
    }, [selectedPatientId]);

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerUser(pName, pEmail, pPassword, 'patient', user.id, pSurnames, pPhone);
            setCreateMsg('Paciente registrado con éxito');
            await fetchData();
            setPName(''); setPSurnames(''); setPEmail(''); setPPhone(''); setPPassword('');
            setTimeout(() => {
                setCreateMsg('');
                setIsCreatingPatient(false);
            }, 2000);
        } catch (error: any) {
            setCreateMsg('Error: ' + error.message);
        }
    };

    // ... (Builder functions omitted for brevity, logic remains same) ...
    const addQuestion = (type: QuestionType) => {
        const newQ: SurveyQuestion = { id: crypto.randomUUID(), type, text: '', options: type === 'multiple_choice' ? ['Opción 1', 'Opción 2'] : undefined };
        setQuestions([...questions, newQ]);
    };
    const updateQuestionText = (id: string, text: string) => setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
    const updateOptionText = (qId: string, optIdx: number, text: string) => setQuestions(questions.map(q => { if (q.id !== qId || !q.options) return q; const newOpts = [...q.options]; newOpts[optIdx] = text; return { ...q, options: newOpts }; }));
    const addOption = (qId: string) => setQuestions(questions.map(q => { if (q.id !== qId || !q.options) return q; return { ...q, options: [...q.options, `Opción ${q.options.length + 1}`] }; }));
    const removeOption = (qId: string, optIdx: number) => setQuestions(questions.map(q => { if (q.id !== qId || !q.options || q.options.length <= 2) return q; const newOpts = q.options.filter((_, idx) => idx !== optIdx); return { ...q, options: newOpts }; }));

    const saveTemplate = async () => {
        if (!newTemplateTitle.trim() || questions.length === 0) return;
        const template: SurveyTemplate = { id: crypto.randomUUID(), psychologistId: user.id, title: newTemplateTitle, description: 'Creada por ' + user.name, questions, createdAt: Date.now() };
        try { await saveSurveyTemplate(template); setTemplates(prev => [...prev, template]); setNewTemplateTitle(''); setQuestions([]); setIsBuilderMode(false); alert('Plantilla guardada con éxito'); } catch (e) { console.error(e); alert('Error al guardar la plantilla'); }
    };

    const handleAssign = async () => {
        if (!selectedPatientId || !selectedTemplateId) return;
        let template = templates.find(t => t.id === selectedTemplateId);
        if (selectedTemplateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) template = INITIAL_MENTAL_HEALTH_ASSESSMENT;
        if (template) {
            try {
                await assignSurveyToPatient(template, selectedPatientId, user.id);
                setAssignMsg('Encuesta enviada correctamente.');
                const allAssignments = await getAllSurveysForPatient(selectedPatientId);
                setPatientPendingTasks(allAssignments.filter(a => a.status === 'pending'));
                setTimeout(() => setAssignMsg(''), 3000);
            } catch (e: any) { console.error(e); setAssignMsg('Error al enviar la encuesta: ' + e.message); }
        }
    };

    const getPatientName = (id: string) => { const p = patients.find(pat => pat.id === id); return p ? `${p.name} ${p.surnames || ''}` : 'Usuario desconocido'; };
    
    const getQuestionText = (templateId: string, qId: string) => {
        if (templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) { const q = INITIAL_MENTAL_HEALTH_ASSESSMENT.questions.find(qu => qu.id === qId); return q ? q.text : 'Pregunta'; }
        const temp = templates.find(t => t.id === templateId); if (!temp) return 'Pregunta no encontrada'; const q = temp.questions.find(qu => qu.id === qId); return q ? q.text : 'Pregunta eliminada';
    };

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || (p.surnames && p.surnames.toLowerCase().includes(patientSearchTerm.toLowerCase())) || p.email.toLowerCase().includes(patientSearchTerm.toLowerCase()));

    const getChartData = () => {
        return selectedPatientReports.slice(0, 10).reverse().map(r => ({ date: new Date(r.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }), positivos: r.content.positives.length, negativos: r.content.negatives.length, amt: r.content.positives.length + r.content.negatives.length }));
    };

    // Stats
    const totalPatients = patients.length;
    const activeTemplates = templates.length + 1; 
    const completedSurveys = assignments.filter(a => a.status === 'completed');
    const totalReports = allReports.length;

    const riskAlerts = completedSurveys.filter(a => {
        if (a.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id && a.responses) {
            const score = calculateMentalHealthScore(a.responses);
            return score.redFlags.length > 0 || score.depression.level === 'Grave' || score.anxiety.level === 'Grave';
        }
        return false;
    }).length;

    const getUnifiedResults = () => {
        const surveyItems = assignments.filter(a => a.status === 'completed').map(a => {
                let isRisk = false;
                if (a.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id && a.responses) {
                     const score = calculateMentalHealthScore(a.responses);
                     isRisk = score.redFlags.length > 0 || score.depression.level === 'Grave';
                }
                return { type: 'survey' as const, id: a.id, date: a.completedAt || 0, title: a.templateTitle, patientId: a.patientId, details: a, isRisk };
            });
        
        const reportItems = allReports.map(r => ({ type: 'naretbox' as const, id: r.id, date: r.date, title: 'Informe Naretbox', patientId: r.patientId, details: r, isRisk: false }));
        let combined = [...surveyItems, ...reportItems];

        if (filterPatient !== 'all') combined = combined.filter(i => i.patientId === filterPatient);
        if (filterType !== 'all') combined = combined.filter(i => i.type === filterType);
        if (filterRisk) combined = combined.filter(i => i.isRisk);
        if (filterTemplate !== 'all' && filterType !== 'naretbox') combined = combined.filter(i => i.type === 'survey' && (i.details as SurveyAssignment).templateId === filterTemplate);

        return combined.sort((a, b) => b.date - a.date);
    };

    const unifiedResults = getUnifiedResults();

    const getPatientHistory = () => {
        const reports = selectedPatientReports.map(r => ({ ...r, type: 'report' }));
        const surveys = patientCompletedTasks.map(s => ({ ...s, type: 'survey', date: s.completedAt || 0 }));
        return [...reports, ...surveys].sort((a, b) => b.date - a.date);
    };
    
    const patientHistory = getPatientHistory();

    // Reusable Component for Rendering Survey Results
    const SurveyResultView = ({ assignment }: { assignment: SurveyAssignment }) => {
        if (assignment.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) {
            const score = calculateMentalHealthScore(assignment.responses!);
            return (
                <div className="space-y-6">
                    {score.redFlags.length > 0 && (<div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-xl flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><div><p className="font-bold">ATENCIÓN REQUERIDA</p><ul className="list-disc list-inside text-sm mt-1">{score.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></div></div>)}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[score.depression, score.anxiety, score.stress].map((metric, i) => (<div key={i} className="bg-slate-900 border border-slate-700 p-5 rounded-xl"><div className="flex justify-between items-center mb-2"><h4 className="font-bold text-slate-300 uppercase tracking-wider text-xs">{i === 0 ? 'Depresión' : i === 1 ? 'Ansiedad' : 'Estrés'}</h4><span className={`text-sm font-bold ${metric.color}`}>{metric.level}</span></div><div className="w-full bg-slate-800 h-2 rounded-full mb-3"><div className={`h-2 rounded-full ${metric.color.replace('text-', 'bg-')}`} style={{ width: `${(metric.rawScore / metric.maxScore) * 100}%` }}></div></div><p className="text-xs text-slate-400">{metric.advice}</p></div>))}</div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><h4 className="font-bold text-slate-300 text-sm mb-4">Respuestas Detalladas</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{assignment.responses?.map((resp, rIdx) => (<div key={rIdx} className="text-sm"><p className="text-slate-500 mb-1">{getQuestionText(INITIAL_MENTAL_HEALTH_ASSESSMENT.id, resp.questionId).substring(0, 60)}...</p><p className="text-white font-medium pl-2 border-l-2 border-slate-700">{resp.answer}</p></div>))}</div></div>
                </div>
            );
        }
        return (
            <div className="space-y-6 max-w-3xl">{assignment.responses?.map((resp, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-2">Pregunta {idx + 1}</p><p className="text-slate-300 text-sm mb-3 font-medium border-b border-slate-800 pb-2">{getQuestionText(assignment.templateId, resp.questionId)}</p><p className="text-white text-lg font-light pl-2 border-l-2 border-brand-500">{resp.answer}</p></div>))}</div>
        );
    };

    return (
        <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto pb-24 space-y-8">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div><h1 className="text-3xl font-bold text-white">Panel del Psicólogo</h1><p className="text-slate-400 mt-1">Gestión integral de pacientes y herramientas.</p></div>
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>Resumen</button>
                        <button onClick={() => setActiveTab('patients')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'patients' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>Pacientes</button>
                        <button onClick={() => setActiveTab('tools')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'tools' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>Herramientas</button>
                        <button onClick={() => setActiveTab('review')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'review' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>Resultados</button>
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                        <StatCard onClick={() => setActiveTab('patients')} title="Total Pacientes" value={totalPatients} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} colorClass="bg-indigo-500/20 text-indigo-400" />
                        <StatCard title="Plantillas Activas" value={activeTemplates} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} colorClass="bg-brand-500/20 text-brand-400" />
                        <StatCard 
                            onClick={() => { setActiveTab('review'); setFilterType('naretbox'); setFilterRisk(false); }}
                            title="Informes Recibidos" value={totalReports} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} colorClass="bg-emerald-500/20 text-emerald-400" />
                        <StatCard 
                            onClick={() => { setActiveTab('review'); setFilterRisk(true); }}
                            title="Alertas de Riesgo" value={riskAlerts} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} colorClass={`${riskAlerts > 0 ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-500'}`} />
                    </div>
                )}
            </div>

            {/* PATIENTS TAB - (Code mostly unchanged, just rendering) */}
            {(activeTab === 'patients' || activeTab === 'overview') && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-slate-200">{activeTab === 'overview' ? 'Acceso Rápido a Pacientes' : 'Directorio de Pacientes'}</h2>
                         <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span><input type="text" value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} placeholder="Buscar por nombre..." className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"/></div>
                            {activeTab === 'patients' && (<button onClick={() => setIsCreatingPatient(true)} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 whitespace-nowrap"><span className="hidden md:inline">Nuevo Paciente</span><span className="md:hidden">+</span></button>)}
                        </div>
                    </div>
                    {isCreatingPatient && (<div className="mb-6 p-6 bg-slate-900 border border-slate-700 rounded-3xl animate-slide-up shadow-2xl relative z-20"><div className="flex justify-between mb-4"><h3 className="text-white font-bold">Registrar Nuevo Paciente</h3><button onClick={() => setIsCreatingPatient(false)} className="text-slate-500 hover:text-white">✕</button></div>{createMsg && <p className={`text-sm mb-3 ${createMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{createMsg}</p>}<form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-2 gap-4"><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Nombre" value={pName} onChange={e => setPName(e.target.value)} required /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Apellidos" value={pSurnames} onChange={e => setPSurnames(e.target.value)} required /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Email" type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} required /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Teléfono" value={pPhone} onChange={e => setPPhone(e.target.value)} /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm md:col-span-2 outline-none focus:border-brand-500" placeholder="Contraseña Temporal" type="password" value={pPassword} onChange={e => setPPassword(e.target.value)} required /><button type="submit" className="md:col-span-2 bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors shadow-lg">Crear Cuenta Paciente</button></form></div>)}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.length === 0 ? (<div className="col-span-full py-10 text-center text-slate-500 italic bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">{patients.length === 0 ? "No tienes pacientes asignados aún." : "No se encontraron pacientes con ese nombre."}</div>) : (filteredPatients.map(p => (<div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 transition-all hover:shadow-xl group flex flex-col justify-between"><div className="flex items-start gap-4 mb-4"><div className="w-14 h-14 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700 group-hover:border-brand-500/50 transition-colors">{p.photoUrl ? (<img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">{p.name.charAt(0)}</div>)}</div><div><h3 className="font-bold text-lg text-white group-hover:text-brand-300 transition-colors">{p.name} {p.surnames}</h3><p className="text-sm text-slate-400">{p.email}</p></div></div><div className="mt-auto space-y-3"><div className="grid grid-cols-2 gap-2"><button onClick={() => { setSelectedPatientId(p.id); setIsViewingPatientDetails(true); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors border border-slate-700">Ver Perfil</button><button onClick={() => { setSelectedPatientId(p.id); setIsViewingPatientDetails(true); }} className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-bold py-2 rounded-lg transition-colors">Asignar Tarea</button></div></div></div>)))}
                    </div>
                </div>
            )}

            {/* TOOLS TAB (Builder) - Unchanged */}
            {activeTab === 'tools' && (
                <div className="space-y-8 animate-fade-in">
                    {!isBuilderMode ? (
                        <>
                            <div><h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-brand-500 rounded-full"></span>Evaluaciones Estándar</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-brand-500/30 rounded-2xl p-6 hover:border-brand-500 transition-all flex flex-col h-full shadow-lg shadow-brand-900/10"><div className="flex items-start justify-between mb-4"><div className="p-3 bg-brand-500 text-white rounded-xl shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><span className="text-[10px] uppercase bg-brand-900/30 text-brand-300 px-2 py-1 rounded font-bold border border-brand-500/30">Recomendado</span></div><h3 className="font-bold text-lg text-white mb-2">{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</h3><p className="text-slate-400 text-sm mb-6 flex-1">{INITIAL_MENTAL_HEALTH_ASSESSMENT.description}</p><div className="mt-auto"><button onClick={() => { alert("Selecciona un paciente en la pestaña 'Pacientes' para asignarle esta evaluación."); setActiveTab('patients'); }} className="w-full bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 font-bold py-3 rounded-xl transition-all border border-slate-700 hover:border-brand-500">Asignar a Paciente</button></div></div></div></div>
                            <div><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-slate-200 flex items-center gap-2"><span className="w-1 h-6 bg-indigo-500 rounded-full"></span>Mis Plantillas</h2><button onClick={() => setIsBuilderMode(true)} className="text-indigo-400 hover:text-white text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"><span>+</span> Crear Nueva</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{templates.length === 0 ? (<div className="col-span-full py-8 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed"><p className="text-slate-500 text-sm">No has creado plantillas personalizadas.</p></div>) : (templates.map(t => (<div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all flex flex-col h-full"><h3 className="font-bold text-lg text-white mb-2">{t.title}</h3><p className="text-slate-400 text-sm mb-4 flex-1 line-clamp-2">{t.description}</p><div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-950/50 p-2 rounded-lg w-fit"><span>{t.questions.length} Preguntas</span></div></div>)))}</div></div>
                        </>
                    ) : (
                         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl animate-slide-up">
                            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800"><h2 className="text-2xl font-bold text-slate-200">Nueva Plantilla</h2><button onClick={() => setIsBuilderMode(false)} className="text-slate-500 hover:text-white flex items-center gap-2 text-sm font-bold">Cancelar</button></div>
                            <div className="mb-8"><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Título de la Herramienta</label><input type="text" placeholder="Ej. Evaluación de Ansiedad Semanal" className="w-full bg-slate-800 text-white p-4 rounded-xl border border-slate-700 focus:border-brand-500 outline-none text-lg font-bold placeholder-slate-600" value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)} /></div>
                            <div className="space-y-6 mb-8">{questions.map((q, idx) => (<div key={q.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl relative group hover:border-slate-700 transition-colors"><span className="absolute top-4 right-4 text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono">Pregunta {idx + 1}</span><div className="mb-4"><label className="text-xs text-brand-500 font-bold uppercase block mb-1">{q.type === 'scale' ? 'Escala 1-10' : q.type === 'text' ? 'Respuesta de Texto' : 'Selección Múltiple'}</label><input type="text" placeholder="Escribe la pregunta aquí..." className="w-full bg-transparent text-lg text-white placeholder-slate-600 outline-none border-b border-transparent focus:border-slate-700 py-1 transition-colors" value={q.text} onChange={(e) => updateQuestionText(q.id, e.target.value)} autoFocus /></div>{q.type === 'scale' && <div className="flex gap-1 h-2 w-full mt-2">{[...Array(10)].map((_, i) => <div key={i} className="flex-1 bg-slate-800 rounded-full"></div>)}</div>}{q.type === 'multiple_choice' && q.options && (<div className="space-y-3 mt-4 pl-4 border-l-2 border-slate-800">{q.options.map((opt, optIdx) => (<div key={optIdx} className="flex items-center gap-3"><div className="w-4 h-4 rounded-full border border-slate-600 shrink-0"></div><input type="text" value={opt} onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 focus:border-brand-500 rounded px-3 py-2 text-slate-300 text-sm outline-none" />{q.options && q.options.length > 2 && <button onClick={() => removeOption(q.id, optIdx)} className="text-slate-600 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>}</div>))}<button onClick={() => addOption(q.id)} className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 mt-2">+ Añadir Opción</button></div>)}<button onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))} className="absolute bottom-4 right-4 text-slate-600 hover:text-red-400 transition-colors p-2" title="Eliminar pregunta"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></div>))}<div className="grid grid-cols-3 gap-4 py-4"><button onClick={() => addQuestion('text')} className="p-4 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm font-bold flex flex-col items-center gap-2 border border-slate-700 hover:border-slate-500"><span className="text-2xl">Aa</span>Texto Libre</button><button onClick={() => addQuestion('scale')} className="p-4 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm font-bold flex flex-col items-center gap-2 border border-slate-700 hover:border-slate-500"><span className="text-2xl">1-10</span>Escala</button><button onClick={() => addQuestion('multiple_choice')} className="p-4 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm font-bold flex flex-col items-center gap-2 border border-slate-700 hover:border-slate-500"><span className="text-2xl">☑</span>Opción Múltiple</button></div></div>
                            <div className="flex justify-end pt-6 border-t border-slate-800"><button onClick={saveTemplate} disabled={!newTemplateTitle || questions.length === 0} className="bg-brand-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-brand-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">Guardar Plantilla</button></div>
                        </div>
                    )}
                </div>
            )}

            {/* REVIEW TAB */}
            {activeTab === 'review' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-200">Resultados y Seguimiento</h2>
                            {(filterRisk || filterPatient !== 'all' || filterType !== 'all') && (
                                <button onClick={() => { setFilterRisk(false); setFilterPatient('all'); setFilterType('all'); setFilterTemplate('all'); }} className="text-xs text-brand-400 hover:text-brand-300 underline">Limpiar filtros</button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
                            <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)} className="bg-slate-900 text-white text-sm border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-brand-500"><option value="all">Todos los Pacientes</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.surnames}</option>)}</select>
                            <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-slate-900 text-white text-sm border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-brand-500"><option value="all">Todo tipo de pruebas</option><option value="survey">Encuestas / Formularios</option><option value="naretbox">Informes Naretbox</option></select>
                            {filterType !== 'naretbox' && (<select value={filterTemplate} onChange={e => setFilterTemplate(e.target.value)} className="bg-slate-900 text-white text-sm border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-brand-500"><option value="all">Todas las plantillas</option>{templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}<option value={INITIAL_MENTAL_HEALTH_ASSESSMENT.id}>Evaluación Inicial (Estándar)</option></select>)}
                        </div>
                    </div>
                    {filterRisk && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>Mostrando solo resultados con riesgo detectado</div>}
                    {unifiedResults.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl"><p>No se encontraron resultados con los filtros actuales.</p></div>
                    ) : (
                        <div className="grid gap-4">
                            {unifiedResults.map((result, idx) => (
                                <div key={`${result.type}-${result.id}`} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${result.isRisk ? 'border-red-500 shadow-lg shadow-red-900/20' : 'border-slate-800 hover:border-slate-600'}`}>
                                    <button onClick={() => { if (result.type === 'survey') { setOpenAssignmentId(openAssignmentId === result.id ? null : result.id); } else { setSelectedReport(result.details as PatientReport); } }} className="w-full flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors text-left">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.isRisk ? 'bg-red-500/20 text-red-500 animate-pulse' : (result.type === 'survey' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')}`}>
                                                {result.isRisk ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> : (result.type === 'survey' ? ((result.details as SurveyAssignment).templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id ? '🏥' : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 5a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1V8a1 1 0 011-1zm5-5a1 1 0 110 2h5a1 1 0 110-2h-5zM9 7a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1zm0 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>))}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg flex items-center gap-2">{result.title} 
                                                    {result.isRisk && <span className="text-[10px] bg-red-500 text-white px-2 rounded uppercase font-bold">Riesgo Detectado</span>}
                                                    {result.type === 'naretbox' && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 rounded uppercase font-bold">Naretbox</span>} 
                                                    {result.type === 'survey' && !result.isRisk && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 rounded uppercase font-bold">Encuesta</span>}
                                                </p>
                                                <p className="text-slate-400 text-sm">Paciente: <span className="text-slate-300">{getPatientName(result.patientId)}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right"><span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded font-bold uppercase">Completado</span><p className="text-sm text-slate-500 mt-1">{result.date && new Date(result.date).toLocaleDateString()}</p></div>
                                            <div className={`transition-transform duration-300 ${openAssignmentId === result.id ? 'rotate-180' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                                        </div>
                                    </button>
                                    {result.type === 'survey' && openAssignmentId === result.id && (
                                        <div className="border-t border-slate-800 p-8 bg-slate-950/30 animate-slide-up">
                                            <SurveyResultView assignment={result.details as SurveyAssignment} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- PATIENT DETAILS MODAL --- */}
            {isViewingPatientDetails && selectedPatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
                        <div className="bg-slate-900 p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-sm">{getPatientName(selectedPatientId).charAt(0)}</div>{getPatientName(selectedPatientId)}</h2>
                                <p className="text-slate-500 text-xs mt-1 ml-14 uppercase tracking-widest font-bold">Historial Clínico</p>
                            </div>
                            <button onClick={() => setIsViewingPatientDetails(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-950/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Stats Cards - Unchanged */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Tendencia Emocional (Últimos días)</h3>
                                    <div className="h-40 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={getChartData()}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} cursor={{fill: '#1e293b'}} /><Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} /><Bar dataKey="positivos" fill="#10b981" radius={[4, 4, 0, 0]} name="Positivos" stackId="a" /><Bar dataKey="negativos" fill="#64748b" radius={[4, 4, 0, 0]} name="Negativos" stackId="a" /></BarChart></ResponsiveContainer></div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-center">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Actividad Naretbox</h3>
                                    <p className="text-3xl font-bold text-white mb-1">{selectedPatientReports.length}</p>
                                    <p className="text-slate-500 text-sm">Informes totales enviados</p>
                                    <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-brand-500 h-full rounded-full" style={{ width: `${Math.min(selectedPatientReports.length * 5, 100)}%` }}></div></div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                                     <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Asignar Nueva Tarea</h3>
                                     <div className="space-y-3">
                                        <select className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-700 outline-none text-sm" onChange={(e) => setSelectedTemplateId(e.target.value)} value={selectedTemplateId}>
                                            <option value="">Seleccionar Plantilla...</option>
                                            <option value={INITIAL_MENTAL_HEALTH_ASSESSMENT.id}>{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                        </select>
                                        <button onClick={handleAssign} disabled={!selectedTemplateId} className="w-full bg-brand-500 text-white py-2 font-bold rounded-lg hover:bg-brand-600 disabled:opacity-50 text-sm">Enviar Ahora</button>
                                        {assignMsg && <p className="text-xs text-center text-emerald-400">{assignMsg}</p>}
                                     </div>
                                </div>
                            </div>
                            
                            {/* PENDING TASKS SECTION */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Tareas Pendientes
                                </h3>
                                {patientPendingTasks.length === 0 ? (
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 border-dashed text-slate-500 text-sm italic">
                                        El paciente no tiene tareas pendientes.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {patientPendingTasks.map(task => (
                                            <div key={task.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-white font-bold text-sm">{task.templateTitle}</h4>
                                                    <p className="text-xs text-slate-500">Asignado el {new Date(task.assignedAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className="bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold px-2 py-1 rounded">Pendiente</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reports History List (Merged) */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Historial Completo
                                </h3>
                                {patientHistory.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">No hay historial disponible.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {patientHistory.map((item: any) => {
                                            const isSurvey = item.type === 'survey';
                                            let isRisk = false;
                                            if (isSurvey && item.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id && item.responses) {
                                                const score = calculateMentalHealthScore(item.responses);
                                                isRisk = score.redFlags.length > 0 || score.depression.level === 'Grave';
                                            }

                                            return (
                                            <button 
                                                key={item.id} 
                                                onClick={() => { 
                                                    // Improved: Click always opens a modal
                                                    if (!isSurvey) setSelectedReport(item as PatientReport); 
                                                    else setViewingAssignment(item as SurveyAssignment);
                                                }} 
                                                className={`w-full bg-slate-900 hover:bg-slate-800 px-6 py-4 rounded-xl border text-left transition-all group flex items-center justify-between ${isRisk ? 'border-red-500 shadow-lg shadow-red-900/20' : 'border-slate-800 hover:border-brand-500/50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                     <div className={`p-2 rounded-lg ${isRisk ? 'bg-red-500/20 text-red-400' : (isSurvey ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400')}`}>
                                                        {isRisk ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> : (isSurvey ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>)}
                                                     </div>
                                                     <div>
                                                         <span className="text-white font-bold block flex items-center gap-2">
                                                            {isSurvey ? item.templateTitle : 'Informe Naretbox'}
                                                            {isRisk && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">RIESGO</span>}
                                                         </span>
                                                         <span className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                                     </div>
                                                </div>
                                                <div className="flex gap-2 text-xs items-center">
                                                    {!isSurvey && (
                                                        <>
                                                            <span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full border border-emerald-900/50 font-bold">{item.content.positives.length} Positivos</span>
                                                            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full border border-slate-600 font-bold">{item.content.negatives.length} Negativos</span>
                                                        </>
                                                    )}
                                                    {isSurvey && (
                                                        <span className="text-slate-500 flex items-center gap-1 group-hover:text-white transition-colors">
                                                            Ver detalles <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )})}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Report (Naretbox) */}
            {selectedReport && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="bg-slate-900 p-6 border-b border-slate-800 flex justify-between items-center">
                            <div><h2 className="text-xl font-bold text-white flex items-center gap-2">Informe Diario</h2><p className="text-slate-400 text-sm mt-1">{new Date(selectedReport.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            {selectedReport.content.summary && (<div className="bg-indigo-900/20 border border-indigo-500/20 p-5 rounded-2xl"><h3 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">Resumen IA</h3><p className="text-indigo-100 text-sm leading-relaxed">{selectedReport.content.summary}</p></div>)}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3"><h3 className="text-emerald-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 border-b border-emerald-900/30 pb-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Caja Positiva</h3>{selectedReport.content.positives.length > 0 ? (selectedReport.content.positives.map((item, i) => (<div key={i} className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl text-emerald-100 text-base leading-relaxed">{item}</div>))) : (<p className="text-slate-500 text-sm italic py-2">Sin entradas positivas.</p>)}</div>
                                <div className="space-y-3"><h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div>Caja Negativa</h3>{selectedReport.content.negatives.length > 0 ? (selectedReport.content.negatives.map((item, i) => (<div key={i} className="bg-slate-800/40 border border-slate-700 p-4 rounded-xl text-slate-200 text-base leading-relaxed">{item}</div>))) : (<p className="text-slate-500 text-sm italic py-2">Sin entradas negativas.</p>)}</div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900 border-t border-slate-800 text-right"><button onClick={() => setSelectedReport(null)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">Cerrar</button></div>
                    </div>
                </div>
            )}

            {/* Modal for Survey Results */}
            {viewingAssignment && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-3xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="bg-slate-900 p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                            <div><h2 className="text-xl font-bold text-white">{viewingAssignment.templateTitle}</h2><p className="text-slate-400 text-sm mt-1">Completado el {new Date(viewingAssignment.completedAt || 0).toLocaleDateString()}</p></div>
                            <button onClick={() => setViewingAssignment(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-slate-950/30">
                            <SurveyResultView assignment={viewingAssignment} />
                        </div>
                        <div className="p-4 bg-slate-900 border-t border-slate-800 text-right"><button onClick={() => setViewingAssignment(null)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">Cerrar</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PsychologistDashboard;
