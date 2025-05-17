// API Server Configuration
export const API_CONFIG = {
  // Server URL - the hardware controller
  MAIN_SERVER_URL: '192.168.65.110:8000',
  
  // API request timeout in milliseconds
  TIMEOUT: 5000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // milliseconds
  
  // Feature flags
  USE_LOCAL_FALLBACK: true,  // Continue in local mode if server is unreachable
  SHOW_DEBUG_INFO: true,     // Show debug information in the app
};

// Get the active server URL - always returns the hardware controller address
export const getServerUrl = () => {
  return API_CONFIG.MAIN_SERVER_URL;
}; 