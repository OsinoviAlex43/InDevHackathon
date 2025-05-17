# Hotel Management System

A modern hotel management application built with React, TypeScript, and Material UI. The system features real-time updates through WebSocket connections, a modern glassmorphism UI with dark mode support, and comprehensive management of rooms and guests.

## Features

- **Modern Glassmorphism UI**: Beautiful interface with glass-like effects, enhanced with subtle animations and transitions
- **Dark Mode Support**: A fully customized dark theme that complements the light theme
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Comprehensive Management**: Handle rooms, guests, bookings, and more
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/hotel-management.git
cd hotel-management
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Architecture

The application follows a modular architecture with the following key components:

### Core Technologies

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library
- **MobX**: State management
- **Framer Motion**: Animation library
- **WebSocket**: Real-time communication

### Directory Structure

```
src/
├── components/       # Reusable UI components
│   ├── layouts/      # Layout components
│   └── rooms/        # Room-related components
├── pages/            # Page components
├── services/         # API and service layers
│   └── api/          # API services
├── stores/           # MobX stores
└── types/            # TypeScript type definitions
```

## API Documentation

### WebSocket API

The application communicates with the backend server through a WebSocket connection. The WebSocket service manages connection, reconnection, and message handling.

#### Connection Setup

```typescript
// Initialize WebSocket connection
WebSocketService.connect(): Promise<boolean>
```

#### Message Format

All WebSocket messages follow this format:

```json
{
  "action": "string",
  "data": {
    // Action-specific data
  }
}
```

### Rooms API

#### Fetch Rooms

**Action**: `get_rooms`

**Response**:
```json
{
  "action": "initial_data",
  "data": {
    "rooms": [
      {
        "id": "123456789",
        "room_number": "101",
        "room_type": "standart",
        "status": "free",
        "price_per_night": 100,
        "created_at": "2023-07-01T12:00:00Z",
        "updated_at": "2023-07-01T12:00:00Z",
        "doorLocked": true,
        "max_guests": 2,
        "current_guests_count": 0,
        "guests": [],
        "sensors": {
          "temperature": 22.5,
          "humidity": 45,
          "pressure": 1013,
          "lights": {
            "bathroom": false,
            "bedroom": false,
            "hallway": false
          }
        }
      }
    ]
  }
}
```

#### Update Room

**Action**: `update_room`

**Request**:
```json
{
  "action": "update_room",
  "data": {
    "id": "123456789",
    "status": "occupied"
  }
}
```

**Response**:
```json
{
  "action": "update_room",
  "data": {
    "id": "123456789",
    "status": "occupied",
    "updated_at": "2023-07-01T14:00:00Z"
  }
}
```

### Guests API

#### Fetch Guests

**Action**: `get_guests`

**Response**:
```json
{
  "action": "initial_data",
  "data": {
    "guests": [
      {
        "id": "987654321",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "room_id": null,
        "check_in_date": null,
        "check_out_date": null,
        "created_at": "2023-06-15T10:00:00Z",
        "updated_at": "2023-06-15T10:00:00Z",
        "photo_url": "https://example.com/photos/john-doe.jpg",
        "passport": {
          "number": "AB123456",
          "issue_date": "2018-01-01",
          "expiry_date": "2028-01-01",
          "issuing_country": "US",
          "nationality": "US"
        }
      }
    ]
  }
}
```

#### Create Guest

**Action**: `add_guest`

**Request**:
```json
{
  "action": "add_guest",
  "data": {
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+9876543210"
  }
}
```

**Response**:
```json
{
  "action": "add_guest",
  "data": {
    "id": "123123123",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+9876543210",
    "created_at": "2023-07-05T08:30:00Z",
    "updated_at": "2023-07-05T08:30:00Z"
  }
}
```

#### Update Guest

**Action**: `update_guest`

**Request**:
```json
{
  "action": "update_guest",
  "data": {
    "id": "987654321",
    "phone": "+0987654321"
  }
}
```

#### Delete Guest

**Action**: `delete_guest`

**Request**:
```json
{
  "action": "delete_guest",
  "data": {
    "id": "987654321"
  }
}
```

### Guest-Room Operations

#### Check In Guest

**Action**: `update_guest`

**Request**:
```json
{
  "action": "update_guest",
  "data": {
    "id": "987654321",
    "room_id": "123456789",
    "check_in_date": "2023-07-10T14:00:00Z"
  }
}
```

#### Check Out Guest

**Action**: `update_guest`

**Request**:
```json
{
  "action": "update_guest",
  "data": {
    "id": "987654321",
    "room_id": null,
    "check_out_date": "2023-07-15T12:00:00Z"
  }
}
```

#### Assign Multiple Guests to Room

**Action**: `assign_multiple_guests`

**Request**:
```json
{
  "action": "assign_multiple_guests",
  "data": {
    "guest_ids": ["987654321", "123123123"],
    "room_id": "123456789",
    "check_in_date": "2023-07-10T14:00:00Z"
  }
}
```

**Response**:
```json
{
  "action": "assign_multiple_guests",
  "data": {
    "success": true,
    "room_id": "123456789",
    "assigned_guests": 2,
    "updated_room": {
      "id": "123456789",
      "status": "occupied",
      "current_guests_count": 2,
      "guests": [
        {
          "id": "987654321",
          "first_name": "John",
          "last_name": "Doe"
        },
        {
          "id": "123123123",
          "first_name": "Jane",
          "last_name": "Smith"
        }
      ]
    }
  }
}
```

## Room Controls

The application provides a modern interface for controlling room features:

- **Door Lock**: Lock and unlock room doors remotely
- **Lights**: Control bathroom, bedroom, and hallway lights individually
- **Environment**: Monitor and adjust temperature, humidity, and air pressure

## UI Components

### Glassmorphism Effects

The application features a modern glassmorphism design with:

- Semi-transparent UI elements with blur effects
- Subtle borders and shadows
- Light reflections and gradients
- Hover and active states with animations

### Dark Mode

The dark mode provides a consistent visual language with:

- Dark indigo/purple background gradients
- Subtle glassmorphism effects with reduced transparency
- Improved contrast for better readability
- Matching color families between light and dark themes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
