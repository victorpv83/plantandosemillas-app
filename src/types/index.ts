export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  role: UserRole;
  alias: string;
  display_name?: string;
  total_points: number;
  current_level: number;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface StudentDetail extends User {
  personal_code?: string; // Visible only for teacher or student self
  completed_challenges_count: number;
  badges_count?: number;
  badges: Badge[];
}

export type ChallengeCategory = 'robótica' | 'programación' | 'lógica' | 'electrónica' | 'steam';
export type ChallengeDifficulty = 'Fácil' | 'Medio' | 'Avanzado';
export type ChallengeType = 'semidoku' | 'blockly_code';
export type ChallengeSubtype = 'latin_square' | 'character_placement' | 'maze_blocks';
export type SymbolsTheme =
  | 'robotics'
  | 'circuits'
  | 'nature_steam'
  | 'planets'
  | 'minecraft'
  | 'secret_garden'
  | 'haunted_castle'
  | 'halloween_lab';

export interface SymbolItem {
  id: string;
  label: string;
  iconName: string;
  symbolChar: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  avatarUrl?: string;
  isFixed?: boolean;
}

export type GridCell = string | null;
export type SemidokuGrid = GridCell[][];

export interface GuidedClue {
  step: number;
  title: string;
  text: string;
  question: string;
}

export interface BlockMazeConfig {
  gridRows: number;
  gridCols: number;
  startPos: { r: number; c: number; dir: 'up' | 'right' | 'down' | 'left' };
  goalPos: { r: number; c: number };
  obstacles: { r: number; c: number }[];
  collectibles: { r: number; c: number }[];
  maxBlocks?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  subtype?: ChallengeSubtype;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  estimated_time_min: number;
  is_published: boolean;
  grid_size: number;
  symbols_theme: SymbolsTheme;
  clues_grid: SemidokuGrid;
  solution_grid?: SemidokuGrid; // Hidden from student until solved
  guided_clues?: GuidedClue[];
  block_config?: BlockMazeConfig;
  created_at: string;
  updated_at: string;
  // Student contextual fields
  is_completed?: boolean;
  completed_at?: string;
  earned_points?: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked_at?: string;
}

export interface SubLevelInfo {
  tier: 'explorador' | 'aprendiz' | 'constructor' | 'inventor' | 'maestro';
  tierName: string;
  subLevel: 3 | 2 | 1; // Progresión de nivel: 3, 2, 1
  rankOrder: number; // 1 to 15
  title: string;
  minPoints: number;
  maxPoints: number;
  description: string;
  badgeIcon: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  earned_points: number;
  new_total_points: number;
  new_level: number;
  sublevel_info?: SubLevelInfo;
  level_up: boolean;
  new_badges: Badge[];
  is_first_completion: boolean;
}

export interface TeacherDashboardStats {
  total_students: number;
  active_students: number;
  published_challenges: number;
  total_completions: number;
  recent_activity: {
    id: string;
    student_alias: string;
    challenge_title: string;
    points: number;
    completed_at: string;
  }[];
}

export interface CompletionRecord {
  id: string;
  user_id: string;
  student_alias: string;
  challenge_id: string;
  challenge_title: string;
  points_awarded: number;
  completed_at: string;
  attempts: number;
}

export interface ProgramBlock {
  id: string;
  type: 'forward' | 'turn_right' | 'turn_left' | 'collect' | 'repeat' | 'repeat_2' | 'repeat_3';
  label: string;
  icon: string;
  color: string;
  iterations?: number; // 1 to 9 for repeat loops
  children?: ProgramBlock[]; // Nested blocks contained within a loop (Scratch C-block)
}
