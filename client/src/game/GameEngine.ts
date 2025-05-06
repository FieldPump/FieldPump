// FieldPump Game Engine

import { Player } from '../../shared/types/Player';
import { UIManager } from '../components/UIManager';
import { Web3Manager } from '../web3/Web3Manager';
import { ApiService } from '../services/ApiService';
import { MapManager } from './MapManager';
import { SpriteManager } from './SpriteManager';
import { GameController } from './GameController';
import { AnimationSystem } from './AnimationSystem';
import { NFTManager } from '../web3/NFTManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player | null = null;
  private players: Map<string, Player> = new Map();
  private mapManager: MapManager;
  private spriteManager: SpriteManager;
  private gameController: GameController;
  private animationSystem: AnimationSystem;
  private nftManager: NFTManager;
  private lastTimestamp: number = 0;
  private isRunning: boolean = false;
  private wsConnection: WebSocket | null = null;
  
  constructor(
    private uiManager: UIManager,
    private web3Manager: Web3Manager,
    private apiService: ApiService
  ) {
    // Initialize canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    // Set canvas size to window size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Initialize game components
    this.spriteManager = new SpriteManager();
    this.mapManager = new MapManager(this.spriteManager);
    this.gameController = new GameController();
    this.animationSystem = new AnimationSystem(this.spriteManager);
    this.nftManager = new NFTManager(web3Manager, apiService);
    
    // Initialize NFT manager with marketplace address (from environment or config)
    const marketplaceAddress = '0x1234567890123456789012345678901234567890'; // 示例地址，实际应从配置获取
    this.nftManager.initialize(marketplaceAddress).catch(err => {
      console.error('Failed to initialize NFT manager:', err);
    });
    
    // Set up keyboard controls
    this.setupControls();
  }
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    
    // Connect to WebSocket server for real-time updates
    this.connectWebSocket();
  }
  
  public stop(): void {
    this.isRunning = false;
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
  
  public initializePlayer(playerData: Player): void {
    this.player = playerData;
    this.players.set(playerData.id, playerData);
    
    // Load initial map
    this.mapManager.loadMap(playerData.location.mapId);
    
    // Update UI with player info
    this.uiManager.updatePlayerInfo(playerData);
  }
  
  public sendChatMessage(message: string): void {
    if (!this.player || !this.wsConnection) return;
    
    const chatMessage = {
      type: 'chat',
      playerId: this.player.id,
      playerName: this.player.name,
      content: message,
      timestamp: Date.now()
    };
    
    this.wsConnection.send(JSON.stringify(chatMessage));
    this.uiManager.addChatMessage(chatMessage);
  }
  
  private gameLoop(timestamp: number): void {
    if (!this.isRunning) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    
    // Update game state
    this.update(deltaTime);
    
    // Render the game
    this.render();
    
    // Continue the game loop
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }
  
  private update(deltaTime: number): void {
    if (!this.player) return;
    
    // Update animations
    this.animationSystem.update(deltaTime);
    
    // Update player position based on input using the game controller
    const mapBounds = this.mapManager.getMapBounds();
    const obstacles = this.mapManager.getObstacles();
    const moved = this.gameController.updatePlayerPosition(this.player, deltaTime, mapBounds, obstacles);
    
    // Update player animation based on movement
    if (this.player) {
      const direction = this.gameController.getMovementDirection();
      const animationId = this.animationSystem.getAnimationForMovement(
        this.player.characterClass,
        direction
      );
      
      // Play the appropriate animation
      this.animationSystem.playAnimation(this.player.id, animationId);
    }
    
    // Send position update to server if moved
    if (moved) {
      this.sendPositionUpdate();
    }
    
    // Check for UI toggles
    if (this.gameController.isInventoryKeyPressed()) {
      this.uiManager.toggleInventory();
    }
    
    if (this.gameController.isChatKeyPressed()) {
      this.uiManager.toggleChat();
    }
  }
  
  private render(): void {
    if (!this.ctx || !this.player) return;
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render the map
    this.mapManager.render(this.ctx, this.player.location);
    
    // Render all players
    this.players.forEach(player => {
      if (player.location.mapId === this.player?.location.mapId) {
        this.renderPlayer(player);
      }
    });
    
    // Render UI elements
    this.renderUI();
  }
  
  private renderPlayer(player: Player): void {
    if (!this.ctx || !this.player) return;
    
    const isCurrentPlayer = player.id === this.player.id;
    
    // Get animation sprite or fallback to static sprite
    let sprite = this.animationSystem.getCurrentSprite(player.id);
    if (!sprite) {
      sprite = this.spriteManager.getPlayerSprite(player.appearance.spriteId);
    }
    
    // Calculate screen position (center current player)
    const screenX = isCurrentPlayer 
      ? this.canvas.width / 2 
      : this.canvas.width / 2 + (player.location.x - this.player.location.x) * 32;
    
    const screenY = isCurrentPlayer 
      ? this.canvas.height / 2 
      : this.canvas.height / 2 + (player.location.y - this.player.location.y) * 32;
    
    // Draw player sprite
    this.ctx.drawImage(sprite, screenX - 16, screenY - 16, 32, 32);
    
    // Draw player name above
    this.ctx.fillStyle = isCurrentPlayer ? '#00ffff' : '#ffffff';
    this.ctx.font = '10px "Press Start 2P"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name, screenX, screenY - 20);
    
    // Draw NFT indicator if player has NFT items
    if (player.inventory.some(item => item.isNFT)) {
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.beginPath();
      this.ctx.arc(screenX + 18, screenY - 18, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  private renderUI(): void {
    // Additional UI elements can be rendered here
    // This is for game-specific UI that needs to be on the canvas
    // Most UI is handled by the UIManager with HTML/CSS
  }
  
  private updatePlayerPosition(deltaTime: number): void {
    if (!this.player) return;
    
    const speed = 3; // Tiles per second
    const movement = speed * deltaTime;
    
    // Update position based on input
    if (this.keys.ArrowUp || this.keys.w) {
      this.player.location.y -= movement;
    }
    if (this.keys.ArrowDown || this.keys.s) {
      this.player.location.y += movement;
    }
    if (this.keys.ArrowLeft || this.keys.a) {
      this.player.location.x -= movement;
    }
    if (this.keys.ArrowRight || this.keys.d) {
      this.player.location.x += movement;
    }
    
    // Check for collisions with map boundaries and obstacles
    this.handleCollisions();
  }
  
  private handleCollisions(): void {
    if (!this.player) return;
    
    // Get map boundaries and obstacles from MapManager
    const mapBounds = this.mapManager.getMapBounds();
    const obstacles = this.mapManager.getObstacles();
    
    // Keep player within map boundaries
    this.player.location.x = Math.max(0, Math.min(this.player.location.x, mapBounds.width));
    this.player.location.y = Math.max(0, Math.min(this.player.location.y, mapBounds.height));
    
    // Simple collision detection with obstacles
    // In a real implementation, this would be more sophisticated
    for (const obstacle of obstacles) {
      // Simple bounding box collision
      if (
        this.player.location.x >= obstacle.x - 0.5 &&
        this.player.location.x <= obstacle.x + 0.5 &&
        this.player.location.y >= obstacle.y - 0.5 &&
        this.player.location.y <= obstacle.y + 0.5
      ) {
        // Move player back (simple resolution)
        // In a real game, you'd use proper collision resolution
        this.player.location.x = this.lastPosition.x;
        this.player.location.y = this.lastPosition.y;
        break;
      }
    }
    
    // Store last valid position
    this.lastPosition = { ...this.player.location };
  }
  
  private sendPositionUpdate(): void {
    if (!this.player || !this.wsConnection) return;
    
    // Only send updates at a reasonable rate (e.g., 10 times per second)
    const now = Date.now();
    if (now - this.lastUpdateTime < 100) return;
    this.lastUpdateTime = now;
    
    const positionUpdate = {
      type: 'position',
      playerId: this.player.id,
      location: this.player.location
    };
    
    this.wsConnection.send(JSON.stringify(positionUpdate));
  }
  
  private connectWebSocket(): void {
    // Connect to the game server WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.wsConnection = new WebSocket(wsUrl);
    
    this.wsConnection.onopen = () => {
      console.log('Connected to game server');
      if (this.player) {
        // Send initial player data
        const initMessage = {
          type: 'init',
          player: this.player
        };
        this.wsConnection?.send(JSON.stringify(initMessage));
      }
    };
    
    this.wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.wsConnection.onclose = () => {
      console.log('Disconnected from game server');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (this.isRunning) this.connectWebSocket();
      }, 3000);
    };
    
    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private handleServerMessage(message: any): void {
    switch (message.type) {
      case 'players':
        // Update all players
        message.players.forEach((playerData: Player) => {
          if (playerData.id !== this.player?.id) {
            this.players.set(playerData.id, playerData);
          }
        });
        break;
        
      case 'player_joined':
        // Add new player
        if (message.player.id !== this.player?.id) {
          this.players.set(message.player.id, message.player);
          this.uiManager.addSystemMessage(`${message.player.name} joined the game`);
        }
        break;
        
      case 'player_left':
        // Remove player
        this.players.delete(message.playerId);
        this.uiManager.addSystemMessage(`${message.playerName} left the game`);
        break;
        
      case 'position':
        // Update player position
        const player = this.players.get(message.playerId);
        if (player && message.playerId !== this.player?.id) {
          player.location = message.location;
        }
        break;
        
      case 'chat':
        // Display chat message
        this.uiManager.addChatMessage(message);
        break;
        
      case 'nft_update':
        // Update NFT items
        if (message.playerId === this.player?.id) {
          this.player.inventory = message.inventory;
          this.uiManager.updateInventory(this.player);
        }
        break;
    }
  }
  
  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  // Keyboard input handling
  private keys: Record<string, boolean> = {};
  private lastPosition: { x: number, y: number } = { x: 0, y: 0 };
  private lastUpdateTime: number = 0;
  
  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    
    // Touch controls for mobile
    this.setupTouchControls();
  }
  
  private setupTouchControls(): void {
    // Simple touch controls - in a real game, you'd implement a virtual joystick
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        // Reset all keys
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;
        this.keys.ArrowLeft = false;
        this.keys.ArrowRight = false;
        
        // Calculate direction
        const dx = touchX - touchStartX;
        const dy = touchY - touchStartY;
        
        // Determine primary direction
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal movement
          this.keys.ArrowLeft = dx < -20;
          this.keys.ArrowRight = dx > 20;
        } else {
          // Vertical movement
          this.keys.ArrowUp = dy < -20;
          this.keys.ArrowDown = dy > 20;
        }
        
        e.preventDefault(); // Prevent scrolling
      }
    });
    
    this.canvas.addEventListener('touchend', () => {
      // Reset all keys
      this.keys.ArrowUp = false;
      this.keys.ArrowDown = false;
      this.keys.ArrowLeft = false;
      this.keys.ArrowRight = false;
    });
  }
}