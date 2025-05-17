const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// File paths for storing data
const dataDir = path.join(__dirname, 'data');
const roomsFilePath = path.join(dataDir, 'rooms.json');
const guestsFilePath = path.join(dataDir, 'guests.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default data if files don't exist
const defaultData = {
  rooms: [
    {
      id: '1',
      room_number: '101',
      room_type: 'standard',
      status: 'free',
      price_per_night: 100.00,
      max_guests: 2,
      door_locked: true,
      current_guests_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sensors: {
        temperature: 22.5,
        humidity: 45,
        pressure: 1013,
        lights: {
          bathroom: false,
          bedroom: false,
          hallway: false
        }
      },
      guests: []
    },
    {
      id: '2',
      room_number: '102',
      room_type: 'standard',
      status: 'free',
      price_per_night: 100.00,
      max_guests: 2,
      door_locked: true,
      current_guests_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sensors: {
        temperature: 23.0,
        humidity: 46,
        pressure: 1013,
        lights: {
          bathroom: false,
          bedroom: false,
          hallway: false
        }
      },
      guests: []
    },
    {
      id: '3',
      room_number: '103',
      room_type: 'standard',
      status: 'occupied',
      price_per_night: 100.00,
      max_guests: 2,
      door_locked: false,
      current_guests_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sensors: {
        temperature: 23.5,
        humidity: 47,
        pressure: 1013,
        lights: {
          bathroom: true,
          bedroom: true,
          hallway: false
        }
      },
      guests: [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      ]
    },
    {
      id: '4',
      room_number: '104',
      room_type: 'deluxe',
      status: 'free',
      price_per_night: 200.00,
      max_guests: 3,
      door_locked: true,
      current_guests_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sensors: {
        temperature: 24.0,
        humidity: 48,
        pressure: 1013,
        lights: {
          bathroom: false,
          bedroom: false,
          hallway: false
        }
      },
      guests: []
    },
    {
      id: '5',
      room_number: '105',
      room_type: 'suite',
      status: 'occupied',
      price_per_night: 300.00,
      max_guests: 4,
      door_locked: false,
      current_guests_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sensors: {
        temperature: 24.5,
        humidity: 49,
        pressure: 1013,
        lights: {
          bathroom: true,
          bedroom: false,
          hallway: true
        }
      },
      guests: [
        {
          id: '3',
          first_name: 'Bob',
          last_name: 'Johnson'
        },
        {
          id: '4',
          first_name: 'Alice',
          last_name: 'Williams'
        }
      ]
    }
  ],
  guests: [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      room_id: '3',
      check_in_date: new Date(Date.now() - 2*24*60*60*1000).toISOString(), // 2 days ago
      check_out_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
      room_id: '3',
      check_in_date: new Date(Date.now() - 2*24*60*60*1000).toISOString(), // 2 days ago
      check_out_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1122334455',
      room_id: '5',
      check_in_date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), // 1 day ago
      check_out_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      first_name: 'Alice',
      last_name: 'Williams',
      email: 'alice.williams@example.com',
      phone: '+2233445566',
      room_id: '5',
      check_in_date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), // 1 day ago
      check_out_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      first_name: 'Charlie',
      last_name: 'Brown',
      email: 'charlie.brown@example.com',
      phone: '+3344556677',
      room_id: null,
      check_in_date: new Date(Date.now() - 5*24*60*60*1000).toISOString(), // 5 days ago
      check_out_date: new Date(Date.now() - 3*24*60*60*1000).toISOString(), // 3 days ago (checked out)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// In-memory data store
let store = {
  rooms: [],
  guests: []
};

// Load data from files if they exist
function loadDataFromFiles() {
  try {
    if (fs.existsSync(roomsFilePath)) {
      const roomsData = fs.readFileSync(roomsFilePath, 'utf8');
      store.rooms = JSON.parse(roomsData);
      console.log('Loaded rooms data from file');
    } else {
      // Use default data if file doesn't exist
      store.rooms = defaultData.rooms;
      console.log('Using default rooms data');
      // Save default data to file
      saveDataToFiles();
    }
    
    if (fs.existsSync(guestsFilePath)) {
      const guestsData = fs.readFileSync(guestsFilePath, 'utf8');
      store.guests = JSON.parse(guestsData);
      console.log('Loaded guests data from file');
    } else {
      // Use default data if file doesn't exist
      store.guests = defaultData.guests;
      console.log('Using default guests data');
      // Save default data to file
      saveDataToFiles();
    }
  } catch (error) {
    console.error('Error loading data from files:', error);
    // Use default data if there's an error
    store = { ...defaultData };
    // Try to save the default data
    saveDataToFiles();
  }
}

// Save data to files for persistence
function saveDataToFiles() {
  try {
    fs.writeFileSync(roomsFilePath, JSON.stringify(store.rooms, null, 2));
    fs.writeFileSync(guestsFilePath, JSON.stringify(store.guests, null, 2));
    console.log('Data saved to files');
  } catch (error) {
    console.error('Error saving data to files:', error);
  }
}

// HTTP routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hotel Management API is running (JSON storage)'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const clients = new Set();

// API handlers
const handlers = {
  // Room-related actions
  get_rooms: () => {
    console.log(`Sending ${store.rooms.length} rooms from JSON storage`);
    return {
      type: 'get_rooms',
      payload: store.rooms
    };
  },
  
  get_room: (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Room ID is required' }
      };
    }
    
    const room = store.rooms.find(r => r.id === payload.id);
    
    if (!room) {
      return {
        type: 'error',
        payload: { message: `Room with ID ${payload.id} not found` }
      };
    }
    
    return {
      type: 'get_room',
      payload: room
    };
  },
  
  add_room: (payload) => {
    // Validate required fields
    if (!payload.room_number || !payload.room_type || !payload.price_per_night) {
      return {
        type: 'error',
        payload: { message: 'Room number, type, and price are required' }
      };
    }
    
    // Check if room number already exists
    if (store.rooms.some(r => r.room_number === payload.room_number)) {
      return {
        type: 'error',
        payload: { message: `Room with number ${payload.room_number} already exists` }
      };
    }
    
    // Create new room
    const newRoom = {
      id: uuidv4(),
      room_number: payload.room_number,
      room_type: payload.room_type,
      status: payload.status || 'free',
      price_per_night: parseFloat(payload.price_per_night),
      max_guests: payload.max_guests || 2,
      door_locked: true,
      current_guests_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sensors: {
        temperature: 22.0,
        humidity: 50,
        pressure: 1013,
        lights: {
          bathroom: false,
          bedroom: false,
          hallway: false
        }
      },
      guests: []
    };
    
    // Add to store
    store.rooms.push(newRoom);
    
    // Save to file
    saveDataToFiles();
    
    return {
      type: 'add_room',
      payload: newRoom
    };
  },
  
  update_room: (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Room ID is required' }
      };
    }
    
    // Find room
    const roomIndex = store.rooms.findIndex(r => r.id === payload.id);
    
    if (roomIndex === -1) {
      return {
        type: 'error',
        payload: { message: `Room with ID ${payload.id} not found` }
      };
    }
    
    const room = store.rooms[roomIndex];
    
    // Update fields
    if (payload.status) {
      room.status = payload.status;
    }
    
    if (payload.door_locked !== undefined) {
      room.door_locked = payload.door_locked;
    }
    
    // Update sensors if provided
    if (payload.sensors) {
      if (payload.sensors.temperature !== undefined) {
        room.sensors.temperature = payload.sensors.temperature;
      }
      
      if (payload.sensors.humidity !== undefined) {
        room.sensors.humidity = payload.sensors.humidity;
      }
      
      if (payload.sensors.pressure !== undefined) {
        room.sensors.pressure = payload.sensors.pressure;
      }
      
      if (payload.sensors.lights) {
        if (payload.sensors.lights.bathroom !== undefined) {
          room.sensors.lights.bathroom = payload.sensors.lights.bathroom;
        }
        
        if (payload.sensors.lights.bedroom !== undefined) {
          room.sensors.lights.bedroom = payload.sensors.lights.bedroom;
        }
        
        if (payload.sensors.lights.hallway !== undefined) {
          room.sensors.lights.hallway = payload.sensors.lights.hallway;
        }
      }
    }
    
    room.updated_at = new Date().toISOString();
    
    // Save changes
    saveDataToFiles();
    
    return {
      type: 'update_room',
      payload: room
    };
  },
  
  delete_room: (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Room ID is required' }
      };
    }
    
    // Find room
    const roomIndex = store.rooms.findIndex(r => r.id === payload.id);
    
    if (roomIndex === -1) {
      return {
        type: 'error',
        payload: { message: `Room with ID ${payload.id} not found` }
      };
    }
    
    // Check if there are any active guests in the room
    const hasActiveGuests = store.guests.some(g => g.room_id === payload.id && !g.check_out_date);
    
    if (hasActiveGuests) {
      return {
        type: 'error',
        payload: { message: 'Cannot delete room with active guests' }
      };
    }
    
    // Remove room
    store.rooms.splice(roomIndex, 1);
    
    // Save changes
    saveDataToFiles();
    
    return {
      type: 'delete_room',
      payload: {
        id: payload.id,
        success: true,
        message: 'Room successfully deleted'
      }
    };
  },
  
  // Guest-related actions
  get_guests: () => {
    return {
      type: 'get_guests',
      payload: store.guests
    };
  },
  
  add_guest: (payload) => {
    // Validate required fields
    if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone) {
      return {
        type: 'error',
        payload: { message: 'First name, last name, email, and phone are required' }
      };
    }
    
    // Check if email already exists
    if (store.guests.some(g => g.email === payload.email)) {
      return {
        type: 'error',
        payload: { message: `Guest with email ${payload.email} already exists` }
      };
    }
    
    // Create new guest
    const newGuest = {
      id: uuidv4(),
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      room_id: null,
      check_in_date: null,
      check_out_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to store
    store.guests.push(newGuest);
    
    // Save to file
    saveDataToFiles();
    
    return {
      type: 'add_guest',
      payload: newGuest
    };
  },
  
  update_guest: (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Guest ID is required' }
      };
    }
    
    // Find guest
    const guestIndex = store.guests.findIndex(g => g.id === payload.id);
    
    if (guestIndex === -1) {
      return {
        type: 'error',
        payload: { message: `Guest with ID ${payload.id} not found` }
      };
    }
    
    const guest = store.guests[guestIndex];
    
    // Update basic info
    if (payload.first_name) guest.first_name = payload.first_name;
    if (payload.last_name) guest.last_name = payload.last_name;
    if (payload.email) guest.email = payload.email;
    if (payload.phone) guest.phone = payload.phone;
    
    // Handle room assignment
    if (payload.room_id !== undefined) {
      const oldRoomId = guest.room_id;
      
      if (payload.room_id === null) {
        // Check out
        if (oldRoomId) {
          // Update check-out date
          guest.check_out_date = payload.check_out_date || new Date().toISOString();
          guest.room_id = null;
          
          // Update room status if no more guests
          const roomStillHasGuests = store.guests.some(g => g.id !== guest.id && g.room_id === oldRoomId && !g.check_out_date);
          
          if (!roomStillHasGuests) {
            const oldRoom = store.rooms.find(r => r.id === oldRoomId);
            
            if (oldRoom) {
              oldRoom.status = 'free';
              oldRoom.updated_at = new Date().toISOString();
              
              // Remove guest from room's guest list
              oldRoom.guests = oldRoom.guests.filter(g => g.id !== guest.id);
              oldRoom.current_guests_count = oldRoom.guests.length;
            }
          }
        }
      } else {
        // Check in to new room
        // First check out from old room if necessary
        if (oldRoomId && oldRoomId !== payload.room_id) {
          // Update old room
          const oldRoom = store.rooms.find(r => r.id === oldRoomId);
          
          if (oldRoom) {
            // Remove guest from old room's guest list
            oldRoom.guests = oldRoom.guests.filter(g => g.id !== guest.id);
            oldRoom.current_guests_count = oldRoom.guests.length;
            
            // Update old room status if no more guests
            const roomStillHasGuests = store.guests.some(g => g.id !== guest.id && g.room_id === oldRoomId && !g.check_out_date);
            
            if (!roomStillHasGuests) {
              oldRoom.status = 'free';
              oldRoom.updated_at = new Date().toISOString();
            }
          }
        }
        
        // Find new room
        const newRoom = store.rooms.find(r => r.id === payload.room_id);
        
        if (!newRoom) {
          return {
            type: 'error',
            payload: { message: `Room with ID ${payload.room_id} not found` }
          };
        }
        
        // Check if room is at capacity
        if (newRoom.current_guests_count >= newRoom.max_guests) {
          return {
            type: 'error',
            payload: { message: `Room ${newRoom.room_number} is at maximum capacity (${newRoom.max_guests} guests)` }
          };
        }
        
        // Update guest
        guest.room_id = payload.room_id;
        guest.check_in_date = payload.check_in_date || new Date().toISOString();
        guest.check_out_date = null;
        
        // Update room
        newRoom.status = 'occupied';
        newRoom.updated_at = new Date().toISOString();
        
        // Add guest to room's guest list
        if (!newRoom.guests.some(g => g.id === guest.id)) {
          newRoom.guests.push({
            id: guest.id,
            first_name: guest.first_name,
            last_name: guest.last_name
          });
          
          newRoom.current_guests_count = newRoom.guests.length;
        }
      }
    }
    
    guest.updated_at = new Date().toISOString();
    
    // Save changes
    saveDataToFiles();
    
    return {
      type: 'update_guest',
      payload: guest
    };
  },
  
  delete_guest: (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Guest ID is required' }
      };
    }
    
    // Find guest
    const guestIndex = store.guests.findIndex(g => g.id === payload.id);
    
    if (guestIndex === -1) {
      return {
        type: 'error',
        payload: { message: `Guest with ID ${payload.id} not found` }
      };
    }
    
    const guest = store.guests[guestIndex];
    
    // Update room if guest was checked in
    if (guest.room_id) {
      const room = store.rooms.find(r => r.id === guest.room_id);
      
      if (room) {
        // Remove guest from room's guest list
        room.guests = room.guests.filter(g => g.id !== guest.id);
        room.current_guests_count = room.guests.length;
        
        // Update room status if no more guests
        if (room.guests.length === 0) {
          room.status = 'free';
          room.updated_at = new Date().toISOString();
        }
      }
    }
    
    // Remove guest
    store.guests.splice(guestIndex, 1);
    
    // Save changes
    saveDataToFiles();
    
    return {
      type: 'delete_guest',
      payload: {
        id: payload.id,
        success: true,
        message: 'Guest successfully deleted'
      }
    };
  },
  
  assign_multiple_guests: (payload) => {
    // Validate required fields
    if (!payload.room_id || !payload.guest_ids || !Array.isArray(payload.guest_ids) || payload.guest_ids.length === 0) {
      return {
        type: 'error',
        payload: { message: 'Room ID and guest IDs array are required' }
      };
    }
    
    // Find room
    const room = store.rooms.find(r => r.id === payload.room_id);
    
    if (!room) {
      return {
        type: 'error',
        payload: { message: `Room with ID ${payload.room_id} not found` }
      };
    }
    
    // Check capacity
    if (payload.guest_ids.length > room.max_guests) {
      return {
        type: 'error',
        payload: { message: `Room ${room.room_number} can only accommodate ${room.max_guests} guests` }
      };
    }
    
    // Check out any current guests
    room.guests = [];
    room.current_guests_count = 0;
    
    // Set check-in date
    const checkInDate = payload.check_in_date || new Date().toISOString();
    
    // Process each guest
    for (const guestId of payload.guest_ids) {
      // Find guest
      const guest = store.guests.find(g => g.id === guestId);
      
      if (!guest) {
        return {
          type: 'error',
          payload: { message: `Guest with ID ${guestId} not found` }
        };
      }
      
      // Check out from current room if any
      if (guest.room_id && guest.room_id !== payload.room_id) {
        const oldRoom = store.rooms.find(r => r.id === guest.room_id);
        
        if (oldRoom) {
          // Remove guest from old room's guest list
          oldRoom.guests = oldRoom.guests.filter(g => g.id !== guest.id);
          oldRoom.current_guests_count = oldRoom.guests.length;
          
          // Update old room status if no more guests
          if (oldRoom.guests.length === 0) {
            oldRoom.status = 'free';
            oldRoom.updated_at = new Date().toISOString();
          }
        }
      }
      
      // Update guest
      guest.room_id = payload.room_id;
      guest.check_in_date = checkInDate;
      guest.check_out_date = null;
      guest.updated_at = new Date().toISOString();
      
      // Add to room's guest list
      room.guests.push({
        id: guest.id,
        first_name: guest.first_name,
        last_name: guest.last_name
      });
    }
    
    // Update room
    room.status = 'occupied';
    room.updated_at = new Date().toISOString();
    room.current_guests_count = room.guests.length;
    
    // Save changes
    saveDataToFiles();
    
    return {
      type: 'assign_multiple_guests',
      payload: {
        success: true,
        room_id: payload.room_id,
        assigned_guests: payload.guest_ids.length,
        updated_room: room
      }
    };
  }
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  // Add to active clients
  clients.add(ws);
  console.log(`New client connected. Total connections: ${clients.size}`);
  
  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      // Parse message
      const data = JSON.parse(message);
      
      console.log('Received message:', data.type, data.payload ? JSON.stringify(data.payload).substring(0, 100) + '...' : '');
      
      // Prepare response
      let response;
      
      // Process message based on type
      if (handlers[data.type]) {
        response = handlers[data.type](data.payload);
      } else {
        response = {
          type: 'error',
          payload: { message: `Unknown action type: ${data.type}` }
        };
      }
      
      // Send response back to client
      if (response) {
        ws.send(JSON.stringify(response));
        
        // Broadcast updates to other clients if needed
        if (['add_room', 'update_room', 'delete_room', 'add_guest', 'update_guest', 'delete_guest'].includes(data.type)) {
          broadcastUpdate(response, ws);
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
      
      // Send error response
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: err.message }
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total connections: ${clients.size}`);
  });
  
  // Send initial data
  ws.send(JSON.stringify(handlers.get_rooms()));
});

// Broadcast updates to all clients except the sender
function broadcastUpdate(data, excludeWs) {
  clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Save data periodically to ensure persistence
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  console.log('Performing periodic data save to files');
  saveDataToFiles();
}, SAVE_INTERVAL);

// Graceful shutdown to save data
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  console.log('Saving data to files before exit');
  saveDataToFiles();
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.terminate();
  });
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Load data from files on startup
loadDataFromFiles();

// Start server
server.listen(port, () => {
  console.log(`JSON Server running on port ${port}`);
  console.log('Using JSON file storage');
}); 