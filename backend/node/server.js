require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database/db');
const path = require('path');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// HTTP routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hotel Management API is running',
    databaseConnected: db.isConnected()
  });
});

// Add REST API endpoint for all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    if (!db.isConnected()) {
      console.error('Database not connected. Attempting to reconnect...');
      await db.initDatabase();
      
      if (!db.isConnected()) {
        return res.status(500).json({ 
          error: 'Database connection is required and reconnection failed' 
        });
      }
    }
    
    console.log('Fetching rooms from database via HTTP endpoint...');
    
    // Get rooms from database
    const result = await db.query(`
      SELECT r.*, json_build_object(
        'temperature', rs.temperature,
        'humidity', rs.humidity,
        'pressure', rs.pressure,
        'lights', json_build_object(
          'bathroom', rs.light_bathroom, 
          'bedroom', rs.light_bedroom,
          'hallway', rs.light_hallway
        )
      ) as sensors
      FROM rooms r
      LEFT JOIN room_sensors rs ON r.id = rs.room_id
    `);
    
    console.log(`Found ${result.rows.length} rooms in database`);
    
    // Get all guests and associate them with rooms
    const guestsResult = await db.query(`
      SELECT g.*, gr.room_id 
      FROM guests g
      JOIN guest_room gr ON g.id = gr.guest_id
      WHERE gr.check_out_date IS NULL
    `);
    
    // Map rooms and include guests
    const rooms = result.rows.map(room => {
      const roomGuests = guestsResult.rows.filter(g => g.room_id === room.id);
      return {
        ...room,
        door_locked: room.door_locked,
        price_per_night: parseFloat(room.price_per_night),
        current_guests_count: roomGuests.length,
        guests: roomGuests
      };
    });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ error: `Failed to get rooms: ${error.message}` });
  }
});

// Add REST API endpoint for a specific room
app.get('/api/rooms/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!db.isConnected()) {
      return res.status(500).json({ 
        error: 'Database connection is required' 
      });
    }
    
    // Get room from database
    const result = await db.query(`
      SELECT r.*, json_build_object(
        'temperature', rs.temperature,
        'humidity', rs.humidity,
        'pressure', rs.pressure,
        'lights', json_build_object(
          'bathroom', rs.light_bathroom,
          'bedroom', rs.light_bedroom,
          'hallway', rs.light_hallway
        )
      ) as sensors
      FROM rooms r
      LEFT JOIN room_sensors rs ON r.id = rs.room_id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Room with ID ${id} not found` });
    }
    
    // Get guests associated with this room
    const guestsResult = await db.query(`
      SELECT g.* 
      FROM guests g
      JOIN guest_room gr ON g.id = gr.guest_id
      WHERE gr.room_id = $1 AND gr.check_out_date IS NULL
    `, [id]);
    
    // Format room with guests
    const room = {
      ...result.rows[0],
      door_locked: result.rows[0].door_locked,
      price_per_night: parseFloat(result.rows[0].price_per_night),
      current_guests_count: guestsResult.rows.length,
      guests: guestsResult.rows
    };
    
    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: `Failed to get room: ${error.message}` });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const clients = new Set();

// Database-aware API handlers
const handlers = {
  // Room-related actions
  get_rooms: async () => {
    try {
      if (!db.isConnected()) {
        console.error('Database not connected. Attempting to reconnect...');
        await db.initDatabase();
        
        if (!db.isConnected()) {
          throw new Error('Database connection is required and reconnection failed');
        }
      }
      
      console.log('Fetching rooms from database...');
      
      // Get rooms from database
      const result = await db.query(`
        SELECT r.*, json_build_object(
          'temperature', rs.temperature,
          'humidity', rs.humidity,
          'pressure', rs.pressure,
          'lights', json_build_object(
            'bathroom', rs.light_bathroom, 
            'bedroom', rs.light_bedroom,
            'hallway', rs.light_hallway
          )
        ) as sensors
        FROM rooms r
        LEFT JOIN room_sensors rs ON r.id = rs.room_id
      `);
      
      console.log(`Found ${result.rows.length} rooms in database`);
      
      // Get all guests and associate them with rooms
      const guestsResult = await db.query(`
        SELECT g.*, gr.room_id 
        FROM guests g
        JOIN guest_room gr ON g.id = gr.guest_id
        WHERE gr.check_out_date IS NULL
      `);
      
      // Map rooms and include guests
      const rooms = result.rows.map(room => {
        const roomGuests = guestsResult.rows.filter(g => g.room_id === room.id);
        return {
          ...room,
          door_locked: room.door_locked,
          price_per_night: parseFloat(room.price_per_night),
          current_guests_count: roomGuests.length,
          guests: roomGuests
        };
      });
      
      return {
        type: 'get_rooms',
        payload: rooms
      };
    } catch (error) {
      console.error('Error getting rooms:', error);
      return {
        type: 'error',
        payload: { message: `Failed to get rooms: ${error.message}` }
      };
    }
  },
  
  // Add new handler for fetching a single room
  get_room: async (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Room ID is required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      // Get room from database
      const result = await db.query(`
        SELECT r.*, json_build_object(
          'temperature', rs.temperature,
          'humidity', rs.humidity,
          'pressure', rs.pressure,
          'lights', json_build_object(
            'bathroom', rs.light_bathroom,
            'bedroom', rs.light_bedroom,
            'hallway', rs.light_hallway
          )
        ) as sensors
        FROM rooms r
        LEFT JOIN room_sensors rs ON r.id = rs.room_id
        WHERE r.id = $1
      `, [payload.id]);
      
      if (result.rows.length === 0) {
        return {
          type: 'error',
          payload: { message: `Room with ID ${payload.id} not found` }
        };
      }
      
      // Get guests associated with this room
      const guestsResult = await db.query(`
        SELECT g.* 
        FROM guests g
        JOIN guest_room gr ON g.id = gr.guest_id
        WHERE gr.room_id = $1 AND gr.check_out_date IS NULL
      `, [payload.id]);
      
      // Format room with guests
      const room = {
        ...result.rows[0],
        door_locked: result.rows[0].door_locked,
        price_per_night: parseFloat(result.rows[0].price_per_night),
        current_guests_count: guestsResult.rows.length,
        guests: guestsResult.rows
      };
      
      return {
        type: 'get_room',
        payload: room
      };
    } catch (error) {
      console.error('Error fetching room:', error);
      return {
        type: 'error',
        payload: { message: `Failed to get room: ${error.message}` }
      };
    }
  },
  
  add_room: async (payload) => {
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      const { room_number, room_type, price_per_night, max_guests } = payload;
      
      // Validate required fields
      if (!room_number || !room_type || !price_per_night) {
        return {
          type: 'error',
          payload: { message: 'Room number, type, and price are required' }
        };
      }
      
      // Check if room with this number already exists
      const existingRoomCheck = await db.query(`
        SELECT COUNT(*) FROM rooms WHERE room_number = $1
      `, [room_number]);
      
      if (parseInt(existingRoomCheck.rows[0].count) > 0) {
        return {
          type: 'error',
          payload: { message: `Room with number ${room_number} already exists` }
        };
      }
      
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Insert new room
        const roomResult = await client.query(`
          INSERT INTO rooms (room_number, room_type, status, price_per_night, max_guests, door_locked)
          VALUES ($1, $2, 'free', $3, $4, true)
          RETURNING *
        `, [room_number, room_type, price_per_night, max_guests || 2]);
        
        const newRoomId = roomResult.rows[0].id;
        
        // Insert sensor data for the room
        await client.query(`
          INSERT INTO room_sensors (room_id, temperature, humidity, pressure, light_bathroom, light_bedroom, light_hallway)
          VALUES ($1, $2, $3, $4, false, false, false)
        `, [newRoomId, 22.0, 50, 1013]);
        
        await client.query('COMMIT');
        
        // Get the complete room with sensors
        const result = await client.query(`
          SELECT r.*, json_build_object(
            'temperature', rs.temperature,
            'humidity', rs.humidity,
            'pressure', rs.pressure,
            'lights', json_build_object(
              'bathroom', rs.light_bathroom,
              'bedroom', rs.light_bedroom,
              'hallway', rs.light_hallway
            )
          ) as sensors
          FROM rooms r
          LEFT JOIN room_sensors rs ON r.id = rs.room_id
          WHERE r.id = $1
        `, [newRoomId]);
        
        const newRoom = {
          ...result.rows[0],
          door_locked: result.rows[0].door_locked,
          price_per_night: parseFloat(result.rows[0].price_per_night),
          current_guests_count: 0,
          guests: []
        };
        
        return {
          type: 'add_room',
          payload: newRoom
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding room:', error);
      return {
        type: 'error',
        payload: { message: `Failed to add room: ${error.message}` }
      };
    }
  },
  
  update_room: async (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Room ID is required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }

      // Use transaction helper for consistent updates
      return await db.transaction(async (client) => {
        // Update room in database
        if (payload.status) {
          const roomResult = await client.query(`
            UPDATE rooms
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `, [payload.status, payload.id]);
          
          if (roomResult.rows.length === 0) {
            throw new Error(`Room with ID ${payload.id} not found`);
          }
        }
        
        // Handle door_locked updates
        if (payload.door_locked !== undefined) {
          await client.query(`
            UPDATE rooms
            SET door_locked = $1, updated_at = NOW()
            WHERE id = $2
          `, [payload.door_locked, payload.id]);
        }
        
        // Update room sensors if provided
        if (payload.sensors) {
          const sensorUpdates = [];
          const sensorParams = [];
          let paramIndex = 1;
          
          if (payload.sensors.temperature !== undefined) {
            sensorUpdates.push(`temperature = $${paramIndex}`);
            sensorParams.push(payload.sensors.temperature);
            paramIndex++;
          }
          
          if (payload.sensors.humidity !== undefined) {
            sensorUpdates.push(`humidity = $${paramIndex}`);
            sensorParams.push(payload.sensors.humidity);
            paramIndex++;
          }
          
          if (payload.sensors.pressure !== undefined) {
            sensorUpdates.push(`pressure = $${paramIndex}`);
            sensorParams.push(payload.sensors.pressure);
            paramIndex++;
          }
          
          if (payload.sensors.lights) {
            if (payload.sensors.lights.bathroom !== undefined) {
              sensorUpdates.push(`light_bathroom = $${paramIndex}`);
              sensorParams.push(payload.sensors.lights.bathroom);
              paramIndex++;
            }
            
            if (payload.sensors.lights.bedroom !== undefined) {
              sensorUpdates.push(`light_bedroom = $${paramIndex}`);
              sensorParams.push(payload.sensors.lights.bedroom);
              paramIndex++;
            }
            
            if (payload.sensors.lights.hallway !== undefined) {
              sensorUpdates.push(`light_hallway = $${paramIndex}`);
              sensorParams.push(payload.sensors.lights.hallway);
              paramIndex++;
            }
          }
          
          if (sensorUpdates.length > 0) {
            sensorUpdates.push(`updated_at = NOW()`);
            
            const sensorQuery = `
              UPDATE room_sensors
              SET ${sensorUpdates.join(', ')}
              WHERE room_id = $${paramIndex}
              RETURNING *
            `;
            
            sensorParams.push(payload.id);
            
            const sensorResult = await client.query(sensorQuery, sensorParams);
            
            if (sensorResult.rows.length === 0) {
              // If no sensor record exists, create one
              const insertSensorQuery = `
                INSERT INTO room_sensors (
                  room_id, 
                  temperature, 
                  humidity, 
                  pressure,
                  light_bathroom,
                  light_bedroom,
                  light_hallway
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
              `;
              
              const insertParams = [
                payload.id,
                payload.sensors.temperature !== undefined ? payload.sensors.temperature : 22.0,
                payload.sensors.humidity !== undefined ? payload.sensors.humidity : 50,
                payload.sensors.pressure !== undefined ? payload.sensors.pressure : 1013,
                payload.sensors.lights && payload.sensors.lights.bathroom !== undefined ? payload.sensors.lights.bathroom : false,
                payload.sensors.lights && payload.sensors.lights.bedroom !== undefined ? payload.sensors.lights.bedroom : false,
                payload.sensors.lights && payload.sensors.lights.hallway !== undefined ? payload.sensors.lights.hallway : false
              ];
              
              await client.query(insertSensorQuery, insertParams);
            }
          }
        }
        
        // Get updated room with sensors for response
        const result = await client.query(`
          SELECT r.*, json_build_object(
            'temperature', rs.temperature,
            'humidity', rs.humidity,
            'pressure', rs.pressure,
            'lights', json_build_object(
              'bathroom', rs.light_bathroom,
              'bedroom', rs.light_bedroom,
              'hallway', rs.light_hallway
            )
          ) as sensors
          FROM rooms r
          LEFT JOIN room_sensors rs ON r.id = rs.room_id
          WHERE r.id = $1
        `, [payload.id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Room with ID ${payload.id} not found`);
        }
        
        // Get guests associated with this room
        const guestsResult = await client.query(`
          SELECT g.* 
          FROM guests g
          JOIN guest_room gr ON g.id = gr.guest_id
          WHERE gr.room_id = $1 AND gr.check_out_date IS NULL
        `, [payload.id]);
        
        // Format room with guests
        const room = {
          ...result.rows[0],
          door_locked: result.rows[0].door_locked,
          price_per_night: parseFloat(result.rows[0].price_per_night),
          current_guests_count: guestsResult.rows.length,
          guests: guestsResult.rows
        };
        
        return {
          type: 'update_room',
          payload: room
        };
      });
    } catch (error) {
      console.error('Error updating room:', error);
      return {
        type: 'error',
        payload: { message: `Failed to update room: ${error.message}` }
      };
    }
  },
  
  delete_room: async (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Room ID is required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Check if there are any active guests in the room
        const guestsResult = await client.query(`
          SELECT COUNT(*) 
          FROM guest_room 
          WHERE room_id = $1 AND check_out_date IS NULL
        `, [payload.id]);
        
        if (parseInt(guestsResult.rows[0].count) > 0) {
          throw new Error('Cannot delete room with active guests');
        }
        
        // Delete associated sensors
        await client.query('DELETE FROM room_sensors WHERE room_id = $1', [payload.id]);
        
        // Delete the room
        const result = await client.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [payload.id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Room with ID ${payload.id} not found`);
        }
        
        await client.query('COMMIT');
        
        return {
          type: 'delete_room',
          payload: {
            id: payload.id,
            success: true,
            message: 'Room successfully deleted'
          }
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      return {
        type: 'error',
        payload: { message: `Failed to delete room: ${error.message}` }
      };
    }
  },
  
  // Guest-related actions
  get_guests: async () => {
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      // Get all guests
      const result = await db.query(`
        SELECT g.*, gr.room_id, gr.check_in_date, gr.check_out_date
        FROM guests g
        LEFT JOIN guest_room gr ON g.id = gr.guest_id
        WHERE gr.check_out_date IS NULL OR gr.id IS NULL
        ORDER BY g.last_name, g.first_name
      `);
      
      return {
        type: 'get_guests',
        payload: result.rows
      };
    } catch (error) {
      console.error('Error getting guests:', error);
      return {
        type: 'error',
        payload: { message: `Failed to get guests: ${error.message}` }
      };
    }
  },
  
  add_guest: async (payload) => {
    // Validate required fields
    if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone) {
      return {
        type: 'error',
        payload: { message: 'First name, last name, email, and phone are required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Create new guest
        const result = await client.query(`
          INSERT INTO guests (first_name, last_name, email, phone)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [payload.first_name, payload.last_name, payload.email, payload.phone]);
        
        const newGuest = result.rows[0];
        
        // If room_id is provided, assign guest to room
        if (payload.room_id) {
          // Check if room exists
          const roomResult = await client.query(`
            SELECT * FROM rooms WHERE id = $1
          `, [payload.room_id]);
          
          if (roomResult.rows.length === 0) {
            throw new Error(`Room with ID ${payload.room_id} not found`);
          }
          
          // Check room capacity
          const guestsInRoomResult = await client.query(`
            SELECT COUNT(*) FROM guest_room
            WHERE room_id = $1 AND check_out_date IS NULL
          `, [payload.room_id]);
          
          const guestsInRoom = parseInt(guestsInRoomResult.rows[0].count);
          const maxGuests = roomResult.rows[0].max_guests;
          
          if (guestsInRoom >= maxGuests) {
            throw new Error(`Room is at maximum capacity (${maxGuests} guests)`);
          }
          
          // Assign guest to room
          await client.query(`
            INSERT INTO guest_room (guest_id, room_id, check_in_date)
            VALUES ($1, $2, NOW())
          `, [newGuest.id, payload.room_id]);
          
          // Update room status
          await client.query(`
            UPDATE rooms
            SET status = 'occupied', updated_at = NOW()
            WHERE id = $1
          `, [payload.room_id]);
          
          // Add room info to response
          newGuest.room_id = payload.room_id;
          newGuest.check_in_date = new Date().toISOString();
          newGuest.check_out_date = null;
        }
        
        await client.query('COMMIT');
        
        return {
          type: 'add_guest',
          payload: newGuest
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding guest:', error);
      return {
        type: 'error',
        payload: { message: `Failed to add guest: ${error.message}` }
      };
    }
  },
  
  update_guest: async (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Guest ID is required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Check if guest exists
        const guestResult = await client.query(`
          SELECT * FROM guests WHERE id = $1
        `, [payload.id]);
        
        if (guestResult.rows.length === 0) {
          throw new Error(`Guest with ID ${payload.id} not found`);
        }
        
        // Build update query for guest data
        const updateFields = [];
        const updateParams = [];
        let paramIndex = 1;
        
        if (payload.first_name) {
          updateFields.push(`first_name = $${paramIndex}`);
          updateParams.push(payload.first_name);
          paramIndex++;
        }
        
        if (payload.last_name) {
          updateFields.push(`last_name = $${paramIndex}`);
          updateParams.push(payload.last_name);
          paramIndex++;
        }
        
        if (payload.email) {
          updateFields.push(`email = $${paramIndex}`);
          updateParams.push(payload.email);
          paramIndex++;
        }
        
        if (payload.phone) {
          updateFields.push(`phone = $${paramIndex}`);
          updateParams.push(payload.phone);
          paramIndex++;
        }
        
        // Update guest if fields provided
        if (updateFields.length > 0) {
          updateFields.push(`updated_at = NOW()`);
          updateParams.push(payload.id);
          
          await client.query(`
            UPDATE guests
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
          `, updateParams);
        }
        
        // Handle room assignment
        if (payload.room_id !== undefined) {
          // Get current room assignment
          const currentRoomResult = await client.query(`
            SELECT room_id
            FROM guest_room
            WHERE guest_id = $1 AND check_out_date IS NULL
          `, [payload.id]);
          
          const oldRoomId = currentRoomResult.rows.length > 0 ? currentRoomResult.rows[0].room_id : null;
          
          if (payload.room_id === null) {
            // Check out guest if currently in a room
            if (oldRoomId) {
              // Update check-out date
              await client.query(`
                UPDATE guest_room
                SET check_out_date = NOW()
                WHERE guest_id = $1 AND room_id = $2 AND check_out_date IS NULL
              `, [payload.id, oldRoomId]);
              
              // Check if this was the last guest in the room
              const remainingGuestsResult = await client.query(`
                SELECT COUNT(*) 
                FROM guest_room 
                WHERE room_id = $1 AND check_out_date IS NULL
              `, [oldRoomId]);
              
              // Update room status if no more guests
              if (parseInt(remainingGuestsResult.rows[0].count) === 0) {
                await client.query(`
                  UPDATE rooms
                  SET status = 'free', updated_at = NOW()
                  WHERE id = $1
                `, [oldRoomId]);
              }
            }
          } else if (payload.room_id !== oldRoomId) {
            // Guest is checking into a new room
            
            // First check out from old room if necessary
            if (oldRoomId) {
              await client.query(`
                UPDATE guest_room
                SET check_out_date = NOW()
                WHERE guest_id = $1 AND room_id = $2 AND check_out_date IS NULL
              `, [payload.id, oldRoomId]);
              
              // Check if this was the last guest in the old room
              const remainingGuestsResult = await client.query(`
                SELECT COUNT(*) 
                FROM guest_room 
                WHERE room_id = $1 AND check_out_date IS NULL
              `, [oldRoomId]);
              
              // Update old room status if no more guests
              if (parseInt(remainingGuestsResult.rows[0].count) === 0) {
                await client.query(`
                  UPDATE rooms
                  SET status = 'free', updated_at = NOW()
                  WHERE id = $1
                `, [oldRoomId]);
              }
            }
            
            // Check if new room exists
            const roomResult = await client.query(`
              SELECT * FROM rooms WHERE id = $1
            `, [payload.room_id]);
            
            if (roomResult.rows.length === 0) {
              throw new Error(`Room with ID ${payload.room_id} not found`);
            }
            
            // Check room capacity
            const guestsInRoomResult = await client.query(`
              SELECT COUNT(*) FROM guest_room
              WHERE room_id = $1 AND check_out_date IS NULL
            `, [payload.room_id]);
            
            const guestsInRoom = parseInt(guestsInRoomResult.rows[0].count);
            const maxGuests = roomResult.rows[0].max_guests;
            
            if (guestsInRoom >= maxGuests) {
              throw new Error(`Room is at maximum capacity (${maxGuests} guests)`);
            }
            
            // Check in to new room
            await client.query(`
              INSERT INTO guest_room (guest_id, room_id, check_in_date)
              VALUES ($1, $2, NOW())
            `, [payload.id, payload.room_id]);
            
            // Update new room status
            await client.query(`
              UPDATE rooms
              SET status = 'occupied', updated_at = NOW()
              WHERE id = $1
            `, [payload.room_id]);
          }
        }
        
        await client.query('COMMIT');
        
        // Get updated guest data with room info
        const result = await client.query(`
          SELECT g.*, gr.room_id, gr.check_in_date, gr.check_out_date
          FROM guests g
          LEFT JOIN guest_room gr ON g.id = gr.guest_id
          WHERE g.id = $1 AND (gr.check_out_date IS NULL OR gr.id IS NULL)
        `, [payload.id]);
        
        return {
          type: 'update_guest',
          payload: result.rows[0]
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating guest:', error);
      return {
        type: 'error',
        payload: { message: `Failed to update guest: ${error.message}` }
      };
    }
  },
  
  delete_guest: async (payload) => {
    // Validate required fields
    if (!payload.id) {
      return {
        type: 'error',
        payload: { message: 'Guest ID is required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Check if guest exists
        const guestResult = await client.query(`
          SELECT * FROM guests WHERE id = $1
        `, [payload.id]);
        
        if (guestResult.rows.length === 0) {
          throw new Error(`Guest with ID ${payload.id} not found`);
        }
        
        // Get current room assignment
        const roomResult = await client.query(`
          SELECT room_id
          FROM guest_room
          WHERE guest_id = $1 AND check_out_date IS NULL
        `, [payload.id]);
        
        const roomId = roomResult.rows.length > 0 ? roomResult.rows[0].room_id : null;
        
        // Handle room checkout if guest is in a room
        if (roomId) {
          // Update check-out date
          await client.query(`
            UPDATE guest_room
            SET check_out_date = NOW()
            WHERE guest_id = $1 AND room_id = $2 AND check_out_date IS NULL
          `, [payload.id, roomId]);
          
          // Check if this was the last guest in the room
          const remainingGuestsResult = await client.query(`
            SELECT COUNT(*) 
            FROM guest_room 
            WHERE room_id = $1 AND check_out_date IS NULL
          `, [roomId]);
          
          // Update room status if no more guests
          if (parseInt(remainingGuestsResult.rows[0].count) === 0) {
            await client.query(`
              UPDATE rooms
              SET status = 'free', updated_at = NOW()
              WHERE id = $1
            `, [roomId]);
          }
        }
        
        // Delete guest
        await client.query('DELETE FROM guests WHERE id = $1', [payload.id]);
        
        await client.query('COMMIT');
        
        return {
          type: 'delete_guest',
          payload: {
            id: payload.id,
            success: true,
            message: 'Guest successfully deleted'
          }
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      return {
        type: 'error',
        payload: { message: `Failed to delete guest: ${error.message}` }
      };
    }
  },
  
  assign_multiple_guests: async (payload) => {
    // Validate required fields
    if (!payload.room_id || !payload.guest_ids || !Array.isArray(payload.guest_ids) || payload.guest_ids.length === 0) {
      return {
        type: 'error',
        payload: { message: 'Room ID and guest IDs array are required' }
      };
    }
    
    try {
      if (!db.isConnected()) {
        throw new Error('Database connection is required');
      }
      
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Check if room exists
        const roomResult = await client.query(`
          SELECT * FROM rooms WHERE id = $1
        `, [payload.room_id]);
        
        if (roomResult.rows.length === 0) {
          throw new Error(`Room with ID ${payload.room_id} not found`);
        }
        
        // Check room capacity
        const room = roomResult.rows[0];
        if (payload.guest_ids.length > room.max_guests) {
          throw new Error(`Room ${room.room_number} can only accommodate ${room.max_guests} guests`);
        }
        
        // Check out any current guests from this room
        await client.query(`
          UPDATE guest_room
          SET check_out_date = NOW()
          WHERE room_id = $1 AND check_out_date IS NULL
        `, [payload.room_id]);
        
        // Process each guest
        for (const guestId of payload.guest_ids) {
          // Check if guest exists
          const guestResult = await client.query(`
            SELECT * FROM guests WHERE id = $1
          `, [guestId]);
          
          if (guestResult.rows.length === 0) {
            throw new Error(`Guest with ID ${guestId} not found`);
          }
          
          // Check out guest from current room if any
          await client.query(`
            UPDATE guest_room
            SET check_out_date = NOW()
            WHERE guest_id = $1 AND check_out_date IS NULL
          `, [guestId]);
          
          // Check in to new room
          await client.query(`
            INSERT INTO guest_room (guest_id, room_id, check_in_date)
            VALUES ($1, $2, NOW())
          `, [guestId, payload.room_id]);
        }
        
        // Update room status
        await client.query(`
          UPDATE rooms
          SET status = 'occupied', updated_at = NOW()
          WHERE id = $1
        `, [payload.room_id]);
        
        await client.query('COMMIT');
        
        // Get updated room with guest info
        const result = await client.query(`
          SELECT r.*, json_build_object(
            'temperature', rs.temperature,
            'humidity', rs.humidity,
            'pressure', rs.pressure,
            'lights', json_build_object(
              'bathroom', rs.light_bathroom,
              'bedroom', rs.light_bedroom,
              'hallway', rs.light_hallway
            )
          ) as sensors
          FROM rooms r
          LEFT JOIN room_sensors rs ON r.id = rs.room_id
          WHERE r.id = $1
        `, [payload.room_id]);
        
        // Get guests in this room
        const guestsResult = await client.query(`
          SELECT g.* 
          FROM guests g
          JOIN guest_room gr ON g.id = gr.guest_id
          WHERE gr.room_id = $1 AND gr.check_out_date IS NULL
        `, [payload.room_id]);
        
        // Format room with guests
        const updatedRoom = {
          ...result.rows[0],
          door_locked: result.rows[0].door_locked,
          price_per_night: parseFloat(result.rows[0].price_per_night),
          current_guests_count: guestsResult.rows.length,
          guests: guestsResult.rows
        };
        
        return {
          type: 'assign_multiple_guests',
          payload: {
            success: true,
            room_id: payload.room_id,
            assigned_guests: payload.guest_ids.length,
            updated_room: updatedRoom
          }
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error assigning guests to room:', error);
      return {
        type: 'error',
        payload: { message: `Failed to assign guests to room: ${error.message}` }
      };
    }
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
        response = await handlers[data.type](data.payload);
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
  handlers.get_rooms().then(response => {
    ws.send(JSON.stringify(response));
  });
});

// Broadcast updates to all clients except the sender
function broadcastUpdate(data, excludeWs) {
  clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Start the server
server.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  
  // Make sure database is initialized
  if (!db.isConnected()) {
    console.log('Attempting to connect to database...');
    await db.initDatabase();
  }
  
  // Add sample data if database is empty
  if (db.isConnected()) {
    const client = await db.getClient();
    try {
      // Check if we have any rooms
      const roomsResult = await client.query('SELECT COUNT(*) FROM rooms');
      if (parseInt(roomsResult.rows[0].count) === 0) {
        console.log('Adding sample data to database...');
        
        // Add sample rooms
        await client.query(`
          INSERT INTO rooms (room_number, room_type, status, price_per_night, max_guests, door_locked) 
          VALUES 
            ('101', 'standard', 'free', 100.00, 2, true),
            ('102', 'standard', 'free', 100.00, 2, true),
            ('103', 'standard', 'free', 100.00, 2, true),
            ('104', 'deluxe', 'free', 200.00, 3, true),
            ('105', 'suite', 'free', 300.00, 4, true)
          ON CONFLICT (room_number) DO NOTHING
        `);
        
        // Add room sensors
        await client.query(`
          INSERT INTO room_sensors (room_id, temperature, humidity, pressure, light_bathroom, light_bedroom, light_hallway)
          SELECT id, 
                 22.0 + (id * 0.5), 
                 45 + (id * 1), 
                 1013, 
                 false, 
                 false, 
                 false
          FROM rooms
          ON CONFLICT DO NOTHING
        `);
        
        // Add sample guests
        await client.query(`
          INSERT INTO guests (first_name, last_name, email, phone)
          VALUES 
            ('John', 'Doe', 'john.doe@example.com', '+1234567890'),
            ('Jane', 'Smith', 'jane.smith@example.com', '+0987654321'),
            ('Bob', 'Johnson', 'bob.johnson@example.com', '+1122334455')
          ON CONFLICT (email) DO NOTHING
        `);
        
        console.log('Sample data added successfully');
      } else {
        console.log('Database already contains data, skipping sample data creation');
      }
    } catch (error) {
      console.error('Error adding sample data:', error);
    } finally {
      client.release();
    }
  }
}); 