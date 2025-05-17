// Add window interface extension
declare global {
  interface Window {
    global?: any;
  }
}

// Add global object for SockJS compatibility
if (typeof window !== 'undefined') {
  window.global = window;
}

// Additional polyfills for crypto functionality
if (typeof window !== 'undefined' && !window.crypto) {
  (window as any).crypto = {
    getRandomValues: function(buffer: Uint8Array) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    }
  };
}

export {}; // To make TypeScript treat this as a module 