-- Plantando Semillas STEAM - Schema D1 (SQLite)
-- Migración 0001: Esquema inicial para usuarios, retos, insignias y progreso

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
  alias TEXT NOT NULL UNIQUE,
  display_name TEXT,
  salt TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'semidoku',
  category TEXT NOT NULL CHECK(category IN ('robótica', 'programación', 'lógica', 'electrónica', 'steam')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('Fácil', 'Medio', 'Avanzado')),
  points INTEGER NOT NULL,
  estimated_time_min INTEGER NOT NULL DEFAULT 10,
  is_published INTEGER NOT NULL DEFAULT 1,
  grid_size INTEGER NOT NULL DEFAULT 4,
  symbols_theme TEXT NOT NULL DEFAULT 'robotics',
  clues_json TEXT NOT NULL,
  solution_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT REFERENCES challenges(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_users_alias ON users(alias);
CREATE INDEX IF NOT EXISTS idx_challenges_published ON challenges(is_published);
CREATE INDEX IF NOT EXISTS idx_completions_user ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_challenge ON completions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
