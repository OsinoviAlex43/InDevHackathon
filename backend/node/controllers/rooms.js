const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all rooms with their associated sensor data
 */
async function getRooms() {
  try {
    const result = await db.query(`
      SELECT r.*, 
             rs.temperature, rs.humidity, rs.pressure, 
             rs.light_bathroom, rs.light_bedroom, rs.light_hallway
      FROM rooms r
      LEFT JOIN room_sensors rs ON r.id = rs.room_id
      ORDER BY r.room_number
    `);
    
    // Format the rooms with sensor data
    const rooms = result.rows.map(row => {
      // Extract room data
      const room = {
        id: row.id.toString(),
        room_number: row.room_number,
        room_type: row.room_type,
        status: row.status,
        price_per_night: parseFloat(row.price_per_night),
        max_guests: row.max_guests,
        door_locked: row.door_locked,
        current_guests_count: 0, // Will be updated later
        created_at: row.created_at,
        updated_at: row.updated_at,
        sensors: {
          temperature: row.temperature ? parseFloat(row.temperature) : 22.0,
          humidity: row.humidity || 45,
          pressure: row.pressure || 1013,
          lights: {
            bathroom: row.light_bathroom || false,
            bedroom: row.light_bedroom || false,
            hallway: row.light_hallway || false
          }
        },
        guests: [] // Will be populated later
      };
      
      return room;
    });
    
    // Get current guests for each room
    const guestsResult = await db.query(`
      SELECT g.id, g.first_name, g.last_name, gr.room_id
      FROM guests g
      JOIN guest_room gr ON g.id = gr.guest_id
      WHERE gr.check_out_date IS NULL
    `);
    
    // Add guests to their respective rooms
    guestsResult.rows.forEach(guest => {
      const room = rooms.find(r => r.id === guest.room_id.toString());
      if (room) {
        room.guests.push({
          id: guest.id.toString(),
          first_name: guest.first_name,
          last_name: guest.last_name
        });
        room.current_guests_count++;
      }
    });
    
    return {
      type: 'initial_data',
      payload: { rooms }
    };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      type: 'error',
      payload: { message: 'Failed to fetch rooms' }
    };
  }
}

/**
 * Add a new room
 */
async function addRoom(data) {
  try {
    // Validate required fields
    if (!data.room_number || !data.room_type || !data.price_per_night) {
      throw new Error('Missing required fields');
    }
    
    // Start a transaction
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Insert the room
      const roomResult = await client.query(`
        INSERT INTO rooms (room_number, room_type, status, price_per_night, max_guests, door_locked)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        data.room_number,
        data.room_type,
        data.status || 'free',
        data.price_per_night,
        data.max_guests || 2,
        true
      ]);
      
      const newRoom = roomResult.rows[0];
      
      // Insert initial sensor data
      await client.query(`
        INSERT INTO room_sensors (room_id, temperature, humidity, pressure)
        VALUES ($1, $2, $3, $4)
      `, [
        newRoom.id,
        22.0 + Math.random() * 3, // Random temperature between 22-25
        45 + Math.floor(Math.random() * 10), // Random humidity between 45-55
        1013
      ]);
      
      await client.query('COMMIT');
      
      // Format the response
      const room = {
        id: newRoom.id.toString(),
        room_number: newRoom.room_number,
        room_type: newRoom.room_type,
        status: newRoom.status,
        price_per_night: parseFloat(newRoom.price_per_night),
        max_guests: newRoom.max_guests,
        door_locked: newRoom.door_locked,
        current_guests_count: 0,
        created_at: newRoom.created_at,
        updated_at: newRoom.updated_at,
        sensors: {
          temperature: 22.0 + Math.random() * 3,
          humidity: 45 + Math.floor(Math.random() * 10),
          pressure: 1013,
          lights: {
            bathroom: false,
            bedroom: false,
            hallway: false
          }
        },
        guests: []
      };
      
      return {
        type: 'add_room',
        payload: room
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
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
}

/**
 * Update a room
 */
async function updateRoom(data) {
  try {
    // Validate required fields
    if (!data.id) {
      throw new Error('Room ID is required');
    }
    
    // Get current room data
    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [data.id]);
    
    if (roomResult.rows.length === 0) {
      throw new Error(`Room with ID ${data.id} not found`);
    }
    
    const currentRoom = roomResult.rows[0];
    
    // Update the room
    const updatedFields = {};
    
    // Check which fields should be updated
    if (data.status) updatedFields.status = data.status;
    if (data.room_type) updatedFields.room_type = data.room_type;
    if (data.price_per_night) updatedFields.price_per_night = data.price_per_night;
    if (data.max_guests) updatedFields.max_guests = data.max_guests;
    if (data.door_locked !== undefined) updatedFields.door_locked = data.door_locked;
    
    // Always update the updated_at field
    updatedFields.updated_at = new Date();
    
    // Generate the SET clause for the SQL query
    const setClause = Object.keys(updatedFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    // Generate values array for the query
    const values = [data.id, ...Object.values(updatedFields)];
    
    // Execute the update
    await db.query(`
      UPDATE rooms
      SET ${setClause}
      WHERE id = $1
    `, values);
    
    // Update sensor data if provided
    if (data.sensors) {
      const sensors = data.sensors;
      const sensorUpdates = {};
      
      if (sensors.temperature !== undefined) sensorUpdates.temperature = sensors.temperature;
      if (sensors.humidity !== undefined) sensorUpdates.humidity = sensors.humidity;
      if (sensors.pressure !== undefined) sensorUpdates.pressure = sensors.pressure;
      
      if (sensors.lights) {
        if (sensors.lights.bathroom !== undefined) sensorUpdates.light_bathroom = sensors.lights.bathroom;
        if (sensors.lights.bedroom !== undefined) sensorUpdates.light_bedroom = sensors.lights.bedroom;
        if (sensors.lights.hallway !== undefined) sensorUpdates.light_hallway = sensors.lights.hallway;
      }
      
      if (Object.keys(sensorUpdates).length > 0) {
        // Generate SET clause for sensors
        const sensorSetClause = Object.keys(sensorUpdates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        // Generate values array for the query
        const sensorValues = [data.id, ...Object.values(sensorUpdates)];
        
        // Execute the update
        await db.query(`
          UPDATE room_sensors
          SET ${sensorSetClause}
          WHERE room_id = $1
        `, sensorValues);
      }
    }
    
    // Get updated room with sensors for response
    const result = await db.query(`
      SELECT r.*, 
             rs.temperature, rs.humidity, rs.pressure, 
             rs.light_bathroom, rs.light_bedroom, rs.light_hallway
      FROM rooms r
      LEFT JOIN room_sensors rs ON r.id = rs.room_id
      WHERE r.id = $1
    `, [data.id]);
    
    const updatedRoom = result.rows[0];
    
    // Format the response
    const room = {
      id: updatedRoom.id.toString(),
      room_number: updatedRoom.room_number,
      room_type: updatedRoom.room_type,
      status: updatedRoom.status,
      price_per_night: parseFloat(updatedRoom.price_per_night),
      max_guests: updatedRoom.max_guests,
      door_locked: updatedRoom.door_locked,
      created_at: updatedRoom.created_at,
      updated_at: updatedRoom.updated_at,
      sensors: {
        temperature: updatedRoom.temperature ? parseFloat(updatedRoom.temperature) : 22.0,
        humidity: updatedRoom.humidity || 45,
        pressure: updatedRoom.pressure || 1013,
        lights: {
          bathroom: updatedRoom.light_bathroom || false,
          bedroom: updatedRoom.light_bedroom || false,
          hallway: updatedRoom.light_hallway || false
        }
      }
    };
    
    // Get current guests for the room
    const guestsResult = await db.query(`
      SELECT g.id, g.first_name, g.last_name
      FROM guests g
      JOIN guest_room gr ON g.id = gr.guest_id
      WHERE gr.room_id = $1 AND gr.check_out_date IS NULL
    `, [data.id]);
    
    room.guests = guestsResult.rows.map(guest => ({
      id: guest.id.toString(),
      first_name: guest.first_name,
      last_name: guest.last_name
    }));
    
    room.current_guests_count = room.guests.length;
    
    return {
      type: 'update_room',
      payload: room
    };
  } catch (error) {
    console.error('Error updating room:', error);
    return {
      type: 'error',
      payload: { message: `Failed to update room: ${error.message}` }
    };
  }
}

/**
 * Delete a room
 */
async function deleteRoom(data) {
  try {
    // Validate required fields
    if (!data.id) {
      throw new Error('Room ID is required');
    }
    
    // Check if the room exists
    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [data.id]);
    
    if (roomResult.rows.length === 0) {
      throw new Error(`Room with ID ${data.id} not found`);
    }
    
    // Check if there are any active guests in the room
    const guestsResult = await db.query(`
      SELECT COUNT(*) as guest_count
      FROM guest_room
      WHERE room_id = $1 AND check_out_date IS NULL
    `, [data.id]);
    
    if (parseInt(guestsResult.rows[0].guest_count) > 0) {
      throw new Error('Cannot delete room with active guests');
    }
    
    // Delete the room (will cascade to delete associated sensor data)
    await db.query('DELETE FROM rooms WHERE id = $1', [data.id]);
    
    return {
      type: 'delete_room',
      payload: {
        id: data.id,
        success: true,
        message: 'Room successfully deleted'
      }
    };
  } catch (error) {
    console.error('Error deleting room:', error);
    return {
      type: 'error',
      payload: { message: `Failed to delete room: ${error.message}` }
    };
  }
}

module.exports = {
  getRooms,
  addRoom,
  updateRoom,
  deleteRoom
}; 