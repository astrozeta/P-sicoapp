
import { supabase, IS_SUPABASE_CONFIGURED } from '../supabaseClient';
import { Entry, SurveyTemplate, SurveyAssignment, PatientReport, EducationalResource, User, ClinicalProfile, ClinicalSession, TreatmentGoal, FinancialRecord, Reminder } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

// --- Local Storage Helpers (Legacy/Fallback) ---
const getLocalData = (key: string) => {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : [];
};
const saveLocalData = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

// --- EXTENDED PATIENT PROFILE SERVICES (SUPABASE) ---

// 1. Basic Info Update (Profiles Table)
export const updatePatientBasicInfo = async (userId: string, data: Partial<User>) => {
    if (!IS_SUPABASE_CONFIGURED) return;
    
    const { error } = await supabase.from('profiles').update({
        birth_date: data.birthDate,
        gender: data.gender,
        address: data.address,
        occupation: data.occupation,
        marital_status: data.maritalStatus,
        insurance_number: data.insuranceNumber,
        referral_source: data.referralSource,
        phone: data.phone
    }).eq('id', userId);

    if (error) throw error;
};

// 2. Clinical Profile (1:1 Table)
export const getClinicalProfile = async (userId: string): Promise<ClinicalProfile | null> => {
    if (!IS_SUPABASE_CONFIGURED) return null;

    const { data, error } = await supabase.from('clinical_profiles').select('*').eq('user_id', userId).single();
    
    if (error) {
        if (error.code !== 'PGRST116') { // Ignore "not found" error from .single()
            console.error("Error fetching clinical profile", error);
        }
        return null;
    }
    
    if (!data) return null;

    return {
        userId: data.user_id,
        reasonForConsult: data.reason_for_consult || '',
        preexistingConditions: Array.isArray(data.preexisting_conditions) ? data.preexisting_conditions : [],
        previousTreatments: data.previous_treatments || '',
        currentMedication: data.current_medication || '',
        diagnosis: data.diagnosis || '',
        riskLevel: data.risk_level || 'Bajo',
        riskDetails: data.risk_details || '',
        therapeuticApproach: data.therapeutic_approach || '',
        patientFeedback: data.patient_feedback || ''
    };
};

export const saveClinicalProfile = async (profile: Partial<ClinicalProfile> & { userId: string }) => {
    if (!IS_SUPABASE_CONFIGURED) return;

    // Upsert logic
    const { error } = await supabase.from('clinical_profiles').upsert({
        user_id: profile.userId,
        reason_for_consult: profile.reasonForConsult,
        preexisting_conditions: profile.preexistingConditions,
        previous_treatments: profile.previousTreatments,
        current_medication: profile.currentMedication,
        diagnosis: profile.diagnosis,
        risk_level: profile.riskLevel,
        risk_details: profile.riskDetails,
        therapeutic_approach: profile.therapeuticApproach,
        patient_feedback: profile.patientFeedback
    }, { onConflict: 'user_id' });

    if (error) throw error;
};

// 3. Clinical Sessions (1:N)
export const getClinicalSessions = async (patientId: string): Promise<ClinicalSession[]> => {
    if (!IS_SUPABASE_CONFIGURED) return [];

    const { data, error } = await supabase
        .from('clinical_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

    if (error) throw error;
    
    return data.map((s: any) => ({
        id: s.id,
        patientId: s.patient_id,
        psychologistId: s.psychologist_id,
        date: parseInt(s.date),
        objectives: s.objectives,
        summary: s.summary,
        notes: s.notes,
        progress: s.progress,
        nextSteps: s.next_steps
    }));
};

export const saveClinicalSession = async (session: Omit<ClinicalSession, 'id'>) => {
    if (!IS_SUPABASE_CONFIGURED) return;

    const { error } = await supabase.from('clinical_sessions').insert([{
        patient_id: session.patientId,
        psychologist_id: session.psychologistId,
        date: session.date,
        objectives: session.objectives,
        summary: session.summary,
        notes: session.notes,
        progress: session.progress,
        next_steps: session.nextSteps
    }]);

    if (error) throw error;
};

// 5. Treatment Goals (1:N)
export const getTreatmentGoals = async (patientId: string): Promise<TreatmentGoal[]> => {
    if (!IS_SUPABASE_CONFIGURED) return [];
    
    const { data, error } = await supabase.from('treatment_goals').select('*').eq('patient_id', patientId);
    if (error) throw error;

    return data.map((g: any) => ({
        id: g.id,
        patientId: g.patient_id,
        description: g.description,
        type: g.type,
        status: g.status,
        createdAt: parseInt(g.created_at)
    }));
};

export const saveTreatmentGoal = async (goal: Omit<TreatmentGoal, 'id'>) => {
    if (!IS_SUPABASE_CONFIGURED) return;
    const { error } = await supabase.from('treatment_goals').insert([{
        patient_id: goal.patientId,
        description: goal.description,
        type: goal.type,
        status: goal.status,
        created_at: goal.createdAt
    }]);
    if (error) throw error;
};

export const updateTreatmentGoalStatus = async (id: string, status: string) => {
    if (!IS_SUPABASE_CONFIGURED) return;
    const { error } = await supabase.from('treatment_goals').update({ status }).eq('id', id);
    if (error) throw error;
};

// 6. Financials (1:N)
export const getFinancials = async (patientId: string): Promise<FinancialRecord[]> => {
    if (!IS_SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.from('financial_records').select('*').eq('patient_id', patientId).order('date', { ascending: false });
    if (error) throw error;
    
    return data.map((f: any) => ({
        id: f.id,
        patientId: f.patient_id,
        date: parseInt(f.date),
        concept: f.concept,
        amount: f.amount,
        status: f.status,
        method: f.method
    }));
};

export const saveFinancialRecord = async (record: Omit<FinancialRecord, 'id'>) => {
    if (!IS_SUPABASE_CONFIGURED) return;
    const { error } = await supabase.from('financial_records').insert([{
        patient_id: record.patientId,
        date: record.date,
        concept: record.concept,
        amount: record.amount,
        status: record.status,
        method: record.method
    }]);
    if (error) throw error;
};

// 7. Reminders (1:N)
export const getReminders = async (patientId: string): Promise<Reminder[]> => {
    if (!IS_SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.from('reminders').select('*').eq('patient_id', patientId).order('date', { ascending: true });
    if (error) throw error;
    
    return data.map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        psychologistId: r.psychologist_id,
        title: r.title,
        date: parseInt(r.date),
        isCompleted: r.is_completed
    }));
};

export const saveReminder = async (reminder: Omit<Reminder, 'id'>) => {
    if (!IS_SUPABASE_CONFIGURED) return;
    const { error } = await supabase.from('reminders').insert([{
        patient_id: reminder.patientId,
        psychologist_id: reminder.psychologistId,
        title: reminder.title,
        date: reminder.date,
        is_completed: reminder.isCompleted
    }]);
    if (error) throw error;
};


// --- EXISTING SERVICES (Keep functionality) ---

export const getEntries = async (userId: string): Promise<Entry[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const allEntries = getLocalData(LOCAL_STORAGE_KEY) as any[]; 
        return allEntries.filter((e: any) => e.userId === userId || !e.userId);
    }
    const { data, error } = await supabase.from('entries').select('*').eq('user_id', userId).order('timestamp', { ascending: true });
    if (error) { console.error("Error fetching entries:", error); return []; }
    return data.map((e: any) => ({ id: e.id, text: e.text, type: e.type, timestamp: parseInt(e.timestamp), dateStr: e.date_str }));
};

export const saveEntry = async (userId: string, entry: Omit<Entry, 'id'>) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const entries = getLocalData(LOCAL_STORAGE_KEY); entries.push({ ...entry, id: crypto.randomUUID(), userId }); saveLocalData(LOCAL_STORAGE_KEY, entries); return;
    }
    const { error } = await supabase.from('entries').insert([{ user_id: userId, text: entry.text, type: entry.type, timestamp: entry.timestamp, date_str: entry.dateStr }]);
    if (error) throw error;
};

export const deleteEntry = async (id: string) => {
    if (!IS_SUPABASE_CONFIGURED) { const entries = getLocalData(LOCAL_STORAGE_KEY); saveLocalData(LOCAL_STORAGE_KEY, entries.filter((e: any) => e.id !== id)); return; }
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) throw error;
};

export const saveSurveyTemplate = async (template: SurveyTemplate) => {
    if (!IS_SUPABASE_CONFIGURED) { const templates = getLocalData('naret_templates'); templates.push(template); saveLocalData('naret_templates', templates); return; }
    const { error } = await supabase.from('survey_templates').insert([{ psychologist_id: template.psychologistId, title: template.title, description: template.description, questions: template.questions, created_at: template.createdAt }]);
    if (error) throw error;
};

export const getTemplatesByPsychologist = async (psychId: string): Promise<SurveyTemplate[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const templates = getLocalData('naret_templates'); return templates.filter((t: any) => t.psychologistId === psychId); }
    const { data, error } = await supabase.from('survey_templates').select('*').eq('psychologist_id', psychId);
    if (error) return [];
    return data.map((t: any) => ({ id: t.id, psychologistId: t.psychologist_id, title: t.title, description: t.description, questions: t.questions, createdAt: t.created_at }));
};

export const getSurveyTemplates = async (): Promise<SurveyTemplate[]> => {
    if (!IS_SUPABASE_CONFIGURED) return getLocalData('naret_templates');
    const { data, error } = await supabase.from('survey_templates').select('*');
    if (error) return [];
    return data.map((t: any) => ({ id: t.id, psychologistId: t.psychologist_id, title: t.title, description: t.description, questions: t.questions, createdAt: t.created_at }));
};

export const assignSurveyToPatient = async (template: SurveyTemplate, patientId: string, assignedBy: string) => {
    if (!IS_SUPABASE_CONFIGURED) { const assignments = getLocalData('naret_assignments'); assignments.push({ id: crypto.randomUUID(), templateId: template.id, templateTitle: template.title, patientId, assignedBy, status: 'pending', assignedAt: Date.now() }); saveLocalData('naret_assignments', assignments); return; }
    
    // Ensure template exists in DB (legacy check)
    const { data: existingTemplate } = await supabase.from('survey_templates').select('id').eq('id', template.id).single();
    if (!existingTemplate) {
        await supabase.from('survey_templates').insert([{ id: template.id, psychologist_id: template.psychologistId === 'system' ? assignedBy : template.psychologistId, title: template.title, description: template.description, questions: template.questions, created_at: template.createdAt }]);
    }
    
    const { error } = await supabase.from('survey_assignments').insert([{ template_id: template.id, template_title: template.title, patient_id: patientId, assigned_by: assignedBy, status: 'pending', assigned_at: Date.now() }]);
    if (error) throw error;
};

export const getAllAssignments = async (): Promise<SurveyAssignment[]> => {
    if (!IS_SUPABASE_CONFIGURED) return getLocalData('naret_assignments');
    const { data, error } = await supabase.from('survey_assignments').select('*');
    if(error) return [];
    return mapAssignments(data);
};

export const getAssignmentsByPsychologist = async (psychId: string): Promise<SurveyAssignment[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const assignments = getLocalData('naret_assignments'); return assignments.filter((a: any) => a.assignedBy === psychId); }
    const { data, error } = await supabase.from('survey_assignments').select('*').eq('assigned_by', psychId).order('assigned_at', { ascending: false });
    if (error) return [];
    return mapAssignments(data);
};

export const getAllSurveysForPatient = async (patientId: string): Promise<SurveyAssignment[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const assignments = getLocalData('naret_assignments'); return assignments.filter((a: any) => a.patientId === patientId); }
    const { data, error } = await supabase.from('survey_assignments').select('*').eq('patient_id', patientId);
    if (error) return [];
    return mapAssignments(data);
};

export const submitSurvey = async (assignmentId: string, responses: any[]) => {
    if (!IS_SUPABASE_CONFIGURED) { const assignments = getLocalData('naret_assignments'); const idx = assignments.findIndex((a: any) => a.id === assignmentId); if (idx !== -1) { assignments[idx].status = 'completed'; assignments[idx].completedAt = Date.now(); assignments[idx].responses = responses; saveLocalData('naret_assignments', assignments); } return; }
    const { error } = await supabase.from('survey_assignments').update({ status: 'completed', completed_at: Date.now(), responses: responses }).eq('id', assignmentId);
    if (error) throw error;
};

const mapAssignments = (data: any[]): SurveyAssignment[] => {
    return data.map(a => ({ id: a.id, templateId: a.template_id, templateTitle: a.template_title, patientId: a.patient_id, assignedBy: a.assigned_by, status: a.status, responses: a.responses, assignedAt: parseInt(a.assigned_at), completedAt: a.completed_at ? parseInt(a.completed_at) : undefined }));
}

export const savePatientReport = async (report: PatientReport) => {
    if (!IS_SUPABASE_CONFIGURED) { const reports = getLocalData('naret_reports'); reports.push(report); saveLocalData('naret_reports', reports); return; }
    const { error } = await supabase.from('patient_reports').insert([{ patient_id: report.patientId, psychologist_id: report.psychologistId, content: report.content, date: report.date, was_emailed: report.wasEmailed }]);
    if (error) throw error;
};

export const getReportsForPatient = async (patientId: string): Promise<PatientReport[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const reports = getLocalData('naret_reports'); return reports.filter((r: any) => r.patientId === patientId).sort((a: any, b: any) => b.date - a.date); }
    const { data, error } = await supabase.from('patient_reports').select('*').eq('patient_id', patientId).order('date', { ascending: false });
    if (error) return [];
    return data.map((r: any) => ({ id: r.id, patientId: r.patient_id, psychologistId: r.psychologist_id, content: r.content, date: r.date, wasEmailed: r.was_emailed }));
};

export const getReportsByPsychologist = async (psychId: string): Promise<PatientReport[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const reports = getLocalData('naret_reports'); return reports.filter((r: any) => r.psychologistId === psychId).sort((a: any, b: any) => b.date - a.date); }
    const { data, error } = await supabase.from('patient_reports').select('*').eq('psychologist_id', psychId).order('date', { ascending: false });
    if (error) return [];
    return data.map((r: any) => ({ id: r.id, patientId: r.patient_id, psychologistId: r.psychologist_id, content: r.content, date: r.date, wasEmailed: r.was_emailed }));
};

export const saveResource = async (resource: EducationalResource) => {
    if (!IS_SUPABASE_CONFIGURED) { const resources = getLocalData('naret_resources'); resources.push(resource); saveLocalData('naret_resources', resources); return; }
    const { error } = await supabase.from('resources').insert([{ id: resource.id, psychologist_id: resource.psychologistId, title: resource.title, description: resource.description, type: resource.type, url: resource.url, created_at: resource.createdAt }]);
    if (error) throw error;
};

export const getResourcesByPsychologist = async (psychId: string): Promise<EducationalResource[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const resources = getLocalData('naret_resources'); return resources.filter((r: any) => r.psychologistId === psychId); }
    const { data, error } = await supabase.from('resources').select('*').eq('psychologist_id', psychId);
    if (error) return [];
    return data.map((r: any) => ({ id: r.id, psychologistId: r.psychologist_id, title: r.title, description: r.description, type: r.type, url: r.url, createdAt: r.created_at }));
};

export const assignResourceToPatient = async (resourceId: string, patientId: string, assignedBy: string) => {
     if (!IS_SUPABASE_CONFIGURED) { const assignments = getLocalData('naret_resource_assignments'); assignments.push({ id: crypto.randomUUID(), resourceId, patientId, assignedBy, assignedAt: Date.now() }); saveLocalData('naret_resource_assignments', assignments); return; }
    const { error } = await supabase.from('resource_assignments').insert([{ resource_id: resourceId, patient_id: patientId, assigned_by: assignedBy, assigned_at: Date.now() }]);
    if (error) throw error;
};

export const getAssignedResourcesForPatient = async (patientId: string): Promise<EducationalResource[]> => {
    if (!IS_SUPABASE_CONFIGURED) { const assignments = getLocalData('naret_resource_assignments').filter((a: any) => a.patientId === patientId); const resources = getLocalData('naret_resources'); return resources.filter((r: any) => assignments.some((a: any) => a.resourceId === r.id)); }
    const { data, error } = await supabase.from('resource_assignments').select(`resource_id, resources:resource_id (*)`).eq('patient_id', patientId);
    if (error) return [];
    return data.map((item: any) => { const r = item.resources; if(!r) return null; return { id: r.id, psychologistId: r.psychologist_id, title: r.title, description: r.description, type: r.type, url: r.url, createdAt: r.created_at }; }).filter(Boolean) as EducationalResource[];
};

