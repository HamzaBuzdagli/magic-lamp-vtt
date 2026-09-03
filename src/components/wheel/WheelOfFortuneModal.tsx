import { useTranslation } from '../../hooks/useTranslation';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Sparkles, 
  RotateCw, 
  Plus, 
  Trash2, 
  Layers, 
  Trophy,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../hooks/useGameStore';
import type { WheelSlice } from '../../types/game';

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export const WheelOfFortuneModal: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isWheelModalOpen, 
    setWheelModalOpen, 
    wheelPresets, 
    activeWheelPresetId, 
    setActiveWheelPresetId,
    addWheelPreset,
    updateWheelPreset,
    deleteWheelPreset,
    triggerWheelSpin,
    activeSpinEvent,
    isStreamerMode 
  } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentAngle, setCurrentAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerSlice, setWinnerSlice] = useState<WheelSlice | null>(null);
  const [newSliceText, setNewSliceText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPresets = (wheelPresets || []).filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.title.toLowerCase().includes(q) || p.slices.some((s) => s.text.toLowerCase().includes(q));
  });

  const activePreset = wheelPresets.find((p) => p.id === activeWheelPresetId) || wheelPresets[0];

  // Draw the Wheel with equal, clean visual slices without probability percentages
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !activePreset) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    const slices = activePreset.slices;
    const numSlices = slices.length;
    if (numSlices === 0) return;

    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Draw equal visual slices
    slices.forEach((slice, i) => {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.strokeStyle = '#090a0f';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Clean Text on slice (NO percentages, clean title)
      ctx.save();
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px system-ui';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      const maxLen = 22;
      const displayTxt = slice.text.length > maxLen ? slice.text.substring(0, maxLen) + '...' : slice.text;
      ctx.fillText(displayTxt, radius - 15, 5);
      ctx.restore();
    });

    ctx.restore();

    // Center Golden Cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪔', centerX, centerY);

    // Top Needle Indicator
    ctx.beginPath();
    ctx.moveTo(centerX - 14, 12);
    ctx.lineTo(centerX + 14, 12);
    ctx.lineTo(centerX, 42);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [activePreset]);

  // Redraw when angle or preset changes
  useEffect(() => {
    drawWheel(currentAngle);
  }, [currentAngle, drawWheel, activePreset]);

  // Handle incoming spin event from store / broadcast
  useEffect(() => {
    if (activeSpinEvent) {
      const now = Date.now();
      const elapsed = now - activeSpinEvent.timestamp;
      if (elapsed < 10000 && !isSpinning) {
        animateSpinTo(activeSpinEvent.targetAngle, activeSpinEvent.durationMs, activeSpinEvent.winnerSlice);
      }
    }
  }, [activeSpinEvent]);

  // Physics animation for spinning
  const animateSpinTo = (targetAngle: number, durationMs: number, winner: WheelSlice) => {
    setIsSpinning(true);
    setWinnerSlice(null);

    const startA = currentAngle;
    const deltaA = targetAngle - startA;
    const startTime = performance.now();

    const frame = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const ease = 1 - Math.pow(1 - progress, 3);
      const newAngle = startA + deltaA * ease;

      setCurrentAngle(newAngle);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setIsSpinning(false);
        setWinnerSlice(winner);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };

    requestAnimationFrame(frame);
  };

  const handleStartSpin = () => {
    if (isSpinning || !activePreset || activePreset.slices.length === 0) return;

    const slices = activePreset.slices;
    const currentTotalWeight = slices.reduce((acc, s) => acc + (s.weight > 0 ? s.weight : 1), 0);

    // Weighted random selection
    let randomNum = Math.random() * currentTotalWeight;
    let chosenSlice = slices[0];
    let chosenIndex = 0;

    let cumulative = 0;
    for (let i = 0; i < slices.length; i++) {
      const w = slices[i].weight > 0 ? slices[i].weight : 1;
      if (randomNum <= cumulative + w) {
        chosenSlice = slices[i];
        chosenIndex = i;
        break;
      }
      cumulative += w;
    }

    const sliceAngle = (2 * Math.PI) / slices.length;
    const midAngle = chosenIndex * sliceAngle + sliceAngle / 2;
    const extraRotations = 5 + Math.floor(Math.random() * 3);
    const baseTarget = (extraRotations * 2 * Math.PI) + ( (3 * Math.PI / 2) - midAngle );
    const targetAngle = currentAngle + baseTarget + (Math.random() * (sliceAngle * 0.4) - (sliceAngle * 0.2));
    const duration = 4500;

    triggerWheelSpin({
      presetId: activePreset.id,
      targetAngle,
      durationMs: duration,
      winnerSlice: chosenSlice,
      timestamp: Date.now(),
    });
  };

  const handleAddSlice = () => {
    if (!newSliceText.trim() || !activePreset) return;
    const nextColor = PALETTE[activePreset.slices.length % PALETTE.length];
    const newSlice: WheelSlice = {
      id: `s-${Date.now()}`,
      text: newSliceText.trim(),
      color: nextColor,
      weight: 5,
    };
    updateWheelPreset(activePreset.id, {
      slices: [...activePreset.slices, newSlice]
    });
    setNewSliceText('');
  };

  const handleDeleteSlice = (sliceId: string) => {
    if (!activePreset || activePreset.slices.length <= 2) {
      alert('Çarkta en az 2 seçenek bulunmalıdır.');
      return;
    }
    updateWheelPreset(activePreset.id, {
      slices: activePreset.slices.filter((s) => s.id !== sliceId)
    });
  };

  const handleCreateNewPreset = () => {
    const title = window.prompt('Yeni Çark Taslağının Başlığı:', 'Yeni Şans Çarkı');
    if (title && title.trim()) {
      addWheelPreset({
        title: title.trim(),
        slices: [
          { id: '1', text: 'Seçenek A', color: '#3b82f6', weight: 5 },
          { id: '2', text: 'Seçenek B', color: '#ef4444', weight: 5 },
          { id: '3', text: 'Seçenek C', color: '#eab308', weight: 5 },
          { id: '4', text: 'Seçenek D', color: '#10b981', weight: 5 },
        ]
      });
    }
  };

  if (!isWheelModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left: Canvas Wheel & Spin Trigger */}
        <div className="flex-1 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/70">
          
          {/* Header */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>{activePreset?.title || 'Şans Çarkı'}</span>
            </div>

            {winnerSlice && (
              <div className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full font-black text-xs shadow-lg animate-bounce flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>Sonuç: {winnerSlice.text}</span>
              </div>
            )}
          </div>

          {/* Canvas Wheel */}
          <div className="relative my-4 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={360}
              height={360}
              className="drop-shadow-2xl"
            />
          </div>

          {/* Spin Button */}
          <button
            onClick={handleStartSpin}
            disabled={isSpinning}
            className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? t('wheel.spinning') : t('wheel.spin')}</span>
          </button>
        </div>

        {/* Right: Presets & Slice Customizer (DM only) */}
        <div className="w-full md:w-88 p-5 flex flex-col justify-between bg-slate-900 text-xs space-y-4">
          
          <div className="space-y-3.5 overflow-y-auto max-h-[70vh] pr-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Çark Taslakları</span>
              </div>
              <button
                onClick={() => setWheelModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t("wheel.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Presets Selector List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
              {filteredPresets.length === 0 ? (
                <div className="text-center py-3 text-slate-500 text-[11px]">
                  "{searchQuery}" ile eşleşen çark bulunamadı.
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const isActive = preset.id === activeWheelPresetId;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setActiveWheelPresetId(preset.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{preset.title}</span>
                      <span className="text-[10px] opacity-70 font-mono">({preset.slices.length} Seçenek)</span>
                    </div>
                  );
                })
              )}

              {!isStreamerMode && (
                <button
                  onClick={handleCreateNewPreset}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/40 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("wheel.addNewPreset")}</span>
                </button>
              )}
            </div>

            {/* Slices of Active Preset */}
            {!isStreamerMode && activePreset && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-400 font-bold">{t("wheel.optionsLabel")}</label>
                  <span className="text-[10px] text-slate-500 font-mono">({activePreset.slices.length} Dilim)</span>
                </div>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activePreset.slices.map((slice) => {
                    return (
                      <div key={slice.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                        <input
                          type="text"
                          value={slice.text}
                          onChange={(e) => {
                            const nextSlices = activePreset.slices.map((s) => s.id === slice.id ? { ...s, text: e.target.value } : s);
                            updateWheelPreset(activePreset.id, { slices: nextSlices });
                          }}
                          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500 truncate"
                        />

                        <button
                          onClick={() => handleDeleteSlice(slice.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg cursor-pointer"
                          title="Dilimi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Slice Input */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Yeni seçenek yazısı..."
                    value={newSliceText}
                    onChange={(e) => setNewSliceText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSlice(); }}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleAddSlice}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Delete Preset button */}
          {!isStreamerMode && wheelPresets.length > 1 && activePreset && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  if (window.confirm('Bu çark taslağını silmek istediğinize emin misiniz?')) {
                    deleteWheelPreset(activePreset.id);
                  }
                }}
                className="w-full py-1.5 bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-500 hover:text-rose-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bu Çark Taslağını Sil</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
