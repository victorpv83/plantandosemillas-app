import React from 'react';
import { Challenge } from '../types';
import { CheckCircle2, Clock, Sparkles, Play, RotateCcw, Code2, Grid } from 'lucide-react';
import { THEME_SYMBOLS } from '../constants/steam';

interface ChallengeCardProps {
  challenge: Challenge;
  onPlay: (challenge: Challenge) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onPlay }) => {
  const symbols = (THEME_SYMBOLS[challenge.symbols_theme] || THEME_SYMBOLS.robotics).slice(0, challenge.grid_size);

  const difficultyColors = {
    Fácil: 'text-emerald-700 font-semibold',
    Medio: 'text-amber-700 font-semibold',
    Avanzado: 'text-rose-700 font-semibold',
  };

  const isBlockly = challenge.type === 'blockly_code';

  return (
    <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Zero-Pill Metadata Line */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5 flex-wrap">
          <span className="font-bold flex items-center gap-1 text-slate-800">
            {isBlockly ? (
              <>
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                Bloques
              </>
            ) : (
              <>
                <Grid className="w-3.5 h-3.5 text-emerald-600" />
                Semidoku
              </>
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span className="capitalize font-medium text-slate-600">{challenge.category}</span>
          <span aria-hidden="true">·</span>
          <span className={difficultyColors[challenge.difficulty]}>{challenge.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {challenge.estimated_time_min} min
          </span>
        </div>

        {/* Challenge Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2 leading-snug">
          {challenge.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {challenge.description}
        </p>

        {/* Micro Preview of Symbols or Blocks in this Challenge */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl mb-4">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">
            {isBlockly ? 'Instrucciones:' : 'Personajes:'}
          </span>
          {isBlockly ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                Avanzar
              </span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-[10px]">
                Girar
              </span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold text-[10px]">
                Recoger
              </span>
            </div>
          ) : (
            symbols.map((sym) => (
              <div
                key={sym.id}
                title={sym.label}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs shadow-2xs overflow-hidden"
              >
                {sym.avatarUrl ? (
                  <img
                    src={sym.avatarUrl}
                    alt={sym.label}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  sym.symbolChar
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Area: Points & Action Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-sm tabular-nums">
            <Sparkles className="w-4 h-4 text-amber-500" />
            +{challenge.points} pts
          </div>
          {challenge.is_completed && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              ¡Completado!
            </div>
          )}
        </div>

        <button
          onClick={() => onPlay(challenge)}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            challenge.is_completed
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          {challenge.is_completed ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              Repetir
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              ¡Jugar reto!
            </>
          )}
        </button>
      </div>
    </div>
  );
};
