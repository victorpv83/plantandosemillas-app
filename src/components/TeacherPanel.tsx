import React, { useState, useEffect } from 'react';
import {
  TeacherDashboardStats,
  StudentDetail,
  Challenge,
  CompletionRecord,
  SymbolsTheme,
  ChallengeCategory,
  ChallengeDifficulty,
  SemidokuGrid,
  Badge,
} from '../types';
import { api } from '../services/api';
import { THEME_SYMBOLS, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import {
  Users,
  Trophy,
  BookOpen,
  CheckCircle2,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  Award,
  Code2,
  Grid,
} from 'lucide-react';

export const TeacherPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'challenges' | 'badges' | 'results'>('stats');
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Student Modals
  const [showCreateStudentModal, setShowCreateStudentModal] = useState<boolean>(false);
  const [newStudentAlias, setNewStudentAlias] = useState<string>('');
  const [newStudentDisplayName, setNewStudentDisplayName] = useState<string>('');
  const [newStudentCode, setNewStudentCode] = useState<string>('');
  const [createdStudentResult, setCreatedStudentResult] = useState<{ alias: string; personal_code: string } | null>(null);

  // Challenge Modals / Builder
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState<boolean>(false);
  const [newType, setNewType] = useState<'semidoku' | 'blockly_code'>('semidoku');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ChallengeCategory>('lógica');
  const [newDifficulty, setNewDifficulty] = useState<ChallengeDifficulty>('Fácil');
  const [newPoints, setNewPoints] = useState<number>(50);
  const [newTimeMin, setNewTimeMin] = useState<number>(10);
  const [newGridSize, setNewGridSize] = useState<number>(5);
  const [newTheme, setNewTheme] = useState<SymbolsTheme>('minecraft');
  const [newSolutionGrid, setNewSolutionGrid] = useState<SemidokuGrid>([]);
  const [newCluesGrid, setNewCluesGrid] = useState<SemidokuGrid>([]);
  const [selectedBuilderCell, setSelectedBuilderCell] = useState<{ r: number; c: number } | null>(null);

  // Blockly challenge builder state
  const [blockRows, setBlockRows] = useState<number>(5);
  const [blockCols, setBlockCols] = useState<number>(5);
  const [blockStartPos, setBlockStartPos] = useState<{ r: number; c: number; dir: 'up' | 'right' | 'down' | 'left' }>({ r: 0, c: 0, dir: 'right' });
  const [blockGoalPos, setBlockGoalPos] = useState<{ r: number; c: number }>({ r: 4, c: 4 });
  const [blockObstacles, setBlockObstacles] = useState<{ r: number; c: number }[]>([{ r: 1, c: 2 }, { r: 2, c: 2 }]);
  const [blockCollectibles, setBlockCollectibles] = useState<{ r: number; c: number }[]>([{ r: 0, c: 3 }]);
  const [blockToolMode, setBlockToolMode] = useState<'start' | 'goal' | 'obstacle' | 'gem' | 'clear'>('obstacle');

  // New Badge Form
  const [showCreateBadgeModal, setShowCreateBadgeModal] = useState<boolean>(false);
  const [badgeCode, setBadgeCode] = useState<string>('');
  const [badgeName, setBadgeName] = useState<string>('');
  const [badgeDescription, setBadgeDescription] = useState<string>('');
  const [badgeIcon, setBadgeIcon] = useState<string>('⭐');
  const [badgeCategory, setBadgeCategory] = useState<string>('logro');

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, studentsData, challengesData, completionsData, badgesData] = await Promise.all([
        api.getTeacherStats(),
        api.getTeacherStudents(),
        api.getTeacherChallenges(),
        api.getTeacherCompletions(),
        api.getTeacherBadges(),
      ]);
      setStats(statsData);
      setStudents(studentsData);
      setChallenges(challengesData);
      setCompletions(completionsData);
      setBadges(badgesData);
    } catch (err: any) {
      setStatusMessage(`Error al cargar datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize new challenge template grids
  const initChallengeGrids = (size: number, theme: SymbolsTheme) => {
    const syms = THEME_SYMBOLS[theme].slice(0, size);
    const sol: SemidokuGrid = [];
    const clues: SemidokuGrid = [];

    for (let r = 0; r < size; r++) {
      const solRow: (string | null)[] = [];
      const clueRow: (string | null)[] = [];
      for (let c = 0; c < size; c++) {
        const sym = syms[(r + c) % size].id;
        solRow.push(sym);
        if ((r + c) % 2 === 0) {
          clueRow.push(sym);
        } else {
          clueRow.push(null);
        }
      }
      sol.push(solRow);
      clues.push(clueRow);
    }

    setNewSolutionGrid(sol);
    setNewCluesGrid(clues);
    setSelectedBuilderCell({ r: 0, c: 0 });
  };

  const handleOpenCreateChallenge = () => {
    setNewType('semidoku');
    setNewTitle('Semidoku 5×5 Nuevo Desafío');
    setNewDescription('Nuevo reto de pensamiento computacional para los alumnos de la academia.');
    setNewCategory('lógica');
    setNewDifficulty('Medio');
    setNewPoints(60);
    setNewTimeMin(12);
    setNewGridSize(5);
    setNewTheme('minecraft');
    initChallengeGrids(5, 'minecraft');
    setShowCreateChallengeModal(true);
  };

  const toggleClueCell = (r: number, c: number) => {
    const newClues = newCluesGrid.map((row) => [...row]);
    if (newClues[r][c] !== null) {
      newClues[r][c] = null;
    } else {
      newClues[r][c] = newSolutionGrid[r][c];
    }
    setNewCluesGrid(newClues);
  };

  const setBuilderCellSymbol = (symbolId: string) => {
    if (!selectedBuilderCell) return;
    const { r, c } = selectedBuilderCell;
    const newSol = newSolutionGrid.map((row) => [...row]);
    newSol[r][c] = symbolId;
    setNewSolutionGrid(newSol);

    if (newCluesGrid[r] && newCluesGrid[r][c] !== null) {
      const newClues = newCluesGrid.map((row) => [...row]);
      newClues[r][c] = symbolId;
      setNewCluesGrid(newClues);
    }
  };

  const handleSaveChallenge = async () => {
    try {
      await api.createChallenge({
        title: newTitle,
        description: newDescription,
        type: newType,
        category: newCategory,
        difficulty: newDifficulty,
        points: newPoints,
        estimated_time_min: newTimeMin,
        grid_size: newGridSize,
        symbols_theme: newTheme,
        is_published: true,
        clues_grid: newType === 'semidoku' ? newCluesGrid : [],
        solution_grid: newType === 'semidoku' ? newSolutionGrid : [],
        block_config:
          newType === 'blockly_code'
            ? {
                gridRows: blockRows,
                gridCols: blockCols,
                startPos: blockStartPos,
                goalPos: blockGoalPos,
                obstacles: blockObstacles,
                collectibles: blockCollectibles,
              }
            : undefined,
      });

      setShowCreateChallengeModal(false);
      setStatusMessage('¡Reto creado con éxito y publicado para los alumnos!');
      loadData();
    } catch (err: any) {
      alert(`Error al crear el reto: ${err.message}`);
    }
  };

  const handleTogglePublish = async (ch: Challenge) => {
    try {
      await api.updateChallenge(ch.id, { is_published: !ch.is_published });
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este reto permanentemente?')) return;
    try {
      await api.deleteChallenge(id);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentAlias.trim()) return;

    try {
      const res = await api.createStudent(newStudentAlias, newStudentDisplayName, newStudentCode || undefined);
      setCreatedStudentResult({ alias: res.alias, personal_code: res.personal_code });
      setNewStudentAlias('');
      setNewStudentDisplayName('');
      setNewStudentCode('');
      loadData();
    } catch (err: any) {
      alert(`Error al crear el alumno: ${err.message}`);
    }
  };

  const handleResetStudentCode = async (studentId: string) => {
    try {
      const res = await api.updateStudent(studentId, { new_code: '' });
      alert(`Nuevo código personal generado: ${res.new_personal_code}`);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleStudentActive = async (student: StudentDetail) => {
    try {
      await api.updateStudent(student.id, { is_active: !student.is_active });
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Create Badge Handler
  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeName.trim() || !badgeDescription.trim()) return;

    try {
      await api.createBadge({
        code: badgeCode || `badge_${Date.now()}`,
        name: badgeName,
        description: badgeDescription,
        icon: badgeIcon || '⭐',
        category: badgeCategory,
      });
      setShowCreateBadgeModal(false);
      setBadgeName('');
      setBadgeDescription('');
      setBadgeCode('');
      setStatusMessage('¡Insignia añadida correctamente al catálogo!');
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm('¿Eliminar esta insignia del catálogo?')) return;
    try {
      await api.deleteBadge(badgeId);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Export Results to CSV
  const handleExportCSV = () => {
    if (!completions.length) {
      alert('No hay registros de retos completados para exportar.');
      return;
    }

    const headers = ['Fecha y Hora', 'Alumno (Alias)', 'Reto Completado', 'Puntos Otorgados', 'Intentos'];
    const rows = completions.map((c) => [
      `"${c.completed_at}"`,
      `"${c.student_alias}"`,
      `"${c.challenge_title.replace(/"/g, '""')}"`,
      c.points_awarded,
      c.attempts,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `plantando_semillas_resultados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header of Teacher Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 p-1 flex items-center justify-center shrink-0">
            <img
              src={OFFICIAL_SEMILLITO_IMAGE}
              alt="Semillito"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Panel de Administración · Profesor</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Academia STEAM
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Administra cuentas de alumnos, diseña retos (Semidokus o Bloques), gestiona insignias y supervisa el progreso.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar datos
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center justify-between animate-pop-in">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Resumen General
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Alumnos ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'challenges'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Retos Educativos ({challenges.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Insignias ({badges.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Resultados ({completions.length})
        </button>
      </div>

      {/* TAB 1: Resumen */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Alumnos Registrados</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {stats.total_students}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                {stats.active_students} activos en el sistema
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Retos Publicados</span>
                <BookOpen className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {stats.published_challenges}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Semidokus y Bloques
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Retos Completados</span>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {stats.total_completions}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Validaciones autoritativas
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Insignias Totales</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {badges.length}
              </div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">
                Catálogo ampliable
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Actividad Reciente en la Plataforma
            </h3>

            {stats.recent_activity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recent_activity.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        {act.student_alias.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {act.student_alias} completó <span className="text-emerald-700">{act.challenge_title}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {new Date(act.completed_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-extrabold text-emerald-600 tabular-nums">
                      +{act.points} pts
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Aún no hay actividad reciente registrada.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Gestión de Alumnos */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Listado de Alumnos</h2>
              <p className="text-xs text-slate-500">
                Subniveles progresivos (Nivel 3, Nivel 2 y Nivel 1) y gestión de códigos personales.
              </p>
            </div>
            <button
              onClick={() => {
                setCreatedStudentResult(null);
                setShowCreateStudentModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Alumno
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Alias</th>
                    <th className="py-3.5 px-4">Nombre / Grupo</th>
                    <th className="py-3.5 px-4">Puntos</th>
                    <th className="py-3.5 px-4">Subnivel</th>
                    <th className="py-3.5 px-4">Retos</th>
                    <th className="py-3.5 px-4">Tiempo Est.</th>
                    <th className="py-3.5 px-4">Insignias</th>
                    <th className="py-3.5 px-4">Última Conexión</th>
                    <th className="py-3.5 px-4">Fecha Alta</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {st.alias}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {st.display_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 tabular-nums">
                        {st.total_points}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {st.sublevel_info?.title || `Nivel ${st.current_level}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 tabular-nums">
                        {st.completed_challenges_count}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 tabular-nums font-mono">
                        {(st.completed_challenges_count || 0) * 12} min
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 tabular-nums">
                        {st.badges_count || 0}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {st.last_login_at ? new Date(st.last_login_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {st.created_at ? new Date(st.created_at).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {st.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleResetStudentCode(st.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Generar un nuevo código personal para este alumno"
                        >
                          Resetear Código
                        </button>
                        <button
                          onClick={() => handleToggleStudentActive(st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            st.is_active
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {st.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Gestión de Retos */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Listado de Retos</h2>
              <p className="text-xs text-slate-500">
                Semidokus (cuadrículas y lógica deductiva) y Programación por Bloques.
              </p>
            </div>
            <button
              onClick={handleOpenCreateChallenge}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Crear Nuevo Reto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((ch) => (
              <div
                key={ch.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-emerald-700 uppercase flex items-center gap-1">
                      {ch.type === 'blockly_code' ? <Code2 className="w-3.5 h-3.5 text-indigo-600" /> : <Grid className="w-3.5 h-3.5 text-emerald-600" />}
                      {ch.type === 'blockly_code' ? 'Bloques' : 'Semidoku'} · {ch.difficulty}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ch.is_published
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ch.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{ch.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-3">{ch.description}</p>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div>
                      <strong>Categoría:</strong> {ch.category}
                    </div>
                    <div>
                      <strong>Puntos otorgados:</strong> +{ch.points} pts
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePublish(ch)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {ch.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {ch.is_published ? 'Despublicar' : 'Publicar'}
                  </button>

                  <button
                    onClick={() => handleDeleteChallenge(ch.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar reto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Gestión de Insignias Ampliables */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Catálogo de Insignias</h2>
              <p className="text-xs text-slate-500">
                Insignias que los alumnos desbloquean por logros. Puedes añadir nuevas insignias personalizadas cuando lo desees.
              </p>
            </div>
            <button
              onClick={() => setShowCreateBadgeModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Insignia
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((b) => (
              <div
                key={b.id || b.code}
                className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{b.icon || '🏅'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {b.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{b.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{b.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-mono">{b.code}</span>
                  <button
                    onClick={() => handleDeleteBadge(b.id)}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    title="Eliminar insignia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Resultados */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Historial de Resoluciones</h2>
              <p className="text-xs text-slate-500">
                Auditoría completa de retos completados por cada alumno con fecha y puntos acreditados.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Informe CSV
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Alumno</th>
                    <th className="py-3 px-4">Reto</th>
                    <th className="py-3 px-4">Puntos Sumados</th>
                    <th className="py-3 px-4">Intentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completions.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {new Date(comp.completed_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {comp.student_alias}
                      </td>
                      <td className="py-3 px-4 text-emerald-800 font-medium">
                        {comp.challenge_title}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600 tabular-nums">
                        +{comp.points_awarded} pts
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {comp.attempts}
                      </td>
                    </tr>
                  ))}
                  {completions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Aún no hay resoluciones registradas en la base de datos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Badge Modal */}
      {showCreateBadgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-pop-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Crear Nueva Insignia STEAM</h3>
              <button
                onClick={() => setShowCreateBadgeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBadge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Insignia *</label>
                <input
                  type="text"
                  required
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder="Ej. Explorador Espacial"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Logro *</label>
                <textarea
                  required
                  rows={2}
                  value={badgeDescription}
                  onChange={(e) => setBadgeDescription(e.target.value)}
                  placeholder="Ej. Superó el reto de algoritmos en el menor número de pasos."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Icono / Emoji *</label>
                  <input
                    type="text"
                    required
                    value={badgeIcon}
                    onChange={(e) => setBadgeIcon(e.target.value)}
                    placeholder="Ej. 🚀, 💎, 🤖, ⭐"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={badgeCategory}
                    onChange={(e) => setBadgeCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="logro">Logro General</option>
                    <option value="lógica">Lógica & Semidoku</option>
                    <option value="programación">Programación</option>
                    <option value="robótica">Robótica</option>
                    <option value="aventura">Aventura</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBadgeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Insignia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-pop-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Alumno</h3>
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createdStudentResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <div className="text-xs font-semibold text-emerald-800 mb-1">
                    ¡Alumno creado con éxito!
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mb-3">
                    {createdStudentResult.alias}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs">
                    <div className="text-slate-500 mb-1">Código personal de acceso:</div>
                    <div className="text-2xl font-black text-emerald-700 tracking-wider">
                      {createdStudentResult.personal_code}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Entrega este código al alumno para que pueda ingresar a la plataforma.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCreatedStudentResult(null);
                    setShowCreateStudentModal(false);
                  }}
                  className="w-full py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Entendido y Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alias del Alumno (Único) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentAlias}
                    onChange={(e) => setNewStudentAlias(e.target.value)}
                    placeholder="Ej. Lucas, Valentina, Mateo"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre o Nota de Grupo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newStudentDisplayName}
                    onChange={(e) => setNewStudentDisplayName(e.target.value)}
                    placeholder="Ej. Lucas M. - Grupo Robótica Martes"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Personal Personalizado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value.toUpperCase())}
                    placeholder="Déjalo vacío para auto-generar uno seguro"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl uppercase font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateStudentModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Guardar Alumno
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Challenge Creator Modal */}
      {showCreateChallengeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Diseñador de Retos STEAM</h3>
                <p className="text-xs text-slate-500">
                  Crea Semidokus de lógica o retos de programación por bloques.
                </p>
              </div>
              <button
                onClick={() => setShowCreateChallengeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Reto *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="semidoku">Semidoku (Cuadrícula Lógica)</option>
                    <option value="blockly_code">Programación por Bloques (Laberinto)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Título del reto *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="lógica">Lógica</option>
                    <option value="programación">Programación</option>
                    <option value="robótica">Robótica</option>
                    <option value="electrónica">Electrónica</option>
                    <option value="steam">STEAM</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dificultad</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Medio">Medio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Puntos STEAM</label>
                  <input
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Temática</label>
                  <select
                    value={newTheme}
                    onChange={(e) => {
                      const th = e.target.value as SymbolsTheme;
                      setNewTheme(th);
                      initChallengeGrids(newGridSize, th);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="minecraft">Aventura Minecraft</option>
                    <option value="robotics">Robots & Chips</option>
                    <option value="circuits">Circuitos</option>
                    <option value="nature_steam">Naturaleza STEAM</option>
                    <option value="planets">Planetas & Espacio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs">Descripción pedagógica</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Semidoku grid builder */}
              {newType === 'semidoku' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-slate-800">
                      Matriz de Solución & Pistas (Haz clic en una casilla para seleccionarla)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Casillas con candado <Lock className="w-3 h-3 inline text-amber-600" /> = Pistas fijas para el alumno
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                    <div
                      className="inline-grid gap-1.5 p-2 bg-slate-800 rounded-2xl border-2 border-slate-700"
                      style={{ gridTemplateColumns: `repeat(${newGridSize}, minmax(0, 1fr))` }}
                    >
                      {newSolutionGrid.map((row, r) =>
                        row.map((val, c) => {
                          const isClue = newCluesGrid[r] && newCluesGrid[r][c] !== null;
                          const isSelected = selectedBuilderCell?.r === r && selectedBuilderCell?.c === c;
                          const sym = THEME_SYMBOLS[newTheme].find((s) => s.id === val);

                          return (
                            <div
                              key={`${r}-${c}`}
                              onClick={() => setSelectedBuilderCell({ r, c })}
                              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center relative cursor-pointer font-bold text-lg transition-all ${
                                isSelected
                                  ? 'ring-2 ring-emerald-400 bg-white scale-105 z-10'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <span className="text-lg leading-none">{sym?.symbolChar || '·'}</span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleClueCell(r, c);
                                }}
                                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow-xs ${
                                  isClue ? 'bg-amber-400 text-amber-950 font-bold' : 'bg-slate-300 text-slate-600'
                                }`}
                                title={isClue ? 'Pista fija' : 'Oculto'}
                              >
                                {isClue ? 'P' : '·'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-semibold text-slate-600">
                        Asignar símbolo:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {THEME_SYMBOLS[newTheme].slice(0, newGridSize).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setBuilderCellSymbol(s.id)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${s.bgClass} ${s.borderClass} ${s.textClass}`}
                          >
                            <span>{s.symbolChar}</span>
                            <span>{s.label}</span>
                          </button>
                        ))}
                      </div>

                      {selectedBuilderCell && (
                        <button
                          type="button"
                          onClick={() => toggleClueCell(selectedBuilderCell.r, selectedBuilderCell.c)}
                          className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer self-start"
                        >
                          {newCluesGrid[selectedBuilderCell.r]?.[selectedBuilderCell.c] !== null ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              Quitar pista fija
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              Marcar como pista fija
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Blockly Maze Builder */}
              {newType === 'blockly_code' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">
                        Editor Visual del Escenario de Navegación
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Selecciona una herramienta y haz clic en las casillas para colocar la salida, meta, obstáculos o gemas.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Filas:</label>
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={blockRows}
                        onChange={(e) => setBlockRows(Math.max(3, Math.min(7, Number(e.target.value))))}
                        className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs"
                      />
                      <label className="text-[11px] font-semibold text-slate-600">Cols:</label>
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={blockCols}
                        onChange={(e) => setBlockCols(Math.max(3, Math.min(7, Number(e.target.value))))}
                        className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs"
                      />
                    </div>
                  </div>

                  {/* Tool Palette */}
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1">Herramienta:</span>

                    <button
                      type="button"
                      onClick={() => setBlockToolMode('start')}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        blockToolMode === 'start'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🚀</span>
                      <span>Salida Robot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockToolMode('goal')}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        blockToolMode === 'goal'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏁</span>
                      <span>Meta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockToolMode('obstacle')}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        blockToolMode === 'obstacle'
                          ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>🪨</span>
                      <span>Roca (Obstáculo)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockToolMode('gem')}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        blockToolMode === 'gem'
                          ? 'bg-cyan-500 text-white border-cyan-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>💎</span>
                      <span>Gema (Coleccionable)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockToolMode('clear')}
                      className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        blockToolMode === 'clear'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>⬜</span>
                      <span>Vaciar</span>
                    </button>

                    {/* Start direction select */}
                    <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span>Mirar hacia:</span>
                      <select
                        value={blockStartPos.dir}
                        onChange={(e) => setBlockStartPos({ ...blockStartPos, dir: e.target.value as any })}
                        className="px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold"
                      >
                        <option value="right">Derecha 👉</option>
                        <option value="down">Abajo 👇</option>
                        <option value="left">Izquierda 👈</option>
                        <option value="up">Arriba 👆</option>
                      </select>
                    </div>
                  </div>

                  {/* Interactive Visual Grid */}
                  <div className="flex justify-center p-3 bg-slate-800 rounded-2xl border-2 border-slate-700">
                    <div
                      className="inline-grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${blockCols}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: blockRows }).map((_, r) =>
                        Array.from({ length: blockCols }).map((_, c) => {
                          const isStart = blockStartPos.r === r && blockStartPos.c === c;
                          const isGoal = blockGoalPos.r === r && blockGoalPos.c === c;
                          const isObs = blockObstacles.some((o) => o.r === r && o.c === c);
                          const isGem = blockCollectibles.some((g) => g.r === r && g.c === c);

                          const handleCellClick = () => {
                            if (blockToolMode === 'start') {
                              setBlockStartPos({ ...blockStartPos, r, c });
                              setBlockObstacles(blockObstacles.filter((o) => !(o.r === r && o.c === c)));
                              setBlockCollectibles(blockCollectibles.filter((g) => !(g.r === r && g.c === c)));
                            } else if (blockToolMode === 'goal') {
                              setBlockGoalPos({ r, c });
                              setBlockObstacles(blockObstacles.filter((o) => !(o.r === r && o.c === c)));
                              setBlockCollectibles(blockCollectibles.filter((g) => !(g.r === r && g.c === c)));
                            } else if (blockToolMode === 'obstacle') {
                              if (!isStart && !isGoal) {
                                if (isObs) {
                                  setBlockObstacles(blockObstacles.filter((o) => !(o.r === r && o.c === c)));
                                } else {
                                  setBlockObstacles([...blockObstacles, { r, c }]);
                                  setBlockCollectibles(blockCollectibles.filter((g) => !(g.r === r && g.c === c)));
                                }
                              }
                            } else if (blockToolMode === 'gem') {
                              if (!isStart && !isGoal) {
                                if (isGem) {
                                  setBlockCollectibles(blockCollectibles.filter((g) => !(g.r === r && g.c === c)));
                                } else {
                                  setBlockCollectibles([...blockCollectibles, { r, c }]);
                                  setBlockObstacles(blockObstacles.filter((o) => !(o.r === r && o.c === c)));
                                }
                              }
                            } else if (blockToolMode === 'clear') {
                              setBlockObstacles(blockObstacles.filter((o) => !(o.r === r && o.c === c)));
                              setBlockCollectibles(blockCollectibles.filter((g) => !(g.r === r && g.c === c)));
                            }
                          };

                          return (
                            <button
                              key={`block-${r}-${c}`}
                              type="button"
                              onClick={handleCellClick}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-transform hover:scale-105 cursor-pointer relative shadow-xs ${
                                isStart
                                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                                  : isGoal
                                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200'
                                  : isObs
                                  ? 'bg-slate-700 text-slate-200 border border-slate-600'
                                  : isGem
                                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                              }`}
                              title={`Casilla (${r}, ${c})`}
                            >
                              {isStart && '🌱'}
                              {isGoal && '🏁'}
                              {isObs && '🪨'}
                              {isGem && '💎'}
                              {!isStart && !isGoal && !isObs && !isGem && (
                                <span className="text-[10px] text-slate-300 select-none">
                                  {r},{c}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>
                      🌱 Salida: ({blockStartPos.r}, {blockStartPos.c}) · 🏁 Meta: ({blockGoalPos.r}, {blockGoalPos.c})
                    </span>
                    <span>
                      🪨 {blockObstacles.length} obstáculos · 💎 {blockCollectibles.length} gemas
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChallengeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveChallenge}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Guardar y Publicar Reto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
