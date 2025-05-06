// FieldPump Sprite Manager

import { TileType } from '../shared/types/GameTypes';

export class SpriteManager {
  private tileSprites: Map<TileType, HTMLImageElement> = new Map();
  private obstacleSprites: Map<string, HTMLImageElement> = new Map();
  private playerSprites: Map<string, HTMLImageElement> = new Map();
  private itemSprites: Map<string, HTMLImageElement> = new Map();
  private loadedSprites: number = 0;
  private totalSprites: number = 0;
  private onLoadComplete: (() => void) | null = null;
  
  constructor() {
    this.loadSprites();
  }
  
  public onAllSpritesLoaded(callback: () => void): void {
    if (this.loadedSprites === this.totalSprites) {
      callback();
    } else {
      this.onLoadComplete = callback;
    }
  }
  
  public getTileSprite(type: TileType): HTMLImageElement {
    return this.tileSprites.get(type) || this.createPlaceholderSprite('#3a3');
  }
  
  public getObstacleSprite(type: TileType): HTMLImageElement {
    const key = type === TileType.Water ? 'water' : 'tree';
    return this.obstacleSprites.get(key) || this.createPlaceholderSprite('#383');
  }
  
  public getPlayerSprite(spriteId: string): HTMLImageElement {
    return this.playerSprites.get(spriteId) || this.createPlaceholderSprite('#00f');
  }
  
  public getItemSprite(itemId: string): HTMLImageElement {
    return this.itemSprites.get(itemId) || this.createPlaceholderSprite('#ff0');
  }
  
  private loadSprites(): void {
    // In a real implementation, we would load actual sprite images
    // For this demo, we'll create colored rectangles as placeholders
    
    // Create tile sprites
    this.tileSprites.set(TileType.Grass, this.createPlaceholderSprite('#3a3'));
    this.tileSprites.set(TileType.Water, this.createPlaceholderSprite('#33f'));
    this.tileSprites.set(TileType.Sand, this.createPlaceholderSprite('#fa3'));
    this.tileSprites.set(TileType.Stone, this.createPlaceholderSprite('#777'));
    this.tileSprites.set(TileType.Path, this.createPlaceholderSprite('#a95'));
    
    // Create obstacle sprites
    this.obstacleSprites.set('tree', this.createPlaceholderSprite('#383', true));
    this.obstacleSprites.set('rock', this.createPlaceholderSprite('#555', true));
    this.obstacleSprites.set('water', this.createPlaceholderSprite('#55f', true));
    
    // Create player sprites
    this.playerSprites.set('default', this.createPlayerSprite('#f00'));
    this.playerSprites.set('warrior', this.createPlayerSprite('#a00'));
    this.playerSprites.set('mage', this.createPlayerSprite('#00f'));
    this.playerSprites.set('archer', this.createPlayerSprite('#0a0'));
    
    // Create item sprites
    this.itemSprites.set('sword', this.createItemSprite('#aaa'));
    this.itemSprites.set('potion', this.createItemSprite('#f0f'));
    this.itemSprites.set('gold', this.createItemSprite('#ff0'));
    this.itemSprites.set('nft_item', this.createItemSprite('#f0f', true));
  }
  
  private createPlaceholderSprite(color: string, isObstacle: boolean = false): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 32, 32);
      
      if (isObstacle) {
        // Add some detail to obstacles
        ctx.fillStyle = this.adjustColor(color, -20);
        ctx.fillRect(5, 5, 22, 22);
      }
      
      // Add a grid pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 32, 32);
    }
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }
  
  private createPlayerSprite(color: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw body
      ctx.fillStyle = color;
      ctx.fillRect(8, 8, 16, 16);
      
      // Draw head
      ctx.fillStyle = '#fca';
      ctx.fillRect(10, 2, 12, 8);
      
      // Draw eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(12, 4, 2, 2);
      ctx.fillRect(18, 4, 2, 2);
    }
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }
  
  private createItemSprite(color: string, isNFT: boolean = false): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw item background
      ctx.fillStyle = '#333';
      ctx.fillRect(4, 4, 24, 24);
      
      // Draw item
      ctx.fillStyle = color;
      ctx.fillRect(8, 8, 16, 16);
      
      if (isNFT) {
        // Add glow for NFT items
        ctx.strokeStyle = '#f0f';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 28, 28);
      }
    }
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }
  
  private adjustColor(color: string, amount: number): string {
    // Simple color adjustment function
    if (color.startsWith('#')) {
      color = color.slice(1);
    }
    
    let r = parseInt(color.slice(0, 2), 16);
    let g = parseInt(color.slice(2, 4), 16);
    let b = parseInt(color.slice(4, 6), 16);
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}