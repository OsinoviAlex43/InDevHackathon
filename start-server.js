// Server launcher script
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the server.js file in backend/node
const serverPath = path.join(__dirname, 'backend', 'node', 'server.js');
const dotenvPath = path.join(__dirname, 'backend', 'node', 'dotenv');
const targetEnvPath = path.join(__dirname, 'backend', 'node', '.env');

// Copy the dotenv file to .env if it doesn't exist
if (!fs.existsSync(targetEnvPath) && fs.existsSync(dotenvPath)) {
  fs.copyFileSync(dotenvPath, targetEnvPath);
  console.log('Created .env file from dotenv template');
}

// Check if server.js exists
if (!fs.existsSync(serverPath)) {
  console.error(`ERROR: Server file not found at ${serverPath}`);
  process.exit(1);
}

console.log(`Starting server from ${serverPath}`);

// Change directory to backend/node and start the server
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend', 'node'),
  stdio: 'inherit'
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`Server process exited with code ${code}`);
  }
}); 