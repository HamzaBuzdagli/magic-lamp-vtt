import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  Scroll, 
  Sparkles, 
  Target, 
  Shield 
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { RulebookNote } from '../../types/game';

export const RulebookModal: React.FC = () => {
  const { 
    isRulebookOpen, 
    setRulebookOpen, 
    rulebookNotes, 
    addRulebookNote, 
    updateRulebookNote, 
    deleteRulebookNote 
  } = useGameStore();

  const [activeCategory, setActiveCategory] = useState<RulebookNote['category']>('rules');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // New Note Form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  if (!isRulebookOpen) return null;

  const filteredNotes = rulebookNotes.filter((n) => n.category === activeCategory);
  const activeNote = rulebookNotes.find((n) => n.id === selectedNoteId) || filteredNotes[0];

  const handleCreateNote = () => {
    if (!newTitle.trim()) return;
    addRulebookNote({
      title: newTitle.trim(),
      category: activeCategory,
      content: newContent.trim(),
    });
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <span>Oyun Kuralları & DM Not Defteri</span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'rules', label: 'Temel Kurallar', icon: Shield },
              { id: 'homebrew', label: 'Ev Kuralları', icon: Scroll },
              { id: 'story', label: 'Hikaye Notları', icon: Sparkles },
              { id: 'quests', label: 'Görev & Questler', icon: Target },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id as RulebookNote['category']); setIsCreating(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setRulebookOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950/60">
          
          {/* Left Sidebar: Notes List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex flex-col justify-between bg-slate-950/90 shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Yazılar ({filteredNotes.length})
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs rounded-lg border border-amber-500/40 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Yeni Yazı</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => { setSelectedNoteId(note.id); setIsCreating(false); }}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                    activeNote?.id === note.id && !isCreating
                      ? 'bg-slate-800 border-amber-500/60 text-amber-300 font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate mr-2 text-xs">
                    <div>{note.title}</div>
                    <span className="text-[10px] text-slate-500 font-normal">{note.updatedAt}</span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteRulebookNote(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area: View or Edit Note */}
          <div className="flex-1 p-5 flex flex-col overflow-y-auto bg-slate-900">
            {isCreating ? (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-amber-400">Yeni Not / Kural Ekle</h3>
                <div>
                  <label className="block text-slate-400 mb-1">Başlık</label>
                  <input
                    type="text"
                    placeholder="Örn: Dinlenme Kuralları, Ejderha Mağarası Notları..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Açıklama / Metin</label>
                  <textarea
                    placeholder="Kural detayları, hikaye notları, DM yönergeleri..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono text-xs leading-relaxed"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreateNote}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Kaydet</span>
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : activeNote ? (
              <div className="space-y-3 flex-1 flex flex-col text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateRulebookNote(activeNote.id, { title: e.target.value })}
                    className="text-base font-bold text-slate-100 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 flex-1"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Son Düzenleme: {activeNote.updatedAt}</span>
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea
                    value={activeNote.content}
                    onChange={(e) => updateRulebookNote(activeNote.id, { content: e.target.value })}
                    className="w-full flex-1 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500 resize-none font-mono text-xs"
                    placeholder="Bu nota istediğin metni yazabilirsin..."
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <BookOpen className="w-8 h-8 mb-2 text-slate-600" />
                <span className="text-xs">Bu kategoride henüz bir kural veya not yok.</span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-3 px-3 py-1.5 bg-amber-500/20 text-amber-300 font-semibold rounded-lg text-xs hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer"
                >
                  İlk Notu Yaz
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
