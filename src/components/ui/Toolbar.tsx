import React from 'react';
import { 
  Ruler,
  MousePointer, 
  Hand, 
  Paintbrush, 
  Flame, 
  Eye, 
  EyeOff, 
  Grid, 
  Trash2,
  Boxes,
  Undo,
  Redo
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { ToolMode } from '../../types/game';

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    showGrid,
    toggleGrid,
    clearDrawings,
    drawings,
    brushColor,
    setBrushColor,
    isStreamerMode,
    undoMap,
    redoMap,
    mapHistory,
    mapHistoryIndex,
  } = useGameStore();

  const TOOLS: { id: ToolMode; label: string; subLabel: string; icon: React.ComponentType<{ className?: string }>; dmOnly?: boolean }[] = [
    { id: 'select', label: 'Token Seç & Taşı', subLabel: 'Karakter ve eşyaları sürükle', icon: MousePointer, dmOnly: true },
    { id: 'fog_reveal', label: 'Savaş Sisi Aç', subLabel: 'Odayı görünür yap (Sisi Kaldır)', icon: Eye, dmOnly: true },
    { id: 'fog_hide', label: 'Savaş Sisi Kapat', subLabel: 'Odayı karart (Sis Getir)', icon: EyeOff, dmOnly: true },
    { id: 'room_edit', label: 'Oda Düzenle & Bağla', subLabel: 'Odaları taşı, Shift ile çoklu seç & sağ tıkla bağla', icon: Boxes, dmOnly: true },
    { id: 'pan', label: 'Haritayı Kaydır', subLabel: 'Görünümü taşı (Pan)', icon: Hand },
    { id: 'ruler', label: 'Cetvel / Menzil Ölçer', subLabel: 'Mesafe ve kare ölç (ft / metre)', icon: Ruler },
    { id: 'draw', label: 'Haritaya Çiz', subLabel: 'Canlı kalem', icon: Paintbrush, dmOnly: true },
    { id: 'laser', label: 'Lazer İşaretleyici', subLabel: 'Yayında dikkat çek', icon: Flame, dmOnly: true },
  ];

  return (
    <div className="absolute left-4 top-20 z-30 flex flex-col items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl shadow-2xl backdrop-blur-md">
      
      {/* Tool Buttons */}
      <div className="flex flex-col gap-1.5">
        {TOOLS.map((tool) => {
          if (tool.dmOnly && isStreamerMode) return null;
          const isActive = activeTool === tool.id;
          const Icon = tool.icon;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`relative p-2.5 rounded-xl transition-all group cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title={`${tool.label} - ${tool.subLabel}`}
            >
              <Icon className="w-4 h-4" />

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-950 text-slate-200 text-[11px] font-semibold rounded-lg shadow-xl border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex flex-col">
                <span>{tool.label}</span>
                <span className="text-[9px] text-slate-400 font-normal">{tool.subLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full h-px bg-slate-800 my-1" />

      {/* Undo / Redo Buttons for DM */}
      {!isStreamerMode && (
        <div className="flex flex-col gap-1.5 w-full">
          <button
            onClick={undoMap}
            disabled={mapHistoryIndex <= 0}
            className={`relative p-2.5 rounded-xl transition-all group cursor-pointer flex items-center justify-center ${
              mapHistoryIndex > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white'
                : 'bg-slate-900/50 text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Geri Al (Ctrl + Z)"
          >
            <Undo className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-950 text-slate-200 text-[11px] font-semibold rounded-lg shadow-xl border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex flex-col">
              <span>Geri Al</span>
              <span className="text-[9px] text-slate-400 font-normal">Ctrl + Z</span>
            </div>
          </button>

          <button
            onClick={redoMap}
            disabled={mapHistoryIndex >= mapHistory.length - 1}
            className={`relative p-2.5 rounded-xl transition-all group cursor-pointer flex items-center justify-center ${
              mapHistoryIndex < mapHistory.length - 1
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white'
                : 'bg-slate-900/50 text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="İleri Al (Ctrl + Y)"
          >
            <Redo className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-950 text-slate-200 text-[11px] font-semibold rounded-lg shadow-xl border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex flex-col">
              <span>İleri Al</span>
              <span className="text-[9px] text-slate-400 font-normal">Ctrl + Y</span>
            </div>
          </button>
          
          <div className="w-full h-px bg-slate-800 my-0.5" />
        </div>
      )}

      {/* Grid Toggle */}
      <button
        onClick={toggleGrid}
        className={`p-2.5 rounded-xl transition-all cursor-pointer ${
          showGrid
            ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
            : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
        }`}
        title="Grid Çizgilerini Aç / Kapat"
      >
        <Grid className="w-4 h-4" />
      </button>

      {/* Live Brush Color Picker (if in draw mode) */}
      {activeTool === 'draw' && (
        <div className="flex flex-col items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mt-1">
          {['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ffffff'].map((c) => (
            <button
              key={c}
              onClick={() => setBrushColor(c)}
              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                brushColor === c ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Clear Live Drawings */}
      {drawings.length > 0 && (
        <button
          onClick={clearDrawings}
          className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-900 transition-colors cursor-pointer"
          title="Tüm Çizimleri Temizle"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

    </div>
  );
};
