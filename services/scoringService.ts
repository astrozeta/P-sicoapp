import { SurveyResponse } from '../types';

export interface SectionScore {
    rawScore: number;
    maxScore: number;
    level: 'Normal' | 'Leve' | 'Moderado' | 'Grave';
    color: string;
    advice: string;
}

export interface AssessmentResult {
    totalScore: number;
    depression: SectionScore;
    anxiety: SectionScore;
    stress: SectionScore;
    redFlags: string[]; // Alerts like self-harm
}

export interface BDIResult {
    score: number;
    level: string;
    color: string;
    hasSuicidalRisk: boolean;
}

const mapAnswerToPoints = (answer: string): number => {
    switch (answer) {
        case 'Nunca': return 0;
        case 'Algunas veces': return 1;
        case 'Con frecuencia': return 2;
        case 'Siempre': return 3;
        default: return 0;
    }
};

const getLevel = (score: number, thresholds: { mild: number, mod: number, severe: number }) => {
    if (score >= thresholds.severe) return { level: 'Grave', color: 'text-red-500', advice: 'Se recomienda intervención profesional intensiva.' };
    if (score >= thresholds.mod) return { level: 'Moderado', color: 'text-orange-500', advice: 'Se sugiere evaluación profunda y posible cambio de enfoque.' };
    if (score >= thresholds.mild) return { level: 'Leve', color: 'text-yellow-500', advice: 'Monitorear evolución.' };
    return { level: 'Normal', color: 'text-emerald-500', advice: 'No se requieren intervenciones adicionales.' };
};

export const calculateMentalHealthScore = (responses: SurveyResponse[]): AssessmentResult => {
    const redFlags: string[] = [];
    
    // Helper to sum points for questions starting with a prefix
    const sumSection = (prefix: string) => {
        return responses
            .filter(r => r.questionId.startsWith(prefix))
            .reduce((sum, r) => {
                const points = mapAnswerToPoints(String(r.answer));
                // Check red flag specifically for dep_5 (Self harm)
                if (r.questionId === 'dep_5_risk' && points > 0) {
                    redFlags.push("ALERTA: El paciente reportó pensamientos de autolesión.");
                }
                return sum + points;
            }, 0);
    };

    const depScore = sumSection('dep');
    const anxScore = sumSection('anx');
    const strScore = sumSection('str');

    // Thresholds defined in prompt
    // Dep/Anx/Stress: 0-3 Normal, 4-7 Mild, 8-12 Moderate, 13-15 Severe
    const thresholds = { mild: 4, mod: 8, severe: 13 };

    const depLevel = getLevel(depScore, thresholds);
    const anxLevel = getLevel(anxScore, thresholds);
    const strLevel = getLevel(strScore, thresholds);

    return {
        totalScore: depScore + anxScore + strScore,
        depression: {
            rawScore: depScore,
            maxScore: 15,
            level: depLevel.level as any,
            color: depLevel.color,
            advice: depLevel.advice
        },
        anxiety: {
            rawScore: anxScore,
            maxScore: 15,
            level: anxLevel.level as any,
            color: anxLevel.color,
            advice: anxLevel.advice
        },
        stress: {
            rawScore: strScore,
            maxScore: 12, // 4 questions * 3 = 12 max
            level: strLevel.level as any,
            color: strLevel.color,
            advice: strLevel.advice
        },
        redFlags
    };
};

export const calculateBDIScore = (responses: SurveyResponse[]): BDIResult => {
    let totalScore = 0;
    let hasSuicidalRisk = false;

    responses.forEach(r => {
        // Answer format is "0: No me siento..." or "3: Me siento..."
        // Extract the first character as number
        const valStr = String(r.answer).split(':')[0].trim();
        const val = parseInt(valStr, 10);
        
        if (!isNaN(val)) {
            totalScore += val;
        }

        // Check for suicide risk (Item 20, usually id 'bdi_20')
        if (r.questionId === 'bdi_20' && val > 0) {
            hasSuicidalRisk = true;
        }
    });

    let level = 'Depresión mínima';
    let color = 'text-emerald-500';

    if (totalScore >= 29) {
        level = 'Depresión grave';
        color = 'text-red-500';
    } else if (totalScore >= 20) {
        level = 'Depresión moderada';
        color = 'text-orange-500';
    } else if (totalScore >= 14) {
        level = 'Depresión leve';
        color = 'text-yellow-500';
    }

    return { score: totalScore, level, color, hasSuicidalRisk };
};
