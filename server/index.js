// FieldPump Game Server

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fieldpump')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const nftRoutes = require('./routes/nftRoutes');
const gameStateRoutes = require('./routes/gameStateRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/game', gameStateRoutes);

// Load models
const Player = require('./models/Player');
const Item = require('./models/Item');

// API Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find player by username
    const player = await Player.findOne({ name: username });
    if (!player) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, player.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ playerId: player._id }, process.env.JWT_SECRET || 'fieldpump_secret', {
      expiresIn: '7d'
    });
    
    // Update last login
    player.lastLogin = Date.now();
    await player.save();
    
    res.json({ token, player });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if username already exists
    const existingPlayer = await Player.findOne({ name: username });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new player
    const player = new Player({
      name: username,
      email,
      passwordHash,
      level: 1,
      experience: 0,
      characterClass: 'warrior',
      stats: {
        maxHealth: 100,
        currentHealth: 100,
        attack: 10,
        defense: 5,
        speed: 5
      },
      location: {
        x: 25,
        y: 25,
        mapId: 'starter'
      },
      appearance: {
        spriteId: 'default'
      },
      inventory: [],
      skills: [],
      quests: [],
      achievements: [],
      lastLogin: Date.now(),
      createdAt: Date.now()
    });
    
    await player.save();
    
    // Generate JWT token
    const token = jwt.sign({ playerId: player._id }, process.env.JWT_SECRET || 'fieldpump_secret', {
      expiresIn: '7d'
    });
    
    res.status(201).json({ token, player });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Player routes
app.get('/api/players/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Find player by wallet address
    const player = await Player.findOne({ walletAddress: address });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ player });
  } catch (error) {
    console.error('Get player by wallet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/players/create', async (req, res) => {
  try {
    const { name, characterClass, walletAddress } = req.body;
    
    // Check if name already exists
    const existingPlayer = await Player.findOne({ name });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Character name already taken' });
    }
    
    // Create new player
    const player = new Player({
      name,
      walletAddress,
      level: 1,
      experience: 0,
      characterClass,
      stats: {
        maxHealth: characterClass === 'warrior' ? 120 : 100,
        currentHealth: characterClass === 'warrior' ? 120 : 100,
        attack: characterClass === 'warrior' ? 15 : (characterClass === 'archer' ? 12 : 8),
        defense: characterClass === 'warrior' ? 10 : 5,
        speed: characterClass === 'archer' ? 12 : 8
      },
      location: {
        x: 25,
        y: 25,
        mapId: 'starter'
      },
      appearance: {
        spriteId: characterClass
      },
      inventory: [],
      skills: [],
      quests: [],
      achievements: [],
      lastLogin: Date.now(),
      createdAt: Date.now()
    });
    
    await player.save();
    
    // Generate JWT token
    const token = jwt.sign({ playerId: player._id }, process.env.JWT_SECRET || 'fieldpump_secret', {
      expiresIn: '7d'
    });
    
    res.status(201).json({ token, player });
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fieldpump_secret');
    
    const player = await Player.findById(decoded.playerId);
    if (!player) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.player = player;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Protected routes
app.get('/api/players/me', authenticate, (req, res) => {
  res.json({ player: req.player });
});

app.post('/api/players/position', authenticate, async (req, res) => {
  try {
    const { x, y, mapId } = req.body;
    
    // Update player position
    req.player.location.x = x;
    req.player.location.y = y;
    req.player.location.mapId = mapId;
    
    await req.player.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/players/nearby/:mapId', authenticate, async (req, res) => {
  try {
    const { mapId } = req.params;
    
    // Find players in the same map
    const players = await Player.find({
      'location.mapId': mapId,
      _id: { $ne: req.player._id } // Exclude current player
    });
    
    res.json({ players });
  } catch (error) {
    console.error('Get nearby players error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/players/inventory', authenticate, async (req, res) => {
  try {
    // Get player inventory
    const items = req.player.inventory;
    
    res.json({ items });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// NFT routes
app.get('/api/nft/items', authenticate, async (req, res) => {
  try {
    // In a real implementation, this would query the blockchain
    // For this demo, we'll return mock NFT items
    const nftItems = [
      {
        id: 'nft1',
        name: 'Pixel Sword',
        description: 'A legendary pixel sword',
        type: 'weapon',
        rarity: 'legendary',
        stats: {
          damage: 50
        },
        iconBase64: '', // Would contain actual image data
        isNFT: true,
        tokenId: '1',
        contractAddress: '0x1234567890123456789012345678901234567890'
      },
      {
        id: 'nft2',
        name: 'Magic Staff',
        description: 'A powerful magic staff',
        type: 'weapon',
        rarity: 'epic',
        stats: {
          damage: 40,
          mana: 30
        },
        iconBase64: '', // Would contain actual image data
        isNFT: true,
        tokenId: '2',
        contractAddress: '0x1234567890123456789012345678901234567890'
      }
    ];
    
    res.json({ items: nftItems });
  } catch (error) {
    console.error('Get NFT items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Map routes
app.get('/api/maps/:mapId', async (req, res) => {
  try {
    const { mapId } = req.params;
    
    // In a real implementation, this would load from a database
    // For this demo, we'll return a simple procedural map
    const width = 50;
    const height = 50;
    const tiles = [];
    const obstacles = [];
    
    // Generate base terrain
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Default to grass
        let tileType = 'grass';
        
        // Add some variety with different tile types
        const random = Math.random();
        if (random < 0.05) {
          tileType = 'water';
        } else if (random < 0.1) {
          tileType = 'sand';
        } else if (random < 0.15) {
          tileType = 'stone';
        }
        
        tiles.push(tileType);
        
        // Add some obstacles (trees, rocks)
        if (random < 0.03) {
          obstacles.push({
            x,
            y,
            type: random < 0.015 ? 'tree' : 'rock'
          });
        }
      }
    }
    
    // Add a path through the center
    for (let x = 10; x < width - 10; x++) {
      const y = Math.floor(height / 2) + Math.sin(x * 0.2) * 3;
      const index = y * width + x;
      tiles[index] = 'path';
      
      // Remove any obstacles on the path
      const obstacleIndex = obstacles.findIndex(o => o.x === x && o.y === y);
      if (obstacleIndex !== -1) {
        obstacles.splice(obstacleIndex, 1);
      }
    }
    
    const mapData = {
      id: mapId,
      name: `Field ${mapId}`,
      width,
      height,
      tiles,
      obstacles,
      npcs: [],
      portals: []
    };
    
    res.json(mapData);
  } catch (error) {
    console.error('Get map error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// WebSocket server for real-time game updates
const { WebSocketServer } = require('uWebSockets.js');
const wss = new WebSocketServer();

// Store connected clients
const clients = new Map();

// WebSocket server handling
wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  clients.set(clientId, ws);
  
  console.log(`Client connected: ${clientId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      switch (data.type) {
        case 'init':
          // Player initialization
          console.log(`Player initialized: ${data.player.name}`);
          ws.playerId = data.player.id;
          ws.playerName = data.player.name;
          ws.mapId = data.player.location.mapId;
          
          // Broadcast player joined to others in same map
          broadcastToMap(ws.mapId, {
            type: 'player_joined',
            player: data.player
          }, ws);
          break;
          
        case 'position':
          // Player position update
          if (ws.mapId !== data.location.mapId) {
            // Player changed maps
            const oldMapId = ws.mapId;
            ws.mapId = data.location.mapId;
            
            // Notify players in old map that player left
            broadcastToMap(oldMapId, {
              type: 'player_left',
              playerId: ws.playerId,
              playerName: ws.playerName
            }, ws);
          }
          
          // Broadcast position to other players in same map
          broadcastToMap(ws.mapId, {
            type: 'position',
            playerId: ws.playerId,
            location: data.location
          }, ws);
          break;
          
        case 'chat':
          // Chat message
          broadcastToMap(ws.mapId, {
            type: 'chat',
            playerId: ws.playerId,
            playerName: ws.playerName,
            content: data.content,
            timestamp: Date.now()
          });
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    
    // Notify other players if this was a player
    if (ws.playerId && ws.mapId) {
      broadcastToMap(ws.mapId, {
        type: 'player_left',
        playerId: ws.playerId,
        playerName: ws.playerName
      });
    }
    
    clients.delete(clientId);
  });
});

// Broadcast message to all clients in a specific map
function broadcastToMap(mapId, message, excludeWs = null) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client !== excludeWs && client.mapId === mapId && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

// Start WebSocket server
wss.listen(PORT + 1, () => {
  console.log(`WebSocket Server running on port ${PORT + 1}`);
});

// WebSocket server for real-time game communication
const wsApp = App();
const players = new Map();

wsApp.ws('/ws', {
  compression: 0,
  maxPayloadLength: 16 * 1024, // 16KB
  idleTimeout: 60,
  
  open: (ws) => {
    console.log('WebSocket connection opened');
    ws.id = Math.random().toString(36).substring(2, 15);
    ws.subscribe('global');
  },
  
  message: (ws, message, isBinary) => {
    try {
      const messageStr = Buffer.from(message).toString();
      const data = JSON.parse(messageStr);
      
      switch (data.type) {
        case 'init':
          // Store player data
          players.set(ws.id, {
            ...data.player,
            wsId: ws.id
          });
          
          // Subscribe to map channel
          ws.subscribe(`map:${data.player.location.mapId}`);
          
          // Send current players to new player
          const currentPlayers = Array.from(players.values());
          ws.send(JSON.stringify({
            type: 'players',
            players: currentPlayers
          }));
          
          // Notify others of new player
          wsApp.publish(`map:${data.player.location.mapId}`, JSON.stringify({
            type: 'player_joined',
            player: data.player
          }), ws);
          break;
          
        case 'position':
          // Update player position
          const player = players.get(ws.id);
          if (player) {
            // Check if player changed maps
            if (player.location.mapId !== data.location.mapId) {
              ws.unsubscribe(`map:${player.location.mapId}`);
              ws.subscribe(`map:${data.location.mapId}`);
            }
            
            player.location = data.location;
            
            // Broadcast position update to players in the same map
            wsApp.publish(`map:${data.location.mapId}`, JSON.stringify({
              type: 'position',
              playerId: data.playerId,
              location: data.location
            }), ws);
          }
          break;
          
        case 'chat':
          // Broadcast chat message
          if (data.content.startsWith('/global ')) {
            // Global chat
            wsApp.publish('global', JSON.stringify({
              type: 'chat',
              playerId: data.playerId,
              playerName: data.playerName,
              content: data.content.substring(8),
              timestamp: data.timestamp
            }));
          } else {
            // Map chat
            const chatPlayer = players.get(ws.id);
            if (chatPlayer) {
              wsApp.publish(`map:${chatPlayer.location.mapId}`, JSON.stringify({
                type: 'chat',
                playerId: data.playerId,
                playerName: data.playerName,
                content: data.content,
                timestamp: data.timestamp
              }));
            }
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  },
  
  close: (ws) => {
    console.log('WebSocket connection closed');
    
    // Get player data before removing
    const player = players.get(ws.id);
    
    // Remove player
    players.delete(ws.id);
    
    // Notify others that player left
    if (player) {
      wsApp.publish(`map:${player.location.mapId}`, JSON.stringify({
        type: 'player_left',
        playerId: player.id,
        playerName: player.name
      }));
    }
  }
});

// Start WebSocket server
wsApp.listen(9000, (listenSocket) => {
  if (listenSocket) {
    console.log('WebSocket server running on port 9000');
  } else {
    console.error('WebSocket server failed to start');
  }
});

console.log('FieldPump server started');