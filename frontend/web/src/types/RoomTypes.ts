export type RoomType = 'standart' | 'deluxe' | 'suite';
export type RoomStatus = 'free' | 'occupied' | 'service' | 'cleaning' | 'booked';

export interface RoomSensors {
    temperature: number;
    humidity: number;
    pressure: number;
    lights: {
        bathroom: boolean;
        bedroom: boolean;
        hallway: boolean;
    };
}

export interface Guest {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    check_in_date?: string;
    check_out_date?: string;
}

export interface Room {
    id: string;
    room_number: string;
    room_type: RoomType;
    status: RoomStatus;
    price_per_night: number;
    created_at: string;
    updated_at: string;
    doorLocked?: boolean;
    sensors?: RoomSensors;
    guests: Guest[];
    max_guests: number;
    current_guests_count: number;
}

export interface RoomWithSensors extends Room {
    sensors: RoomSensors;
    doorLocked: boolean;
    guests: Guest[];
}

export interface RoomFilters {
    status?: RoomStatus[];
    type?: RoomType[];
    priceMin?: number;
    priceMax?: number;
    searchQuery?: string;
    hasGuests?: boolean;
    availableForGuests?: number;
}

export interface RoomSortOptions {
    field: keyof Room | string;
    direction: 'asc' | 'desc';
}

export interface GuestAssignment {
    guest_id: string;
    room_id: string;
    check_in_date: string;
    is_primary_guest: boolean;
}

export interface RemoveGuestFromRoom {
    guest_id: string;
    room_id: string;
}

export interface AssignMultipleGuestsRequest {
    guests: GuestAssignment[];
}

export interface AssignMultipleGuestsResponse {
    success: boolean;
    room_id: string;
    assigned_guests: number;
    updated_room: Room;
} 