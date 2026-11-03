import React, { useState } from 'react';
import { SEMILLITO_PHRASES, OFFICIAL_SEMILLITO_IMAGE } from '../constants/steam';
import { Sparkles, MessageSquareQuote } from 'lucide-react';
import { sounds } from '../utils/sound';

export const SemillitoMascot: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isWaving, setIsWaving] = useState(false);

  const handleNextPhrase = () => {
    sounds.playClick(600);
    setIsWaving(true);
    setPhraseIndex((prev) => (prev + 1) % SEMILLITO_PHRASES.length);
    setTimeout(() => setIsWaving(false), 500);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-100 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden shadow-xs">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Mascot Avatar using official character */}
      <div className="relative shrink-0">
        <button
          onClick={handleNextPhrase}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-md border-2 border-emerald-300 overflow-hidden p-1 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center justify-center ${
            isWaving ? 'scale-110 rotate-3' : 'hover:scale-105'
          }`}
          title="¡Haz clic en Semillito para escuchar otro consejo!"
        >
          <img
            src={OFFICIAL_SEMILLITO_IMAGE}
            alt="Mascota Semillito"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </button>
        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" />
          Tip
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-800 mb-1">
          <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
          <span>Semillito dice:</span>
          <span className="text-[11px] font-normal text-emerald-600">
            (toca a Semillito para cambiar de consejo)
          </span>
        </div>
        <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-2xl">
          «{SEMILLITO_PHRASES[phraseIndex]}»
        </p>
      </div>

      {/* Quick Action Button */}
      <div className="shrink-0">
        <button
          onClick={handleNextPhrase}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          Siguiente consejo →
        </button>
      </div>
    </div>
  );
};
