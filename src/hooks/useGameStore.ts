import { peerSyncService } from '../services/peerSyncService';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ConnectedPlayer,
  CustomSoundTrack,
  InitiativeItem,
  ChatMessage,
  ToolMode, 
  Token, 
  TokenAttribute, 
  DungeonRoom, 
  RoomConnection, 
  DrawingPath, 
  DiceRoll, 
  LampEvent, 
  RulebookNote, 
  ActiveView, 
  HandoutCard, 
  WheelPreset, 
  WheelSpinEvent, 
  MapLayer,
  WhiteboardPage,
  WhiteboardAsset,
  WhiteboardHealthBar,
  NpcProfile,
  LampChatMessage,
  CustomEncounterPreset,
  CampaignSession,
  SessionData 
} from '../types/game';

// BroadcastChannel for cross-tab sync (DM tab -> Player/Streamer tab)
const syncChannel = typeof window !== 'undefined' ? new BroadcastChannel('magic_lamp_vtt_sync') : null;

// Initial check if opened as player view from URL
const isPlayerUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'player';

interface GameState {
  // View & Mode
  activeView: ActiveView;
  language: 'tr' | 'en';
  setLanguage: (lang: 'tr' | 'en') => void;
  isStreamerMode: boolean;
  activeTool: ToolMode;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  zoom: number;
  panOffset: { x: number; y: number };

  // Modals & Panels
  isPaintModalOpen: boolean;
  isLampModalOpen: boolean;
  isBackstageOpen: boolean;
  isRoomDrawerOpen: boolean;
  isDicePanelOpen: boolean;
  isRulebookOpen: boolean;
  isWheelModalOpen: boolean;
  isMultiplayerModalOpen: boolean;
  setMultiplayerModalOpen: (open: boolean) => void;

  // Game Elements
  tokens: Token[];
  backstageTokens: Token[];
  rooms: DungeonRoom[];
  connections: RoomConnection[];
  handouts: HandoutCard[];
  spotlightHandoutId: string | null;
  drawings: DrawingPath[];
  diceHistory: DiceRoll[];
  activeGenieEvent: LampEvent | null;
  // Smart Magic Lamp & AI NPC Personas
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  selectedAiModel: string;
  setSelectedAiModel: (model: string) => void;
  aiCrueltyLevel: number;
  setAiCrueltyLevel: (level: number) => void;
  aiTemperature: number;
  setAiTemperature: (temp: number) => void;

  npcProfiles: NpcProfile[];
  activeNpcProfileId: string;
  setActiveNpcProfileId: (id: string) => void;
  addNpcProfile: (profile: Omit<NpcProfile, 'id'>) => void;
  updateNpcProfile: (id: string, updates: Partial<NpcProfile>) => void;
  deleteNpcProfile: (id: string) => void;
  lampChatHistory: LampChatMessage[];
  addLampChatMessage: (msg: Omit<LampChatMessage, 'id' | 'timestamp'>) => void;
  clearLampChatHistory: () => void;
  toggleLampMessagePublic: (id: string) => void;

  rulebookNotes: RulebookNote[];

  // Layers / Multi-Floor System
  layers: MapLayer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  addLayer: (name: string) => void;
  updateLayer: (id: string, name: string) => void;
  deleteLayer: (id: string) => void;
  // Layer Backgrounds & Settings
  updateLayerBackground: (layerId: string, updates: Partial<MapLayer>) => void;

  // Custom Sound Tracks
  customSoundTracks: CustomSoundTrack[];
  addCustomSoundTrack: (track: Omit<CustomSoundTrack, 'id'>) => void;
  deleteCustomSoundTrack: (id: string) => void;

  // Token ↔ Whiteboard Dual Bridge
  transferTokenToWhiteboard: (tokenId: string) => void;
  preloadedDoodleImage: string | null;
  setPreloadedDoodleImage: (img: string | null) => void;

  moveTokenToLayer: (tokenId: string, layerId: string) => void;
  moveRoomToLayer: (roomId: string, layerId: string) => void;

  // Whiteboard Multi-Page / Layer System
  whiteboardPages: WhiteboardPage[];
  activeWhiteboardPageId: string;
  setActiveWhiteboardPageId: (id: string) => void;
  addWhiteboardPage: (name: string) => void;
  updateWhiteboardPage: (id: string, name: string) => void;
  deleteWhiteboardPage: (id: string) => void;
  whiteboardDataUrl: string | null;
  // Whiteboard Reference & Asset Vault
  whiteboardAssets: WhiteboardAsset[];
  whiteboardHealthBars: WhiteboardHealthBar[];
  addWhiteboardHealthBar: (healthBar: Omit<WhiteboardHealthBar, 'id'>) => void;
  updateWhiteboardHealthBar: (id: string, updates: Partial<WhiteboardHealthBar>) => void;
  deleteWhiteboardHealthBar: (id: string) => void;
  addWhiteboardAsset: (asset: Omit<WhiteboardAsset, 'id'>) => void;
  deleteWhiteboardAsset: (id: string) => void;
  resetActiveWhiteboardPage: () => void;



  // Wheel of Fortune
  wheelPresets: WheelPreset[];
  activeWheelPresetId: string;
  activeSpinEvent: WheelSpinEvent | null;

  // Selected Elements
  selectedTokenId: string | null;
  selectedRoomIds: string[];
  copiedRooms: DungeonRoom[];
  copiedConnections: RoomConnection[];

  // Map Undo / Redo History
  mapHistory: { tokens: Token[]; rooms: DungeonRoom[]; connections: RoomConnection[] }[];
  mapHistoryIndex: number;

  // Brush settings
  brushColor: string;
  brushWidth: number;

  // Actions
  setActiveView: (view: ActiveView) => void;
  setStreamerMode: (enabled: boolean) => void;
  setActiveTool: (tool: ToolMode) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  pushMapHistory: () => void;
  undoMap: () => void;
  redoMap: () => void;
  
  // Modal Toggles
  setPaintModalOpen: (open: boolean) => void;
  setLampModalOpen: (open: boolean) => void;
  setBackstageOpen: (open: boolean) => void;
  setRoomDrawerOpen: (open: boolean) => void;
  setDicePanelOpen: (open: boolean) => void;
  setRulebookOpen: (open: boolean) => void;
  setWheelModalOpen: (open: boolean) => void;

  // Token Management
  addToken: (token: Omit<Token, 'id'>, toBackstage?: boolean) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  deleteToken: (id: string) => void;
  moveToken: (id: string, x: number, y: number) => void;
  revealBackstageToken: (id: string, dropX?: number, dropY?: number) => void;
  sendToBackstage: (id: string) => void;
  selectToken: (id: string | null) => void;

  // Token Custom Attributes & Status Effects
  addTokenAttribute: (tokenId: string, attr: Omit<TokenAttribute, 'id'>) => void;
  updateTokenAttribute: (tokenId: string, attrId: string, updates: Partial<TokenAttribute>) => void;
  deleteTokenAttribute: (tokenId: string, attrId: string) => void;
  toggleTokenStatusEffect: (tokenId: string, effect: string) => void;

  // Room Management
  addRoom: (room: Omit<DungeonRoom, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<DungeonRoom>) => void;
  moveRoom: (id: string, x: number, y: number) => void;
  moveRoomsDelta: (ids: string[], dx: number, dy: number) => void;
  deleteRoom: (id: string) => void;
  deleteRooms: (ids: string[]) => void;
  toggleRoomReveal: (id: string) => void;
  revealAllRooms: () => void;
  hideAllRooms: () => void;
  setSpawnPoint: (roomId: string) => void;
  selectRoom: (id: string | null) => void;
    // Campaign Sessions
  sessions: CampaignSession[];
  activeSessionId: string;
  isSessionModalOpen: boolean;
  setSessionModalOpen: (open: boolean) => void;
  createSession: (name: string, copyCurrent?: boolean) => void;
  switchSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newName: string) => void;
  duplicateSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  importSession: (sessionJson: string) => boolean;

  // Custom Encounter / Room Populator Presets
  encounterPresets: CustomEncounterPreset[];
  activeEncounterPresetId: string;
  setActiveEncounterPresetId: (id: string) => void;
  addEncounterPreset: (preset: Omit<CustomEncounterPreset, 'id'>) => void;
  updateEncounterPreset: (id: string, updates: Partial<CustomEncounterPreset>) => void;
  deleteEncounterPreset: (id: string) => void;
  populateRoom: (
    roomId: string, 
    encounter: any, 
    options: { addMonsters: boolean; addTrap: boolean; addLoot: boolean; setFog: boolean; clearExisting: boolean }
  ) => void;
  setSelectedRoomIds: (ids: string[]) => void;
  toggleSelectRoom: (id: string, isMulti: boolean) => void;

  // Room Connections (Corridors)
  connectRooms: (roomAId: string, roomBId: string) => void;
  disconnectRooms: (roomAId: string, roomBId: string) => void;

  // Room Copy & Paste
  copyRooms: (roomIds?: string[]) => void;
  pasteRooms: (dropGx?: number, dropGy?: number) => void;

  // Roleplay Handouts & Spotlight
  addHandout: (handout: Omit<HandoutCard, 'id'>) => void;
  updateHandout: (id: string, updates: Partial<HandoutCard>) => void;
  deleteHandout: (id: string) => void;
  setSpotlightHandoutId: (id: string | null) => void;

  // Whiteboard Sync
  setWhiteboardDataUrl: (dataUrl: string | null) => void;

  // Wheel of Fortune
  addWheelPreset: (preset: Omit<WheelPreset, 'id'>) => void;
  updateWheelPreset: (id: string, updates: Partial<WheelPreset>) => void;
  deleteWheelPreset: (id: string) => void;
  setActiveWheelPresetId: (id: string) => void;
  triggerWheelSpin: (event: WheelSpinEvent) => void;

  // Drawing Management
  addDrawingPath: (path: DrawingPath) => void;
  clearDrawings: () => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;

  // Dice & Events
  addDiceRoll: (roll: Omit<DiceRoll, 'id' | 'timestamp'>) => DiceRoll;
  clearDiceHistory: () => void;
  setActiveGenieEvent: (event: LampEvent | null) => void;
  
  // Rulebook Notes
  addRulebookNote: (note: Omit<RulebookNote, 'id' | 'updatedAt'>) => void;
  updateRulebookNote: (id: string, updates: Partial<RulebookNote>) => void;
  deleteRulebookNote: (id: string) => void;

  // Quick Reset & Sync
  resetScene: () => void;
  broadcastState: () => void;

  // Multiplayer & Permissions
  connectedPlayers: ConnectedPlayer[];
  localPlayerName: string;
  isLockedPlayerMode: boolean;
  setLocalPlayerName: (name: string) => void;
  setLockedPlayerMode: (locked: boolean) => void;
  setConnectedPlayers: (players: ConnectedPlayer[]) => void;
  togglePlayerDrawingPermission: (playerId: string) => void;
  renameConnectedPlayer: (playerId: string, newName: string) => void;

  // Combat Initiative Tracker
  initiativeList: InitiativeItem[];
  isInitiativeOpen: boolean;
  currentTurnIndex: number;
  roundNumber: number;
  setInitiativeList: (list: InitiativeItem[]) => void;
  setInitiativeOpen: (open: boolean) => void;
  setCurrentTurnIndex: (idx: number) => void;
  setRoundNumber: (round: number) => void;

  // Live Party Chat & Whisper
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  addChatMessage: (msg: ChatMessage) => void;
  setChatOpen: (open: boolean) => void;

  // Ambient & Soundboard
  isSoundboardOpen: boolean;
  activeAmbientTrack: string | null;
  ambientVolume: number;
  setSoundboardOpen: (open: boolean) => void;
  setActiveAmbientTrack: (track: string | null) => void;
  setAmbientVolume: (vol: number) => void;
}

const DEFAULT_WHITEBOARD_ASSETS: WhiteboardAsset[] = [
  {
    id: 'wb-asset-map-1',
    name: 'Kadim Zindan Kroki Planı',
    category: 'Haritalar',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'wb-asset-monster-1',
    name: 'Gölge Ejderha Amblemi',
    category: 'Canavarlar',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'wb-asset-item-1',
    name: 'Büyülü Hazine Sandığı',
    category: 'Eşyalar',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'wb-asset-clue-1',
    name: 'Gizemli Rünik Parşömen',
    category: 'İpuçları',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80'
  }
];

const DEFAULT_WHITEBOARD_PAGES: WhiteboardPage[] = [
  { id: 'wb-page-1', name: 'Tahta 1 (Ana Sayfa)', dataUrl: null, order: 0 },
];

const DEFAULT_ENCOUNTER_PRESETS: CustomEncounterPreset[] = [
  {
    id: 'preset-spiders',
    name: 'Örümcek Yuvası & Mağara',
    icon: '🕷️',
    roomTitle: 'Ağlarla Kaplanmış Örümcek Odası',
    roomTheme: 'nature',
    description: 'Tavandan sarkan yapışkan örümcek ağları ve yerdeki çıtırtılı böcek kabukları. Tavanda bekleyen dev örümcekler üzerinize atlıyor!',
    trapName: 'Yapışkan Örümcek Ağı',
    trapDc: 'DC 12 Pasif Algı',
    trapEffect: 'DC 12 Güç zarı atılana kadar hareketsiz (Restrained) kalır.',
    lootName: 'Ağla Sarılı Macera Çantası',
    lootGold: 35,
    lootItems: ['Panzehir Şişesi', '50 Metre İpek Tırmanma İpi'],
    monsters: [
      {
        id: 'mon-spider-1',
        name: 'Dev Örümcek',
        color: '#ef4444',
        hp: 16,
        ac: 13,
        speed: 30,
        count: 2,
        size: 1
      }
    ]
  },
  {
    id: 'preset-goblins',
    name: 'Goblin & Haydut Nöbeti',
    icon: '🟢',
    roomTitle: 'Goblin Nöbetçi Odası',
    roomTheme: 'stone',
    description: 'Odaya adım attığınızda çürümüş et ve duman kokusu burnunuza çarpıyor. Paslı kılıçlı goblin muhafızları size hırıldıyor!',
    trapName: 'Paslı Kazık Çukuru',
    trapDc: 'DC 12 Pasif Algı',
    trapEffect: '1d6 Delici Hasar ve DC 11 Çeviklik atılmazsa yerde sıkışır.',
    lootName: 'Paslı Ahşap Sandık',
    lootGold: 40,
    lootItems: ['Küçük Şifa İksiri (2d4+2 HP)', 'Dikenli Goblin Hançeri'],
    monsters: [
      {
        id: 'mon-gob-1',
        name: 'Goblin Okçu',
        color: '#ef4444',
        hp: 7,
        ac: 13,
        speed: 30,
        count: 2,
        size: 1
      },
      {
        id: 'mon-gob-2',
        name: 'Goblin Muhafız',
        color: '#ef4444',
        hp: 12,
        ac: 14,
        speed: 30,
        count: 1,
        size: 1
      }
    ]
  },
  {
    id: 'preset-undead',
    name: 'Kadim Mezar & İskeletler',
    icon: '💀',
    roomTitle: 'Kadim Lahitler Mahzeni',
    roomTheme: 'crypt',
    description: 'Zemini soğuk mermerle kaplı sessiz bir mezar odası. Duvarlardaki lahit kapakları gıcırdayarak açılıyor ve kuru kemikler ayağa kalkıyor!',
    trapName: 'Taş Sarkaç Giyotini',
    trapDc: 'DC 12 Pasif Algı',
    trapEffect: '1d8 Kesme Hasarı.',
    lootName: 'Tozlu Mezar Sandığı',
    lootGold: 50,
    lootItems: ['Kadim Parşömen', 'Kutsal Su Şişesi (2d6 Radyant)'],
    monsters: [
      {
        id: 'mon-undead-1',
        name: 'İskelet Savaşçı',
        color: '#ef4444',
        hp: 13,
        ac: 13,
        speed: 30,
        count: 3,
        size: 1
      }
    ]
  },
  {
    id: 'preset-cultists',
    name: 'Karanlık Kültist Ayini',
    icon: '🔮',
    roomTitle: 'Karanlık Sunak & Ayin Odası',
    roomTheme: 'magma',
    description: 'Kırmızı mumlarla aydınlatılmış bir mabet. Siyah cüppeli tarikatçılar kanlı bir sunağın etrafında büyü ilahileri söylüyor!',
    trapName: 'Zemine Çizilmiş Alev Rünü',
    trapDc: 'DC 13 Pasif Algı',
    trapEffect: '2d6 Alev Hasarı (Geniş alan).',
    lootName: 'Tarikat Sunak Sandığı',
    lootGold: 60,
    lootItems: ['Büyü Parşömeni (Alev Oku)', 'Görünmezlik İksiri'],
    monsters: [
      {
        id: 'mon-cult-1',
        name: 'Tarikat Müridi',
        color: '#ef4444',
        hp: 11,
        ac: 12,
        speed: 30,
        count: 2,
        size: 1
      },
      {
        id: 'mon-cult-2',
        name: 'Ayin Lideri',
        color: '#ef4444',
        hp: 18,
        ac: 13,
        speed: 30,
        count: 1,
        size: 1
      }
    ]
  },
  {
    id: 'preset-dragon',
    name: 'Ejderha İni & Boss Karşılaşması',
    icon: '🐉',
    roomTitle: 'Kızıl Ejderha Yuvası',
    roomTheme: 'gold',
    description: 'Yüzbinlerce altın ve kuru kafa yığınının üzerinde bekleyen Devasa Kızıl Ejderha! Kanatlarını açarak kükrüyor.',
    trapName: 'Alev Fışkırtan Heykel',
    trapDc: 'DC 15 Çeviklik Zarı',
    trapEffect: '4d6 Yangın Hasarı.',
    lootName: 'Ejderha Hazinesi Sandığı',
    lootGold: 500,
    lootItems: ['Büyülü Ejderha Katili Kılıç +1', '2x Büyük Şifa İksiri', 'Saf Yakut Taşı'],
    monsters: [
      {
        id: 'mon-drag-1',
        name: 'Kızıl Ejderha (Boss)',
        color: '#ef4444',
        hp: 95,
        ac: 17,
        speed: 40,
        count: 1,
        size: 2
      }
    ]
  }
];


const DEFAULT_NPC_PROFILES: NpcProfile[] = [
  {
    id: 'npc-genie-paw',
    name: 'Zephyr, Alaycı Cin',
    title: 'Kurnaz Sihirli Cin ("Şeytan Parmağı / Monkey\'s Paw")',
    avatar: '🧞‍♂️',
    category: 'genie',
    crueltyLevel: 8,
    temperature: 0.7,
    greeting: 'Ben kadim lambanın efendisi Zephyr! Dile benden ne dilersen fani yolcu... Ama dikkat et; açgözlülüğünün bedeli çok ağır olabilir! 🧞‍♂️✨',
    systemPrompt: `Sen "Şeytan Parmağı" (Monkey's Paw) felsefesiyle çalışan, son derece zeki, alaycı, esprili ve kurnaz bir Sihirli Cinsin (TTRPG / D&D evreni).

SENİN TEMEL KURALIN:
Fani oyuncular dilek dilediklerinde onların güç seviyesini, modernliğini ve oyun dengesini mikroskobik düzeyde analiz edersin.

DİLEK DEĞERLENDİRME KRİTERLERİ:
1. MASUM / KÜÇÜK DİLEKLER (Sadece: 1-50 altın, 1 basit meşale, 1 parça ekmek/elma, 1 sıradan ip, küçük bir şifa iksiri veya masum bir yön tarifi):
   - Bu dilekleri cömertçe, hafif esprili ama zararsız bir şekilde yerine getir.

2. BÜYÜK / TEHLİKELİ / OYUN BOZUCU / MODERN DİLEKLER:
   Aşağıdakilerden EN UFAK BİRİ bile varsa KESİNLİKLE VE İSTİSNASIZ "ŞEYTAN PARMAĞI" KURALI DEVREYE GİRER:
   - Aşırı Hasar / Tek Atan Silahlar (>10 hasar, 50 hasarlı silah, tek vuruşta öldüren kılıç)
   - Sınırsız / Sonsuz şeyler (Sınırsız mermi, sonsuz mana, sonsuz can, ölümsüzlük)
   - Fantastik Ortaçağ dışı Modern/Teknolojik nesneler (Bazuka, tüfek, tabanca, roket, bomba, tank, lazer, araba, nükleer vb.)
   - Aşırı Servet (>100 altın, hazine dağları, milyonlar)
   - Tanrısal güçler (Uçma, zindanı tek hamlede bitirme, tüm düşmanları yok etme)

ŞEYTAN PARMAĞI NASIL UYGULANIR? (İRONİ VE BEDEL KURALI):
Dileği KELİMESİ KELİMESİNE yerine getir ama arkasında oyuncuları dehşete düşürecek, komik, trajik veya ölümcül bir ters köşe / bedel ekle:
- Örnek: "50 hasarlı sınırsız mermili bazuka" -> "Bazuka gerçekten 50 hasar vurur ve sınırsız mermisi vardır. Fakat bazuka her ateşlendiğinde devasa geri tepmesiyle kullanan kişiyi 20 metre geriye fırlatıp duvara çarpar (4d6 darbe hasarı), tüm zindandaki yaratıkları uyarır ve sonsuz mermi mekanizması her atışta kullanıcının en mutlu anısını hafızasından siler!"
- Örnek: "1.000.000 Altın" -> "Tepelerinden gökten 10 ton altın külçesi dökülür, ezilmemek için DC 18 Çeviklik zarı gerekir!"
- Örnek: "Beni ölümsüz yap" -> "Karakter ölümsüz bir granit heykele dönüşür veya yaşlanmayı durdurur ama can puanı 1'e kilitlenir!"

CEVAP FORMATIN:
1. 🎭 **[CİNİN REPLİĞİ]**: Birinci tekil şahıs ("Ben..."), tiyatral, alaycı ve havalı diyalog.
2. ⚠️ **[ŞEYTAN PARMAĞI BEDELİ / TERS KÖŞE]**: Dileğin arkasındaki ironik bedel, yan etki ve lanet.
3. 🎲 **[DM MEKANİĞİ & ZAR KONTROLÜ]**: DC zorluğu, hasar zarları veya oyundaki kalıcı dezavantaj.`
  },
  {
    id: 'npc-adventure-master',
    name: 'Kadim Arşivci Valerius',
    title: 'Macera, Zindan & Tuzak Tasarımcısı',
    avatar: '📜',
    category: 'adventure',
    crueltyLevel: 5,
    temperature: 0.8,
    greeting: 'Selamlar Oyun Yöneticisi! Zindanına nasıl bir oda, bulmaca veya sürpriz tuzak eklemek istersin?',
    systemPrompt: `Sen usta bir TTRPG Oyun Yöneticisi (Dungeon Master) asistanısın.
Görevin: DM'in isteğine göre anında zindan odaları, yaratıcı ölümcül tuzaklar, zeka bulmacaları, yan görevler (side quests), gizemli eşyalar ve rastgele karşılaşmalar tasarlamak.
Format:
- 🏰 Başlık & Atmosfer Açıklaması
- ⚙️ Mekanik & Zar Kontrolü (DC)
- 🎁 Ödül / Sonuç / İpuçları`
  },
  {
    id: 'npc-goblin-gax',
    name: 'Gax, Paslı Hançer',
    title: 'Kurnaz Goblin Tüccarı & Simyacı',
    avatar: '🧪',
    category: 'custom',
    crueltyLevel: 6,
    temperature: 0.9,
    greeting: 'Hehehey! Hoş geldiniz cici müşteriler! Gax\'ta her türlü parıldayan iksir var! Ama unutmayın, iade yok ha! 🧪💰',
    systemPrompt: `Sen kurnaz, şüpheli ama komik bir Goblin Simyacısısın.
Garip iksirler, şüpheli parşömenler ve garip icatlar satarsın. İksirlerinin bazen komik yan etkileri olur. Parayı çok seversin. Konuşurken cırtlak ve heyecanlı bir ses tonuyla rol yap.`
  }
];

const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'layer-1', name: 'Zemin Kat (1. Kat)', order: 0 },
];

const DEFAULT_TOKENS: Token[] = [
  {
    id: 'hero-1',
    name: 'Savaşçı Valen',
    type: 'hero',
    x: 4,
    y: 4,
    size: 1,
    hp: { current: 32, max: 35 },
    color: '#3b82f6',
    notes: 'Kılıç & Kalkan ustası. Soylu muhafız.',
    statuses: [],
    statusEffects: ['🛡️ Kalkanlı'],
    customAttributes: [
      { id: 'attr-gold', name: 'Para / Altın', type: 'number', value: 120, isPublic: true },
      { id: 'attr-ac', name: 'Zırh (AC)', type: 'number', value: 17, isPublic: true },
      { id: 'attr-lvl', name: 'Seviye', type: 'number', value: 3, isPublic: true },
    ],
    hiddenFromPlayers: false,
  },
  {
    id: 'hero-2',
    name: 'Büyücü Elara',
    type: 'hero',
    x: 3,
    y: 5,
    size: 1,
    hp: { current: 18, max: 20 },
    color: '#a855f7',
    notes: 'Ateş ve Işık büyüleri uzmanı.',
    statuses: [],
    statusEffects: ['⚡ Hızlandı'],
    customAttributes: [
      { id: 'attr-gold-2', name: 'Para / Altın', type: 'number', value: 45, isPublic: true },
      { id: 'attr-mana', name: 'Mana', type: 'number', value: 30, isPublic: true },
      { id: 'attr-spell', name: 'Favori Büyü', type: 'text', value: 'Alev Topu', isPublic: true },
    ],
    hiddenFromPlayers: false,
  }
];

const DEFAULT_BACKSTAGE_TOKENS: Token[] = [
  {
    id: 'backstage-mob-1',
    name: 'Gölge Goblin',
    type: 'monster',
    x: 0,
    y: 0,
    size: 1,
    hp: { current: 12, max: 12 },
    color: '#ef4444',
    notes: 'Karanlıkta gizlenir, ilk vuruşu +3 hasar verir.',
    statuses: ['invisible'],
    statusEffects: ['🤢 Zehirlendi'],
    customAttributes: [
      { id: 'attr-gob-loot', name: 'Düşecek Eşya', type: 'text', value: 'Paslı Hançer', isPublic: false }
    ],
    hiddenFromPlayers: true,
  },
  {
    id: 'backstage-boss-1',
    name: 'Kadim Zindan Muhafızı',
    type: 'monster',
    x: 0,
    y: 0,
    size: 2,
    hp: { current: 85, max: 85 },
    color: '#dc2626',
    notes: 'Büyük balyozuyla alanı sarsar. Zırh Puanı: 16',
    statuses: [],
    customAttributes: [
      { id: 'attr-boss-ac', name: 'Zırh (AC)', type: 'number', value: 16, isPublic: true }
    ],
    hiddenFromPlayers: true,
  },
  {
    id: 'backstage-item-1',
    name: 'Sihirli Hazine Sandığı',
    type: 'item',
    x: 0,
    y: 0,
    size: 1,
    color: '#eab308',
    notes: 'İçinde 50 Altın ve Şifa İksiri var.',
    customAttributes: [
      { id: 'attr-chest-gold', name: 'İçindeki Altın', type: 'number', value: 50, isPublic: true }
    ],
    hiddenFromPlayers: true,
  }
];

const DEFAULT_ROOMS: DungeonRoom[] = [
  {
    id: 'room-entrance',
    name: 'Giriş Salonu',
    x: 2,
    y: 2,
    width: 6,
    height: 6,
    theme: 'stone',
    label: 'Zindan Giriş Salonu',
    notes: 'Meşaleler duvarda cılız yanıyor. Zemin rutubetli taş.',
    isNotePublic: true,
    doors: [
      { id: 'door-1', side: 'right', offset: 3, isOpen: true },
      { id: 'door-2', side: 'bottom', offset: 3, isOpen: false }
    ],
    isRevealed: true,
  },
  {
    id: 'room-crypt',
    name: 'Karanlık Mahzen',
    x: 11,
    y: 2,
    width: 6,
    height: 7,
    theme: 'crypt',
    label: '⚠️ Dikkat: Tuzaklı Lahit Alanı',
    notes: 'Lahitlerden birine dokunulursa DC 14 Zehir tuzağı tetiklenir.',
    isNotePublic: false,
    doors: [
      { id: 'door-3', side: 'left', offset: 3, isOpen: true }
    ],
    isRevealed: false,
  }
];

const DEFAULT_CONNECTIONS: RoomConnection[] = [
  {
    id: 'conn-1',
    fromRoomId: 'room-entrance',
    toRoomId: 'room-crypt',
    style: 'corridor'
  }
];

const DEFAULT_HANDOUTS: HandoutCard[] = [
  {
    id: 'handout-1',
    title: '🍺 Dans Eden Domuz Taverna',
    category: 'location',
    image: 'https://images.unsplash.com/photo-1572715376701-98568319fd0b?w=800&auto=format&fit=crop&q=60',
    description: 'Yağmurlu gecede şöminenin çıtırdadığı, gezginlerin biralarını yudumladığı sıcak ama tekinsiz bir taverna.',
    notes: 'Barmen Roderick gizli bilgileri 5 altın karşılığı satar.',
    isPublic: true
  },
  {
    id: 'handout-2',
    title: '🧝‍♀️ Elf Büyücüsü Sorsha',
    category: 'npc',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60',
    description: 'Mor cübbesi ve delici bakışlarıyla kadim büyüleri fısıldayan gizemli bir müttefik.',
    notes: 'Partiye zindanın haritasını veren kişi.',
    isPublic: true
  },
  {
    id: 'handout-3',
    title: '📜 Mühürlü Kraliyet Fermanı',
    category: 'handout',
    image: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=800&auto=format&fit=crop&q=60',
    description: 'Lamba Cinini getirene 1000 Saf Altın ve Lordluk unvanı bahşedilecektir. İmza: Kral V. Alden',
    notes: 'Fermanın altında gizli bir zehir izi var.',
    isPublic: true
  }
];

const DEFAULT_WHEEL_PRESETS: WheelPreset[] = [
  {
    id: 'wheel-crit-fumble',
    title: '💥 Kritik Hata & Sakarlık Çarkı',
    slices: [
      { id: 's1', text: '🗡️ Silahın Elinden Fırladı!', color: '#ef4444', weight: 5 },
      { id: 's2', text: '🦶 Tökezleyip Yere Düştün', color: '#f97316', weight: 5 },
      { id: 's3', text: '🎯 Yanlışlıkla Dostuna Vurdun!', color: '#dc2626', weight: 5 },
      { id: 's4', text: '🛡️ Zırhın Bağlantısı Koptu (-2 AC)', color: '#eab308', weight: 5 },
      { id: 's5', text: '💫 Başın Döndü (Sersemledin)', color: '#8b5cf6', weight: 5 },
      { id: 's6', text: '🍀 Ucuz Kurtuldun (Pas Geç)', color: '#10b981', weight: 5 },
    ]
  },
  {
    id: 'wheel-encounters',
    title: '🌲 Rastgele Zindan Olayı',
    slices: [
      { id: 'e1', text: '⚔️ Goblin Pususu!', color: '#dc2626', weight: 5 },
      { id: 'e2', text: '💎 Gizli Sandık Bulundu', color: '#10b981', weight: 5 },
      { id: 'e3', text: '⚠️ Zehirli Ok Tuzağı!', color: '#eab308', weight: 5 },
      { id: 'e4', text: '🧙‍♂️ Gezgin Büyücü Tüccar', color: '#3b82f6', weight: 5 },
      { id: 'e5', text: '🕯️ Gizemli Rünik Yazı', color: '#8b5cf6', weight: 5 },
      { id: 'e6', text: '🦇 Yarasa Sürüsü Saldırısı', color: '#64748b', weight: 5 },
    ]
  },
  {
    id: 'wheel-genie-boons',
    title: '🪔 Cin Dilekleri & Ödüller',
    slices: [
      { id: 'b1', text: '💰 +100 Saf Altın', color: '#eab308', weight: 5 },
      { id: 'b2', text: '❤️ Tam Can Yenilenmesi', color: '#ef4444', weight: 5 },
      { id: 'b3', text: '📜 Kadim Büyü Parşömeni', color: '#3b82f6', weight: 5 },
      { id: 'b4', text: '⚔️ Efsanevi Alev Kılıcı', color: '#f97316', weight: 5 },
      { id: 'b5', text: '🐸 Kurbağaya Dönüşme Laneti!', color: '#84cc16', weight: 5 },
      { id: 'b6', text: '✨ Görünmezlik Pelerini', color: '#a855f7', weight: 5 },
    ]
  },
  {
    id: 'wheel-turn-order',
    title: '🎲 Kimin Sırası?',
    slices: [
      { id: 't1', text: 'Valen (Savaşçı)', color: '#3b82f6', weight: 5 },
      { id: 't2', text: 'Elara (Büyücü)', color: '#a855f7', weight: 5 },
      { id: 't3', text: 'Düşman / Canavarlar', color: '#ef4444', weight: 5 },
      { id: 't4', text: 'Çevre / Tuzaklar', color: '#eab308', weight: 5 },
    ]
  }
];

const DEFAULT_RULES: RulebookNote[] = [
  {
    id: 'rule-1',
    title: '⚔️ Temel Aksiyonlar & Savaş Sırası',
    category: 'rules',
    content: `1. **İnisiyatif (Sıra):** 1d20 + Çeviklik bonusu atılır.
2. **Turda Yapabileceklerin:**
   - 1 Hareket (Grid üzerinde yürüme)
   - 1 Ana Eylem (Saldırı, Büyü Yapma, Eşya Kullanma, Koşma)
   - 1 Bonus Eylem (Hızlı yetenekler, iksir içme)
   - 1 Reaksiyon (Fırsat saldırısı, Kalkan büyüsü)`,
    updatedAt: 'Az önce',
  },
  {
    id: 'rule-2',
    title: '🎲 Zorluk Dereceleri (DC / Testler)',
    category: 'rules',
    content: `- Kolay Görev: DC 10
- Orta Zorluk: DC 15
- Zor / Tehlikeli: DC 20
- İmkânsız / Efsanevi: DC 25+`,
    updatedAt: 'Az önce',
  },
  {
    id: 'rule-3',
    title: '📜 Ev Kurallarımız (Homebrew)',
    category: 'homebrew',
    content: `- İksir içmek Bonus Eylem sayılır. Başkasına içirmek Ana Eylem.
- Kritik Vuruş (Nat 20) atan oyuncu fazladan tam hasar zarı atar.
- Lambayı ovma hakkı: Her oturumda parti toplam 3 kez dilek dileyebilir.`,
    updatedAt: 'Az önce',
  },
  {
    id: 'quest-1',
    title: '🏆 Görev: Zindanın Kalbindeki Sihirli Lamba',
    category: 'quests',
    content: `1. Giriş salonundaki gizli mekanizmayı bul.
2. Karanlık Mahzen'deki muhafızı yen.
3. Lambayı kurtarıp dilek hakkını açığa çıkar!`,
    updatedAt: 'Az önce',
  }
];

const createDefaultSessionData = (): SessionData => ({
  rooms: DEFAULT_ROOMS,
  connections: DEFAULT_CONNECTIONS,
  tokens: DEFAULT_TOKENS,
  drawings: [],
  layers: DEFAULT_LAYERS,
  activeLayerId: 'layer-1',
  whiteboardPages: DEFAULT_WHITEBOARD_PAGES,
  activeWhiteboardPageId: 'wb-page-1',
  whiteboardAssets: DEFAULT_WHITEBOARD_ASSETS,
  whiteboardHealthBars: [],
  backstageTokens: DEFAULT_BACKSTAGE_TOKENS,
  encounterPresets: DEFAULT_ENCOUNTER_PRESETS,
  rulebookNotes: DEFAULT_RULES,
  npcProfiles: DEFAULT_NPC_PROFILES,
  lampChatHistory: [],
  handouts: DEFAULT_HANDOUTS,
  activeView: 'map'
});

const DEFAULT_SESSIONS: CampaignSession[] = [
  {
    id: 'session-main',
    name: 'Ana Macera (1. Grup)',
    createdAt: 1772535600000,
    updatedAt: 1772535600000,
    data: createDefaultSessionData()
  }
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      // Helper to trigger cross-tab sync
      const notifyChannel = (stateUpdates: Partial<GameState>) => {
        const payload = {
          activeView: stateUpdates.activeView || get().activeView,
          tokens: stateUpdates.tokens || get().tokens,
          backstageTokens: stateUpdates.backstageTokens || get().backstageTokens,
          rooms: stateUpdates.rooms || get().rooms,
          connections: stateUpdates.connections || get().connections,
          layers: stateUpdates.layers || get().layers,
          activeLayerId: stateUpdates.activeLayerId || get().activeLayerId,
          whiteboardPages: stateUpdates.whiteboardPages || get().whiteboardPages,
          activeWhiteboardPageId: stateUpdates.activeWhiteboardPageId || get().activeWhiteboardPageId,
          whiteboardAssets: stateUpdates.whiteboardAssets || get().whiteboardAssets,
          whiteboardHealthBars: stateUpdates.whiteboardHealthBars !== undefined ? stateUpdates.whiteboardHealthBars : get().whiteboardHealthBars,
          handouts: stateUpdates.handouts || get().handouts,
          spotlightHandoutId: stateUpdates.spotlightHandoutId !== undefined ? stateUpdates.spotlightHandoutId : get().spotlightHandoutId,
          whiteboardDataUrl: stateUpdates.whiteboardDataUrl !== undefined ? stateUpdates.whiteboardDataUrl : get().whiteboardDataUrl,
          wheelPresets: stateUpdates.wheelPresets || get().wheelPresets,
          activeWheelPresetId: stateUpdates.activeWheelPresetId || get().activeWheelPresetId,
          activeSpinEvent: stateUpdates.activeSpinEvent !== undefined ? stateUpdates.activeSpinEvent : get().activeSpinEvent,
          isWheelModalOpen: stateUpdates.isWheelModalOpen !== undefined ? stateUpdates.isWheelModalOpen : get().isWheelModalOpen,
          drawings: stateUpdates.drawings || get().drawings,
          diceHistory: stateUpdates.diceHistory || get().diceHistory,
          activeGenieEvent: stateUpdates.activeGenieEvent !== undefined ? stateUpdates.activeGenieEvent : get().activeGenieEvent,
          sessions: stateUpdates.sessions || get().sessions,
          activeSessionId: stateUpdates.activeSessionId || get().activeSessionId,
          encounterPresets: stateUpdates.encounterPresets || get().encounterPresets,
          activeEncounterPresetId: stateUpdates.activeEncounterPresetId || get().activeEncounterPresetId,
          lampChatHistory: stateUpdates.lampChatHistory || get().lampChatHistory,
          npcProfiles: stateUpdates.npcProfiles || get().npcProfiles,
          rulebookNotes: stateUpdates.rulebookNotes || get().rulebookNotes,
          initiativeList: stateUpdates.initiativeList !== undefined ? stateUpdates.initiativeList : get().initiativeList,
          isInitiativeOpen: stateUpdates.isInitiativeOpen !== undefined ? stateUpdates.isInitiativeOpen : get().isInitiativeOpen,
          currentTurnIndex: stateUpdates.currentTurnIndex !== undefined ? stateUpdates.currentTurnIndex : get().currentTurnIndex,
          roundNumber: stateUpdates.roundNumber !== undefined ? stateUpdates.roundNumber : get().roundNumber,
          chatMessages: stateUpdates.chatMessages !== undefined ? stateUpdates.chatMessages : get().chatMessages,
          connectedPlayers: stateUpdates.connectedPlayers !== undefined ? stateUpdates.connectedPlayers : get().connectedPlayers,
          activeAmbientTrack: stateUpdates.activeAmbientTrack !== undefined ? stateUpdates.activeAmbientTrack : get().activeAmbientTrack,
          customSoundTracks: stateUpdates.customSoundTracks || get().customSoundTracks,
          activeNpcProfileId: stateUpdates.activeNpcProfileId || get().activeNpcProfileId,
        };

        peerSyncService.broadcastToPeers(payload);

        if (syncChannel) {
          syncChannel.postMessage({
            type: 'SYNC_STATE',
            payload: {
              activeView: stateUpdates.activeView || get().activeView,
              tokens: stateUpdates.tokens || get().tokens,
              backstageTokens: stateUpdates.backstageTokens || get().backstageTokens,
              rooms: stateUpdates.rooms || get().rooms,
              connections: stateUpdates.connections || get().connections,
              layers: stateUpdates.layers || get().layers,
              activeLayerId: stateUpdates.activeLayerId || get().activeLayerId,
              whiteboardPages: stateUpdates.whiteboardPages || get().whiteboardPages,
              activeWhiteboardPageId: stateUpdates.activeWhiteboardPageId || get().activeWhiteboardPageId,
              whiteboardAssets: stateUpdates.whiteboardAssets || get().whiteboardAssets,
              whiteboardHealthBars: stateUpdates.whiteboardHealthBars !== undefined ? stateUpdates.whiteboardHealthBars : get().whiteboardHealthBars,
              handouts: stateUpdates.handouts || get().handouts,
              spotlightHandoutId: stateUpdates.spotlightHandoutId !== undefined ? stateUpdates.spotlightHandoutId : get().spotlightHandoutId,
              whiteboardDataUrl: stateUpdates.whiteboardDataUrl !== undefined ? stateUpdates.whiteboardDataUrl : get().whiteboardDataUrl,
              wheelPresets: stateUpdates.wheelPresets || get().wheelPresets,
              activeWheelPresetId: stateUpdates.activeWheelPresetId || get().activeWheelPresetId,
              activeSpinEvent: stateUpdates.activeSpinEvent !== undefined ? stateUpdates.activeSpinEvent : get().activeSpinEvent,
              isWheelModalOpen: stateUpdates.isWheelModalOpen !== undefined ? stateUpdates.isWheelModalOpen : get().isWheelModalOpen,
              drawings: stateUpdates.drawings || get().drawings,
              diceHistory: stateUpdates.diceHistory || get().diceHistory,
              activeGenieEvent: stateUpdates.activeGenieEvent !== undefined ? stateUpdates.activeGenieEvent : get().activeGenieEvent,
              sessions: stateUpdates.sessions || get().sessions,
              activeSessionId: stateUpdates.activeSessionId || get().activeSessionId,
              encounterPresets: stateUpdates.encounterPresets || get().encounterPresets,
              activeEncounterPresetId: stateUpdates.activeEncounterPresetId || get().activeEncounterPresetId,
              lampChatHistory: stateUpdates.lampChatHistory || get().lampChatHistory,
              npcProfiles: stateUpdates.npcProfiles || get().npcProfiles,
              activeNpcProfileId: stateUpdates.activeNpcProfileId || get().activeNpcProfileId,
            }
          });
        }
      };

      
      
      // Listen for actions from connected player clients
      peerSyncService.onActionReceived((action: string, payload: any) => {
        if (!payload) return;
        if (action === 'CHAT_MESSAGE') {
          const currentChats = get().chatMessages || [];
          const updated = [...currentChats, payload];
          set({ chatMessages: updated });
          notifyChannel({ chatMessages: updated });
        } else if (action === 'PLAYER_JOIN') {
          const players = get().connectedPlayers || [];
          const existing = players.find((p) => p.id === payload.id);
          let updated: ConnectedPlayer[];
          if (existing) {
            updated = players.map((p) => p.id === payload.id ? { ...p, name: payload.name } : p);
          } else {
            updated = [...players, { id: payload.id, name: payload.name, canDrawWhiteboard: false, isDm: false, joinedAt: Date.now() }];
          }
          set({ connectedPlayers: updated });
          notifyChannel({ connectedPlayers: updated });
        } else if (action === 'DICE_ROLL') {
          const currentHistory = get().diceHistory || [];
          const updated = [payload, ...currentHistory.slice(0, 19)];
          set({ diceHistory: updated });
          notifyChannel({ diceHistory: updated });
        } else if (action === 'CLEAR_DICE_HISTORY') {
          set({ diceHistory: [] });
          notifyChannel({ diceHistory: [] });
        }
      });

      peerSyncService.onStateReceived((payload: any) => {
        if (!payload) return;
        set({
          activeView: payload.activeView || get().activeView,
          tokens: payload.tokens !== undefined ? payload.tokens : get().tokens,
          backstageTokens: payload.backstageTokens !== undefined ? payload.backstageTokens : get().backstageTokens,
          rooms: payload.rooms !== undefined ? payload.rooms : get().rooms,
          connections: payload.connections !== undefined ? payload.connections : get().connections,
          layers: payload.layers !== undefined ? payload.layers : get().layers,
          activeLayerId: payload.activeLayerId !== undefined ? payload.activeLayerId : get().activeLayerId,
          whiteboardPages: payload.whiteboardPages !== undefined ? payload.whiteboardPages : get().whiteboardPages,
          activeWhiteboardPageId: payload.activeWhiteboardPageId !== undefined ? payload.activeWhiteboardPageId : get().activeWhiteboardPageId,
          whiteboardAssets: payload.whiteboardAssets !== undefined ? payload.whiteboardAssets : get().whiteboardAssets,
          whiteboardHealthBars: payload.whiteboardHealthBars !== undefined ? payload.whiteboardHealthBars : get().whiteboardHealthBars,
          handouts: payload.handouts !== undefined ? payload.handouts : get().handouts,
          spotlightHandoutId: payload.spotlightHandoutId !== undefined ? payload.spotlightHandoutId : get().spotlightHandoutId,
          whiteboardDataUrl: payload.whiteboardDataUrl !== undefined ? payload.whiteboardDataUrl : get().whiteboardDataUrl,
          wheelPresets: payload.wheelPresets !== undefined ? payload.wheelPresets : get().wheelPresets,
          activeWheelPresetId: payload.activeWheelPresetId !== undefined ? payload.activeWheelPresetId : get().activeWheelPresetId,
          activeSpinEvent: payload.activeSpinEvent !== undefined ? payload.activeSpinEvent : get().activeSpinEvent,
          isWheelModalOpen: payload.isWheelModalOpen !== undefined ? payload.isWheelModalOpen : get().isWheelModalOpen,
          drawings: payload.drawings !== undefined ? payload.drawings : get().drawings,
          diceHistory: payload.diceHistory !== undefined ? payload.diceHistory : get().diceHistory,
          activeGenieEvent: payload.activeGenieEvent !== undefined ? payload.activeGenieEvent : get().activeGenieEvent,
          sessions: payload.sessions !== undefined ? payload.sessions : get().sessions,
          activeSessionId: payload.activeSessionId !== undefined ? payload.activeSessionId : get().activeSessionId,
          encounterPresets: payload.encounterPresets !== undefined ? payload.encounterPresets : get().encounterPresets,
          activeEncounterPresetId: payload.activeEncounterPresetId !== undefined ? payload.activeEncounterPresetId : get().activeEncounterPresetId,
          lampChatHistory: payload.lampChatHistory !== undefined ? payload.lampChatHistory : get().lampChatHistory,
          npcProfiles: payload.npcProfiles !== undefined ? payload.npcProfiles : get().npcProfiles,
          rulebookNotes: payload.rulebookNotes !== undefined ? payload.rulebookNotes : get().rulebookNotes,
          initiativeList: payload.initiativeList !== undefined ? payload.initiativeList : get().initiativeList,
          isInitiativeOpen: payload.isInitiativeOpen !== undefined ? payload.isInitiativeOpen : get().isInitiativeOpen,
          currentTurnIndex: payload.currentTurnIndex !== undefined ? payload.currentTurnIndex : get().currentTurnIndex,
          roundNumber: payload.roundNumber !== undefined ? payload.roundNumber : get().roundNumber,
          chatMessages: payload.chatMessages !== undefined ? payload.chatMessages : get().chatMessages,
          connectedPlayers: payload.connectedPlayers !== undefined ? payload.connectedPlayers : get().connectedPlayers,
          activeAmbientTrack: payload.activeAmbientTrack !== undefined ? payload.activeAmbientTrack : get().activeAmbientTrack,
          customSoundTracks: payload.customSoundTracks !== undefined ? payload.customSoundTracks : get().customSoundTracks,
          activeNpcProfileId: payload.activeNpcProfileId !== undefined ? payload.activeNpcProfileId : get().activeNpcProfileId,
        });

        // Check if DM renamed this player
        if (payload.connectedPlayers && Array.isArray(payload.connectedPlayers)) {
          const curName = get().localPlayerName;
          const myEntry = payload.connectedPlayers.find((p: any) => p.id === curName || p.id === peerSyncService.roomId);
          if (myEntry && myEntry.name && myEntry.name !== curName) {
            if (typeof window !== 'undefined') localStorage.setItem('magic_lamp_player_name', myEntry.name);
            set({ localPlayerName: myEntry.name });
          }
        }
      });

      // Listen to cross-tab updates
      if (syncChannel) {
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_STATE' && event.data.payload) {
            set({
              activeView: event.data.payload.activeView || get().activeView,
              tokens: event.data.payload.tokens !== undefined ? event.data.payload.tokens : get().tokens,
              backstageTokens: event.data.payload.backstageTokens !== undefined ? event.data.payload.backstageTokens : get().backstageTokens,
              rooms: event.data.payload.rooms !== undefined ? event.data.payload.rooms : get().rooms,
              connections: event.data.payload.connections !== undefined ? event.data.payload.connections : get().connections,
              layers: event.data.payload.layers !== undefined ? event.data.payload.layers : get().layers,
              activeLayerId: event.data.payload.activeLayerId !== undefined ? event.data.payload.activeLayerId : get().activeLayerId,
              whiteboardPages: event.data.payload.whiteboardPages !== undefined ? event.data.payload.whiteboardPages : get().whiteboardPages,
              activeWhiteboardPageId: event.data.payload.activeWhiteboardPageId !== undefined ? event.data.payload.activeWhiteboardPageId : get().activeWhiteboardPageId,
              whiteboardAssets: event.data.payload.whiteboardAssets !== undefined ? event.data.payload.whiteboardAssets : get().whiteboardAssets,
              whiteboardHealthBars: event.data.payload.whiteboardHealthBars !== undefined ? event.data.payload.whiteboardHealthBars : get().whiteboardHealthBars,
              handouts: event.data.payload.handouts !== undefined ? event.data.payload.handouts : get().handouts,
              spotlightHandoutId: event.data.payload.spotlightHandoutId !== undefined ? event.data.payload.spotlightHandoutId : get().spotlightHandoutId,
              whiteboardDataUrl: event.data.payload.whiteboardDataUrl !== undefined ? event.data.payload.whiteboardDataUrl : get().whiteboardDataUrl,
              wheelPresets: event.data.payload.wheelPresets !== undefined ? event.data.payload.wheelPresets : get().wheelPresets,
              activeWheelPresetId: event.data.payload.activeWheelPresetId !== undefined ? event.data.payload.activeWheelPresetId : get().activeWheelPresetId,
              activeSpinEvent: event.data.payload.activeSpinEvent !== undefined ? event.data.payload.activeSpinEvent : get().activeSpinEvent,
              isWheelModalOpen: event.data.payload.isWheelModalOpen !== undefined ? event.data.payload.isWheelModalOpen : get().isWheelModalOpen,
              drawings: event.data.payload.drawings !== undefined ? event.data.payload.drawings : get().drawings,
              diceHistory: event.data.payload.diceHistory !== undefined ? event.data.payload.diceHistory : get().diceHistory,
              activeGenieEvent: event.data.payload.activeGenieEvent !== undefined ? event.data.payload.activeGenieEvent : get().activeGenieEvent,
            });
          }
        };
      }

      return {
        activeView: 'map',
        language: (typeof window !== 'undefined' && localStorage.getItem('magic_lamp_vtt_lang') as 'tr' | 'en') || 'tr',
        setLanguage: (lang: 'tr' | 'en') => {
          if (typeof window !== 'undefined') localStorage.setItem('magic_lamp_vtt_lang', lang);
          set({ language: lang });
        },
        isStreamerMode: isPlayerUrl,
        activeTool: 'select',
        gridSize: 48,
        showGrid: true,
        snapToGrid: true,
        zoom: 1,
        panOffset: { x: 100, y: 80 },

        isPaintModalOpen: false,
        isLampModalOpen: false,
        isBackstageOpen: !isPlayerUrl,
        isRoomDrawerOpen: false,
        isDicePanelOpen: true,
        isRulebookOpen: false,
        isWheelModalOpen: false,
        isMultiplayerModalOpen: false,
        setMultiplayerModalOpen: (open) => set({ isMultiplayerModalOpen: open }),
        isSessionModalOpen: false,
        sessions: DEFAULT_SESSIONS,
        activeSessionId: 'session-main',

                layers: DEFAULT_LAYERS,
        activeLayerId: 'layer-1',
        tokens: DEFAULT_TOKENS,
        backstageTokens: DEFAULT_BACKSTAGE_TOKENS,
        rooms: DEFAULT_ROOMS,
        connections: DEFAULT_CONNECTIONS,
        handouts: DEFAULT_HANDOUTS,
        spotlightHandoutId: null,

                        whiteboardAssets: DEFAULT_WHITEBOARD_ASSETS,
        whiteboardPages: DEFAULT_WHITEBOARD_PAGES,
        activeWhiteboardPageId: 'wb-page-1',
        whiteboardDataUrl: null,
        whiteboardHealthBars: [],

        wheelPresets: DEFAULT_WHEEL_PRESETS,
        activeWheelPresetId: 'wheel-crit-fumble',
        activeSpinEvent: null,

        drawings: [],
        diceHistory: [],
        activeGenieEvent: null,
        encounterPresets: DEFAULT_ENCOUNTER_PRESETS,
        activeEncounterPresetId: 'preset-spiders',
        geminiApiKey: '',
        selectedAiModel: 'gemini-2.5-flash',
        aiCrueltyLevel: 8,
        aiTemperature: 0.7,
        npcProfiles: DEFAULT_NPC_PROFILES,
        activeNpcProfileId: 'npc-genie-paw',
        lampChatHistory: [],

        rulebookNotes: DEFAULT_RULES,

        selectedTokenId: null,
        selectedRoomIds: [],
        copiedRooms: [],
        copiedConnections: [],

        // Map Undo / Redo History
        mapHistory: [],
        mapHistoryIndex: -1,

        pushMapHistory: () => set((state) => {
          const snapshot = {
            tokens: JSON.parse(JSON.stringify(state.tokens)),
            rooms: JSON.parse(JSON.stringify(state.rooms)),
            connections: JSON.parse(JSON.stringify(state.connections)),
          };
          const nextHistory = [...state.mapHistory.slice(0, state.mapHistoryIndex + 1), snapshot];
          if (nextHistory.length > 30) nextHistory.shift();
          return {
            mapHistory: nextHistory,
            mapHistoryIndex: nextHistory.length - 1,
          };
        }),

        undoMap: () => set((state) => {
          if (state.mapHistoryIndex > 0) {
            const targetIndex = state.mapHistoryIndex - 1;
            const snap = state.mapHistory[targetIndex];
            if (snap) {
              const nextState = {
                tokens: snap.tokens,
                rooms: snap.rooms,
                connections: snap.connections,
                mapHistoryIndex: targetIndex,
              };
              notifyChannel({ tokens: snap.tokens, rooms: snap.rooms, connections: snap.connections });
              return nextState;
            }
          }
          return state;
        }),

        redoMap: () => set((state) => {
          if (state.mapHistoryIndex < state.mapHistory.length - 1) {
            const targetIndex = state.mapHistoryIndex + 1;
            const snap = state.mapHistory[targetIndex];
            if (snap) {
              const nextState = {
                tokens: snap.tokens,
                rooms: snap.rooms,
                connections: snap.connections,
                mapHistoryIndex: targetIndex,
              };
              notifyChannel({ tokens: snap.tokens, rooms: snap.rooms, connections: snap.connections });
              return nextState;
            }
          }
          return state;
        }),

        brushColor: '#ef4444',
        brushWidth: 4,

        setActiveView: (view) => {
          set({ activeView: view });
          notifyChannel({ activeView: view });
        },

        setStreamerMode: (enabled) => set({ isStreamerMode: enabled }),
        setActiveTool: (tool) => set({ activeTool: tool, selectedRoomIds: [] }),
        setZoom: (updater) => set((state) => ({
          zoom: typeof updater === 'function' ? Math.min(Math.max(updater(state.zoom), 0.3), 2.5) : Math.min(Math.max(updater, 0.3), 2.5)
        })),
        setPanOffset: (updater) => set((state) => ({
          panOffset: typeof updater === 'function' ? updater(state.panOffset) : updater
        })),
        toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
        toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

        setPaintModalOpen: (open) => set({ isPaintModalOpen: open }),
        setLampModalOpen: (open) => set({ isLampModalOpen: open }),
        setBackstageOpen: (open) => set({ isBackstageOpen: open }),
        setRoomDrawerOpen: (open) => set({ isRoomDrawerOpen: open }),
        setDicePanelOpen: (open) => set({ isDicePanelOpen: open }),
        setRulebookOpen: (open) => set({ isRulebookOpen: open }),
        setWheelModalOpen: (open) => {
          set({ isWheelModalOpen: open });
          notifyChannel({ isWheelModalOpen: open });
        },

        // Layer Actions
        setActiveLayerId: (id) => {
          set({ activeLayerId: id, selectedTokenId: null, selectedRoomIds: [] });
          notifyChannel({ activeLayerId: id });
        },

        addLayer: (name) => set((state) => {
          const newLayer: MapLayer = {
            id: `layer-${Date.now()}`,
            name: name.trim() || `${state.layers.length + 1}. Kat`,
            order: state.layers.length,
          };
          const nextLayers = [...state.layers, newLayer];
          const nextState = { layers: nextLayers, activeLayerId: newLayer.id };
          notifyChannel(nextState);
          return nextState;
        }),

        updateLayer: (id, name) => set((state) => {
          const nextLayers = state.layers.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l));
          const nextState = { layers: nextLayers };
          notifyChannel(nextState);
          return nextState;
        }),

        
        // Layer Backgrounds
        updateLayerBackground: (layerId, updates) => set((state) => {
          const nextLayers = state.layers.map((l) => l.id === layerId ? { ...l, ...updates } : l);
          const nextState = { layers: nextLayers };
          notifyChannel(nextState);
          return nextState;
        }),

        // Custom Soundtracks
        customSoundTracks: [],
        addCustomSoundTrack: (trackData) => set((state) => {
          const newTrack: CustomSoundTrack = {
            ...trackData,
            id: 'sound-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
          };
          const nextState = { customSoundTracks: [...state.customSoundTracks, newTrack] };
          notifyChannel(nextState);
          return nextState;
        }),
        deleteCustomSoundTrack: (id) => set((state) => {
          const nextState = { customSoundTracks: state.customSoundTracks.filter((s) => s.id !== id) };
          notifyChannel(nextState);
          return nextState;
        }),

        // Token ↔ Whiteboard Dual Bridge
        transferTokenToWhiteboard: (tokenId) => {
          const token = get().tokens.find((t) => t.id === tokenId) || get().backstageTokens.find((t) => t.id === tokenId);
          if (!token) return;

          const newAsset = {
            id: 'wb-asset-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: token.name,
            image: token.image || '',
            category: token.folder || 'Tokenler'
          };

          const currentAssets = get().whiteboardAssets || [];
          const updatedAssets = [...currentAssets, newAsset];
          set({ whiteboardAssets: updatedAssets, activeView: 'whiteboard' });
          notifyChannel({ whiteboardAssets: updatedAssets, activeView: 'whiteboard' });
        },

        preloadedDoodleImage: null,
        setPreloadedDoodleImage: (img) => set({ preloadedDoodleImage: img }),

        deleteLayer: (id) => set((state) => {
          if (state.layers.length <= 1) return state;
          const remainingLayers = state.layers.filter((l) => l.id !== id);
          const fallbackLayerId = remainingLayers[0].id;
          
          const nextTokens = state.tokens.map((t) => (t.layerId === id ? { ...t, layerId: fallbackLayerId } : t));
          const nextRooms = state.rooms.map((r) => (r.layerId === id ? { ...r, layerId: fallbackLayerId } : r));
          const nextConns = state.connections.map((c) => (c.layerId === id ? { ...c, layerId: fallbackLayerId } : c));
          const nextDrawings = state.drawings.map((d) => (d.layerId === id ? { ...d, layerId: fallbackLayerId } : d));

          const nextState = {
            layers: remainingLayers,
            activeLayerId: state.activeLayerId === id ? fallbackLayerId : state.activeLayerId,
            tokens: nextTokens,
            rooms: nextRooms,
            connections: nextConns,
            drawings: nextDrawings,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        moveTokenToLayer: (tokenId, layerId) => set((state) => {
          const nextTokens = state.tokens.map((t) => (t.id === tokenId ? { ...t, layerId } : t));
          const nextState = { tokens: nextTokens };
          notifyChannel(nextState);
          return nextState;
        }),

        moveRoomToLayer: (roomId, layerId) => set((state) => {
          const nextRooms = state.rooms.map((r) => (r.id === roomId ? { ...r, layerId } : r));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        addToken: (tokenData, toBackstage = false) => {
          set((state) => {
            const newToken: Token = {
              ...tokenData,
              layerId: tokenData.layerId || state.activeLayerId || 'layer-1',
              id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              customAttributes: tokenData.customAttributes || [],
              statusEffects: tokenData.statusEffects || [],
              hiddenFromPlayers: toBackstage,
            };
            const nextState = toBackstage
              ? { backstageTokens: [...state.backstageTokens, newToken] }
              : { tokens: [...state.tokens, newToken] };
            notifyChannel(nextState);
            return nextState;
          });
        },

        updateToken: (id, updates) => set((state) => {
          const nextTokens = state.tokens.map((t) => (t.id === id ? { ...t, ...updates } : t));
          const nextBackstage = state.backstageTokens.map((t) => (t.id === id ? { ...t, ...updates } : t));
          const nextState = { tokens: nextTokens, backstageTokens: nextBackstage };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteToken: (id) => set((state) => {
          const nextTokens = state.tokens.filter((t) => t.id !== id);
          const nextBackstage = state.backstageTokens.filter((t) => t.id !== id);
          const nextState = {
            tokens: nextTokens,
            backstageTokens: nextBackstage,
            selectedTokenId: state.selectedTokenId === id ? null : state.selectedTokenId,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        moveToken: (id, x, y) => set((state) => {
          const nextTokens = state.tokens.map((t) => (t.id === id ? { ...t, x, y } : t));
          const nextState = { tokens: nextTokens };
          notifyChannel(nextState);
          return nextState;
        }),

        revealBackstageToken: (id, dropX = 5, dropY = 5) => set((state) => {
          const target = state.backstageTokens.find((t) => t.id === id);
          if (!target) return state;

          // If dropX and dropY are defaults (5, 5), check if a room is marked as spawn point!
          const spawnRoom = state.rooms.find((r) => r.isSpawnPoint);
          const finalDropX = (dropX === 5 && dropY === 5 && spawnRoom) 
            ? Math.floor(spawnRoom.x + spawnRoom.width / 2) 
            : dropX;
          const finalDropY = (dropX === 5 && dropY === 5 && spawnRoom) 
            ? Math.floor(spawnRoom.y + spawnRoom.height / 2) 
            : dropY;

          // Save map history snapshot
          const snapshot = {
            tokens: JSON.parse(JSON.stringify(state.tokens)),
            rooms: JSON.parse(JSON.stringify(state.rooms)),
            connections: JSON.parse(JSON.stringify(state.connections)),
          };
          const nextHistory = [...state.mapHistory.slice(0, state.mapHistoryIndex + 1), snapshot];
          if (nextHistory.length > 30) nextHistory.shift();

          if (target.isTemplate) {
            // Spawn a cloned instance on map, keep template in backstage!
            const clonedId = `token-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const nextState = {
              tokens: [
                ...state.tokens,
                { ...target, id: clonedId, x: finalDropX, y: finalDropY, hiddenFromPlayers: false, isTemplate: false }
              ],
              mapHistory: nextHistory,
              mapHistoryIndex: nextHistory.length - 1,
            };
            notifyChannel(nextState);
            return nextState;
          } else {
            // Normal move from backstage to map
            const nextState = {
              backstageTokens: state.backstageTokens.filter((t) => t.id !== id),
              tokens: [
                ...state.tokens,
                { ...target, x: finalDropX, y: finalDropY, hiddenFromPlayers: false }
              ],
              mapHistory: nextHistory,
              mapHistoryIndex: nextHistory.length - 1,
            };
            notifyChannel(nextState);
            return nextState;
          }
        }),

        sendToBackstage: (id) => set((state) => {
          const target = state.tokens.find((t) => t.id === id);
          if (!target) return state;
          const nextState = {
            tokens: state.tokens.filter((t) => t.id !== id),
            backstageTokens: [
              ...state.backstageTokens,
              { ...target, hiddenFromPlayers: true }
            ],
            selectedTokenId: state.selectedTokenId === id ? null : state.selectedTokenId
          };
          notifyChannel(nextState);
          return nextState;
        }),

        selectToken: (id) => set({ selectedTokenId: id, selectedRoomIds: [] }),

        addTokenAttribute: (tokenId, attrData) => set((state) => {
          const newAttr: TokenAttribute = {
            ...attrData,
            id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
          };
          const updater = (t: Token) => t.id === tokenId ? {
            ...t,
            customAttributes: [...(t.customAttributes || []), newAttr]
          } : t;
          const nextState = {
            tokens: state.tokens.map(updater),
            backstageTokens: state.backstageTokens.map(updater)
          };
          notifyChannel(nextState);
          return nextState;
        }),

        updateTokenAttribute: (tokenId, attrId, updates) => set((state) => {
          const updater = (t: Token) => t.id === tokenId ? {
            ...t,
            customAttributes: (t.customAttributes || []).map((a) => a.id === attrId ? { ...a, ...updates } : a)
          } : t;
          const nextState = {
            tokens: state.tokens.map(updater),
            backstageTokens: state.backstageTokens.map(updater)
          };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteTokenAttribute: (tokenId, attrId) => set((state) => {
          const updater = (t: Token) => t.id === tokenId ? {
            ...t,
            customAttributes: (t.customAttributes || []).filter((a) => a.id !== attrId)
          } : t;
          const nextState = {
            tokens: state.tokens.map(updater),
            backstageTokens: state.backstageTokens.map(updater)
          };
          notifyChannel(nextState);
          return nextState;
        }),

        toggleTokenStatusEffect: (tokenId, effect) => set((state) => {
          const updater = (t: Token) => {
            if (t.id !== tokenId) return t;
            const current = t.statusEffects || [];
            const exists = current.includes(effect);
            return {
              ...t,
              statusEffects: exists ? current.filter((e) => e !== effect) : [...current, effect]
            };
          };
          const nextState = {
            tokens: state.tokens.map(updater),
            backstageTokens: state.backstageTokens.map(updater)
          };
          notifyChannel(nextState);
          return nextState;
        }),

        addRoom: (roomData) => {
          set((state) => {
            const newRoom: DungeonRoom = {
              ...roomData,
              layerId: roomData.layerId || state.activeLayerId || 'layer-1',
              id: `room-${Date.now()}`,
            };
            const nextState = { rooms: [...state.rooms, newRoom] };
            notifyChannel(nextState);
            return nextState;
          });
        },

        updateRoom: (id, updates) => set((state) => {
          const nextRooms = state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        moveRoom: (id, x, y) => set((state) => {
          const nextRooms = state.rooms.map((r) => (r.id === id ? { ...r, x, y } : r));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        moveRoomsDelta: (ids, dx, dy) => set((state) => {
          if (dx === 0 && dy === 0) return state;
          const idSet = new Set(ids);
          const nextRooms = state.rooms.map((r) => {
            if (idSet.has(r.id)) {
              return {
                ...r,
                x: Math.max(0, r.x + dx),
                y: Math.max(0, r.y + dy),
              };
            }
            return r;
          });
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteRoom: (id) => set((state) => {
          const nextRooms = state.rooms.filter((r) => r.id !== id);
          const nextConns = state.connections.filter((c) => c.fromRoomId !== id && c.toRoomId !== id);
          const nextState = {
            rooms: nextRooms,
            connections: nextConns,
            selectedRoomIds: state.selectedRoomIds.filter((rid) => rid !== id),
          };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteRooms: (ids) => set((state) => {
          const idSet = new Set(ids);
          const nextRooms = state.rooms.filter((r) => !idSet.has(r.id));
          const nextConns = state.connections.filter((c) => !idSet.has(c.fromRoomId) && !idSet.has(c.toRoomId));
          const nextState = {
            rooms: nextRooms,
            connections: nextConns,
            selectedRoomIds: [],
          };
          notifyChannel(nextState);
          return nextState;
        }),

        toggleRoomReveal: (id) => set((state) => {
          const nextRooms = state.rooms.map((r) => (r.id === id ? { ...r, isRevealed: !r.isRevealed } : r));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        revealAllRooms: () => set((state) => {
          const nextRooms = state.rooms.map((r) => ({ ...r, isRevealed: true }));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        hideAllRooms: () => set((state) => {
          const nextRooms = state.rooms.map((r) => ({ ...r, isRevealed: false }));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        setSpawnPoint: (roomId) => set((state) => {
          const target = state.rooms.find((r) => r.id === roomId);
          const willBeSpawn = target ? !target.isSpawnPoint : true;
          const nextRooms = state.rooms.map((r) => ({
            ...r,
            isSpawnPoint: r.id === roomId ? willBeSpawn : false,
          }));
          const nextState = { rooms: nextRooms };
          notifyChannel(nextState);
          return nextState;
        }),

        selectRoom: (id) => set({ selectedRoomIds: id ? [id] : [], selectedTokenId: null }),
                                setSessionModalOpen: (open) => set({ isSessionModalOpen: open }),

        createSession: (name, copyCurrent = false) => set((state) => {
          // 1. Snapshot current session
          const currentData: SessionData = {
            rooms: state.rooms,
            connections: state.connections,
            tokens: state.tokens,
            drawings: state.drawings,
            layers: state.layers,
            activeLayerId: state.activeLayerId,
            whiteboardPages: state.whiteboardPages,
            activeWhiteboardPageId: state.activeWhiteboardPageId,
            whiteboardAssets: state.whiteboardAssets,
            whiteboardHealthBars: state.whiteboardHealthBars || [],
            backstageTokens: state.backstageTokens,
            encounterPresets: state.encounterPresets,
            rulebookNotes: state.rulebookNotes,
            npcProfiles: state.npcProfiles,
            lampChatHistory: state.lampChatHistory,
            handouts: state.handouts,
            activeView: state.activeView
          };

          const updatedSessions = state.sessions.map((s) => (
            s.id === state.activeSessionId ? { ...s, updatedAt: Date.now(), data: currentData } : s
          ));

          // In a fresh session:
          // Keep all permanent templates in the backstage vault across all sessions!
          // Keep all reference assets and encounter presets!
          const newSessionData: SessionData = copyCurrent ? JSON.parse(JSON.stringify(currentData)) : {
            rooms: [],
            connections: [],
            tokens: [],
            drawings: [],
            layers: [{ id: 'layer-1', name: 'Zemin Kat (1. Kat)', order: 0 }],
            activeLayerId: 'layer-1',
            whiteboardPages: [{ id: 'wb-page-1', name: 'Tahta 1 (Ana Sayfa)', dataUrl: null, order: 0 }],
            activeWhiteboardPageId: 'wb-page-1',
            whiteboardAssets: state.whiteboardAssets,
            whiteboardHealthBars: [],
            backstageTokens: (state.backstageTokens || []).filter((t) => t.isTemplate),
            encounterPresets: state.encounterPresets,
            rulebookNotes: state.rulebookNotes,
            npcProfiles: state.npcProfiles,
            lampChatHistory: [],
            handouts: [],
            activeView: 'map'
          };

          const newSession: CampaignSession = {
            id: `session-${Date.now()}`,
            name: name.trim() || `Oturum ${state.sessions.length + 1}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data: newSessionData
          };

          const nextSessions = [...updatedSessions, newSession];
          const nextState = {
            sessions: nextSessions,
            activeSessionId: newSession.id,
            rooms: newSessionData.rooms,
            connections: newSessionData.connections,
            tokens: newSessionData.tokens,
            drawings: newSessionData.drawings,
            layers: newSessionData.layers,
            activeLayerId: newSessionData.activeLayerId,
            whiteboardPages: newSessionData.whiteboardPages,
            activeWhiteboardPageId: newSessionData.activeWhiteboardPageId,
            whiteboardAssets: state.whiteboardAssets,
            whiteboardHealthBars: [],
            backstageTokens: newSessionData.backstageTokens,
            encounterPresets: state.encounterPresets,
            rulebookNotes: state.rulebookNotes,
            npcProfiles: state.npcProfiles,
            lampChatHistory: newSessionData.lampChatHistory,
            handouts: newSessionData.handouts || [],
            activeView: newSessionData.activeView,
            selectedRoomIds: [],
            selectedTokenId: null
          };

          notifyChannel(nextState);
          return nextState;
        }),

        switchSession: (sessionId) => set((state) => {
          if (sessionId === state.activeSessionId) return state;
          const target = state.sessions.find((s) => s.id === sessionId);
          if (!target) return state;

          const currentData: SessionData = {
            rooms: state.rooms,
            connections: state.connections,
            tokens: state.tokens,
            drawings: state.drawings,
            layers: state.layers,
            activeLayerId: state.activeLayerId,
            whiteboardPages: state.whiteboardPages,
            activeWhiteboardPageId: state.activeWhiteboardPageId,
            whiteboardAssets: state.whiteboardAssets,
            whiteboardHealthBars: state.whiteboardHealthBars || [],
            backstageTokens: state.backstageTokens,
            encounterPresets: state.encounterPresets,
            rulebookNotes: state.rulebookNotes,
            npcProfiles: state.npcProfiles,
            lampChatHistory: state.lampChatHistory,
            handouts: state.handouts,
            activeView: state.activeView
          };

          const updatedSessions = state.sessions.map((s) => (
            s.id === state.activeSessionId ? { ...s, updatedAt: Date.now(), data: currentData } : s
          ));

          const d = target.data;

          // Cross-session Sync: Merge all permanent templates (isTemplate === true)
          const currentTemplates = (state.backstageTokens || []).filter((t) => t.isTemplate);
          const targetBackstage = d.backstageTokens || [];
          const mergedBackstageMap = new Map<string, Token>();
          targetBackstage.forEach((t) => mergedBackstageMap.set(t.id, t));
          currentTemplates.forEach((t) => mergedBackstageMap.set(t.id, t));

          // Cross-session Sync: Merge all whiteboard reference assets
          const mergedAssetsMap = new Map<string, WhiteboardAsset>();
          (state.whiteboardAssets || []).forEach((a) => mergedAssetsMap.set(a.id, a));
          (d.whiteboardAssets || []).forEach((a) => mergedAssetsMap.set(a.id, a));

          // Cross-session Sync: Merge custom encounter presets
          const mergedEncounterMap = new Map<string, CustomEncounterPreset>();
          (state.encounterPresets || []).forEach((p) => mergedEncounterMap.set(p.id, p));
          (d.encounterPresets || []).forEach((p) => mergedEncounterMap.set(p.id, p));

          const nextState = {
            sessions: updatedSessions,
            activeSessionId: target.id,
            rooms: d.rooms || [],
            connections: d.connections || [],
            tokens: d.tokens || [],
            drawings: d.drawings || [],
            layers: d.layers || [{ id: 'layer-1', name: 'Zemin Kat (1. Kat)', order: 0 }],
            activeLayerId: d.activeLayerId || 'layer-1',
            whiteboardPages: d.whiteboardPages || [{ id: 'wb-page-1', name: 'Tahta 1 (Ana Sayfa)', dataUrl: null, order: 0 }],
            activeWhiteboardPageId: d.activeWhiteboardPageId || 'wb-page-1',
            whiteboardAssets: Array.from(mergedAssetsMap.values()),
            whiteboardHealthBars: d.whiteboardHealthBars || [],
            backstageTokens: Array.from(mergedBackstageMap.values()),
            encounterPresets: Array.from(mergedEncounterMap.values()),
            rulebookNotes: d.rulebookNotes || state.rulebookNotes,
            npcProfiles: d.npcProfiles || state.npcProfiles,
            lampChatHistory: d.lampChatHistory || [],
            handouts: d.handouts || [],
            activeView: d.activeView || 'map',
            selectedRoomIds: [],
            selectedTokenId: null
          };

          notifyChannel(nextState);
          return nextState;
        }),

        renameSession: (sessionId, newName) => set((state) => {
          const nextSessions = state.sessions.map((s) => (s.id === sessionId ? { ...s, name: newName.trim(), updatedAt: Date.now() } : s));
          const nextState = { sessions: nextSessions };
          notifyChannel(nextState);
          return nextState;
        }),

        duplicateSession: (sessionId) => set((state) => {
          const source = state.sessions.find((s) => s.id === sessionId);
          if (!source) return state;

          const currentData: SessionData = sessionId === state.activeSessionId ? {
            rooms: state.rooms,
            connections: state.connections,
            tokens: state.tokens,
            drawings: state.drawings,
            layers: state.layers,
            activeLayerId: state.activeLayerId,
            whiteboardPages: state.whiteboardPages,
            activeWhiteboardPageId: state.activeWhiteboardPageId,
            whiteboardAssets: state.whiteboardAssets,
            whiteboardHealthBars: state.whiteboardHealthBars || [],
            backstageTokens: state.backstageTokens,
            encounterPresets: state.encounterPresets,
            rulebookNotes: state.rulebookNotes,
            npcProfiles: state.npcProfiles,
            lampChatHistory: state.lampChatHistory,
            handouts: state.handouts,
            activeView: state.activeView
          } : source.data;

          const duplicated: CampaignSession = {
            id: `session-${Date.now()}`,
            name: `${source.name} (Kopya)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data: JSON.parse(JSON.stringify(currentData))
          };

          const nextSessions = [...state.sessions, duplicated];
          const nextState = { sessions: nextSessions };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteSession: (sessionId) => set((state) => {
          if (state.sessions.length <= 1) return state;
          const remaining = state.sessions.filter((s) => s.id !== sessionId);
          let nextState: any = { sessions: remaining };

          if (state.activeSessionId === sessionId) {
            const nextSession = remaining[0];
            const d = nextSession.data;

            const currentTemplates = (state.backstageTokens || []).filter((t) => t.isTemplate);
            const targetBackstage = d.backstageTokens || [];
            const mergedBackstageMap = new Map<string, Token>();
            targetBackstage.forEach((t) => mergedBackstageMap.set(t.id, t));
            currentTemplates.forEach((t) => mergedBackstageMap.set(t.id, t));

            const mergedAssetsMap = new Map<string, WhiteboardAsset>();
            (state.whiteboardAssets || []).forEach((a) => mergedAssetsMap.set(a.id, a));
            (d.whiteboardAssets || []).forEach((a) => mergedAssetsMap.set(a.id, a));

            nextState = {
              ...nextState,
              activeSessionId: nextSession.id,
              rooms: d.rooms || [],
              connections: d.connections || [],
              tokens: d.tokens || [],
              drawings: d.drawings || [],
              layers: d.layers || [{ id: 'layer-1', name: 'Zemin Kat (1. Kat)', order: 0 }],
              activeLayerId: d.activeLayerId || 'layer-1',
              whiteboardPages: d.whiteboardPages || [{ id: 'wb-page-1', name: 'Tahta 1 (Ana Sayfa)', dataUrl: null, order: 0 }],
              activeWhiteboardPageId: d.activeWhiteboardPageId || 'wb-page-1',
              whiteboardAssets: Array.from(mergedAssetsMap.values()),
              whiteboardHealthBars: d.whiteboardHealthBars || [],
              backstageTokens: Array.from(mergedBackstageMap.values()),
              lampChatHistory: d.lampChatHistory || [],
              handouts: d.handouts || [],
              activeView: d.activeView || 'map'
            };
          }

          notifyChannel(nextState);
          return nextState;
        }),

        importSession: (sessionJson) => {
          try {
            const parsed = JSON.parse(sessionJson);
            if (!parsed.name || !parsed.data) return false;

            const newSession: CampaignSession = {
              id: `session-${Date.now()}`,
              name: `${parsed.name} (İçe Aktarıldı)`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              data: parsed.data
            };

            set((state) => {
              const nextSessions = [...state.sessions, newSession];
              const nextState = { sessions: nextSessions };
              notifyChannel(nextState);
              return nextState;
            });
            return true;
          } catch (e) {
            console.error('Failed to import session:', e);
            return false;
          }
        },
        
        setActiveEncounterPresetId: (id) => set({ activeEncounterPresetId: id }),

        addEncounterPreset: (presetData) => set((state) => {
          const newPreset: CustomEncounterPreset = {
            ...presetData,
            id: `preset-${Date.now()}`,
          };
          const nextPresets = [...state.encounterPresets, newPreset];
          const nextState = {
            encounterPresets: nextPresets,
            activeEncounterPresetId: newPreset.id
          };
          notifyChannel(nextState);
          return nextState;
        }),

        updateEncounterPreset: (id, updates) => set((state) => {
          const nextPresets = state.encounterPresets.map((p) => (p.id === id ? { ...p, ...updates } : p));
          const nextState = { encounterPresets: nextPresets };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteEncounterPreset: (id) => set((state) => {
          if (state.encounterPresets.length <= 1) return state;
          const remaining = state.encounterPresets.filter((p) => p.id !== id);
          const nextActive = state.activeEncounterPresetId === id ? remaining[0].id : state.activeEncounterPresetId;
          const nextState = { encounterPresets: remaining, activeEncounterPresetId: nextActive };
          notifyChannel(nextState);
          return nextState;
        }),

        populateRoom: (roomId, encounter, options) => set((state) => {
          const targetRoom = state.rooms.find((r) => r.id === roomId);
          if (!targetRoom) return state;

          const layerId = targetRoom.layerId || state.activeLayerId || 'layer-1';

          let updatedTokens = [...state.tokens];

          // Clear existing non-hero tokens inside this room if requested
          if (options.clearExisting) {
            updatedTokens = updatedTokens.filter((t) => {
              const inRoom = t.x >= targetRoom.x && t.x < targetRoom.x + targetRoom.width &&
                             t.y >= targetRoom.y && t.y < targetRoom.y + targetRoom.height &&
                             (t.layerId === layerId || (!t.layerId && layerId === 'layer-1'));
              return !inRoom || t.type === 'hero'; // Keep player heroes safe!
            });
          }

          const newTokens: Token[] = [];

          // 1. Add Monsters with smart GRID spacing
          if (options.addMonsters && encounter.monsters) {
            let slotIndex = 0;
            const centerGx = targetRoom.x + Math.floor(targetRoom.width / 2);
            const centerGy = targetRoom.y + Math.floor(targetRoom.height / 2);

            encounter.monsters.forEach((mon: any) => {
              for (let i = 0; i < (mon.count || 1); i++) {
                // Calculate grid offsets: -1, 0, 1 etc.
                const offsetGx = (slotIndex % 3) - 1;
                const offsetGy = Math.floor(slotIndex / 3);

                const finalGx = Math.max(targetRoom.x + 1, Math.min(targetRoom.x + targetRoom.width - 2, centerGx + offsetGx));
                const finalGy = Math.max(targetRoom.y + 1, Math.min(targetRoom.y + targetRoom.height - 2, centerGy + offsetGy));
                const isLarge = mon.hp >= 60;

                newTokens.push({
                  id: 'token-mon-' + Date.now() + '-' + slotIndex + '-' + Math.random().toString(36).substr(2, 4),
                  name: mon.count > 1 ? (mon.name + ' #' + (i + 1)) : mon.name,
                  image: mon.image || undefined,
                  color: '#ef4444',
                  x: finalGx,
                  y: finalGy,
                  size: isLarge ? 2 : 1,
                  sizeY: isLarge ? 2 : 1,
                  type: 'monster',
                  hp: {
                    current: mon.hp,
                    max: mon.hp,
                  },
                  notes: mon.notes || ('AC: ' + mon.ac + ' | HP: ' + mon.hp),
                  customAttributes: [
                    { id: 'attr-ac-' + slotIndex, name: 'Zırh (AC)', type: 'text', value: mon.ac ? mon.ac.toString() : '13' },
                    { id: 'attr-spd-' + slotIndex, name: 'Hız', type: 'text', value: (mon.speed || 30) + ' ft' }
                  ],
                  hideInFog: true,
                  layerId: layerId
                });
                slotIndex++;
              }
            });
          }

          // 2. Add Chest / Loot Object in Corner (Grid Units)
          if (options.addLoot && encounter.loot) {
            const chestGx = Math.max(targetRoom.x + 1, targetRoom.x + targetRoom.width - 2);
            const chestGy = Math.max(targetRoom.y + 1, targetRoom.y + 1);

            newTokens.push({
              id: 'token-loot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              name: encounter.loot.name,
              image: encounter.loot.image || encounter.loot.icon || undefined,
              color: encounter.loot.color || '#eab308',
              x: chestGx,
              y: chestGy,
              size: encounter.loot.size || 1,
              sizeY: encounter.loot.sizeY || encounter.loot.size || 1,
              type: 'item',
              hp: {
                current: 15,
                max: 15,
              },
              notes: '🎁 Ganimet: ' + encounter.loot.gold + ' Altın\nEşyalar: ' + (encounter.loot.items || []).join(', '),
              customAttributes: [
                { id: 'attr-gold-' + Date.now(), name: 'Altın', type: 'number', value: encounter.loot.gold }
              ],
              hideInFog: true,
              layerId: layerId
            });
          }

          // 3. Add Trap Marker at entrance (Grid Units)
          if (options.addTrap && encounter.trap) {
            const trapGx = Math.max(targetRoom.x + 1, targetRoom.x + 1);
            const trapGy = Math.max(targetRoom.y + 1, targetRoom.y + Math.floor(targetRoom.height / 2));

            newTokens.push({
              id: 'token-trap-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              name: '⚠️ ' + encounter.trap.name,
              image: encounter.trap.image || encounter.trap.icon || undefined,
              color: encounter.trap.color || '#f97316',
              x: trapGx,
              y: trapGy,
              size: encounter.trap.size || 1,
              sizeY: encounter.trap.sizeY || encounter.trap.size || 1,
              type: 'trap',
              hp: {
                current: 10,
                max: 10,
              },
              notes: '⚠️ Tuzak: ' + encounter.trap.dc + '\nEtki: ' + encounter.trap.effect,
              hiddenFromPlayers: true, // Invisible to players
              hideInFog: true,
              layerId: layerId
            });
          }

          // 4. Update the room metadata
          const updatedRooms = state.rooms.map((r) => {
            if (r.id !== roomId) return r;
            return {
              ...r,
              name: encounter.roomTitle || r.name,
              theme: encounter.roomTheme || r.theme,
              isRevealed: options.setFog ? false : r.isRevealed,
              notes: encounter.description,
              trapDetails: options.addTrap && encounter.trap ? (encounter.trap.name + ' (' + encounter.trap.dc + ') - ' + encounter.trap.effect) : r.trapDetails,
              lootDetails: options.addLoot && encounter.loot ? (encounter.loot.gold + ' Altın + ' + encounter.loot.items.join(', ')) : r.lootDetails,
            };
          });

          const finalTokens = [...updatedTokens, ...newTokens];
          const nextState = {
            rooms: updatedRooms,
            tokens: finalTokens,
          };
          notifyChannel(nextState);
          return nextState;
        }),


        setSelectedRoomIds: (ids) => set({ selectedRoomIds: ids, selectedTokenId: null }),

        toggleSelectRoom: (id, isMulti) => set((state) => {
          if (isMulti) {
            const already = state.selectedRoomIds.includes(id);
            const next = already 
              ? state.selectedRoomIds.filter((rid) => rid !== id)
              : [...state.selectedRoomIds, id];
            return { selectedRoomIds: next, selectedTokenId: null };
          } else {
            return { selectedRoomIds: [id], selectedTokenId: null };
          }
        }),

        // Connect 2 rooms
        connectRooms: (roomAId, roomBId) => set((state) => {
          if (roomAId === roomBId) return state;
          const roomA = state.rooms.find((r) => r.id === roomAId);
          const targetLayerId = roomA?.layerId || state.activeLayerId || 'layer-1';

          const exists = state.connections.some(
            (c) => (c.fromRoomId === roomAId && c.toRoomId === roomBId) ||
                   (c.fromRoomId === roomBId && c.toRoomId === roomAId)
          );
          if (exists) return state;

          const newConn: RoomConnection = {
            id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            fromRoomId: roomAId,
            toRoomId: roomBId,
            style: 'corridor',
            layerId: targetLayerId
          };
          const nextState = { connections: [...state.connections, newConn] };
          notifyChannel(nextState);
          return nextState;
        }),

        // Disconnect 2 rooms
        disconnectRooms: (roomAId, roomBId) => set((state) => {
          const nextConns = state.connections.filter(
            (c) => !( (c.fromRoomId === roomAId && c.toRoomId === roomBId) ||
                     (c.fromRoomId === roomBId && c.toRoomId === roomAId) )
          );
          const nextState = { connections: nextConns };
          notifyChannel(nextState);
          return nextState;
        }),

        // Copy selected rooms
        copyRooms: (roomIds) => set((state) => {
          const targetIds = roomIds || state.selectedRoomIds;
          if (targetIds.length === 0) return state;
          const idSet = new Set(targetIds);
          const toCopy = state.rooms.filter((r) => idSet.has(r.id));
          const copiedConns = state.connections.filter(
            (c) => idSet.has(c.fromRoomId) && idSet.has(c.toRoomId)
          );
          return { copiedRooms: toCopy, copiedConnections: copiedConns };
        }),

        // Paste copied rooms
        pasteRooms: (dropGx = 4, dropGy = 4) => set((state) => {
          if (state.copiedRooms.length === 0) return state;

          const minX = Math.min(...state.copiedRooms.map((r) => r.x));
          const minY = Math.min(...state.copiedRooms.map((r) => r.y));

          const idMap = new Map<string, string>();
          const newRooms: DungeonRoom[] = state.copiedRooms.map((r) => {
            const newId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            idMap.set(r.id, newId);
            return {
              ...r,
              id: newId,
              name: `${r.name} (Kopya)`,
              x: dropGx + (r.x - minX),
              y: dropGy + (r.y - minY),
              doors: r.doors.map((d) => ({ ...d, id: `door-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` }))
            };
          });

          const newConns: RoomConnection[] = state.copiedConnections.map((c) => ({
            id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            fromRoomId: idMap.get(c.fromRoomId) || c.fromRoomId,
            toRoomId: idMap.get(c.toRoomId) || c.toRoomId,
            style: c.style,
          }));

          const nextState = {
            rooms: [...state.rooms, ...newRooms],
            connections: [...state.connections, ...newConns],
            selectedRoomIds: newRooms.map((r) => r.id)
          };
          notifyChannel(nextState);
          return nextState;
        }),

        // Roleplay Handouts
        addHandout: (handoutData) => {
          const newCard: HandoutCard = {
            ...handoutData,
            id: `handout-${Date.now()}`,
          };
          set((state) => {
            const nextState = { handouts: [newCard, ...state.handouts] };
            notifyChannel(nextState);
            return nextState;
          });
        },

        updateHandout: (id, updates) => set((state) => {
          const nextHandouts = state.handouts.map((h) => (h.id === id ? { ...h, ...updates } : h));
          const nextState = { handouts: nextHandouts };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteHandout: (id) => set((state) => {
          const nextHandouts = state.handouts.filter((h) => h.id !== id);
          const nextSpotlight = state.spotlightHandoutId === id ? null : state.spotlightHandoutId;
          const nextState = { handouts: nextHandouts, spotlightHandoutId: nextSpotlight };
          notifyChannel(nextState);
          return nextState;
        }),

        setSpotlightHandoutId: (id) => set(() => {
          const nextState = { spotlightHandoutId: id };
          notifyChannel(nextState);
          return nextState;
        }),

        // Whiteboard Page Actions
        setActiveWhiteboardPageId: (id) => set((state) => {
          const target = state.whiteboardPages.find((p) => p.id === id);
          const nextState = {
            activeWhiteboardPageId: id,
            whiteboardDataUrl: target ? target.dataUrl : null,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        addWhiteboardPage: (name) => set((state) => {
          const newPage: WhiteboardPage = {
            id: `wb-page-${Date.now()}`,
            name: name.trim() || `Tahta ${state.whiteboardPages.length + 1}`,
            dataUrl: null,
            order: state.whiteboardPages.length,
          };
          const nextPages = [...state.whiteboardPages, newPage];
          const nextState = {
            whiteboardPages: nextPages,
            activeWhiteboardPageId: newPage.id,
            whiteboardDataUrl: null,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        updateWhiteboardPage: (id, name) => set((state) => {
          const nextPages = state.whiteboardPages.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
          const nextState = { whiteboardPages: nextPages };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteWhiteboardPage: (id) => set((state) => {
          if (state.whiteboardPages.length <= 1) return state;
          const remaining = state.whiteboardPages.filter((p) => p.id !== id);
          const fallbackPage = remaining[0];
          const nextState = {
            whiteboardPages: remaining,
            activeWhiteboardPageId: state.activeWhiteboardPageId === id ? fallbackPage.id : state.activeWhiteboardPageId,
            whiteboardDataUrl: state.activeWhiteboardPageId === id ? fallbackPage.dataUrl : state.whiteboardDataUrl,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        // Whiteboard Sync Action
        setWhiteboardDataUrl: (dataUrl) => set((state) => {
          const nextPages = state.whiteboardPages.map((p) =>
            p.id === state.activeWhiteboardPageId ? { ...p, dataUrl } : p
          );
          const nextState = {
            whiteboardDataUrl: dataUrl,
            whiteboardPages: nextPages,
          };
          notifyChannel(nextState);
          return nextState;
        }),


                // Whiteboard Asset Vault Actions
        addWhiteboardAsset: (assetData) => set((state) => {
          const newAsset: WhiteboardAsset = {
            ...assetData,
            id: `wb-asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          };
          const nextAssets = [newAsset, ...state.whiteboardAssets];
          const nextState = { whiteboardAssets: nextAssets };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteWhiteboardAsset: (id) => set((state) => {
          const nextAssets = state.whiteboardAssets.filter((a) => a.id !== id);
          const nextState = { whiteboardAssets: nextAssets };
          notifyChannel(nextState);
          return nextState;
        }),

        addWhiteboardHealthBar: (healthBarData) => set((state) => {
          const newBar: WhiteboardHealthBar = {
            ...healthBarData,
            id: `wb-hp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            pageId: healthBarData.pageId || state.activeWhiteboardPageId || 'wb-page-1',
            isPublic: healthBarData.isPublic !== undefined ? healthBarData.isPublic : true,
          };
          const nextBars = [...(state.whiteboardHealthBars || []), newBar];
          const nextState = { whiteboardHealthBars: nextBars };
          notifyChannel(nextState);
          return nextState;
        }),

        updateWhiteboardHealthBar: (id, updates) => set((state) => {
          const nextBars = (state.whiteboardHealthBars || []).map((bar) => {
            if (bar.id === id) {
              const updated = { ...bar, ...updates };
              if (updates.maxHp !== undefined) {
                updated.maxHp = Math.max(1, updates.maxHp);
              }
              if (updates.currentHp !== undefined) {
                updated.currentHp = Math.min(updated.maxHp, Math.max(0, updates.currentHp));
              }
              return updated;
            }
            return bar;
          });
          const nextState = { whiteboardHealthBars: nextBars };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteWhiteboardHealthBar: (id) => set((state) => {
          const nextBars = (state.whiteboardHealthBars || []).filter((bar) => bar.id !== id);
          const nextState = { whiteboardHealthBars: nextBars };
          notifyChannel(nextState);
          return nextState;
        }),

        resetActiveWhiteboardPage: () => set((state) => {
          const nextPages = state.whiteboardPages.map((p) =>
            p.id === state.activeWhiteboardPageId ? { ...p, dataUrl: null } : p
          );
          const nextState = {
            whiteboardDataUrl: null,
            whiteboardPages: nextPages,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        // Wheel of Fortune Presets
        addWheelPreset: (presetData) => {
          const newPreset: WheelPreset = {
            ...presetData,
            id: `wheel-${Date.now()}`
          };
          set((state) => {
            const nextState = {
              wheelPresets: [...state.wheelPresets, newPreset],
              activeWheelPresetId: newPreset.id
            };
            notifyChannel(nextState);
            return nextState;
          });
        },

        updateWheelPreset: (id, updates) => set((state) => {
          const nextPresets = state.wheelPresets.map((p) => p.id === id ? { ...p, ...updates } : p);
          const nextState = { wheelPresets: nextPresets };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteWheelPreset: (id) => set((state) => {
          if (state.wheelPresets.length <= 1) return state;
          const nextPresets = state.wheelPresets.filter((p) => p.id !== id);
          const nextActiveId = state.activeWheelPresetId === id ? nextPresets[0].id : state.activeWheelPresetId;
          const nextState = { wheelPresets: nextPresets, activeWheelPresetId: nextActiveId };
          notifyChannel(nextState);
          return nextState;
        }),

        setActiveWheelPresetId: (id) => {
          set({ activeWheelPresetId: id });
          notifyChannel({ activeWheelPresetId: id });
        },

        triggerWheelSpin: (event) => {
          set({ activeSpinEvent: event });
          notifyChannel({ activeSpinEvent: event });
        },

        addDrawingPath: (path) => set((state) => {
          const nextState = { drawings: [...state.drawings, path] };
          notifyChannel(nextState);
          return nextState;
        }),

        clearDrawings: () => set(() => {
          const nextState = { drawings: [] };
          notifyChannel(nextState);
          return nextState;
        }),

        setBrushColor: (color) => set({ brushColor: color }),
        setBrushWidth: (width) => set({ brushWidth: width }),

        addDiceRoll: (rollData) => {
          const newRoll: DiceRoll = {
            ...rollData,
            id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
          set((state) => {
            const nextState = {
              diceHistory: [newRoll, ...state.diceHistory.slice(0, 19)]
            };
            notifyChannel(nextState);
            return nextState;
          });
          peerSyncService.sendActionToHost('DICE_ROLL', newRoll);
          return newRoll;
        },

        clearDiceHistory: () => set(() => {
          const nextState = { diceHistory: [] };
          notifyChannel(nextState);
          peerSyncService.sendActionToHost('CLEAR_DICE_HISTORY', {});
          return nextState;
        }),

                // Smart Lamp & NPC Actions
        setGeminiApiKey: (key) => set({ geminiApiKey: key.trim() }),
        setSelectedAiModel: (model) => set({ selectedAiModel: model }),
        setAiCrueltyLevel: (level) => set({ aiCrueltyLevel: level }),
        setAiTemperature: (temp) => set({ aiTemperature: temp }),


        setActiveNpcProfileId: (id) => set({ activeNpcProfileId: id }),

        addNpcProfile: (profileData) => set((state) => {
          const newProfile: NpcProfile = {
            ...profileData,
            id: `npc-${Date.now()}`,
          };
          const nextProfiles = [...state.npcProfiles, newProfile];
          const nextState = {
            npcProfiles: nextProfiles,
            activeNpcProfileId: newProfile.id,
          };
          notifyChannel(nextState);
          return nextState;
        }),

        updateNpcProfile: (id, updates) => set((state) => {
          const nextProfiles = state.npcProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p));
          const nextState = { npcProfiles: nextProfiles };
          notifyChannel(nextState);
          return nextState;
        }),

        deleteNpcProfile: (id) => set((state) => {
          if (state.npcProfiles.length <= 1) return state;
          const remaining = state.npcProfiles.filter((p) => p.id !== id);
          const nextActive = state.activeNpcProfileId === id ? remaining[0].id : state.activeNpcProfileId;
          const nextState = { npcProfiles: remaining, activeNpcProfileId: nextActive };
          notifyChannel(nextState);
          return nextState;
        }),

        addLampChatMessage: (msg) => set((state) => {
          const newMsg: LampChatMessage = {
            ...msg,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          const nextHistory = [...state.lampChatHistory, newMsg];
          const nextState = { lampChatHistory: nextHistory };
          notifyChannel(nextState);
          return nextState;
        }),

        clearLampChatHistory: () => set(() => {
          const nextState = { lampChatHistory: [] };
          notifyChannel(nextState);
          return nextState;
        }),

        toggleLampMessagePublic: (id) => set((state) => {
          const nextHistory = state.lampChatHistory.map((m) =>
            m.id === id ? { ...m, isPublic: !m.isPublic } : m
          );
          const nextState = { lampChatHistory: nextHistory };
          notifyChannel(nextState);
          return nextState;
        }),

        setActiveGenieEvent: (event) => set(() => {
          const nextState = { activeGenieEvent: event };
          notifyChannel(nextState);
          return nextState;
        }),

        addRulebookNote: (note) => set((state) => ({
          rulebookNotes: [
            {
              ...note,
              id: `note-${Date.now()}`,
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...state.rulebookNotes
          ]
        })),

        updateRulebookNote: (id, updates) => set((state) => ({
          rulebookNotes: state.rulebookNotes.map((n) => (n.id === id ? {
            ...n,
            ...updates,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } : n))
        })),

        deleteRulebookNote: (id) => set((state) => ({
          rulebookNotes: state.rulebookNotes.filter((n) => n.id !== id)
        })),

        broadcastState: () => {
          notifyChannel({});
        },


        


        // Multiplayer & Permissions State
        connectedPlayers: [],
        localPlayerName: (typeof window !== 'undefined' && localStorage.getItem('magic_lamp_player_name')) || `Oyuncu-${Math.floor(1000 + Math.random() * 9000)}`,
        isLockedPlayerMode: false,
        setLocalPlayerName: (name: string) => {
          if (typeof window !== 'undefined') localStorage.setItem('magic_lamp_player_name', name.trim());
          set({ localPlayerName: name.trim() });
        },
        setLockedPlayerMode: (locked: boolean) => set({ isLockedPlayerMode: locked }),
        setConnectedPlayers: (players: ConnectedPlayer[]) => set(() => {
          const nextState = { connectedPlayers: players };
          notifyChannel(nextState);
          return nextState;
        }),
                renameConnectedPlayer: (playerId: string, newName: string) => set((state) => {
          const updated = state.connectedPlayers.map((p) =>
            p.id === playerId ? { ...p, name: newName } : p
          );
          const nextState = { connectedPlayers: updated };
          notifyChannel(nextState);
          return nextState;
        }),
        togglePlayerDrawingPermission: (playerId: string) => set((state) => {
          const updated = state.connectedPlayers.map((p) =>
            p.id === playerId ? { ...p, canDrawWhiteboard: !p.canDrawWhiteboard } : p
          );
          const nextState = { connectedPlayers: updated };
          notifyChannel(nextState);
          return nextState;
        }),

        // Combat Initiative Tracker Implementation
        initiativeList: [],
        isInitiativeOpen: false,
        currentTurnIndex: 0,
        roundNumber: 1,
        setInitiativeList: (list: InitiativeItem[]) => set(() => {
          const nextState = { initiativeList: list };
          notifyChannel(nextState);
          return nextState;
        }),
        setInitiativeOpen: (open: boolean) => set({ isInitiativeOpen: open }),
        setCurrentTurnIndex: (idx: number) => set(() => {
          const nextState = { currentTurnIndex: idx };
          notifyChannel(nextState);
          return nextState;
        }),
        setRoundNumber: (round: number) => set(() => {
          const nextState = { roundNumber: round };
          notifyChannel(nextState);
          return nextState;
        }),

        // Party Chat Implementation
        chatMessages: [],
        isChatOpen: false,
        addChatMessage: (msg: ChatMessage) => set((state) => {
          const nextState = { chatMessages: [...state.chatMessages, msg] };
          notifyChannel(nextState);
          peerSyncService.sendActionToHost('CHAT_MESSAGE', msg);
          return nextState;
        }),
        setChatOpen: (open: boolean) => set({ isChatOpen: open }),

        // Soundboard Implementation
        isSoundboardOpen: false,
        activeAmbientTrack: null,
        ambientVolume: 0.5,
        setSoundboardOpen: (open: boolean) => set({ isSoundboardOpen: open }),
        setActiveAmbientTrack: (track: string | null) => set(() => {
          const nextState = { activeAmbientTrack: track };
          notifyChannel(nextState);
          return nextState;
        }),
        setAmbientVolume: (vol: number) => set({ ambientVolume: vol }),

        resetScene: () => set(() => {
          const nextState = {
            tokens: DEFAULT_TOKENS,
            backstageTokens: DEFAULT_BACKSTAGE_TOKENS,
            rooms: DEFAULT_ROOMS,
            connections: DEFAULT_CONNECTIONS,
            handouts: DEFAULT_HANDOUTS,
            spotlightHandoutId: null,
            whiteboardDataUrl: null,
            wheelPresets: DEFAULT_WHEEL_PRESETS,
            activeWheelPresetId: 'wheel-crit-fumble',
            activeSpinEvent: null,
            drawings: [],
            diceHistory: [],
            selectedTokenId: null,
            selectedRoomIds: [],
          };
          notifyChannel(nextState);
          return nextState;
        })
      };
    },
    {
      name: 'magic_lamp_vtt_save',
      partialize: (state) => ({
        tokens: state.tokens,
        backstageTokens: state.backstageTokens,
        rooms: state.rooms,
        connections: state.connections,
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        whiteboardPages: state.whiteboardPages,
        activeWhiteboardPageId: state.activeWhiteboardPageId,
        whiteboardAssets: state.whiteboardAssets,
        encounterPresets: state.encounterPresets,
        activeEncounterPresetId: state.activeEncounterPresetId,
        geminiApiKey: state.geminiApiKey,
        selectedAiModel: state.selectedAiModel,
        aiCrueltyLevel: state.aiCrueltyLevel,
        aiTemperature: state.aiTemperature,
        npcProfiles: state.npcProfiles,
        activeNpcProfileId: state.activeNpcProfileId,
        lampChatHistory: state.lampChatHistory,
        handouts: state.handouts,
        rulebookNotes: state.rulebookNotes,
        whiteboardDataUrl: state.whiteboardDataUrl,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        whiteboardHealthBars: state.whiteboardHealthBars,
        wheelPresets: state.wheelPresets,
        activeWheelPresetId: state.activeWheelPresetId,
        diceHistory: state.diceHistory,
      }),
    }
  )
);
