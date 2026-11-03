import React, { useState } from 'react';
import { User, Challenge } from '../types';
import { ChallengeCard } from './ChallengeCard';
import { LevelBadge } from './LevelBadge';
import { SemillitoMascot } from './SemillitoMascot';
import { OFFICIAL_SEMILLITO_IMAGE, getSubLevelForPoints } from '../constants/steam';
import { Award, CheckCircle2, ListFilter, Sparkles, BookOpen, Code2, Grid } from 'lucide-react';

interface StudentDashboardProps {
  user: User | null;
  challenges: Challenge[];
  onPlayChallenge: (challenge: Challenge) => void;
  onOpenBadges: () => void;
  onOpenHowToPlay: () => void;
  onOpenLogin: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  challenges,
  onPlayChallenge,
  onOpenBadges,
  onOpenHowToPlay,
  onOpenLogin,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const completedCount = challenges.filter((c) => c.is_completed).length;
  const pendingCount = challenges.length - completedCount;

  // Filtered challenges
  const filteredChallenges = challenges.filter((c) => {
    if (selectedType !== 'all' && c.type !== selectedType) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
    if (selectedStatus === 'completed' && !c.is_completed) return false;
    if (selectedStatus === 'pending' && c.is_completed) return false;
    return true;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todas las áreas' },
    { id: 'lógica', label: 'Lógica & Deducción' },
    { id: 'programación', label: 'Programación' },
    { id: 'robótica', label: 'Robótica' },
    { id: 'electrónica', label: 'Electrónica' },
    { id: 'steam', label: 'STEAM' },
  ];

  const difficulties: { id: string; label: string }[] = [
    { id: 'all', label: 'Cualquier nivel' },
    { id: 'Fácil', label: 'Fácil' },
    { id: 'Medio', label: 'Medio' },
    { id: 'Avanzado', label: 'Avanzado' },
  ];

  const subLevelInfo = user ? getSubLevelForPoints(user.total_points) : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Plantando Semillas STEAM · Retos Educativos</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 text-balance leading-tight">
              {user ? (
                <>¡Hola, {user.alias}! Tu aventura STEAM continúa</>
              ) : (
                <>Despierta tu curiosidad. Impulsa tu futuro.</>
              )}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed mb-6">
              Resuelve retos de robótica, programación por bloques y desafíos lógicos como el <strong className="text-amber-300">Semidoku del Jardín Secreto</strong> o el <strong className="text-amber-300">Castillo Encantado de Semillito</strong>. Gana puntos, sube del subnivel 3 al subnivel 1 y desbloquea insignias.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenHowToPlay}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Cómo resolver Semidokus y Bloques
              </button>

              <button
                onClick={onOpenBadges}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Ver subniveles e insignias
              </button>

              {!user && (
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  Iniciar sesión con mi Alias
                </button>
              )}
            </div>
          </div>

          {/* Right Hero Mascot & KPI Strip */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-end">
            <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 border border-white/30 p-1 flex items-center justify-center shrink-0">
                <img
                  src={OFFICIAL_SEMILLITO_IMAGE}
                  alt="Semillito"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-emerald-200">
                  {user ? subLevelInfo?.title : 'Mascota Semillito'}
                </div>
                <div className="text-2xl font-black text-amber-300 tabular-nums">
                  {user ? `${user.total_points} pts` : 'Academia STEAM'}
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5">
                  {user ? `${completedCount} de ${challenges.length} retos superados` : '¡Aprende jugando!'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Semillito Interactive Mascot Component */}
      <SemillitoMascot />

      {/* Student Sublevel Progression Banner */}
      {user && (
        <section>
          <LevelBadge points={user.total_points} showProgress={true} />
        </section>
      )}

      {/* Challenges Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Retos STEAM Disponibles
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Elige entre juegos de Semidoku o retos de programación de código mediante bloques.
            </p>
          </div>

          {/* Type Filter Tabs (Semidoku vs Bloques) */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({challenges.length})
            </button>
            <button
              onClick={() => setSelectedType('semidoku')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'semidoku'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Semidokus
            </button>
            <button
              onClick={() => setSelectedType('blockly_code')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'blockly_code'
                  ? 'bg-white text-indigo-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Bloques de Código
            </button>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
            <ListFilter className="w-4 h-4 text-slate-400" />
            <span>Filtrar:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            {difficulties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Cualquier estado</option>
            <option value="pending">Pendientes de resolver</option>
            <option value="completed">Ya completados</option>
          </select>

          {(selectedType !== 'all' || selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-emerald-700 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Challenge Grid */}
        {filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((ch) => (
              <ChallengeCard
                key={ch.id}
                challenge={ch}
                onPlay={(selected) => onPlayChallenge(selected)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No hay retos que coincidan con estos filtros
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Prueba a cambiar la categoría, el tipo de reto o el nivel de dificultad.
            </p>
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setSelectedStatus('all');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
