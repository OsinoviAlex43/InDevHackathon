export interface Guest {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    room_id?: string;
    check_in_date?: string;
    check_out_date?: string;
    created_at: string;
    updated_at: string;
    photo_url?: string;
    passport?: {
        number: string;
        issue_date?: string;
        expiry_date?: string;
        issuing_country?: string;
        nationality?: string;
    };
}

export interface GuestFilters {
    searchQuery?: string;
    hasRoom?: boolean;
    checkInFrom?: string;
    checkInTo?: string;
    checkOutFrom?: string;
    checkOutTo?: string;
    checkInDateStart?: string;
    checkInDateEnd?: string;
    checkOutDateStart?: string;
    checkOutDateEnd?: string;
}

export interface GuestSortOptions {
    field: keyof Guest | string;
    direction: 'asc' | 'desc';
}

export interface CreateGuestData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    room_id?: string;
    check_in_date?: string;
    check_out_date?: string;
    photo_url?: string;
    passport?: {
        number: string;
        issue_date?: string;
        expiry_date?: string;
        issuing_country?: string;
        nationality?: string;
    };
} 