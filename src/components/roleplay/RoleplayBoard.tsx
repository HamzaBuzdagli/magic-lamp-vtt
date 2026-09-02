import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Edit3, 
  Tv, 
  Sparkles, 
  MapPin, 
  User, 
  Scroll, 
  Package, 
  X, 
  Check
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { HandoutCard } from '../../types/game';

export const RoleplayBoard: React.FC = () => {
  const { 
    handouts, 
    addHandout, 
    updateHandout, 
    deleteHandout, 
    setSpotlightHandoutId, 
    spotlightHandoutId,
    isStreamerMode 
  } = useGameStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | HandoutCard['category']>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<HandoutCard['category']>('location');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Paste image directly with Ctrl+V on the board
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              setFormImage(dataUrl);
              setFormTitle('Yeni Görsel Kartı');
              setFormDescription('Panodan yapıştırılan sahne görseli.');
              setIsCreateModalOpen(true);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormImage(event.target?.result as string);
      if (!formTitle) setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCard = () => {
    if (!formImage || !formTitle.trim()) return;

    if (editingCardId) {
      updateHandout(editingCardId, {
        title: formTitle.trim(),
        category: formCategory,
        image: formImage,
        description: formDescription.trim(),
        notes: formNotes.trim(),
      });
    } else {
      addHandout({
        title: formTitle.trim(),
        category: formCategory,
        image: formImage,
        description: formDescription.trim(),
        notes: formNotes.trim(),
        isPublic: true,
      });
    }

    setIsCreateModalOpen(false);
    setEditingCardId(null);
    setFormTitle('');
    setFormImage('');
    setFormDescription('');
    setFormNotes('');
  };

  const startEdit = (card: HandoutCard) => {
    setEditingCardId(card.id);
    setFormTitle(card.title);
    setFormCategory(card.category);
    setFormImage(card.image);
    setFormDescription(card.description);
    setFormNotes(card.notes || '');
    setIsCreateModalOpen(true);
  };

  const filteredHandouts = handouts.filter((h) => activeFilter === 'all' || h.category === activeFilter);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 p-6 overflow-y-auto select-none">
      
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-md">
        
        {/* Categories */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Tümü', icon: Sparkles },
            { id: 'location', label: 'Mekanlar & Manzaralar', icon: MapPin },
            { id: 'npc', label: 'Karakter / NPC Portreleri', icon: User },
            { id: 'handout', label: 'Fermanlar & Mektuplar', icon: Scroll },
            { id: 'item', label: 'Eşyalar & İpuçları', icon: Package },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Add Card Button (DM only) */}
        {!isStreamerMode && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFile}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => {
                setEditingCardId(null);
                setFormTitle('');
                setFormImage('');
                setFormDescription('');
                setFormNotes('');
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Sahne / Görsel Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of Scene Cards */}
      {filteredHandouts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-3xl p-12">
          <Sparkles className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
          <h3 className="text-base font-bold text-slate-400 mb-1">Henüz Sahne Görseli Yok</h3>
          <p className="text-xs text-slate-600 max-w-sm text-center">
            İnternetten veya Discord'dan bir resim kopyalayıp buraya doğrudan <strong>Ctrl+V</strong> ile yapıştırabilir veya yukarıdan yeni görsel ekleyebilirsin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredHandouts.map((card) => {
            const isSpotlighted = spotlightHandoutId === card.id;

            return (
              <div
                key={card.id}
                className={`relative flex flex-col bg-slate-900 border rounded-2xl overflow-hidden shadow-xl group transition-all duration-300 ${
                  isSpotlighted
                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.02] shadow-amber-500/20'
                    : 'border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
                }`}
              >
                {/* Image View */}
                <div className="relative w-full h-48 bg-slate-950 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                  {/* Category Pill */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-amber-400 capitalize">
                    {card.category}
                  </div>

                  {/* Spotlight Indicator Badge */}
                  {isSpotlighted && (
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-lg animate-pulse">
                      <Tv className="w-3 h-3" />
                      <span>Yayında</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex-1 p-4 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {card.description}
                    </p>
                    {card.notes && !isStreamerMode && (
                      <div className="mt-2 p-1.5 rounded bg-slate-950 border border-purple-900/40 text-[11px] text-purple-300 italic">
                        <strong>DM Notu:</strong> {card.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions (DM only) */}
                  {!isStreamerMode && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSpotlightHandoutId(isSpotlighted ? null : card.id)}
                        className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSpotlighted
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md'
                        }`}
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>{isSpotlighted ? 'Yansıtmayı Bitir' : 'Yayına Yansıt'}</span>
                      </button>

                      <button
                        onClick={() => startEdit(card)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteHandout(card.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Card Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-3.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-amber-400">
                {editingCardId ? 'Sahne Kartını Düzenle' : 'Yeni Sahne / Görsel Kartı Ekle'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-slate-400 mb-1">Görsel Başlığı</label>
              <input
                type="text"
                placeholder="Örn: Sisli Orman Geçidi, Han Sahibi Durnan..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-400 mb-1">Kategori</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'location', label: 'Mekan' },
                  { id: 'npc', label: 'NPC' },
                  { id: 'handout', label: 'Ferman' },
                  { id: 'item', label: 'Eşya' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFormCategory(c.id as any)}
                    className={`py-1.5 rounded-lg border font-bold capitalize cursor-pointer ${
                      formCategory === c.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview / Upload */}
            <div>
              <label className="block text-slate-400 mb-1">Resim (Dosya Yükle, URL veya Ctrl+V ile yapıştır)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Resim URL'si veya dosya yükleyin..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seç</span>
                </button>
              </div>
              {formImage && (
                <div className="mt-2 h-28 w-full rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                  <img src={formImage} alt="Preview" className="h-full object-contain" />
                </div>
              )}
            </div>

            {/* Narration Description */}
            <div>
              <label className="block text-slate-400 mb-1">Oyunculara Açık Hikaye Betimlemesi</label>
              <textarea
                placeholder="Bu mekan veya karakter hakkında oyunculara okunacak açıklama..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* DM Secret Notes */}
            <div>
              <label className="block text-slate-400 mb-1">DM Gizli Notları (Sadece siz görürsünüz)</label>
              <textarea
                placeholder="Örn: NPC aslında bir Doppelganger! Zindanın anahtarı cebinde."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-purple-300 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleSaveCard}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingCardId ? 'Güncelle' : 'Kartı Kaydet'}</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
