import { makeAutoObservable, runInAction } from 'mobx';
import type {Guest, GuestFilters, GuestSortOptions} from '../types/GuestTypes';
import networkAPI from '../services/NetworkAPI';

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
  }

  // Initialize API and register handlers
  initializeAPI() {
    // Register handlers with the network API
    networkAPI.registerHandlers({
      onGuestData: this.handleInitialData,
      onGuestUpdate: this.handleGuestUpdate, 
      onGuestAdded: this.handleNewGuest,
      onGuestDeleted: this.handleGuestDelete,
      onError: (message) => {
        console.error('API Error:', message);
      }
    });
  }

  requestInitialData() {
    this.isLoading = true;
    networkAPI.requestGuests();
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

  handleGuestDelete = (guestId: string, success: boolean, message: string) => {
    console.log(`Deleting guest ${guestId}: ${success ? 'Success' : 'Failed'} - ${message}`);
    
    if (success) {
      runInAction(() => {
        this.guests = this.guests.filter(guest => guest.id !== guestId);
        
        // Clear selected guest if it's the one being deleted
        if (this.selectedGuest && this.selectedGuest.id === guestId) {
          this.selectedGuest = null;
        }
        
        this.applyFiltersAndSort();
      });
    } else {
      console.error('Failed to delete guest:', message);
    }
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

  addGuest = (firstName: string, lastName: string, email: string, phone: string) => {
    console.log('Adding new guest:', {firstName, lastName, email, phone});
    
    // Use the network API to add the guest
    networkAPI.addGuest(firstName, lastName, email, phone);
  }

  updateGuest = (guestId: string, updates: Partial<Guest>) => {
    console.log('Updating guest:', {guestId, updates});
    
    // Use the network API to update the guest
    networkAPI.updateGuest(guestId, updates);
  }

  deleteGuest = (guestId: string) => {
    console.log('Deleting guest:', guestId);
    
    // Use the network API to delete the guest
    networkAPI.deleteGuest(guestId);
  }

  checkInGuest = (guestId: string, roomId: string, checkInDate?: string) => {
    console.log('Checking in guest:', {guestId, roomId, checkInDate});
    
    // Use the network API to check in the guest
    networkAPI.checkInGuest(guestId, roomId, checkInDate);
  }

  checkOutGuest = (guestId: string, checkOutDate?: string) => {
    console.log('Checking out guest:', {guestId, checkOutDate});
    
    // Use the network API to check out the guest
    networkAPI.checkOutGuest(guestId, checkOutDate);
  }

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