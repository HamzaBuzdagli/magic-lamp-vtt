import { useTranslation } from '../../hooks/useTranslation';
import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  ShieldAlert, 
  Gift, 
  Skull, 
  Layers, 
  Swords,
  Plus,
  Trash2,
  Edit2,
  FolderOpen,
  Settings,
  Dice5
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../hooks/useGameStore';
import type { CustomEncounterPreset, CustomEncounterMonster } from '../../types/game';

const QUICK_TRAPS = [
  { name: 'Zehirli Ok Düzeneği', dc: 'DC 13 Pasif Algı', effect: '2d6 Zehir Hasarı ve 1 tur sersemleme.' },
  { name: 'Paslı Kazık Çukuru', dc: 'DC 12 Pasif Algı', effect: '1d6 Delici Hasar ve DC 11 Çeviklik zarı.' },
  { name: 'Zemine Çizilmiş Alev Rünü', dc: 'DC 14 Pasif Algı', effect: '3d6 Alev Hasarı (3 metre yarıçap).' },
  { name: 'Yapışkan Örümcek Ağı', dc: 'DC 12 Pasif Algı', effect: 'DC 12 Güç zarı atılana kadar hareketsiz (Restrained).' },
  { name: 'Taş Sarkaç Giyotini', dc: 'DC 13 Pasif Algı', effect: '2d8 Kesme Hasarı.' },
  { name: 'Boğucu Mezar Gazı', dc: 'DC 14 Pasif Algı', effect: '2d8 Zehir Hasarı ve zehirlenme durumu.' }
];

const QUICK_LOOT = [
  { name: 'Paslı Ahşap Sandık', gold: 35, items: 'Küçük Şifa İksiri (2d4+2 HP), Paslı Hançer' },
  { name: 'Demir Kilitli Muhafız Sandığı', gold: 90, items: '2x Şifa İksiri, Zindan Demir Anahtarı, Gümüş Yüzük' },
  { name: 'Mühürlü Taş Lahit', gold: 120, items: 'Kutsal Su Şişesi, Gümüşlenmiş Hançer, Zümrüt Taşı' },
  { name: 'Obsidyen Büyülü Kasa', gold: 250, items: 'Büyü Parşömeni, Alev Direnç Yüzüğü, Şifa İksiri' },
  { name: 'Kraliyet Hazinesi Dağı', gold: 500, items: 'Büyülü Kılıç +1, Büyük Şifa İksiri (4d4+4), Saf Yakut Taşı' }
];

export const MagicLampModal: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isLampModalOpen, 
    setLampModalOpen, 
    rooms, 
    selectedRoomIds, 
    selectRoom,
    populateRoom,
    activeLayerId,
    encounterPresets,
    activeEncounterPresetId,
    setActiveEncounterPresetId,
    addEncounterPreset,
    updateEncounterPreset,
    deleteEncounterPreset,
    backstageTokens,
    isStreamerMode 
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'populate' | 'editor'>('populate');

  // Options checkboxes
  const [addMonsters, setAddMonsters] = useState(true);
  const [addTrap, setAddTrap] = useState(true);
  const [addLoot, setAddLoot] = useState(true);
  const [setFog, setSetFog] = useState(true);
  const [clearExisting, setClearExisting] = useState(true);

  const [isPopulating, setIsPopulating] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // Preset Editor Form State
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🕷️');
  const [formRoomTitle, setFormRoomTitle] = useState('');
  const [formRoomTheme, setFormRoomTheme] = useState<'stone' | 'crypt' | 'magma' | 'nature' | 'gold'>('stone');
  const [formDescription, setFormDescription] = useState('');
  
  // Trap form fields
  const [formTrapName, setFormTrapName] = useState('');
  const [formTrapDc, setFormTrapDc] = useState('');
  const [formTrapEffect, setFormTrapEffect] = useState('');
  const [formTrapImage, setFormTrapImage] = useState<string | undefined>(undefined);
  const [formTrapTemplateId, setFormTrapTemplateId] = useState<string | undefined>(undefined);

  // Loot form fields
  const [formLootName, setFormLootName] = useState('');
  const [formLootGold, setFormLootGold] = useState(50);
  const [formLootItems, setFormLootItems] = useState('Küçük Şifa İksiri, Parşömen');
  const [formLootImage, setFormLootImage] = useState<string | undefined>(undefined);
  const [formLootTemplateId, setFormLootTemplateId] = useState<string | undefined>(undefined);

  // Monsters list
  const [formMonsters, setFormMonsters] = useState<CustomEncounterMonster[]>([]);

  // Generic Vault Token Picker Modal state: 'monster' | 'trap' | 'loot' | null
  const [vaultPickerTarget, setVaultPickerTarget] = useState<'monster' | 'trap' | 'loot' | null>(null);

  if (!isLampModalOpen || isStreamerMode) return null;

  const activePreset = (encounterPresets || []).find((p) => p.id === activeEncounterPresetId) || encounterPresets?.[0];

  // Filter rooms by current floor/layer
  const availableRooms = rooms.filter((r) => !r.layerId || r.layerId === activeLayerId);
  const selectedRoomId = selectedRoomIds[0] || null;
  const activeRoom = availableRooms.find((r) => r.id === selectedRoomId) || availableRooms[0];

  const handlePopulate = () => {
    if (!activeRoom) {
      alert('Lütfen önce haritada bir oda oluşturun veya seçin!');
      return;
    }
    if (!activePreset) {
      alert('Lütfen bir tema preseti seçin!');
      return;
    }

    setIsPopulating(true);

    setTimeout(() => {
      // Map CustomEncounterPreset to populateRoom encounter payload
      const encounterPayload = {
        roomTitle: activePreset.roomTitle,
        roomTheme: activePreset.roomTheme,
        description: activePreset.description,
        trap: {
          name: activePreset.trapName,
          dc: activePreset.trapDc,
          effect: activePreset.trapEffect,
          image: activePreset.trapImage,
        },
        loot: {
          name: activePreset.lootName,
          gold: activePreset.lootGold,
          items: activePreset.lootItems,
          image: activePreset.lootImage,
        },
        monsters: activePreset.monsters.map((m) => ({
          name: m.name,
          image: m.image,
          hp: m.hp,
          ac: m.ac,
          speed: m.speed || 30,
          count: m.count || 1,
          size: m.size || 1,
          color: m.color || '#ef4444'
        }))
      };

      populateRoom(activeRoom.id, encounterPayload, {
        addMonsters,
        addTrap,
        addLoot,
        setFog,
        clearExisting,
      });

      setIsPopulating(false);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });

      setBroadcastNotice('"' + activeRoom.name + '" odası "' + activePreset.name + '" temasıyla dolduruldu!');
      setTimeout(() => setBroadcastNotice(null), 4000);
    }, 350);
  };

  const startNewPreset = () => {
    setEditingPresetId(null);
    setFormName('Yeni Zindan Teması');
    setFormIcon('⚔️');
    setFormRoomTitle('Karanlık Zindan Odası');
    setFormRoomTheme('stone');
    setFormDescription('Odaya adım attığınızda küf ve rutubet kokusu duyuluyor. Duvarlarda sönük meşaleler var...');
    
    setFormTrapName('Zehirli Ok Düzeneği');
    setFormTrapDc('DC 13 Pasif Algı');
    setFormTrapEffect('2d6 Zehir Hasarı.');
    setFormTrapImage(undefined);
    setFormTrapTemplateId(undefined);

    setFormLootName('Demir Kilitli Sandık');
    setFormLootGold(50);
    setFormLootItems('Şifa İksiri (2d4+2 HP), Demir Anahtar');
    setFormLootImage(undefined);
    setFormLootTemplateId(undefined);

    setFormMonsters([
      {
        id: 'mon-' + Date.now(),
        name: 'Zindan Muhafızı',
        hp: 14,
        ac: 13,
        speed: 30,
        count: 2,
        size: 1,
        color: '#ef4444'
      }
    ]);
    setIsEditingForm(true);
    setActiveTab('editor');
  };

  const startEditPreset = (preset: CustomEncounterPreset) => {
    setEditingPresetId(preset.id);
    setFormName(preset.name);
    setFormIcon(preset.icon || '⚔️');
    setFormRoomTitle(preset.roomTitle);
    setFormRoomTheme(preset.roomTheme || 'stone');
    setFormDescription(preset.description);

    setFormTrapName(preset.trapName);
    setFormTrapDc(preset.trapDc);
    setFormTrapEffect(preset.trapEffect);
    setFormTrapImage(preset.trapImage);
    setFormTrapTemplateId(preset.trapTemplateTokenId);

    setFormLootName(preset.lootName);
    setFormLootGold(preset.lootGold);
    setFormLootItems(preset.lootItems.join(', '));
    setFormLootImage(preset.lootImage);
    setFormLootTemplateId(preset.lootTemplateTokenId);

    setFormMonsters(preset.monsters || []);
    setIsEditingForm(true);
    setActiveTab('editor');
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const itemsArray = formLootItems.split(',').map((s) => s.trim()).filter(Boolean);

    const presetData = {
      name: formName.trim(),
      icon: formIcon.trim() || '⚔️',
      roomTitle: formRoomTitle.trim() || 'Zindan Odası',
      roomTheme: formRoomTheme,
      description: formDescription.trim(),
      trapName: formTrapName.trim() || 'Gizli Tuzak',
      trapDc: formTrapDc.trim() || 'DC 12 Pasif Algı',
      trapEffect: formTrapEffect.trim() || 'Hasar verir.',
      trapImage: formTrapImage,
      trapTemplateTokenId: formTrapTemplateId,
      lootName: formLootName.trim() || 'Hazine Sandığı',
      lootGold: Number(formLootGold) || 0,
      lootItems: itemsArray.length > 0 ? itemsArray : ['Altın'],
      lootImage: formLootImage,
      lootTemplateTokenId: formLootTemplateId,
      monsters: formMonsters
    };

    if (editingPresetId) {
      updateEncounterPreset(editingPresetId, presetData);
    } else {
      addEncounterPreset(presetData);
    }

    setIsEditingForm(false);
  };

  // Generic Vault Token Handler
  const handleSelectFromVault = (vaultToken: any) => {
    if (vaultPickerTarget === 'monster') {
      const acAttr = vaultToken.customAttributes?.find((a: any) => a.name.toLowerCase().includes('ac') || a.name.toLowerCase().includes('zırh'));
      const acValue = acAttr ? Number(acAttr.value) || 13 : 13;

      const newMon: CustomEncounterMonster = {
        id: 'mon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: vaultToken.name,
        image: vaultToken.image || undefined,
        color: vaultToken.color || '#ef4444',
        hp: vaultToken.hp?.max || 15,
        ac: acValue,
        speed: 30,
        count: 1,
        size: vaultToken.size || 1,
        templateTokenId: vaultToken.id
      };
      setFormMonsters([...formMonsters, newMon]);
    } else if (vaultPickerTarget === 'trap') {
      setFormTrapName(vaultToken.name);
      setFormTrapImage(vaultToken.image || undefined);
      setFormTrapTemplateId(vaultToken.id);
      if (vaultToken.notes) {
        setFormTrapEffect(vaultToken.notes);
      }
    } else if (vaultPickerTarget === 'loot') {
      setFormLootName(vaultToken.name);
      setFormLootImage(vaultToken.image || undefined);
      setFormLootTemplateId(vaultToken.id);
      if (vaultToken.notes) {
        setFormLootItems(vaultToken.notes);
      }
    }

    setVaultPickerTarget(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg text-xl">
              🧞‍♂️
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>{t('lamp.title')}</span>
              </h2>
              <p className="text-[10px] text-amber-400/80 font-semibold">
                Özelleştirilebilir canavarlar, tuzaklar ve sandıklar ile tek tıkla oda dizilimi.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold mr-2">
            <button
              onClick={() => setActiveTab('populate')}
              className={'px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ' + (
                activeTab === 'populate'
                  ? 'bg-amber-500 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>Odayı Doldur</span>
            </button>

            {!isStreamerMode && (
              <button
                onClick={() => setActiveTab('editor')}
                className={'px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ' + (
                  activeTab === 'editor'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Tema Presetleri</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setLampModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB 1: POPULATE ROOM */}
        {activeTab === 'populate' && (
          <div className="p-5 overflow-y-auto space-y-4 max-h-[78vh] text-xs">
            
            {/* STEP 1: TARGET ROOM SELECTOR */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Hedef Zindan Odası</span>
                  <span className="font-bold text-slate-200 text-xs">
                    {activeRoom ? ('🏰 ' + activeRoom.name + ' (' + activeRoom.width + 'x' + activeRoom.height + ' Kare)') : 'Haritada Oda Bulunamadı'}
                  </span>
                </div>
              </div>

              {availableRooms.length > 0 && (
                <select
                  value={activeRoom?.id || ''}
                  onChange={(e) => selectRoom(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 text-xs font-bold cursor-pointer focus:outline-none focus:border-amber-500"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.width}x{r.height})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* STEP 2: PRESET THEME SELECTOR PILLS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zindan Teması & Preset Seçin:</span>
                </label>

                {!isStreamerMode && (
                  <button
                    onClick={startNewPreset}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Yeni Tema Yarat</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(encounterPresets || []).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActiveEncounterPresetId(preset.id)}
                    className={'px-3 py-2 rounded-xl border text-center transition-all cursor-pointer flex items-center gap-2 shrink-0 ' + (
                      preset.id === activeEncounterPresetId
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md scale-102'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    )}
                  >
                    <span className="text-base">{preset.icon || '⚔️'}</span>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: LIVE ENCOUNTER PREVIEW CARD */}
            {activePreset && (
              <div className="bg-slate-950/90 border border-amber-500/50 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{activePreset.icon || '⚔️'}</span>
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase block tracking-wider">Oda Önizlemesi</span>
                      <h4 className="font-bold text-white text-sm">{activePreset.roomTitle}</h4>
                    </div>
                  </div>
                  
                  {!isStreamerMode && (
                    <button
                      onClick={() => startEditPreset(activePreset)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Bu Temayı Düzenle</span>
                    </button>
                  )}
                </div>

                {/* Read-Aloud Atmosphere Description */}
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-300 text-xs italic leading-relaxed">
                  "{activePreset.description}"
                </div>

                {/* Grid of details: Monsters, Trap, Loot */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  
                  {/* Monsters */}
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5" />
                      <span>Yaratıklar ({(activePreset.monsters || []).reduce((acc, m) => acc + (m.count || 1), 0)} Adet):</span>
                    </span>
                    <div className="space-y-1 text-slate-300">
                      {(activePreset.monsters || []).map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                          <div className="flex items-center gap-1.5 truncate">
                            {m.image ? (
                              <img src={m.image} alt={m.name} className="w-5 h-5 rounded-full object-cover border border-amber-500/50" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[9px]">
                                {m.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-bold text-xs truncate">{m.count}x {m.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">HP:{m.hp} AC:{m.ac}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trap */}
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Gizli Tuzak:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activePreset.trapImage && (
                        <img src={activePreset.trapImage} alt="trap" className="w-4 h-4 rounded-full object-cover border border-amber-400" />
                      )}
                      <span className="font-bold text-slate-200 text-xs truncate">{activePreset.trapName}</span>
                    </div>
                    <span className="text-[10px] text-amber-300/80 font-mono block">{activePreset.trapDc}</span>
                    <p className="text-[10px] text-slate-400 leading-tight">{activePreset.trapEffect}</p>
                  </div>

                  {/* Loot */}
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>Hazine Sandığı:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activePreset.lootImage && (
                        <img src={activePreset.lootImage} alt="loot" className="w-4 h-4 rounded-full object-cover border border-emerald-400" />
                      )}
                      <span className="font-bold text-slate-200 text-xs truncate">{activePreset.lootName}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold block">💰 {activePreset.lootGold} Altın</span>
                    <span className="text-[10px] text-slate-400 leading-tight block truncate">
                      {(activePreset.lootItems || []).join(', ')}
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: FINE-TUNING CHECKBOXES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={addMonsters}
                  onChange={(e) => setAddMonsters(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span>👾 Canavarları Yerleştir</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={addTrap}
                  onChange={(e) => setAddTrap(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span>⚠️ Gizli Tuzak Ekle</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={addLoot}
                  onChange={(e) => setAddLoot(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span>🎁 Hazine Sandığı Koy</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={setFog}
                  onChange={(e) => setSetFog(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span>🌫️ Savaş Sisi Çek (Gizle)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span>🧹 Eski Canavarları Temizle</span>
              </label>
            </div>

            {broadcastNotice && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold rounded-xl text-center text-xs animate-in fade-in flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{broadcastNotice}</span>
              </div>
            )}

            {/* MAIN ACTION BUTTON: RUB THE LAMP & POPULATE */}
            <div className="pt-1">
              <button
                onClick={handlePopulate}
                disabled={isPopulating || !activeRoom}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm cursor-pointer transition-all hover:scale-101"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isPopulating ? 'Cin Odayı Büyüyle Dolduruyor...' : ('✨ Lambayı Ov & "' + (activeRoom?.name || 'Seçili Odayı') + '" Doldur!')}
                </span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: PRESET THEME EDITOR */}
        {activeTab === 'editor' && (
          <div className="p-5 overflow-y-auto space-y-4 max-h-[78vh] text-xs">
            
            {/* Header / Add Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  <Swords className="w-4 h-4" />
                  <span>Tema & Karşılaşma Presetleri ({(encounterPresets || []).length})</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Her tema için canavarları, tuzakları ve sandıkları özelleştirin veya Gizli Kasadan ekleyin.
                </p>
              </div>

              {!isEditingForm && (
                <button
                  onClick={startNewPreset}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Tema Preset Ekle</span>
                </button>
              )}
            </div>

            {/* PRESET EDIT / CREATE FORM */}
            {isEditingForm ? (
              <form onSubmit={handleSavePreset} className="bg-slate-950 p-4 rounded-2xl border border-amber-500/60 space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400 text-xs">
                    {editingPresetId ? '✏️ Temayı Düzenle' : '✨ Yeni Tema Oluştur'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingForm(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Name, Icon, Room Theme */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Tema Adı</label>
                    <input
                      type="text"
                      placeholder="Örn: Örümcek Yuvası & Mağara"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">İkon (Emoji)</label>
                    <input
                      type="text"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-center text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Zemin Teması</label>
                    <select
                      value={formRoomTheme}
                      onChange={(e) => setFormRoomTheme(e.target.value as any)}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="stone">Taş Zindan</option>
                      <option value="crypt">Kadim Mezar</option>
                      <option value="nature">Doğa / Mağara</option>
                      <option value="magma">Lav / Magma</option>
                      <option value="gold">Kraliyet / Altın</option>
                    </select>
                  </div>
                </div>

                {/* Room Title & Atmosphere */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Oda Başlığı</label>
                    <input
                      type="text"
                      placeholder="Örn: Ağlarla Kaplanmış Örümcek Mahzeni"
                      value={formRoomTitle}
                      onChange={(e) => setFormRoomTitle(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">DM Atmosfer / Betimleme Metni</label>
                    <textarea
                      placeholder="Odaya girildiğinde oyunculara okunacak hikaye ve çevre tasviri..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>

                {/* MONSTERS SECTION: VAULT LINKING & MANUAL ADD */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                      <Skull className="w-3.5 h-3.5" />
                      <span>Odaya Doğacak Canavarlar ({formMonsters.length})</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVaultPickerTarget('monster')}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
                        title="Gizli Kasandaki özel resimli tokenı seç"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>🧰 Gizli Kasamdan Canavar Ekle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormMonsters([
                            ...formMonsters,
                            {
                              id: 'mon-' + Date.now(),
                              name: 'Yeni Canavar',
                              hp: 15,
                              ac: 13,
                              speed: 30,
                              count: 1,
                              size: 1,
                              color: '#ef4444'
                            }
                          ]);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Manuel Ekle</span>
                      </button>
                    </div>
                  </div>

                  {/* Monsters List Editor */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {formMonsters.length === 0 ? (
                      <div className="text-center py-3 text-slate-500 text-[11px]">
                        Henüz canavar eklenmedi. Yukarıdan Gizli Kasanızdaki yaratıklardan seçebilirsiniz!
                      </div>
                    ) : (
                      formMonsters.map((mon, index) => (
                        <div key={mon.id} className="p-2 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {mon.image ? (
                              <img src={mon.image} alt={mon.name} className="w-8 h-8 rounded-full object-cover border border-amber-500/60 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                                {mon.name.charAt(0)}
                              </div>
                            )}

                            <div className="flex flex-col flex-1">
                              <input
                                type="text"
                                value={mon.name}
                                onChange={(e) => {
                                  const updated = [...formMonsters];
                                  updated[index].name = e.target.value;
                                  setFormMonsters(updated);
                                }}
                                className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-bold focus:outline-none"
                              />
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                <span>HP:</span>
                                <input
                                  type="number"
                                  value={mon.hp}
                                  onChange={(e) => {
                                    const updated = [...formMonsters];
                                    updated[index].hp = Number(e.target.value);
                                    setFormMonsters(updated);
                                  }}
                                  className="w-10 px-1 bg-slate-900 border border-slate-700 rounded text-amber-400 text-center"
                                />
                                <span>AC:</span>
                                <input
                                  type="number"
                                  value={mon.ac}
                                  onChange={(e) => {
                                    const updated = [...formMonsters];
                                    updated[index].ac = Number(e.target.value);
                                    setFormMonsters(updated);
                                  }}
                                  className="w-10 px-1 bg-slate-900 border border-slate-700 rounded text-amber-400 text-center"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                              <span className="text-[10px] text-slate-400">Adet:</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={mon.count || 1}
                                onChange={(e) => {
                                  const updated = [...formMonsters];
                                  updated[index].count = Math.max(1, Number(e.target.value));
                                  setFormMonsters(updated);
                                }}
                                className="w-8 bg-transparent text-amber-400 font-bold text-center text-xs focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => setFormMonsters(formMonsters.filter((_, i) => i !== index))}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                              title="Kaldır"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TRAP & LOOT SECTION WITH VAULT PICKER & QUICK PRESETS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Trap Settings with Vault linking & Quick presets */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Gizli Tuzak Ayarları</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setVaultPickerTarget('trap')}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer text-[10px]"
                        title="Gizli Kasandan tuzak tokenı seç"
                      >
                        <FolderOpen className="w-3 h-3 text-amber-400" />
                        <span>Kasadan Seç</span>
                      </button>
                    </div>

                    {/* Quick Trap Preset Buttons */}
                    <div className="flex flex-wrap gap-1 pb-1">
                      {QUICK_TRAPS.map((qt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormTrapName(qt.name);
                            setFormTrapDc(qt.dc);
                            setFormTrapEffect(qt.effect);
                          }}
                          className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded text-[9px] cursor-pointer"
                        >
                          {qt.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {formTrapImage ? (
                        <img src={formTrapImage} alt="trap" className="w-8 h-8 rounded-full object-cover border border-amber-400 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          ⚠️
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Tuzak Adı"
                        value={formTrapName}
                        onChange={(e) => setFormTrapName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="DC (Örn: DC 13 Pasif Algı)"
                      value={formTrapDc}
                      onChange={(e) => setFormTrapDc(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                    />

                    <input
                      type="text"
                      placeholder="Tuzak Etkisi / Hasarı"
                      value={formTrapEffect}
                      onChange={(e) => setFormTrapEffect(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                    />
                  </div>

                  {/* Loot Settings with Vault linking & Quick presets */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" />
                        <span>Hazine Sandığı & Ganimet</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setVaultPickerTarget('loot')}
                        className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer text-[10px]"
                        title="Gizli Kasandan sandık/eşya tokenı seç"
                      >
                        <FolderOpen className="w-3 h-3 text-emerald-400" />
                        <span>Kasadan Seç</span>
                      </button>
                    </div>

                    {/* Quick Loot Preset Buttons */}
                    <div className="flex flex-wrap gap-1 pb-1">
                      {QUICK_LOOT.map((ql, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormLootName(ql.name);
                            setFormLootGold(ql.gold);
                            setFormLootItems(ql.items);
                          }}
                          className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 rounded text-[9px] cursor-pointer"
                        >
                          {ql.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {formLootImage ? (
                        <img src={formLootImage} alt="loot" className="w-8 h-8 rounded-full object-cover border border-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          🎁
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Sandık Adı"
                        value={formLootName}
                        onChange={(e) => setFormLootName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-400 font-bold shrink-0">💰 Altın:</span>
                      <input
                        type="number"
                        placeholder="Altın Miktarı"
                        value={formLootGold}
                        onChange={(e) => setFormLootGold(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold text-xs"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Eşyalar (Virgülle ayırın)"
                      value={formLootItems}
                      onChange={(e) => setFormLootItems(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                    />
                  </div>

                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer text-xs shadow"
                  >
                    {editingPresetId ? 'Değişiklikleri Kaydet' : 'Temayı Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingForm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer text-xs"
                  >
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              /* PRESETS LIST */
              <div className="space-y-2">
                {(encounterPresets || []).map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{preset.icon || '⚔️'}</span>
                      <div>
                        <h4 className="font-bold text-white text-xs">{preset.name}</h4>
                        <span className="text-[10px] text-amber-400/80 block">{preset.roomTitle}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>👾 {(preset.monsters || []).length} Canavar Tipi</span>
                          <span>•</span>
                          <span>⚠️ {preset.trapName}</span>
                          <span>•</span>
                          <span>💰 {preset.lootGold} GP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEditPreset(preset)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {encounterPresets.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm('"' + preset.name + '" temasını silmek istediğinize emin misiniz?')) {
                              deleteEncounterPreset(preset.id);
                            }
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-xl border border-slate-800 cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {/* POPUP: GİZLİ KASADAN TOKEN SEÇİCİ (CANAVAR, TUZAK VEYA SANDIK) */}
      {vaultPickerTarget && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setVaultPickerTarget(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl p-4 space-y-3 text-xs max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-slate-100 text-xs">
                  {vaultPickerTarget === 'monster' ? 'Gizli Kasadan Canavar Seçin' : vaultPickerTarget === 'trap' ? 'Gizli Kasadan Tuzak Tokenı Seçin' : 'Gizli Kasadan Hazine Sandığı Seçin'}
                </h4>
              </div>
              <button
                onClick={() => setVaultPickerTarget(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              Gizli Kasanızda hazırladığınız tokenlardan birine tıklayarak {vaultPickerTarget === 'monster' ? 'canavara' : vaultPickerTarget === 'trap' ? 'tuzağa' : 'sandığa'} bağlayabilirsiniz:
            </p>

            {/* List of Backstage Tokens */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-64 pr-1">
              {(backstageTokens || []).length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Gizli Kasanızda henüz kayıtlı token yok. Alt kısımdaki Gizli Kasa çekmecesinden yeni tokenlar ekleyebilirsiniz!
                </div>
              ) : (
                backstageTokens.map((vt) => (
                  <div
                    key={vt.id}
                    onClick={() => handleSelectFromVault(vt)}
                    className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/60 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      {vt.image ? (
                        <img src={vt.image} alt={vt.name} className="w-9 h-9 rounded-full object-cover border border-amber-400 group-hover:scale-105 transition-transform" />
                      ) : (
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                          style={{ backgroundColor: vt.color || '#ef4444' }}
                        >
                          {vt.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <span className="font-bold text-slate-100 block text-xs">{vt.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {vt.type === 'monster' ? '👾 Canavar' : vt.type === 'item' ? '📦 Eşya / Sandık' : vt.type === 'trap' ? '⚠️ Tuzak' : 'Karakter'}
                          {vt.notes ? ' • ' + vt.notes : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px]"
                    >
                      Seç
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setVaultPickerTarget(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
