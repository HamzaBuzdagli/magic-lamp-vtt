import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  Scroll, 
  Sparkles, 
  Target, 
  Shield,
  User,
  Globe,
  Lock,
  Edit3,
  Search
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { RulebookNote } from '../../types/game';

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const LOCAL_STORAGE_PERSONAL_NOTES = 'magic_lamp_personal_player_notes';

export const RulebookModal: React.FC = () => {
  const { 
    isRulebookOpen, 
    setRulebookOpen, 
    rulebookNotes, 
    addRulebookNote, 
    updateRulebookNote, 
    deleteRulebookNote,
    isStreamerMode
  } = useGameStore();

  const [activeScope, setActiveScope] = useState<'dm' | 'personal'>('dm');
  const [activeCategory, setActiveCategory] = useState<RulebookNote['category']>('rules');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PERSONAL_NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'pnote-1',
        title: 'Görev & Envanter Notlarım',
        content: '• Kasabadaki demirciden kılıç teslim alınacak.\n• Handaki gizemli yabancıyı araştır.\n• 25 Altın, 3 Sağlık İksiri.',
        updatedAt: new Date().toLocaleDateString('tr-TR')
      }
    ];
  });

  const [selectedPersonalId, setSelectedPersonalId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_PERSONAL_NOTES, JSON.stringify(personalNotes));
      } catch (e) {
        console.error(e);
      }
    }
  }, [personalNotes]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  if (!isRulebookOpen) return null;

  const filteredDmNotes = rulebookNotes
    .filter((n) => n.category === activeCategory)
    .filter((n) => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeDmNote = rulebookNotes.find((n) => n.id === selectedNoteId) || filteredDmNotes[0];

  const filteredPersonalNotes = personalNotes.filter(
    (n) => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activePersonalNote = personalNotes.find((n) => n.id === selectedPersonalId) || filteredPersonalNotes[0];

  const handleCreateDmNote = () => {
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

  const handleCreatePersonalNote = () => {
    if (!newTitle.trim()) return;
    const newNote: PersonalNote = {
      id: `pnote-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      updatedAt: new Date().toLocaleDateString('tr-TR')
    };
    setPersonalNotes([newNote, ...personalNotes]);
    setSelectedPersonalId(newNote.id);
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleUpdatePersonalNote = (id: string, updates: Partial<PersonalNote>) => {
    setPersonalNotes(personalNotes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: new Date().toLocaleDateString('tr-TR') } : n));
    setIsEditing(false);
  };

  const handleDeletePersonalNote = (id: string) => {
    setPersonalNotes(personalNotes.filter((n) => n.id !== id));
    if (selectedPersonalId === id) setSelectedPersonalId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="flex flex-col w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Main Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <span>Kurallar & Not Defteri</span>
                {activeScope === 'dm' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Ortak DM Kuralları</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Kişisel Oyuncu Notları</span>
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-slate-400">
                {activeScope === 'dm' 
                  ? 'DM tarafından yönetilen ve tüm oyuncuların canlı gördüğü ortak kurallar' 
                  : 'Sadece senin tarayıcına özel gizli kişisel notların'}
              </p>
            </div>
          </div>

          {/* Scope Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setActiveScope('dm'); setIsCreating(false); setIsEditing(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                activeScope === 'dm'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>📜 Ortak DM Kuralları</span>
            </button>

            <button
              onClick={() => { setActiveScope('personal'); setIsCreating(false); setIsEditing(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                activeScope === 'personal'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>📝 Kişisel Notlarım</span>
            </button>
          </div>

          <button
            onClick={() => setRulebookOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header for DM Categories (if in DM mode) */}
        {activeScope === 'dm' && (
          <div className="flex items-center justify-between px-5 py-2 bg-slate-900/90 border-b border-slate-800 shrink-0 text-xs">
            <div className="flex items-center gap-1">
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
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/40' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {isStreamerMode && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-amber-500/70" />
                <span>DM Tarafından Yayınlanıyor (Salt Okunur)</span>
              </span>
            )}
          </div>
        )}

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950/60">
          
          {/* Left Sidebar: Notes List */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex flex-col justify-between bg-slate-950/90 shrink-0">
            <div className="space-y-2 mb-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Notlarda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Header + Add Note Button */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {activeScope === 'dm' ? `Yazılar (${filteredDmNotes.length})` : `Notlarım (${filteredPersonalNotes.length})`}
                </span>

                {(!isStreamerMode || activeScope === 'personal') && (
                  <button
                    onClick={() => { setIsCreating(true); setIsEditing(false); setNewTitle(''); setNewContent(''); }}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      activeScope === 'dm'
                        ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border-amber-500/40'
                        : 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/40'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Not</span>
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {activeScope === 'dm' ? (
                filteredDmNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs">
                    Bu kategoride henüz kural/not yok.
                  </div>
                ) : (
                  filteredDmNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => { setSelectedNoteId(note.id); setIsCreating(false); setIsEditing(false); }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                        activeDmNote?.id === note.id && !isCreating
                          ? 'bg-slate-800/90 border-amber-500/60 text-amber-300 font-semibold shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2 text-xs">
                        <div className="truncate">{note.title}</div>
                        <span className="text-[10px] text-slate-500 font-normal">{note.updatedAt}</span>
                      </div>

                      {!isStreamerMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRulebookNote(note.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )
              ) : (
                filteredPersonalNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs">
                    Henüz kişisel not eklemedin.
                  </div>
                ) : (
                  filteredPersonalNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => { setSelectedPersonalId(note.id); setIsCreating(false); setIsEditing(false); }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                        activePersonalNote?.id === note.id && !isCreating
                          ? 'bg-slate-800/90 border-purple-500/60 text-purple-300 font-semibold shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2 text-xs">
                        <div className="truncate">{note.title}</div>
                        <span className="text-[10px] text-slate-500 font-normal">{note.updatedAt}</span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePersonalNote(note.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Right Area: View or Edit Note */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-slate-900">
            {isCreating ? (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-amber-400">
                  {activeScope === 'dm' ? 'Yeni DM Kuralı & Kampanya Notu' : 'Yeni Kişisel Not Oluştur'}
                </h3>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Başlık</label>
                  <input
                    type="text"
                    placeholder="Örn: Görünmezlik Kuralı veya Gizli İpucu..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-slate-400 mb-1 font-bold">İçerik & Açıklama</label>
                  <textarea
                    placeholder="Kuralları, zar zorluklarını veya kişisel notlarını buraya yaz..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={12}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    onClick={activeScope === 'dm' ? handleCreateDmNote : handleCreatePersonalNote}
                    disabled={!newTitle.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Kaydet & Yayınla</span>
                  </button>
                </div>
              </div>
            ) : activeScope === 'dm' ? (
              activeDmNote ? (
                <div className="space-y-4 text-xs h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-black text-amber-400">{activeDmNote.title}</h3>
                      <span className="text-[10px] text-slate-500">Son Güncelleme: {activeDmNote.updatedAt}</span>
                    </div>

                    {!isStreamerMode && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setNewTitle(activeDmNote.title);
                          setNewContent(activeDmNote.content);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                    )}
                  </div>

                  {isEditing && !isStreamerMode ? (
                    <div className="space-y-3 flex-1 flex flex-col">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={12}
                        className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl">İptal</button>
                        <button 
                          onClick={() => {
                            updateRulebookNote(activeDmNote.id, { title: newTitle, content: newContent });
                            setIsEditing(false);
                          }}
                          className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl"
                        >
                          Değişiklikleri Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 font-mono text-slate-200 text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto">
                      {activeDmNote.content}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
                  <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                  <span>Görüntülemek için soldan bir kural veya yazı seçin.</span>
                </div>
              )
            ) : (
              activePersonalNote ? (
                <div className="space-y-4 text-xs h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-black text-purple-300">{activePersonalNote.title}</h3>
                      <span className="text-[10px] text-slate-500">Kişisel Not • {activePersonalNote.updatedAt}</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setNewTitle(activePersonalNote.title);
                        setNewContent(activePersonalNote.content);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 flex-1 flex flex-col">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      />
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={12}
                        className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl">İptal</button>
                        <button 
                          onClick={() => handleUpdatePersonalNote(activePersonalNote.id, { title: newTitle, content: newContent })}
                          className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-xl"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 font-mono text-slate-200 text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto">
                      {activePersonalNote.content}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
                  <User className="w-10 h-10 mb-2 opacity-30" />
                  <span>Kişisel notların bu tarayıcıya özel olarak saklanır.</span>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
};