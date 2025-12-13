
export enum BoxType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

export type UserRole = 'patient' | 'psychologist' | 'admin';

export interface Entry {
  id: string;
  text: string;
  type: BoxType;
  timestamp: number;
  dateStr: string;
}

export interface AppSettings {
  notificationTime: string;
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
  assignedPsychologistId?: string;
  assignedPsychologistEmail?: string;
  
  // Extended Profile Basic Info (DB mapped to profiles)
  birthDate?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  maritalStatus?: string;
  insuranceNumber?: string;
  referralSource?: string;
}

// --- Clinical Records (New Tables) ---

export interface ClinicalProfile {
    userId: string;
    reasonForConsult: string;
    preexistingConditions: string[]; // Stored as JSON array in DB
    previousTreatments: string;
    currentMedication: string;
    diagnosis: string;
    riskLevel: 'Bajo' | 'Medio' | 'Alto';
    riskDetails: string;
    therapeuticApproach: string;
    patientFeedback: string;
}

export interface ClinicalSession {
    id: string;
    patientId: string;
    psychologistId: string;
    date: number; // Unix timestamp
    objectives: string;
    summary: string;
    notes: string;
    progress: number; // 0-100
    nextSteps: string;
}

export interface TreatmentGoal {
    id: string;
    patientId: string;
    description: string;
    type: 'short_term' | 'long_term';
    status: 'pending' | 'in_progress' | 'achieved';
    createdAt: number;
}

export interface FinancialRecord {
    id: string;
    patientId: string;
    date: number;
    concept: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    method: 'card' | 'transfer' | 'cash';
}

export interface Reminder {
    id: string;
    patientId: string;
    psychologistId: string;
    title: string;
    date: number; // Target date
    isCompleted: boolean;
}

// --- Survey & Task System ---

export type QuestionType = 'scale' | 'text' | 'multiple_choice';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  section?: string;
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

export interface PatientReport {
    id: string;
    patientId: string;
    psychologistId: string;
    date: number;
    content: {
        positives: string[];
        negatives: string[];
        summary?: string;
    };
    wasEmailed: boolean;
}

// --- APPOINTMENTS SYSTEM ---
export interface Appointment {
    id: string;
    psychologistId: string;
    patientId?: string; // If null/undefined, it might be a block
    startTime: number;
    endTime: number;
    status: 'booked' | 'blocked' | 'cancelled' | 'completed'; // Removed 'available' as we don't store them
    notes?: string;
    meetLink?: string;
}

export type ViewState = 'landing' | 'hub' | 'tool-naretbox' | 'tool-survey' | 'psych-dashboard' | 'admin-dashboard' | 'settings';
