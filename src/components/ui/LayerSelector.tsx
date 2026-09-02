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
  User
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';

export const LayerSelector: React.FC = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    updateLayer,
    deleteLayer,
    tokens,
    rooms,
    isStreamerMode
  } = useGameStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  return (
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
              <span>Bina Katları / Harita Katmanları</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({layers.length} Kat)</span>
          </div>

          {/* List of Layers */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {layers.map((layer) => {
              const isActive = layer.id === activeLayerId;
              const isEditing = editingLayerId === layer.id;
              
              // Count tokens and rooms on this layer
              const layerTokensCount = tokens.filter(
                (t) => (t.layerId || layers[0]?.id || 'layer-1') === layer.id
              ).length;
              const layerRoomsCount = rooms.filter(
                (r) => (r.layerId || layers[0]?.id || 'layer-1') === layer.id
              ).length;

              return (
                <div
                  key={layer.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveLayerId(layer.id);
                    }
                  }}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 mr-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="w-full px-2 py-0.5 bg-slate-900 border border-amber-500 rounded text-xs text-white focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(layer.id);
                          if (e.key === 'Escape') setEditingLayerId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(layer.id)}
                        className="p-1 text-emerald-400 hover:bg-slate-800 rounded cursor-pointer"
                        title="Kaydet"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingLayerId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                        title="İptal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate">{layer.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5" title="Varlık Sayısı">
                            <User className="w-2.5 h-2.5 text-blue-400" /> {layerTokensCount}
                          </span>
                          <span>•</span>
                          <span title="Oda Sayısı">🏰 {layerRoomsCount} Oda</span>
                        </span>
                      </div>

                      {/* DM Action Buttons for Layer */}
                      {!isStreamerMode && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStartEdit(layer.id, layer.name)}
                            className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {layers.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm(`"${layer.name}" katmanını silmek istediğinize emin misiniz? (İçindeki varlıklar varsayılan kata taşınır)`)) {
                                  deleteLayer(layer.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                              title="Katmanı Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Layer Form (DM Mode) */}
          {!isStreamerMode && (
            <div className="pt-1 border-t border-slate-800">
              {isAdding ? (
                <form onSubmit={handleAdd} className="space-y-1.5 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Örn: 2. Kat, Çatı, Mahzen, Mağara..."
                    value={newLayerName}
                    onChange={(e) => setNewLayerName(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1 bg-slate-950 border border-amber-500/70 rounded-lg text-slate-100 text-xs focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer text-[11px]"
                    >
                      Kat Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-[11px]"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setNewLayerName(`${layers.length + 1}. Kat`);
                  }}
                  className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Katman / Kat Ekle</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
