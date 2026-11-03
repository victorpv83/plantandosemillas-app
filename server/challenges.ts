import { db } from './db';
import { SemidokuGrid, Badge, ProgramBlock, BlockMazeConfig } from '../src/types';
import { getSubLevelForPoints } from '../src/constants/steam';

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// 1. Validator for Semidoku (Latin Square or Character Deductive Placement)
export function validateSemidokuSolution(
  userGrid: SemidokuGrid,
  cluesGrid: SemidokuGrid,
  solutionGrid: SemidokuGrid,
  gridSize: number,
  subtype: string = 'latin_square'
): ValidationResult {
  if (!Array.isArray(userGrid) || userGrid.length !== gridSize) {
    return { isValid: false, message: 'La cuadrícula enviada no tiene las dimensiones correctas.' };
  }

  // --- SUBTYPE: CHARACTER DEDUCTIVE PLACEMENT (e.g. Minecraft 5x5: 5 characters placed, 1 per row & col) ---
  if (subtype === 'character_placement') {
    // Collect all placed characters
    const placedPositions = new Map<string, { r: number; c: number }>();
    const rowCounts = new Array(gridSize).fill(0);
    const colCounts = new Array(gridSize).fill(0);

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const char = userGrid[r]?.[c];
        if (char && char.trim() !== '') {
          if (placedPositions.has(char)) {
            return {
              isValid: false,
              message: `El personaje «${char}» está colocado más de una vez. Cada personaje debe ocupar solo una casilla.`,
            };
          }
          placedPositions.set(char, { r, c });
          rowCounts[r]++;
          colCounts[c]++;
        }
      }
    }

    // Check row uniqueness (at most 1 character per row)
    for (let r = 0; r < gridSize; r++) {
      if (rowCounts[r] > 1) {
        return {
          isValid: false,
          message: `Hay más de un personaje en la Fila ${r + 1}. Ningún personaje puede compartir fila con otro.`,
        };
      }
    }

    // Check col uniqueness (at most 1 character per col)
    for (let c = 0; c < gridSize; c++) {
      if (colCounts[c] > 1) {
        return {
          isValid: false,
          message: `Hay más de un personaje en la Columna ${c + 1}. Ningún personaje puede compartir columna con otro.`,
        };
      }
    }

    // Check that all 5 target characters are placed
    const requiredCharacters = new Set<string>();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const solVal = solutionGrid[r]?.[c];
        if (solVal && solVal.trim() !== '') {
          requiredCharacters.add(solVal);
        }
      }
    }

    for (const req of requiredCharacters) {
      if (!placedPositions.has(req)) {
        return {
          isValid: false,
          message: `Aún no has colocado a «${req}» en el tablero. Debes ubicar a todos los aventureros.`,
        };
      }
    }

    // Check exact solution coordinates matching the sequential clues
    for (const [char, pos] of placedPositions.entries()) {
      const expectedChar = solutionGrid[pos.r]?.[pos.c];
      if (expectedChar !== char) {
        return {
          isValid: false,
          message: `La posición de «${char}» no coincide con las pistas del mapa. Revisa las pistas de fila y columna.`,
        };
      }
    }

    return { isValid: true, message: '¡Fantástico! Has resuelto la aventura deductiva a la perfección.' };
  }

  // --- SUBTYPE: STANDARD LATIN SQUARE SEMIDOKU ---
  // 1. Check all cells are filled
  for (let r = 0; r < gridSize; r++) {
    if (!Array.isArray(userGrid[r]) || userGrid[r].length !== gridSize) {
      return { isValid: false, message: `La fila ${r + 1} no está completa.` };
    }
    for (let c = 0; c < gridSize; c++) {
      const val = userGrid[r][c];
      if (!val || typeof val !== 'string' || val.trim() === '') {
        return { isValid: false, message: 'Faltan casillas por rellenar en el tablero.' };
      }
    }
  }

  // 2. Check original clues were preserved
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const clue = cluesGrid[r]?.[c];
      if (clue !== null && clue !== undefined && userGrid[r][c] !== clue) {
        return { isValid: false, message: 'Una de las pistas fijas fue modificada. ¡Respeta las pistas iniciales!' };
      }
    }
  }

  // 3. Check row uniqueness
  for (let r = 0; r < gridSize; r++) {
    const seen = new Set<string>();
    for (let c = 0; c < gridSize; c++) {
      const item = userGrid[r][c]!;
      if (seen.has(item)) {
        return { isValid: false, message: `Hay elementos repetidos en la fila ${r + 1}. Cada elemento debe aparecer una sola vez por fila.` };
      }
      seen.add(item);
    }
  }

  // 4. Check column uniqueness
  for (let c = 0; c < gridSize; c++) {
    const seen = new Set<string>();
    for (let r = 0; r < gridSize; r++) {
      const item = userGrid[r][c]!;
      if (seen.has(item)) {
        return { isValid: false, message: `Hay elementos repetidos en la columna ${c + 1}. Cada elemento debe aparecer una sola vez por columna.` };
      }
      seen.add(item);
    }
  }

  // 5. Compare with solution
  let exactMatch = true;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (userGrid[r][c] !== solutionGrid[r]?.[c]) {
        exactMatch = false;
        break;
      }
    }
  }

  if (!exactMatch) {
    return { isValid: true, message: '¡Solución válida y bien razonada!' };
  }

  return { isValid: true, message: '¡Solución perfecta!' };
}

// 2. Validator for Block Programming Maze
export function validateBlocklySolution(
  blocks: ProgramBlock[],
  config: BlockMazeConfig
): ValidationResult {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return { isValid: false, message: 'Debes añadir al menos un bloque de programación a tu secuencia.' };
  }

  const { gridRows, gridCols, startPos, goalPos, obstacles, collectibles } = config;

  let currentR = startPos.r;
  let currentC = startPos.c;
  let dir = startPos.dir; // 'up' | 'right' | 'down' | 'left'
  const directions: ('up' | 'right' | 'down' | 'left')[] = ['up', 'right', 'down', 'left'];

  const collected = new Set<string>();
  const neededCollectibles = new Set(collectibles.map((p) => `${p.r},${p.c}`));

  // Helper to recursively unroll nested Scratch-style blocks and repeat loops
  function unrollProgram(programList: ProgramBlock[], depth = 0): ('forward' | 'turn_right' | 'turn_left' | 'collect')[] {
    if (depth > 6) return []; // safety against excessive recursion
    const result: ('forward' | 'turn_right' | 'turn_left' | 'collect')[] = [];
    for (const b of programList) {
      if (b.type === 'repeat') {
        const count = Math.min(9, Math.max(1, Number(b.iterations) || 1));
        const innerCommands = unrollProgram(b.children || [], depth + 1);
        for (let i = 0; i < count; i++) {
          result.push(...innerCommands);
        }
      } else if (b.type === 'repeat_2') {
        result.push('forward', 'forward');
      } else if (b.type === 'repeat_3') {
        result.push('forward', 'forward', 'forward');
      } else if (['forward', 'turn_right', 'turn_left', 'collect'].includes(b.type)) {
        result.push(b.type as any);
      }
    }
    return result;
  }

  const flatCommands = unrollProgram(blocks);

  for (let i = 0; i < flatCommands.length; i++) {
    const cmd = flatCommands[i];

    if (cmd === 'turn_right') {
      const currIdx = directions.indexOf(dir);
      dir = directions[(currIdx + 1) % 4];
    } else if (cmd === 'turn_left') {
      const currIdx = directions.indexOf(dir);
      dir = directions[(currIdx + 3) % 4];
    } else if (cmd === 'forward') {
      if (dir === 'up') currentR--;
      else if (dir === 'right') currentC++;
      else if (dir === 'down') currentR++;
      else if (dir === 'left') currentC--;

      // Boundary check
      if (currentR < 0 || currentR >= gridRows || currentC < 0 || currentC >= gridCols) {
        return {
          isValid: false,
          message: `¡Cuidado! En el paso ${i + 1}, Semillito se salió del tablero. Revisa la dirección de tus giros y avances.`,
        };
      }

      // Obstacle check
      const hitObstacle = obstacles.some((o) => o.r === currentR && o.c === currentC);
      if (hitObstacle) {
        return {
          isValid: false,
          message: `¡Oh no! En el paso ${i + 1}, Semillito chocó contra un obstáculo. Busca una ruta despejada.`,
        };
      }
    } else if (cmd === 'collect') {
      const posKey = `${currentR},${currentC}`;
      if (neededCollectibles.has(posKey)) {
        collected.add(posKey);
      }
    }
  }

  // Check if reached goal
  if (currentR !== goalPos.r || currentC !== goalPos.c) {
    return {
      isValid: false,
      message: `Semillito no ha llegado a la meta final (${goalPos.r + 1}, ${goalPos.c + 1}). Se detuvo en (${currentR + 1}, ${currentC + 1}). ¡Añade o ajusta los pasos necesarios!`,
    };
  }

  // Check if all collectibles were picked up
  if (collected.size < neededCollectibles.size) {
    return {
      isValid: false,
      message: `Semillito llegó a la meta pero olvidó recoger todas las semillas o gemas de energía (${collected.size}/${neededCollectibles.size}). Usa el bloque «Recoger» sobre cada una.`,
    };
  }

  return { isValid: true, message: '¡Algoritmo ejecutado con éxito! Semillito completó el recorrido limpiamente.' };
}

// 3. Point and Badge Transaction with Sublevel recalculation
export function awardChallengePoints(
  userId: string,
  challengeId: string,
  points: number,
  challengeType: string = 'semidoku',
  subtype: string = 'latin_square',
  gridSize: number = 4
) {
  // Check if already completed
  const existing = db.prepare(`
    SELECT id, points_awarded FROM completions
    WHERE user_id = ? AND challenge_id = ?
  `).get(userId, challengeId) as { id: string; points_awarded: number } | undefined;

  const user = db.prepare(`
    SELECT total_points, current_level FROM users WHERE id = ?
  `).get(userId) as { total_points: number; current_level: number };

  const currentSubLevel = getSubLevelForPoints(user.total_points);

  if (existing) {
    return {
      isFirstCompletion: false,
      earnedPoints: 0,
      newTotalPoints: user.total_points,
      newLevel: currentSubLevel.rankOrder,
      sublevelInfo: currentSubLevel,
      levelUp: false,
      newBadges: [],
      message: '¡Excelente trabajo! Has vuelto a resolver el reto correctamente (los puntos ya fueron sumados en tu primera resolución).',
    };
  }

  // First time completing!
  const completionId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newTotal = user.total_points + points;
  const newSubLevel = getSubLevelForPoints(newTotal);
  const levelUp = newSubLevel.rankOrder > currentSubLevel.rankOrder;

  // Execute database transaction
  const tx = db.transaction(() => {
    // Insert completion
    db.prepare(`
      INSERT INTO completions (id, user_id, challenge_id, points_awarded, completed_at, attempts)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(completionId, userId, challengeId, points, now);

    // Insert point transaction
    db.prepare(`
      INSERT INTO point_transactions (id, user_id, challenge_id, amount, reason, created_at)
      VALUES (?, ?, ?, ?, 'Reto completado con éxito', ?)
    `).run(transactionId, userId, challengeId, points, now);

    // Update user points and rank order
    db.prepare(`
      UPDATE users SET total_points = ?, current_level = ? WHERE id = ?
    `).run(newTotal, newSubLevel.rankOrder, userId);

    // Check badges
    const totalCompletions = (db.prepare(`
      SELECT COUNT(*) as count FROM completions WHERE user_id = ?
    `).get(userId) as { count: number }).count;

    const newBadges: Badge[] = [];

    const tryUnlockBadge = (code: string) => {
      const badge = db.prepare('SELECT * FROM badges WHERE code = ?').get(code) as Badge | undefined;
      if (!badge) return;

      const alreadyHas = db.prepare(`
        SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?
      `).get(userId, badge.id);

      if (!alreadyHas) {
        const userBadgeId = `ub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        db.prepare(`
          INSERT INTO user_badges (id, user_id, badge_id, unlocked_at)
          VALUES (?, ?, ?, ?)
        `).run(userBadgeId, userId, badge.id, now);
        newBadges.push({ ...badge, unlocked_at: now });
      }
    };

    // 1. General milestone badges
    if (totalCompletions >= 1) tryUnlockBadge('first_challenge');
    if (totalCompletions >= 3) tryUnlockBadge('streak_three');
    if (totalCompletions >= 5) {
      tryUnlockBadge('five_challenges');
      tryUnlockBadge('streak_five');
    }
    if (totalCompletions >= 10) tryUnlockBadge('ten_challenges');
    if (totalCompletions >= 20) tryUnlockBadge('twenty_challenges');

    // 2. Type specific badges
    if (challengeType === 'semidoku') {
      tryUnlockBadge('first_semidoku');
      if (gridSize === 5) tryUnlockBadge('master_5x5');
      if (challengeId === 'c_minecraft_03' || subtype === 'character_placement') {
        tryUnlockBadge('minecraft_adventurer');
        tryUnlockBadge('deductive_detective');
      }
    } else if (challengeType === 'blockly_code') {
      tryUnlockBadge('first_code_blocks');
      tryUnlockBadge('maze_runner');
      if (challengeId === 'c_block_02') {
        tryUnlockBadge('loop_master');
      }
    }

    // 3. Sublevel / Tier progression badges
    if (newSubLevel.tier === 'aprendiz' || newSubLevel.rankOrder >= 4) tryUnlockBadge('apprentice_rank');
    if (newSubLevel.tier === 'constructor' || newSubLevel.rankOrder >= 7) tryUnlockBadge('builder_rank');
    if (newSubLevel.tier === 'inventor' || newSubLevel.rankOrder >= 10) tryUnlockBadge('inventor_rank');
    if (newSubLevel.tier === 'maestro' || newSubLevel.rankOrder >= 13) tryUnlockBadge('master_rank');

    return newBadges;
  });

  const unlockedBadges = tx();

  return {
    isFirstCompletion: true,
    earnedPoints: points,
    newTotalPoints: newTotal,
    newLevel: newSubLevel.rankOrder,
    sublevelInfo: newSubLevel,
    levelUp,
    newBadges: unlockedBadges,
    message: `¡Enhorabuena! Has resuelto el reto con éxito y has ganado +${points} puntos STEAM.`,
  };
}
