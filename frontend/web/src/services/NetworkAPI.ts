import type { Room, RoomWithSensors } from '../types/RoomTypes';
import type { Guest } from '../types/GuestTypes';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';

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
  private stompClient: Client | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private messageHandlers: MessageHandlers = {};
  private pendingMessages: { action: string; data: any }[] = [];
  private reconnectTimeout: number | null = null;

  constructor() {
    // STOMP client will be initialized when needed
  }

  // Register message handlers
  registerHandlers(handlers: MessageHandlers) {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  // Connect to WebSocket server
  connect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close existing connection if any
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
    }
    
    try {
      console.log('Attempting to connect to WebSocket server...');
      
      // Create new STOMP client
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        debug: (str) => {
          console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });
      
      // Setup connection event handlers
      this.stompClient.onConnect = (frame) => {
        console.log('STOMP Connected:', frame);
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        // Subscribe to topic for messages
        this.stompClient?.subscribe('/topic/messages', (message: IMessage) => {
          this.handleIncomingMessage(message);
        });
        
        // Send any pending messages
        this.flushPendingMessages();
        
        // Request initial data immediately after connection
        this.requestInitialData();
      };
      
      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        this.handleDisconnect();
      };
      
      this.stompClient.onWebSocketClose = () => {
        console.info('WebSocket connection closed');
        this.handleDisconnect();
      };
      
      this.stompClient.onWebSocketError = (event) => {
        console.error('WebSocket error:', event);
        this.handleDisconnect();
      };
      
      // Activate connection
      this.stompClient.activate();
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.handleDisconnect();
    }
  }
  
  // Handle incoming STOMP messages
  private handleIncomingMessage(message: IMessage) {
    try {
      console.log('STOMP message received:', message.body);
      const parsedMessage = JSON.parse(message.body);
      
      // Логируем для отладки полную структуру сообщения
      console.log('Parsed message structure:', JSON.stringify(parsedMessage, null, 2));
      
      // Проверяем, есть ли ошибка от сервера
      if (parsedMessage.action === 'error') {
        console.error('Server error:', parsedMessage.data?.message || 'Unknown error');
        if (this.messageHandlers.onError) {
          this.messageHandlers.onError();
        }
        return;
      }
      
      switch (parsedMessage.action) {
        case 'initial_data':
          console.log('Received initial data with rooms:', parsedMessage.data?.rooms?.length || 0, 
                      'guests:', parsedMessage.data?.guests?.length || 0);
          
          if (parsedMessage.data?.rooms && Array.isArray(parsedMessage.data.rooms) && this.messageHandlers.onRoomData) {
            // Преобразуем данные комнат и добавляем недостающие поля
            const rooms = parsedMessage.data.rooms.map(this.preprocessRoom);
            this.messageHandlers.onRoomData(rooms);
          }
          
          if (parsedMessage.data?.guests && Array.isArray(parsedMessage.data.guests) && this.messageHandlers.onGuestData) {
            const guests = parsedMessage.data.guests.map(this.preprocessGuest);
            this.messageHandlers.onGuestData(guests);
          }
          break;
        case 'update_room':
          console.log('Room update message received');
          if (parsedMessage.data && this.messageHandlers.onRoomUpdate) {
            const updatedRoom = this.preprocessRoom(parsedMessage.data);
            this.messageHandlers.onRoomUpdate(updatedRoom);
          }
          break;
        case 'add_room':
          console.log('New room message received');
          if (parsedMessage.data && this.messageHandlers.onRoomAdded) {
            const newRoom = this.preprocessRoom(parsedMessage.data);
            this.messageHandlers.onRoomAdded(newRoom);
          }
          break;
        case 'delete_room':
          console.log('Room deletion message received');
          if (parsedMessage.data?.id && this.messageHandlers.onRoomDeleted) {
            // Обрабатываем удаление комнаты
            this.messageHandlers.onRoomDeleted(BigInt(parsedMessage.data.id));
          }
          break;
        case 'update_guest':
          console.log('Guest update message received');
          if (parsedMessage.data && this.messageHandlers.onGuestUpdate) {
            const updatedGuest = this.preprocessGuest(parsedMessage.data);
            this.messageHandlers.onGuestUpdate(updatedGuest);
          }
          break;
        case 'add_guest':
          console.log('New guest message received');
          if (parsedMessage.data && this.messageHandlers.onGuestAdded) {
            const newGuest = this.preprocessGuest(parsedMessage.data);
            this.messageHandlers.onGuestAdded(newGuest);
          }
          break;
        case 'delete_guest':
          console.log('Guest deletion message received');
          if (parsedMessage.data?.id && this.messageHandlers.onGuestDeleted) {
            this.messageHandlers.onGuestDeleted(BigInt(parsedMessage.data.id));
          }
          break;
        default:
          console.log('Unhandled message type:', parsedMessage.action);
      }
    } catch (error) {
      console.error('Error processing STOMP message:', error);
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
  
  // Предварительная обработка данных комнаты с сервера
  private preprocessRoom(roomData: any): RoomWithSensors {
    const processedRoom = { ...roomData };
    
    // Преобразуем id в BigInt
    if (typeof processedRoom.id === 'string') {
      processedRoom.id = BigInt(processedRoom.id);
    }
    
    // Если бэкенд отправляет room_type с другим регистром или написанием
    if (processedRoom.room_type && 
        !['standart', 'deluxe', 'suit'].includes(processedRoom.room_type)) {
      // Приводим к ожидаемым значениям
      if (processedRoom.room_type.toLowerCase().includes('stand')) {
        processedRoom.room_type = 'standart';
      } else if (processedRoom.room_type.toLowerCase().includes('del')) {
        processedRoom.room_type = 'deluxe';
      } else if (processedRoom.room_type.toLowerCase().includes('sui')) {
        processedRoom.room_type = 'suit';
      }
    }
    
    // Если бэкенд отправляет status с другим регистром или написанием
    if (processedRoom.status && 
        !['free', 'occupied', 'service', 'cleaning', 'booked'].includes(processedRoom.status)) {
      // Приводим к ожидаемым значениям
      const status = processedRoom.status.toLowerCase();
      if (status.includes('free') || status.includes('empty')) {
        processedRoom.status = 'free';
      } else if (status.includes('occup')) {
        processedRoom.status = 'occupied';
      } else if (status.includes('serv')) {
        processedRoom.status = 'service';
      } else if (status.includes('clean')) {
        processedRoom.status = 'cleaning';
      } else if (status.includes('book') || status.includes('reserv')) {
        processedRoom.status = 'booked';
      }
    }
    
    // Обеспечиваем наличие всех необходимых свойств
    if (!processedRoom.sensors) {
      processedRoom.sensors = {
        temperature: 22,
        humidity: 45,
        pressure: 1013,
        lights: {
          bathroom: false,
          bedroom: false,
          hallway: false
        }
      };
    } else if (!processedRoom.sensors.lights) {
      processedRoom.sensors.lights = {
        bathroom: false,
        bedroom: false,
        hallway: false
      };
    }
    
    // Устанавливаем значения по умолчанию для отсутствующих полей
    if (processedRoom.doorLocked === undefined) {
      processedRoom.doorLocked = true;
    }
    
    if (!processedRoom.guests) {
      processedRoom.guests = [];
    }
    
    if (processedRoom.max_guests === undefined) {
      processedRoom.max_guests = 2;
    }
    
    if (processedRoom.current_guests_count === undefined) {
      processedRoom.current_guests_count = processedRoom.guests.length || 0;
    }
    
    return processedRoom as RoomWithSensors;
  }
  
  // Предварительная обработка данных гостя с сервера
  private preprocessGuest(guestData: any): Guest {
    const processedGuest = { ...guestData };
    
    // Преобразуем id в BigInt
    if (typeof processedGuest.id === 'string') {
      processedGuest.id = BigInt(processedGuest.id);
    }
    
    // Преобразуем room_id в BigInt, если он есть
    if (processedGuest.room_id && typeof processedGuest.room_id === 'string') {
      processedGuest.room_id = BigInt(processedGuest.room_id);
    }
    
    return processedGuest as Guest;
  }

  // Send any pending messages
  private flushPendingMessages() {
    if (this.pendingMessages.length > 0 && this.isConnected && this.stompClient?.connected) {
      console.log(`Sending ${this.pendingMessages.length} pending messages`);
      
      for (const message of this.pendingMessages) {
        this.sendMessage(message.action, message.data);
      }
      
      this.pendingMessages = [];
    }
  }

  // Request initial data
  requestInitialData() {
    console.log('Requesting initial room and guest data');
    this.sendMessage('get_rooms', {});
    this.sendMessage('get_guests', {});
  }

  // Send message through STOMP
  sendMessage(action: string, data: any): boolean {
    if (this.stompClient && this.stompClient.connected) {
      // Convert BigInt to string before sending
      const preparedData = this.serializeData(data);
      
      const message = JSON.stringify({ action, data: preparedData });
      console.log('Sending STOMP message:', message);
      
      // Send message to the Spring WebSocket controller's endpoint
      this.stompClient.publish({
        destination: '/app/socket',
        body: message
      });
      
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
    return this.isConnected && !!this.stompClient?.connected;
  }
}

export default new NetworkAPI(); 