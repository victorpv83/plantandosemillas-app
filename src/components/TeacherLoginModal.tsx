import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('profesor');
  const [password, setPassword] = useState('STEAMprofesor2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.loginTeacher(username, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Credenciales de profesor incorrectas.');
    } finally {
      setLoading(false);
    }
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 p-1.5 flex items-center justify-center shadow-md mb-3">
            <img
              src="/assets/aistudio/semillito_fd772bdb.png"
              alt="Semillito"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Acceso Profesor</h2>
          <p className="text-xs text-slate-500 mt-1">
            Panel privado de gestión de alumnos, retos y estadísticas del aula.
          </p>
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
              Usuario del Profesor
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Entrar al Panel de Control</span>
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 text-center">
          Credencial inicial de demostración: <br />
          <strong className="text-slate-800">profesor</strong> / <strong className="text-slate-800">STEAMprofesor2026!</strong>
        </div>
      </div>
    </div>
  );
};
