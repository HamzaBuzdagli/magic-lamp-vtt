import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  Square, 
  CloudRain, 
  Beer, 
  Compass, 
  Swords,
  Sparkles,
  Flame,
  Skull,
  Trophy,
  Plus,
  Trash2,
  Music,
  Upload
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { soundService } from '../../services/soundService';

export const SoundboardModal: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isSoundboardOpen, 
    setSoundboardOpen,
    activeAmbientTrack,
    setActiveAmbientTrack,
    ambientVolume,
    setAmbientVolume,
    customSoundTracks,
    addCustomSoundTrack,
    deleteCustomSoundTrack,
    isStreamerMode
  } = useGameStore();

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  if (!isSoundboardOpen) return null;

  const isDm = !isStreamerMode;

  const handleToggleAmbient = (trackId: string) => {
    if (activeAmbientTrack === trackId) {
      soundService.stopAmbient();
      setActiveAmbientTrack(null);
    } else {
      soundService.playTrackById(trackId, customSoundTracks);
      setActiveAmbientTrack(trackId);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        addCustomSoundTrack({
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'ambient',
          url: base64Url,
          icon: '🎵'
        });
        setIsAddingCustom(false);
        setCustomName('');
        setCustomUrl('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddUrlSound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customUrl.trim()) return;

    addCustomSoundTrack({
      name: customName.trim(),
      category: 'ambient',
      url: customUrl.trim(),
      icon: '🎵'
    });

    setIsAddingCustom(false);
    setCustomName('');
    setCustomUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <span>{t('sound.title')}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t('sound.liveTag')}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {t('sound.desc')}
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Volume Slider */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>{t('sound.masterVolume')}</span>
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
                {t('sound.loopTitle')}
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUSTOM SOUNDS & DM UPLOAD SECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>{t('sound.customTitle')}</span>
              </label>

              {isDm && !isAddingCustom && (
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('sound.addCustom')}</span>
                </button>
              )}
            </div>

            {/* Custom Sound Adder Form */}
            {isAddingCustom && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/50 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">Yeni Ses veya Müzik Ekle:</span>
                  <button onClick={() => setIsAddingCustom(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block p-3 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl text-center cursor-pointer bg-slate-900 transition-colors">
                    <Upload className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                    <span className="font-bold text-slate-300 block">{t('sound.uploadAudio')}</span>
                    <span className="text-[10px] text-slate-500">Ses dosyası seçin</span>
                    <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <div className="text-center text-[10px] text-slate-500 font-bold">{t('sound.orUrl')}</div>

                  <form onSubmit={handleAddUrlSound} className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="{t('sound.soundNamePlaceholder')}"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-bold"
                    />
                    <input
                      type="url"
                      placeholder="Ses URL'si (http://...mp3)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!customName.trim() || !customUrl.trim()}
                      className="w-full py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 cursor-pointer disabled:opacity-50"
                    >
                      {t('sound.saveUrl')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Custom Sound Tracks List */}
            {customSoundTracks.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {customSoundTracks.map((track) => {
                  const isPlaying = activeAmbientTrack === track.id;
                  return (
                    <div
                      key={track.id}
                      className={
                        'p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ' +
                        (isPlaying
                          ? 'bg-gradient-to-r from-amber-600/30 to-slate-900 border-amber-500 shadow-md scale-101'
                          : 'bg-slate-950 border-slate-800')
                      }
                    >
                      <button
                        onClick={() => handleToggleAmbient(track.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <div className={'w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ' + (isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400')}>
                          🎵
                        </div>
                        <span className="font-bold text-slate-200 truncate text-xs">{track.name}</span>
                      </button>

                      {isDm && (
                        <button
                          onClick={() => deleteCustomSoundTrack(track.id)}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded-lg cursor-pointer"
                          title="Sesi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-3 text-slate-600 text-[11px] bg-slate-950 rounded-xl border border-slate-800">
                {t('sound.noCustom')}
              </div>
            )}
          </div>

          {/* ONE-SHOT SFX */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('sound.sfxTitle')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Kılıç & Çarpışma', icon: Swords, fn: () => soundService.playSwordSound() },
                { name: 'Büyü Patlaması', icon: Sparkles, fn: () => soundService.playMagicSound() },
                { name: 'Meşale Ateşi', icon: Flame, fn: () => soundService.playTorchSound() },
                { name: 'Canavar Kükremesi', icon: Skull, fn: () => soundService.playMonsterSound() },
                { name: 'Zafer Fanfarı', icon: Trophy, fn: () => soundService.playVictorySound() },
                { name: 'Zar Yuvarlanışı', icon: Volume2, fn: () => soundService.playDiceSound() },
              ].map((sfx, idx) => {
                const Icon = sfx.icon;
                return (
                  <button
                    key={idx}
                    onClick={sfx.fn}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                    <span className="font-bold text-slate-300 text-[10px] leading-tight">{sfx.name}</span>
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
