const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Log environment variables for debugging connection issues
console.log('Using PostgreSQL connection settings:');
console.log('- User:', process.env.PGUSER || 'postgres');
console.log('- Host:', process.env.PGHOST || 'localhost');
console.log('- Database:', process.env.PGDATABASE || 'postgres');
console.log('- Password:', process.env.PGPASSWORD ? '********' : 'default password');
console.log('- Port:', process.env.PGPORT || 5432);

// Create a connection pool to PostgreSQL with better connection settings
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'postgres',
  password: process.env.PGPASSWORD || 'fufiq',
  port: process.env.PGPORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

let connectedToDatabase = false;

// Test the connection 
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  connectedToDatabase = true;
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  connectedToDatabase = false;
  
  // Don't exit the process - allow the application to continue
  // but in a read-only state if needed
  console.log('Database connection lost. Operating in memory-only mode.');
});

// SQL for creating tables if they don't exist
const createTablesSQL = `
-- Create rooms table if not exists
CREATE TABLE IF NOT EXISTS rooms (
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

-- Create room sensors table for IoT data if not exists
CREATE TABLE IF NOT EXISTS room_sensors (
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

-- Create guests table if not exists
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create guest_room association table if not exists
CREATE TABLE IF NOT EXISTS guest_room (
  id SERIAL PRIMARY KEY,
  guest_id INT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in_date TIMESTAMP NOT NULL DEFAULT NOW(),
  check_out_date TIMESTAMP,
  UNIQUE(guest_id, room_id, check_in_date)
);
`;

// Initialize the database - create tables if they don't exist
async function initDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('Initializing database structure...');
    await client.query(createTablesSQL);
    console.log('Database structure initialized');
    return true;
  } catch (err) {
    console.error('Error initializing database:', err);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Wrap query to handle connection errors gracefully
async function query(text, params) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Execute a transaction with multiple queries
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Get a client from the pool with error handling
async function getClient() {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    console.error('Error getting database client:', err);
    throw err;
  }
}

// Check if connected to database
function isConnected() {
  return connectedToDatabase;
}

// Initialize database on module load
initDatabase().then(success => {
  if (success) {
    console.log('Database is ready');
  } else {
    console.log('Will operate in memory-only mode due to database initialization failure');
  }
});

module.exports = {
  query,
  getClient,
  isConnected,
  initDatabase,
  transaction
}; 