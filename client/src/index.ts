// FieldPump Game Entry Point

import { GameEngine } from './game/GameEngine';
import { UIManager } from './components/UIManager';
import { Web3Manager } from './web3/Web3Manager';
import { ApiService } from './services/ApiService';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create main game instances
  const apiService = new ApiService();
  const web3Manager = new Web3Manager();
  const uiManager = new UIManager(web3Manager, apiService);
  const gameEngine = new GameEngine(uiManager, web3Manager, apiService);
  
  // Initialize UI event listeners
  uiManager.initializeUI();
  
  // Handle login methods
  document.getElementById('traditional-login')?.addEventListener('click', () => {
    const loginPanel = document.getElementById('login-form');
    if (loginPanel) loginPanel.classList.remove('hidden');
    document.querySelector('.login-options')?.classList.add('hidden');
  });
  
  document.getElementById('wallet-login')?.addEventListener('click', async () => {
    try {
      await web3Manager.connectWallet();
      if (web3Manager.isConnected()) {
        // Get player data or create new player if first time
        const address = web3Manager.getAddress();
        const playerData = await apiService.getPlayerByWallet(address);
        
        if (playerData) {
          gameEngine.initializePlayer(playerData);
          uiManager.showGameUI();
        } else {
          // Redirect to character creation
          uiManager.showCharacterCreation(address);
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      uiManager.showError('Failed to connect wallet. Please try again.');
    }
  });
  
  document.getElementById('login-submit')?.addEventListener('click', async () => {
    const username = (document.getElementById('username') as HTMLInputElement)?.value;
    const password = (document.getElementById('password') as HTMLInputElement)?.value;
    
    if (!username || !password) {
      uiManager.showError('Please enter both username and password');
      return;
    }
    
    try {
      const playerData = await apiService.login(username, password);
      if (playerData) {
        gameEngine.initializePlayer(playerData);
        uiManager.showGameUI();
      }
    } catch (error) {
      console.error('Login failed:', error);
      uiManager.showError('Invalid username or password');
    }
  });
  
  // Handle inventory and chat UI
  document.getElementById('inventory-button')?.addEventListener('click', () => {
    uiManager.toggleInventory();
  });
  
  document.getElementById('chat-button')?.addEventListener('click', () => {
    uiManager.toggleChat();
  });
  
  document.getElementById('close-inventory')?.addEventListener('click', () => {
    uiManager.toggleInventory(false);
  });
  
  document.getElementById('close-chat')?.addEventListener('click', () => {
    uiManager.toggleChat(false);
  });
  
  document.getElementById('send-message')?.addEventListener('click', () => {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput && chatInput.value.trim()) {
      gameEngine.sendChatMessage(chatInput.value.trim());
      chatInput.value = '';
    }
  });
  
  // Start the game loop
  gameEngine.start();
});