import React, { useState } from 'react';
import {
  Grid,
  Code2,
  Lock,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Compass,
  Play,
  Repeat,
} from 'lucide-react';
import { OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';

interface HowToPlayViewProps {
  onBack: () => void;
  onNavigateToChallenges: () => void;
}

export const HowToPlayView: React.FC<HowToPlayViewProps> = ({
  onBack,
  onNavigateToChallenges,
}) => {
  const [activeTab, setActiveTab] = useState<'semidoku' | 'blocks'>('semidoku');

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

        <button
          onClick={onNavigateToChallenges}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>Ir a Resolver Retos</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 shadow-md">
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
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Manual del Alumno STEAM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Guía de Retos y Cómo Jugar
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Descubre las mecánicas completas de los desafíos lógicos de <strong>Semidoku</strong> y los retos de <strong>Programación con Bloques de Algoritmos</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('semidoku')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'semidoku'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Semidoku (Lógica y Deducción)</span>
        </button>

        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'blocks'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Programación con Bloques (Algoritmos)</span>
        </button>
      </div>

      {/* TAB 1: Semidoku */}
      {activeTab === 'semidoku' && (
        <div className="space-y-6">
          {/* Rules Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-base mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Regla de Fila Única
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada personaje ocupa una sola casilla. En cada fila horizontal no puede haber ningún otro personaje repetido.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-base mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Regla de Columna Única
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                De la misma manera, en cada columna vertical ningún personaje puede coincidir con otro en la misma línea vertical.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-base mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Elementos Fijos Especiales
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                En retos como el <em>Castillo Encantado</em> o <em>Laboratorio Secreto</em>, el gato negro 🐈 y el murciélago 🦇 están fijos y <strong>no cuentan para las restricciones de fila ni columna</strong>.
              </p>
            </div>
          </div>

          {/* How to solve step by step */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Cómo Resolver un Semidoku Paso a Paso</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0">📜</span>
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Lee las Pistas en Orden</h4>
                  <p>
                    Las pistas están diseñadas secuencialmente: cada respuesta te ayudará con la siguiente pista. Por ejemplo, al saber la fila o columna de un personaje, ya puedes descartar el resto de casillas de esa fila y columna.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0">🖱️</span>
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Colocar y Borrar en el Tablero</h4>
                  <p>
                    1. En la parte inferior verás la paleta con los personajes del reto. Haz clic en el personaje que quieras colocar.<br />
                    2. Pulsa en la casilla del tablero donde deba ubicarse.<br />
                    3. Si necesitas borrar una casilla, selecciónala o vuelve a pulsar sobre ella para dejarla vacía.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0">✅</span>
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Comprobar Solución</h4>
                  <p>
                    Cuando tengas colocados a todos los personajes requeridos, pulsa el botón verde <strong>«Comprobar Solución»</strong>. El sistema verificará de forma autoritativa que cumpla todas las pistas y no haya colisiones de fila ni columna.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Programación con Bloques */}
      {activeTab === 'blocks' && (
        <div className="space-y-6">
          {/* Blocks Overview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Pensamiento Computacional y Algoritmos</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              En los retos de programación no juegas colocando casillas: construyes una secuencia de instrucciones (un algoritmo) para que el robot Semillito navegue por el escenario desde su casilla inicial hasta la meta.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl">
                <div className="text-lg font-black text-indigo-950 mb-1 flex items-center gap-2">
                  <span>⬆️</span> Avanzar
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Mueve a Semillito un paso hacia adelante en la dirección a la que esté apuntando.
                </p>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
                <div className="text-lg font-black text-blue-950 mb-1 flex items-center gap-2">
                  <span>↷</span> Girar Derecha
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Gira 90 grados a la derecha en el sentido de las agujas del reloj, sin avanzar de casilla.
                </p>
              </div>

              <div className="p-4 bg-cyan-50/60 border border-cyan-200/80 rounded-2xl">
                <div className="text-lg font-black text-cyan-950 mb-1 flex items-center gap-2">
                  <span>↶</span> Girar Izquierda
                </div>
                <p className="text-xs text-cyan-900 leading-relaxed">
                  Gira 90 grados a la izquierda en sentido antihorario, cambiando su orientación.
                </p>
              </div>

              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
                <div className="text-lg font-black text-amber-950 mb-1 flex items-center gap-2">
                  <span>💎</span> Recoger Gema
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Recoge el cristal o gema coleccionable cuando Semillito está situado sobre su misma casilla.
                </p>
              </div>

              <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl">
                <div className="text-lg font-black text-purple-950 mb-1 flex items-center gap-2">
                  <span>🔁</span> Repetir (Bucle)
                </div>
                <p className="text-xs text-purple-900 leading-relaxed">
                  Permite anidar instrucciones para ejecutarlas 2, 3 o más veces, ahorrando bloques de código.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                <div className="text-lg font-black text-emerald-950 mb-1 flex items-center gap-2">
                  <span>🏁</span> Casilla Meta
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Semillito debe finalizar su recorrido exactamente sobre la bandera de meta tras recoger todas las gemas.
                </p>
              </div>
            </div>
          </div>

          {/* Practical Tips */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              <span>Probar Algoritmo vs Comprobar Solución</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-slate-600" />
                  Botón «Probar Algoritmo»
                </h4>
                <p className="leading-relaxed">
                  Puedes probar tu algoritmo tantas veces como quieras sin penalización. Verás al robot avanzar paso a paso, lo que te permite depurar errores y observar si choca contra rocas 🪨 o se sale del tablero.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <h4 className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Botón «Comprobar Solución»
                </h4>
                <p className="text-emerald-900 leading-relaxed">
                  Solo visible cuando estás conectado con tu cuenta de alumno. Valida oficialmente la solución con el servidor, otorga los puntos del reto y desbloquea insignias STEAM.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
