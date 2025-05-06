// FieldPump Web3 Integration Manager

import { ethers } from 'ethers';

export class Web3Manager {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private address: string = '';
  private chainId: number = 0;
  private isWeb3Connected: boolean = false;
  
  constructor() {
    this.checkConnection();
  }
  
  private async checkConnection(): Promise<void> {
    // Check if MetaMask is installed
    if (window.ethereum) {
      try {
        // Create ethers provider
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check if already connected
        const accounts = await this.provider.listAccounts();
        if (accounts.length > 0) {
          this.signer = await this.provider.getSigner();
          this.address = await this.signer.getAddress();
          this.chainId = (await this.provider.getNetwork()).chainId;
          this.isWeb3Connected = true;
          
          console.log('Already connected to wallet:', this.address);
        }
      } catch (error) {
        console.error('Error checking Web3 connection:', error);
      }
    }
  }
  
  public async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to use Web3 features.');
    }
    
    try {
      // Create ethers provider if not already created
      if (!this.provider) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      }
      
      // Request account access
      const accounts = await this.provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }
      
      // Get signer and address
      this.signer = await this.provider.getSigner();
      this.address = await this.signer.getAddress();
      this.chainId = (await this.provider.getNetwork()).chainId;
      this.isWeb3Connected = true;
      
      console.log('Connected to wallet:', this.address);
      
      // Set up event listeners for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          this.disconnectWallet();
        } else {
          // User switched accounts
          this.address = accounts[0];
          console.log('Account changed:', this.address);
          // Trigger account change event
          window.dispatchEvent(new CustomEvent('walletAccountChanged', { detail: this.address }));
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        // Handle chain change (reload page is recommended by MetaMask)
        window.location.reload();
      });
      
      return this.address;
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }
  
  public disconnectWallet(): void {
    this.signer = null;
    this.address = '';
    this.isWeb3Connected = false;
    console.log('Disconnected from wallet');
    
    // Trigger disconnect event
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }
  
  public isConnected(): boolean {
    return this.isWeb3Connected;
  }
  
  public getAddress(): string {
    return this.address;
  }
  
  public getChainId(): number {
    return this.chainId;
  }
  
  public async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }
  
  public async getNFTs(): Promise<any[]> {
    if (!this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    // In a real implementation, this would query the blockchain for NFTs
    // For this demo, we'll return mock data
    return [
      {
        tokenId: '1',
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'Pixel Sword',
        description: 'A legendary pixel sword',
        image: 'https://example.com/sword.png'
      },
      {
        tokenId: '2',
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'Magic Staff',
        description: 'A powerful magic staff',
        image: 'https://example.com/staff.png'
      }
    ];
  }
  
  // Add additional Web3 functionality as needed
}

// Add TypeScript interface for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}