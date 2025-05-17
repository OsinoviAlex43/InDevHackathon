import { makeAutoObservable, runInAction, toJS } from 'mobx';
import type {Room, RoomFilters, RoomSortOptions, RoomWithSensors, RoomType, RoomStatus, RoomSensors} from '../types/RoomTypes';
import networkAPI from '../services/NetworkAPI';

// Mock data for demonstration and fallback
const mockRooms: RoomWithSensors[] = [
  {
    id: BigInt(1),
    room_number: '101',
    room_type: 'standart',
    status: 'occupied',
    price_per_night: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sensors: {
      lights: {
        bathroom: true,
        bedroom: false,
        hallway: true
      },
      temperature: 22.5,
      humidity: 45,
      pressure: 1013
    },
    doorLocked: true,
    guests: [],
    max_guests: 2,
    current_guests_count: 1
  },
  {
    id: BigInt(2),
    room_number: '102',
    room_type: 'deluxe',
    status: 'free',
    price_per_night: 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sensors: {
      lights: {
        bathroom: false,
        bedroom: false,
        hallway: false
      },
      temperature: 21,
      humidity: 40,
      pressure: 1013
    },
    doorLocked: true,
    guests: [],
    max_guests: 4,
    current_guests_count: 0
  },
  {
    id: BigInt(3),
    room_number: '103',
    room_type: 'suit',
    status: 'cleaning',
    price_per_night: 250,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sensors: {
      lights: {
        bathroom: true,
        bedroom: true,
        hallway: true
      },
      temperature: 23,
      humidity: 38,
      pressure: 1014
    },
    doorLocked: false,
    guests: [],
    max_guests: 6,
    current_guests_count: 0
  },
  {
    id: BigInt(4),
    room_number: '201',
    room_type: 'standart',
    status: 'booked',
    price_per_night: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sensors: {
      lights: {
        bathroom: false,
        bedroom: false,
        hallway: false
      },
      temperature: 20,
      humidity: 42,
      pressure: 1012
    },
    doorLocked: true,
    guests: [],
    max_guests: 2,
    current_guests_count: 0
  },
  {
    id: BigInt(5),
    room_number: '202',
    room_type: 'deluxe',
    status: 'service',
    price_per_night: 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sensors: {
      lights: {
        bathroom: true,
        bedroom: false,
        hallway: true
      },
      temperature: 24,
      humidity: 39,
      pressure: 1013
    },
    doorLocked: false,
    guests: [],
    max_guests: 4,
    current_guests_count: 0
  }
];

export class RoomStore {
  rooms: RoomWithSensors[] = [];
  filteredRooms: RoomWithSensors[] = [];
  favoriteRooms: RoomWithSensors[] = [];
  selectedRoom: RoomWithSensors | null = null;
  isLoading = false;
  filters: RoomFilters = {};
  sortOptions: RoomSortOptions = { field: 'room_number', direction: 'asc' };
  
  // UI state properties
  isEditing = false;
  confirmDelete = false;
  sensorsExpanded = false;
  editableRoom = {
    room_number: '',
    room_type: '' as RoomType,
    status: '' as RoomStatus,
    price_per_night: 0
  };

  constructor() {
    makeAutoObservable(this);
    this.initializeAPI();
    
    // Load favorites from localStorage if available
    this.loadFavoritesFromStorage();
  }

  // Initialize API and register handlers
  initializeAPI() {
    // Register handlers with the network API
    networkAPI.registerHandlers({
      onRoomData: this.handleInitialData,
      onRoomUpdate: this.handleRoomUpdate,
      onRoomAdded: this.handleNewRoom,
      onRoomDeleted: this.handleRoomDelete,
      // Убираем fallback на моки при ошибке
      onError: () => console.error('Ошибка соединения с API')
    });
    
    // Start connection
    networkAPI.connect();
    
    // Устанавливаем состояние загрузки
    this.isLoading = true;
    
    // Таймаут для отображения ошибки, если сервер не отвечает
    setTimeout(() => {
      if (this.rooms.length === 0) {
        console.error('Сервер не отвечает');
        this.isLoading = false;
      }
    }, 10000);
  }

  // Save favorites to localStorage
  saveFavoritesToStorage = () => {
    try {
      // Convert bigint to string for JSON storage
      const serializedFavorites = this.favoriteRooms.map(room => ({
        ...room,
        id: room.id.toString()
      }));
      localStorage.setItem('favoriteRooms', JSON.stringify(serializedFavorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }

  // Load favorites from localStorage
  loadFavoritesFromStorage = () => {
    try {
      const savedFavorites = localStorage.getItem('favoriteRooms');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        // Convert string IDs back to bigint
        this.favoriteRooms = parsedFavorites.map((room: any) => ({
          ...room,
          id: BigInt(room.id)
        }));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
      this.favoriteRooms = [];
    }
  }

  loadMockData = () => {
    console.log('Loading mock room data');
    runInAction(() => {
      this.rooms = mockRooms;
      this.applyFiltersAndSort();
      this.isLoading = false;
    });
  }

  handleInitialData = (rooms: RoomWithSensors[]) => {
    console.log('Received initial data:', rooms);
    runInAction(() => {
      this.rooms = rooms;
      this.applyFiltersAndSort();
      this.isLoading = false;
    });
  }
  
  handleRoomUpdate = (roomData: RoomWithSensors) => {
    console.log('Updating room:', roomData);
    runInAction(() => {
      const roomIndex = this.rooms.findIndex(room => room.id === roomData.id);
      if (roomIndex >= 0) {
        // Update existing room with new data
        this.rooms[roomIndex] = { ...this.rooms[roomIndex], ...roomData };
        
        // Also update in favorites if present
        const favoriteIndex = this.favoriteRooms.findIndex(room => room.id === roomData.id);
        if (favoriteIndex >= 0) {
          this.favoriteRooms[favoriteIndex] = { ...this.favoriteRooms[favoriteIndex], ...roomData };
          this.saveFavoritesToStorage();
        }
        
        // Update selected room if it's the one being updated
        if (this.selectedRoom && this.selectedRoom.id === roomData.id) {
          this.selectedRoom = { ...this.selectedRoom, ...roomData };
        }
        
        this.applyFiltersAndSort();
      }
      });
  }
  
  handleNewRoom = (roomData: RoomWithSensors) => {
    console.log('Adding new room:', roomData);
    runInAction(() => {
      this.rooms.push(roomData);
      this.applyFiltersAndSort();
      this.isLoading = false;
    });
  }
  
  handleRoomDelete = (roomId: bigint) => {
    console.log('Deleting room:', roomId.toString());
    runInAction(() => {
      this.rooms = this.rooms.filter(room => room.id !== roomId);
      
      // Also remove from favorites if present
      const favoriteIndex = this.favoriteRooms.findIndex(room => room.id === roomId);
      if (favoriteIndex >= 0) {
        this.favoriteRooms.splice(favoriteIndex, 1);
        this.saveFavoritesToStorage();
      }
      
      // Clear selected room if it's the one being deleted
      if (this.selectedRoom && this.selectedRoom.id === roomId) {
        this.selectedRoom = null;
      }
      
      this.applyFiltersAndSort();
    });
  }

  setSelectedRoom = (room: RoomWithSensors | null) => {
    this.selectedRoom = room;
  };

  setFilters = (filters: RoomFilters) => {
    this.filters = filters;
    this.applyFiltersAndSort();
  };

  setSortOptions = (sortOptions: RoomSortOptions) => {
    this.sortOptions = sortOptions;
    this.applyFiltersAndSort();
  };

  applyFiltersAndSort = () => {
    let filtered = [...this.rooms];
    
    // Apply filters
    if (this.filters.status && this.filters.status.length > 0) {
      filtered = filtered.filter(room => this.filters.status?.includes(room.status));
    }
    
    if (this.filters.type && this.filters.type.length > 0) {
      filtered = filtered.filter(room => this.filters.type?.includes(room.room_type));
    }
    
    if (this.filters.priceMin !== undefined) {
      filtered = filtered.filter(room => room.price_per_night >= (this.filters.priceMin || 0));
    }
    
    if (this.filters.priceMax !== undefined) {
      filtered = filtered.filter(room => room.price_per_night <= (this.filters.priceMax || Infinity));
    }
    
    if (this.filters.searchQuery) {
      const query = this.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.room_number.toLowerCase().includes(query) ||
        room.room_type.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const field = this.sortOptions.field as keyof Room;
      const direction = this.sortOptions.direction === 'asc' ? 1 : -1;
      
      // Handle special case for string comparison
      if (typeof a[field] === 'string' && typeof b[field] === 'string') {
        return (a[field] as string).localeCompare(b[field] as string) * direction;
      }
      
      // For numeric or other types
      if (a[field] < b[field]) return -1 * direction;
      if (a[field] > b[field]) return 1 * direction;
      return 0;
    });
    
    this.filteredRooms = filtered;
  };

  addToFavorites = (room: RoomWithSensors) => {
    // Create a deep copy of the room to avoid reference issues
    const roomCopy = JSON.parse(JSON.stringify({
      ...room,
      id: room.id.toString() // Convert bigint to string for JSON
    }));
    
    // Convert back to bigint
    roomCopy.id = BigInt(roomCopy.id);
    
    if (!this.favoriteRooms.find(r => r.id === room.id)) {
      this.favoriteRooms.push(roomCopy);
      this.saveFavoritesToStorage();
    }
  };

  removeFromFavorites = (roomId: bigint) => {
    this.favoriteRooms = this.favoriteRooms.filter(room => room.id !== roomId);
    this.saveFavoritesToStorage();
  };

  updateFavoritesOrder = (fromIndex: number, toIndex: number) => {
    const result = [...this.favoriteRooms];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    
    this.favoriteRooms = result;
    this.saveFavoritesToStorage();
  };

  addRoom = (room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => {
    this.isLoading = true;
    
    // Отправляем запрос на добавление комнаты через API
    const result = networkAPI.sendMessage('add_room', room);
    
    if (!result) {
      console.error('Не удалось отправить запрос на добавление комнаты - нет соединения с сервером');
      this.isLoading = false;
      return false;
    }
    
    return true;
  }
  
  updateRoom = (roomId: bigint, updates: Partial<Room>) => {
    this.isLoading = true;
    
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) {
      this.isLoading = false;
      return false;
    }
    
    // Отправляем запрос на обновление комнаты через API
    const result = networkAPI.sendMessage('update_room', { id: roomId, ...updates });
    
    if (!result) {
      console.error('Не удалось отправить запрос на обновление комнаты - нет соединения с сервером');
      this.isLoading = false;
      return false;
    }
    
    return true;
  }
  
  deleteRoom = (roomId: bigint) => {
    this.isLoading = true;
    
    // Отправляем запрос на удаление комнаты через API
    const result = networkAPI.sendMessage('delete_room', { id: roomId });
    
    if (!result) {
      console.error('Не удалось отправить запрос на удаление комнаты - нет соединения с сервером');
      this.isLoading = false;
      return false;
    }
    
    return true;
  }

  toggleDoorLock = (roomId: bigint) => {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    this.updateRoom(roomId, {
      doorLocked: !room.doorLocked
    });
  }
  
  toggleLight = (roomId: bigint, light: 'bathroom' | 'bedroom' | 'hallway') => {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || !room.sensors?.lights) return;
    
    const newLightState = !room.sensors.lights[light];
    
    const updatedSensors: RoomSensors = {
      ...room.sensors,
      lights: {
        ...room.sensors.lights,
        [light]: newLightState
      }
    };
    
    this.updateRoom(roomId, {
      sensors: updatedSensors
    } as Partial<Room>);
  }

  updateSensor = (roomId: bigint, type: 'temperature' | 'humidity' | 'pressure', value: number) => {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Ensure sensors object exists
    const sensors = room.sensors || {
      temperature: 0,
      humidity: 0,
      pressure: 0,
      lights: {
        bathroom: false,
        bedroom: false,
        hallway: false
      }
    };

    // Create updated sensors object
    const updatedSensors: RoomSensors = {
      ...sensors,
      [type]: value
    };

    // Update sensor with new value
    this.updateRoom(roomId, {
      sensors: updatedSensors
    } as Partial<Room>);
  }

  // Computed properties
  get editableFavoriteIds() {
    return new Set(this.favoriteRooms.map(room => room.id.toString()));
  }
  
  get allRoomStatuses() {
    return [...new Set(this.rooms.map(room => room.status))];
  }
  
  get allRoomTypes() {
    return [...new Set(this.rooms.map(room => room.room_type))];
  }
  
  get priceRange() {
    const prices = this.rooms.map(room => room.price_per_night);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }
  
  get getRoomsByStatus() {
    return (status: RoomStatus) => this.rooms.filter(room => room.status === status);
  }
  
  // Dashboard statistics
  get roomsOccupancyStats() {
    const stats = {
      total: this.rooms.length,
      occupied: this.rooms.filter(r => r.status === 'occupied').length,
      free: this.rooms.filter(r => r.status === 'free').length,
      service: this.rooms.filter(r => r.status === 'service').length,
      cleaning: this.rooms.filter(r => r.status === 'cleaning').length,
      booked: this.rooms.filter(r => r.status === 'booked').length,
      occupancyRate: 0
    };
    
    stats.occupancyRate = this.rooms.length > 0 
      ? stats.occupied / this.rooms.length * 100
      : 0;
    
    return stats;
  }

  get roomTypeDistribution() {
    return {
      standart: this.rooms.filter(room => room.room_type === 'standart').length,
      deluxe: this.rooms.filter(room => room.room_type === 'deluxe').length,
      suit: this.rooms.filter(room => room.room_type === 'suit').length
    };
  }

  get averageRoomTemperature() {
    if (this.rooms.length === 0) return 0;
    
    const sum = this.rooms.reduce((acc, room) => acc + room.sensors.temperature, 0);
    return parseFloat((sum / this.rooms.length).toFixed(1));
  }

  // UI state management methods
  startEditing = () => {
    this.isEditing = true;
  };

  stopEditing = () => {
    this.isEditing = false;
  };

  setConfirmDelete = (value: boolean) => {
    this.confirmDelete = value;
  };

  toggleSensorsExpanded = () => {
    this.sensorsExpanded = !this.sensorsExpanded;
  };

  initEditableRoom = (room: RoomWithSensors) => {
    this.editableRoom = {
      room_number: room.room_number,
      room_type: room.room_type,
      status: room.status,
      price_per_night: room.price_per_night
    };
  };

  updateEditableRoom = (field: string, value: any) => {
    this.editableRoom = {
      ...this.editableRoom,
      [field]: value
    };
  };

  cancelEdit = () => {
    if (this.selectedRoom) {
      this.initEditableRoom(this.selectedRoom);
    }
    this.stopEditing();
  };

  saveEditedRoom = () => {
    if (this.selectedRoom) {
      this.updateRoom(this.selectedRoom.id, this.editableRoom);
      this.stopEditing();
    }
  };

  resetUI = () => {
    this.isEditing = false;
    this.confirmDelete = false;
    this.sensorsExpanded = false;
    this.editableRoom = {
      room_number: '',
      room_type: '' as RoomType,
      status: '' as RoomStatus,
      price_per_night: 0
    };
  };

  // Data access with MobX
  loadRoomById = (roomId: bigint, notFoundCallback?: () => void) => {
    this.isLoading = true;
    const room = this.rooms.find(r => r.id === roomId);
    
    runInAction(() => {
      if (room) {
        this.setSelectedRoom(room);
        this.initEditableRoom(room);
        this.isLoading = false;
      } else {
        // If room not found, load data or fallback to mock
        if (this.rooms.length === 0) {
          this.loadMockData();
          
          // Check again after loading data
          const roomAfterLoad = this.rooms.find(r => r.id === roomId);
          if (roomAfterLoad) {
            this.setSelectedRoom(roomAfterLoad);
            this.initEditableRoom(roomAfterLoad);
          } else if (notFoundCallback) {
            notFoundCallback();
          }
        } else if (notFoundCallback) {
          notFoundCallback();
        }
        
        this.isLoading = false;
      }
    });
  };
  
  resetRoomDetails = () => {
    this.setSelectedRoom(null);
    this.resetUI();
  };
  
  isFavorite = (roomId: bigint): boolean => {
    return this.favoriteRooms.some(r => r.id === roomId);
  };
  
  toggleFavorite = (room: RoomWithSensors) => {
    if (this.isFavorite(room.id)) {
      this.removeFromFavorites(room.id);
    } else {
      this.addToFavorites(room);
    }
  };
}

export default new RoomStore(); 