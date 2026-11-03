import React from 'react';
import { User } from '../types';
import { getSubLevelForPoints, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import { LogOut, User as UserIcon, Shield, Volume2, VolumeX, BookOpen, Award, Compass, Code2 } from 'lucide-react';
import { sounds } from '../utils/sound';

interface NavbarProps {
  user: User | null;
  onOpenStudentLogin: () => void;
  onOpenTeacherLogin: () => void;
  onOpenHowToPlay: () => void;
  onOpenBadges: () => void;
  onLogout: () => void;
  activeView: 'challenges' | 'teacher';
  setActiveView: (view: 'challenges' | 'teacher') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenStudentLogin,
  onOpenTeacherLogin,
  onOpenHowToPlay,
  onOpenBadges,
  onLogout,
  activeView,
  setActiveView,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());

  const handleToggleSound = () => {
    const isMuted = sounds.toggleMute();
    setMuted(isMuted);
  };

  const subLevelInfo = user ? getSubLevelForPoints(user.total_points) : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark with official Semillito character */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveView('challenges')}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-0.5 shadow-xs overflow-hidden">
                <img
                  src={OFFICIAL_SEMILLITO_IMAGE}
                  alt="Semillito STEAM"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                  Plantando Semillas <span className="text-emerald-600">STEAM</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                  Retos de Lógica y Programación
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveView('challenges')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeView === 'challenges' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              <Compass className="w-4 h-4" />
              Retos Educativos
            </button>
            <button
              onClick={onOpenHowToPlay}
              className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Cómo Jugar
            </button>
            <button
              onClick={onOpenBadges}
              className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Subniveles e Insignias
            </button>

            {user?.role === 'teacher' && (
              <button
                onClick={() => setActiveView(activeView === 'teacher' ? 'challenges' : 'teacher')}
                className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-semibold cursor-pointer ${
                  activeView === 'teacher' ? 'text-indigo-600' : 'text-slate-700'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-500" />
                {activeView === 'teacher' ? 'Ver como Alumno' : 'Panel del Profesor'}
              </button>
            )}
          </nav>

          {/* Zone 3: Profile or Login Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleToggleSound}
              title={muted ? 'Activar efectos de sonido' : 'Silenciar sonido'}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              aria-label="Alternar sonido"
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2.5">
                {user.role === 'student' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.alias.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {user.alias}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold tabular-nums leading-none">
                        {user.total_points} pts · {subLevelInfo ? `${subLevelInfo.tierName} Nivel ${subLevelInfo.subLevel}` : `Nivel ${user.current_level}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveView('teacher')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Profesor ({user.alias})</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenStudentLogin}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Acceso Alumnos
                </button>

                <button
                  onClick={onOpenTeacherLogin}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Acceso para el profesor de la academia"
                >
                  Profesor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-100 text-xs overflow-x-auto gap-3">
          <button
            onClick={() => setActiveView('challenges')}
            className={`whitespace-nowrap px-2 py-1 rounded ${
              activeView === 'challenges' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-600'
            }`}
          >
            Retos
          </button>
          <button
            onClick={onOpenHowToPlay}
            className="whitespace-nowrap px-2 py-1 rounded text-slate-600 hover:text-slate-900"
          >
            Cómo Jugar
          </button>
          <button
            onClick={onOpenBadges}
            className="whitespace-nowrap px-2 py-1 rounded text-slate-600 hover:text-slate-900"
          >
            Subniveles
          </button>
          {user?.role === 'teacher' && (
            <button
              onClick={() => setActiveView(activeView === 'teacher' ? 'challenges' : 'teacher')}
              className="whitespace-nowrap px-2 py-1 rounded text-indigo-700 font-bold bg-indigo-50"
            >
              {activeView === 'teacher' ? 'Vista Alumno' : 'Panel Profesor'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
