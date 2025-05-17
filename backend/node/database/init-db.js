require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'hotel_management',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// SQL statements to create tables
const createTables = `
-- Drop tables if they exist (for clean initialization)
DROP TABLE IF EXISTS guest_room;
DROP TABLE IF EXISTS room_sensors;
DROP TABLE IF EXISTS guests;
DROP TABLE IF EXISTS rooms;

-- Create rooms table
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  room_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'free',
  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests INT NOT NULL DEFAULT 2,
  door_locked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create room sensors table for IoT data
CREATE TABLE room_sensors (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 2),
  humidity INT,
  pressure INT,
  light_bathroom BOOLEAN DEFAULT false,
  light_bedroom BOOLEAN DEFAULT false,
  light_hallway BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create guests table
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  check_in_date TIMESTAMP,
  check_out_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create guest_room association table
CREATE TABLE guest_room (
  id SERIAL PRIMARY KEY,
  guest_id INT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in_date TIMESTAMP NOT NULL DEFAULT NOW(),
  check_out_date TIMESTAMP,
  UNIQUE(guest_id, room_id, check_in_date)
);
`;

// Sample data to initialize the database
const insertSampleData = `
-- Insert sample rooms
INSERT INTO rooms (room_number, room_type, status, price_per_night, max_guests, door_locked)
VALUES 
  ('101', 'standart', 'free', 100.00, 2, true),
  ('102', 'standart', 'free', 100.00, 2, true),
  ('103', 'standart', 'free', 100.00, 2, true),
  ('104', 'deluxe', 'free', 200.00, 3, true),
  ('105', 'suite', 'free', 300.00, 4, true);

-- Insert sample room sensors data
INSERT INTO room_sensors (room_id, temperature, humidity, pressure, light_bathroom, light_bedroom, light_hallway)
VALUES 
  (1, 22.5, 45, 1013, false, false, false),
  (2, 23.0, 46, 1013, false, false, false),
  (3, 23.5, 47, 1013, false, false, false),
  (4, 24.0, 48, 1013, false, false, false),
  (5, 24.5, 49, 1013, false, false, false);

-- Insert sample guests
INSERT INTO guests (first_name, last_name, email, phone)
VALUES 
  ('John', 'Doe', 'john.doe@example.com', '+1234567890'),
  ('Jane', 'Smith', 'jane.smith@example.com', '+0987654321'),
  ('Bob', 'Johnson', 'bob.johnson@example.com', '+1122334455');
`;

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Connect to PostgreSQL
    const client = await pool.connect();
    
    // Create tables
    console.log('Creating tables...');
    await client.query(createTables);
    
    // Insert sample data
    console.log('Inserting sample data...');
    await client.query(insertSampleData);
    
    console.log('Database initialization completed successfully!');
    
    // Release the client back to the pool
    client.release();
    
    // Close pool connection
    await pool.end();
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initDatabase(); 