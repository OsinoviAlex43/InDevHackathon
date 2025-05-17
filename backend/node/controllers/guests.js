const db = require('../database/db');

/**
 * Get all guests with their associated room data
 */
async function getGuests() {
  try {
    const result = await db.query(`
      SELECT g.*, 
             gr.room_id,
             gr.check_in_date,
             gr.check_out_date
      FROM guests g
      LEFT JOIN (
        SELECT guest_id, room_id, check_in_date, check_out_date
        FROM guest_room
        WHERE check_out_date IS NULL
        OR check_out_date = (
          SELECT MAX(check_out_date)
          FROM guest_room gr2
          WHERE gr2.guest_id = guest_room.guest_id
        )
      ) gr ON g.id = gr.guest_id
      ORDER BY g.last_name, g.first_name
    `);
    
    // Format guests data
    const guests = result.rows.map(row => ({
      id: row.id.toString(),
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      room_id: row.room_id ? row.room_id.toString() : null,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    return {
      type: 'initial_data',
      payload: { guests }
    };
  } catch (error) {
    console.error('Error fetching guests:', error);
    return {
      type: 'error',
      payload: { message: 'Failed to fetch guests' }
    };
  }
}

/**
 * Add a new guest
 */
async function addGuest(data) {
  try {
    // Validate required fields
    if (!data.first_name || !data.last_name || !data.email || !data.phone) {
      throw new Error('Missing required fields');
    }
    
    // Insert the guest
    const result = await db.query(`
      INSERT INTO guests (first_name, last_name, email, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      data.first_name,
      data.last_name,
      data.email,
      data.phone
    ]);
    
    // Format the response
    const guest = {
      id: result.rows[0].id.toString(),
      first_name: result.rows[0].first_name,
      last_name: result.rows[0].last_name,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      room_id: null,
      check_in_date: null,
      check_out_date: null,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at
    };
    
    return {
      type: 'add_guest',
      payload: guest
    };
  } catch (error) {
    console.error('Error adding guest:', error);
    return {
      type: 'error',
      payload: { message: `Failed to add guest: ${error.message}` }
    };
  }
}

/**
 * Update a guest
 */
async function updateGuest(data) {
  try {
    // Validate required fields
    if (!data.id) {
      throw new Error('Guest ID is required');
    }
    
    // Get current guest data
    const guestResult = await db.query('SELECT * FROM guests WHERE id = $1', [data.id]);
    
    if (guestResult.rows.length === 0) {
      throw new Error(`Guest with ID ${data.id} not found`);
    }
    
    const currentGuest = guestResult.rows[0];
    
    // Start a transaction for guest updates and room associations
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Update guest information if provided
      const updatedFields = {};
      
      if (data.first_name) updatedFields.first_name = data.first_name;
      if (data.last_name) updatedFields.last_name = data.last_name;
      if (data.email) updatedFields.email = data.email;
      if (data.phone) updatedFields.phone = data.phone;
      
      // Always update the updated_at field
      updatedFields.updated_at = new Date();
      
      if (Object.keys(updatedFields).length > 0) {
        // Generate the SET clause for the SQL query
        const setClause = Object.keys(updatedFields)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        // Generate values array for the query
        const values = [data.id, ...Object.values(updatedFields)];
        
        // Execute the update
        await client.query(`
          UPDATE guests
          SET ${setClause}
          WHERE id = $1
        `, values);
      }
      
      // Handle room assignment
      if (data.room_id !== undefined) {
        // Get current room assignment
        const currentRoomResult = await client.query(`
          SELECT room_id, check_in_date
          FROM guest_room
          WHERE guest_id = $1 AND check_out_date IS NULL
        `, [data.id]);
        
        const currentRoomId = currentRoomResult.rows.length > 0 ? currentRoomResult.rows[0].room_id : null;
        
        if (data.room_id === null) {
          // Check out guest from current room
          if (currentRoomId) {
            const checkOutDate = data.check_out_date ? new Date(data.check_out_date) : new Date();
            
            await client.query(`
              UPDATE guest_room
              SET check_out_date = $1
              WHERE guest_id = $2 AND room_id = $3 AND check_out_date IS NULL
            `, [checkOutDate, data.id, currentRoomId]);
            
            // Update room status to available
            const activeGuestsResult = await client.query(`
              SELECT COUNT(*) as count
              FROM guest_room
              WHERE room_id = $1 AND check_out_date IS NULL AND guest_id != $2
            `, [currentRoomId, data.id]);
            
            if (parseInt(activeGuestsResult.rows[0].count) === 0) {
              await client.query(`
                UPDATE rooms
                SET status = 'free', updated_at = NOW()
                WHERE id = $1
              `, [currentRoomId]);
            }
          }
        } else if (data.room_id !== currentRoomId) {
          // Check out from current room if any
          if (currentRoomId) {
            await client.query(`
              UPDATE guest_room
              SET check_out_date = NOW()
              WHERE guest_id = $1 AND room_id = $2 AND check_out_date IS NULL
            `, [data.id, currentRoomId]);
            
            // Update old room status if needed
            const activeGuestsResult = await client.query(`
              SELECT COUNT(*) as count
              FROM guest_room
              WHERE room_id = $1 AND check_out_date IS NULL AND guest_id != $2
            `, [currentRoomId, data.id]);
            
            if (parseInt(activeGuestsResult.rows[0].count) === 0) {
              await client.query(`
                UPDATE rooms
                SET status = 'free', updated_at = NOW()
                WHERE id = $1
              `, [currentRoomId]);
            }
          }
          
          // Check if the new room exists
          const roomResult = await client.query(`
            SELECT id, status, max_guests
            FROM rooms
            WHERE id = $1
          `, [data.room_id]);
          
          if (roomResult.rows.length === 0) {
            throw new Error(`Room with ID ${data.room_id} not found`);
          }
          
          // Check if the room is at capacity
          const activeGuestsResult = await client.query(`
            SELECT COUNT(*) as count
            FROM guest_room
            WHERE room_id = $1 AND check_out_date IS NULL
          `, [data.room_id]);
          
          const guestCount = parseInt(activeGuestsResult.rows[0].count);
          const maxGuests = roomResult.rows[0].max_guests;
          
          if (guestCount >= maxGuests) {
            throw new Error(`Room ${data.room_id} is at maximum capacity (${maxGuests} guests)`);
          }
          
          // Check in guest to new room
          const checkInDate = data.check_in_date ? new Date(data.check_in_date) : new Date();
          
          await client.query(`
            INSERT INTO guest_room (guest_id, room_id, check_in_date)
            VALUES ($1, $2, $3)
          `, [data.id, data.room_id, checkInDate]);
          
          // Update room status to occupied
          await client.query(`
            UPDATE rooms
            SET status = 'occupied', updated_at = NOW()
            WHERE id = $1
          `, [data.room_id]);
        }
      }
      
      await client.query('COMMIT');
      
      // Get updated guest data with room information
      const result = await db.query(`
        SELECT g.*, 
               gr.room_id,
               gr.check_in_date,
               gr.check_out_date
        FROM guests g
        LEFT JOIN (
          SELECT guest_id, room_id, check_in_date, check_out_date
          FROM guest_room
          WHERE guest_id = $1 AND check_out_date IS NULL
        ) gr ON g.id = gr.guest_id
        WHERE g.id = $1
      `, [data.id]);
      
      // Format the response
      const guest = {
        id: result.rows[0].id.toString(),
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        room_id: result.rows[0].room_id ? result.rows[0].room_id.toString() : null,
        check_in_date: result.rows[0].check_in_date,
        check_out_date: result.rows[0].check_out_date,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at
      };
      
      return {
        type: 'update_guest',
        payload: guest
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
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
}

/**
 * Delete a guest
 */
async function deleteGuest(data) {
  try {
    // Validate required fields
    if (!data.id) {
      throw new Error('Guest ID is required');
    }
    
    // Check if the guest exists
    const guestResult = await db.query('SELECT * FROM guests WHERE id = $1', [data.id]);
    
    if (guestResult.rows.length === 0) {
      throw new Error(`Guest with ID ${data.id} not found`);
    }
    
    // Start a transaction
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Get current room assignment
      const roomResult = await client.query(`
        SELECT room_id
        FROM guest_room
        WHERE guest_id = $1 AND check_out_date IS NULL
      `, [data.id]);
      
      const roomId = roomResult.rows.length > 0 ? roomResult.rows[0].room_id : null;
      
      // Delete guest (cascades to delete guest_room entries)
      await client.query('DELETE FROM guests WHERE id = $1', [data.id]);
      
      // Update room status if needed
      if (roomId) {
        const activeGuestsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM guest_room
          WHERE room_id = $1 AND check_out_date IS NULL
        `, [roomId]);
        
        if (parseInt(activeGuestsResult.rows[0].count) === 0) {
          await client.query(`
            UPDATE rooms
            SET status = 'free', updated_at = NOW()
            WHERE id = $1
          `, [roomId]);
        }
      }
      
      await client.query('COMMIT');
      
      return {
        type: 'delete_guest',
        payload: {
          id: data.id,
          success: true,
          message: 'Guest successfully deleted'
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
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
}

/**
 * Assign multiple guests to a room
 */
async function assignMultipleGuests(data) {
  try {
    // Validate required fields
    if (!data.room_id || !data.guest_ids || !Array.isArray(data.guest_ids) || data.guest_ids.length === 0) {
      throw new Error('Room ID and guest IDs array are required');
    }
    
    // Check if the room exists
    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [data.room_id]);
    
    if (roomResult.rows.length === 0) {
      throw new Error(`Room with ID ${data.room_id} not found`);
    }
    
    const room = roomResult.rows[0];
    
    // Check if there are too many guests for the room
    if (data.guest_ids.length > room.max_guests) {
      throw new Error(`Room ${room.room_number} can only accommodate ${room.max_guests} guests`);
    }
    
    // Start a transaction
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Check out any current guests in the room
      await client.query(`
        UPDATE guest_room
        SET check_out_date = NOW()
        WHERE room_id = $1 AND check_out_date IS NULL
      `, [data.room_id]);
      
      // Set check-in date
      const checkInDate = data.check_in_date ? new Date(data.check_in_date) : new Date();
      
      // Check in each guest
      for (const guestId of data.guest_ids) {
        // Verify the guest exists
        const guestResult = await client.query('SELECT * FROM guests WHERE id = $1', [guestId]);
        
        if (guestResult.rows.length === 0) {
          throw new Error(`Guest with ID ${guestId} not found`);
        }
        
        // Check out the guest from any current room
        await client.query(`
          UPDATE guest_room
          SET check_out_date = NOW()
          WHERE guest_id = $1 AND check_out_date IS NULL
        `, [guestId]);
        
        // Check the guest into this room
        await client.query(`
          INSERT INTO guest_room (guest_id, room_id, check_in_date)
          VALUES ($1, $2, $3)
        `, [guestId, data.room_id, checkInDate]);
      }
      
      // Update room status
      await client.query(`
        UPDATE rooms
        SET status = 'occupied', updated_at = NOW()
        WHERE id = $1
      `, [data.room_id]);
      
      await client.query('COMMIT');
      
      // Get updated room with guest information
      const updatedRoomResult = await db.query(`
        SELECT r.*, 
               rs.temperature, rs.humidity, rs.pressure, 
               rs.light_bathroom, rs.light_bedroom, rs.light_hallway
        FROM rooms r
        LEFT JOIN room_sensors rs ON r.id = rs.room_id
        WHERE r.id = $1
      `, [data.room_id]);
      
      const updatedRoom = updatedRoomResult.rows[0];
      
      // Get guests for the room
      const guestsResult = await db.query(`
        SELECT g.id, g.first_name, g.last_name
        FROM guests g
        JOIN guest_room gr ON g.id = gr.guest_id
        WHERE gr.room_id = $1 AND gr.check_out_date IS NULL
      `, [data.room_id]);
      
      // Format the response
      const response = {
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
        },
        guests: guestsResult.rows.map(guest => ({
          id: guest.id.toString(),
          first_name: guest.first_name,
          last_name: guest.last_name
        })),
        current_guests_count: guestsResult.rows.length
      };
      
      return {
        type: 'assign_multiple_guests',
        payload: {
          success: true,
          room_id: data.room_id,
          assigned_guests: data.guest_ids.length,
          updated_room: response
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error assigning guests:', error);
    return {
      type: 'error',
      payload: { message: `Failed to assign guests: ${error.message}` }
    };
  }
}

module.exports = {
  getGuests,
  addGuest,
  updateGuest,
  deleteGuest,
  assignMultipleGuests
}; 