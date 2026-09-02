import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Heart,
  Search,
  Folder,
  FolderPlus,
  FolderOpen
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { TokenType } from '../../types/game';

const DEFAULT_FOLDERS = [
  'Tümü',
  '🧟 Canavarlar',
  '👑 Bosslar',
  '📦 Eşyalar & Sandıklar',
  '🧝 NPC & Yoldaşlar',
];

export const BackstageDrawer: React.FC = () => {
  const { 
    isStreamerMode, 
    isBackstageOpen, 
    setBackstageOpen, 
    backstageTokens, 
    revealBackstageToken, 
    deleteToken, 
    updateToken,
    addToken,
    setPaintModalOpen 
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('Tümü');
  const [customFolders, setCustomFolders] = useState<string[]>([]);

  // If in streamer mode, DM backstage must be 100% hidden!
  if (isStreamerMode) return null;

  const allFolders = [...DEFAULT_FOLDERS, ...customFolders];

  const quickPresets = [
    { name: 'İskelet Savaşçı', type: 'monster', hp: 13, size: 1, color: '#94a3b8', folder: '🧟 Canavarlar', isTemplate: true, notes: 'Kılıç vuruşu: 1d6+2' },
    { name: 'Orman Haydutu', type: 'monster', hp: 16, size: 1, color: '#ea580c', folder: '🧟 Canavarlar', isTemplate: true, notes: 'Hançer & Zehir' },
    { name: 'Kadim Ejderha', type: 'monster', hp: 120, size: 3, color: '#dc2626', folder: '👑 Bosslar', isTemplate: true, notes: 'Alev Nefesi: 4d6' },
    { name: 'Altın Sandık', type: 'item', size: 1, color: '#eab308', folder: '📦 Eşyalar & Sandıklar', isTemplate: true, notes: '100 Altın + Şans Yüzüğü' },
    { name: 'Büyücü Çırağı', type: 'npc', hp: 15, size: 1, color: '#8b5cf6', folder: '🧝 NPC & Yoldaşlar', isTemplate: true, notes: 'Rehber NPC' },
  ];

  const handleAddPreset = (preset: typeof quickPresets[0]) => {
    addToken({
      name: preset.name,
      type: preset.type as TokenType,
      x: 0,
      y: 0,
      size: preset.size,
      hp: preset.hp ? { current: preset.hp, max: preset.hp } : undefined,
      color: preset.color,
      folder: preset.folder,
      isTemplate: true,
      notes: preset.notes,
      statuses: [],
    }, true);
  };

  const handleCreateFolder = () => {
    const name = window.prompt('Yeni Klasör Adı (Örn: Goblin Kampı, Zindan Kat 2):');
    if (name && name.trim()) {
      const folderTitle = `📁 ${name.trim()}`;
      if (!allFolders.includes(folderTitle)) {
        setCustomFolders([...customFolders, folderTitle]);
        setActiveFolder(folderTitle);
      }
    }
  };

  // Filter backstage tokens by folder and search query
  const filteredTokens = backstageTokens.filter((token) => {
    const matchesSearch = 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (token.notes && token.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      token.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFolder === 'Tümü') return true;
    if (activeFolder === '🧟 Canavarlar') return token.folder === '🧟 Canavarlar' || token.type === 'monster';
    if (activeFolder === '👑 Bosslar') return token.folder === '👑 Bosslar' || (token.size && token.size >= 2 && token.type === 'monster');
    if (activeFolder === '📦 Eşyalar & Sandıklar') return token.folder === '📦 Eşyalar & Sandıklar' || token.type === 'item';
    if (activeFolder === '🧝 NPC & Yoldaşlar') return token.folder === '🧝 NPC & Yoldaşlar' || token.type === 'npc' || token.type === 'hero';

    return token.folder === activeFolder;
  });

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
      isBackstageOpen ? 'translate-y-0' : 'translate-y-[calc(100%-36px)]'
    }`}>
      {/* Header bar / Toggle tab */}
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-1.5 bg-slate-900 border-t border-x border-purple-500/40 rounded-t-xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-purple-300 uppercase">
            🎭 DM Sahne Arkası (Gizli Kasa)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-400 border border-purple-800">
            {backstageTokens.length} Gizli Varlık
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaintModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Yeni Varlık Çiz</span>
          </button>

          <button
            onClick={() => setBackstageOpen(!isBackstageOpen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isBackstageOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="max-w-6xl mx-auto bg-slate-950/95 border-x border-purple-500/40 p-3.5 backdrop-blur-lg shadow-2xl">
        
        {/* Top Filter Bar: Search Box & Folder Category Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3 border-b border-slate-800/80 pb-2.5 text-xs">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Kasada canavar / eşya ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Folder Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {allFolders.map((fName) => {
              const isActive = activeFolder === fName;
              return (
                <button
                  key={fName}
                  onClick={() => setActiveFolder(fName)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer border ${
                    isActive
                      ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive ? <FolderOpen className="w-3 h-3 text-purple-400" /> : <Folder className="w-3 h-3 text-slate-500" />}
                  <span>{fName}</span>
                </button>
              );
            })}

            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/40 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              title="Yeni Klasör Oluştur"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Klasör</span>
            </button>
          </div>

        </div>

        <div className="flex flex-col md:flex-row gap-4 max-h-52 overflow-y-auto">
          
          {/* Quick Presets */}
          <div className="w-full md:w-52 flex flex-col gap-1.5 pr-2 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 text-xs">
            <span className="text-[11px] font-semibold text-slate-400">Hızlı Hazır Varlıklar:</span>
            <div className="grid grid-cols-1 gap-1">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPreset(preset)}
                  className="flex items-center justify-between px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 hover:border-purple-500/50 transition-all text-left group cursor-pointer"
                >
                  <span className="truncate group-hover:text-purple-300">{preset.name}</span>
                  <Plus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Stash Tokens List */}
          <div className="flex-1">
            {filteredTokens.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                <EyeOff className="w-6 h-6 mb-1 text-slate-600" />
                <span>Bu klasörde veya aramada eşleşen varlık bulunamadı.</span>
                <span className="text-[10px] text-slate-600 mt-0.5">Soldan hazır varlık ekleyebilir veya yeni çizebilirsin.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredTokens.map((token) => (
                  <div
                    key={token.id}
                    className="relative bg-slate-900 border border-purple-900/60 hover:border-purple-500 rounded-xl p-2 flex flex-col justify-between group transition-all shadow-md text-xs"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {token.image ? (
                          <img src={token.image} alt={token.name} className="w-7 h-7 rounded-lg object-contain bg-slate-950 p-0.5 border border-purple-800 shrink-0" />
                        ) : (
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                            style={{ backgroundColor: token.color || '#6366f1' }}
                          >
                            {token.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-200 truncate" title={token.name}>
                            {token.name}
                          </h4>
                          <span className="text-[10px] text-purple-400 capitalize">
                            {token.type} ({token.size}x{token.sizeY || token.size})
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteToken(token.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Folder Mover Selector & Template Toggle */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <select
                        value={token.folder || 'Tümü'}
                        onChange={(e) => updateToken(token.id, { folder: e.target.value })}
                        className="flex-1 px-1 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-400 focus:outline-none focus:border-purple-500 cursor-pointer truncate"
                      >
                        {allFolders.filter((f) => f !== 'Tümü').map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => updateToken(token.id, { isTemplate: !token.isTemplate })}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer shrink-0 ${
                          token.isTemplate
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title={token.isTemplate ? "📦 Şablon Varlık: Haritaya atılsa bile kasada kalır (Sonsuz çağrılır)" : "🎯 Tek Seferlik: Haritaya atılınca kasadan çıkar"}
                      >
                        {token.isTemplate ? '📦 Şablon (∞)' : '🎯 Tek Seferlik'}
                      </button>
                    </div>

                    {/* Stats & Notes */}
                    {token.hp && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-400 mb-1 font-mono">
                        <Heart className="w-3 h-3 fill-rose-500/30" />
                        <span>{token.hp.current}/{token.hp.max} HP</span>
                      </div>
                    )}
                    {token.notes && (
                      <p className="text-[10px] text-slate-400 truncate mb-1.5" title={token.notes}>
                        {token.notes}
                      </p>
                    )}

                    {/* Reveal Button */}
                    <button
                      onClick={() => revealBackstageToken(token.id, 5, 5)}
                      className={`w-full py-1 px-2 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow transition-all cursor-pointer ${
                        token.isTemplate
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{token.isTemplate ? '✨ Sahneye Çağır (Kopya)' : 'Sahneye At'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
