import { makeAutoObservable, runInAction, toJS } from 'mobx';
import type {Room, RoomFilters, RoomSortOptions, RoomWithSensors, RoomType, RoomStatus, RoomSensors} from '../types/RoomTypes';
import networkAPI from '../services/NetworkAPI';

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
      onError: (message) => {
        console.error('API Error:', message);
      }
    });
    
    // Start connection
    networkAPI.connect();
  }

  // Save favorites to localStorage
  saveFavoritesToStorage = () => {
    try {
      localStorage.setItem('favoriteRooms', JSON.stringify(this.favoriteRooms));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }

  // Load favorites from localStorage
  loadFavoritesFromStorage = () => {
    try {
      const savedFavorites = localStorage.getItem('favoriteRooms');
      if (savedFavorites) {
        this.favoriteRooms = JSON.parse(savedFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
      this.favoriteRooms = [];
    }
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
      // Если это обновление выбранной комнаты, обновляем её и снимаем флаг загрузки
      if (this.selectedRoom && String(this.selectedRoom.id) === String(roomData.id)) {
        console.log('Updating selected room with data:', roomData);
        this.selectedRoom = { ...this.selectedRoom, ...roomData };
        this.isLoading = false;
      }
      
      const roomIndex = this.rooms.findIndex(room => String(room.id) === String(roomData.id));
      if (roomIndex >= 0) {
        // Update existing room with new data
        this.rooms[roomIndex] = { ...this.rooms[roomIndex], ...roomData };
        
        // Also update in favorites if present
        const favoriteIndex = this.favoriteRooms.findIndex(room => String(room.id) === String(roomData.id));
        if (favoriteIndex >= 0) {
          this.favoriteRooms[favoriteIndex] = { ...this.favoriteRooms[favoriteIndex], ...roomData };
          this.saveFavoritesToStorage();
        }
        
        this.applyFiltersAndSort();
      } else {
        // Если комната не найдена в списке комнат, добавляем её
        this.rooms.push(roomData);
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
  
  handleRoomDelete = (roomId: string, success: boolean, message: string) => {
    console.log(`Deleting room ${roomId}: ${success ? 'Success' : 'Failed'} - ${message}`);
    
    if (success) {
      runInAction(() => {
        this.rooms = this.rooms.filter(room => room.id !== roomId);
        
        // Also remove from favorites if present
        this.favoriteRooms = this.favoriteRooms.filter(room => room.id !== roomId);
        this.saveFavoritesToStorage();
        
        // Clear selected room if it's the one being deleted
        if (this.selectedRoom && this.selectedRoom.id === roomId) {
          this.selectedRoom = null;
        }
        
        this.applyFiltersAndSort();
      });
    } else {
      console.error('Failed to delete room:', message);
    }
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
    if (!this.favoriteRooms.find(r => r.id === room.id)) {
      this.favoriteRooms.push(room);
      this.saveFavoritesToStorage();
    }
  };

  removeFromFavorites = (roomId: string) => {
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

  updateRoom = (roomId: string, statusOrUpdates: string | Partial<Room>) => {
    console.log(`Updating room ${roomId} with:`, statusOrUpdates);
    if (typeof statusOrUpdates === 'string') {
      // Just updating status
      networkAPI.updateRoom(roomId, statusOrUpdates);
    } else {
      // Updating with object
      networkAPI.sendMessage('update_room', {
        id: roomId,
        ...statusOrUpdates
      });
    }
  }
  
  deleteRoom = (roomId: string) => {
    console.log('Deleting room:', roomId);
    networkAPI.deleteRoom(roomId);
  }

  toggleDoorLock = (roomId: string) => {
    console.log('Toggling door lock for room:', roomId);
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      const newStatus = room.status === 'locked' ? 'unlocked' : 'locked';
      // Update the room status with the new door lock status
      networkAPI.updateRoom(roomId, newStatus);
      
      // Also send HTTP request to the mock server for door control
      if (newStatus === 'unlocked') {
        networkAPI.openDoor();
      } else {
        networkAPI.closeDoor();
      }
      
      // Also update local state for immediate feedback
      runInAction(() => {
        room.status = newStatus;
        room.doorLocked = newStatus === 'locked';
      });
    }
  }
  
  toggleLight = (roomId: string, light: 'bathroom' | 'bedroom' | 'hallway') => {
    console.log(`Toggling ${light} light for room:`, roomId);
    const room = this.rooms.find(r => r.id === roomId);
    if (room && room.sensors) {
      // Get new value (toggled)
      const newValue = !room.sensors.lights[light];
      
      // Update local state
      runInAction(() => {
        room.sensors.lights[light] = newValue;
      });
      
      // Send update to the server
      networkAPI.updateRoomLight(roomId, light, newValue);
      
      // Also send HTTP request to the mock server for light control
      if (newValue) {
        networkAPI.turnLightOn();
      } else {
        networkAPI.turnLightOff();
      }
    }
  }

  updateSensor = (roomId: string, type: 'temperature' | 'humidity' | 'pressure', value: number) => {
    console.log(`Updating ${type} sensor for room ${roomId} to ${value}`);
    const room = this.rooms.find(r => r.id === roomId);
    if (room && room.sensors) {
      // Update local state
      runInAction(() => {
        room.sensors[type] = value;
      });
      
      // Send update to the server
      networkAPI.updateRoomSensor(roomId, type, value);
    }
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
      suite: this.rooms.filter(room => room.room_type === 'suite').length
    };
  }

  get averageRoomTemperature() {
    if (this.rooms.length === 0) return 0;
    
    const sum = this.rooms.reduce((acc, room) => 
      room.sensors ? acc + room.sensors.temperature : acc, 0);
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
      this.updateRoom(this.selectedRoom.id, this.editableRoom.status);
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

  loadRoomById = (roomId: string, notFoundCallback?: () => void) => {
    console.log('Loading room by ID:', roomId);
    
    // First try to find the room in the already loaded rooms
    const room = this.rooms.find(r => String(r.id) === String(roomId));
    
    if (room) {
      console.log('Room found locally:', room);
      this.selectedRoom = room;
      this.isLoading = false;
      return;
    }
    
    // Room not found locally, request it from the server
    this.isLoading = true;
    console.log('Room not found locally, requesting from server');
    
    // Create a timeout to handle the case where the room doesn't exist
    const timeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        console.error(`Room with ID ${roomId} not found after timeout`);
        if (notFoundCallback) {
          notFoundCallback();
        }
      }
    }, 5000);
    
    // Use the requestRoom method to get a specific room by ID
    // Pass the ID as a string to the API
    networkAPI.requestRoom(String(roomId));
    
    // We'll rely on the handleRoomUpdate callback to update the selectedRoom
    // when the response comes back, which will also clear the loading state
  };
  
  resetRoomDetails = () => {
    this.setSelectedRoom(null);
    this.resetUI();
  };
  
  isFavorite = (roomId: string): boolean => {
    return this.favoriteRooms.some(room => room.id === roomId);
  };
  
  toggleFavorite = (room: RoomWithSensors) => {
    if (this.isFavorite(room.id)) {
      this.removeFromFavorites(room.id);
    } else {
      this.addToFavorites(room);
    }
  };

  // New method to add a room
  addRoom = (roomData: { room_number: string; room_type: RoomType; status: RoomStatus; price_per_night: number; max_guests?: number }) => {
    console.log('Adding new room:', roomData);
    this.isLoading = true;
    
    // Use NetworkAPI to add the room
    networkAPI.addRoom(
      roomData.room_number,
      roomData.room_type,
      roomData.status,
      roomData.price_per_night,
      roomData.max_guests
    );
  }
}

export default new RoomStore(); 