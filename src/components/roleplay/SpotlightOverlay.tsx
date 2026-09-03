import { useTranslation } from '../../hooks/useTranslation';
﻿import React from 'react';
import { X, Sparkles, Tv } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';

export const SpotlightOverlay: React.FC = () => {
  const { t } = useTranslation();
  const { 
    spotlightHandoutId, 
    setSpotlightHandoutId, 
    handouts, 
    isStreamerMode 
  } = useGameStore();

  if (!spotlightHandoutId) return null;

  const currentHandout = handouts.find((h) => h.id === spotlightHandoutId);
  if (!currentHandout) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in zoom-in-95 select-none">
      
      {/* Cinematic Frame */}
      <div className="relative flex flex-col items-center max-w-4xl max-h-[92vh] bg-slate-950/90 border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden animate-lamp-glow">
        
        {/* Top Header Badge */}
        <div className="w-full flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide">
            <Tv className="w-4 h-4 animate-pulse" />
            <span className="uppercase text-xs">Canlı Yayın Sinematik Görünümü</span>
          </div>

          {/* DM Close Button */}
          {!isStreamerMode && (
            <button
              onClick={() => setSpotlightHandoutId(null)}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>{t('spotlight.close')}</span>
            </button>
          )}
        </div>

        {/* Big Artwork Center */}
        <div className="relative flex-1 w-full max-h-[62vh] overflow-hidden flex items-center justify-center bg-black/80 p-2">
          <img
            src={currentHandout.image}
            alt={currentHandout.title}
            className="max-h-[58vh] max-w-full object-contain rounded-2xl shadow-2xl filter drop-shadow"
          />
        </div>

        {/* Bottom Narration & Story Title */}
        <div className="w-full p-5 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800/80 text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>{currentHandout.category === 'npc' ? 'Karakter / NPC' : currentHandout.category === 'location' ? 'Mekan & Ortam' : 'Ferman / İpucu'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide drop-shadow">
            {currentHandout.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto italic leading-relaxed">
            "{currentHandout.description}"
          </p>
        </div>

      </div>
    </div>
  );
};
