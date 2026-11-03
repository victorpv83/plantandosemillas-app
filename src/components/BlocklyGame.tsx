import React, { useState } from 'react';
import { Challenge, ProgramBlock, SubmissionResponse } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import { OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Play,
  CheckCircle2,
  Trash2,
  HelpCircle,
  AlertCircle,
  Trophy,
  Award,
  GripVertical,
  Plus,
  Repeat,
} from 'lucide-react';

interface BlocklyGameProps {
  challenge: Challenge;
  isStudentLoggedIn: boolean;
  onBack: () => void;
  onChallengeCompleted: (result: SubmissionResponse) => void;
  onOpenLogin: () => void;
}

interface ExecutableStep {
  cmd: 'forward' | 'turn_right' | 'turn_left' | 'collect';
  blockId: string;
  parentLoopId?: string;
  loopIteration?: number;
  loopTotal?: number;
}

export const BlocklyGame: React.FC<BlocklyGameProps> = ({
  challenge,
  isStudentLoggedIn,
  onBack,
  onChallengeCompleted,
  onOpenLogin,
}) => {
  const config = challenge.block_config || {
    gridRows: 5,
    gridCols: 5,
    startPos: { r: 1, c: 0, dir: 'right' as const },
    goalPos: { r: 1, c: 4 },
    obstacles: [{ r: 0, c: 2 }, { r: 2, c: 2 }],
    collectibles: [{ r: 1, c: 2 }],
  };

  const [program, setProgram] = useState<ProgramBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [agentPos, setAgentPos] = useState<{ r: number; c: number; dir: 'up' | 'right' | 'down' | 'left' }>(
    config.startPos
  );
  const [collectedItems, setCollectedItems] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [victoryData, setVictoryData] = useState<SubmissionResponse | null>(null);

  // Drag and Drop sequence state
  const [isDragOverSequence, setIsDragOverSequence] = useState<boolean>(false);
  const [dragOverRootIndex, setDragOverRootIndex] = useState<number | null>(null);
  const [dragOverLoopId, setDragOverLoopId] = useState<string | null>(null);

  // Scratch-style available blocks
  // Turn blocks simplified to "Girar derecha" and "Girar izquierda" with a single symbol (↷ and ↶)
  const availableBlocks: Omit<ProgramBlock, 'id'>[] = [
    {
      type: 'forward',
      label: 'Avanzar',
      icon: '⬆️',
      color: 'bg-sky-600 hover:bg-sky-700 text-white',
    },
    {
      type: 'turn_right',
      label: 'Girar derecha',
      icon: '↷',
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      type: 'turn_left',
      label: 'Girar izquierda',
      icon: '↶',
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      type: 'collect',
      label: 'Recoger',
      icon: '💎',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      type: 'repeat',
      label: 'Repetir',
      icon: '🔁',
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
      iterations: 2,
      children: [],
    },
  ];

  // Helper to create a new unique ProgramBlock
  const createNewBlock = (template: Omit<ProgramBlock, 'id'>): ProgramBlock => {
    return {
      ...template,
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      iterations: template.type === 'repeat' ? template.iterations || 2 : undefined,
      children: template.type === 'repeat' ? [] : undefined,
    };
  };

  // Add block to root sequence
  const handleAddBlockToRoot = (template: Omit<ProgramBlock, 'id'>, atIndex?: number) => {
    if (isRunning) return;
    sounds.playClick(520);
    const newBlock = createNewBlock(template);
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= program.length) {
      const next = [...program];
      next.splice(atIndex, 0, newBlock);
      setProgram(next);
    } else {
      setProgram([...program, newBlock]);
    }
    setErrorMessage(null);
  };

  // Add a block inside a Repeat container's children
  const handleAddBlockInsideLoop = (loopId: string, template: Omit<ProgramBlock, 'id'>) => {
    if (isRunning) return;
    sounds.playClick(560);
    const newChild = createNewBlock(template);
    setProgram((prev) =>
      prev.map((b) => {
        if (b.id === loopId && b.type === 'repeat') {
          return {
            ...b,
            children: [...(b.children || []), newChild],
          };
        }
        return b;
      })
    );
    setErrorMessage(null);
  };

  // Update repeat iterations (clamped 1 to 9)
  const handleUpdateIterations = (loopId: string, count: number) => {
    if (isRunning) return;
    sounds.playClick(440);
    const clamped = Math.min(9, Math.max(1, Math.round(count)));
    setProgram((prev) =>
      prev.map((b) => {
        if (b.id === loopId && b.type === 'repeat') {
          return { ...b, iterations: clamped };
        }
        return b;
      })
    );
  };

  // Remove a block from root sequence
  const handleRemoveRootBlock = (blockId: string) => {
    if (isRunning) return;
    sounds.playClick(380);
    setProgram((prev) => prev.filter((b) => b.id !== blockId));
  };

  // Remove a child block from inside a repeat loop
  const handleRemoveChildBlock = (loopId: string, childId: string) => {
    if (isRunning) return;
    sounds.playClick(380);
    setProgram((prev) =>
      prev.map((b) => {
        if (b.id === loopId && b.type === 'repeat') {
          return {
            ...b,
            children: (b.children || []).filter((c) => c.id !== childId),
          };
        }
        return b;
      })
    );
  };

  // Drag and drop handlers for Root Sequence
  const handleDropOnRootSequence = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverSequence(false);
    const targetIdx = dragOverRootIndex;
    setDragOverRootIndex(null);

    if (isRunning) return;

    // Check if reordering an existing root block
    const reorderRootIdxStr = e.dataTransfer.getData('application/steam-block-reorder-root-idx');
    if (reorderRootIdxStr !== '') {
      const fromIdx = parseInt(reorderRootIdxStr, 10);
      if (!isNaN(fromIdx) && fromIdx >= 0 && fromIdx < program.length) {
        sounds.playClick(480);
        const next = [...program];
        const [moved] = next.splice(fromIdx, 1);
        const insertAt = targetIdx !== null ? (targetIdx > fromIdx ? targetIdx - 1 : targetIdx) : next.length;
        next.splice(Math.max(0, Math.min(next.length, insertAt)), 0, moved);
        setProgram(next);
        return;
      }
    }

    // Check if dragging out a child from inside a loop into root
    const sourceLoopId = e.dataTransfer.getData('application/steam-child-parent-id');
    const childId = e.dataTransfer.getData('application/steam-child-id');
    if (sourceLoopId && childId) {
      let movedChild: ProgramBlock | null = null;
      setProgram((prev) => {
        const next = prev.map((b) => {
          if (b.id === sourceLoopId && b.type === 'repeat') {
            const childList = b.children || [];
            const found = childList.find((c) => c.id === childId);
            if (found) movedChild = found;
            return {
              ...b,
              children: childList.filter((c) => c.id !== childId),
            };
          }
          return b;
        });

        if (movedChild) {
          sounds.playClick(480);
          const insertAt = targetIdx !== null ? targetIdx : next.length;
          next.splice(insertAt, 0, movedChild);
        }
        return next;
      });
      return;
    }

    // Check if dropping a brand new block from palette
    const blockType = e.dataTransfer.getData('application/steam-block-type') || e.dataTransfer.getData('text/plain');
    if (!blockType) return;

    const blockTemplate = availableBlocks.find((b) => b.type === blockType);
    if (blockTemplate) {
      handleAddBlockToRoot(blockTemplate, targetIdx !== null ? targetIdx : undefined);
    }
  };

  // Drag and drop handlers for inside Repeat Loop Mouth
  const handleDropInsideLoopMouth = (e: React.DragEvent, loopId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLoopId(null);

    if (isRunning) return;

    // Check if moving a block from root into this loop
    const reorderRootIdxStr = e.dataTransfer.getData('application/steam-block-reorder-root-idx');
    if (reorderRootIdxStr !== '') {
      const fromIdx = parseInt(reorderRootIdxStr, 10);
      if (!isNaN(fromIdx) && fromIdx >= 0 && fromIdx < program.length) {
        // Can't put a repeat block inside itself
        const candidate = program[fromIdx];
        if (candidate.id === loopId) return;

        sounds.playClick(500);
        const next = [...program];
        const [moved] = next.splice(fromIdx, 1);
        setProgram(
          next.map((b) => {
            if (b.id === loopId && b.type === 'repeat') {
              return {
                ...b,
                children: [...(b.children || []), moved],
              };
            }
            return b;
          })
        );
        return;
      }
    }

    // Check if dropping from palette
    const blockType = e.dataTransfer.getData('application/steam-block-type') || e.dataTransfer.getData('text/plain');
    if (blockType) {
      const blockTemplate = availableBlocks.find((b) => b.type === blockType);
      if (blockTemplate) {
        handleAddBlockInsideLoop(loopId, blockTemplate);
      }
    }
  };

  const handleClearProgram = () => {
    if (isRunning) return;
    sounds.playClick(320);
    setProgram([]);
    setAgentPos(config.startPos);
    setCollectedItems([]);
    setActiveBlockId(null);
    setActiveLoopId(null);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  // Build sequential execution plan supporting nested Scratch-style loops
  const buildExecutionPlan = (
    blocks: ProgramBlock[],
    parentLoopId?: string,
    depth = 0
  ): ExecutableStep[] => {
    if (depth > 6) return [];
    const steps: ExecutableStep[] = [];

    for (const b of blocks) {
      if (b.type === 'repeat') {
        const count = Math.min(9, Math.max(1, Number(b.iterations) || 2));
        const children = b.children || [];
        for (let iter = 1; iter <= count; iter++) {
          const innerSteps = buildExecutionPlan(children, b.id, depth + 1);
          for (const step of innerSteps) {
            steps.push({
              ...step,
              parentLoopId: b.id,
              loopIteration: iter,
              loopTotal: count,
            });
          }
        }
      } else if (b.type === 'repeat_2') {
        steps.push(
          { cmd: 'forward', blockId: b.id, parentLoopId },
          { cmd: 'forward', blockId: b.id, parentLoopId }
        );
      } else if (b.type === 'repeat_3') {
        steps.push(
          { cmd: 'forward', blockId: b.id, parentLoopId },
          { cmd: 'forward', blockId: b.id, parentLoopId },
          { cmd: 'forward', blockId: b.id, parentLoopId }
        );
      } else if (['forward', 'turn_right', 'turn_left', 'collect'].includes(b.type)) {
        steps.push({
          cmd: b.type as any,
          blockId: b.id,
          parentLoopId,
        });
      }
    }
    return steps;
  };

  // Run simulation locally
  const runSimulation = async () => {
    if (program.length === 0 || isRunning) return;

    const executionPlan = buildExecutionPlan(program);
    if (executionPlan.length === 0) {
      setErrorMessage('Los bucles o la secuencia no contienen instrucciones para ejecutar. ¡Añade bloques dentro!');
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setStatusMessage('Ejecutando algoritmo...');
    setAgentPos(config.startPos);
    setCollectedItems([]);

    const directions: ('up' | 'right' | 'down' | 'left')[] = ['up', 'right', 'down', 'left'];
    let currentR = config.startPos.r;
    let currentC = config.startPos.c;
    let currentDir = config.startPos.dir;
    const collected: string[] = [];

    for (let i = 0; i < executionPlan.length; i++) {
      const step = executionPlan[i];
      setActiveBlockId(step.blockId);
      setActiveLoopId(step.parentLoopId || null);

      if (step.parentLoopId && step.loopIteration && step.loopTotal) {
        setStatusMessage(
          `Bucle: repetición ${step.loopIteration} de ${step.loopTotal} (${step.cmd === 'forward' ? 'Avanzar' : step.cmd === 'turn_right' ? 'Girar derecha' : step.cmd === 'turn_left' ? 'Girar izquierda' : 'Recoger'})`
        );
      } else {
        setStatusMessage(
          `Paso ${i + 1} de ${executionPlan.length}: ${step.cmd === 'forward' ? 'Avanzar' : step.cmd === 'turn_right' ? 'Girar derecha' : step.cmd === 'turn_left' ? 'Girar izquierda' : 'Recoger'}`
        );
      }

      sounds.playClick(440 + (i % 6) * 25);
      await new Promise((resolve) => setTimeout(resolve, 450));

      if (step.cmd === 'turn_right') {
        const currIdx = directions.indexOf(currentDir);
        currentDir = directions[(currIdx + 1) % 4];
        setAgentPos({ r: currentR, c: currentC, dir: currentDir });
      } else if (step.cmd === 'turn_left') {
        const currIdx = directions.indexOf(currentDir);
        currentDir = directions[(currIdx + 3) % 4];
        setAgentPos({ r: currentR, c: currentC, dir: currentDir });
      } else if (step.cmd === 'forward') {
        if (currentDir === 'up') currentR--;
        else if (currentDir === 'right') currentC++;
        else if (currentDir === 'down') currentR++;
        else if (currentDir === 'left') currentC--;

        // Bounds check
        if (currentR < 0 || currentR >= config.gridRows || currentC < 0 || currentC >= config.gridCols) {
          sounds.playConflict();
          setErrorMessage('¡Semillito se salió del tablero! Revisa los giros y pasos.');
          setIsRunning(false);
          setActiveBlockId(null);
          setActiveLoopId(null);
          return;
        }

        // Obstacle check
        const hit = config.obstacles.some((o) => o.r === currentR && o.c === currentC);
        if (hit) {
          sounds.playConflict();
          setErrorMessage('¡Semillito chocó contra un obstáculo (roca)!');
          setIsRunning(false);
          setActiveBlockId(null);
          setActiveLoopId(null);
          return;
        }

        setAgentPos({ r: currentR, c: currentC, dir: currentDir });
      } else if (step.cmd === 'collect') {
        const key = `${currentR},${currentC}`;
        if (config.collectibles.some((c) => c.r === currentR && c.c === currentC) && !collected.includes(key)) {
          collected.push(key);
          setCollectedItems([...collected]);
          sounds.playClick(750);
        }
      }
    }

    setActiveBlockId(null);
    setActiveLoopId(null);
    setIsRunning(false);

    // Evaluate success
    if (currentR === config.goalPos.r && currentC === config.goalPos.c) {
      if (collected.length >= config.collectibles.length) {
        sounds.playVictory();
        setStatusMessage('¡Excelente! El recorrido llegó a la meta con todos los objetos.');
      } else {
        setErrorMessage('Llegaste a la meta, pero te faltó recoger gemas en el camino.');
      }
    } else {
      setErrorMessage(`Semillito se detuvo en (${currentR + 1}, ${currentC + 1}) antes de llegar a la meta.`);
    }
  };

  // Submit blocks to server for authoritative validation
  const handleSubmitSolution = async () => {
    if (!isStudentLoggedIn) {
      onOpenLogin();
      return;
    }

    if (program.length === 0) {
      setErrorMessage('Añade bloques a tu programa antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await api.submitBlocklyChallenge(challenge.id, program);
      if (!response.success) {
        sounds.playConflict();
        setErrorMessage(response.message);
      } else {
        sounds.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#6366F1', '#F59E0B', '#3B82F6'],
        });
        setVictoryData(response);
        onChallengeCompleted(response);
      }
    } catch (err: any) {
      sounds.playConflict();
      setErrorMessage(err.message || 'Error al validar el programa en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a retos
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearProgram}
            disabled={isRunning}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar tablero
          </button>
        </div>
      </div>

      {/* Challenge Title Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span className="capitalize font-semibold text-indigo-700">Programación por Bloques</span>
          <span aria-hidden="true">·</span>
          <span>Dificultad {challenge.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span className="font-bold text-emerald-600 tabular-nums">+{challenge.points} puntos</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          {challenge.title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          {challenge.description}
        </p>

        <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <strong>Estilo Scratch:</strong> Puedes usar bucles <strong>«repetir [1-9] veces»</strong> que contienen dentro las acciones que quieres ejecutar. Haz clic o arrastra los bloques a la secuencia. Pulsa <strong>«▶️ Probar Algoritmo»</strong> para ver la animación y <strong>«Comprobar y Enviar Reto»</strong> para conseguir tus puntos.
          </span>
        </div>
      </div>

      {/* Error or Alert banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center gap-3 animate-pop-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {statusMessage && !errorMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-3 animate-pop-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{statusMessage}</div>
        </div>
      )}

      {/* Game Sandbox: 3 Columns (Blocks Palette, Interactive Map, Program Sequence) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Col 1: Blocks Palette */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Bloques de Código
          </div>
          <div className="text-[11px] text-slate-500 mb-3">
            Haz clic para añadir o arrastra a la secuencia:
          </div>
          <div className="space-y-2">
            {availableBlocks.map((b) => (
              <button
                key={b.type}
                type="button"
                draggable={!isRunning}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/steam-block-type', b.type);
                  e.dataTransfer.setData('text/plain', b.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => handleAddBlockToRoot(b)}
                disabled={isRunning}
                className={`w-full p-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-grab active:cursor-grabbing shadow-2xs hover:scale-102 ${b.color} disabled:opacity-50`}
                title="Haz clic o arrastra a la secuencia"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  <span className="text-base select-none">{b.icon}</span>
                  <span className="select-none">{b.label}</span>
                </div>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono select-none">+</span>
              </button>
            ))}
          </div>

          <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
            💡 <strong>Consejo:</strong> En los bloques de repetición estilo Scratch, puedes colocar acciones dentro de la boca del bucle y cambiar el número de repeticiones de 1 a 9.
          </div>
        </div>

        {/* Col 2: Grid Stage with Semillito */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-900 rounded-3xl p-5 border-4 border-slate-800 shadow-lg">
          <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            Escenario de Navegación
          </div>

          <div
            className="grid gap-2 select-none"
            style={{
              gridTemplateColumns: `repeat(${config.gridCols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: config.gridRows }).map((_, r) =>
              Array.from({ length: config.gridCols }).map((__, c) => {
                const isAgent = agentPos.r === r && agentPos.c === c;
                const isGoal = config.goalPos.r === r && config.goalPos.c === c;
                const isObstacle = config.obstacles.some((o) => o.r === r && o.c === c);
                const hasCollectible =
                  config.collectibles.some((co) => co.r === r && co.c === c) &&
                  !collectedItems.includes(`${r},${c}`);

                const dirAngle = {
                  right: 'rotate-0',
                  down: 'rotate-90',
                  left: 'rotate-180',
                  up: '-rotate-90',
                }[agentPos.dir];

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative font-bold text-lg border transition-all ${
                      isObstacle
                        ? 'bg-slate-800 border-slate-700 text-slate-500'
                        : isGoal
                        ? 'bg-amber-950/40 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    {isObstacle && <span className="text-2xl select-none">🪨</span>}

                    {isGoal && !isAgent && (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl animate-pulse">🏁</span>
                        <span className="text-[9px] text-amber-300 font-bold">META</span>
                      </div>
                    )}

                    {hasCollectible && !isAgent && (
                      <span className="text-2xl animate-bounce select-none">💎</span>
                    )}

                    {isAgent && (
                      <div className="relative w-11 h-11 rounded-xl bg-emerald-500/30 border border-emerald-400 p-1 flex items-center justify-center">
                        <img
                          src={OFFICIAL_SEMILLITO_IMAGE}
                          alt="Semillito"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className={`absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-amber-950 text-[10px] rounded-full flex items-center justify-center font-black transition-transform ${dirAngle}`}
                          title={`Mirando hacia ${agentPos.dir}`}
                        >
                          ➤
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Semillito
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">🪨</span> Roca
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">💎</span> Gema ({collectedItems.length}/{config.collectibles.length})
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">🏁</span> Meta
            </span>
          </div>
        </div>

        {/* Col 3: Program Sequence Workspace (Scratch Style) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOverSequence(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDragOverSequence(false);
              setDragOverRootIndex(null);
            }
          }}
          onDrop={handleDropOnRootSequence}
          className={`lg:col-span-4 bg-white border rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[420px] transition-all duration-200 ${
            isDragOverSequence
              ? 'border-emerald-500 ring-4 ring-emerald-300/40 bg-emerald-50/40'
              : 'border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Tu Algoritmo</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full">
                  {program.length} {program.length === 1 ? 'bloque' : 'bloques'}
                </span>
              </span>
              {program.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearProgram}
                  disabled={isRunning}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {program.length === 0 ? (
              <div
                className={`p-6 text-center border-2 border-dashed rounded-2xl text-xs transition-colors ${
                  isDragOverSequence
                    ? 'border-emerald-500 bg-emerald-100/60 text-emerald-800 font-bold scale-102'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                {isDragOverSequence ? (
                  <span>¡Suelta aquí el bloque para añadirlo a la secuencia!</span>
                ) : (
                  <span>Arrastra bloques aquí o haz clic en los de la izquierda para construir el recorrido de Semillito.</span>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {program.map((block, rootIdx) => {
                  const isCurrentActive = activeBlockId === block.id;
                  const isHoveredTarget = dragOverRootIndex === rootIdx;

                  // Render Scratch-Style Repeat C-Block
                  if (block.type === 'repeat') {
                    const isLoopActive = activeLoopId === block.id;
                    const children = block.children || [];
                    const isMouthTarget = dragOverLoopId === block.id;

                    return (
                      <div
                        key={block.id}
                        className={`rounded-2xl transition-all ${
                          isLoopActive
                            ? 'ring-4 ring-amber-400 shadow-md scale-101'
                            : isHoveredTarget
                            ? 'ring-2 ring-emerald-500 shadow-sm'
                            : ''
                        }`}
                      >
                        {/* Repeat Header (Scratch Amber Top) */}
                        <div
                          draggable={!isRunning}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/steam-block-reorder-root-idx', String(rootIdx));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverRootIndex(rootIdx);
                          }}
                          className="bg-amber-500 text-white rounded-t-xl px-3 py-2 flex items-center justify-between text-xs font-bold cursor-grab active:cursor-grabbing shadow-xs select-none"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 opacity-70 shrink-0" />
                            <Repeat className="w-4 h-4 shrink-0" />
                            <span>repetir</span>
                            {/* Number selector 1 to 9 */}
                            <select
                              value={block.iterations || 2}
                              onChange={(e) => handleUpdateIterations(block.id, parseInt(e.target.value, 10))}
                              disabled={isRunning}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white text-slate-900 font-extrabold text-xs px-2 py-0.5 rounded-lg border border-amber-600 cursor-pointer shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-300"
                              title="Elige cuántas veces se repite el bucle (1 a 9)"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                            <span>veces</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRootBlock(block.id)}
                            disabled={isRunning}
                            className="text-white/80 hover:text-white hover:bg-amber-600 p-1 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar bucle completo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Repeat Mouth (C-shape inner container) */}
                        <div className="flex">
                          {/* Left Spine of the C-bracket */}
                          <div className="w-4.5 bg-amber-500 shrink-0 flex flex-col items-center justify-center">
                            <div className="w-1.5 h-full bg-amber-600/30 rounded-full" />
                          </div>

                          {/* Inner Body Dropzone */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverLoopId(block.id);
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setDragOverLoopId(null);
                              }
                            }}
                            onDrop={(e) => handleDropInsideLoopMouth(e, block.id)}
                            className={`flex-1 p-2 bg-amber-50/80 border-r-2 border-b border-dashed transition-all min-h-[56px] ${
                              isMouthTarget
                                ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-400'
                                : 'border-amber-300'
                            }`}
                          >
                            {children.length === 0 ? (
                              <div className="text-center py-2 text-[11px] text-amber-800 font-medium">
                                <div className="mb-1.5">
                                  {isMouthTarget
                                    ? '¡Suelta la acción aquí dentro!'
                                    : 'Arrastra o añade acciones dentro del bucle:'}
                                </div>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {availableBlocks
                                    .filter((ab) => ab.type !== 'repeat')
                                    .map((ab) => (
                                      <button
                                        key={ab.type}
                                        type="button"
                                        onClick={() => handleAddBlockInsideLoop(block.id, ab)}
                                        disabled={isRunning}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      >
                                        <span>{ab.icon}</span>
                                        <span>+ {ab.label}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {children.map((child) => {
                                  const isChildActive = activeBlockId === child.id;
                                  return (
                                    <div
                                      key={child.id}
                                      draggable={!isRunning}
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('application/steam-child-parent-id', block.id);
                                        e.dataTransfer.setData('application/steam-child-id', child.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                      }}
                                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all select-none ${
                                        isChildActive
                                          ? 'ring-2 ring-emerald-500 bg-emerald-200 text-emerald-950 scale-102'
                                          : child.type === 'forward'
                                          ? 'bg-sky-500 text-white shadow-2xs'
                                          : child.type === 'turn_right' || child.type === 'turn_left'
                                          ? 'bg-blue-600 text-white shadow-2xs'
                                          : 'bg-emerald-600 text-white shadow-2xs'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <GripVertical className="w-3 h-3 opacity-70 shrink-0 cursor-grab" />
                                        <span className="text-sm">{child.icon}</span>
                                        <span>{child.label}</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveChildBlock(block.id, child.id)}
                                        disabled={isRunning}
                                        className="text-white/80 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
                                        title="Eliminar del bucle"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}

                                {/* Quick button to add another command inside loop */}
                                <div className="pt-1 flex items-center gap-1 overflow-x-auto">
                                  <span className="text-[10px] text-amber-800 font-semibold shrink-0">Añadir:</span>
                                  {availableBlocks
                                    .filter((ab) => ab.type !== 'repeat')
                                    .map((ab) => (
                                      <button
                                        key={ab.type}
                                        type="button"
                                        onClick={() => handleAddBlockInsideLoop(block.id, ab)}
                                        disabled={isRunning}
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                                        title={`Añadir ${ab.label} al bucle`}
                                      >
                                        <span>{ab.icon}</span>
                                        <Plus className="w-2.5 h-2.5" />
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Repeat Bottom Bar (C-bracket closure) */}
                        <div className="h-3.5 bg-amber-500 rounded-b-xl w-full flex items-center px-3">
                          <div className="w-8 h-1 bg-amber-600/40 rounded-full" />
                        </div>
                      </div>
                    );
                  }

                  // Render Standard Block (Avanzar, Girar derecha, Girar izquierda, Recoger)
                  return (
                    <div
                      key={block.id}
                      draggable={!isRunning}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/steam-block-reorder-root-idx', String(rootIdx));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverRootIndex(rootIdx);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-grab active:cursor-grabbing select-none ${
                        isCurrentActive
                          ? 'ring-3 ring-emerald-500 scale-102 bg-emerald-100 text-emerald-950 shadow-md'
                          : isHoveredTarget
                          ? 'border-2 border-emerald-500 bg-emerald-50 text-slate-900 shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                          {rootIdx + 1}
                        </span>
                        <span className="text-base select-none">{block.icon}</span>
                        <span className="select-none">{block.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRootBlock(block.id)}
                        disabled={isRunning}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Eliminar bloque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {isDragOverSequence && dragOverRootIndex === null && (
                  <div className="p-2 border-2 border-dashed border-emerald-400 bg-emerald-50/60 rounded-xl text-center text-xs text-emerald-700 font-bold animate-pulse">
                    + Soltar al final del algoritmo
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={runSimulation}
              disabled={program.length === 0 || isRunning}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Ejecutando...' : '▶️ Probar Algoritmo'}</span>
            </button>

            {isStudentLoggedIn ? (
              <button
                type="button"
                onClick={handleSubmitSolution}
                disabled={program.length === 0 || isSubmitting || isRunning}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Comprobar y Enviar Reto</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Inicia sesión para guardar puntos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {victoryData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-emerald-400 animate-pop-in relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg mb-4">
              <Trophy className="w-10 h-10 text-amber-300" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
              ¡Reto de Programación Superado!
            </h3>
            <p className="text-sm text-slate-600 mb-5">{victoryData.message}</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5">
              <div className="flex justify-around items-center">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Puntos Ganados</div>
                  <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                    +{victoryData.earned_points}
                  </div>
                </div>
                <div className="w-px h-8 bg-emerald-200" />
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Total Puntos</div>
                  <div className="text-2xl font-extrabold text-slate-800 tabular-nums">
                    {victoryData.new_total_points}
                  </div>
                </div>
              </div>

              {victoryData.sublevel_info && (
                <div className="mt-3 pt-3 border-t border-emerald-200 text-xs font-bold text-emerald-800">
                  {victoryData.sublevel_info.title}
                </div>
              )}
            </div>

            {victoryData.new_badges && victoryData.new_badges.length > 0 && (
              <div className="mb-5 text-left">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ¡Nuevas Insignias Desbloqueadas!
                </div>
                <div className="space-y-2">
                  {victoryData.new_badges.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 font-bold">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">{b.name}</div>
                        <div className="text-[11px] text-amber-800">{b.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setVictoryData(null);
                onBack();
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl cursor-pointer"
            >
              Seguir explorando retos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
