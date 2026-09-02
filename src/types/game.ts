export type ToolMode = 
  | 'select' 
  | 'room_edit'
  | 'pan' 
  | 'draw' 
  | 'fog_reveal' 
  | 'fog_hide' 
  | 'laser'
  | 'ruler';

export type TokenType = 'hero' | 'monster' | 'npc' | 'item' | 'trap';

export type ActiveView = 'map' | 'whiteboard' | 'roleplay';

export interface TokenAttribute {
  id: string;
  name: string; // e.g. "Para", "Mana", "AC / Zırh", "Seviye"
  type: 'number' | 'text';
  value: number | string;
  isPublic?: boolean;
}

export interface MapLayer {
  id: string;
  name: string;
  order: number;
  backgroundType?: 'texture' | 'image' | 'color';
  backgroundColor?: string;
  backgroundTexture?: 'none' | 'dungeon-stone' | 'grass-forest' | 'wood-planks' | 'parchment' | 'cave-rock' | 'water-sea' | 'space-stars';
  backgroundImageUrl?: string;
  backgroundImageOpacity?: number;
}

export interface WhiteboardPage {
  id: string;
  name: string;
  dataUrl: string | null;
  order: number;
}

export interface WhiteboardAsset {
  id: string;
  name: string;
  image: string; // URL or dataUrl
  category?: string; // e.g. "Haritalar", "Canavarlar", "Eşyalar", "Karakterler", "İpuçları"
}

export interface WhiteboardHealthBar {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  x: number;
  y: number;
  width?: number;
  color?: string; // e.g. '#ef4444', '#22c55e', '#a855f7', '#3b82f6', '#eab308'
  pageId?: string; // Belongs to specific whiteboard page
  isPublic?: boolean; // Visible in streamer mode
}

export interface Token {
  id: string;
  name: string;
  type: TokenType;
  x: number; // Grid coordinate
  y: number;
  size: number;
  sizeY?: number; // in grid units
  hp?: {
    current: number;
    max: number;
  };
  image?: string; // Data URL or image link
  color?: string;
  notes?: string;
  initiativeBonus?: number; // Base Initiative stat / DEX modifier
  statuses?: string[];
  statusEffects?: string[]; // e.g. ["🤢 Zehirlendi", "⚡ Hızlandı", "🛡️ Kalkanlı"]
  customAttributes?: TokenAttribute[];
  folder?: string; // Backstage folder/category name e.g. "Canavarlar", "Bosslar", "Eşyalar"
  isTemplate?: boolean; // When true, stays in backstage vault as reusable template when summoned
  hiddenFromPlayers?: boolean;
  hideInFog?: boolean; // When true, hidden from players if in undiscovered room
  layerId?: string; // Belongs to specific floor/layer (e.g. "layer-1")
}

export interface DungeonDoor {
  id: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  offset: number;
  isOpen: boolean;
  isLocked?: boolean;
}

export interface DungeonRoom {
  id: string;
  name: string;
  x: number; // Grid X
  y: number; // Grid Y
  width: number; // in grid cells
  height: number;
  theme: 'stone' | 'crypt' | 'magma' | 'nature' | 'gold';
  doors: DungeonDoor[];
  isRevealed: boolean;
  label?: string; // On-floor visual text
  notes?: string; // Room story / DM description
  isNotePublic?: boolean; // Whether players can see the floor label
  image?: string; // Room background image or map tile
  isSpawnPoint?: boolean; // Backstage summons spawn here
  layerId?: string; // Floor / Layer ID
  trapDetails?: string; // Trap DC & mechanics
  lootDetails?: string; // Chest loot & treasure contents
}

export interface RoomConnection {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  style?: 'corridor' | 'secret' | 'portal';
  layerId?: string;
}

export interface HandoutCard {
  id: string;
  title: string;
  category: 'location' | 'npc' | 'item' | 'handout';
  image: string; // URL or Data URL
  description: string;
  notes?: string; // DM private notes
  isPublic?: boolean;
}

export interface DiceRoll {
  id: string;
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
  result: number;
  modifier: number;
  rollerName: string;
  timestamp: string;
  isCrit?: boolean;
  isFumble?: boolean;
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  points: DrawPoint[];
  color: string;
  width: number;
  isLaser?: boolean;
  createdAt?: number;
  layerId?: string;
}

export interface NpcProfile {
  id: string;
  name: string;
  title: string;
  avatar: string; // Emoji or image URL
  systemPrompt: string;
  category: 'genie' | 'adventure' | 'tavern' | 'custom';
  greeting: string;
  crueltyLevel?: number; // 1 (Merciful) to 10 (Ruthless Monkey's Paw)
  temperature?: number; // 0.1 to 1.0 (Creativity)
}

export interface LampChatMessage {
  id: string;
  sender: 'user' | 'npc';
  text: string;
  timestamp: string;
  diceBonus?: string;
  consequence?: string; // Monkey's Paw consequence
  isPublic?: boolean;
}

export interface CustomEncounterMonster {
  id: string;
  name: string;
  image?: string;
  color?: string;
  hp: number;
  ac: number;
  speed?: number;
  count: number;
  size?: number;
  templateTokenId?: string; // Linked to a token in Backstage Vault
}

export interface CustomEncounterPreset {
  id: string;
  name: string;
  icon: string;
  roomTitle: string;
  roomTheme: 'stone' | 'crypt' | 'magma' | 'nature' | 'gold';
  description: string;
  trapName: string;
  trapDc: string;
  trapEffect: string;
  trapImage?: string;
  trapColor?: string;
  trapTemplateTokenId?: string;
  lootName: string;
  lootGold: number;
  lootItems: string[];
  lootImage?: string;
  lootColor?: string;
  lootTemplateTokenId?: string;
  monsters: CustomEncounterMonster[];
}

export interface LampEvent {
  id: string;
  title: string;
  type: 'boon' | 'curse' | 'encounter' | 'riddle' | 'loot';
  description: string;
  suggestion: string;
  diceBonus?: string;
}

export interface RulebookNote {
  id: string;
  title: string;
  category: 'rules' | 'homebrew' | 'story' | 'quests';
  content: string;
  updatedAt: string;
}

// Wheel of Fortune
export interface WheelSlice {
  id: string;
  text: string;
  color: string;
  weight: number;
}

export interface WheelPreset {
  id: string;
  title: string;
  slices: WheelSlice[];
}

export interface WheelSpinEvent {
  presetId: string;
  targetAngle: number;
  durationMs: number;
  winnerSlice: WheelSlice;
  timestamp: number;
}

export interface SessionData {
  rooms: DungeonRoom[];
  connections: RoomConnection[];
  tokens: Token[];
  drawings: DrawingPath[];
  layers: MapLayer[];
  activeLayerId: string;
  whiteboardPages: WhiteboardPage[];
  activeWhiteboardPageId: string;
  whiteboardAssets: WhiteboardAsset[];
  whiteboardHealthBars?: WhiteboardHealthBar[];
  backstageTokens: Token[];
  encounterPresets: CustomEncounterPreset[];
  rulebookNotes: RulebookNote[];
  npcProfiles: NpcProfile[];
  lampChatHistory: LampChatMessage[];
  handouts?: HandoutCard[];
  activeView: ActiveView;
}

export interface CampaignSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: SessionData;
}


export interface ConnectedPlayer {
  id: string; // Peer ID or unique ID
  name: string;
  isDm?: boolean;
  canDrawWhiteboard: boolean;
  joinedAt: number;
}

export interface InitiativeItem {
  id: string;
  tokenId?: string;
  name: string;
  image?: string;
  color?: string;
  score: number; // D20 + DEX/modifier
  currentHp?: number;
  maxHp?: number;
  isMonster?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  isDm: boolean;
  text: string;
  timestamp: string;
  isWhisper?: boolean;
  recipientId?: string; // 'DM' or specific player id
  recipientName?: string;
  isDiceRoll?: boolean;
  diceDetail?: string;
}

export interface CustomSoundTrack {
  id: string;
  name: string;
  category: 'ambient' | 'music' | 'sfx';
  url: string; // Base64 Data URL or HTTP audio URL
  icon?: string;
}
