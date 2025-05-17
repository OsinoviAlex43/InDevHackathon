-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS guest_room CASCADE;
DROP TABLE IF EXISTS room_sensors CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

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

-- Insert sample rooms
INSERT INTO rooms (room_number, room_type, status, price_per_night, max_guests, door_locked)
VALUES 
  ('101', 'standard', 'free', 100.00, 2, true),
  ('102', 'standard', 'free', 100.00, 2, true),
  ('103', 'standard', 'occupied', 100.00, 2, false),
  ('104', 'deluxe', 'free', 200.00, 3, true),
  ('105', 'suite', 'occupied', 300.00, 4, false);

-- Insert room sensors
INSERT INTO room_sensors (room_id, temperature, humidity, pressure, light_bathroom, light_bedroom, light_hallway)
VALUES
  (1, 22.5, 45, 1013, false, false, false),
  (2, 23.0, 46, 1013, false, false, false),
  (3, 23.5, 47, 1013, true, true, false),
  (4, 24.0, 48, 1013, false, false, false),
  (5, 24.5, 49, 1013, true, false, true);

-- Insert sample guests
INSERT INTO guests (first_name, last_name, email, phone)
VALUES
  ('John', 'Doe', 'john.doe@example.com', '+1234567890'),
  ('Jane', 'Smith', 'jane.smith@example.com', '+0987654321'),
  ('Bob', 'Johnson', 'bob.johnson@example.com', '+1122334455'),
  ('Alice', 'Williams', 'alice.williams@example.com', '+2233445566'),
  ('Charlie', 'Brown', 'charlie.brown@example.com', '+3344556677');

-- Check in guests to rooms
INSERT INTO guest_room (guest_id, room_id, check_in_date, check_out_date)
VALUES
  (1, 3, NOW() - INTERVAL '2 days', NULL), -- John Doe in room 103
  (2, 3, NOW() - INTERVAL '2 days', NULL), -- Jane Smith in room 103 
  (3, 5, NOW() - INTERVAL '1 day', NULL),  -- Bob Johnson in room 105
  (4, 5, NOW() - INTERVAL '1 day', NULL),  -- Alice Williams in room 105
  (5, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'); -- Charlie checked out

-- Update occupied rooms status
UPDATE rooms
SET status = 'occupied'
WHERE id IN (3, 5); 