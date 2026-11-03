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
    ['b_jardin', 'secret_garden_master', 'El Jardín Secreto', 'Resolviste el enigma de los cuatro amigos en el Jardín Secreto.', '🌸', 'lógica'],
    ['b_castillo', 'haunted_castle_junior', 'Castillo Encantado', 'Descifraste el misterio de los personajes de Halloween en el castillo.', '🎃', 'lógica'],
    ['b_lab_halloween', 'halloween_alchemist', 'Laboratorio Secreto', 'Resolviste las operaciones matemáticas y enigmas del laboratorio.', '🧙', 'lógica'],
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

  // Clean up deprecated challenges requested by user
  db.exec(`
    DELETE FROM challenges 
    WHERE title LIKE '%Primeros Pasos%' 
       OR title LIKE '%Laboratorio de Circuitos%' 
       OR title LIKE '%Huerto Tecnológico%' 
       OR title LIKE '%Constelaciones STEAM%'
       OR title LIKE '%Misión Constelaciones%';
  `);

  // Seed SEMIDOKU 02 – EL JARDÍN SECRETO (4x4)
  const jardinChallenge = db.prepare('SELECT id FROM challenges WHERE id = ?').get('c_jardin_02');
  if (!jardinChallenge) {
    const jardinClues = [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];

    // Fila 1 (idx 0), Col 3 (idx 2): Exploradora
    // Fila 2 (idx 1), Col 2 (idx 1): Semillito
    // Fila 3 (idx 2), Col 1 (idx 0): Ayudante (debajo, al sur de Semillito)
    // Fila 4 (idx 3), Col 4 (idx 3): Robot (a la derecha de Semillito)
    const jardinSolution = [
      [null, null, 'exploradora', null],
      [null, 'semillito', null, null],
      ['ayudante', null, null, null],
      [null, null, null, 'robot'],
    ];

    const jardinGuidedClues = [
      {
        step: 1,
        title: 'Pista 1: La fila de Semillito',
        text: 'Semillito está en la fila 2.',
        question: '¿Qué fila debe ocupar Semillito? (Fila 2)',
      },
      {
        step: 2,
        title: 'Pista 2: La fila del Robot',
        text: '🤖 El Robot está en la fila 4. (Semillito y Robot no pueden estar en la misma columna).',
        question: '¿Qué fila queda reservada para el Robot? (Fila 4)',
      },
      {
        step: 3,
        title: 'Pista 3: La columna de la Exploradora',
        text: '🧝 La Exploradora está en la columna 3 (C).',
        question: 'Coloca mentalmente a la Exploradora en algún lugar de la Columna 3.',
      },
      {
        step: 4,
        title: 'Pista 4: El Robot a la derecha',
        text: '🤖 El Robot está a la derecha de Semillito. Recuerda que no pueden compartir fila ni columna.',
        question: 'El Robot debe estar más a la derecha que Semillito. ¿Qué columnas quedan a su derecha?',
      },
      {
        step: 5,
        title: 'Pista 5: Los bordes del jardín',
        text: 'Semillito no está junto al borde izquierdo (Col 1) ni al borde derecho (Col 4).',
        question: 'Como la Exploradora ya ocupa la Columna 3, ¡Semillito debe estar en la Columna 2 (B2)! Y el Robot, situado a su derecha sin compartir columna con la Exploradora, se coloca en la Columna 4 (D4).',
      },
      {
        step: 6,
        title: 'Pista 6: El vuelo del Ayudante',
        text: '🐝 El Ayudante está debajo, al sur, ¡de Semillito!',
        question: 'Si Semillito está en la Fila 2, el Ayudante está al sur (Fila 3) en la columna libre (Columna 1 / A3). La Exploradora se sitúa en Fila 1, Columna 3 (C1).',
      },
    ];

    db.prepare(`
      INSERT INTO challenges (
        id, title, description, type, subtype, category, difficulty, points,
        estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'semidoku', 'character_placement', 'lógica', 'Fácil', 60, 10, 1, 4, 'secret_garden', ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'c_jardin_02',
      '🌸 Semidoku 02: El Jardín Secreto',
      '¡Semillito ha encontrado un jardín secreto con 16 casillas! Entre los cuatro amigos se han enfadado y cada uno necesita encontrar su sitio sin compartir fila ni columna. Lee las 6 pistas en orden para descubrir dónde está cada personaje.',
      JSON.stringify(jardinClues),
      JSON.stringify(jardinSolution),
      JSON.stringify({ guided_clues: jardinGuidedClues })
    );
  }

  // Seed SEMIDOKU 04 (< 9 años) – El misterio del castillo encantado (6x6)
  // Seed SEMIDOKU 04 (< 9 años) – El misterio del castillo encantado (6x6)
  // Gato negro en Fila 2, Columna 4; Murciélago en Fila 4, Columna 1
  const castilloClues = [
    [null, null, null, null, null, null],
    [null, null, null, 'gato_negro', null, null],
    [null, null, null, null, null, null],
    ['murcielago', null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
  ];

  // Fila 1: Semillito en Col 2
  // Fila 2: Fantasma en Col 1 (misma fila gato F2, misma col murciélago C1), Gato negro fijo en Col 4
  // Fila 3: Bruja en Col 5 (dos filas arriba calabaza F5->F3, una col izq C6->C5)
  // Fila 4: Murciélago fijo en Col 1
  // Fila 5: Calabaza en Col 6 (fila inferior murciélago F4->F5, última col C6)
  // Fila 6: Zombi en Col 3 (última fila F6, a la derecha de Semillito C2->C3)
  const castilloSolution = [
    [null, 'semillito', null, null, null, null],
    ['fantasma', null, null, 'gato_negro', null, null],
    [null, null, null, null, 'bruja', null],
    ['murcielago', null, null, null, null, null],
    [null, null, null, null, null, 'calabaza'],
    [null, null, 'zombi', null, null, null],
  ];

  const castilloGuidedClues = [
    {
      step: 1,
      title: 'Pista 1. La llegada de Semillito',
      text: 'Semillito está en la primera fila.',
      question: '¿Qué fila debe ocupar Semillito? (Fila 1)',
    },
    {
      step: 2,
      title: 'Pista 2. El camino de Semillito',
      text: 'Semillito está en la segunda columna.',
      question: '¿En qué casilla exacta se ubica Semillito? (Fila 1, Columna 2)',
    },
    {
      step: 3,
      title: 'Pista 3. El zombi aparece',
      text: '🧟 El Zombi está en la última fila del tablero.',
      question: '¿Cuál es la última fila de un tablero de 6 filas? (Fila 6)',
    },
    {
      step: 4,
      title: 'Pista 4. El zombi busca compañía',
      text: '🧟 El Zombi está en la columna inmediatamente a la derecha de Semillito.',
      question: 'Si Semillito está en la Columna 2, ¿en qué columna se sitúa el Zombi? (Columna 3 -> Fila 6, Columna 3)',
    },
    {
      step: 5,
      title: 'Pista 5. La calabaza se despierta',
      text: '🎃 La Calabaza está en la fila inmediatamente inferior a la del murciélago.',
      question: 'El murciélago está en la Fila 4. ¿En qué fila se despierta la Calabaza? (Fila 5)',
    },
    {
      step: 6,
      title: 'Pista 6. La calabaza busca su rincón',
      text: '🎃 La Calabaza está en la última columna.',
      question: '¿En qué casilla exacta se coloca la Calabaza? (Fila 5, Columna 6)',
    },
    {
      step: 7,
      title: 'Pista 7. La escoba de la bruja',
      text: '🧙 La Bruja está dos filas por encima de la Calabaza y una columna a su izquierda.',
      question: 'Si la Calabaza está en F5, C6, ¿dónde vuela la Bruja? (Fila 3, Columna 5)',
    },
    {
      step: 8,
      title: 'Pista 8. El fantasma del gato',
      text: '👻 El Fantasma está en la misma fila que el gato negro y en la misma columna que el murciélago.',
      question: 'El gato negro está en Fila 2 (C4) y el murciélago en Columna 1 (F4). ¿Dónde se encuentra el Fantasma? (Fila 2, Columna 1)',
    },
  ];

  const existingCastillo = db.prepare('SELECT id FROM challenges WHERE id = ?').get('c_castillo_04');
  if (existingCastillo) {
    db.prepare(`
      UPDATE challenges
      SET description = ?, clues_json = ?, solution_json = ?, config_json = ?, updated_at = datetime('now')
      WHERE id = 'c_castillo_04'
    `).run(
      '¡Semillito ha encontrado un castillo encantado! Dentro viven una bruja, un fantasma, una calabaza y un zombi. El gato negro (Fila 2, Columna 4) y el murciélago (Fila 4, Columna 1) ya están colocados como elementos fijos. Ningún personaje puede compartir fila ni columna con otro.',
      JSON.stringify(castilloClues),
      JSON.stringify(castilloSolution),
      JSON.stringify({ guided_clues: castilloGuidedClues })
    );
  } else {
    db.prepare(`
      INSERT INTO challenges (
        id, title, description, type, subtype, category, difficulty, points,
        estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'semidoku', 'character_placement', 'lógica', 'Medio', 90, 15, 1, 6, 'haunted_castle', ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'c_castillo_04',
      '🎃 Semidoku 04 (< 9 años): El misterio del castillo encantado',
      '¡Semillito ha encontrado un castillo encantado! Dentro viven una bruja, un fantasma, una calabaza y un zombi. El gato negro (Fila 2, Columna 4) y el murciélago (Fila 4, Columna 1) ya están colocados como elementos fijos. Ningún personaje puede compartir fila ni columna con otro.',
      JSON.stringify(castilloClues),
      JSON.stringify(castilloSolution),
      JSON.stringify({ guided_clues: castilloGuidedClues })
    );
  }

  // Seed SEMIDOKU 04 (9+ años) – El laboratorio secreto de Halloween (6x6)
  // Gato negro en Fila 2, Columna 4; Murciélago en Fila 4, Columna 1
  const labClues = [
    [null, null, null, null, null, null],
    [null, null, null, 'gato_negro', null, null],
    [null, null, null, null, null, null],
    ['murcielago', null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
  ];

  // Solution as specified by user:
  // Semillito: Fila 1, Columna 2
  // Bruja: Fila 3, Columna 5
  // Fantasma: Fila 2, Columna 6
  // Calabaza: Fila 5, Columna 3
  // Zombi: Fila 6, Columna 4
  const labSolution = [
    [null, 'semillito', null, null, null, null],
    [null, null, null, 'gato_negro', null, 'fantasma'],
    [null, null, null, null, 'bruja', null],
    ['murcielago', null, null, null, null, null],
    [null, null, 'calabaza', null, null, null],
    [null, null, null, 'zombi', null, null],
  ];

  const labGuidedClues = [
    {
      step: 1,
      title: 'Pista 1. La semilla mágica',
      text: 'Semillito ha encontrado una poción con dos operaciones:\n• Su fila es el resultado de 9 − 8.\n• Su columna es el resultado de 10 ÷ 5.',
      question: 'Calcula 9 − 8 = 1 y 10 ÷ 5 = 2. ¿En qué casilla está Semillito? (Fila 1, Columna 2)',
    },
    {
      step: 2,
      title: 'Pista 2. La escoba de la bruja',
      text: '🧙 La Bruja ha dejado escrito en su libro de hechizos:\n• Su fila es la mitad del número total de filas del tablero (6 ÷ 2).\n• Su columna está dos posiciones a la derecha de su fila.',
      question: 'Fila = 6 ÷ 2 = 3. Columna = 3 + 2 = 5. ¿Dónde se encuentra la Bruja? (Fila 3, Columna 5)',
    },
    {
      step: 3,
      title: 'Pista 3. El fantasma del gato',
      text: '👻 El Fantasma se encuentra en la misma fila que el gato negro (Fila 2).\nAdemás, su columna está inmediatamente a la derecha de la columna de la Bruja.',
      question: 'El gato negro está en Fila 2 (C4). La Bruja está en Columna 5. ¿Cuál es la casilla del Fantasma? (Fila 2, Columna 6)',
    },
    {
      step: 4,
      title: 'Pista 4. La calabaza del murciélago',
      text: '🎃 La Calabaza aparece en la fila inmediatamente inferior a la del murciélago (Fila 4 + 1 = 5).\nPara descubrir su columna, se ubica en la Columna 3.',
      question: '¿En qué casilla debe colocarse la Calabaza? (Fila 5, Columna 3)',
    },
    {
      step: 5,
      title: 'Pista 5. El último hechizo',
      text: '🧟 El Zombi ha dejado dos mensajes:\n• Su fila es el resultado de multiplicar 2 × 3.\n• Su columna es el doble de la columna de Semillito.',
      question: 'Fila = 2 × 3 = 6. Semillito está en Columna 2, luego 2 × 2 = 4. ¿Dónde se ubica el Zombi? (Fila 6, Columna 4)',
    },
  ];

  const existingLab = db.prepare('SELECT id FROM challenges WHERE id = ?').get('c_laboratorio_04_plus');
  if (existingLab) {
    db.prepare(`
      UPDATE challenges
      SET description = ?, clues_json = ?, solution_json = ?, config_json = ?, updated_at = datetime('now')
      WHERE id = 'c_laboratorio_04_plus'
    `).run(
      '¡Algo extraño sucede en el laboratorio secreto de Halloween! Semillito, una bruja, un fantasma, una calabaza y un zombi intentan encontrar sus lugares en un tablero de 6×6 sin compartir fila ni columna. El gato negro (Fila 2, Columna 4) y el murciélago (Fila 4, Columna 1) son elementos fijos. Resuelve las operaciones matemáticas para hallar las posiciones.',
      JSON.stringify(labClues),
      JSON.stringify(labSolution),
      JSON.stringify({ guided_clues: labGuidedClues })
    );
  } else {
    db.prepare(`
      INSERT INTO challenges (
        id, title, description, type, subtype, category, difficulty, points,
        estimated_time_min, is_published, grid_size, symbols_theme, clues_json, solution_json, config_json, created_at, updated_at
      ) VALUES (?, ?, ?, 'semidoku', 'character_placement', 'lógica', 'Avanzado', 110, 20, 1, 6, 'halloween_lab', ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'c_laboratorio_04_plus',
      '🎃 Semidoku 04 (9+ años): El laboratorio secreto de Halloween',
      '¡Algo extraño sucede en el laboratorio secreto de Halloween! Semillito, una bruja, un fantasma, una calabaza y un zombi intentan encontrar sus lugares en un tablero de 6×6 sin compartir fila ni columna. El gato negro (Fila 2, Columna 4) y el murciélago (Fila 4, Columna 1) son elementos fijos. Resuelve las operaciones matemáticas para hallar las posiciones.',
      JSON.stringify(labClues),
      JSON.stringify(labSolution),
      JSON.stringify({ guided_clues: labGuidedClues })
    );
  }
}
