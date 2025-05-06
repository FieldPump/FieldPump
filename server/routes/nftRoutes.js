// FieldPump NFT Routes

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Player = require('../models/Player');
const Item = require('../models/Item');

// 获取玩家的NFT资产
router.get('/player/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // 查找玩家
    const player = await Player.findOne({ walletAddress }).populate('inventory');
    
    if (!player) {
      return res.status(404).json({ message: '玩家未找到' });
    }
    
    // 过滤出NFT类型的物品
    const nftItems = player.inventory.filter(item => item.isNFT);
    
    res.json({
      success: true,
      nfts: nftItems
    });
  } catch (error) {
    console.error('获取NFT资产失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 装备NFT物品
router.post('/equip', auth, async (req, res) => {
  try {
    const { nftId, slotType } = req.body;
    const playerId = req.player.id;
    
    // 查找玩家
    const player = await Player.findById(playerId).populate('inventory');
    
    if (!player) {
      return res.status(404).json({ message: '玩家未找到' });
    }
    
    // 查找NFT物品
    const nftItem = player.inventory.find(item => item._id.toString() === nftId && item.isNFT);
    
    if (!nftItem) {
      return res.status(404).json({ message: 'NFT物品未找到或不属于该玩家' });
    }
    
    // 检查物品类型是否匹配槽位
    if (nftItem.type !== slotType) {
      return res.status(400).json({ message: '物品类型与槽位不匹配' });
    }
    
    // 更新玩家装备
    player.equipment = player.equipment || {};
    player.equipment[slotType] = nftId;
    
    // 更新玩家属性
    if (nftItem.stats) {
      // 应用物品属性加成
      Object.keys(nftItem.stats).forEach(statKey => {
        if (player.stats[statKey] !== undefined) {
          player.stats[statKey] += nftItem.stats[statKey];
        }
      });
    }
    
    await player.save();
    
    res.json({
      success: true,
      message: 'NFT物品已装备',
      player: player
    });
  } catch (error) {
    console.error('装备NFT物品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 卸下NFT物品
router.post('/unequip', auth, async (req, res) => {
  try {
    const { slotType } = req.body;
    const playerId = req.player.id;
    
    // 查找玩家
    const player = await Player.findById(playerId).populate('inventory');
    
    if (!player) {
      return res.status(404).json({ message: '玩家未找到' });
    }
    
    // 检查槽位是否有装备
    if (!player.equipment || !player.equipment[slotType]) {
      return res.status(400).json({ message: '该槽位没有装备物品' });
    }
    
    // 查找装备的NFT物品
    const nftId = player.equipment[slotType];
    const nftItem = player.inventory.find(item => item._id.toString() === nftId);
    
    if (!nftItem) {
      // 如果找不到物品，仍然移除装备引用
      delete player.equipment[slotType];
      await player.save();
      
      return res.json({
        success: true,
        message: '装备引用已移除',
        player: player
      });
    }
    
    // 移除物品属性加成
    if (nftItem.stats) {
      Object.keys(nftItem.stats).forEach(statKey => {
        if (player.stats[statKey] !== undefined) {
          player.stats[statKey] -= nftItem.stats[statKey];
        }
      });
    }
    
    // 移除装备引用
    delete player.equipment[slotType];
    await player.save();
    
    res.json({
      success: true,
      message: 'NFT物品已卸下',
      player: player
    });
  } catch (error) {
    console.error('卸下NFT物品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传NFT元数据到IPFS
router.post('/metadata', auth, async (req, res) => {
  try {
    const { metadata } = req.body;
    
    // 这里应该实现IPFS上传逻辑
    // 为了演示，我们简单返回一个模拟的IPFS URI
    const ipfsHash = `ipfs://QmHash${Date.now()}`;
    
    res.json({
      success: true,
      metadataUri: ipfsHash
    });
  } catch (error) {
    console.error('上传NFT元数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新的NFT物品
router.post('/create', auth, async (req, res) => {
  try {
    const { tokenId, contractAddress, type, name, description, imageUrl, attributes } = req.body;
    const playerId = req.player.id;
    
    // 创建新的NFT物品
    const newNFT = new Item({
      tokenId,
      contractAddress,
      type,
      name,
      description,
      imageUrl,
      attributes,
      isNFT: true,
      owner: playerId
    });
    
    await newNFT.save();
    
    // 将NFT添加到玩家库存
    const player = await Player.findById(playerId);
    player.inventory.push(newNFT._id);
    await player.save();
    
    res.status(201).json({
      success: true,
      nft: newNFT,
      message: 'NFT物品已创建并添加到玩家库存'
    });
  } catch (error) {
    console.error('创建NFT物品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;