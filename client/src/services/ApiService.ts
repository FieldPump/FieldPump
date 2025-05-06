// FieldPump API Service

import { Player } from '../shared/types/Player';

export class ApiService {
  private apiBaseUrl: string;
  private token: string | null = null;
  
  constructor() {
    // Use relative URL in production, full URL in development
    this.apiBaseUrl = '/api';
    
    // Check for saved token
    this.token = localStorage.getItem('fieldpump_token');
  }
  
  public async login(username: string, password: string): Promise<Player> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('fieldpump_token', data.token);
      
      return data.player;
    } catch (error) {
      console.error('API login error:', error);
      throw error;
    }
  }
  
  public async register(username: string, password: string, email: string): Promise<Player> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('fieldpump_token', data.token);
      
      return data.player;
    } catch (error) {
      console.error('API register error:', error);
      throw error;
    }
  }
  
  public async getPlayerByWallet(walletAddress: string): Promise<Player | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/players/wallet/${walletAddress}`);
      
      if (response.status === 404) {
        return null; // Player not found
      }
      
      if (!response.ok) {
        throw new Error('Failed to get player data');
      }
      
      const data = await response.json();
      return data.player;
    } catch (error) {
      console.error('API getPlayerByWallet error:', error);
      throw error;
    }
  }
  
  public async createCharacter(name: string, characterClass: string, walletAddress: string): Promise<Player> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/players/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, characterClass, walletAddress })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create character');
      }
      
      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('fieldpump_token', data.token);
      
      return data.player;
    } catch (error) {
      console.error('API createCharacter error:', error);
      throw error;
    }
  }
  
  public async getPlayerData(): Promise<Player> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/players/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get player data');
      }
      
      const data = await response.json();
      return data.player;
    } catch (error) {
      console.error('API getPlayerData error:', error);
      throw error;
    }
  }
  
  public async updatePlayerPosition(x: number, y: number, mapId: string): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/players/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ x, y, mapId })
      });
    } catch (error) {
      console.error('API updatePlayerPosition error:', error);
    }
  }
  
  public async getMapData(mapId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/maps/${mapId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get map data for ${mapId}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API getMapData error:', error);
      throw error;
    }
  }
  
  public async getNearbyPlayers(mapId: string): Promise<Player[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/players/nearby/${mapId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get nearby players');
      }
      
      const data = await response.json();
      return data.players;
    } catch (error) {
      console.error('API getNearbyPlayers error:', error);
      throw error;
    }
  }
  
  public async getPlayerInventory(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/players/inventory`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get inventory');
      }
      
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error('API getPlayerInventory error:', error);
      throw error;
    }
  }
  
  public async getNFTItems(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/nft/items`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get NFT items');
      }
      
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error('API getNFTItems error:', error);
      throw error;
    }
  }
  
  public logout(): void {
    this.token = null;
    localStorage.removeItem('fieldpump_token');
  }
}