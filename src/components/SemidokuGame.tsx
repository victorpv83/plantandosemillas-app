import React, { useState, useEffect } from 'react';
import { Challenge, SemidokuGrid, SubmissionResponse, SymbolItem, GuidedClue } from '../types';
import { THEME_SYMBOLS, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  Eye,
  Eraser,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Compass,
} from 'lucide-react';

interface SemidokuGameProps {
  challenge: Challenge;
  isStudentLoggedIn: boolean;
  onBack: () => void;
  onChallengeCompleted: (result: SubmissionResponse) => void;
  onOpenLogin: () => void;
}

export const SemidokuGame: React.FC<SemidokuGameProps> = ({
  challenge,
  isStudentLoggedIn,
  onBack,
  onChallengeCompleted,
  onOpenLogin,
}) => {
  const size = challenge.grid_size;
  const isCharacterPlacement = challenge.subtype === 'character_placement';
  const symbols: SymbolItem[] = (THEME_SYMBOLS[challenge.symbols_theme] || THEME_SYMBOLS.robotics).slice(0, size);

  // Initialize board with challenge clues
  const [grid, setGrid] = useState<SemidokuGrid>(() => {
    if (challenge.clues_grid && challenge.clues_grid.length === size) {
      return challenge.clues_grid.map((row) => [...row]);
    }
    return Array.from({ length: size }, () => Array(size).fill(null));
  });

  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [activeSymbolToPlace, setActiveSymbolToPlace] = useState<string | null>(null);
  const [showDuplicateHelper, setShowDuplicateHelper] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [victoryData, setVictoryData] = useState<SubmissionResponse | null>(null);

  // Guided Clues list & visibility
  const guidedClues: GuidedClue[] = challenge.guided_clues || [];
  const [showGuidedClues, setShowGuidedClues] = useState<boolean>(true);

  // Hover cell during drag and drop
  const [dragOverCell, setDragOverCell] = useState<{ r: number; c: number } | null>(null);

  // Check if a cell is an initial fixed clue
  const isClue = (r: number, c: number) => {
    return challenge.clues_grid && challenge.clues_grid[r] && challenge.clues_grid[r][c] !== null;
  };

  // Find duplicates if helper is active
  const hasConflict = (r: number, c: number): boolean => {
    if (!showDuplicateHelper) return false;
    const val = grid[r][c];
    if (!val) return false;

    // Check row
    for (let col = 0; col < size; col++) {
      if (col !== c && grid[r][col] === val) return true;
    }
    // Check column
    for (let row = 0; row < size; row++) {
      if (row !== r && grid[row][c] === val) return true;
    }
    return false;
  };

  // Core symbol placement logic
  const placeSymbolInCell = (
    symbolId: string,
    r: number,
    c: number,
    clearFromOrigin?: { r: number; c: number }
  ) => {
    if (isClue(r, c)) return;

    sounds.playClick(580);
    const newGrid = grid.map((row) => [...row]);

    // If moving a piece from an existing cell on the board
    if (clearFromOrigin) {
      newGrid[clearFromOrigin.r][clearFromOrigin.c] = null;
    }

    if (isCharacterPlacement) {
      // Toggle off if cell already has this exact symbol and it's not a drag from another cell
      if (newGrid[r][c] === symbolId && !clearFromOrigin) {
        newGrid[r][c] = null;
      } else {
        // Clear this character from any other cell so each adventurer is unique
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (newGrid[row][col] === symbolId) {
              newGrid[row][col] = null;
            }
          }
        }
        newGrid[r][c] = symbolId;
      }
    } else {
      // Standard Semidoku: toggle cell if same symbol
      if (newGrid[r][c] === symbolId) {
        newGrid[r][c] = null;
      } else {
        newGrid[r][c] = symbolId;
      }
    }

    setGrid(newGrid);
    setSelectedCell({ r, c });
    setErrorMessage(null);
  };

  // Click on a cell in the board
  const handleCellClick = (r: number, c: number) => {
    if (isClue(r, c)) return;

    // If student has an active symbol selected from the palette
    if (activeSymbolToPlace) {
      placeSymbolInCell(activeSymbolToPlace, r, c);
      return;
    }

    // Default select cell
    sounds.playClick(480);
    setSelectedCell({ r, c });
  };

  // Select / toggle a symbol in the palette (tool in hand)
  const handleSelectPaletteSymbol = (symbolId: string) => {
    sounds.playClick(520);
    // If clicking an already active symbol, deselect it; otherwise select it
    setActiveSymbolToPlace((prev) => (prev === symbolId ? null : symbolId));
    setErrorMessage(null);
  };

  // Drag and drop handlers
  const handleDragStartPalette = (e: React.DragEvent, symbolId: string) => {
    e.dataTransfer.setData('application/steam-character', symbolId);
    e.dataTransfer.setData('text/plain', symbolId);
    e.dataTransfer.effectAllowed = 'copyMove';
    setActiveSymbolToPlace(symbolId);
  };

  const handleDragStartBoardCell = (e: React.DragEvent, r: number, c: number, symbolId: string) => {
    e.dataTransfer.setData('application/steam-character', symbolId);
    e.dataTransfer.setData('application/steam-origin-cell', JSON.stringify({ r, c }));
    e.dataTransfer.setData('text/plain', symbolId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCellDrop = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    setDragOverCell(null);
    if (isClue(r, c)) return;

    const symbolId = e.dataTransfer.getData('application/steam-character') || e.dataTransfer.getData('text/plain');
    if (!symbolId) return;

    const originData = e.dataTransfer.getData('application/steam-origin-cell');
    let origin: { r: number; c: number } | undefined;
    if (originData) {
      try {
        origin = JSON.parse(originData);
      } catch {
        // Ignore parsing error
      }
    }

    placeSymbolInCell(symbolId, r, c, origin);
  };

  // Clear current active cell
  const handleClearCell = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (isClue(r, c)) return;

    sounds.playClick(440);
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = null;
    setGrid(newGrid);
    setErrorMessage(null);
  };

  // Reset editable cells
  const handleResetBoard = () => {
    sounds.playClick(350);
    if (challenge.clues_grid && challenge.clues_grid.length === size) {
      setGrid(challenge.clues_grid.map((row) => [...row]));
    } else {
      setGrid(Array.from({ length: size }, () => Array(size).fill(null)));
    }
    setActiveSymbolToPlace(null);
    setErrorMessage(null);
  };

  // Submit to backend
  const handleSubmitSolution = async () => {
    if (!isStudentLoggedIn) {
      onOpenLogin();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await api.submitChallenge(challenge.id, grid);

      if (!response.success) {
        sounds.playConflict();
        setErrorMessage(response.message);
      } else {
        sounds.playVictory();
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6'],
        });

        setVictoryData(response);
        onChallengeCompleted(response);
      }
    } catch (err: any) {
      sounds.playConflict();
      setErrorMessage(err.message || 'Error al comprobar el reto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a retos
        </button>

        <div className="flex items-center gap-2">
          {guidedClues.length > 0 && (
            <button
              onClick={() => setShowGuidedClues(!showGuidedClues)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showGuidedClues
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>{showGuidedClues ? 'Ocultar Pistas Guiadas' : 'Ver Pistas Guiadas (9)'}</span>
            </button>
          )}

          <button
            onClick={() => setShowDuplicateHelper(!showDuplicateHelper)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showDuplicateHelper
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Activar o desactivar el detector visual de símbolos repetidos"
          >
            <Eye className="w-3.5 h-3.5" />
            {showDuplicateHelper ? 'Detector activo' : 'Detectar repetidos'}
          </button>

          <button
            onClick={handleResetBoard}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            title="Borrar tus respuestas y empezar de nuevo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Challenge Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span className="capitalize font-semibold text-emerald-700">{challenge.category}</span>
          <span aria-hidden="true">·</span>
          <span>Dificultad {challenge.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span>Tablero {size}×{size}</span>
          <span aria-hidden="true">·</span>
          <span className="font-bold text-emerald-600 tabular-nums">+{challenge.points} puntos</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          {challenge.title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {challenge.description}
        </p>

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {isCharacterPlacement ? (
              <>
                <strong>Regla de Aventura:</strong> Hay {size} personajes y cada uno ocupa una sola casilla. ¡Ningún aventurero puede compartir fila ni columna con otro! Selecciona un personaje y pulsa la casilla para colocarlo. Vuelve a pulsarla para borrarlo.
              </>
            ) : (
              <>
                <strong>Regla Semidoku:</strong> En cada fila y en cada columna debe haber exactamente uno de cada símbolo sin repetirse. Las casillas con candado <Lock className="w-3 h-3 inline text-slate-400" /> son pistas fijas.
              </>
            )}
          </span>
        </div>
      </div>

      {/* All Guided Clues visible simultaneously (no sliding/pagination needed) */}
      {showGuidedClues && guidedClues.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-100/50 border border-amber-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider">
                  Todas las Pistas Ordenadas ({guidedClues.length} pistas)
                </h3>
                <p className="text-[11px] text-amber-800">
                  Léelas en orden para descubrir la posición de cada personaje sin repetir filas ni columnas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-900 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200/60 self-start sm:self-auto">
              <span>Personajes:</span>
              <span className="flex items-center gap-1 font-extrabold text-slate-800">
                🌱 Semillito · 🧑 Steve · 💚 Creeper · 🧑‍🚀 Alex · 🟪 Enderman
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {guidedClues.map((clue) => (
              <div
                key={clue.step}
                className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      {clue.step}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {clue.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-snug mb-2 font-medium">
                    {clue.text}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded-lg font-medium">
                  <span className="font-bold text-amber-950">Pregunta: </span>
                  <span>{clue.question}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error / Alert banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center gap-3 animate-pop-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Game Stage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Header row labels (C1, C2, C3, C4, C5) */}
          <div className="flex items-center mb-1 text-slate-400 text-xs font-mono font-bold pl-8">
            {Array.from({ length: size }).map((_, colIdx) => (
              <div key={colIdx} className="w-14 sm:w-16 md:w-18 text-center">
                C{colIdx + 1}
              </div>
            ))}
          </div>

          <div className="flex items-center">
            {/* Row labels (F1, F2, F3...) */}
            <div className="flex flex-col justify-around text-slate-400 text-xs font-mono font-bold pr-2 h-full py-4">
              {Array.from({ length: size }).map((_, rowIdx) => (
                <div key={rowIdx} className="h-14 sm:h-16 md:h-18 flex items-center">
                  F{rowIdx + 1}
                </div>
              ))}
            </div>

            <div
              className="inline-grid gap-2 p-3 bg-slate-800 rounded-3xl shadow-lg border-4 border-slate-700 select-none max-w-full"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((row, r) =>
                row.map((cellValue, c) => {
                  const fixed = isClue(r, c);
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const inSameRow = selectedCell?.r === r;
                  const inSameCol = selectedCell?.c === c;
                  const conflict = hasConflict(r, c);
                  const sym = symbols.find((s) => s.id === cellValue);
                  const isDragOver = dragOverCell?.r === r && dragOverCell?.c === c;

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      draggable={Boolean(cellValue && !fixed)}
                      onDragStart={(e) => {
                        if (cellValue && !fixed) {
                          handleDragStartBoardCell(e, r, c, cellValue);
                        }
                      }}
                      onDragOver={(e) => {
                        if (!fixed) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                          setDragOverCell({ r, c });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverCell?.r === r && dragOverCell?.c === c) {
                          setDragOverCell(null);
                        }
                      }}
                      onDrop={(e) => handleCellDrop(e, r, c)}
                      onClick={() => handleCellClick(r, c)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl flex flex-col items-center justify-center transition-all relative font-bold ${
                        fixed
                          ? 'bg-slate-100 text-slate-800 border-2 border-slate-300 cursor-not-allowed'
                          : isDragOver
                          ? 'ring-4 ring-emerald-400 bg-emerald-100 scale-105 z-20 shadow-lg border-2 border-emerald-500'
                          : isSelected
                          ? 'bg-white text-slate-900 ring-4 ring-emerald-400 shadow-md scale-102 z-10'
                          : conflict
                          ? 'bg-rose-50 text-rose-900 border-2 border-rose-400'
                          : inSameRow || inSameCol
                          ? 'bg-slate-200/90 text-slate-800 border border-slate-300'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                      } ${cellValue && !fixed ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                    >
                      {fixed && (
                        <div className="absolute top-1 right-1.5 text-slate-400">
                          <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </div>
                      )}

                      {conflict && (
                        <div className="absolute top-1 left-1.5 w-2 h-2 rounded-full bg-rose-500" />
                      )}

                      {sym ? (
                        <div className="flex flex-col items-center justify-center leading-none select-none">
                          {sym.avatarUrl ? (
                            <img
                              src={sym.avatarUrl}
                              alt={sym.label}
                              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-2xl select-none">{sym.symbolChar}</span>
                          )}
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 mt-0.5 uppercase tracking-tight">
                            {sym.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs select-none">·</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Character / Symbol Palette Deck */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isCharacterPlacement ? 'Personajes Aventureros' : 'Elementos Disponibles'}
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {isCharacterPlacement
                ? 'Arrastra un personaje al tablero o haz clic para seleccionarlo y colocarlo en una casilla (o volver a pulsar para quitarlo):'
                : 'Arrastra al tablero o haz clic para seleccionarlo:'}
            </p>

            {/* Active Character In Hand Banner */}
            {activeSymbolToPlace && (
              <div className="mb-3 p-2.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl flex items-center justify-between animate-pop-in">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-900">
                    Seleccionado en mano:
                  </span>
                  <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                    {symbols.find((s) => s.id === activeSymbolToPlace)?.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSymbolToPlace(null)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {symbols.map((sym) => {
                const isCurrentActive = activeSymbolToPlace === sym.id;
                // Count placed count
                const placedCount = grid.flat().filter((val) => val === sym.id).length;

                return (
                  <button
                    key={sym.id}
                    type="button"
                    draggable={true}
                    onDragStart={(e) => handleDragStartPalette(e, sym.id)}
                    onClick={() => handleSelectPaletteSymbol(sym.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-grab active:cursor-grabbing text-left ${sym.bgClass} ${sym.borderClass} ${
                      isCurrentActive
                        ? 'ring-4 ring-emerald-500 scale-102 font-black shadow-md bg-white border-emerald-500'
                        : 'hover:scale-101'
                    }`}
                    title="Arrastra al tablero o haz clic para seleccionar"
                  >
                    {sym.avatarUrl ? (
                      <img
                        src={sym.avatarUrl}
                        alt={sym.label}
                        className="w-8 h-8 object-contain rounded-md shrink-0 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl shrink-0 select-none">{sym.symbolChar}</span>
                    )}
                    <div className="overflow-hidden">
                      <div className={`text-xs font-bold truncate ${sym.textClass}`}>{sym.label}</div>
                      <div className="text-[10px] text-slate-500">
                        {isCurrentActive
                          ? 'En mano ✓'
                          : isCharacterPlacement
                          ? placedCount > 0
                            ? 'Colocado ✓'
                            : 'Arrastrar / Clic'
                          : 'Insertar'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Eraser Button */}
            <button
              onClick={handleClearCell}
              disabled={selectedCell ? isClue(selectedCell.r, selectedCell.c) : true}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Eraser className="w-3.5 h-3.5" />
              Borrar casilla seleccionada
            </button>
          </div>

          {/* Submit Action Block */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-100 mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>¿Terminaste tu solución?</span>
            </div>
            <h4 className="text-base font-bold text-white mb-3">
              Valida tu reto con el servidor
            </h4>

            {isStudentLoggedIn ? (
              <button
                onClick={handleSubmitSolution}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <span>Comprobar y Enviar</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={onOpenLogin}
                  className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  Inicia sesión para guardar tus puntos
                </button>
                <p className="text-[11px] text-emerald-100 text-center">
                  Solo los alumnos registrados pueden sumar puntos e insignias.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {victoryData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-emerald-400 animate-pop-in relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg mb-4">
              <Trophy className="w-10 h-10 text-amber-300" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
              ¡Reto Superado con Éxito!
            </h3>
            <p className="text-sm text-slate-600 mb-5">{victoryData.message}</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5">
              <div className="flex justify-around items-center">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Puntos Obtenidos</div>
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
                <div className="mt-3 pt-3 border-t border-emerald-200 text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
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
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 font-bold text-lg">
                        {b.icon || '🏅'}
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
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Seguir explorando retos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
