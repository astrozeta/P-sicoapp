import { GoogleGenAI } from "@google/genai";
import { Entry, BoxType, AnalysisResult } from "../types";

// Helper robusto para obtener variables de entorno en Vite
const getApiKey = (): string | undefined => {
  // 1. Intentar vía Vite (Estándar para React apps modernas y GitHub Actions)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  
  // 2. Intentar vía process.env (Fallback seguro para Node/Local)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignorar errores de referencia en navegadores estrictos
  }
  
  return undefined;
};

export const analyzeDailyBalance = async (entries: Entry[]): Promise<AnalysisResult> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      summary: "IA no disponible",
      advice: "Para activar el análisis inteligente, configura el secreto VITE_API_KEY en tu repositorio de GitHub (Settings > Secrets and variables > Actions)."
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const positives = entries.filter(e => e.type === BoxType.POSITIVE).map(e => e.text);
  const negatives = entries.filter(e => e.type === BoxType.NEGATIVE).map(e => e.text);

  if (positives.length === 0 && negatives.length === 0) {
    return {
      summary: "No hay entradas para analizar hoy.",
      advice: "Intenta registrar al menos un evento para comenzar."
    };
  }

  const prompt = `
    Actúa como un psicólogo experto, empático y constructivo que utiliza la técnica de la "Caja Positiva y Caja Negativa".
    
    Aquí tienes el registro del día del usuario:
    
    CAJA POSITIVA (Cosas buenas):
    ${positives.length > 0 ? positives.map(p => `- ${p}`).join('\n') : "Ninguna registrada."}
    
    CAJA NEGATIVA (Cosas malas/difíciles):
    ${negatives.length > 0 ? negatives.map(n => `- ${n}`).join('\n') : "Ninguna registrada."}
    
    Tu tarea es generar un balance del día en formato JSON.
    1. "summary": Un resumen breve y equilibrado del día (máx 2 frases).
    2. "advice": Si hay cosas negativas, intenta hacer "reframing" (re-enmarcado cognitivo) para sacar algo positivo, un aprendizaje o una perspectiva más amable de lo sucedido. Si solo hay cosas positivas, celebra el éxito. Mantén un tono cálido y de apoyo.

    Responde SOLAMENTE con el JSON raw.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing entries:", error);
    return {
      summary: "No pudimos conectar con tu asistente virtual en este momento.",
      advice: "Revisa tus entradas manualmente e intenta encontrar el lado positivo de las situaciones difíciles."
    };
  }
};