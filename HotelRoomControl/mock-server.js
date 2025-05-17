const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

// Enable JSON parsing and CORS
app.use(express.json());
app.use(cors());

// Store state
let lights = false;
let doorLocked = true;

// Mock room data
const rooms = [
  {
    id: '1',
    room_number: '101',
    room_type: 'standard',
    status: 'free',
    price_per_night: 100.00,
    max_guests: 2,
    door_locked: true,
    current_guests_count: 0,
    sensors: {
      temperature: 22.5,
      humidity: 45,
      pressure: 1013,
      lights: false
    },
    guests: []
  },
  {
    id: '2',
    room_number: '102',
    room_type: 'deluxe',
    status: 'occupied',
    price_per_night: 200.00,
    max_guests: 3,
    door_locked: false,
    current_guests_count: 2,
    sensors: {
      temperature: 23.5,
      humidity: 47,
      pressure: 1015,
      lights: true
    },
    guests: [
      { id: '1', first_name: 'John', last_name: 'Doe' },
      { id: '2', first_name: 'Jane', last_name: 'Smith' }
    ]
  }
];

// Room endpoints
app.get('/rooms', (req, res) => {
  console.log('GET rooms request received');
  res.json(rooms);
});

app.get('/room/:id', (req, res) => {
  const { id } = req.params;
  console.log(`GET room ${id} request received`);
  
  const room = rooms.find(r => r.id === id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(room);
});

// Status endpoint
app.get('/light_status', (req, res) => {
  res.json({ status: 'ok', lights, doorLocked });
});

// Light control endpoints
app.post('/light_on', (req, res) => {
  console.log('Light ON request received');
  lights = true;
  
  // Update room lights
  rooms.forEach(room => {
    if (room.id === '1') {
      room.sensors.lights = true;
    }
  });
  
  res.json({ status: 'ok', message: 'Lights turned ON', lights });
});

app.post('/light_off', (req, res) => {
  console.log('Light OFF request received');
  lights = false;
  
  // Update room lights
  rooms.forEach(room => {
    if (room.id === '1') {
      room.sensors.lights = false;
    }
  });
  
  res.json({ status: 'ok', message: 'Lights turned OFF', lights });
});

// Door control endpoints
app.post('/door_open', (req, res) => {
  console.log('Door OPEN request received');
  doorLocked = false;
  
  // Update room door lock
  rooms.forEach(room => {
    if (room.id === '1') {
      room.door_locked = false;
    }
  });
  
  res.json({ status: 'ok', message: 'Door unlocked', doorLocked });
});

app.post('/door_close', (req, res) => {
  console.log('Door CLOSE request received');
  doorLocked = true;
  
  // Update room door lock
  rooms.forEach(room => {
    if (room.id === '1') {
      room.door_locked = true;
    }
  });
  
  res.json({ status: 'ok', message: 'Door locked', doorLocked });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Mock server running at http://0.0.0.0:${port}`);
  console.log('Available endpoints:');
  console.log('- GET /rooms');
  console.log('- GET /room/:id');
  console.log('- GET /light_status');
  console.log('- POST /light_on');
  console.log('- POST /light_off');
  console.log('- POST /door_open');
  console.log('- POST /door_close');
}); 