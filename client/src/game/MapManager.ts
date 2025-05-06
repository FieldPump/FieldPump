// FieldPump Map Manager

import { SpriteManager } from './SpriteManager';
import { MapData, TileType, Obstacle } from '../shared/types/GameTypes';

export class MapManager {
  private currentMap: MapData | null = null;
  private tileSize: number = 32; // Pixel size of each tile
  private mapCache: Map<string, MapData> = new Map();
  
  constructor(private spriteManager: SpriteManager) {}
  
  public async loadMap(mapId: string): Promise<void> {
    // Check if map is already cached
    if (this.mapCache.has(mapId)) {
      this.currentMap = this.mapCache.get(mapId)!;
      return;
    }
    
    try {
      // In a real implementation, this would load from the server
      // For this demo, we'll create a simple procedural map
      const mapData = this.generateDemoMap(mapId);
      
      this.currentMap = mapData;
      this.mapCache.set(mapId, mapData);
    } catch (error) {
      console.error('Failed to load map:', error);
      throw new Error(`Failed to load map ${mapId}`);
    }
  }
  
  public render(ctx: CanvasRenderingContext2D, playerLocation: { x: number, y: number, mapId: string }): void {
    if (!this.currentMap) return;
    
    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate visible tile range
    const tilesX = Math.ceil(width / this.tileSize) + 2; // Add buffer tiles
    const tilesY = Math.ceil(height / this.tileSize) + 2;
    
    const startTileX = Math.floor(playerLocation.x - tilesX / 2);
    const startTileY = Math.floor(playerLocation.y - tilesY / 2);
    
    // Render visible tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const tileX = startTileX + x;
        const tileY = startTileY + y;
        
        // Skip tiles outside map bounds
        if (tileX < 0 || tileX >= this.currentMap.width || 
            tileY < 0 || tileY >= this.currentMap.height) {
          continue;
        }
        
        // Calculate screen position
        const screenX = centerX + (tileX - playerLocation.x) * this.tileSize;
        const screenY = centerY + (tileY - playerLocation.y) * this.tileSize;
        
        // Get tile type
        const tileIndex = tileY * this.currentMap.width + tileX;
        const tileType = this.currentMap.tiles[tileIndex] || TileType.Grass;
        
        // Get tile sprite
        const tileSprite = this.spriteManager.getTileSprite(tileType);
        
        // Draw tile
        ctx.drawImage(tileSprite, screenX, screenY, this.tileSize, this.tileSize);
        
        // Draw obstacles
        if (this.currentMap.obstacles.some(o => o.x === tileX && o.y === tileY)) {
          const obstacleSprite = this.spriteManager.getObstacleSprite(tileType);
          ctx.drawImage(obstacleSprite, screenX, screenY, this.tileSize, this.tileSize);
        }
      }
    }
  }
  
  public getMapBounds(): { width: number, height: number } {
    if (!this.currentMap) return { width: 0, height: 0 };
    return { 
      width: this.currentMap.width - 1, 
      height: this.currentMap.height - 1 
    };
  }
  
  public getObstacles(): Obstacle[] {
    if (!this.currentMap) return [];
    return this.currentMap.obstacles;
  }
  
  private generateDemoMap(mapId: string): MapData {
    // Create a simple procedural map for demonstration
    const width = 50;
    const height = 50;
    const tiles: TileType[] = [];
    const obstacles: Obstacle[] = [];
    
    // Generate base terrain
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Default to grass
        let tileType = TileType.Grass;
        
        // Add some variety with different tile types
        const random = Math.random();
        if (random < 0.05) {
          tileType = TileType.Water;
        } else if (random < 0.1) {
          tileType = TileType.Sand;
        } else if (random < 0.15) {
          tileType = TileType.Stone;
        }
        
        tiles.push(tileType);
        
        // Add some obstacles (trees, rocks)
        if (random < 0.03) {
          obstacles.push({
            x,
            y,
            type: random < 0.015 ? 'tree' : 'rock'
          });
        }
      }
    }
    
    // Add a path through the center
    for (let x = 10; x < width - 10; x++) {
      const y = Math.floor(height / 2) + Math.sin(x * 0.2) * 3;
      const index = y * width + x;
      tiles[index] = TileType.Path;
      
      // Remove any obstacles on the path
      const obstacleIndex = obstacles.findIndex(o => o.x === x && o.y === y);
      if (obstacleIndex !== -1) {
        obstacles.splice(obstacleIndex, 1);
      }
    }
    
    return {
      id: mapId,
      name: `Field ${mapId}`,
      width,
      height,
      tiles,
      obstacles,
      npcs: [],
      portals: []
    };
  }
}