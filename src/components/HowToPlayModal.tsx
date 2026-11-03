import React, { useState } from 'react';
import { BookOpen, Lock, Sparkles, Grid, Code2, Compass } from 'lucide-react';
import { OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'semidoku' | 'blocks' | 'minecraft'>('semidoku');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-pop-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 p-1 flex items-center justify-center shrink-0">
            <img
              src={OFFICIAL_SEMILLITO_IMAGE}
              alt="Semillito"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Guía de Retos STEAM
            </h2>
            <p className="text-xs text-slate-500">
              Aprende cómo resolver cada tipo de desafío educativo.
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl mb-5 text-xs font-bold">
          <button
            onClick={() => setTab('semidoku')}
            className={`flex-1 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'semidoku' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Semidoku Clásico
          </button>
          <button
            onClick={() => setTab('minecraft')}
            className={`flex-1 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'minecraft' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            Aventura Minecraft
          </button>
          <button
            onClick={() => setTab('blocks')}
            className={`flex-1 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'blocks' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            Bloques de Código
          </button>
        </div>

        {/* Content Tab 1: Semidoku Clásico */}
        {tab === 'semidoku' && (
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">Regla de Fila Única</h4>
                <p>En cada fila horizontal debe aparecer cada uno de los símbolos exactamente una vez.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">Regla de Columna Única</h4>
                <p>En cada columna vertical, ningún símbolo se puede repetir.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                  Pistas fijas <Lock className="w-3 h-3 text-slate-400" />
                </h4>
                <p>Las casillas con candado no se pueden alterar; son tu punto de partida lógico.</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab 2: Aventura Minecraft */}
        {tab === 'minecraft' && (
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">⛏️</span>
              <div>
                <h4 className="font-bold text-amber-950 mb-0.5">El Tablero Mágico 5×5</h4>
                <p className="text-amber-900">
                  Semillito 🌱, Steve 🧑, Creeper 💚, Alex 🧑🚀 y Enderman 🟪 deben ocupar una sola casilla cada uno. ¡Ningún aventurero puede compartir fila ni columna con otro!
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">🔎</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">Pistas Ordenadas (Paso a Paso)</h4>
                <p>
                  Sigue las 9 pistas del pergamino una por una: cada descubrimiento te ayuda a resolver el siguiente y descartar casillas imposibles.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">🖱️</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">Cómo Colocar y Borrar</h4>
                <p>
                  Selecciona a un aventurero y pulsa en la casilla deseada. Si vuelves a pulsar la misma casilla con ese personaje, ¡se borrará!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab 3: Bloques de Código */}
        {tab === 'blocks' && (
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">🤖</span>
              <div>
                <h4 className="font-bold text-indigo-950 mb-0.5">Pensamiento Computacional</h4>
                <p className="text-indigo-900">
                  Construye un algoritmo conectando bloques lógicos en el orden exacto en el que Semillito debe moverse por el tablero.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">🧱</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">Instrucciones y Bucles</h4>
                <p>
                  Usa «Avanzar», «Girar» y «Recoger Objeto 💎». ¡Aprovecha los bloques de repetición (x2 o x3) para que tu código sea más corto y limpio!
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">▶️</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-0.5">Probar y Enviar</h4>
                <p>
                  Pulsa «Probar Algoritmo» para ver a Semillito caminar paso a paso antes de enviar tu solución al servidor.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            ¡Entendido, vamos a resolver retos!
          </button>
        </div>
      </div>
    </div>
  );
};
