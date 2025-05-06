// FieldPump UI Manager

import { Player } from '../shared/types/Player';
import { Web3Manager } from '../web3/Web3Manager';
import { ApiService } from '../services/ApiService';

export class UIManager {
  private loginPanel: HTMLElement | null;
  private gameUI: HTMLElement | null;
  private inventoryPanel: HTMLElement | null;
  private chatPanel: HTMLElement | null;
  private playerName: HTMLElement | null;
  private playerLevel: HTMLElement | null;
  private healthFill: HTMLElement | null;
  private inventorySlots: HTMLElement | null;
  private nftSlots: HTMLElement | null;
  private chatMessages: HTMLElement | null;
  
  constructor(
    private web3Manager: Web3Manager,
    private apiService: ApiService
  ) {
    // Cache UI elements
    this.loginPanel = document.getElementById('login-panel');
    this.gameUI = document.getElementById('game-ui');
    this.inventoryPanel = document.getElementById('inventory-panel');
    this.chatPanel = document.getElementById('chat-panel');
    this.playerName = document.getElementById('player-name');
    this.playerLevel = document.getElementById('player-level');
    this.healthFill = document.getElementById('health-fill');
    this.inventorySlots = document.getElementById('inventory-slots');
    this.nftSlots = document.getElementById('nft-slots');
    this.chatMessages = document.getElementById('chat-messages');
  }
  
  public initializeUI(): void {
    // Additional UI initialization if needed
    console.log('UI initialized');
  }
  
  public showGameUI(): void {
    if (this.loginPanel) this.loginPanel.classList.add('hidden');
    if (this.gameUI) this.gameUI.classList.remove('hidden');
  }
  
  public showLoginUI(): void {
    if (this.loginPanel) this.loginPanel.classList.remove('hidden');
    if (this.gameUI) this.gameUI.classList.add('hidden');
    if (this.inventoryPanel) this.inventoryPanel.classList.add('hidden');
    if (this.chatPanel) this.chatPanel.classList.add('hidden');
  }
  
  public showCharacterCreation(walletAddress: string): void {
    // In a real implementation, this would show a character creation UI
    // For this demo, we'll create a default character
    console.log(`Creating character for wallet ${walletAddress}`);
    
    // Create a simple form for character creation
    if (this.loginPanel) {
      this.loginPanel.innerHTML = `
        <h2>Create Your Character</h2>
        <div id="character-creation">
          <input type="text" id="character-name" placeholder="Character Name">
          <div class="class-selection">
            <button class="class-button" data-class="warrior">Warrior</button>
            <button class="class-button" data-class="mage">Mage</button>
            <button class="class-button" data-class="archer">Archer</button>
          </div>
          <button id="create-character">Create Character</button>
        </div>
      `;
      
      // Add event listeners
      document.getElementById('create-character')?.addEventListener('click', async () => {
        const nameInput = document.getElementById('character-name') as HTMLInputElement;
        const name = nameInput?.value || 'Adventurer';
        const selectedClass = document.querySelector('.class-button.selected')?.getAttribute('data-class') || 'warrior';
        
        try {
          const playerData = await this.apiService.createCharacter(name, selectedClass, walletAddress);
          // Initialize the game with the new character
          // This would be handled by the GameEngine in a real implementation
          this.showGameUI();
        } catch (error) {
          console.error('Failed to create character:', error);
          this.showError('Failed to create character. Please try again.');
        }
      });
      
      // Add class selection functionality
      const classButtons = document.querySelectorAll('.class-button');
      classButtons.forEach(button => {
        button.addEventListener('click', () => {
          classButtons.forEach(b => b.classList.remove('selected'));
          button.classList.add('selected');
        });
      });
    }
  }
  
  public updatePlayerInfo(player: Player): void {
    if (this.playerName) this.playerName.textContent = player.name;
    if (this.playerLevel) this.playerLevel.textContent = `Level ${player.level}`;
    if (this.healthFill) {
      const healthPercent = (player.stats.currentHealth / player.stats.maxHealth) * 100;
      this.healthFill.style.width = `${healthPercent}%`;
    }
  }
  
  public updateInventory(player: Player): void {
    if (!this.inventorySlots || !this.nftSlots) return;
    
    // Clear existing slots
    this.inventorySlots.innerHTML = '';
    this.nftSlots.innerHTML = '';
    
    // Populate regular items
    const regularItems = player.inventory.filter(item => !item.isNFT);
    regularItems.forEach(item => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <img src="data:image/png;base64,${item.iconBase64}" alt="${item.name}">
        <span class="item-name">${item.name}</span>
      `;
      this.inventorySlots?.appendChild(slot);
    });
    
    // Populate NFT items
    const nftItems = player.inventory.filter(item => item.isNFT);
    nftItems.forEach(item => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot nft-item';
      slot.innerHTML = `
        <img src="data:image/png;base64,${item.iconBase64}" alt="${item.name}">
        <span class="item-name">${item.name}</span>
        <span class="nft-badge">NFT</span>
      `;
      this.nftSlots?.appendChild(slot);
    });
  }
  
  public toggleInventory(show?: boolean): void {
    if (this.inventoryPanel) {
      if (show !== undefined) {
        this.inventoryPanel.classList.toggle('hidden', !show);
      } else {
        this.inventoryPanel.classList.toggle('hidden');
      }
    }
  }
  
  public toggleChat(show?: boolean): void {
    if (this.chatPanel) {
      if (show !== undefined) {
        this.chatPanel.classList.toggle('hidden', !show);
      } else {
        this.chatPanel.classList.toggle('hidden');
      }
    }
  }
  
  public addChatMessage(message: { playerName: string, content: string, timestamp: number }): void {
    if (!this.chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
      <span class="chat-timestamp">${this.formatTimestamp(message.timestamp)}</span>
      <span class="chat-player">${message.playerName}:</span>
      <span class="chat-content">${message.content}</span>
    `;
    
    this.chatMessages.appendChild(messageElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  public addSystemMessage(content: string): void {
    if (!this.chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.innerHTML = `
      <span class="chat-timestamp">${this.formatTimestamp(Date.now())}</span>
      <span class="system-content">${content}</span>
    `;
    
    this.chatMessages.appendChild(messageElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  public showError(message: string): void {
    // Simple error display
    alert(message);
  }
  
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}