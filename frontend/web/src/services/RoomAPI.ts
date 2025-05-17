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
    networkAPI.requestRooms();
  }

  // Send message through WebSocket
  sendMessage(action: string, data: any): boolean {
    return networkAPI.sendMessage(action, data);
  }

  // Update a room
  updateRoom(roomId: string, status: string): RoomWithSensors | null {
    networkAPI.updateRoom(roomId, status);
    return null; // Real operation is handled by NetworkAPI
  }

  // Check if connected
  isWebSocketConnected(): boolean {
    return networkAPI.isSocketConnected();
  }
}

export default new RoomAPI(); 