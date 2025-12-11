
import { BoxType, SurveyTemplate } from './types';

export const LOCAL_STORAGE_KEY = 'naretbox_entries';
export const SETTINGS_STORAGE_KEY = 'naretbox_settings';
export const USERS_STORAGE_KEY = 'naret_users';
export const CURRENT_USER_KEY = 'naret_current_user';

export const PSYCHOLOGIST_EMAIL = 'nachos.delvalle@gmail.com';

export const BOX_COLORS = {
  [BoxType.POSITIVE]: {
    bg: 'bg-emerald-900/40',
    border: 'border-emerald-500/50',
    text: 'text-emerald-300',
    textHeader: 'text-emerald-400',
    icon: 'bg-emerald-600',
    hover: 'hover:bg-emerald-900/60',
    placeholder: 'placeholder-emerald-700/50',
    inputBg: 'bg-emerald-950/50',
    inputBorder: 'border-emerald-700/50'
  },
  [BoxType.NEGATIVE]: {
    bg: 'bg-slate-800/60',
    border: 'border-slate-600/50',
    text: 'text-slate-300',
    textHeader: 'text-slate-200',
    icon: 'bg-slate-600',
    hover: 'hover:bg-slate-800',
    placeholder: 'placeholder-slate-600',
    inputBg: 'bg-slate-900/50',
    inputBorder: 'border-slate-700'
  }
};

export const INITIAL_MENTAL_HEALTH_ASSESSMENT: SurveyTemplate = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Valid UUID for Postgres
  psychologistId: 'system',
  title: 'Cuestionario de Salud Mental - Evaluación Inicial',
  description: 'Evaluación estandarizada para medir niveles de depresión, ansiedad, estrés y bienestar general.',
  createdAt: Date.now(),
  questions: [
    // 1. Depresión
    {
      id: 'dep_1',
      type: 'multiple_choice',
      section: '1. Depresión',
      text: '¿Con qué frecuencia se ha sentido decaído/a, triste o sin esperanza en las últimas dos semanas?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'dep_2',
      type: 'multiple_choice',
      section: '1. Depresión',
      text: '¿Ha tenido dificultades para disfrutar de actividades que normalmente le resultan placenteras?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'dep_3',
      type: 'multiple_choice',
      section: '1. Depresión',
      text: '¿Se ha sentido cansado/a o sin energía, incluso después de descansar?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'dep_4',
      type: 'multiple_choice',
      section: '1. Depresión',
      text: '¿Ha tenido dificultades para concentrarse en cosas como leer el periódico o ver televisión?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'dep_5_risk', // Tagged for risk detection
      type: 'multiple_choice',
      section: '1. Depresión',
      text: '¿Ha tenido pensamientos de autolesionarse o hacerse daño?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },

    // 2. Ansiedad
    {
      id: 'anx_1',
      type: 'multiple_choice',
      section: '2. Ansiedad',
      text: '¿Con qué frecuencia se ha sentido nervioso/a, ansioso/a o preocupado/a por cosas que normalmente no le preocuparían?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'anx_2',
      type: 'multiple_choice',
      section: '2. Ansiedad',
      text: '¿Ha experimentado temblores, palpitaciones o dificultad para respirar cuando se siente ansioso/a?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'anx_3',
      type: 'multiple_choice',
      section: '2. Ansiedad',
      text: '¿Se ha sentido tenso/a, con los músculos apretados, especialmente en los hombros o la mandíbula?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'anx_4',
      type: 'multiple_choice',
      section: '2. Ansiedad',
      text: '¿Tiene dificultades para relajarse o desconectar de las preocupaciones diarias?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'anx_5',
      type: 'multiple_choice',
      section: '2. Ansiedad',
      text: '¿Ha evitado situaciones o actividades debido a la ansiedad o el miedo?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },

    // 3. Estrés
    {
      id: 'str_1',
      type: 'multiple_choice',
      section: '3. Estrés',
      text: '¿En las últimas dos semanas, cuántas veces ha sentido que no puede manejar las demandas de su vida?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'str_2',
      type: 'multiple_choice',
      section: '3. Estrés',
      text: '¿Con qué frecuencia ha tenido dificultades para dormir debido a preocupaciones o tensiones?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'str_3',
      type: 'multiple_choice',
      section: '3. Estrés',
      text: '¿Ha experimentado dolores de cabeza o problemas digestivos sin causa aparente?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'str_4',
      type: 'multiple_choice',
      section: '3. Estrés',
      text: '¿Ha tenido dificultades para concentrarse o sentirse fácilmente abrumado/a por tareas diarias?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },

    // 4. Autopercepción
    {
      id: 'aut_1',
      type: 'multiple_choice',
      section: '4. Autopercepción y Relaciones Sociales',
      text: '¿Se siente incomprendido/a por las personas cercanas a usted?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'aut_2',
      type: 'multiple_choice',
      section: '4. Autopercepción y Relaciones Sociales',
      text: '¿Siente que sus relaciones con amigos o familiares están afectadas por su estado emocional?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'aut_3',
      type: 'multiple_choice',
      section: '4. Autopercepción y Relaciones Sociales',
      text: '¿En general, cómo calificaría su bienestar emocional en las últimas dos semanas?',
      options: ['Muy bien', 'Bien', 'Regular', 'Malo', 'Muy malo']
    },

    // 5. Comportamientos
    {
      id: 'hab_1',
      type: 'multiple_choice',
      section: '5. Comportamientos y Hábitos',
      text: '¿Ha experimentado cambios en su apetito o hábitos alimenticios?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'hab_2',
      type: 'multiple_choice',
      section: '5. Comportamientos y Hábitos',
      text: '¿Ha tenido dificultades para dormir o dormir demasiado?',
      options: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Siempre']
    },
    {
      id: 'hab_3',
      type: 'multiple_choice',
      section: '5. Comportamientos y Hábitos',
      text: '¿Ha tenido más o menos energía de lo habitual?',
      options: ['Mucho más', 'Un poco más', 'Igual', 'Un poco menos', 'Mucho menos']
    },

    // 6. Historia
    {
      id: 'hist_1',
      type: 'multiple_choice',
      section: '6. Historia Personal y Contexto Familiar',
      text: '¿Ha tenido antecedentes familiares de trastornos emocionales?',
      options: ['Sí', 'No', 'No sé']
    },
    {
      id: 'hist_2',
      type: 'multiple_choice',
      section: '6. Historia Personal y Contexto Familiar',
      text: '¿Hay eventos recientes en su vida que cree que puedan estar afectando su bienestar emocional?',
      options: ['Sí', 'No', 'No estoy seguro/a']
    },
    {
      id: 'hist_3',
      type: 'multiple_choice',
      section: '6. Historia Personal y Contexto Familiar',
      text: '¿Ha tenido algún tipo de apoyo o terapia en el pasado?',
      options: ['Sí, y fue útil', 'Sí, pero no fue útil', 'No he tenido terapia antes']
    },

    // Additional
    {
      id: 'comments',
      type: 'text',
      section: 'Comentarios adicionales',
      text: 'Espacio para expresar cualquier otra preocupación o comentario'
    }
  ]
};
