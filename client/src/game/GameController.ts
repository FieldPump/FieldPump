// FieldPump Game Controller

import { Player } from '../../shared/types/Player';

export class GameController {
  private keyState: { [key: string]: boolean } = {};
  private moveSpeed: number = 3; // Tiles per second
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Set up keyboard event listeners
    window.addEventListener('keydown', (e) => {
      this.keyState[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keyState[e.key] = false;
    });
    
    // Prevent default behavior for arrow keys to avoid page scrolling
    window.addEventListener('keydown', (e) => {
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
  }
  
  public updatePlayerPosition(player: Player, deltaTime: number, mapBounds: { width: number, height: number }, obstacles: any[]): boolean {
    if (!player) return false;
    
    let moved = false;
    const originalX = player.location.x;
    const originalY = player.location.y;
    
    // Calculate movement based on key state
    if (this.keyState['ArrowUp'] || this.keyState['w']) {
      player.location.y -= this.moveSpeed * deltaTime;
      moved = true;
    }
    if (this.keyState['ArrowDown'] || this.keyState['s']) {
      player.location.y += this.moveSpeed * deltaTime;
      moved = true;
    }
    if (this.keyState['ArrowLeft'] || this.keyState['a']) {
      player.location.x -= this.moveSpeed * deltaTime;
      moved = true;
    }
    if (this.keyState['ArrowRight'] || this.keyState['d']) {
      player.location.x += this.moveSpeed * deltaTime;
      moved = true;
    }
    
    // Ensure player stays within map bounds
    player.location.x = Math.max(0, Math.min(mapBounds.width, player.location.x));
    player.location.y = Math.max(0, Math.min(mapBounds.height, player.location.y));
    
    // Check collision with obstacles
    const playerTileX = Math.floor(player.location.x);
    const playerTileY = Math.floor(player.location.y);
    
    const hasCollision = obstacles.some(obstacle => 
      Math.floor(obstacle.x) === playerTileX && Math.floor(obstacle.y) === playerTileY
    );
    
    if (hasCollision) {
      // Revert position if collision detected
      player.location.x = originalX;
      player.location.y = originalY;
      moved = false;
    }
    
    return moved;
  }
  
  public isActionKeyPressed(): boolean {
    return this.keyState[' '] || this.keyState['e'];
  }
  
  public isInventoryKeyPressed(): boolean {
    return this.keyState['i'];
  }
  
  public isChatKeyPressed(): boolean {
    return this.keyState['c'];
  }
  
  public getMovementDirection(): string | null {
    if (this.keyState['ArrowUp'] || this.keyState['w']) return 'up';
    if (this.keyState['ArrowDown'] || this.keyState['s']) return 'down';
    if (this.keyState['ArrowLeft'] || this.keyState['a']) return 'left';
    if (this.keyState['ArrowRight'] || this.keyState['d']) return 'right';
    return null;
  }
}