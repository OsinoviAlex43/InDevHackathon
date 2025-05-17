/**
 * WebSocket Service
 * 
 * Provides a centralized WebSocket connection management for the application.
 * This service handles connection establishment, reconnection logic, message sending,
 * and dispatching messages to appropriate handlers.
 * 
 * @module WebSocketService
 */

// Connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Message handler type
export type MessageHandler = (message: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private reconnectTimer: number | null = null;
  private reconnectInterval = 3000; // 3 seconds
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private defaultHandler: MessageHandler | null = null;

  /**
   * Creates a new WebSocket service instance
   * @param url - The WebSocket server URL
   */
  constructor(url: string = 'ws://localhost:8080') {
    this.url = url;
  }

  /**
   * Opens a new WebSocket connection
   * @returns Promise that resolves when connected or rejects on failure
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.connectionState === ConnectionState.CONNECTED) {
        console.log('WebSocket already connected');
        resolve(true);
        return;
      }

      // Clean up existing connection if any
      this.cleanup();

      this.connectionState = ConnectionState.CONNECTING;
      console.log(`Attempting to connect to WebSocket (Attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);

      try {
        const ws = new WebSocket(this.url);

        // Define event handlers
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          this.connectionState = ConnectionState.CONNECTED;
          this.connectionAttempts = 0;
          resolve(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          this.connectionState = ConnectionState.ERROR;
          
          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.error(`Max connection attempts (${this.maxConnectionAttempts}) reached`);
            reject(new Error('Failed to connect to WebSocket server'));
          } else {
            this.attemptReconnect();
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.connectionState = ConnectionState.DISCONNECTED;
          this.attemptReconnect();
        };

        this.ws = ws;
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        this.connectionState = ConnectionState.ERROR;
        reject(error);
      }
    });
  }

  /**
   * Attempts to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    if (this.connectionAttempts < this.maxConnectionAttempts) {
      this.connectionAttempts++;
      console.log(`Scheduling reconnect attempt ${this.connectionAttempts}/${this.maxConnectionAttempts} in ${this.reconnectInterval}ms`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.connect().catch(() => {
          console.error('Reconnect attempt failed');
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached, giving up');
    }
  }

  /**
   * Cleans up the WebSocket connection
   */
  private cleanup(): void {
    if (this.ws) {
      // Remove event handlers to prevent memory leaks
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      // Close the connection if it's still open
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      
      this.ws = null;
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Sends a message through the WebSocket connection
   * @param action - The action type
   * @param data - The message payload
   * @returns True if message was sent, false otherwise
   */
  public sendMessage(action: string, data: any = {}): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message - WebSocket is not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ action, data });
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Registers a message handler for a specific action type
   * @param action - The action type to handle
   * @param handler - The handler function
   */
  public registerHandler(action: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(action)) {
      this.messageHandlers.set(action, []);
    }
    
    this.messageHandlers.get(action)!.push(handler);
  }

  /**
   * Unregisters a message handler
   * @param action - The action type
   * @param handler - The handler function to remove (if omitted, all handlers for this action are removed)
   */
  public unregisterHandler(action: string, handler?: MessageHandler): void {
    if (!handler) {
      // Remove all handlers for this action
      this.messageHandlers.delete(action);
    } else if (this.messageHandlers.has(action)) {
      // Remove specific handler
      const handlers = this.messageHandlers.get(action)!;
      const index = handlers.indexOf(handler);
      
      if (index !== -1) {
        handlers.splice(index, 1);
        
        if (handlers.length === 0) {
          this.messageHandlers.delete(action);
        }
      }
    }
  }

  /**
   * Sets a default handler for messages with no registered handlers
   * @param handler - The default handler function
   */
  public setDefaultHandler(handler: MessageHandler): void {
    this.defaultHandler = handler;
  }

  /**
   * Handles incoming WebSocket messages
   * @param message - The message to handle
   */
  private handleMessage(message: any): void {
    if (!message || !message.action) {
      console.warn('Received invalid WebSocket message:', message);
      return;
    }

    const { action } = message;
    
    if (this.messageHandlers.has(action)) {
      // Call all registered handlers for this action
      this.messageHandlers.get(action)!.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in handler for action "${action}":`, error);
        }
      });
    } else if (this.defaultHandler) {
      // Use default handler if no specific handlers found
      try {
        this.defaultHandler(message);
      } catch (error) {
        console.error('Error in default message handler:', error);
      }
    } else {
      console.warn(`No handler registered for WebSocket message action: ${action}`);
    }
  }

  /**
   * Disconnects the WebSocket connection
   */
  public disconnect(): void {
    console.log('Disconnecting WebSocket');
    
    // Stop reconnect attempts
    this.connectionAttempts = this.maxConnectionAttempts;
    
    this.cleanup();
    this.connectionState = ConnectionState.DISCONNECTED;
  }

  /**
   * Gets the current connection state
   * @returns The current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Checks if the WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && 
           this.ws !== null && 
           this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 