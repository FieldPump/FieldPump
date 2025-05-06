// FieldPump Item Model

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['weapon', 'armor', 'consumable', 'quest', 'cosmetic'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  stats: {
    damage: Number,
    defense: Number,
    health: Number,
    mana: Number
  },
  iconBase64: String,
  isNFT: {
    type: Boolean,
    default: false
  },
  tokenId: String,
  contractAddress: String,
  createdAt: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', itemSchema);