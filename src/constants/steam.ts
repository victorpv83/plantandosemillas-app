import { SubLevelInfo, SymbolItem, SymbolsTheme } from '../types';

export const OFFICIAL_SEMILLITO_IMAGE = '/assets/aistudio/semillito_fd772bdb.png';

export const STEAM_SUBLEVELS: SubLevelInfo[] = [
  // Tier 1: Explorador Tecnológico
  {
    tier: 'explorador',
    tierName: 'Explorador Tecnológico',
    subLevel: 3,
    rankOrder: 1,
    title: 'Explorador · Nivel 3',
    minPoints: 0,
    maxPoints: 40,
    description: 'Primeros pasos en el mundo de la lógica, robótica y programación.',
    badgeIcon: 'Compass',
  },
  {
    tier: 'explorador',
    tierName: 'Explorador Tecnológico',
    subLevel: 2,
    rankOrder: 2,
    title: 'Explorador · Nivel 2',
    minPoints: 40,
    maxPoints: 80,
    description: 'Comprendiendo las reglas de deducción y el pensamiento paso a paso.',
    badgeIcon: 'Compass',
  },
  {
    tier: 'explorador',
    tierName: 'Explorador Tecnológico',
    subLevel: 1,
    rankOrder: 3,
    title: 'Explorador · Nivel 1',
    minPoints: 80,
    maxPoints: 130,
    description: 'Dominio de los fundamentos iniciales de retos STEAM.',
    badgeIcon: 'Compass',
  },

  // Tier 2: Aprendiz Digital
  {
    tier: 'aprendiz',
    tierName: 'Aprendiz Digital',
    subLevel: 3,
    rankOrder: 4,
    title: 'Aprendiz · Nivel 3',
    minPoints: 130,
    maxPoints: 190,
    description: 'Estructurando algoritmos y resolviendo cuadrículas intermedias.',
    badgeIcon: 'Code2',
  },
  {
    tier: 'aprendiz',
    tierName: 'Aprendiz Digital',
    subLevel: 2,
    rankOrder: 5,
    title: 'Aprendiz · Nivel 2',
    minPoints: 190,
    maxPoints: 260,
    description: 'Deducción ágil sin repetir elementos en filas y columnas.',
    badgeIcon: 'Code2',
  },
  {
    tier: 'aprendiz',
    tierName: 'Aprendiz Digital',
    subLevel: 1,
    rankOrder: 6,
    title: 'Aprendiz · Nivel 1',
    minPoints: 260,
    maxPoints: 350,
    description: 'Secuencias lógicas completas y resolución autónoma de problemas.',
    badgeIcon: 'Code2',
  },

  // Tier 3: Constructor de Ideas
  {
    tier: 'constructor',
    tierName: 'Constructor de Ideas',
    subLevel: 3,
    rankOrder: 7,
    title: 'Constructor · Nivel 3',
    minPoints: 350,
    maxPoints: 460,
    description: 'Combinando programación por bloques y retos lógicos complejos.',
    badgeIcon: 'Cpu',
  },
  {
    tier: 'constructor',
    tierName: 'Constructor de Ideas',
    subLevel: 2,
    rankOrder: 8,
    title: 'Constructor · Nivel 2',
    minPoints: 460,
    maxPoints: 590,
    description: 'Optimizando soluciones y encontrando caminos eficientes.',
    badgeIcon: 'Cpu',
  },
  {
    tier: 'constructor',
    tierName: 'Constructor de Ideas',
    subLevel: 1,
    rankOrder: 9,
    title: 'Constructor · Nivel 1',
    minPoints: 590,
    maxPoints: 750,
    description: 'Maestría en ensamblaje de conceptos tecnológicos y deductivos.',
    badgeIcon: 'Cpu',
  },

  // Tier 4: Inventor STEAM
  {
    tier: 'inventor',
    tierName: 'Inventor STEAM',
    subLevel: 3,
    rankOrder: 10,
    title: 'Inventor · Nivel 3',
    minPoints: 750,
    maxPoints: 950,
    description: 'Diseño de estrategias avanzadas y superación de retos 5×5.',
    badgeIcon: 'Zap',
  },
  {
    tier: 'inventor',
    tierName: 'Inventor STEAM',
    subLevel: 2,
    rankOrder: 11,
    title: 'Inventor · Nivel 2',
    minPoints: 950,
    maxPoints: 1200,
    description: 'Pensamiento computacional riguroso y depuración de errores.',
    badgeIcon: 'Zap',
  },
  {
    tier: 'inventor',
    tierName: 'Inventor STEAM',
    subLevel: 1,
    rankOrder: 12,
    title: 'Inventor · Nivel 1',
    minPoints: 1200,
    maxPoints: 1500,
    description: 'Creación de soluciones innovadoras ante cualquier desafío.',
    badgeIcon: 'Zap',
  },

  // Tier 5: Maestro Tecnológico
  {
    tier: 'maestro',
    tierName: 'Maestro Tecnológico',
    subLevel: 3,
    rankOrder: 13,
    title: 'Maestro · Nivel 3',
    minPoints: 1500,
    maxPoints: 1900,
    description: 'Liderando el aula con ingenio y dominio completo del código.',
    badgeIcon: 'Crown',
  },
  {
    tier: 'maestro',
    tierName: 'Maestro Tecnológico',
    subLevel: 2,
    rankOrder: 14,
    title: 'Maestro · Nivel 2',
    minPoints: 1900,
    maxPoints: 2400,
    description: 'Capacidad para resolver cualquier reto en tiempo récord.',
    badgeIcon: 'Crown',
  },
  {
    tier: 'maestro',
    tierName: 'Maestro Tecnológico',
    subLevel: 1,
    rankOrder: 15,
    title: 'Maestro · Nivel 1',
    minPoints: 2400,
    maxPoints: 5000,
    description: '¡Máximo referente tecnológico de Plantando Semillas STEAM!',
    badgeIcon: 'Crown',
  },
];

export function getSubLevelForPoints(points: number): SubLevelInfo {
  for (let i = STEAM_SUBLEVELS.length - 1; i >= 0; i--) {
    if (points >= STEAM_SUBLEVELS[i].minPoints) {
      return STEAM_SUBLEVELS[i];
    }
  }
  return STEAM_SUBLEVELS[0];
}

export function getSubLevelProgress(points: number): {
  currentSubLevel: SubLevelInfo;
  nextSubLevel: SubLevelInfo | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const current = getSubLevelForPoints(points);
  const currentIndex = STEAM_SUBLEVELS.findIndex((s) => s.rankOrder === current.rankOrder);
  const next = currentIndex < STEAM_SUBLEVELS.length - 1 ? STEAM_SUBLEVELS[currentIndex + 1] : null;

  if (!next) {
    return {
      currentSubLevel: current,
      nextSubLevel: null,
      progressPercent: 100,
      pointsToNext: 0,
    };
  }

  const range = next.minPoints - current.minPoints;
  const earnedInRange = Math.max(0, points - current.minPoints);
  const progressPercent = Math.min(100, Math.round((earnedInRange / range) * 100));
  const pointsToNext = Math.max(0, next.minPoints - points);

  return {
    currentSubLevel: current,
    nextSubLevel: next,
    progressPercent,
    pointsToNext,
  };
}

export const THEME_SYMBOLS: Record<SymbolsTheme, SymbolItem[]> = {
  minecraft: [
    {
      id: 'semillito',
      label: 'Semillito',
      iconName: 'Sprout',
      symbolChar: '🌱',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-300',
      avatarUrl: OFFICIAL_SEMILLITO_IMAGE,
    },
    {
      id: 'steve',
      label: 'Steve',
      iconName: 'User',
      symbolChar: '🧑',
      bgClass: 'bg-blue-50 hover:bg-blue-100',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-300',
    },
    {
      id: 'creeper',
      label: 'Creeper',
      iconName: 'ShieldAlert',
      symbolChar: '💚',
      bgClass: 'bg-green-50 hover:bg-green-100',
      textClass: 'text-green-700',
      borderClass: 'border-green-300',
    },
    {
      id: 'alex',
      label: 'Alex',
      iconName: 'Compass',
      symbolChar: '🧑🚀',
      bgClass: 'bg-amber-50 hover:bg-amber-100',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-300',
    },
    {
      id: 'enderman',
      label: 'Enderman',
      iconName: 'Eye',
      symbolChar: '🟪',
      bgClass: 'bg-purple-50 hover:bg-purple-100',
      textClass: 'text-purple-700',
      borderClass: 'border-purple-300',
    },
  ],
  robotics: [
    {
      id: 'bot',
      label: 'Robot',
      iconName: 'Bot',
      symbolChar: '🤖',
      bgClass: 'bg-indigo-50 hover:bg-indigo-100',
      textClass: 'text-indigo-600',
      borderClass: 'border-indigo-300',
    },
    {
      id: 'gear',
      label: 'Engranaje',
      iconName: 'Cog',
      symbolChar: '⚙️',
      bgClass: 'bg-amber-50 hover:bg-amber-100',
      textClass: 'text-amber-600',
      borderClass: 'border-amber-300',
    },
    {
      id: 'battery',
      label: 'Batería',
      iconName: 'BatteryCharging',
      symbolChar: '🔋',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100',
      textClass: 'text-emerald-600',
      borderClass: 'border-emerald-300',
    },
    {
      id: 'chip',
      label: 'Microchip',
      iconName: 'Cpu',
      symbolChar: '💻',
      bgClass: 'bg-cyan-50 hover:bg-cyan-100',
      textClass: 'text-cyan-600',
      borderClass: 'border-cyan-300',
    },
    {
      id: 'seed',
      label: 'Semillito',
      iconName: 'Sprout',
      symbolChar: '🌱',
      bgClass: 'bg-lime-50 hover:bg-lime-100',
      textClass: 'text-lime-700',
      borderClass: 'border-lime-300',
      avatarUrl: OFFICIAL_SEMILLITO_IMAGE,
    },
  ],
  circuits: [
    {
      id: 'led',
      label: 'LED',
      iconName: 'Lightbulb',
      symbolChar: '💡',
      bgClass: 'bg-amber-50 hover:bg-amber-100',
      textClass: 'text-amber-600',
      borderClass: 'border-amber-300',
    },
    {
      id: 'zap',
      label: 'Voltaje',
      iconName: 'Zap',
      symbolChar: '⚡',
      bgClass: 'bg-yellow-50 hover:bg-yellow-100',
      textClass: 'text-yellow-700',
      borderClass: 'border-yellow-300',
    },
    {
      id: 'plug',
      label: 'Conector',
      iconName: 'Radio',
      symbolChar: '🔌',
      bgClass: 'bg-violet-50 hover:bg-violet-100',
      textClass: 'text-violet-600',
      borderClass: 'border-violet-300',
    },
    {
      id: 'board',
      label: 'Placa',
      iconName: 'Layers',
      symbolChar: '📟',
      bgClass: 'bg-blue-50 hover:bg-blue-100',
      textClass: 'text-blue-600',
      borderClass: 'border-blue-300',
    },
    {
      id: 'radar',
      label: 'Sensor',
      iconName: 'Radar',
      symbolChar: '📡',
      bgClass: 'bg-rose-50 hover:bg-rose-100',
      textClass: 'text-rose-600',
      borderClass: 'border-rose-300',
    },
  ],
  nature_steam: [
    {
      id: 'sprout',
      label: 'Brote',
      iconName: 'Sprout',
      symbolChar: '🌱',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-300',
    },
    {
      id: 'sun',
      label: 'Solar',
      iconName: 'SunMedium',
      symbolChar: '☀️',
      bgClass: 'bg-amber-50 hover:bg-amber-100',
      textClass: 'text-amber-600',
      borderClass: 'border-amber-300',
    },
    {
      id: 'water',
      label: 'Hidro',
      iconName: 'Droplets',
      symbolChar: '💧',
      bgClass: 'bg-sky-50 hover:bg-sky-100',
      textClass: 'text-sky-600',
      borderClass: 'border-sky-300',
    },
    {
      id: 'wind',
      label: 'EcoDron',
      iconName: 'Wind',
      symbolChar: '🍃',
      bgClass: 'bg-teal-50 hover:bg-teal-100',
      textClass: 'text-teal-700',
      borderClass: 'border-teal-300',
    },
    {
      id: 'microscope',
      label: 'BioLupa',
      iconName: 'Eye',
      symbolChar: '🔬',
      bgClass: 'bg-purple-50 hover:bg-purple-100',
      textClass: 'text-purple-600',
      borderClass: 'border-purple-300',
    },
  ],
  planets: [
    {
      id: 'rocket',
      label: 'Cohete',
      iconName: 'Rocket',
      symbolChar: '🚀',
      bgClass: 'bg-red-50 hover:bg-red-100',
      textClass: 'text-red-600',
      borderClass: 'border-red-300',
    },
    {
      id: 'planet',
      label: 'Planeta',
      iconName: 'Globe',
      symbolChar: '🪐',
      bgClass: 'bg-indigo-50 hover:bg-indigo-100',
      textClass: 'text-indigo-600',
      borderClass: 'border-indigo-300',
    },
    {
      id: 'satellite',
      label: 'Satélite',
      iconName: 'Radio',
      symbolChar: '🛰️',
      bgClass: 'bg-cyan-50 hover:bg-cyan-100',
      textClass: 'text-cyan-600',
      borderClass: 'border-cyan-300',
    },
    {
      id: 'telescope',
      label: 'Telescopio',
      iconName: 'Eye',
      symbolChar: '🔭',
      bgClass: 'bg-violet-50 hover:bg-violet-100',
      textClass: 'text-violet-600',
      borderClass: 'border-violet-300',
    },
    {
      id: 'star',
      label: 'Constelación',
      iconName: 'Sparkles',
      symbolChar: '⭐',
      bgClass: 'bg-amber-50 hover:bg-amber-100',
      textClass: 'text-amber-500',
      borderClass: 'border-amber-300',
    },
  ],
};

export const SEMILLITO_PHRASES = [
  '¡Hola! Recuerda que ningún personaje puede compartir fila ni columna con otro.',
  '¡Cada reto que resuelves riega tu curiosidad científica y tecnológica!',
  'Fíjate bien en las pistas ordenadas: cada descubrimiento te ayuda a resolver el siguiente.',
  'En programación por bloques, cada instrucción le dice exactamente a Semillito qué hacer.',
  '¿Sabías que Steve, Alex y Semillito colaboran juntos para encontrar tesoros de conocimiento?',
  '¡Tómate tu tiempo, pensar con calma es de grandes inventores!',
  'Si te equivocas, ¡no pasa nada! En ciencia y robótica los errores son nuevos descubrimientos.',
];
