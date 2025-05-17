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
  onConnection?: (status: string, timestamp: string) => void;
};

class NetworkAPI {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private messageHandlers: MessageHandlers = {};
  private pendingMessages: { type: string; payload: any }[] = [];
  private reconnectTimeout: number | null = null;
  private initialDataRequested = false;

  constructor() {
    // WebSocket connection will be initialized when needed
  }

  // Register message handlers
  registerHandlers(handlers: MessageHandlers) {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  // Connect to WebSocket
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
      console.log('Attempting to connect to WebSocket...');
      
      // Create WebSocket connection - use localhost for development
      const webSocket = new WebSocket('ws://localhost:8080');
      
      this.socket = webSocket;
      
      webSocket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        // Send any pending messages
        this.flushPendingMessages();
        
        // Request initial data only once after connection
        if (!this.initialDataRequested) {
          this.requestRooms();
          this.requestGuests();
          this.initialDataRequested = true;
        }
      };
      
      webSocket.onmessage = (event: MessageEvent) => {
        try {
          console.log('WebSocket message received:', event.data);
          const message = JSON.parse(event.data);
          
          // Handle the different message types based on type field
          switch (message.type) {
            case 'connection':
              if (message.payload && this.messageHandlers.onConnection) {
                this.messageHandlers.onConnection(
                  message.payload.status,
                  message.payload.timestamp
                );
              }
              break;
            case 'initial_data':
              if (message.payload?.rooms && Array.isArray(message.payload.rooms) && this.messageHandlers.onRoomData) {
                this.messageHandlers.onRoomData(message.payload.rooms);
              }
              if (message.payload?.guests && Array.isArray(message.payload.guests) && this.messageHandlers.onGuestData) {
                this.messageHandlers.onGuestData(message.payload.guests);
              }
              break;
            case 'get_rooms':
              // Handle get_rooms response - this is the list of all rooms
              if (Array.isArray(message.payload) && this.messageHandlers.onRoomData) {
                this.messageHandlers.onRoomData(message.payload);
              }
              break;
            case 'get_room':
              if (message.payload && this.messageHandlers.onRoomUpdate) {
                this.messageHandlers.onRoomUpdate(message.payload);
              }
              break;
            case 'get_guests':
              // Handle get_guests response - this is the list of all guests
              if (Array.isArray(message.payload) && this.messageHandlers.onGuestData) {
                this.messageHandlers.onGuestData(message.payload);
              }
              break;
            case 'add_room':
              if (message.payload && this.messageHandlers.onRoomAdded) {
                this.messageHandlers.onRoomAdded(message.payload);
              }
              break;
            case 'update_room':
              if (message.payload && this.messageHandlers.onRoomUpdate) {
                this.messageHandlers.onRoomUpdate(message.payload);
              }
              break;
            case 'delete_room':
              if (message.payload && this.messageHandlers.onRoomDeleted) {
                this.messageHandlers.onRoomDeleted(
                  message.payload.id,
                  message.payload.success,
                  message.payload.message
                );
              }
              break;
            case 'update_guest':
              if (message.payload && this.messageHandlers.onGuestUpdate) {
                this.messageHandlers.onGuestUpdate(message.payload);
              }
              break;
            case 'add_guest':
              if (message.payload && this.messageHandlers.onGuestAdded) {
                this.messageHandlers.onGuestAdded(message.payload);
              }
              break;
            case 'delete_guest':
              if (message.payload && this.messageHandlers.onGuestDeleted) {
                this.messageHandlers.onGuestDeleted(
                  message.payload.id,
                  message.payload.success,
                  message.payload.message
                );
              }
              break;
            case 'error':
              if (message.payload && this.messageHandlers.onError) {
                this.messageHandlers.onError(message.payload.message);
              }
              console.error('Server error:', message.payload.message);
              break;
            default:
              console.log('Unhandled message type:', message.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      webSocket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        this.handleDisconnect();
      };
      
      webSocket.onclose = () => {
        console.info('WebSocket connection closed');
        this.handleDisconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection', error);
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
        this.sendMessage(message.type, message.payload);
      }
      
      this.pendingMessages = [];
    }
  }

  // API методы
  
  // Request rooms
  requestRooms() {
    this.sendMessage('get_rooms', {});
  }
  
  // Request a single room by ID
  requestRoom(roomId: string) {
    console.log(`Requesting room with ID: ${roomId}`);
    
    // Сначала попробуем получить через WebSocket
    this.sendMessage('get_room', { id: roomId });
    
    // В качестве запасного варианта, сделаем прямой HTTP запрос к бэкенду
    // Это поможет в случаях, если WebSocket соединение проблемное
    setTimeout(() => {
      fetch(`http://localhost:8080/api/rooms/${roomId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Received room data via HTTP:', data);
          // Вызываем тот же обработчик, что и при получении данных через WebSocket
          if (data && this.messageHandlers.onRoomUpdate) {
            this.messageHandlers.onRoomUpdate(data);
          }
        })
        .catch(error => {
          console.error('Failed to fetch room via HTTP:', error);
        });
    }, 500); // Задержка, чтобы дать WebSocket время ответить первым
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

  // Update room sensor value
  updateRoomSensor(roomId: string, sensorType: 'temperature' | 'humidity' | 'pressure', value: number) {
    this.sendMessage('update_room', {
      id: roomId,
      sensors: {
        [sensorType]: value
      }
    });
  }

  // Update room light status
  updateRoomLight(roomId: string, lightType: 'bathroom' | 'bedroom' | 'hallway', value: boolean) {
    this.sendMessage('update_room', {
      id: roomId,
      sensors: {
        lights: {
          [lightType]: value
        }
      }
    });
  }

  // Send message through WebSocket
  sendMessage(type: string, payload: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      console.log('Sending WebSocket message:', message);
      this.socket.send(message);
      return true;
    } else {
      // Store the message to send when reconnected
      this.pendingMessages.push({ type, payload });
      
      // Try to reconnect if not connected
      if (!this.isConnected && this.connectionAttempts < this.maxConnectionAttempts) {
        this.connect();
      }
      return false;
    }
  }

  // Send door open request to the mock server
  openDoor() {
    console.log('Sending door open request to mock server');
    try {
      fetch('http://192.168.65.110:8000/open_door', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Door open response:', data);
      })
      .catch(error => {
        console.error('Door open request failed:', error);
        if (this.messageHandlers.onError) {
          this.messageHandlers.onError(`Door open request failed: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('Failed to send door open request:', error);
    }
  }

  // Send door close request to the mock server
  closeDoor() {
    console.log('Sending door close request to mock server');
    try {
      fetch('http://192.168.65.110:8000/close_door', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Door close response:', data);
      })
      .catch(error => {
        console.error('Door close request failed:', error);
        if (this.messageHandlers.onError) {
          this.messageHandlers.onError(`Door close request failed: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('Failed to send door close request:', error);
    }
  }

  // Send light on request to the mock server
  turnLightOn() {
    console.log('Sending light on request to mock server');
    try {
      fetch('http://192.168.65.110:8000/light_on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Light on response:', data);
      })
      .catch(error => {
        console.error('Light on request failed:', error);
        if (this.messageHandlers.onError) {
          this.messageHandlers.onError(`Light on request failed: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('Failed to send light on request:', error);
    }
  }

  // Send light off request to the mock server
  turnLightOff() {
    console.log('Sending light off request to mock server');
    try {
      fetch('http://192.168.65.110:8000/light_off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Light off response:', data);
      })
      .catch(error => {
        console.error('Light off request failed:', error);
        if (this.messageHandlers.onError) {
          this.messageHandlers.onError(`Light off request failed: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('Failed to send light off request:', error);
    }
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default new NetworkAPI(); 