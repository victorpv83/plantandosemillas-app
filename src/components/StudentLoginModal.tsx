import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { UserCheck, Sparkles, Key, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [alias, setAlias] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim() || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.loginStudent(alias, code);
      sounds.playVictory();
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      sounds.playConflict();
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (quickAlias: string, quickCode: string) => {
    setAlias(quickAlias);
    setCode(quickCode);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-pop-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 p-1.5 flex items-center justify-center shadow-md mb-3">
            <img
              src="/assets/aistudio/semillito_fd772bdb.png"
              alt="Semillito"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Acceso Alumnos</h2>
          <p className="text-xs text-slate-500 mt-1">
            Introduce tu alias y tu código personal asignado por tu profesor.
          </p>
        </div>

        {/* Notice about teacher-managed registration */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2.5">
          <span className="text-base shrink-0">🛡️</span>
          <div>
            <span className="font-extrabold text-amber-950">Registro gestionado por el profesor:</span>{' '}
            Los alumnos no pueden autorregistrarse por sí mismos. Si aún no tienes tu alias o código personal, solicítalo a tu profesor de la academia.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tu Alias de Alumno
            </label>
            <input
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej. Lucas"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tu Código Personal
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. ROBO24"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl uppercase tracking-wider font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              No necesitas correo ni contraseña personal.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Entrar a Mis Retos</span>
          </button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Cuentas de demostración preparadas
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('Lucas', 'ROBO24')}
              className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-800">Lucas</div>
              <div className="text-[10px] text-emerald-700 font-mono">ROBO24</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Sofia', 'CHIP77')}
              className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-800">Sofia</div>
              <div className="text-[10px] text-emerald-700 font-mono">CHIP77</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Mateo', 'STEAM10')}
              className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-800">Mateo</div>
              <div className="text-[10px] text-emerald-700 font-mono">STEAM10</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
