import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { 
  X, 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Castle, 
  Flame, 
  Trees, 
  Coins, 
  Skull,
  Upload
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { DungeonRoom } from '../../types/game';

export const RoomTemplates: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isRoomDrawerOpen, 
    setRoomDrawerOpen, 
    rooms, 
    addRoom, 
    deleteRoom, 
    toggleRoomReveal,
    revealAllRooms,
    hideAllRooms,
    isStreamerMode 
  } = useGameStore();

  const [customName, setCustomName] = useState('Yeni Zindan Odası');
  const [customWidth, setCustomWidth] = useState(6);
  const [customHeight, setCustomHeight] = useState(6);
  const [customTheme, setCustomTheme] = useState<DungeonRoom['theme']>('stone');
  const [initialRevealed, setInitialRevealed] = useState<boolean>(false);
  const [customImage, setCustomImage] = useState<string>('');
  const [isSpawnPoint, setIsSpawnPoint] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isRoomDrawerOpen || isStreamerMode) return null;

  const PRESET_ROOMS: { name: string; w: number; h: number; theme: DungeonRoom['theme']; desc: string }[] = [
    { name: t('roomTemplates.roomThrone'), w: 10, h: 8, theme: 'gold', desc: t('roomTemplates.descThrone') },
    { name: t('roomTemplates.roomCrypt'), w: 6, h: 6, theme: 'crypt', desc: t('roomTemplates.descCrypt') },
    { name: t('roomTemplates.roomMagma'), w: 8, h: 6, theme: 'magma', desc: t('roomTemplates.descMagma') },
    { name: t('roomTemplates.roomNature'), w: 7, h: 5, theme: 'nature', desc: t('roomTemplates.descNature') },
    { name: t('roomTemplates.roomCorridor'), w: 10, h: 2, theme: 'stone', desc: t('roomTemplates.descCorridor') },
    { name: t('roomTemplates.roomTreasure'), w: 4, h: 4, theme: 'gold', desc: t('roomTemplates.descTreasure') },
  ];

  const handleAddPreset = (preset: typeof PRESET_ROOMS[0]) => {
    const offset = (rooms.length * 3) % 15;
    addRoom({
      name: preset.name,
      x: 3 + offset,
      y: 3 + (offset % 5),
      width: preset.w,
      height: preset.h,
      theme: preset.theme,
      doors: [
        { id: `door-${Date.now()}`, side: 'top', offset: Math.floor(preset.w / 2), isOpen: true }
      ],
      isRevealed: initialRevealed,
    });
  };

  const handleAddCustom = () => {
    addRoom({
      name: customName.trim() || 'Özel Oda',
      x: 4,
      y: 4,
      width: customWidth,
      height: customHeight,
      theme: customTheme,
      doors: [
        { id: `door-${Date.now()}`, side: 'left', offset: Math.floor(customHeight / 2), isOpen: true }
      ],
      isRevealed: initialRevealed,
      image: customImage.trim() || undefined,
      isSpawnPoint,
    });
    setCustomImage('');
  };

  return (
    <div className="fixed top-14 right-4 z-40 w-96 max-h-[85vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <LayoutGrid className="w-4 h-4" />
          <span>Zindan & Oda Editörü</span>
        </div>
        <button
          onClick={() => setRoomDrawerOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {/* Global Fog Controls */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Savaş Sisi (Fog of War):</span>
            <div className="flex gap-1.5">
              <button
                onClick={revealAllRooms}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 rounded font-semibold transition-colors cursor-pointer"
                title="Tüm odaları görünür yap"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hepsini Aç</span>
              </button>
              <button
                onClick={hideAllRooms}
                className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded font-semibold transition-colors cursor-pointer"
                title="Tüm odaları karanlığa bürü"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hepsini Kapat</span>
              </button>
            </div>
          </div>

          {/* New Rooms Initial Fog State Selector */}
          <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Yeni Eklenen Odalar:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setInitialRevealed(false)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  !initialRevealed
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                🌫️ Sisli (Gizli)
              </button>
              <button
                onClick={() => setInitialRevealed(true)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  initialRevealed
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                ☀️ Açık (Görünür)
              </button>
            </div>
          </div>
        </div>

        {/* Preset Rooms */}
        <div>
          <h4 className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">
            Hazır Zindan Odası Şablonları
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_ROOMS.map((preset, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 p-2.5 rounded-xl flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 group-hover:text-amber-300">
                      {preset.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                      {preset.w}x{preset.h}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</p>
                </div>

                <button
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Room Generator */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <h4 className="text-slate-300 font-semibold text-xs">Özel Boyutlu Oda Yarat</h4>
          
          <div>
            <label className="block text-slate-500 text-[10px] mb-1">Oda İsmi</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-500 text-[10px] mb-1">Genişlik (Grid): {customWidth}</label>
              <input
                type="range"
                min="2"
                max="20"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] mb-1">Yükseklik (Grid): {customHeight}</label>
              <input
                type="range"
                min="2"
                max="20"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] mb-1">Zemin Teması</label>
            <div className="grid grid-cols-5 gap-1 text-[10px]">
              {[
                { id: 'stone', label: 'Taş', icon: Castle },
                { id: 'crypt', label: 'Mahzen', icon: Skull },
                { id: 'magma', label: 'Lav', icon: Flame },
                { id: 'nature', label: 'Doğa', icon: Trees },
                { id: 'gold', label: 'Altın', icon: Coins },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCustomTheme(t.id as DungeonRoom['theme'])}
                  className={`flex flex-col items-center p-1.5 rounded border transition-all cursor-pointer ${
                    customTheme === t.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5 mb-0.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Background Image (Optional) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-900">
            <label className="block text-slate-400 text-[10px] font-bold">🖼️ Oda Zemin Görseli (İsteğe Bağlı)</label>
            
            {customImage && (
              <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 mb-1 flex items-center justify-center">
                <img src={customImage} alt="Floor preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCustomImage('')}
                  className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded text-[9px] cursor-pointer"
                >
                  Kaldır
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCustomImage(ev.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg flex items-center gap-1 font-bold text-[11px] cursor-pointer"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>Resim Seç</span>
              </button>
              <input
                type="text"
                placeholder="Veya URL girin..."
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-[11px] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Spawn Point Toggle */}
          <label className="flex items-center gap-2 p-1.5 bg-rose-950/30 border border-rose-900/50 rounded-lg cursor-pointer hover:bg-rose-900/30 transition-colors">
            <input
              type="checkbox"
              checked={isSpawnPoint}
              onChange={(e) => setIsSpawnPoint(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-rose-500 cursor-pointer"
            />
            <div className="text-[10px]">
              <span className="text-rose-300 font-bold block">🎯 Oluşum (Doğuş) Noktası Yap</span>
            </div>
          </label>

          <button
            onClick={handleAddCustom}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all mt-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Haritaya Yerleştir</span>
          </button>
        </div>

        {/* Existing Rooms List on Map */}
        <div>
          <h4 className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">
            Haritadaki Odalar ({rooms.length})
          </h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-300">{room.name}</span>
                  <span className="text-[10px] text-slate-500">({room.width}x{room.height})</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleRoomReveal(room.id)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      room.isRevealed 
                        ? 'text-emerald-400 hover:bg-emerald-950/50' 
                        : 'text-slate-500 hover:bg-slate-800'
                    }`}
                    title={room.isRevealed ? 'Görünür (Sisi Kapat)' : 'Gizli (Sisi Aç)'}
                  >
                    {room.isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="p-1 text-slate-600 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                    title="Odayı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
