import React, { useState, useEffect } from 'react';
import { Badge, SubLevelInfo } from '../types';
import { STEAM_SUBLEVELS, getSubLevelForPoints, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import { api } from '../services/api';
import {
  Trophy,
  Award,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  Shield,
  Star,
  Check,
} from 'lucide-react';

interface BadgesViewProps {
  userPoints: number;
  userBadges: Badge[];
  isLoggedIn: boolean;
  onBack: () => void;
}

export const BadgesView: React.FC<BadgesViewProps> = ({
  userPoints,
  userBadges,
  isLoggedIn,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'sublevels' | 'badges'>('sublevels');
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getAllBadges()
      .then((data) => {
        if (isMounted) {
          setAllBadges(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching badges:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const unlockedCodes = new Set(userBadges.map((b) => b.code));
  const currentSubLevel: SubLevelInfo = getSubLevelForPoints(userPoints);

  const tiers = [
    { key: 'explorador', name: 'Explorador Tecnológico', color: 'from-emerald-500 to-teal-600', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { key: 'aprendiz', name: 'Aprendiz Digital', color: 'from-cyan-500 to-blue-600', badgeColor: 'bg-cyan-100 text-cyan-800' },
    { key: 'constructor', name: 'Constructor de Ideas', color: 'from-indigo-500 to-violet-600', badgeColor: 'bg-indigo-100 text-indigo-800' },
    { key: 'inventor', name: 'Inventor STEAM', color: 'from-amber-500 to-orange-600', badgeColor: 'bg-amber-100 text-amber-800' },
    { key: 'maestro', name: 'Maestro Tecnológico', color: 'from-rose-500 to-pink-600', badgeColor: 'bg-rose-100 text-rose-800' },
  ];

  const categories = [
    { id: 'all', label: 'Todas las insignias' },
    { id: 'logro', label: 'Lógica' },
    { id: 'programación', label: 'Programación' },
    { id: 'robótica', label: 'Robótica' },
    { id: 'aventura', label: 'Aventura' },
    { id: 'dedicación', label: 'Dedicación' },
  ];

  const filteredBadges = allBadges.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Volver a los Retos</span>
        </button>

        {isLoggedIn && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Tu Puntuación: {userPoints} pts</span>
            <span>·</span>
            <span className="text-emerald-700">{currentSubLevel.title}</span>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-inner">
            <img
              src={OFFICIAL_SEMILLITO_IMAGE}
              alt="Semillito"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-emerald-200 text-xs font-black uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistema de Progresión Gamificada</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Subniveles e Insignias STEAM
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Cada reto que resuelves suma puntos a tu expediente. Avanza a través de los <strong>15 subniveles de maestría</strong> y colecciona insignias exclusivas de lógica, programación y robótica.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sublevels')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sublevels'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Escalafón de Subniveles (15)</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Catálogo de Insignias ({allBadges.length})</span>
        </button>
      </div>

      {/* TAB 1: Escalafón de 15 Subniveles */}
      {activeTab === 'sublevels' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed">
            <span className="font-extrabold text-slate-900">¿Cómo funcionan los subniveles? </span>
            Existen 5 rangos principales. En cada rango comienzas como <span className="font-bold text-emerald-700">Nivel 3</span>, avanzas a <span className="font-bold text-emerald-700">Nivel 2</span> y culminas en <span className="font-bold text-emerald-700">Nivel 1</span> antes de ascender al siguiente rango honorífico.
          </div>

          <div className="space-y-4">
            {tiers.map((tier) => {
              const tierSublevels = STEAM_SUBLEVELS.filter((s) => s.tier === tier.key);
              return (
                <div
                  key={tier.key}
                  className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${tier.color}`} />
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {tier.name}
                      </h3>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${tier.badgeColor}`}>
                      Rango STEAM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {tierSublevels.map((lvl) => {
                      const isCurrent = isLoggedIn && currentSubLevel.rankOrder === lvl.rankOrder;
                      const isAchieved = isLoggedIn && userPoints >= lvl.minPoints;

                      return (
                        <div
                          key={lvl.rankOrder}
                          className={`relative p-4 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/60 shadow-sm'
                              : isAchieved
                              ? 'bg-slate-50/60 border-slate-200 text-slate-900'
                              : 'bg-white border-slate-200/80 text-slate-500'
                          }`}
                        >
                          {isCurrent && (
                            <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                              Tu Nivel Actual
                            </span>
                          )}

                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>Nivel {lvl.subLevel}</span>
                              {isAchieved && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                              {lvl.minPoints} a {lvl.maxPoints === 5000 ? '+2400' : lvl.maxPoints} pts
                            </span>
                          </div>

                          <h4 className="text-xs font-extrabold text-slate-800 mb-1">
                            {lvl.title}
                          </h4>

                          <p className="text-[11px] text-slate-600 leading-snug">
                            {lvl.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Catálogo de Insignias */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Category filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const unlocked = unlockedCodes.has(badge.code);
              return (
                <div
                  key={badge.id || badge.code}
                  className={`p-4 rounded-3xl border transition-all flex items-start gap-3.5 ${
                    unlocked
                      ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-300 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 opacity-80'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner ${
                      unlocked
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 ring-2 ring-amber-300/60'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {badge.icon || '🏅'}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {badge.name}
                      </span>
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                          <Check className="w-3 h-3" />
                          Desbloqueada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          Bloqueada
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {badge.category}
                    </span>

                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
