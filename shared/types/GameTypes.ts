// FieldPump Shared Game Types

// Tile types for map rendering
export enum TileType {
  Grass = 'grass',
  Water = 'water',
  Sand = 'sand',
  Stone = 'stone',
  Path = 'path'
}

// Map obstacle definition
export interface Obstacle {
  x: number;
  y: number;
  type: string; // 'tree', 'rock', etc.
}

// NPC definition
export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  spriteId: string;
  dialogues: string[];
  isQuestGiver: boolean;
}

// Portal/teleport point definition
export interface Portal {
  x: number;
  y: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
}

// Complete map data structure
export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[];
  obstacles: Obstacle[];
  npcs: NPC[];
  portals: Portal[];
}

// Item definition
export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'cosmetic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats?: {
    damage?: number;
    defense?: number;
    health?: number;
    mana?: number;
  };
  iconBase64: string; // Base64 encoded image data
  isNFT: boolean;
  tokenId?: string; // Only for NFT items
  contractAddress?: string; // Only for NFT items
}

// Chat message structure
export interface ChatMessage {
  type: 'chat' | 'system';
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}

// WebSocket message types
export type WebSocketMessage =
  | { type: 'init'; player: any }
  | { type: 'players'; players: any[] }
  | { type: 'player_joined'; player: any }
  | { type: 'player_left'; playerId: string; playerName: string }
  | { type: 'position'; playerId: string; location: { x: number; y: number; mapId: string } }
  | { type: 'chat'; playerId: string; playerName: string; content: string; timestamp: number }
  | { type: 'nft_update'; playerId: string; inventory: Item[] };