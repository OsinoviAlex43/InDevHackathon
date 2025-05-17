/**
 * Guest API Service
 * 
 * This service handles all the guest-related API communication including:
 * - Fetching guests
 * - Creating, updating and deleting guests
 * - Check-in and check-out operations
 * - Filtering and searching
 * 
 * Uses WebSocketService for real-time data synchronization.
 */

import type { Guest, GuestFilters, CreateGuestData } from '../../types/GuestTypes';
import { ConnectionState } from './WebSocketService';

/**
 * Guest API class for handling all guest-related API operations
 */
class GuestAPI {
  private baseUrl: string = 'http://localhost:8080/api/guests';
  private endpoint: string = 'guests';
  
  /**
   * Register a message handler for guest data
   */
  public registerHandler(action: string, handler: (data: any) => void): void {
    import('./WebSocketService').then(({ default: ws }) => {
      ws.registerHandler(action, handler);
    });
  }
  
  /**
   * Unregister a message handler
   */
  public unregisterHandler(action: string, handler?: (data: any) => void): void {
    import('./WebSocketService').then(({ default: ws }) => {
      ws.unregisterHandler(action, handler);
    });
  }
  
  /**
   * Request initial guest data
   */
  public fetchAllGuests(): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('get_guests');
    });
  }
  
  /**
   * Fetch guests with filters
   */
  public fetchGuestsWithFilters(filters: GuestFilters): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('get_guests_filtered', filters);
    });
  }
  
  /**
   * Create a new guest
   */
  public createGuest(guestData: CreateGuestData): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('add_guest', guestData);
    });
  }
  
  /**
   * Update an existing guest
   */
  public updateGuest(guestId: bigint, updates: Partial<Guest>): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('update_guest', { 
        id: guestId.toString(), 
        ...updates 
      });
    });
  }
  
  /**
   * Delete a guest
   */
  public deleteGuest(guestId: bigint): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('delete_guest', { 
        id: guestId.toString() 
      });
    });
  }
  
  /**
   * Check in a guest to a room
   */
  public checkInGuest(guestId: bigint, roomId: bigint): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('update_guest', { 
        id: guestId.toString(),
        room_id: roomId.toString(),
        check_in_date: new Date().toISOString() 
      });
    });
  }
  
  /**
   * Check out a guest from a room
   */
  public checkOutGuest(guestId: bigint): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('update_guest', { 
        id: guestId.toString(),
        room_id: null,
        check_out_date: new Date().toISOString() 
      });
    });
  }
  
  /**
   * Assign multiple guests to a room
   */
  public assignGuestsToRoom(guestIds: bigint[], roomId: bigint): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('assign_multiple_guests', { 
        guest_ids: guestIds.map(id => id.toString()),
        room_id: roomId.toString(),
        check_in_date: new Date().toISOString()
      });
    });
  }
  
  /**
   * Remove a guest from a room
   */
  public removeGuestFromRoom(guestId: bigint): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('update_guest', { 
        id: guestId.toString(),
        room_id: null
      });
    });
  }
  
  /**
   * Get guests assigned to a specific room
   */
  public getGuestsByRoom(roomId: bigint): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.sendMessage('get_guests_by_room', {
        room_id: roomId.toString()
      });
    });
  }
  
  /**
   * Check if connected to WebSocket
   */
  public isConnected(): Promise<boolean> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.isConnected();
    });
  }
  
  /**
   * Get connection state
   */
  public getConnectionState(): Promise<ConnectionState> {
    return import('./WebSocketService').then(({ default: ws }) => {
      return ws.getConnectionState();
    });
  }
}

export default new GuestAPI(); 