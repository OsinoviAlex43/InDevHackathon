import type { Room, RoomWithSensors } from '../types/RoomTypes';
import networkAPI from './NetworkAPI';

/**
 * @deprecated This service is deprecated. Use NetworkAPI directly instead.
 * 
 * This service is kept for backward compatibility but will be removed in future versions.
 * It forwards all API requests to the centralized NetworkAPI service.
 */
class RoomAPI {
  private messageHandlers: any = null;

  constructor() {
    console.warn('RoomAPI is deprecated. Use NetworkAPI directly.');
  }

  // Register message handlers
  registerHandlers(handlers: any) {
    this.messageHandlers = handlers;
    
    // Forward handlers to NetworkAPI
    networkAPI.registerHandlers({
      onRoomData: handlers.onInitialData,
      onRoomUpdate: handlers.onRoomUpdate,
      onRoomAdded: handlers.onRoomAdded,
      onRoomDeleted: handlers.onRoomDeleted,
      onError: handlers.onError
    });
  }

  // Connect to WebSocket
  connect() {
    // Forward to NetworkAPI
    networkAPI.connect();
  }

  // Request initial data
  requestInitialData() {
    networkAPI.requestInitialData();
  }

  // Send message through WebSocket
  sendMessage(action: string, data: any): boolean {
    return networkAPI.sendMessage(action, data);
  }

  // Add a room
  addRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): RoomWithSensors | null {
    networkAPI.sendMessage('add_room', room);
    return null; // Real operation is handled by NetworkAPI
  }

  // Update a room
  updateRoom(roomId: bigint, updates: Partial<Room>, currentRoom?: RoomWithSensors): RoomWithSensors | null {
    networkAPI.sendMessage('update_room', { 
      id: roomId, 
      ...updates 
    });
    return null; // Real operation is handled by NetworkAPI
  }

  // Delete a room
  deleteRoom(roomId: bigint): boolean {
    networkAPI.sendMessage('delete_room', { 
      id: roomId 
    });
    return true; // Assume success, real operation is handled by NetworkAPI
  }

  // Check if connected
  isWebSocketConnected(): boolean {
    return networkAPI.isSocketConnected();
  }
}

export default new RoomAPI(); 