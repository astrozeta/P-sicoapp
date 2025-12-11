
import { supabase, IS_SUPABASE_CONFIGURED } from '../supabaseClient';
import { Entry, SurveyTemplate, SurveyAssignment, Task, PatientReport } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

// --- Local Storage Helpers ---
const getLocalData = (key: string) => {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : [];
};
const saveLocalData = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

// --- Entries (Naretbox) ---

export const getEntries = async (userId: string): Promise<Entry[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const allEntries = getLocalData(LOCAL_STORAGE_KEY) as any[]; // In local we stored all mixed? Or need to filter? 
        // Previously LOCAL_STORAGE_KEY stored simple array. We need to filter by user in multi-user local mode.
        // For simplicity in this local-mock, we assume the entries in LS have userId attached or we attach it now.
        // If legacy data didn't have userId, we might see it for everyone. That's acceptable for fallback.
        return allEntries.filter((e: any) => e.userId === userId || !e.userId);
    }

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });
    
    if (error) {
        console.error("Error fetching entries:", error);
        return [];
    }
    
    return data.map((e: any) => ({
        id: e.id,
        text: e.text,
        type: e.type,
        timestamp: parseInt(e.timestamp),
        dateStr: e.date_str
    }));
};

export const saveEntry = async (userId: string, entry: Omit<Entry, 'id'>) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const entries = getLocalData(LOCAL_STORAGE_KEY);
        entries.push({ ...entry, id: crypto.randomUUID(), userId });
        saveLocalData(LOCAL_STORAGE_KEY, entries);
        return;
    }

    const { error } = await supabase.from('entries').insert([{
        user_id: userId,
        text: entry.text,
        type: entry.type,
        timestamp: entry.timestamp,
        date_str: entry.dateStr
    }]);
    if (error) throw error;
};

export const deleteEntry = async (id: string) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const entries = getLocalData(LOCAL_STORAGE_KEY);
        saveLocalData(LOCAL_STORAGE_KEY, entries.filter((e: any) => e.id !== id));
        return;
    }

    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) throw error;
};

// --- Templates ---

export const saveSurveyTemplate = async (template: SurveyTemplate) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const templates = getLocalData('naret_templates');
        templates.push(template);
        saveLocalData('naret_templates', templates);
        return;
    }

    const { error } = await supabase.from('survey_templates').insert([{
        // id: template.id, // Let DB generate ID if omitted, or use UUID if provided
        psychologist_id: template.psychologistId,
        title: template.title,
        description: template.description,
        questions: template.questions,
        created_at: template.createdAt
    }]);
    if (error) throw error;
};

export const getTemplatesByPsychologist = async (psychId: string): Promise<SurveyTemplate[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const templates = getLocalData('naret_templates');
        return templates.filter((t: any) => t.psychologistId === psychId);
    }

    const { data, error } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('psychologist_id', psychId);
        
    if (error) return [];
    return data.map((t: any) => ({
        id: t.id,
        psychologistId: t.psychologist_id,
        title: t.title,
        description: t.description,
        questions: t.questions,
        createdAt: t.created_at
    }));
};

export const getSurveyTemplates = async (): Promise<SurveyTemplate[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        return getLocalData('naret_templates');
    }

    const { data, error } = await supabase.from('survey_templates').select('*');
    if (error) return [];
    return data.map((t: any) => ({
        id: t.id,
        psychologistId: t.psychologist_id,
        title: t.title,
        description: t.description,
        questions: t.questions,
        createdAt: t.created_at
    }));
};


// --- Assignments (Surveys) ---

export const assignSurveyToPatient = async (template: SurveyTemplate, patientId: string, assignedBy: string) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const assignments = getLocalData('naret_assignments');
        assignments.push({
            id: crypto.randomUUID(),
            templateId: template.id,
            templateTitle: template.title,
            patientId,
            assignedBy,
            status: 'pending',
            assignedAt: Date.now()
        });
        saveLocalData('naret_assignments', assignments);
        return;
    }

    // 1. Check if template exists in DB (for standard templates that might be static in code)
    const { data: existingTemplate } = await supabase
        .from('survey_templates')
        .select('id')
        .eq('id', template.id)
        .single();

    // 2. If it doesn't exist, insert it
    if (!existingTemplate) {
        const { error: insertTemplateError } = await supabase.from('survey_templates').insert([{
            id: template.id,
            psychologist_id: template.psychologistId === 'system' ? assignedBy : template.psychologistId,
            title: template.title,
            description: template.description,
            questions: template.questions,
            created_at: template.createdAt
        }]);
        if (insertTemplateError) throw insertTemplateError;
    }

    // 3. Assign
    const { error } = await supabase.from('survey_assignments').insert([{
        template_id: template.id,
        template_title: template.title,
        patient_id: patientId,
        assigned_by: assignedBy,
        status: 'pending',
        assigned_at: Date.now()
    }]);
    if (error) throw error;
};

export const getAllAssignments = async (): Promise<SurveyAssignment[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        return getLocalData('naret_assignments');
    }
     const { data, error } = await supabase.from('survey_assignments').select('*');
     if(error) return [];
     return mapAssignments(data);
};

export const getAssignmentsByPsychologist = async (psychId: string): Promise<SurveyAssignment[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const assignments = getLocalData('naret_assignments');
        return assignments.filter((a: any) => a.assignedBy === psychId);
    }

    const { data, error } = await supabase
        .from('survey_assignments')
        .select('*')
        .eq('assigned_by', psychId)
        .order('assigned_at', { ascending: false });

    if (error) return [];
    return mapAssignments(data);
};

export const getAllSurveysForPatient = async (patientId: string): Promise<SurveyAssignment[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const assignments = getLocalData('naret_assignments');
        return assignments.filter((a: any) => a.patientId === patientId);
    }

    const { data, error } = await supabase
        .from('survey_assignments')
        .select('*')
        .eq('patient_id', patientId);
    
    if (error) return [];
    return mapAssignments(data);
};

export const submitSurvey = async (assignmentId: string, responses: any[]) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const assignments = getLocalData('naret_assignments');
        const idx = assignments.findIndex((a: any) => a.id === assignmentId);
        if (idx !== -1) {
            assignments[idx].status = 'completed';
            assignments[idx].completedAt = Date.now();
            assignments[idx].responses = responses;
            saveLocalData('naret_assignments', assignments);
        }
        return;
    }

    const { error } = await supabase
        .from('survey_assignments')
        .update({
            status: 'completed',
            completed_at: Date.now(),
            responses: responses
        })
        .eq('id', assignmentId);
    
    if (error) throw error;
};

const mapAssignments = (data: any[]): SurveyAssignment[] => {
    return data.map(a => ({
        id: a.id,
        templateId: a.template_id,
        templateTitle: a.template_title,
        patientId: a.patient_id,
        assignedBy: a.assigned_by,
        status: a.status,
        responses: a.responses,
        assignedAt: parseInt(a.assigned_at),
        completedAt: a.completed_at ? parseInt(a.completed_at) : undefined
    }));
}

// --- Patient Reports (Naretbox) ---

export const savePatientReport = async (report: PatientReport) => {
    if (!IS_SUPABASE_CONFIGURED) {
        const reports = getLocalData('naret_reports');
        reports.push(report);
        saveLocalData('naret_reports', reports);
        return;
    }

    const { error } = await supabase.from('patient_reports').insert([{
        patient_id: report.patientId,
        psychologist_id: report.psychologistId,
        content: report.content,
        date: report.date,
        was_emailed: report.wasEmailed
    }]);
    if (error) throw error;
};

export const getReportsForPatient = async (patientId: string): Promise<PatientReport[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const reports = getLocalData('naret_reports');
        return reports.filter((r: any) => r.patientId === patientId).sort((a: any, b: any) => b.date - a.date);
    }

    const { data, error } = await supabase
        .from('patient_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });
        
    if (error) return [];
    return data.map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        psychologistId: r.psychologist_id,
        content: r.content,
        date: r.date,
        wasEmailed: r.was_emailed
    }));
};

export const getReportsByPsychologist = async (psychId: string): Promise<PatientReport[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const reports = getLocalData('naret_reports');
        return reports.filter((r: any) => r.psychologistId === psychId).sort((a: any, b: any) => b.date - a.date);
    }

    const { data, error } = await supabase
        .from('patient_reports')
        .select('*')
        .eq('psychologist_id', psychId)
        .order('date', { ascending: false });

    if (error) return [];
    return data.map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        psychologistId: r.psychologist_id,
        content: r.content,
        date: r.date,
        wasEmailed: r.was_emailed
    }));
};
