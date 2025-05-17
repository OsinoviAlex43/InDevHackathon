import type { Room, RoomWithSensors } from '../types/RoomTypes';
import type { Guest } from '../types/GuestTypes';
import SockJS from 'sockjs-client';

type MessageHandlers = {
  onRoomData?: (rooms: RoomWithSensors[]) => void;
  onRoomUpdate?: (room: RoomWithSensors) => void;
  onRoomAdded?: (room: RoomWithSensors) => void;
  onRoomDeleted?: (roomId: bigint) => void;
  onGuestData?: (guests: Guest[]) => void;
  onGuestUpdate?: (guest: Guest) => void;
  onGuestAdded?: (guest: Guest) => void;
  onGuestDeleted?: (guestId: bigint) => void;
  onError?: () => void;
};

class NetworkAPI {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private messageHandlers: MessageHandlers = {};
  private pendingMessages: { action: string; data: any }[] = [];
  private reconnectTimeout: number | null = null;

  constructor() {
    // SockJS connection will be initialized when needed
  }

  // Register message handlers
  registerHandlers(handlers: MessageHandlers) {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  // Connect to SockJS
  connect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close existing connection if any
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      console.log('Attempting to connect to SockJS...');
      
      // Create SockJS connection
      const sockjs = new SockJS('http://192.168.65.55:8080/ws');
      
      // SockJS implements the WebSocket interface
      this.socket = sockjs;
      
      sockjs.onopen = () => {
        console.log('SockJS connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        // Send any pending messages
        this.flushPendingMessages();
        
        // Request initial data immediately after connection
        this.requestInitialData();
      };
      
      sockjs.onmessage = (event) => {
        try {
          console.log('SockJS message received:', event.data);
          const message = JSON.parse(event.data);
          
          switch (message.action) {
            case 'initial_data':
              if (message.data?.rooms && Array.isArray(message.data.rooms) && this.messageHandlers.onRoomData) {
                const rooms = message.data.rooms.map(this.convertBigInts);
                this.messageHandlers.onRoomData(rooms);
              }
              if (message.data?.guests && Array.isArray(message.data.guests) && this.messageHandlers.onGuestData) {
                const guests = message.data.guests.map(this.convertBigInts);
                this.messageHandlers.onGuestData(guests);
              }
              break;
            case 'update_room':
              if (message.data && this.messageHandlers.onRoomUpdate) {
                const updatedRoom = this.convertBigInts(message.data);
                this.messageHandlers.onRoomUpdate(updatedRoom);
              }
              break;
            case 'add_room':
              if (message.data && this.messageHandlers.onRoomAdded) {
                const newRoom = this.convertBigInts(message.data);
                this.messageHandlers.onRoomAdded(newRoom);
              }
              break;
            case 'delete_room':
              if (message.data?.id && this.messageHandlers.onRoomDeleted) {
                this.messageHandlers.onRoomDeleted(BigInt(message.data.id));
              }
              break;
            case 'update_guest':
              if (message.data && this.messageHandlers.onGuestUpdate) {
                const updatedGuest = this.convertBigInts(message.data);
                this.messageHandlers.onGuestUpdate(updatedGuest);
              }
              break;
            case 'add_guest':
              if (message.data && this.messageHandlers.onGuestAdded) {
                const newGuest = this.convertBigInts(message.data);
                this.messageHandlers.onGuestAdded(newGuest);
              }
              break;
            case 'delete_guest':
              if (message.data?.id && this.messageHandlers.onGuestDeleted) {
                this.messageHandlers.onGuestDeleted(BigInt(message.data.id));
              }
              break;
            default:
              console.log('Unhandled message type:', message.action);
          }
        } catch (error) {
          console.error('Error processing SockJS message:', error);
        }
      };
      
      sockjs.onerror = () => {
        console.info('SockJS error');
        this.handleDisconnect();
      };
      
      sockjs.onclose = () => {
        console.info('SockJS connection closed');
        this.handleDisconnect();
      };
    } catch (error) {
      console.info('Failed to create SockJS connection');
      console.error(error);
      this.handleDisconnect();
    }
  }
  
  // Handle disconnection
  private handleDisconnect() {
    this.isConnected = false;
    this.connectionAttempts += 1;
    
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      // Try to reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 30000);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      
      this.reconnectTimeout = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('Max connection attempts reached, giving up');
      if (this.messageHandlers.onError) {
        this.messageHandlers.onError();
      }
    }
  }
  
  // Helper to convert string IDs to BigInts
  private convertBigInts<T extends { id?: string | bigint }>(obj: T): T {
    if (!obj) return obj;
    
    const result = { ...obj };
    
    // Convert id to BigInt if it's a string
    if (typeof result.id === 'string') {
      result.id = BigInt(result.id);
    }
    
    // Convert room_id to BigInt if present and a string
    if ('room_id' in result && typeof result.room_id === 'string') {
      (result as any).room_id = BigInt(result.room_id);
    }
    
    return result;
  }

  // Send any pending messages
  private flushPendingMessages() {
    if (this.pendingMessages.length > 0 && this.isConnected) {
      console.log(`Sending ${this.pendingMessages.length} pending messages`);
      
      for (const message of this.pendingMessages) {
        this.sendMessage(message.action, message.data);
      }
      
      this.pendingMessages = [];
    }
  }

  // Request initial data
  requestInitialData() {
    this.sendMessage('get_data', {});
  }

  // Send message through SockJS
  sendMessage(action: string, data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Convert BigInt to string before sending
      const preparedData = this.serializeData(data);
      
      const message = JSON.stringify({ action, data: preparedData });
      console.log('Sending SockJS message:', message);
      this.socket.send(message);
      return true;
    } else {
      // Store the message to send when reconnected
      this.pendingMessages.push({ action, data });
      
      // Try to reconnect if not connected
      if (!this.isConnected && this.connectionAttempts < this.maxConnectionAttempts) {
        this.connect();
      }
      return false;
    }
  }
  
  // Helper to convert BigInts to strings for JSON
  private serializeData(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'bigint') {
      return data.toString();
    }
    
    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map((item) => this.serializeData(item));
      }
      
      const result: Record<string, any> = {};
      for (const key in data) {
        result[key] = this.serializeData(data[key]);
      }
      return result;
    }
    
    return data;
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default new NetworkAPI(); 