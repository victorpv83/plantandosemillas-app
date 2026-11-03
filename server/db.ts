import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { hashSecret } from './auth';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'steam.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high performance and durability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const migrationPath = path.resolve(process.cwd(), 'migrations', '0001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql);
  }

  // Ensure subtype and config_json columns exist on challenges
  try {
    db.exec("ALTER TABLE challenges ADD COLUMN subtype TEXT DEFAULT 'latin_square'");
  } catch {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE challenges ADD COLUMN config_json TEXT');
  } catch {
    // Column already exists
  }

  // Seed / Expand badges (20+ badges catalog)
  const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO badges (id, code, name, description, icon, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const badges = [
    ['b_mine', 'minecraft_adventurer', 'Aventurero Minecraft', 'Resolviste el enigma de Semillito y sus compañeros en Minecraft.', '⛏️', 'aventura'],
    ['b_deduct', 'deductive_detective', 'Detective Lógico', 'Superaste un reto deduciendo pistas paso a paso sin fallar.', '🔎', 'lógica'],
    ['b_blk1', 'first_code_blocks', 'Primer Algoritmo', 'Programaste con bloques tu primera secuencia de instrucciones.', '🧩', 'programación'],
    ['b_loop', 'loop_master', 'Bucle Perfecto', 'Utilizaste bloques de repetición para optimizar tu código.', '🔁', 'programación'],
    ['b_maze', 'maze_runner', 'Guía Robótico', 'Condujiste a Semillito a través del laberinto evitando obstáculos.', '🤖', 'robótica'],
    ['b1', 'first_challenge', 'Primera Semilla', 'Has completado con éxito tu primer reto STEAM.', '🌱', 'logro'],
    ['b2', 'five_challenges', 'Brote Creativo', 'Has superado 5 retos educativos.', '⚡', 'progreso'],
    ['b3', 'ten_challenges', 'Árbol STEAM', '¡10 retos resueltos como un auténtico inventor!', '🌳', 'maestría'],
    ['b_twenty', 'twenty_challenges', 'Bosque Digital', '¡20 retos resueltos con ingenio y constancia!', '🌲', 'maestría'],
    ['b4', 'first_semidoku', 'Mente Cuadrícula', 'Completaste tu primer juego de lógica Semidoku sin repetir símbolos.', '🎯', 'lógica'],
    ['b5', 'streak_three', 'Racha Imparable (3)', 'Completaste 3 retos seguidos con determinación.', '🔥', 'dedicación'],
    ['b_strk5', 'streak_five', 'Constancia STEAM (5)', 'Has completado 5 retos demostrando gran perseverancia.', '⭐', 'dedicación'],
    ['b6', 'master_5x5', 'Desafío Cósmico 5x5', 'Resolviste una cuadrícula avanzada 5x5 de máxima dificultad.', '🪐', 'experto'],
    ['b_circ', 'circuit_engineer', 'Ingeniero de Circuitos', 'Completaste el reto del Laboratorio de Circuitos Eléctricos.', '💡', 'electrónica'],
    ['b_robo', 'robot_pioneer', 'Pionero de Robótica', 'Organizaste con éxito los componentes del taller robótico.', '⚙️', 'robótica'],
    ['b_appr', 'apprentice_rank', 'Rango Aprendiz Digital', 'Alcanzaste los subniveles de Aprendiz Digital.', '📘', 'rango'],
    ['b_bld', 'builder_rank', 'Rango Constructor de Ideas', 'Alcanzaste los subniveles de Constructor de Ideas.', '🛠️', 'rango'],
    ['b_inv', 'inventor_rank', 'Rango Inventor STEAM', 'Alcanzaste los subniveles de Inventor STEAM.', '🚀', 'rango'],
    ['b_mst', 'master_rank', 'Rango Maestro Tecnológico', '¡Alcanzaste el rango supremo de Maestro Tecnológico!', '👑', 'rango'],
  ];

  for (const b of badges) {
    insertBadge.run(...b);
  }

  // Seed default teacher if not present
  const teacherCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as { count: number };
  if (teacherCount.count === 0) {
    const { hash, salt } = hashSecret('STEAMprofesor2026!');
    db.prepare(`
      INSERT INTO users (id, role, alias, display_name, salt, code_hash, is_active, total_points, current_level, created_at)
      VALUES (?, 'teacher', ?, ?, ?, ?, 1, 0, 15, datetime('now'))
    `).run('t1', 'profesor', 'Profesor STEAM', salt, hash);
  }

  // Seed demo students if not present
  const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };
  if (studentCount.count === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO users (id, role, alias, display_name, salt, code_hash, is_active, total_points, current_level, created_at)
      VALUES (?, 'student', ?, ?, ?, ?, 1, ?, ?, datetime('now'))
    `);

    // Lucas (code: ROBO24) -> 120 pts (Explorador · Nivel 1)
    const s1 = hashSecret('ROBO24');
    insertStudent.run('s1', 'Lucas', 'Lucas M.', s1.salt, s1.hash, 120, 3);

    // Sofia (code: CHIP77) -> 60 pts (Explorador · Nivel 2)
    const s2 = hashSecret('CHIP77');
    insertStudent.run('s2', 'Sofia', 'Sofia R.', s2.salt, s2.hash, 60, 2);

    // Mateo (code: STEAM10) -> 0 pts (Explorador · Nivel 3)
    const s3 = hashSecret('STEAM10');
    insertStudent.run('s3', 'Mateo', 'Mateo B.', s3.salt, s3.hash, 0, 1);
  }

  // Seed/Ensure the MINECRAFT Challenge requested by the user
  const minecraftChallenge = db.prepare('SELECT id FROM challenges WHERE id = ?').get('c_minecraft_03');
  if (!minecraftChallenge) {
    const mcSolution = [
      [null, null, 'steve', null, null],
      [null, null, null, null, 'creeper'],
      [null, 'semillito', null, null, null],
      [null, null, null, 'alex', null],
      ['enderman', null, null, null, null],
    ];

    const mcClues = [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ];

    const mcGuidedClues = [
      {
        step: 1,
        title: 'El punto de partida',
        text: 'Steve aparece en la primera fila, la de más arriba.',
        question: '¿Qué fila debe ocupar Steve? (Fila 1)',
      },
      {
        step: 2,
        title: 'Un Creeper cercano',
        text: 'El Creeper está justo en la fila siguiente a la de Steve.',
        question: '¿En qué fila debe estar el Creeper? (Fila 2)',
      },
      {
        step: 3,
        title: 'El lugar de Semillito',
        text: 'Semillito está en la fila central del tablero.',
        question: '¿Cuál es la fila central de un tablero de cinco filas? (Fila 3)',
      },
      {
        step: 4,
        title: 'Alex sigue el camino',
        text: 'Alex está justo en la fila siguiente a la de Semillito.',
        question: '¿Qué fila queda debajo de la fila central? (Fila 4)',
      },
      {
        step: 5,
        title: 'Aparece una pista importante',
        text: 'Steve está en la columna central del tablero.',
        question: '¿Qué columna es la central? ¿Qué casillas de esa columna quedan descartadas? (Columna 3)',
      },
      {
        step: 6,
        title: 'El Creeper busca su escondite',
        text: 'El Creeper está en la última columna, la más a la derecha.',
        question: '¿Qué columna debe ocupar? (Columna 5)',
      },
      {
        step: 7,
        title: 'Alex descubre el camino',
        text: 'Alex está en la columna inmediatamente a la izquierda de la del Creeper.',
        question: 'Si ya sabes dónde está el Creeper, ¿dónde debe estar Alex? (Columna 4)',
      },
      {
        step: 8,
        title: 'Semillito necesita espacio',
        text: 'Semillito está en una columna situada a la izquierda de la columna de Steve.',
        question: '¿Qué columnas quedan disponibles para Semillito y Enderman? (Columnas 1 y 2)',
      },
      {
        step: 9,
        title: 'La última pieza del mapa',
        text: 'Enderman está en una columna situada a la izquierda de la columna de Semillito.',
        question: '¿Cómo puedes repartir las dos columnas que quedan sin repetir ninguna? (Enderman en Columna 1 y Semillito en Columna 2)',
      },
    ];

    db.prepare(`
      INSERT INTO challenges (
        id, title, description, type, subtype, category, difficulty, points,
        estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'semidoku', 'character_placement', 'lógica', 'Medio', 90, 15, 1, 5, 'minecraft', ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'c_minecraft_03',
      '⛏️ Semidoku 03: ¡La aventura de Semillito en Minecraft!',
      '¡Atención, aventureros! Semillito ha aparecido en un mundo lleno de bloques y criaturas sorprendentes. Reúne a Steve, Creeper, Semillito, Alex y Enderman deduciendo sus posiciones con las 9 pistas ordenadas, ¡sin compartir fila ni columna!',
      JSON.stringify(mcClues),
      JSON.stringify(mcSolution),
      JSON.stringify({ guided_clues: mcGuidedClues })
    );
  }

  // Seed Block Programming Challenges if not present
  const blockChallenge1 = db.prepare('SELECT id FROM challenges WHERE id = ?').get('c_block_01');
  if (!blockChallenge1) {
    const blockMazeConfig1 = {
      gridRows: 5,
      gridCols: 5,
      startPos: { r: 1, c: 0, dir: 'right' },
      goalPos: { r: 1, c: 4 },
      obstacles: [
        { r: 0, c: 2 },
        { r: 2, c: 2 },
        { r: 3, c: 1 },
      ],
      collectibles: [
        { r: 1, c: 2 },
      ],
      maxBlocks: 10,
    };

    db.prepare(`
      INSERT INTO challenges (
        id, title, description, type, subtype, category, difficulty, points,
        estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'blockly_code', 'maze_blocks', 'programación', 'Fácil', 60, 10, 1, 5, 'robotics', '[]', '[]', ?, datetime('now'), datetime('now'))
    `).run(
      'c_block_01',
      '🤖 Bloques 01: El Primer Recorrido de Semillito',
      'Aprende a programar el camino de Semillito utilizando bloques lógicos. Conéctalos en orden para avanzar, recoger la semilla de energía mágica y llegar a la meta esquivando las rocas.',
      JSON.stringify(blockMazeConfig1)
    );
  }

  const blockChallenge2 = db.prepare('SELECT id FROM challenges WHERE id = ?').get('c_block_02');
  if (!blockChallenge2) {
    const blockMazeConfig2 = {
      gridRows: 5,
      gridCols: 5,
      startPos: { r: 0, c: 0, dir: 'right' },
      goalPos: { r: 3, c: 3 },
      obstacles: [
        { r: 0, c: 4 },
        { r: 1, c: 1 },
        { r: 1, c: 2 },
        { r: 2, c: 1 },
      ],
      collectibles: [
        { r: 0, c: 3 },
        { r: 3, c: 3 },
      ],
      maxBlocks: 12,
    };

    db.prepare(`
      INSERT INTO challenges (
        id, title, description, type, subtype, category, difficulty, points,
        estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'blockly_code', 'maze_blocks', 'programación', 'Medio', 80, 15, 1, 5, 'robotics', '[]', '[]', ?, datetime('now'), datetime('now'))
    `).run(
      'c_block_02',
      '⚡ Bloques 02: Giros en Circuito y Bucles',
      'Combina instrucciones de avance con giros a la derecha y a la izquierda. Utiliza bloques de repetición (x2 o x3) para que tu código sea más elegante y eficiente.',
      JSON.stringify(blockMazeConfig2)
    );
  }
}
