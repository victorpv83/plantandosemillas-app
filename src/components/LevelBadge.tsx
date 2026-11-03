import React from 'react';
import { getSubLevelProgress } from '../constants/steam';
import { Compass, Code2, Cpu, Zap, Crown, Sparkles, ChevronUp } from 'lucide-react';

interface LevelBadgeProps {
  points: number;
  showProgress?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ points, showProgress = true }) => {
  const { currentSubLevel, nextSubLevel, progressPercent, pointsToNext } = getSubLevelProgress(points);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'explorador':
        return <Compass className="w-5 h-5 text-emerald-600" />;
      case 'aprendiz':
        return <Code2 className="w-5 h-5 text-teal-600" />;
      case 'constructor':
        return <Cpu className="w-5 h-5 text-cyan-600" />;
      case 'inventor':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'maestro':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
  };

  const subLevelLabels = {
    3: 'Nivel 3',
    2: 'Nivel 2',
    1: 'Nivel 1',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            {getTierIcon(currentSubLevel.tier)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {currentSubLevel.tierName}
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Nivel {currentSubLevel.subLevel}
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 leading-tight">
              {currentSubLevel.title}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-2xl font-black text-emerald-600 tabular-nums leading-none">
            {points}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
            Puntos STEAM Acumulados
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
              Progreso de Subnivel
            </span>
            <span className="tabular-nums font-bold text-slate-800">
              {nextSubLevel ? `Faltan ${pointsToNext} pts para ${nextSubLevel.title}` : '¡Rango Máximo Alcanzado!'}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 tabular-nums">
            <span>{currentSubLevel.minPoints} pts</span>
            <span className="text-slate-600 font-semibold">{currentSubLevel.description}</span>
            <span>{nextSubLevel ? `${nextSubLevel.minPoints} pts` : 'Max'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
