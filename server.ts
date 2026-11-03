import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './server/db';
import { hashSecret, verifySecret, generateToken, generateStudentCode } from './server/auth';
import { validateSemidokuSolution, validateBlocklySolution, awardChallengePoints } from './server/challenges';
import { getSubLevelForPoints } from './src/constants/steam';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and run schema migrations
initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

// Rate limit helper for auth endpoints
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && now - record.lastAttempt < 60000 && record.count >= 15) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 1 minuto antes de volver a intentar.' });
  }

  if (!record || now - record.lastAttempt > 60000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    record.count++;
  }
  next();
}

// Session validation middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'teacher';
    alias: string;
    display_name?: string;
    total_points: number;
    current_level: number;
    is_active: number;
  };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.steam_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next();
  }

  const session = db.prepare(`
    SELECT s.user_id, s.role, u.id, u.alias, u.display_name, u.total_points, u.current_level, u.is_active
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any;

  if (session && session.is_active === 1) {
    req.user = {
      id: session.id,
      role: session.role,
      alias: session.alias,
      display_name: session.display_name,
      total_points: session.total_points,
      current_level: session.current_level,
      is_active: session.is_active,
    };
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Acceso no autorizado. Inicia sesión para continuar.' });
  }
  next();
}

function requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de profesor.' });
  }
  next();
}

app.use(authMiddleware);

// --- Auth Routes ---

// Student Login: Alias + Code
app.post('/api/auth/student-login', rateLimit, (req: Request, res: Response) => {
  const { alias, code } = req.body;
  if (!alias || !code) {
    return res.status(400).json({ error: 'Introduce tu alias y tu código personal.' });
  }

  const cleanAlias = String(alias).trim();
  const cleanCode = String(code).trim().toUpperCase();

  const user = db.prepare(`
    SELECT * FROM users WHERE LOWER(alias) = LOWER(?) AND role = 'student'
  `).get(cleanAlias) as any;

  if (!user) {
    return res.status(401).json({ error: 'No se encontró ningún alumno con ese alias. Comprueba que esté bien escrito.' });
  }

  if (user.is_active !== 1) {
    return res.status(403).json({ error: 'Tu cuenta de alumno está desactivada. Consulta con tu profesor.' });
  }

  const isValid = verifySecret(cleanCode, user.code_hash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'El código personal no es correcto. Pide ayuda a tu profesor si lo has olvidado.' });
  }

  // Create session (valid 30 days)
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO sessions (token, user_id, role, expires_at, created_at)
    VALUES (?, ?, 'student', ?, datetime('now'))
  `).run(token, user.id, expiresAt);

  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  res.cookie('steam_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  const subLevel = getSubLevelForPoints(user.total_points);

  return res.json({
    user: {
      id: user.id,
      role: 'student',
      alias: user.alias,
      display_name: user.display_name,
      total_points: user.total_points,
      current_level: subLevel.rankOrder,
      sublevel_info: subLevel,
      is_active: true,
      created_at: user.created_at,
    },
    token,
  });
});

// Teacher Login
app.post('/api/auth/teacher-login', rateLimit, (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Introduce el usuario y contraseña de profesor.' });
  }

  const cleanUser = String(username).trim();
  const teacher = db.prepare(`
    SELECT * FROM users WHERE LOWER(alias) = LOWER(?) AND role = 'teacher'
  `).get(cleanUser) as any;

  if (!teacher) {
    return res.status(401).json({ error: 'Credenciales de profesor incorrectas.' });
  }

  const isValid = verifySecret(String(password).trim(), teacher.code_hash, teacher.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciales de profesor incorrectas.' });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO sessions (token, user_id, role, expires_at, created_at)
    VALUES (?, ?, 'teacher', ?, datetime('now'))
  `).run(token, teacher.id, expiresAt);

  res.cookie('steam_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return res.json({
    user: {
      id: teacher.id,
      role: 'teacher',
      alias: teacher.alias,
      display_name: teacher.display_name,
      total_points: teacher.total_points,
      current_level: 15,
      is_active: true,
      created_at: teacher.created_at,
    },
    token,
  });
});

// Get current session user
app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  const fullUser = db.prepare(`
    SELECT id, role, alias, display_name, total_points, current_level, is_active, created_at, last_login_at
    FROM users WHERE id = ?
  `).get(req.user.id) as any;

  if (!fullUser) {
    return res.json({ user: null });
  }

  let badges: any[] = [];
  let completedCount = 0;

  if (fullUser.role === 'student') {
    badges = db.prepare(`
      SELECT b.id, b.code, b.name, b.description, b.icon, b.category, ub.unlocked_at
      FROM user_badges ub
      JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = ?
      ORDER BY ub.unlocked_at DESC
    `).all(fullUser.id);

    const comp = db.prepare(`
      SELECT COUNT(*) as count FROM completions WHERE user_id = ?
    `).get(fullUser.id) as { count: number };
    completedCount = comp.count;
  }

  const subLevel = getSubLevelForPoints(fullUser.total_points);

  return res.json({
    user: {
      ...fullUser,
      current_level: subLevel.rankOrder,
      sublevel_info: subLevel,
      is_active: Boolean(fullUser.is_active),
      badges,
      completed_challenges_count: completedCount,
    },
  });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies.steam_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.clearCookie('steam_session');
  return res.json({ success: true });
});

// --- Public Badges Catalog ---
app.get('/api/badges', (_req: Request, res: Response) => {
  const allBadges = db.prepare('SELECT * FROM badges ORDER BY category ASC, name ASC').all();
  return res.json(allBadges);
});

// --- Challenges Endpoints (Public & Student) ---

app.get('/api/challenges', (req: AuthRequest, res: Response) => {
  const challenges = db.prepare(`
    SELECT id, title, description, type, subtype, category, difficulty, points,
           estimated_time_min, is_published, grid_size, symbols_theme, clues_json, config_json, created_at, updated_at
    FROM challenges
    WHERE is_published = 1
    ORDER BY type ASC, grid_size ASC, points ASC
  `).all() as any[];

  // If user is a student, attach completion status
  const userCompletions = req.user
    ? (db.prepare(`
        SELECT challenge_id, points_awarded, completed_at
        FROM completions WHERE user_id = ?
      `).all(req.user.id) as any[])
    : [];

  const completionMap = new Map(userCompletions.map((c) => [c.challenge_id, c]));

  const result = challenges.map((c) => {
    const comp = completionMap.get(c.id);
    let parsedConfig: any = {};
    try {
      parsedConfig = c.config_json ? JSON.parse(c.config_json) : {};
    } catch {
      parsedConfig = {};
    }

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type || 'semidoku',
      subtype: c.subtype || 'latin_square',
      category: c.category,
      difficulty: c.difficulty,
      points: c.points,
      estimated_time_min: c.estimated_time_min,
      is_published: Boolean(c.is_published),
      grid_size: c.grid_size,
      symbols_theme: c.symbols_theme,
      clues_grid: c.clues_json ? JSON.parse(c.clues_json) : [],
      guided_clues: parsedConfig.guided_clues,
      block_config: c.type === 'blockly_code' ? parsedConfig : undefined,
      created_at: c.created_at,
      updated_at: c.updated_at,
      is_completed: Boolean(comp),
      completed_at: comp?.completed_at,
      earned_points: comp?.points_awarded,
    };
  });

  return res.json(result);
});

app.get('/api/challenges/:id', (req: AuthRequest, res: Response) => {
  const challenge = db.prepare(`
    SELECT id, title, description, type, subtype, category, difficulty, points,
           estimated_time_min, is_published, grid_size, symbols_theme, clues_json, config_json, created_at, updated_at
    FROM challenges WHERE id = ?
  `).get(req.params.id) as any;

  if (!challenge) {
    return res.status(404).json({ error: 'Reto no encontrado.' });
  }

  let completion = null;
  if (req.user) {
    completion = db.prepare(`
      SELECT points_awarded, completed_at FROM completions
      WHERE user_id = ? AND challenge_id = ?
    `).get(req.user.id, challenge.id) as any;
  }

  let parsedConfig: any = {};
  try {
    parsedConfig = challenge.config_json ? JSON.parse(challenge.config_json) : {};
  } catch {
    parsedConfig = {};
  }

  return res.json({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type || 'semidoku',
    subtype: challenge.subtype || 'latin_square',
    category: challenge.category,
    difficulty: challenge.difficulty,
    points: challenge.points,
    estimated_time_min: challenge.estimated_time_min,
    is_published: Boolean(challenge.is_published),
    grid_size: challenge.grid_size,
    symbols_theme: challenge.symbols_theme,
    clues_grid: challenge.clues_json ? JSON.parse(challenge.clues_json) : [],
    guided_clues: parsedConfig.guided_clues,
    block_config: challenge.type === 'blockly_code' ? parsedConfig : undefined,
    created_at: challenge.created_at,
    updated_at: challenge.updated_at,
    is_completed: Boolean(completion),
    completed_at: completion?.completed_at,
    earned_points: completion?.points_awarded,
  });
});

// Submit Challenge Solution (Authoritative Server Validation)
app.post('/api/challenges/:id/submit', requireAuth, (req: AuthRequest, res: Response) => {
  const challenge = db.prepare(`
    SELECT * FROM challenges WHERE id = ?
  `).get(req.params.id) as any;

  if (!challenge) {
    return res.status(404).json({ error: 'Reto no encontrado.' });
  }

  let validation = { isValid: false, message: '' };

  if (challenge.type === 'blockly_code') {
    const { blocks } = req.body;
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ error: 'Debes enviar una secuencia de bloques para ejecutar.' });
    }
    const config = JSON.parse(challenge.config_json || '{}');
    validation = validateBlocklySolution(blocks, config);
  } else {
    // Semidoku
    const { user_grid } = req.body;
    if (!user_grid) {
      return res.status(400).json({ error: 'No se envió ninguna solución para comprobar.' });
    }
    const cluesGrid = JSON.parse(challenge.clues_json || '[]');
    const solutionGrid = JSON.parse(challenge.solution_json || '[]');
    validation = validateSemidokuSolution(
      user_grid,
      cluesGrid,
      solutionGrid,
      challenge.grid_size,
      challenge.subtype || 'latin_square'
    );
  }

  if (!validation.isValid) {
    return res.json({
      success: false,
      message: validation.message,
    });
  }

  // Solution is valid! Award points and check badges securely
  const result = awardChallengePoints(
    req.user!.id,
    challenge.id,
    challenge.points,
    challenge.type,
    challenge.subtype || 'latin_square',
    challenge.grid_size
  );

  return res.json({
    success: true,
    message: result.message,
    earned_points: result.earnedPoints,
    new_total_points: result.newTotalPoints,
    new_level: result.newLevel,
    sublevel_info: result.sublevelInfo,
    level_up: result.levelUp,
    new_badges: result.newBadges,
    is_first_completion: result.isFirstCompletion,
  });
});

// Student Profile & Activity
app.get('/api/student/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.prepare(`
    SELECT id, alias, display_name, total_points, current_level, created_at
    FROM users WHERE id = ?
  `).get(req.user!.id) as any;

  const badges = db.prepare(`
    SELECT b.id, b.code, b.name, b.description, b.icon, b.category, ub.unlocked_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = ?
    ORDER BY ub.unlocked_at DESC
  `).all(user.id);

  const completions = db.prepare(`
    SELECT c.id, c.challenge_id, ch.title, ch.category, ch.difficulty, ch.type, ch.estimated_time_min, c.points_awarded, c.completed_at
    FROM completions c
    JOIN challenges ch ON ch.id = c.challenge_id
    WHERE c.user_id = ?
    ORDER BY c.completed_at DESC
  `).all(user.id);

  const subLevel = getSubLevelForPoints(user.total_points);

  return res.json({
    user: {
      ...user,
      current_level: subLevel.rankOrder,
      sublevel_info: subLevel,
    },
    badges,
    completions,
  });
});

// --- Teacher Admin Endpoints ---

// Teacher Dashboard KPIs
app.get('/api/teacher/stats', requireTeacher, (req: Request, res: Response) => {
  const totalStudents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as any).count;
  const activeStudents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1").get() as any).count;
  const publishedChallenges = (db.prepare('SELECT COUNT(*) as count FROM challenges WHERE is_published = 1').get() as any).count;
  const totalCompletions = (db.prepare('SELECT COUNT(*) as count FROM completions').get() as any).count;

  const recentActivity = db.prepare(`
    SELECT c.id, u.alias as student_alias, ch.title as challenge_title, c.points_awarded as points, c.completed_at
    FROM completions c
    JOIN users u ON u.id = c.user_id
    JOIN challenges ch ON ch.id = c.challenge_id
    ORDER BY c.completed_at DESC
    LIMIT 8
  `).all();

  return res.json({
    total_students: totalStudents,
    active_students: activeStudents,
    published_challenges: publishedChallenges,
    total_completions: totalCompletions,
    recent_activity: recentActivity,
  });
});

// Teacher Student Management
app.get('/api/teacher/students', requireTeacher, (req: Request, res: Response) => {
  const students = db.prepare(`
    SELECT u.id, u.alias, u.display_name, u.is_active, u.total_points, u.current_level, u.created_at, u.last_login_at,
           (SELECT COUNT(*) FROM completions c WHERE c.user_id = u.id) as completed_challenges_count,
           (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) as badges_count
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.total_points DESC, u.alias ASC
  `).all();

  return res.json(
    students.map((s: any) => ({
      ...s,
      is_active: Boolean(s.is_active),
      sublevel_info: getSubLevelForPoints(s.total_points),
    }))
  );
});

// Create Student
app.post('/api/teacher/students', requireTeacher, (req: Request, res: Response) => {
  const { alias, display_name, code } = req.body;
  if (!alias) {
    return res.status(400).json({ error: 'El alias del alumno es obligatorio.' });
  }

  const cleanAlias = String(alias).trim();
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(alias) = LOWER(?)').get(cleanAlias);
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un alumno o usuario con ese alias.' });
  }

  const personalCode = (code && String(code).trim().toUpperCase()) || generateStudentCode();
  const { hash, salt } = hashSecret(personalCode);
  const id = `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  db.prepare(`
    INSERT INTO users (id, role, alias, display_name, salt, code_hash, is_active, total_points, current_level, created_at)
    VALUES (?, 'student', ?, ?, ?, ?, 1, 0, 1, datetime('now'))
  `).run(id, cleanAlias, display_name ? String(display_name).trim() : cleanAlias, salt, hash);

  return res.json({
    id,
    alias: cleanAlias,
    display_name: display_name || cleanAlias,
    personal_code: personalCode,
    is_active: true,
    total_points: 0,
    current_level: 1,
  });
});

// Update Student (Reset code, activate/deactivate, rename)
app.put('/api/teacher/students/:id', requireTeacher, (req: Request, res: Response) => {
  const { display_name, is_active, new_code } = req.body;
  const student = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'student'").get(req.params.id) as any;

  if (!student) {
    return res.status(404).json({ error: 'Alumno no encontrado.' });
  }

  let generatedCode: string | undefined = undefined;

  if (new_code !== undefined) {
    const codeToSet = String(new_code).trim() ? String(new_code).trim().toUpperCase() : generateStudentCode();
    generatedCode = codeToSet;
    const { hash, salt } = hashSecret(codeToSet);
    db.prepare('UPDATE users SET code_hash = ?, salt = ? WHERE id = ?').run(hash, salt, student.id);
  }

  if (display_name !== undefined) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(String(display_name).trim(), student.id);
  }

  if (is_active !== undefined) {
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, student.id);
  }

  return res.json({
    success: true,
    new_personal_code: generatedCode,
    message: 'Alumno actualizado correctamente.',
  });
});

// Teacher Challenge Management (All challenges with solution)
app.get('/api/teacher/challenges', requireTeacher, (req: Request, res: Response) => {
  const challenges = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM completions comp WHERE comp.challenge_id = c.id) as completions_count
    FROM challenges c
    ORDER BY c.created_at DESC
  `).all() as any[];

  return res.json(
    challenges.map((c) => ({
      ...c,
      is_published: Boolean(c.is_published),
      clues_grid: c.clues_json ? JSON.parse(c.clues_json) : [],
      solution_grid: c.solution_json ? JSON.parse(c.solution_json) : [],
      config: c.config_json ? JSON.parse(c.config_json) : {},
    }))
  );
});

// Teacher Create Challenge
app.post('/api/teacher/challenges', requireTeacher, (req: Request, res: Response) => {
  const {
    title,
    description,
    type,
    subtype,
    category,
    difficulty,
    points,
    estimated_time_min,
    is_published,
    grid_size,
    symbols_theme,
    clues_grid,
    solution_grid,
    config,
    block_config,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Completa el título y descripción del reto.' });
  }

  const id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const challengeType = type || 'semidoku';
  const size = Number(grid_size) || 5;
  const challengeConfig = config || block_config;

  db.prepare(`
    INSERT INTO challenges (
      id, title, description, type, subtype, category, difficulty, points,
      estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id,
    String(title).trim(),
    String(description).trim(),
    challengeType,
    subtype || (challengeType === 'blockly_code' ? 'maze_blocks' : 'latin_square'),
    category || (challengeType === 'blockly_code' ? 'programación' : 'lógica'),
    difficulty || 'Fácil',
    Number(points) || 50,
    Number(estimated_time_min) || 10,
    is_published ? 1 : 0,
    size,
    symbols_theme || (challengeType === 'blockly_code' ? 'robotics' : 'nature_steam'),
    clues_grid ? JSON.stringify(clues_grid) : '[]',
    solution_grid ? JSON.stringify(solution_grid) : '[]',
    challengeConfig ? JSON.stringify(challengeConfig) : null
  );

  return res.json({ id, success: true, message: 'Reto creado con éxito.' });
});

// Teacher Edit Challenge
app.put('/api/teacher/challenges/:id', requireTeacher, (req: Request, res: Response) => {
  const {
    title,
    description,
    category,
    difficulty,
    points,
    estimated_time_min,
    is_published,
    grid_size,
    symbols_theme,
  } = req.body;

  const existing = db.prepare('SELECT id FROM challenges WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Reto no encontrado.' });
  }

  db.prepare(`
    UPDATE challenges
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        difficulty = COALESCE(?, difficulty),
        points = COALESCE(?, points),
        estimated_time_min = COALESCE(?, estimated_time_min),
        is_published = COALESCE(?, is_published),
        grid_size = COALESCE(?, grid_size),
        symbols_theme = COALESCE(?, symbols_theme),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ? String(title).trim() : null,
    description ? String(description).trim() : null,
    category,
    difficulty,
    points !== undefined ? Number(points) : null,
    estimated_time_min !== undefined ? Number(estimated_time_min) : null,
    is_published !== undefined ? (is_published ? 1 : 0) : null,
    grid_size !== undefined ? Number(grid_size) : null,
    symbols_theme,
    req.params.id
  );

  return res.json({ success: true, message: 'Reto actualizado correctamente.' });
});

// Teacher Delete Challenge
app.delete('/api/teacher/challenges/:id', requireTeacher, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM challenges WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Reto no encontrado.' });
  }

  db.prepare('DELETE FROM challenges WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Reto eliminado correctamente.' });
});

// Teacher Badges Management
app.get('/api/teacher/badges', requireTeacher, (_req: Request, res: Response) => {
  const badges = db.prepare('SELECT * FROM badges ORDER BY category ASC, name ASC').all();
  return res.json(badges);
});

app.post('/api/teacher/badges', requireTeacher, (req: Request, res: Response) => {
  const { code, name, description, icon, category } = req.body;
  if (!name || !description || !icon) {
    return res.status(400).json({ error: 'Completa nombre, descripción e icono de la insignia.' });
  }

  const badgeCode = code ? String(code).trim().toLowerCase() : `badge_${Date.now()}`;
  const id = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  db.prepare(`
    INSERT INTO badges (id, code, name, description, icon, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, badgeCode, String(name).trim(), String(description).trim(), String(icon).trim(), category || 'logro');

  return res.json({ success: true, message: 'Insignia creada con éxito.', id, code: badgeCode });
});

app.delete('/api/teacher/badges/:id', requireTeacher, (req: Request, res: Response) => {
  db.prepare('DELETE FROM badges WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Insignia eliminada.' });
});

// Teacher Results & Completions Audit Log
app.get('/api/teacher/completions', requireTeacher, (_req: Request, res: Response) => {
  const completions = db.prepare(`
    SELECT c.id, c.user_id, u.alias as student_alias, c.challenge_id, ch.title as challenge_title,
           c.points_awarded, c.completed_at, c.attempts
    FROM completions c
    JOIN users u ON u.id = c.user_id
    JOIN challenges ch ON ch.id = c.challenge_id
    ORDER BY c.completed_at DESC
  `).all();

  return res.json(completions);
});

// Vite Middleware for development & Static hosting for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STEAM Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
