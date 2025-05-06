// FieldPump 游戏状态同步路由

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Player = require('../models/Player');

// 获取当前地图的所有玩家
router.get('/map/:mapId/players', auth, async (req, res) => {
  try {
    const { mapId } = req.params;
    
    // 查找在同一地图的所有玩家
    const players = await Player.find({
      'location.mapId': mapId,
      lastActivity: { $gte: Date.now() - 5 * 60 * 1000 } // 5分钟内活跃的玩家
    }).select('-password');
    
    res.json({
      success: true,
      players
    });
  } catch (error) {
    console.error('获取地图玩家失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新玩家位置
router.post('/position', auth, async (req, res) => {
  try {
    const { x, y, mapId } = req.body;
    const playerId = req.player.id;
    
    // 验证位置数据
    if (typeof x !== 'number' || typeof y !== 'number' || !mapId) {
      return res.status(400).json({ message: '无效的位置数据' });
    }
    
    // 更新玩家位置
    await Player.findByIdAndUpdate(playerId, {
      'location.x': x,
      'location.y': y,
      'location.mapId': mapId,
      lastActivity: Date.now()
    });
    
    res.json({
      success: true,
      message: '位置已更新'
    });
  } catch (error) {
    console.error('更新玩家位置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取地图数据
router.get('/map/:mapId', auth, async (req, res) => {
  try {
    const { mapId } = req.params;
    
    // 在实际应用中，这里应该从数据库加载地图数据
    // 为了演示，我们返回一个简单的地图结构
    const mapData = {
      id: mapId,
      name: `Map ${mapId}`,
      width: 50,
      height: 50,
      tiles: Array(50 * 50).fill('grass'), // 简化的地图瓦片
      obstacles: [
        { x: 10, y: 10, type: 'tree' },
        { x: 15, y: 15, type: 'rock' },
        { x: 20, y: 20, type: 'tree' }
      ],
      npcs: [
        {
          id: 'npc1',
          name: '村长',
          x: 25,
          y: 25,
          spriteId: 'npc_elder',
          dialogues: ['欢迎来到FieldPump世界!', '探索这片土地，发现隐藏的宝藏。'],
          isQuestGiver: true
        }
      ],
      portals: [
        {
          x: 45,
          y: 45,
          targetMapId: 'dungeon1',
          targetX: 5,
          targetY: 5
        }
      ]
    };
    
    res.json({
      success: true,
      mapData
    });
  } catch (error) {
    console.error('获取地图数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 保存游戏状态
router.post('/save', auth, async (req, res) => {
  try {
    const { stats, inventory, quests, achievements } = req.body;
    const playerId = req.player.id;
    
    // 更新玩家数据
    const updateData = {};
    
    if (stats) updateData.stats = stats;
    if (inventory) updateData.inventory = inventory;
    if (quests) updateData.quests = quests;
    if (achievements) updateData.achievements = achievements;
    
    // 添加最后保存时间
    updateData.lastSaved = Date.now();
    
    await Player.findByIdAndUpdate(playerId, updateData);
    
    res.json({
      success: true,
      message: '游戏状态已保存'
    });
  } catch (error) {
    console.error('保存游戏状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取玩家进度
router.get('/progress', auth, async (req, res) => {
  try {
    const playerId = req.player.id;
    
    // 获取玩家完整数据
    const player = await Player.findById(playerId).select('-password');
    
    if (!player) {
      return res.status(404).json({ message: '玩家未找到' });
    }
    
    res.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('获取玩家进度失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;