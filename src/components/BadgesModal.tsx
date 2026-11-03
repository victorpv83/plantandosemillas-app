import React, { useState, useEffect } from 'react';
import { Badge } from '../types';
import { STEAM_SUBLEVELS, getSubLevelForPoints, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import { api } from '../services/api';
import { Award, CheckCircle2, Lock, Trophy } from 'lucide-react';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  userBadges: Badge[];
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  userPoints,
  userBadges,
}) => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getAllBadges().then(setAllBadges).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unlockedCodes = new Set(userBadges.map((b) => b.code));
  const currentSubLevel = getSubLevelForPoints(userPoints);

  // Group sublevels by tier
  const tiers = [
    { key: 'explorador', name: 'Explorador Tecnológico' },
    { key: 'aprendiz', name: 'Aprendiz Digital' },
    { key: 'constructor', name: 'Constructor de Ideas' },
    { key: 'inventor', name: 'Inventor STEAM' },
    { key: 'maestro', name: 'Maestro Tecnológico' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-pop-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
        >
          ✕
        </button>

        {/* Mascot & Sublevels Header Banner */}
        <div className="mb-6 rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-800 p-5 text-white flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 p-1 flex items-center justify-center shrink-0">
            <img
              src={OFFICIAL_SEMILLITO_IMAGE}
              alt="Semillito"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Subniveles e Insignias STEAM
            </h2>
            <p className="text-xs text-emerald-100">
              Cada rango se organiza progresivamente en <strong>Nivel 3</strong>, <strong>Nivel 2</strong> y <strong>Nivel 1</strong>.
            </p>
          </div>
        </div>

        {/* 1. Sublevels Hierarchy */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Escalafón de Subniveles STEAM (Nivel 3 ➔ Nivel 2 ➔ Nivel 1)</span>
          </h3>

          <div className="space-y-3">
            {tiers.map((tier) => {
              const tierSublevels = STEAM_SUBLEVELS.filter((s) => s.tier === tier.key);
              return (
                <div key={tier.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    {tier.name}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tierSublevels.map((lvl) => {
                      const isCurrent = currentSubLevel.rankOrder === lvl.rankOrder;
                      const isAchieved = userPoints >= lvl.minPoints;

                      return (
                        <div
                          key={lvl.rankOrder}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isCurrent
                              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/50'
                              : isAchieved
                              ? 'bg-white border-slate-200 text-slate-800'
                              : 'bg-white/60 border-slate-100 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-extrabold text-[11px]">
                              Nivel {lvl.subLevel}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                Tú
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 tabular-nums">
                            {lvl.minPoints} a {lvl.maxPoints === 5000 ? '+2400' : lvl.maxPoints} pts
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{lvl.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Expanded Badges Catalog */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Insignias de Logro ({unlockedCodes.size} de {allBadges.length} desbloqueadas)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {allBadges.map((b) => {
              const unlocked = unlockedCodes.has(b.code);
              return (
                <div
                  key={b.id || b.code}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${
                    unlocked
                      ? 'bg-amber-50/80 border-amber-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      unlocked ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {b.icon || '🏅'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs truncate">{b.name}</span>
                      {unlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-tight mt-0.5 line-clamp-2 text-slate-600">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
