/**
 * API Services Index
 * 
 * This file exports all API services for the hotel management system.
 * Each API module is responsible for a specific domain (rooms, guests, etc.)
 * and follows consistent patterns for data fetching, creation, updates, and deletion.
 */

export { default as RoomAPI } from './RoomAPI';
export { default as GuestAPI } from './GuestAPI';
export { default as WebSocketService } from './WebSocketService';
export { default as ConfigAPI } from './ConfigAPI'; 