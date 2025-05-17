# Hotel Management System

A modern hotel management system built with Node.js (WebSocket backend) and React (frontend).

## Features

- Real-time updates using WebSockets
- Room management (create, update, delete)
- Guest management (create, update, delete)
- Room sensor data visualization (temperature, humidity, pressure)
- Room light control
- Persistent storage using PostgreSQL with file-based fallback

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (optional)

### Environment Variables

Create a `.env` file in the `backend/node` directory with the following variables:

```
PORT=8080
PGUSER=postgres
PGHOST=localhost
PGDATABASE=hotel_management
PGPASSWORD=postgres
PGPORT=5432
```

Adjust the PostgreSQL connection details as needed.

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install backend dependencies
cd backend/node
npm install

# Install frontend dependencies
cd ../../frontend/web
npm install
```

### Database Setup

If you want to use PostgreSQL:

1. Create a PostgreSQL database named `hotel_management`
2. Initialize the database:

```bash
npm run init-db
```

## Running the Application

From the root directory:

```bash
# Start the backend server
npm run start:backend

# In another terminal, start the frontend
npm run start:frontend
```

For development with auto-restart:

```bash
# Start the backend with auto-reload
npm run dev:backend

# Start the frontend with hot-reloading
npm run dev:frontend
```

## Fallback Mechanism

If PostgreSQL is not available, the system will automatically use file-based storage in `backend/node/data/` directory. This ensures the application remains functional even without a database connection.

## License

ISC 