// FieldPump Player Type Definition

import { Item } from './GameTypes';

export interface Player {
  id: string;
  name: string;
  walletAddress?: string; // Optional for traditional login
  level: number;
  experience: number;
  characterClass: 'warrior' | 'mage' | 'archer';
  stats: {
    maxHealth: number;
    currentHealth: number;
    attack: number;
    defense: number;
    speed: number;
  };
  location: {
    x: number;
    y: number;
    mapId: string;
  };
  appearance: {
    spriteId: string;
    customizations?: Record<string, string>;
  };
  inventory: Item[];
  skills: {
    id: string;
    name: string;
    level: number;
  }[];
  quests: {
    id: string;
    status: 'active' | 'completed';
    progress: number;
  }[];
  achievements: {
    id: string;
    unlockedAt: number;
  }[];
  lastLogin: number;
  createdAt: number;
}