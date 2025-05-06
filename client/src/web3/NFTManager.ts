// FieldPump NFT Manager

import { ethers } from 'ethers';
import { Web3Manager } from './Web3Manager';
import { ApiService } from '../services/ApiService';

// NFT类型定义
export interface NFTAsset {
  id: string;
  tokenId: string;
  contractAddress: string;
  type: 'weapon' | 'armor' | 'skin' | 'land' | 'badge';
  name: string;
  description: string;
  imageUrl: string;
  attributes: Record<string, any>;
  owner: string;
}

// NFT合约ABI（简化版）
const NFT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved)'
];

// 市场合约ABI（简化版）
const MARKETPLACE_ABI = [
  'function listItem(address nftContract, uint256 tokenId, uint256 price)',
  'function cancelListing(address nftContract, uint256 tokenId)',
  'function buyItem(address nftContract, uint256 tokenId)',
  'function getListingPrice(address nftContract, uint256 tokenId) view returns (uint256)',
  'function isListed(address nftContract, uint256 tokenId) view returns (bool)'
];

export class NFTManager {
  private nftContracts: Map<string, ethers.Contract> = new Map();
  private marketplaceContract: ethers.Contract | null = null;
  private playerNFTs: NFTAsset[] = [];
  
  constructor(
    private web3Manager: Web3Manager,
    private apiService: ApiService
  ) {}
  
  public async initialize(marketplaceAddress: string): Promise<void> {
    if (!this.web3Manager.isConnected()) {
      console.error('Wallet not connected');
      return;
    }
    
    try {
      // 初始化市场合约
      const provider = this.web3Manager.getProvider();
      const signer = this.web3Manager.getSigner();
      
      if (provider && signer) {
        this.marketplaceContract = new ethers.Contract(
          marketplaceAddress,
          MARKETPLACE_ABI,
          signer
        );
        
        // 加载玩家拥有的NFT
        await this.loadPlayerNFTs();
      }
    } catch (error) {
      console.error('Failed to initialize NFT Manager:', error);
    }
  }
  
  public async loadPlayerNFTs(): Promise<NFTAsset[]> {
    if (!this.web3Manager.isConnected()) {
      return [];
    }
    
    try {
      const address = this.web3Manager.getAddress();
      
      // 从API获取玩家的NFT资产
      const nfts = await this.apiService.getPlayerNFTs(address);
      this.playerNFTs = nfts;
      
      return nfts;
    } catch (error) {
      console.error('Failed to load player NFTs:', error);
      return [];
    }
  }
  
  public async equipNFT(nftId: string, slotType: string): Promise<boolean> {
    try {
      const result = await this.apiService.equipNFT(nftId, slotType);
      return result;
    } catch (error) {
      console.error('Failed to equip NFT:', error);
      return false;
    }
  }
  
  public async unequipNFT(slotType: string): Promise<boolean> {
    try {
      const result = await this.apiService.unequipNFT(slotType);
      return result;
    } catch (error) {
      console.error('Failed to unequip NFT:', error);
      return false;
    }
  }
  
  public async mintNFT(contractAddress: string, metadata: any): Promise<string | null> {
    if (!this.web3Manager.isConnected()) {
      console.error('Wallet not connected');
      return null;
    }
    
    try {
      // 获取合约实例
      let nftContract = this.nftContracts.get(contractAddress);
      
      if (!nftContract) {
        const signer = this.web3Manager.getSigner();
        if (!signer) return null;
        
        nftContract = new ethers.Contract(contractAddress, NFT_ABI, signer);
        this.nftContracts.set(contractAddress, nftContract);
      }
      
      // 调用API上传元数据到IPFS
      const metadataUri = await this.apiService.uploadNFTMetadata(metadata);
      
      // 调用合约铸造NFT
      // 注意：这里假设合约有一个mint函数，实际合约可能不同
      const tx = await nftContract.mint(this.web3Manager.getAddress(), metadataUri);
      const receipt = await tx.wait();
      
      // 解析事件获取tokenId
      // 这里简化处理，实际应该解析Transfer事件
      const tokenId = '1'; // 示例值，实际应从事件中获取
      
      return tokenId;
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      return null;
    }
  }
  
  public async listNFTForSale(nftId: string, price: string): Promise<boolean> {
    if (!this.marketplaceContract || !this.web3Manager.isConnected()) {
      return false;
    }
    
    try {
      const nft = this.playerNFTs.find(n => n.id === nftId);
      if (!nft) return false;
      
      // 获取NFT合约
      let nftContract = this.nftContracts.get(nft.contractAddress);
      
      if (!nftContract) {
        const signer = this.web3Manager.getSigner();
        if (!signer) return false;
        
        nftContract = new ethers.Contract(nft.contractAddress, NFT_ABI, signer);
        this.nftContracts.set(nft.contractAddress, nftContract);
      }
      
      // 检查是否已授权市场合约
      const isApproved = await nftContract.isApprovedForAll(
        this.web3Manager.getAddress(),
        this.marketplaceContract.target
      );
      
      if (!isApproved) {
        // 授权市场合约操作NFT
        const approveTx = await nftContract.setApprovalForAll(
          this.marketplaceContract.target,
          true
        );
        await approveTx.wait();
      }
      
      // 上架NFT
      const priceInWei = ethers.parseEther(price);
      const listTx = await this.marketplaceContract.listItem(
        nft.contractAddress,
        nft.tokenId,
        priceInWei
      );
      await listTx.wait();
      
      return true;
    } catch (error) {
      console.error('Failed to list NFT for sale:', error);
      return false;
    }
  }
  
  public async buyNFT(contractAddress: string, tokenId: string, price: string): Promise<boolean> {
    if (!this.marketplaceContract || !this.web3Manager.isConnected()) {
      return false;
    }
    
    try {
      // 检查NFT是否在售
      const isListed = await this.marketplaceContract.isListed(contractAddress, tokenId);
      if (!isListed) return false;
      
      // 获取价格并确认
      const listingPrice = await this.marketplaceContract.getListingPrice(contractAddress, tokenId);
      const priceInWei = ethers.parseEther(price);
      
      if (listingPrice.toString() !== priceInWei.toString()) {
        console.error('Price mismatch');
        return false;
      }
      
      // 购买NFT
      const buyTx = await this.marketplaceContract.buyItem(contractAddress, tokenId, {
        value: priceInWei
      });
      await buyTx.wait();
      
      // 刷新玩家NFT列表
      await this.loadPlayerNFTs();
      
      return true;
    } catch (error) {
      console.error('Failed to buy NFT:', error);
      return false;
    }
  }
  
  public getNFTsByType(type: string): NFTAsset[] {
    return this.playerNFTs.filter(nft => nft.type === type);
  }
  
  public getAllNFTs(): NFTAsset[] {
    return [...this.playerNFTs];
  }
}