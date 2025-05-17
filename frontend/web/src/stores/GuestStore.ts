import { makeAutoObservable, runInAction } from 'mobx';
import type {Guest, GuestFilters, GuestSortOptions} from '../types/GuestTypes';
import networkAPI from '../services/NetworkAPI';

// Mock data for demonstration and fallback
const mockGuests: Guest[] = [
  {
    id: BigInt(101),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    room_id: BigInt(1),
    check_in_date: '2023-06-01T14:00:00Z',
    check_out_date: '2023-06-05T12:00:00Z',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: BigInt(102),
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1987654321',
    room_id: BigInt(3),
    check_in_date: '2023-06-02T15:00:00Z',
    check_out_date: '2023-06-08T11:00:00Z',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: BigInt(103),
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'robert.j@example.com',
    phone: '+1122334455',
    check_in_date: '2023-06-10T16:00:00Z',
    check_out_date: '2023-06-15T10:00:00Z',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: BigInt(104),
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@example.com',
    phone: '+1567890123',
    room_id: BigInt(2),
    check_in_date: '2023-06-05T13:00:00Z',
    check_out_date: '2023-06-12T10:00:00Z',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: BigInt(105),
    first_name: 'Michael',
    last_name: 'Wilson',
    email: 'michael.w@example.com',
    phone: '+1678901234',
    check_in_date: '2023-06-15T12:00:00Z',
    check_out_date: '2023-06-20T10:00:00Z',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class GuestStore {
  guests: Guest[] = [];
  filteredGuests: Guest[] = [];
  selectedGuest: Guest | null = null;
  isLoading = false;
  filters: GuestFilters = {};
  sortOptions: GuestSortOptions = { field: 'last_name', direction: 'asc' };

  constructor() {
    makeAutoObservable(this);
    // Initialize API connection
    this.initializeAPI();
    
    // Set fallback data if API fails
    setTimeout(() => {
      if (this.guests.length === 0) {
        console.log('Falling back to mock guest data');
        this.loadMockData();
      }
    }, 5000);
  }

  // Initialize API and register handlers
  initializeAPI() {
    // Register handlers with the network API
    networkAPI.registerHandlers({
      onGuestData: this.handleInitialData,
      onGuestUpdate: this.handleGuestUpdate, 
      onGuestAdded: this.handleNewGuest,
      onGuestDeleted: this.handleGuestDelete,
      onError: this.loadMockData
    });
  }

  loadMockData = () => {
    console.log('Loading mock guest data');
    runInAction(() => {
      this.guests = mockGuests;
      this.applyFiltersAndSort();
      this.isLoading = false;
    });
  }

  requestInitialData() {
    this.isLoading = true;
    networkAPI.sendMessage('get_guests', {});
    
    // Fallback in case the server doesn't respond
    setTimeout(() => {
      if (this.isLoading && this.guests.length === 0) {
        console.log('No response from guest server, loading mock data');
        this.loadMockData();
      }
    }, 3000);
  }
  
  handleInitialData = (guestsData: Guest[]) => {
    console.log('Received initial guest data:', guestsData);
    runInAction(() => {
      this.guests = guestsData;
      this.applyFiltersAndSort();
      this.isLoading = false;
    });
  }

  handleGuestUpdate = (guestData: Guest) => {
    console.log('Updating guest:', guestData);
    runInAction(() => {
      const guestIndex = this.guests.findIndex(guest => guest.id === guestData.id);
      if (guestIndex >= 0) {
        // Update existing guest with new data
        this.guests[guestIndex] = guestData;
        
        // Update selected guest if it's the one being updated
        if (this.selectedGuest && this.selectedGuest.id === guestData.id) {
          this.selectedGuest = guestData;
        }
        
        this.applyFiltersAndSort();
      }
    });
  }

  handleNewGuest = (guestData: Guest) => {
    console.log('Adding new guest:', guestData);
    runInAction(() => {
      this.guests.push(guestData);
      this.applyFiltersAndSort();
    });
  }

  handleGuestDelete = (guestId: bigint) => {
    console.log('Deleting guest:', guestId.toString());
    runInAction(() => {
      this.guests = this.guests.filter(guest => guest.id !== guestId);
      
      // Clear selected guest if it's the one being deleted
      if (this.selectedGuest && this.selectedGuest.id === guestId) {
        this.selectedGuest = null;
      }
      
      this.applyFiltersAndSort();
    });
  }

  // Use local operations when unable to connect to server
  mockAddGuest(data: any) {
    console.log('Using mock add guest:', data);
    const newGuest: Guest = {
      ...data,
      id: BigInt(Date.now()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Convert room_id to BigInt if provided
    if (newGuest.room_id) {
      newGuest.room_id = BigInt(newGuest.room_id.toString());
    }
    
    this.handleNewGuest(newGuest);
  }

  mockUpdateGuest(data: any) {
    console.log('Using mock update guest:', data);
    
    if (!data.id) return;
    
    const guestId = BigInt(data.id);
    const existingGuest = this.guests.find(g => g.id === guestId);
    
    if (!existingGuest) return;
    
    // Process room_id as BigInt if present
    if (data.room_id) {
      data.room_id = BigInt(data.room_id);
    }
    
    const updatedGuest: Guest = {
      ...existingGuest,
      ...data as Partial<Guest>,
      id: guestId,
      updated_at: new Date().toISOString()
    };
    
    this.handleGuestUpdate(updatedGuest);
  }

  mockDeleteGuest(data: any) {
    console.log('Using mock delete guest:', data);
    
    if (!data.id) return;
    
    const guestId = BigInt(data.id);
    this.handleGuestDelete(guestId);
  }

  // Store actions
  setSelectedGuest = (guest: Guest | null) => {
    this.selectedGuest = guest;
  };

  setFilters = (filters: GuestFilters) => {
    this.filters = filters;
    this.applyFiltersAndSort();
  };

  setSortOptions = (sortOptions: GuestSortOptions) => {
    this.sortOptions = sortOptions;
    this.applyFiltersAndSort();
  };

  applyFiltersAndSort = () => {
    let filtered = [...this.guests];
    
    // Apply filters
    if (this.filters.checkInFrom) {
      filtered = filtered.filter(guest => 
        guest.check_in_date && new Date(guest.check_in_date) >= new Date(this.filters.checkInFrom!)
      );
    }
    
    if (this.filters.checkInTo) {
      filtered = filtered.filter(guest => 
        guest.check_in_date && new Date(guest.check_in_date) <= new Date(this.filters.checkInTo!)
      );
    }
    
    if (this.filters.checkOutFrom) {
      filtered = filtered.filter(guest => 
        guest.check_out_date && new Date(guest.check_out_date) >= new Date(this.filters.checkOutFrom!)
      );
    }
    
    if (this.filters.checkOutTo) {
      filtered = filtered.filter(guest => 
        guest.check_out_date && new Date(guest.check_out_date) <= new Date(this.filters.checkOutTo!)
      );
    }
    
    if (this.filters.hasRoom !== undefined) {
      filtered = filtered.filter(guest => 
        this.filters.hasRoom ? !!guest.room_id : !guest.room_id
      );
    }
    
    if (this.filters.searchQuery) {
      const query = this.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.first_name.toLowerCase().includes(query) ||
        guest.last_name.toLowerCase().includes(query) ||
        guest.email.toLowerCase().includes(query) ||
        guest.phone.includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const field = this.sortOptions.field;
      const direction = this.sortOptions.direction === 'asc' ? 1 : -1;
      
      // Handle special fields and null values
      if (field === 'check_in_date' || field === 'check_out_date' || field === 'room_id') {
        const valueA = a[field as keyof Guest];
        const valueB = b[field as keyof Guest];
        
        // Handle null/undefined values
        if (valueA === undefined && valueB === undefined) return 0;
        if (valueA === undefined) return direction;
        if (valueB === undefined) return -direction;
        
        // Handle date comparison
        if (field === 'check_in_date' || field === 'check_out_date') {
          return (new Date(valueA as string).getTime() - new Date(valueB as string).getTime()) * direction;
        }
      }
      
      // Handle string comparison
      if (typeof a[field as keyof Guest] === 'string' && typeof b[field as keyof Guest] === 'string') {
        return ((a[field as keyof Guest] as string).localeCompare(b[field as keyof Guest] as string)) * direction;
      }
      
      // For numeric or other types
      const aValue = a[field as keyof Guest];
      const bValue = b[field as keyof Guest];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return direction;
      if (bValue === undefined) return -direction;
      
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
    
    this.filteredGuests = filtered;
  };

  addGuest = (guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => {
    this.isLoading = true;
    
    // Try to send via network API
    const result = networkAPI.sendMessage('add_guest', guest);
    
    // If network API fails, use local mock operation
    if (!result) {
      this.mockAddGuest(guest);
    }
  };

  updateGuest = (guestId: bigint, updates: Partial<Guest>) => {
    // Send update through network API
    const result = networkAPI.sendMessage('update_guest', { 
      id: guestId, 
      ...updates 
    });
    
    // If network API fails, use local mock operation
    if (!result) {
      this.mockUpdateGuest({ id: guestId, ...updates });
    }
  };

  deleteGuest = (guestId: bigint) => {
    // Send delete request through network API
    const result = networkAPI.sendMessage('delete_guest', { 
      id: guestId
    });
    
    // If network API fails, use local mock operation
    if (!result) {
      this.mockDeleteGuest({ id: guestId });
    }
  };

  checkInGuest = (guestId: bigint, roomId: bigint) => {
    // Send check-in request through network API
    this.updateGuest(guestId, {
      room_id: roomId,
      check_in_date: new Date().toISOString()
    });
  };

  checkOutGuest = (guestId: bigint) => {
    // Send check-out request through network API
    this.updateGuest(guestId, {
      room_id: undefined,
      check_out_date: new Date().toISOString()
    });
  };

  // Statistics methods for dashboard
  get totalGuests() {
    return this.guests.length;
  }

  get currentGuests() {
    return this.guests.filter(guest => guest.room_id).length;
  }

  get upcomingGuests() {
    const now = new Date();
    return this.guests.filter(guest => 
      guest.check_in_date && new Date(guest.check_in_date) > now
    ).length;
  }

  get todayArrivals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.guests.filter(guest => 
      guest.check_in_date && 
      new Date(guest.check_in_date) >= today && 
      new Date(guest.check_in_date) < tomorrow
    ).length;
  }

  get todayDepartures() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.guests.filter(guest => 
      guest.check_out_date && 
      new Date(guest.check_out_date) >= today && 
      new Date(guest.check_out_date) < tomorrow
    ).length;
  }

  // Helper to ensure the store is initialized
  ensureInitialized() {
    if (this.guests.length === 0) {
      this.requestInitialData();
    }
  }
}

export default new GuestStore(); 