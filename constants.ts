
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

export const BDI_II_ASSESSMENT: SurveyTemplate = {
  id: 'bdi-ii-standard-v1',
  psychologistId: 'system',
  title: 'Inventario de Depresión de Beck (BDI-II)',
  description: 'Cuestionario de autoinforme de 21 ítems para medir la severidad de la depresión.',
  createdAt: Date.now(),
  questions: [
    {
      id: 'bdi_1',
      type: 'multiple_choice',
      text: '1. Tristeza',
      options: [
        '0: No me siento triste.',
        '1: Me siento triste.',
        '2: Estoy triste todo el tiempo y no puedo deshacerme de ello.',
        '3: Estoy tan triste o deprimido que no puedo soportarlo.'
      ]
    },
    {
      id: 'bdi_2',
      type: 'multiple_choice',
      text: '2. Pesimismo',
      options: [
        '0: No me siento desilusionado con el futuro.',
        '1: Me siento más desilusionado con el futuro de lo que solía estar.',
        '2: No tengo esperanza para el futuro.',
        '3: El futuro me parece completamente sin esperanza.'
      ]
    },
    {
      id: 'bdi_3',
      type: 'multiple_choice',
      text: '3. Sentimientos de fracaso',
      options: [
        '0: No siento que haya fracasado más de lo normal.',
        '1: He fracasado más de lo que me gustaría.',
        '2: He fracasado mucho más de lo que alguna vez podría haber esperado.',
        '3: Me siento un completo fracaso como persona.'
      ]
    },
    {
      id: 'bdi_4',
      type: 'multiple_choice',
      text: '4. Pérdida de placer',
      options: [
        '0: No he perdido el placer de hacer las cosas.',
        '1: He perdido algo del placer de hacer las cosas.',
        '2: Ya no disfruto de hacer casi nada.',
        '3: Todo lo que solía disfrutar me parece aburrido o sin importancia.'
      ]
    },
    {
      id: 'bdi_5',
      type: 'multiple_choice',
      text: '5. Culpa',
      options: [
        '0: No me siento especialmente culpable.',
        '1: Me siento culpable sobre algunas cosas que he hecho o dejado de hacer.',
        '2: Me siento culpable la mayor parte del tiempo.',
        '3: Me siento culpable todo el tiempo, por cosas que he hecho o dejado de hacer.'
      ]
    },
    {
      id: 'bdi_6',
      type: 'multiple_choice',
      text: '6. Sentimientos de castigo',
      options: [
        '0: No me siento castigado.',
        '1: Me siento algo castigado.',
        '2: Siento que me estoy castigando a mí mismo.',
        '3: Siento que merezco ser castigado.'
      ]
    },
    {
      id: 'bdi_7',
      type: 'multiple_choice',
      text: '7. Desapego',
      options: [
        '0: No me siento más desapegado de los demás que antes.',
        '1: Me siento un poco más desapegado de los demás.',
        '2: Me siento mucho más desapegado de los demás de lo que solía estar.',
        '3: Me siento totalmente alejado de los demás.'
      ]
    },
    {
      id: 'bdi_8',
      type: 'multiple_choice',
      text: '8. Autovaloración',
      options: [
        '0: No me siento más desvalorizado que antes.',
        '1: Me siento algo desvalorizado.',
        '2: Me siento mucho más desvalorizado de lo que solía estar.',
        '3: Me siento completamente desvalorizado.'
      ]
    },
    {
      id: 'bdi_9',
      type: 'multiple_choice',
      text: '9. Preocupación por la salud',
      options: [
        '0: No estoy más preocupado por mi salud que antes.',
        '1: Estoy un poco más preocupado por mi salud.',
        '2: Estoy muy preocupado por mi salud.',
        '3: Estoy absolutamente aterrorizado por mi salud.'
      ]
    },
    {
      id: 'bdi_10',
      type: 'multiple_choice',
      text: '10. Irritabilidad',
      options: [
        '0: No me siento más irritable de lo habitual.',
        '1: Me siento más irritable de lo habitual.',
        '2: Me siento mucho más irritable que antes.',
        '3: Estoy tan irritable que no puedo soportarlo.'
      ]
    },
    {
      id: 'bdi_11',
      type: 'multiple_choice',
      text: '11. Pérdida de interés en las actividades',
      options: [
        '0: No he perdido interés por ninguna actividad.',
        '1: He perdido algo de interés por algunas actividades.',
        '2: He perdido mucho interés por la mayoría de las actividades.',
        '3: He perdido completamente el interés por todas las actividades.'
      ]
    },
    {
      id: 'bdi_12',
      type: 'multiple_choice',
      text: '12. Falta de concentración',
      options: [
        '0: No tengo problemas de concentración.',
        '1: Tengo algo de dificultad para concentrarme.',
        '2: Tengo mucha dificultad para concentrarme.',
        '3: No puedo concentrarme en nada.'
      ]
    },
    {
      id: 'bdi_13',
      type: 'multiple_choice',
      text: '13. Indecisión',
      options: [
        '0: No soy más indeciso de lo habitual.',
        '1: Soy algo más indeciso que antes.',
        '2: Soy mucho más indeciso que antes.',
        '3: Soy completamente incapaz de tomar decisiones.'
      ]
    },
    {
      id: 'bdi_14',
      type: 'multiple_choice',
      text: '14. Alteraciones en el sueño',
      options: [
        '0: Duermo tan bien como siempre.',
        '1: Duermo un poco peor que antes.',
        '2: Duermo mucho peor que antes.',
        '3: Me cuesta mucho dormir o duermo en exceso.'
      ]
    },
    {
      id: 'bdi_15',
      type: 'multiple_choice',
      text: '15. Fatiga',
      options: [
        '0: No me siento más fatigado que antes.',
        '1: Me siento un poco más fatigado que antes.',
        '2: Me siento mucho más fatigado que antes.',
        '3: Estoy tan fatigado que no puedo hacer nada.'
      ]
    },
    {
      id: 'bdi_16',
      type: 'multiple_choice',
      text: '16. Cambio en el apetito',
      options: [
        '0: No he notado ningún cambio en mi apetito.',
        '1: Mi apetito ha disminuido un poco.',
        '2: Mi apetito ha disminuido mucho.',
        '3: Mi apetito ha aumentado o disminuido significativamente.'
      ]
    },
    {
      id: 'bdi_17',
      type: 'multiple_choice',
      text: '17. Pérdida de peso o aumento de peso',
      options: [
        '0: No he experimentado pérdida de peso ni aumento de peso.',
        '1: He perdido o ganado algo de peso.',
        '2: He perdido o ganado bastante peso.',
        '3: He perdido o ganado una cantidad significativa de peso.'
      ]
    },
    {
      id: 'bdi_18',
      type: 'multiple_choice',
      text: '18. Sentimientos de inutilidad',
      options: [
        '0: No me siento inútil.',
        '1: Me siento algo inútil.',
        '2: Me siento bastante inútil.',
        '3: Me siento completamente inútil.'
      ]
    },
    {
      id: 'bdi_19',
      type: 'multiple_choice',
      text: '19. Dificultad para tomar decisiones',
      options: [
        '0: No tengo problemas para tomar decisiones.',
        '1: Me cuesta un poco tomar decisiones.',
        '2: Me cuesta mucho tomar decisiones.',
        '3: No puedo tomar ninguna decisión.'
      ]
    },
    {
      id: 'bdi_20',
      type: 'multiple_choice',
      text: '20. Pensamientos suicidas',
      options: [
        '0: No tengo pensamientos suicidas.',
        '1: He pensado en la muerte, pero no en hacerle daño a mi vida.',
        '2: He pensado en hacerle daño a mi vida, pero no tengo intención de hacerlo.',
        '3: He pensado en hacerle daño a mi vida y tengo intenciones de hacerlo.'
      ]
    },
    {
      id: 'bdi_21',
      type: 'multiple_choice',
      text: '21. Llanto',
      options: [
        '0: No he llorado más de lo habitual.',
        '1: He llorado más de lo habitual.',
        '2: He llorado mucho más de lo habitual.',
        '3: Lloro todo el tiempo.'
      ]
    }
  ]
};
