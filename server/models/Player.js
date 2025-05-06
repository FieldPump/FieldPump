// FieldPump Player Model

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String
  },
  walletAddress: {
    type: String,
    sparse: true,
    trim: true
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  characterClass: {
    type: String,
    enum: ['warrior', 'mage', 'archer'],
    required: true
  },
  stats: {
    maxHealth: { type: Number, default: 100 },
    currentHealth: { type: Number, default: 100 },
    attack: { type: Number, default: 10 },
    defense: { type: Number, default: 5 },
    speed: { type: Number, default: 5 }
  },
  location: {
    x: { type: Number, default: 25 },
    y: { type: Number, default: 25 },
    mapId: { type: String, default: 'starter' }
  },
  appearance: {
    spriteId: { type: String, default: 'default' },
    customizations: { type: Map, of: String }
  },
  inventory: [
    {
      id: String,
      name: String,
      description: String,
      type: {
        type: String,
        enum: ['weapon', 'armor', 'consumable', 'quest', 'cosmetic']
      },
      rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
      },
      stats: {
        damage: Number,
        defense: Number,
        health: Number,
        mana: Number
      },
      iconBase64: String,
      isNFT: { type: Boolean, default: false },
      tokenId: String,
      contractAddress: String
    }
  ],
  skills: [
    {
      id: String,
      name: String,
      level: { type: Number, default: 1 }
    }
  ],
  quests: [
    {
      id: String,
      status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
      },
      progress: { type: Number, default: 0 }
    }
  ],
  achievements: [
    {
      id: String,
      unlockedAt: { type: Number }
    }
  ],
  lastLogin: { type: Number, default: Date.now },
  createdAt: { type: Number, default: Date.now }
});

module.exports = mongoose.model('Player', playerSchema);