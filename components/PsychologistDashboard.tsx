
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { User, SurveyTemplate, QuestionType, SurveyQuestion, PatientReport, SurveyAssignment, EducationalResource } from '../types';
import { getMyPatients, registerUser } from '../services/mockAuthService';
import { saveSurveyTemplate, getTemplatesByPsychologist, assignSurveyToPatient, getReportsForPatient, getAssignmentsByPsychologist, getReportsByPsychologist, getAllSurveysForPatient, saveResource, getResourcesByPsychologist, assignResourceToPatient } from '../services/dataService';
import { INITIAL_MENTAL_HEALTH_ASSESSMENT, BDI_II_ASSESSMENT } from '../constants';
import { calculateMentalHealthScore, calculateBDIScore } from '../services/scoringService';

interface Props {
    user: User;
    activeSection: 'overview' | 'patients' | 'tools' | 'review';
    onSectionChange: (section: 'overview' | 'patients' | 'tools' | 'review') => void;
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

const PsychologistDashboard: React.FC<Props> = ({ user, activeSection, onSectionChange }) => {
    // Sync activeSection with internal render logic
    const [patients, setPatients] = useState<User[]>([]);
    const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
    const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
    const [allReports, setAllReports] = useState<PatientReport[]>([]);
    const [resources, setResources] = useState<EducationalResource[]>([]);
    
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
    
    // Resource (Infographics) State
    const [isResourceMode, setIsResourceMode] = useState(false);
    const [resTitle, setResTitle] = useState('');
    const [resDesc, setResDesc] = useState('');
    const [resType, setResType] = useState<'image' | 'pdf' | 'video' | 'link'>('image');
    const [resUrl, setResUrl] = useState('');

    // Assignment State & Viewing Reports
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    const [assignMsg, setAssignMsg] = useState('');
    const [selectedPatientReports, setSelectedPatientReports] = useState<PatientReport[]>([]);
    const [patientPendingTasks, setPatientPendingTasks] = useState<SurveyAssignment[]>([]);
    const [patientCompletedTasks, setPatientCompletedTasks] = useState<SurveyAssignment[]>([]);
    const [isViewingPatientDetails, setIsViewingPatientDetails] = useState(false);
    
    // Detailed Views (Modals)
    const [selectedReport, setSelectedReport] = useState<PatientReport | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<SurveyAssignment | null>(null);
    
    // Template Preview
    const [viewingTemplate, setViewingTemplate] = useState<SurveyTemplate | null>(null);

    // Review Tab State & Filters
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
            const myResources = await getResourcesByPsychologist(user.id);
            setResources(myResources);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.id, activeSection]);

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
            setTimeout(() => { setCreateMsg(''); setIsCreatingPatient(false); }, 2000);
        } catch (error: any) { setCreateMsg('Error: ' + error.message); }
    };

    // Builder Logic
    const addQuestion = (type: QuestionType) => { const newQ: SurveyQuestion = { id: crypto.randomUUID(), type, text: '', options: type === 'multiple_choice' ? ['Opción 1', 'Opción 2'] : undefined }; setQuestions([...questions, newQ]); };
    const updateQuestionText = (id: string, text: string) => setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
    const updateOptionText = (qId: string, optIdx: number, text: string) => setQuestions(questions.map(q => { if (q.id !== qId || !q.options) return q; const newOpts = [...q.options]; newOpts[optIdx] = text; return { ...q, options: newOpts }; }));
    const addOption = (qId: string) => setQuestions(questions.map(q => { if (q.id !== qId || !q.options) return q; return { ...q, options: [...q.options, `Opción ${q.options.length + 1}`] }; }));
    const removeOption = (qId: string, optIdx: number) => setQuestions(questions.map(q => { if (q.id !== qId || !q.options || q.options.length <= 2) return q; const newOpts = q.options.filter((_, idx) => idx !== optIdx); return { ...q, options: newOpts }; }));
    const saveTemplate = async () => { if (!newTemplateTitle.trim() || questions.length === 0) return; const template: SurveyTemplate = { id: crypto.randomUUID(), psychologistId: user.id, title: newTemplateTitle, description: 'Creada por ' + user.name, questions, createdAt: Date.now() }; try { await saveSurveyTemplate(template); setTemplates(prev => [...prev, template]); setNewTemplateTitle(''); setQuestions([]); setIsBuilderMode(false); alert('Plantilla guardada con éxito'); } catch (e) { console.error(e); alert('Error al guardar la plantilla'); } };

    // Resource Logic
    const handleSaveResource = async () => {
        if(!resTitle || !resUrl) return;
        try {
            await saveResource({
                id: crypto.randomUUID(),
                psychologistId: user.id,
                title: resTitle,
                description: resDesc,
                type: resType,
                url: resUrl,
                createdAt: Date.now()
            });
            setResTitle(''); setResDesc(''); setResUrl(''); setIsResourceMode(false);
            const myResources = await getResourcesByPsychologist(user.id);
            setResources(myResources);
            alert("Recurso añadido correctamente.");
        } catch(e: any) { alert("Error: " + e.message); }
    };

    const handleAssignResource = async () => {
        if(!selectedPatientId || !selectedResourceId) return;
        try {
            await assignResourceToPatient(selectedResourceId, selectedPatientId, user.id);
            setAssignMsg("Recurso enviado al paciente.");
            setTimeout(() => setAssignMsg(''), 3000);
        } catch(e: any) { setAssignMsg("Error: " + e.message); }
    };

    const handleAssign = async () => {
        if (!selectedPatientId || !selectedTemplateId) return;
        let template = templates.find(t => t.id === selectedTemplateId);
        if (selectedTemplateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) template = INITIAL_MENTAL_HEALTH_ASSESSMENT;
        if (selectedTemplateId === BDI_II_ASSESSMENT.id) template = BDI_II_ASSESSMENT;
        
        if (template) { try { await assignSurveyToPatient(template, selectedPatientId, user.id); setAssignMsg('Encuesta enviada correctamente.'); const allAssignments = await getAllSurveysForPatient(selectedPatientId); setPatientPendingTasks(allAssignments.filter(a => a.status === 'pending')); setTimeout(() => setAssignMsg(''), 3000); } catch (e: any) { console.error(e); setAssignMsg('Error al enviar la encuesta: ' + e.message); } }
    };

    const getPatientName = (id: string) => { const p = patients.find(pat => pat.id === id); return p ? `${p.name} ${p.surnames || ''}` : 'Usuario desconocido'; };
    const getQuestionText = (templateId: string, qId: string) => { 
        if (templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) { const q = INITIAL_MENTAL_HEALTH_ASSESSMENT.questions.find(qu => qu.id === qId); return q ? q.text : 'Pregunta'; } 
        if (templateId === BDI_II_ASSESSMENT.id) { const q = BDI_II_ASSESSMENT.questions.find(qu => qu.id === qId); return q ? q.text : 'Pregunta'; } 
        const temp = templates.find(t => t.id === templateId); if (!temp) return 'Pregunta no encontrada'; const q = temp.questions.find(qu => qu.id === qId); return q ? q.text : 'Pregunta eliminada'; 
    };

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || (p.surnames && p.surnames.toLowerCase().includes(patientSearchTerm.toLowerCase())) || p.email.toLowerCase().includes(patientSearchTerm.toLowerCase()));
    
    // Filter duplicates
    const displayTemplates = templates.filter(t => 
        t.id !== INITIAL_MENTAL_HEALTH_ASSESSMENT.id && 
        t.id !== BDI_II_ASSESSMENT.id &&
        t.title !== INITIAL_MENTAL_HEALTH_ASSESSMENT.title &&
        t.title !== BDI_II_ASSESSMENT.title
    );

    // Chart Data & Stats logic
    const totalPatients = patients.length; 
    const totalReports = allReports.length;
    const completedSurveys = assignments.filter(a => a.status === 'completed');
    const riskAlerts = completedSurveys.filter(a => { 
        if (!a.responses) return false;
        if (a.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) { const score = calculateMentalHealthScore(a.responses); return score.redFlags.length > 0 || score.depression.level === 'Grave' || score.anxiety.level === 'Grave'; } 
        if (a.templateId === BDI_II_ASSESSMENT.id) { const score = calculateBDIScore(a.responses); return score.hasSuicidalRisk || score.level === 'Depresión grave'; }
        return false; 
    }).length;

    const getUnifiedResults = () => {
        const surveyItems = assignments.filter(a => a.status === 'completed').map(a => { 
            let isRisk = false; 
            if (a.responses) {
                if (a.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) { const score = calculateMentalHealthScore(a.responses); isRisk = score.redFlags.length > 0 || score.depression.level === 'Grave'; } 
                else if (a.templateId === BDI_II_ASSESSMENT.id) { const score = calculateBDIScore(a.responses); isRisk = score.hasSuicidalRisk || score.level === 'Depresión grave'; }
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
    const getPatientHistory = () => { const reports = selectedPatientReports.map(r => ({ ...r, type: 'report' })); const surveys = patientCompletedTasks.map(s => ({ ...s, type: 'survey', date: s.completedAt || 0 })); return [...reports, ...surveys].sort((a, b) => b.date - a.date); };
    const patientHistory = getPatientHistory();

    const SurveyResultView = ({ assignment }: { assignment: SurveyAssignment }) => {
        if (assignment.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) {
             const score = calculateMentalHealthScore(assignment.responses!);
             return ( <div className="space-y-6"> {score.redFlags.length > 0 && (<div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-xl flex items-start gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><div><p className="font-bold">ATENCIÓN REQUERIDA</p><ul className="list-disc list-inside text-sm mt-1">{score.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></div></div>)} <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[score.depression, score.anxiety, score.stress].map((metric, i) => (<div key={i} className="bg-slate-900 border border-slate-700 p-5 rounded-xl"><div className="flex justify-between items-center mb-2"><h4 className="font-bold text-slate-300 uppercase tracking-wider text-xs">{i === 0 ? 'Depresión' : i === 1 ? 'Ansiedad' : 'Estrés'}</h4><span className={`text-sm font-bold ${metric.color}`}>{metric.level}</span></div><div className="w-full bg-slate-800 h-2 rounded-full mb-3"><div className={`h-2 rounded-full ${metric.color.replace('text-', 'bg-')}`} style={{ width: `${(metric.rawScore / metric.maxScore) * 100}%` }}></div></div><p className="text-xs text-slate-400">{metric.advice}</p></div>))}</div> <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><h4 className="font-bold text-slate-300 text-sm mb-4">Respuestas Detalladas</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{assignment.responses?.map((resp, rIdx) => (<div key={rIdx} className="text-sm"><p className="text-slate-500 mb-1">{getQuestionText(INITIAL_MENTAL_HEALTH_ASSESSMENT.id, resp.questionId).substring(0, 60)}...</p><p className="text-white font-medium pl-2 border-l-2 border-slate-700">{resp.answer}</p></div>))}</div></div> </div> );
        }
        if (assignment.templateId === BDI_II_ASSESSMENT.id) {
            const score = calculateBDIScore(assignment.responses!);
            return (
                <div className="space-y-6">
                    {score.hasSuicidalRisk && (
                        <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <div>
                                <p className="font-bold">RIESGO DE SUICIDIO DETECTADO</p>
                                <p className="text-sm">El paciente indicó pensamientos relacionados con el daño autoinfligido en la pregunta #20.</p>
                            </div>
                        </div>
                    )}
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Puntuación Total BDI-II</p>
                            <p className="text-4xl font-bold text-white mt-1">{score.score} <span className="text-lg text-slate-500 font-normal">/ 63</span></p>
                        </div>
                        <div className="text-right">
                             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Interpretación</p>
                             <p className={`text-2xl font-bold ${score.color} mt-1`}>{score.level}</p>
                        </div>
                    </div>
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <h4 className="font-bold text-slate-300 text-sm mb-4">Respuestas Detalladas</h4>
                        <div className="space-y-3">
                            {assignment.responses?.map((resp, rIdx) => (
                                <div key={rIdx} className="text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                                    <p className="text-slate-400 mb-1 text-xs uppercase font-bold">{getQuestionText(BDI_II_ASSESSMENT.id, resp.questionId).split('.')[1] || 'Pregunta'}</p>
                                    <p className="text-white font-medium">{resp.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return ( <div className="space-y-6 max-w-3xl">{assignment.responses?.map((resp, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-2">Pregunta {idx + 1}</p><p className="text-slate-300 text-sm mb-3 font-medium border-b border-slate-800 pb-2">{getQuestionText(assignment.templateId, resp.questionId)}</p><p className="text-white text-lg font-light pl-2 border-l-2 border-brand-500">{resp.answer}</p></div>))}</div> );
    };

    // Calculate Dynamic Stats for Modal
    let modalStats = {
        naretboxBalance: 0,
        naretboxPositives: 0,
        naretboxNegatives: 0,
        completedTasks: 0,
        pendingTasks: 0,
        adherenceRate: 0,
        chartData: [] as any[],
        latestClinical: null as any
    };

    if (selectedPatientId && isViewingPatientDetails) {
        // Naretbox Stats
        modalStats.naretboxPositives = selectedPatientReports.reduce((acc, r) => acc + r.content.positives.length, 0);
        modalStats.naretboxNegatives = selectedPatientReports.reduce((acc, r) => acc + r.content.negatives.length, 0);
        modalStats.naretboxBalance = modalStats.naretboxPositives + modalStats.naretboxNegatives > 0 
            ? Math.round((modalStats.naretboxPositives / (modalStats.naretboxPositives + modalStats.naretboxNegatives)) * 100) 
            : 50;

        // Chart Data (Last 7 reports)
        modalStats.chartData = selectedPatientReports.slice(0, 7).reverse().map(r => ({
            date: new Date(r.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
            Positivo: r.content.positives.length,
            Negativo: r.content.negatives.length
        }));

        // Task Stats
        modalStats.completedTasks = patientCompletedTasks.length;
        modalStats.pendingTasks = patientPendingTasks.length;
        modalStats.adherenceRate = (modalStats.completedTasks + modalStats.pendingTasks) > 0 
            ? Math.round((modalStats.completedTasks / (modalStats.completedTasks + modalStats.pendingTasks)) * 100)
            : 0;

        // Latest Clinical Result
        const latestInitial = patientCompletedTasks.find(t => t.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id);
        const latestBDI = patientCompletedTasks.find(t => t.templateId === BDI_II_ASSESSMENT.id);
        
        // Prioritize newest
        const newest = [latestInitial, latestBDI].sort((a,b) => (b?.completedAt || 0) - (a?.completedAt || 0))[0];
        
        if (newest && newest.responses) {
            if (newest.templateId === INITIAL_MENTAL_HEALTH_ASSESSMENT.id) {
                modalStats.latestClinical = { type: 'Initial', ...calculateMentalHealthScore(newest.responses) };
            } else if (newest.templateId === BDI_II_ASSESSMENT.id) {
                modalStats.latestClinical = { type: 'BDI', ...calculateBDIScore(newest.responses) };
            }
        }
    }

    const renderHeaderTitle = () => {
        switch(activeSection) {
            case 'overview': return 'Resumen Global';
            case 'patients': return 'Gestión de Pacientes';
            case 'tools': return 'Biblioteca de Herramientas';
            case 'review': return 'Resultados y Seguimiento';
            default: return 'Panel del Psicólogo';
        }
    };

    return (
        <div className="p-6 md:p-8 animate-fade-in max-w-7xl mx-auto pb-24 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">{renderHeaderTitle()}</h1>
                    <p className="text-slate-400 mt-1">Gestión integral de pacientes y herramientas.</p>
                </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeSection === 'overview' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="bg-gradient-to-r from-brand-900/20 to-slate-900 border border-slate-800 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Bienvenido, {user.name}</h2>
                        <p className="text-slate-400 max-w-2xl">
                            Este es tu panel de control. Utiliza la barra lateral izquierda para navegar entre tus pacientes, crear herramientas y revisar resultados.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard 
                            title="Informes Recibidos" 
                            value={totalReports} 
                            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
                            colorClass="bg-emerald-500/20 text-emerald-400"
                            onClick={() => { setFilterType('naretbox'); onSectionChange('review'); }}
                        />
                        <StatCard 
                            title="Alertas de Riesgo" 
                            value={riskAlerts} 
                            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} 
                            colorClass={`${riskAlerts > 0 ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-500'}`}
                            onClick={() => { setFilterRisk(true); onSectionChange('review'); }}
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
                            <div className="relative flex-1 md:w-64"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span><input type="text" value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} placeholder="Buscar por nombre..." className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"/></div>
                            <button onClick={() => setIsCreatingPatient(true)} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 whitespace-nowrap"><span className="hidden md:inline">Nuevo Paciente</span><span className="md:hidden">+</span></button>
                        </div>
                    </div>
                    {isCreatingPatient && (<div className="mb-6 p-6 bg-slate-900 border border-slate-700 rounded-3xl animate-slide-up shadow-2xl relative z-20"><div className="flex justify-between mb-4"><h3 className="text-white font-bold">Registrar Nuevo Paciente</h3><button onClick={() => setIsCreatingPatient(false)} className="text-slate-500 hover:text-white">✕</button></div>{createMsg && <p className={`text-sm mb-3 ${createMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{createMsg}</p>}<form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-2 gap-4"><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Nombre" value={pName} onChange={e => setPName(e.target.value)} required /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Apellidos" value={pSurnames} onChange={e => setPSurnames(e.target.value)} required /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Email" type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} required /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-brand-500" placeholder="Teléfono" value={pPhone} onChange={e => setPPhone(e.target.value)} /><input className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm md:col-span-2 outline-none focus:border-brand-500" placeholder="Contraseña Temporal" type="password" value={pPassword} onChange={e => setPPassword(e.target.value)} required /><button type="submit" className="md:col-span-2 bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors shadow-lg">Crear Cuenta Paciente</button></form></div>)}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.length === 0 ? (<div className="col-span-full py-10 text-center text-slate-500 italic bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">{patients.length === 0 ? "No tienes pacientes asignados aún." : "No se encontraron pacientes con ese nombre."}</div>) : (filteredPatients.map(p => (<div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 transition-all hover:shadow-xl group flex flex-col justify-between"><div className="flex items-start gap-4 mb-4"><div className="w-14 h-14 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700 group-hover:border-brand-500/50 transition-colors">{p.photoUrl ? (<img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">{p.name.charAt(0)}</div>)}</div><div><h3 className="font-bold text-lg text-white group-hover:text-brand-300 transition-colors">{p.name} {p.surnames}</h3><p className="text-sm text-slate-400">{p.email}</p></div></div><div className="mt-auto space-y-3"><div className="grid grid-cols-2 gap-2"><button onClick={() => { setSelectedPatientId(p.id); setIsViewingPatientDetails(true); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors border border-slate-700">Ver Perfil</button><button onClick={() => { setSelectedPatientId(p.id); setIsViewingPatientDetails(true); }} className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-bold py-2 rounded-lg transition-colors">Asignar Tarea</button></div></div></div>)))}
                    </div>
                </div>
            )}

            {/* TOOLS TAB - WITH INFOGRAPHICS */}
            {activeSection === 'tools' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex gap-4 border-b border-slate-800 mb-6">
                        <button onClick={() => setToolSubTab('surveys')} className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${toolSubTab === 'surveys' ? 'text-brand-400 border-brand-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Evaluaciones</button>
                        <button onClick={() => setToolSubTab('resources')} className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${toolSubTab === 'resources' ? 'text-brand-400 border-brand-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Infografía y Recursos</button>
                    </div>

                    {toolSubTab === 'surveys' && (
                         !isBuilderMode ? (
                            <>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-brand-500 rounded-full"></span>Evaluaciones Estándar</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-brand-500/30 rounded-2xl p-6 hover:border-brand-500 transition-all flex flex-col h-full shadow-lg shadow-brand-900/10">
                                            <div className="flex items-start justify-between mb-4"><div className="p-3 bg-brand-500 text-white rounded-xl shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><span className="text-[10px] uppercase bg-brand-900/30 text-brand-300 px-2 py-1 rounded font-bold border border-brand-500/30">Recomendado</span></div>
                                            <h3 className="font-bold text-lg text-white mb-2">{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</h3>
                                            <p className="text-slate-400 text-sm mb-6 flex-1">{INITIAL_MENTAL_HEALTH_ASSESSMENT.description}</p>
                                            <div className="mt-auto space-y-2">
                                                <button onClick={() => setViewingTemplate(INITIAL_MENTAL_HEALTH_ASSESSMENT)} className="w-full bg-slate-800 text-slate-300 text-xs font-bold py-2 rounded-lg hover:text-white transition-colors">Ver Preguntas (Preview)</button>
                                                <button onClick={() => { alert("Selecciona un paciente en la pestaña 'Pacientes' para asignarle esta evaluación."); onSectionChange('patients'); }} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg">Asignar a Paciente</button>
                                            </div>
                                        </div>
                                        
                                        {/* BDI-II CARD */}
                                        <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 hover:border-indigo-500 transition-all flex flex-col h-full shadow-lg relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                                            <div className="flex items-start justify-between mb-4 relative z-10">
                                                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div>
                                                <span className="text-[10px] uppercase bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded font-bold border border-indigo-500/30">Depresión</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-white mb-2 relative z-10">{BDI_II_ASSESSMENT.title}</h3>
                                            <p className="text-slate-400 text-sm mb-6 flex-1 relative z-10">{BDI_II_ASSESSMENT.description}</p>
                                            <div className="mt-auto space-y-2 relative z-10">
                                                <button onClick={() => setViewingTemplate(BDI_II_ASSESSMENT)} className="w-full bg-slate-800 text-slate-300 text-xs font-bold py-2 rounded-lg hover:text-white transition-colors">Ver Preguntas (Preview)</button>
                                                <button onClick={() => { alert("Selecciona un paciente en la pestaña 'Pacientes' para asignarle esta evaluación."); onSectionChange('patients'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg">Asignar a Paciente</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-slate-200 flex items-center gap-2"><span className="w-1 h-6 bg-indigo-500 rounded-full"></span>Mis Plantillas</h2><button onClick={() => setIsBuilderMode(true)} className="text-indigo-400 hover:text-white text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"><span>+</span> Crear Nueva</button></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {displayTemplates.length === 0 ? (
                                            <div className="col-span-full py-8 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed"><p className="text-slate-500 text-sm">No has creado plantillas personalizadas.</p></div>
                                        ) : (
                                            displayTemplates.map(t => (
                                                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all flex flex-col h-full">
                                                    <h3 className="font-bold text-lg text-white mb-2">{t.title}</h3>
                                                    <p className="text-slate-400 text-sm mb-4 flex-1 line-clamp-2">{t.description}</p>
                                                    <div className="mt-auto space-y-2">
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-950/50 p-2 rounded-lg w-fit mb-2"><span>{t.questions.length} Preguntas</span></div>
                                                        <button onClick={() => setViewingTemplate(t)} className="w-full bg-slate-800 text-slate-300 text-xs font-bold py-2 rounded-lg hover:text-white transition-colors">Ver Preguntas</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                             // Builder UI
                             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl animate-slide-up">
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                                    <h2 className="text-2xl font-bold text-slate-200">Nueva Plantilla</h2>
                                    <button onClick={() => setIsBuilderMode(false)} className="text-slate-500 hover:text-white flex items-center gap-2 text-sm font-bold">Cancelar</button>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Título de la Evaluación</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-800 text-white p-4 rounded-xl border border-slate-700 outline-none focus:border-brand-500 transition-colors" 
                                        value={newTemplateTitle} 
                                        onChange={(e) => setNewTemplateTitle(e.target.value)}
                                        placeholder="Ej. Registro de Ansiedad Semanal"
                                    />
                                </div>

                                <div className="space-y-6 mb-8">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 relative group">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))} className="text-slate-600 hover:text-red-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                 </button>
                                            </div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                    {q.type === 'scale' ? 'Escala 1-10' : q.type === 'multiple_choice' ? 'Opción Múltiple' : 'Texto Libre'}
                                                </span>
                                                <span className="text-slate-600 text-xs font-bold">Pregunta {idx + 1}</span>
                                            </div>
                                            <input 
                                                className="w-full bg-transparent text-white text-lg font-medium outline-none border-b border-slate-700 focus:border-brand-500 pb-2 mb-4 placeholder-slate-600"
                                                placeholder="Escribe la pregunta aquí..."
                                                value={q.text}
                                                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                                            />
                                            
                                            {q.type === 'multiple_choice' && q.options && (
                                                <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                                                    {q.options.map((opt, optIdx) => (
                                                        <div key={optIdx} className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full border border-slate-600"></div>
                                                            <input 
                                                                className="bg-transparent text-slate-300 text-sm outline-none w-full"
                                                                value={opt}
                                                                onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)}
                                                                placeholder={`Opción ${optIdx + 1}`}
                                                            />
                                                            <button onClick={() => removeOption(q.id, optIdx)} className="text-slate-600 hover:text-slate-400 px-2">×</button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addOption(q.id)} className="text-xs font-bold text-brand-500 hover:text-brand-400 mt-2">+ Añadir Opción</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {questions.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
                                            Empieza añadiendo preguntas a tu plantilla.
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 mb-8 justify-center border-t border-b border-slate-800 py-6">
                                    <button onClick={() => addQuestion('scale')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                        <span>📊</span> Escala Numérica
                                    </button>
                                    <button onClick={() => addQuestion('multiple_choice')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                        <span>☑️</span> Opción Múltiple
                                    </button>
                                    <button onClick={() => addQuestion('text')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                        <span>✍️</span> Texto Libre
                                    </button>
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        onClick={saveTemplate} 
                                        disabled={!newTemplateTitle || questions.length === 0}
                                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                                    >
                                        Guardar Plantilla
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* PATIENT DETAILS MODAL WITH RESOURCE ASSIGNMENT - PORTALED */}
            {isViewingPatientDetails && selectedPatientId && createPortal(
                <div 
                    className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsViewingPatientDetails(false)}
                >
                    <div 
                        className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                             <div>
                                 <h2 className="text-2xl font-bold text-white">{getPatientName(selectedPatientId)}</h2>
                                 <p className="text-xs text-slate-500 font-medium">Dashboard Clínico</p>
                             </div>
                             <button onClick={() => setIsViewingPatientDetails(false)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-950/50">
                             
                             {/* --- CLINICAL DASHBOARD STATS --- */}
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard 
                                    title="Informes Enviados" 
                                    value={selectedPatientReports.length} 
                                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                    colorClass="bg-indigo-500/20 text-indigo-400"
                                />
                                <StatCard 
                                    title="Balance Emocional" 
                                    value={`${modalStats.naretboxBalance}%`} 
                                    subtitle="Positividad media"
                                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    colorClass={modalStats.naretboxBalance > 50 ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}
                                />
                                <StatCard 
                                    title="Adherencia Tareas" 
                                    value={`${modalStats.adherenceRate}%`} 
                                    subtitle={`${modalStats.completedTasks} completadas / ${modalStats.completedTasks + modalStats.pendingTasks} totales`}
                                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                                    colorClass="bg-brand-500/20 text-brand-400"
                                />
                                <StatCard 
                                    title="Estado Reciente" 
                                    value={modalStats.latestClinical ? (modalStats.latestClinical.hasSuicidalRisk ? "RIESGO" : "Seguimiento") : "Sin datos"}
                                    icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                    colorClass={modalStats.latestClinical?.hasSuicidalRisk ? "bg-red-500/20 text-red-500" : "bg-slate-700/50 text-slate-400"}
                                />
                             </div>

                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Chart Section */}
                                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Evolución Emocional (Últimos 7 informes)</h3>
                                    {modalStats.chartData.length > 0 ? (
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={modalStats.chartData}>
                                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                    />
                                                    <Bar dataKey="Positivo" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                                                    <Bar dataKey="Negativo" fill="#475569" radius={[4, 4, 0, 0]} stackId="a" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-xl">
                                            No hay suficientes datos de Naretbox.
                                        </div>
                                    )}
                                </div>

                                {/* Clinical Snapshot */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Última Evaluación Clínica</h3>
                                    {modalStats.latestClinical ? (
                                        <div className="space-y-6 my-auto">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-white font-bold">{modalStats.latestClinical.type === 'Initial' ? 'Evaluación Inicial' : 'BDI-II'}</span>
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${modalStats.latestClinical.color.replace('text-', 'bg-').replace('500', '500/20 text-white')}`}>
                                                    {modalStats.latestClinical.level || modalStats.latestClinical.score}
                                                </span>
                                            </div>
                                            
                                            {modalStats.latestClinical.type === 'Initial' ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1 text-slate-400"><span>Depresión</span><span>{modalStats.latestClinical.depression.level}</span></div>
                                                        <div className="h-1.5 bg-slate-800 rounded-full"><div className={`h-1.5 rounded-full ${modalStats.latestClinical.depression.color.replace('text-', 'bg-')}`} style={{width: `${(modalStats.latestClinical.depression.rawScore/15)*100}%`}}></div></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1 text-slate-400"><span>Ansiedad</span><span>{modalStats.latestClinical.anxiety.level}</span></div>
                                                        <div className="h-1.5 bg-slate-800 rounded-full"><div className={`h-1.5 rounded-full ${modalStats.latestClinical.anxiety.color.replace('text-', 'bg-')}`} style={{width: `${(modalStats.latestClinical.anxiety.rawScore/15)*100}%`}}></div></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1 text-slate-400"><span>Estrés</span><span>{modalStats.latestClinical.stress.level}</span></div>
                                                        <div className="h-1.5 bg-slate-800 rounded-full"><div className={`h-1.5 rounded-full ${modalStats.latestClinical.stress.color.replace('text-', 'bg-')}`} style={{width: `${(modalStats.latestClinical.stress.rawScore/12)*100}%`}}></div></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-4xl font-bold text-white mb-1">{modalStats.latestClinical.score}</p>
                                                    <p className={`text-sm font-bold ${modalStats.latestClinical.color}`}>{modalStats.latestClinical.level}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic text-center p-4">
                                            El paciente no ha completado ninguna evaluación clínica estándar aún.
                                        </div>
                                    )}
                                </div>
                             </div>

                             {/* --- MANAGEMENT SECTION --- */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Assign Survey */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                     <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Asignar Tarea / Encuesta</h3>
                                     <select className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-700 mb-3" onChange={(e) => setSelectedTemplateId(e.target.value)} value={selectedTemplateId}>
                                            <option value="">Seleccionar Plantilla...</option>
                                            <option value={INITIAL_MENTAL_HEALTH_ASSESSMENT.id}>{INITIAL_MENTAL_HEALTH_ASSESSMENT.title}</option>
                                            <option value={BDI_II_ASSESSMENT.id}>{BDI_II_ASSESSMENT.title}</option>
                                            {displayTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                     </select>
                                     <button onClick={handleAssign} className="w-full bg-brand-500 text-white py-2 rounded-lg text-sm font-bold">Enviar Tarea</button>
                                </div>
                                {/* Assign Resource */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                     <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Enviar Recurso Educativo</h3>
                                     <select className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-700 mb-3" onChange={(e) => setSelectedResourceId(e.target.value)} value={selectedResourceId}>
                                            <option value="">Seleccionar Recurso...</option>
                                            {resources.map(r => <option key={r.id} value={r.id}>{r.title} ({r.type})</option>)}
                                     </select>
                                     <button onClick={handleAssignResource} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">Enviar Recurso</button>
                                     {assignMsg && <p className="text-xs text-emerald-400 mt-2">{assignMsg}</p>}
                                </div>
                             </div>

                             {/* Patient History */}
                             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-slate-400 text-xs font-bold uppercase mb-6">Historial Clínico</h3>
                                <div className="space-y-4">
                                    {patientHistory.length === 0 ? (
                                        <div className="text-center text-slate-500 text-sm py-4">Sin historial registrado.</div>
                                    ) : (
                                        patientHistory.map((item: any, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${item.type === 'survey' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${item.type === 'survey' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                        {item.type === 'survey' ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{item.type === 'survey' ? item.templateTitle : 'Informe Naretbox'}</p>
                                                        <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        if(item.type === 'survey') setViewingAssignment(item as SurveyAssignment);
                                                        else setSelectedReport(item as PatientReport);
                                                    }}
                                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                                                >
                                                    Ver
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal for Survey Results - PORTALED */}
            {viewingAssignment && createPortal(
                <div 
                    className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
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
                            <SurveyResultView assignment={viewingAssignment} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
            {/* Modal for Template PREVIEW - PORTALED */}
            {viewingTemplate && createPortal(
                <div 
                    className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
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
                    className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
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

