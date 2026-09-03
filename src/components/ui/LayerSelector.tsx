import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Building,
  Palette,
  Upload
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { MapLayer } from '../../types/game';

const TEXTURE_PRESETS: Array<{ id: NonNullable<MapLayer['backgroundTexture']>; name: string; icon: string; previewColor: string }> = [
  { id: 'none', name: 'Standart Siyah Izgara', icon: '⬛', previewColor: '#020617' },
  { id: 'dungeon-stone', name: 'Zindan Taşı', icon: '🪨', previewColor: '#1e293b' },
  { id: 'grass-forest', name: 'Çimen & Orman', icon: '🌲', previewColor: '#064e3b' },
  { id: 'wood-planks', name: 'Ahşap Döşeme', icon: '🪵', previewColor: '#451a03' },
  { id: 'parchment', name: 'Antik Parşömen', icon: '📜', previewColor: '#78350f' },
  { id: 'cave-rock', name: 'Mağara & Volkan', icon: '🌋', previewColor: '#3b0764' },
  { id: 'water-sea', name: 'Okyanus & Nehir', icon: '🌊', previewColor: '#0c4a6e' },
  { id: 'space-stars', name: 'Derin Uzay', icon: '🌌', previewColor: '#090d16' },
];

export const LayerSelector: React.FC = () => {
  const { t } = useTranslation();
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    updateLayer,
    deleteLayer,
    updateLayerBackground,
    tokens,
    rooms,
    isStreamerMode
  } = useGameStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  const currentLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLayerName.trim()) {
      addLayer(newLayerName.trim());
      setNewLayerName('');
      setIsAdding(false);
    }
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateLayer(id, editName.trim());
    }
    setEditingLayerId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentLayer) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateLayerBackground(currentLayer.id, {
          backgroundImageUrl: dataUrl,
          backgroundType: 'image',
          backgroundImageOpacity: currentLayer.backgroundImageOpacity || 1
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="absolute top-20 left-20 z-30 select-none animate-in fade-in">
        {/* Active Floor Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-850 border border-amber-500/60 hover:border-amber-400 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold text-slate-100 transition-all cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[9px] text-amber-400/80 uppercase font-black tracking-wider leading-none">
              Katman / Kat
            </span>
            <span className="text-xs text-white font-black truncate max-w-[130px]">
              {currentLayer?.name || 'Zemin Kat'}
            </span>
          </div>

          <div className="text-slate-400 group-hover:text-amber-400 ml-1 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Layer Selector Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 border border-amber-500/50 rounded-2xl shadow-2xl p-2.5 backdrop-blur-md text-xs space-y-2 z-50 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-800 text-[11px] font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{t('layer.floors')}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({layers.length} Kat)</span>
            </div>

            {/* List of Layers */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {layers.map((layer) => {
                const isActive = layer.id === activeLayerId;
                const tokenCount = tokens.filter((t) => (t.layerId || layers[0]?.id) === layer.id).length;
                const roomCount = rooms.filter((r) => (r.layerId || layers[0]?.id) === layer.id).length;

                return (
                  <div
                    key={layer.id}
                    onClick={() => {
                      setActiveLayerId(layer.id);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-md' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                      
                      {editingLayerId === layer.id ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(layer.id)}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-bold w-full"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(layer.id)} className="p-1 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-xs truncate">{layer.name}</span>
                          <span className="text-[9px] text-slate-500">
                            {roomCount} Oda • {tokenCount} Token
                          </span>
                        </div>
                      )}
                    </div>

                    {!isStreamerMode && editingLayerId !== layer.id && (
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStartEdit(layer.id, layer.name)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          title={t("layer.editName")}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {layers.length > 1 && (
                          <button
                            onClick={() => deleteLayer(layer.id)}
                            className="p-1 hover:bg-rose-950/50 rounded text-slate-500 hover:text-rose-400"
                            title={t("layer.delete")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DM Controls: Add Layer & Background Settings */}
            {!isStreamerMode && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <button
                  onClick={() => setIsBgModalOpen(true)}
                  className="w-full py-1.5 bg-gradient-to-r from-purple-950/70 to-indigo-950/70 hover:from-purple-900 hover:to-indigo-900 text-purple-300 border border-purple-700/60 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t('layer.bgSettings')}</span>
                </button>

                {isAdding ? (
                  <form onSubmit={handleAdd} className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder={t("layer.placeholder")}
                      value={newLayerName}
                      onChange={(e) => setNewLayerName(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                      autoFocus
                    />
                    <button type="submit" className="p-1.5 bg-amber-500 text-slate-950 rounded-xl font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setIsAdding(false)} className="p-1.5 text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('layer.add')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Layer Background Settings Modal */}
      {isBgModalOpen && currentLayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-md bg-slate-900 border-2 border-purple-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-black text-slate-100 text-sm">
                    {currentLayer.name} - Zemin Arka Planı
                  </h3>
                  <p className="text-[10px] text-slate-400">{t('layer.bgModalSub')}</p>
                </div>
              </div>
              <button onClick={() => setIsBgModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  {t('layer.presets')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEXTURE_PRESETS.map((preset) => {
                    const isSelected = (currentLayer.backgroundTexture || 'none') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => updateLayerBackground(currentLayer.id, { backgroundTexture: preset.id, backgroundType: 'texture' })}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">{preset.icon}</span>
                        <span className="font-bold text-xs truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Battlemap Image Upload */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  {t('layer.uploadBattlemap')}
                </label>
                
                <label className="block p-3 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl text-center cursor-pointer bg-slate-950 transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                  <span className="font-bold text-slate-300 block">{t('layer.chooseImage')}</span>
                  <span className="text-[10px] text-slate-500">{t('layer.chooseImageSub')}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {currentLayer.backgroundImageUrl && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">{t('layer.opacity')}</span>
                      <button
                        onClick={() => updateLayerBackground(currentLayer.id, { backgroundImageUrl: undefined })}
                        className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('layer.removeImage')}</span>
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={currentLayer.backgroundImageOpacity || 1}
                      onChange={(e) => updateLayerBackground(currentLayer.id, { backgroundImageOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Done Button */}
              <div className="pt-2">
                <button
                  onClick={() => setIsBgModalOpen(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  {t('layer.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
