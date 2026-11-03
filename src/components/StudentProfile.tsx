import React, { useState, useEffect } from 'react';
import { User, Badge, SubLevelInfo } from '../types';
import { api } from '../services/api';
import { STEAM_SUBLEVELS, getSubLevelForPoints, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  LogOut,
  Compass,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Code2,
  Grid,
  Calendar,
  Lock,
} from 'lucide-react';

interface StudentProfileProps {
  user: User;
  onLogout: () => void;
  onNavigateToChallenges: () => void;
  onNavigateToBadges: () => void;
}

interface StudentCompletionItem {
  id: string;
  challenge_id: string;
  title: string;
  category: string;
  difficulty: string;
  type?: string;
  estimated_time_min?: number;
  points_awarded: number;
  completed_at: string;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  user,
  onLogout,
  onNavigateToChallenges,
  onNavigateToBadges,
}) => {
  const [profileData, setProfileData] = useState<{
    user: User;
    badges: Badge[];
    completions: StudentCompletionItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getStudentProfile()
      .then((data) => {
        if (isMounted) {
          setProfileData(data as any);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error cargando perfil:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalPoints = profileData?.user.total_points ?? user.total_points;
  const subLevelInfo: SubLevelInfo = getSubLevelForPoints(totalPoints);

  // Calculate next sub-level info and percentage
  const nextSubLevel = STEAM_SUBLEVELS.find((s) => s.rankOrder === subLevelInfo.rankOrder + 1);
  const pointsInCurrentLevel = totalPoints - subLevelInfo.minPoints;
  const levelSpan = subLevelInfo.maxPoints - subLevelInfo.minPoints;
  const progressPercent = nextSubLevel
    ? Math.min(100, Math.max(0, Math.round((pointsInCurrentLevel / levelSpan) * 100)))
    : 100;
  const pointsRemaining = nextSubLevel ? Math.max(0, subLevelInfo.maxPoints - totalPoints) : 0;

  const totalTimeMin = (profileData?.completions || []).reduce(
    (acc, c) => acc + (c.estimated_time_min || 10),
    0
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Student Profile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white p-6 sm:p-8 shadow-lg border border-emerald-600/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={OFFICIAL_SEMILLITO_IMAGE}
                alt="Semillito"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shadow-xs">
                {subLevelInfo.subLevel}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Alumno STEAM
                </span>
                <span className="text-xs font-semibold text-emerald-100">
                  {subLevelInfo.tierName} · Nivel {subLevelInfo.subLevel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user.display_name || user.alias}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                Alias de conexión: <span className="font-mono font-bold text-white bg-black/20 px-2 py-0.5 rounded">{user.alias}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={onNavigateToChallenges}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Resolver Retos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2.5 bg-black/25 hover:bg-rose-600/80 text-white text-xs sm:text-sm font-semibold rounded-xl backdrop-blur-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cerrar sesión de alumno"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Puntos */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Puntuación Total</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {totalPoints} <span className="text-xs font-bold text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {subLevelInfo.title}
          </div>
        </div>

        {/* Card 2: Subnivel actual */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Rango y Rango</span>
            <Trophy className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            {subLevelInfo.tierName}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Nivel {subLevelInfo.subLevel} (Escalafón #{subLevelInfo.rankOrder} de 15)
          </div>
        </div>

        {/* Card 3: Retos Completados */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Retos Superados</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {profileData?.completions.length ?? 0}
          </div>
          <div className="text-[11px] text-teal-600 font-semibold mt-1">
            Semidokus y Algoritmos
          </div>
        </div>

        {/* Card 4: Tiempo Estimado */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Tiempo Dedicado</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums">
            {totalTimeMin} <span className="text-xs font-bold text-slate-400">min</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Tiempo estimado completado
          </div>
        </div>
      </div>

      {/* Progress Bar towards Next Level */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Progreso hacia el siguiente subnivel</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {nextSubLevel
                ? `Te faltan ${pointsRemaining} puntos para ascender a ${nextSubLevel.title}.`
                : '¡Has alcanzado el rango máximo de Maestro Tecnológico!'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-600 tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mt-2">
          <span>{subLevelInfo.minPoints} pts</span>
          <span>{subLevelInfo.maxPoints === 5000 ? '+2400 pts' : `${subLevelInfo.maxPoints} pts`}</span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Mis Insignias de Logro ({profileData?.badges.length || 0})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distintivos conseguidos por resolver retos, dominar la deducción y programar con éxito.
            </p>
          </div>
          <button
            onClick={onNavigateToBadges}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {profileData?.badges && profileData.badges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {profileData.badges.map((badge) => (
              <div
                key={badge.id || badge.code}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 flex items-center gap-3 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-400/90 text-amber-950 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                  {badge.icon || '🏅'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {badge.name}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                    {badge.description}
                  </p>
                  {badge.unlocked_at && (
                    <span className="text-[10px] text-amber-800 font-semibold mt-1 inline-block">
                      Obtenida el {new Date(badge.unlocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Aún no tienes insignias desbloqueadas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supera tu primer Semidoku o reto de programación para desbloquear tus primeras medallas STEAM.
            </p>
            <button
              onClick={onNavigateToChallenges}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Empezar mi primer reto
            </button>
          </div>
        )}
      </div>

      {/* Completed Challenges History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Historial de Retos Superados</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Registro autoritativo de desafíos completados y puntos sumados a tu cuenta.
        </p>

        {profileData?.completions && profileData.completions.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {profileData.completions.map((comp) => (
              <div
                key={comp.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    {comp.type === 'blockly_code' ? (
                      <Code2 className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Grid className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {comp.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="capitalize">{comp.category}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{comp.difficulty}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(comp.completed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-lg tabular-nums">
                    +{comp.points_awarded} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Todavía no has enviado soluciones. ¡Ve a la sección de Retos para empezar a resolver!
            </p>
          </div>
        )}
      </div>

      {/* Account Info Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Cuentas y Seguridad en el Aula STEAM: </span>
          Por protección de privacidad de los menores, los alumnos no disponen de autorregistro con contraseñas o correos. Tu usuario y código personal son generados y custodiados por el profesor responsable de la academia. Si olvidas tu código, consulta con tu profesor.
        </div>
      </div>
    </div>
  );
};
