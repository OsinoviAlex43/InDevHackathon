-- Тестовые данные для таблицы admins
INSERT INTO admins (username, password_hash, full_name, email, created_at, updated_at)
VALUES 
('admin', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Администратор Системы', 'admin@hotel.com', NOW(), NOW()),
('manager', '$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Менеджер Отеля', 'manager@hotel.com', NOW(), NOW());

-- Тестовые данные для таблицы rooms
INSERT INTO rooms (room_number, room_type, status, price_per_night, created_at, updated_at)
VALUES 
('101', 'STANDARD', 'AVAILABLE', 100.00, NOW(), NOW()),
('102', 'STANDARD', 'AVAILABLE', 100.00, NOW(), NOW()),
('201', 'DELUXE', 'AVAILABLE', 150.00, NOW(), NOW()),
('202', 'DELUXE', 'OCCUPIED', 150.00, NOW(), NOW()),
('301', 'SUITE', 'AVAILABLE', 250.00, NOW(), NOW()),
('302', 'SUITE', 'MAINTENANCE', 250.00, NOW(), NOW());

-- Тестовые данные для таблицы guests
INSERT INTO guests (first_name, last_name, email, phone, room_id, check_in_date, check_out_date, created_at, updated_at)
VALUES 
('Иван', 'Иванов', 'ivanov@mail.ru', '+7-999-123-45-67', 
 (SELECT id FROM rooms WHERE room_number = '202'), 
 CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 
 NOW(), NOW()),
 
('Анна', 'Петрова', 'petrova@mail.ru', '+7-999-765-43-21', 
 (SELECT id FROM rooms WHERE room_number = '202'), 
 CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '4 days', 
 NOW(), NOW()); 