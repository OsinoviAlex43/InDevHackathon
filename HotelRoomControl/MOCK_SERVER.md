# Mock Server Setup

This mock server simulates the hotel room control endpoints for testing the app when the real hardware server is unavailable.

## Prerequisites

- Node.js
- npm or yarn
- Express and CORS packages (already included in the project)

## Running the Mock Server

1. First, find your computer's IP address:
   - On Windows: Open Command Prompt and type `ipconfig`
   - On macOS: Open Terminal and type `ifconfig`
   - Look for the IPv4 address, typically starting with 192.168.x.x

2. Update the app configuration:
   - Open `app/config.js`
   - Change the `DEBUG_SERVER_URL` to your IP address with port 8000
   - Example: `DEBUG_SERVER_URL: '192.168.1.100:8000'`
   - Uncomment the line `// return API_CONFIG.DEBUG_SERVER_URL;` in the `getServerUrl()` function

3. Start the mock server:
   ```bash
   npm run mock-server
   ```

4. You should see output like:
   ```
   Mock server running at http://0.0.0.0:8000
   Available endpoints:
   - GET /light_status
   - POST /light_on
   - POST /light_off
   - POST /door_open
   - POST /door_close
   ```

5. In a separate terminal window, start the React Native app:
   ```bash
   npm start
   ```

6. Use the app as normal. All requests will now go to your mock server.

## API Endpoints

The mock server implements the following endpoints:

- `GET /light_status` - Returns the current state of lights and door
- `POST /light_on` - Turns on the lights
- `POST /light_off` - Turns off the lights
- `POST /door_open` - Unlocks the door
- `POST /door_close` - Locks the door

## Troubleshooting

- If the app can't connect to the mock server, check that your firewall allows connections on port 8000
- Ensure both devices (server and app) are on the same network
- Verify the IP address is correct - it may change if you connect to a different network 