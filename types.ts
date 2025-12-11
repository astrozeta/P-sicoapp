
export enum BoxType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

export type UserRole = 'patient' | 'psychologist' | 'admin';

export interface Entry {
  id: string;
  text: string;
  type: BoxType;
  timestamp: number; // Unix timestamp
  dateStr: string; // ISO date string YYYY-MM-DD for grouping
}

export interface AppSettings {
  notificationTime: string; // HH:MM format
  notificationsEnabled: boolean;
}

export interface AnalysisResult {
  summary: string;
  advice: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  surnames?: string;
  phone?: string;
  photoUrl?: string;
  password?: string;
  role: UserRole;
  assignedPsychologistId?: string; // For patients
  assignedPsychologistEmail?: string;
}

// --- Survey & Task System ---

export type QuestionType = 'scale' | 'text' | 'multiple_choice';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For multiple choice
  section?: string; // TO group questions (e.g., "Depresión", "Ansiedad")
}

export interface SurveyTemplate {
  id: string;
  psychologistId: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdAt: number;
}

export interface SurveyResponse {
  questionId: string;
  answer: string | number;
}

export interface SurveyAssignment {
  id: string;
  templateId: string;
  templateTitle: string;
  patientId: string;
  assignedBy: string;
  status: 'pending' | 'completed';
  responses?: SurveyResponse[];
  assignedAt: number;
  completedAt?: number;
}

export interface Task {
  id: string;
  patientId: string;
  assignedBy: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: number;
}

// --- Educational Resources (Infographics) ---

export interface EducationalResource {
    id: string;
    psychologistId: string;
    title: string;
    description: string;
    type: 'image' | 'pdf' | 'video' | 'link';
    url: string;
    createdAt: number;
}

export interface ResourceAssignment {
    id: string;
    resourceId: string;
    patientId: string;
    assignedBy: string;
    assignedAt: number;
}

// --- Persistent Reports ---

export interface PatientReport {
    id: string;
    patientId: string;
    psychologistId: string;
    date: number; // Timestamp
    content: {
        positives: string[];
        negatives: string[];
        summary?: string;
    };
    wasEmailed: boolean;
}

export type ViewState = 'landing' | 'hub' | 'tool-naretbox' | 'tool-survey' | 'psych-dashboard' | 'admin-dashboard' | 'settings';
