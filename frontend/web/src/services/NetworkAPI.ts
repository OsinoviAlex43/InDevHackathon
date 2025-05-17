import type { Room, RoomWithSensors } from '../types/RoomTypes';
import type { Guest } from '../types/GuestTypes';
// @ts-ignore - Игнорируем ошибку типа для SockJS
import SockJS from 'sockjs-client';

type MessageHandlers = {
  onRoomData?: (rooms: RoomWithSensors[]) => void;
  onRoomUpdate?: (room: RoomWithSensors) => void;
  onRoomAdded?: (room: RoomWithSensors) => void;
  onRoomDeleted?: (roomId: string, success: boolean, message: string) => void;
  onGuestData?: (guests: Guest[]) => void;
  onGuestUpdate?: (guest: Guest) => void;
  onGuestAdded?: (guest: Guest) => void;
  onGuestDeleted?: (guestId: string, success: boolean, message: string) => void;
  onError?: (message: string) => void;
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
      
      // Create SockJS connection - IP-адрес сервера
      const sockjs = new SockJS('http://192.168.65.110:8080/ws');
      
      // SockJS implements the WebSocket interface
      this.socket = sockjs;
      
      sockjs.onopen = () => {
        console.log('SockJS connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        // Send any pending messages
        this.flushPendingMessages();
        
        // Request initial data immediately after connection
        this.requestRooms();
        this.requestGuests();
      };
      
      sockjs.onmessage = (event: MessageEvent) => {
        try {
          console.log('SockJS message received:', event.data);
          const message = JSON.parse(event.data);
          
          switch (message.action) {
            case 'initial_data':
              if (message.data?.rooms && Array.isArray(message.data.rooms) && this.messageHandlers.onRoomData) {
                this.messageHandlers.onRoomData(message.data.rooms);
              }
              if (message.data?.guests && Array.isArray(message.data.guests) && this.messageHandlers.onGuestData) {
                this.messageHandlers.onGuestData(message.data.guests);
              }
              break;
            case 'add_room':
              if (message.data && this.messageHandlers.onRoomAdded) {
                this.messageHandlers.onRoomAdded(message.data);
              }
              break;
            case 'update_room':
              if (message.data && this.messageHandlers.onRoomUpdate) {
                this.messageHandlers.onRoomUpdate(message.data);
              }
              break;
            case 'delete_room':
              if (message.data && this.messageHandlers.onRoomDeleted) {
                this.messageHandlers.onRoomDeleted(
                  message.data.id,
                  message.data.success,
                  message.data.message
                );
              }
              break;
            case 'update_guest':
              if (message.data && this.messageHandlers.onGuestUpdate) {
                this.messageHandlers.onGuestUpdate(message.data);
              }
              break;
            case 'add_guest':
              if (message.data && this.messageHandlers.onGuestAdded) {
                this.messageHandlers.onGuestAdded(message.data);
              }
              break;
            case 'delete_guest':
              if (message.data && this.messageHandlers.onGuestDeleted) {
                this.messageHandlers.onGuestDeleted(
                  message.data.id,
                  message.data.success,
                  message.data.message
                );
              }
              break;
            case 'error':
              if (message.data && this.messageHandlers.onError) {
                this.messageHandlers.onError(message.data.message);
              }
              console.error('Server error:', message.data.message);
              break;
            default:
              console.log('Unhandled message type:', message.action);
          }
        } catch (error) {
          console.error('Error processing SockJS message:', error);
        }
      };
      
      sockjs.onerror = () => {
        console.error('SockJS connection error');
        this.handleDisconnect();
      };
      
      sockjs.onclose = () => {
        console.info('SockJS connection closed');
        this.handleDisconnect();
      };
    } catch (error) {
      console.error('Failed to create SockJS connection', error);
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
      console.error('Max connection attempts reached, cannot connect to server');
      if (this.messageHandlers.onError) {
        this.messageHandlers.onError('Не удалось подключиться к серверу после нескольких попыток');
      }
    }
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

  // API методы
  
  // Request rooms
  requestRooms() {
    this.sendMessage('get_rooms', {});
  }
  
  // Request guests
  requestGuests() {
    this.sendMessage('get_guests', {});
  }
  
  // Add a new room
  addRoom(roomNumber: string, roomType: string, status: string, pricePerNight: number, maxGuests?: number) {
    this.sendMessage('add_room', {
      room_number: roomNumber,
      room_type: roomType,
      status: status,
      price_per_night: pricePerNight,
      max_guests: maxGuests
    });
  }
  
  // Update room status
  updateRoom(roomId: string, status: string) {
    this.sendMessage('update_room', {
      id: roomId,
      status: status
    });
  }
  
  // Delete a room
  deleteRoom(roomId: string) {
    this.sendMessage('delete_room', {
      id: roomId
    });
  }
  
  // Add a new guest
  addGuest(firstName: string, lastName: string, email: string, phone: string) {
    this.sendMessage('add_guest', {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone
    });
  }
  
  // Update guest data
  updateGuest(guestId: string, updates: Partial<Guest>) {
    this.sendMessage('update_guest', {
      id: guestId,
      ...updates
    });
  }
  
  // Check in guest to room
  checkInGuest(guestId: string, roomId: string, checkInDate?: string) {
    this.sendMessage('update_guest', {
      id: guestId,
      room_id: roomId,
      check_in_date: checkInDate
    });
  }
  
  // Check out guest from room
  checkOutGuest(guestId: string, checkOutDate?: string) {
    this.sendMessage('update_guest', {
      id: guestId,
      room_id: null,
      check_out_date: checkOutDate
    });
  }
  
  // Delete a guest
  deleteGuest(guestId: string) {
    this.sendMessage('delete_guest', {
      id: guestId
    });
  }
  
  // Assign multiple guests to a room
  assignMultipleGuests(roomId: string, guestIds: string[], checkInDate?: string) {
    this.sendMessage('assign_multiple_guests', {
      room_id: roomId,
      guest_ids: guestIds,
      check_in_date: checkInDate
    });
  }

  // Send message through SockJS
  sendMessage(action: string, data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, data });
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

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default new NetworkAPI(); 