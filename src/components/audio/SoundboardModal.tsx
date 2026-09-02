import React from 'react';
import { 
  X, 
  Volume2, 
  Play, 
  Square, 
  CloudRain, 
  Beer, 
  Compass, 
  Swords,
  Sparkles,
  Dices,
  Flame,
  Skull,
  Trophy
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { soundService } from '../../services/soundService';

export const SoundboardModal: React.FC = () => {
  const { 
    isSoundboardOpen, 
    setSoundboardOpen,
    activeAmbientTrack,
    setActiveAmbientTrack,
    ambientVolume,
    setAmbientVolume
  } = useGameStore();

  if (!isSoundboardOpen) return null;

  const handleToggleAmbient = (trackId: string) => {
    if (activeAmbientTrack === trackId) {
      soundService.stopAmbient();
      setActiveAmbientTrack(null);
    } else {
      if (trackId === 'rain') soundService.playRainAmbient();
      else if (trackId === 'tavern') soundService.playTavernAmbient();
      else if (trackId === 'cave') soundService.playCaveAmbient();
      else if (trackId === 'war') soundService.playWarAmbient();
      setActiveAmbientTrack(trackId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <span>Ambiyans & Ses Efektleri</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Canlı Ses Tablosu
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Masaüstü FRP oyun atmosferini güçlendiren zindan sesleri ve efektler.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSoundboardOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 text-xs">
          
          {/* Volume Slider */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Ana Ses Seviyesi</span>
            </span>
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAmbientVolume(val);
                  soundService.setVolume(val);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-amber-400 font-bold w-9 text-right">
                %{Math.round(ambientVolume * 100)}
              </span>
            </div>
          </div>

          {/* AMBIENT TRACKS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sürekli Zindan Ambiyansı (Loop)
              </label>
              {activeAmbientTrack && (
                <button
                  onClick={() => { soundService.stopAmbient(); setActiveAmbientTrack(null); }}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-rose-400" />
                  <span>Sustur</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'rain', name: 'Fırtına & Yağmur', sub: 'Kasvetli ve şimşekli', icon: CloudRain, color: 'from-blue-600/30 to-slate-900' },
                { id: 'tavern', name: 'Taverna & Şömine', sub: 'Sıcak ateş çatırtısı', icon: Beer, color: 'from-amber-600/30 to-slate-900' },
                { id: 'cave', name: 'Karanlık Mağara', sub: 'Derin zindan uğultusu', icon: Compass, color: 'from-purple-600/30 to-slate-900' },
                { id: 'war', name: 'Savaş Davulları', sub: 'Epik savaş ritmi', icon: Swords, color: 'from-rose-600/30 to-slate-900' },
              ].map((t) => {
                const Icon = t.icon;
                const isPlaying = activeAmbientTrack === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleToggleAmbient(t.id)}
                    className={
                      'p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ' +
                      (isPlaying
                        ? 'bg-gradient-to-r ' + t.color + ' border-amber-500 shadow-lg shadow-amber-500/20 scale-102'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700')
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + (isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400')}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{t.name}</div>
                        <div className="text-[9px] text-slate-500">{t.sub}</div>
                      </div>
                    </div>

                    <div className={'w-6 h-6 rounded-full flex items-center justify-center ' + (isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500')}>
                      {isPlaying ? <Square className="w-2.5 h-2.5 fill-slate-950" /> : <Play className="w-2.5 h-2.5 fill-slate-500 ml-0.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INSTANT SFX BUTTONS */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Anlık Ses Efektleri (SFX)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Kılıç Darbesi', icon: Swords, action: () => soundService.playSwordClash(), color: 'bg-rose-950/70 border-rose-800/80 hover:bg-rose-900 text-rose-300' },
                { name: 'Zar Yuvarla', icon: Dices, action: () => soundService.playDiceRoll(), color: 'bg-amber-950/70 border-amber-800/80 hover:bg-amber-900 text-amber-300' },
                { name: 'Büyü Patlaması', icon: Sparkles, action: () => soundService.playMagicSpell(), color: 'bg-blue-950/70 border-blue-800/80 hover:bg-blue-900 text-blue-300' },
                { name: 'Canavar Kükre', icon: Flame, action: () => soundService.playMonsterRoar(), color: 'bg-orange-950/70 border-orange-800/80 hover:bg-orange-900 text-orange-300' },
                { name: 'Kritik Zafer!', icon: Trophy, action: () => soundService.playVictoryFanfare(), color: 'bg-emerald-950/70 border-emerald-800/80 hover:bg-emerald-900 text-emerald-300' },
                { name: 'Kritik Kasvet', icon: Skull, action: () => soundService.playDoomGong(), color: 'bg-purple-950/70 border-purple-800/80 hover:bg-purple-900 text-purple-300' },
              ].map((sfx, idx) => {
                const Icon = sfx.icon;
                return (
                  <button
                    key={idx}
                    onClick={sfx.action}
                    className={'p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ' + sfx.color}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-bold text-[10px] text-center">{sfx.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
