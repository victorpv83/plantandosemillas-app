import React, { useState, useEffect } from 'react';
import { User, Challenge, SubmissionResponse } from './types';
import { api } from './services/api';
import { Navbar, AppView } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentProfile } from './components/StudentProfile';
import { BadgesView } from './components/BadgesView';
import { HowToPlayView } from './components/HowToPlayView';
import { SemidokuGame } from './components/SemidokuGame';
import { BlocklyGame } from './components/BlocklyGame';
import { TeacherPanel } from './components/TeacherPanel';
import { StudentLoginModal } from './components/StudentLoginModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { OFFICIAL_SEMILLITO_IMAGE } from './constants/steam';
import { Sparkles, Trophy, Award, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from './utils/sound';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [activeView, setActiveView] = useState<AppView>('challenges');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [showStudentLogin, setShowStudentLogin] = useState<boolean>(false);
  const [showTeacherLogin, setShowTeacherLogin] = useState<boolean>(false);

  // Celebration destello & gamified reward state
  const [celebrationResult, setCelebrationResult] = useState<SubmissionResponse | null>(null);
  const [showCelebrationFlash, setShowCelebrationFlash] = useState<boolean>(false);

  // Initial session check & challenges fetch
  const refreshData = async () => {
    try {
      const [sessionData, challengesData] = await Promise.all([
        api.checkSession(),
        api.getChallenges(),
      ]);
      setUser(sessionData.user);
      setChallenges(challengesData);
    } catch (err) {
      console.error('Error al inicializar sesión:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStudentLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveView('student');
    refreshData();
  };

  const handleTeacherLoginSuccess = (teacherUser: User) => {
    setUser(teacherUser);
    setActiveView('teacher');
    refreshData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    }
    setUser(null);
    setActiveView('challenges');
    setActiveChallenge(null);
    refreshData();
  };

  const handleChallengeCompleted = async (result: SubmissionResponse) => {
    // 1. Play joyful victory chime
    sounds.playVictory();

    // 2. Confetti cannon bursts
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#eab308'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    }, 220);

    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.7 },
        colors: ['#06b6d4', '#ec4899', '#8b5cf6', '#eab308'],
      });
    }, 420);

    // 3. Trigger screen destello (flash glow effect) and reward modal
    setCelebrationResult(result);
    setShowCelebrationFlash(true);

    // Auto dismiss after 6 seconds if not closed manually
    setTimeout(() => {
      setShowCelebrationFlash(false);
    }, 6000);

    // 4. Update local user points immediately
    if (user) {
      setUser({
        ...user,
        total_points: result.new_total_points,
        current_level: result.new_level,
      });
    }

    // 5. Refresh challenge completion tags
    try {
      const updatedChallenges = await api.getChallenges();
      setChallenges(updatedChallenges);
    } catch (err) {
      console.error('Error refreshing challenges:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 p-2 flex items-center justify-center shadow-md animate-bounce mb-4">
          <img
            src={OFFICIAL_SEMILLITO_IMAGE}
            alt="Semillito"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-base font-extrabold text-slate-800">Plantando Semillas STEAM</div>
        <div className="text-xs text-slate-500 mt-1">Conectando retos con el servidor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        user={user}
        onOpenStudentLogin={() => setShowStudentLogin(true)}
        onOpenTeacherLogin={() => setShowTeacherLogin(true)}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={(v) => {
          setActiveChallenge(null);
          setActiveView(v);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeChallenge ? (
          activeChallenge.type === 'blockly_code' ? (
            <BlocklyGame
              challenge={activeChallenge}
              isStudentLoggedIn={Boolean(user && user.role === 'student')}
              onBack={() => {
                setActiveChallenge(null);
                refreshData();
              }}
              onChallengeCompleted={handleChallengeCompleted}
              onOpenLogin={() => setShowStudentLogin(true)}
            />
          ) : (
            <SemidokuGame
              challenge={activeChallenge}
              isStudentLoggedIn={Boolean(user && user.role === 'student')}
              onBack={() => {
                setActiveChallenge(null);
                refreshData();
              }}
              onChallengeCompleted={handleChallengeCompleted}
              onOpenLogin={() => setShowStudentLogin(true)}
            />
          )
        ) : activeView === 'student' && user ? (
          <StudentProfile
            user={user}
            onLogout={handleLogout}
            onNavigateToChallenges={() => {
              setActiveChallenge(null);
              setActiveView('challenges');
            }}
            onNavigateToBadges={() => {
              setActiveChallenge(null);
              setActiveView('badges');
            }}
          />
        ) : activeView === 'badges' ? (
          <BadgesView
            userPoints={user?.total_points || 0}
            userBadges={(user as any)?.badges || []}
            isLoggedIn={Boolean(user && user.role === 'student')}
            onBack={() => setActiveView('challenges')}
          />
        ) : activeView === 'guide' ? (
          <HowToPlayView
            onBack={() => setActiveView('challenges')}
            onNavigateToChallenges={() => setActiveView('challenges')}
          />
        ) : activeView === 'teacher' && user?.role === 'teacher' ? (
          <TeacherPanel />
        ) : (
          <StudentDashboard
            user={user}
            challenges={challenges}
            onPlayChallenge={(ch) => setActiveChallenge(ch)}
            onOpenBadges={() => setActiveView('badges')}
            onOpenHowToPlay={() => setActiveView('guide')}
            onOpenLogin={() => setShowStudentLogin(true)}
          />
        )}
      </main>

      {/* Auth Modals */}
      <StudentLoginModal
        isOpen={showStudentLogin}
        onClose={() => setShowStudentLogin(false)}
        onLoginSuccess={handleStudentLoginSuccess}
      />

      <TeacherLoginModal
        isOpen={showTeacherLogin}
        onClose={() => setShowTeacherLogin(false)}
        onLoginSuccess={handleTeacherLoginSuccess}
      />

      {/* Gamified Celebration & Destello Screen Flash Overlay */}
      {showCelebrationFlash && celebrationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Radiant screen destello / ambient flash */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 via-amber-300/30 to-teal-400/25 backdrop-blur-[3px] animate-celebration-flash pointer-events-none"
            aria-hidden="true"
          />

          {/* Luminous glowing rings */}
          <div className="absolute w-[520px] h-[520px] sm:w-[720px] sm:h-[720px] rounded-full border-4 border-amber-300/40 animate-glow-ring pointer-events-none" />
          <div className="absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full bg-radial from-amber-200/50 via-emerald-300/20 to-transparent blur-2xl animate-pulse pointer-events-none" />

          {/* Celebratory reward card */}
          <div className="relative z-10 bg-white border-2 border-emerald-400 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-md w-full text-center animate-pop-in">
            <button
              onClick={() => setShowCelebrationFlash(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar celebración"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Semillito Mascot */}
            <div className="w-22 h-22 mx-auto -mt-16 mb-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-400 p-1 shadow-xl transform hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-xl p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={OFFICIAL_SEMILLITO_IMAGE}
                  alt="Semillito"
                  className="w-full h-full object-contain animate-bounce"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              ¡Reto Superado con Éxito!
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-1">
              ¡Genial trabajo!
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {celebrationResult.message || 'Has resuelto el reto demostrando gran ingenio deductivo.'}
            </p>

            {/* Points summary card */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-2xl p-4 border border-emerald-200 mb-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Puntos Ganados
              </div>
              <div className="text-3xl font-black text-emerald-600 tabular-nums">
                +{celebrationResult.earned_points} pts
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-1">
                Puntuación acumulada: {celebrationResult.new_total_points} pts
              </div>
            </div>

            {/* Level up notice if applicable */}
            {celebrationResult.level_up && celebrationResult.sublevel_info && (
              <div className="mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                    ¡Has subido de nivel!
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    {celebrationResult.sublevel_info.title}
                  </div>
                </div>
              </div>
            )}

            {/* Unlocked badges if any */}
            {celebrationResult.new_badges && celebrationResult.new_badges.length > 0 && (
              <div className="mb-4 text-left">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Nuevas insignias conseguidas:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {celebrationResult.new_badges.map((b) => (
                    <span
                      key={b.id || b.code}
                      className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-extrabold flex items-center gap-1 border border-amber-300 shadow-2xs"
                    >
                      <span>{b.icon || '🏅'}</span>
                      <span>{b.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCelebrationFlash(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              ¡Continuar Explorando Retos!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
