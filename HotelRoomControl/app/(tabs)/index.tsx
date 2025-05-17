import { StyleSheet, ToastAndroid } from 'react-native';
import { View, Text } from 'react-native';
import { useState, useCallback } from 'react';
import { Card, Title, Paragraph, ActivityIndicator, Switch } from 'react-native-paper';
import axios from 'axios';
import { API_CONFIG, getServerUrl } from '../config';

// Get the server URL from configuration - this should be 192.168.65.110:8000
const API_URL = getServerUrl();

// Initial room state
const initialRoom = {
  id: '1',
  room_number: '101',
  room_type: 'Deluxe',
  status: 'Available',
  price_per_night: 250,
  sensors: {
    temperature: 22.5,
    humidity: 45,
    lights: false,
    door_locked: true
  }
};

export default function RoomControlScreen() {
  const [isLightOn, setIsLightOn] = useState(false);
  const [isDoorLocked, setIsDoorLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('Tap a control to interact');

  // Function to send a request to the server
  const sendRequest = useCallback(async (endpoint: string) => {
    setLoading(true);
    setError('');
    setServerStatus(`Sending request to ${endpoint}...`);
    
    try {
      // Log the request URL for debugging
      const requestUrl = `http://${API_URL}/${endpoint}`;
      console.log(`Sending request to: ${requestUrl}`);
      
      // Make the request to the hardware controller
      const response = await axios.post(requestUrl, {}, { 
        timeout: API_CONFIG.TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Show success message
      console.log('Server response:', response.data);
      setServerStatus(`Success: ${endpoint} request completed`);
      ToastAndroid.show(`Command sent to server: ${endpoint}`, ToastAndroid.SHORT);
      
      return true;
    } catch (err) {
      // Handle errors
      console.error(`Error sending ${endpoint} request:`, err);
      setError(`Failed to send ${endpoint} request. Server may be offline.`);
      setServerStatus('Error: Server did not respond');
      ToastAndroid.show('Server communication error', ToastAndroid.LONG);
      
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Control the lights
  const toggleLights = useCallback(async () => {
    const endpoint = isLightOn ? 'light_off' : 'light_on';
    const success = await sendRequest(endpoint);
    
    // Update UI state even if request fails (local fallback)
    if (success || API_CONFIG.USE_LOCAL_FALLBACK) {
      setIsLightOn(!isLightOn);
    }
  }, [isLightOn, sendRequest]);

  // Control the door
  const toggleDoor = useCallback(async () => {
    const endpoint = isDoorLocked ? 'door_open' : 'door_close';
    const success = await sendRequest(endpoint);
    
    // Update UI state even if request fails (local fallback)
    if (success || API_CONFIG.USE_LOCAL_FALLBACK) {
      setIsDoorLocked(!isDoorLocked);
    }
  }, [isDoorLocked, sendRequest]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Room {initialRoom.room_number}</Title>
          <Paragraph style={styles.roomType}>{initialRoom.room_type} Room</Paragraph>
          
          <View style={styles.statusContainer}>
            <Text style={styles.serverStatusText}>
              {serverStatus}
            </Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Temperature</Text>
              <Text style={styles.infoValue}>{initialRoom.sensors.temperature}°C</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Humidity</Text>
              <Text style={styles.infoValue}>{initialRoom.sensors.humidity}%</Text>
            </View>
          </View>
          
          <View style={styles.controlsContainer}>
            <View style={styles.controlItem}>
              <Text style={styles.controlLabel}>Lights</Text>
              <Switch
                value={isLightOn}
                onValueChange={toggleLights}
                disabled={loading}
                color="#2196F3"
              />
              <Text style={[
                styles.statusText,
                isLightOn ? styles.statusOn : styles.statusOff
              ]}>
                {isLightOn ? 'ON' : 'OFF'}
              </Text>
            </View>
            
            <View style={styles.controlItem}>
              <Text style={styles.controlLabel}>Door</Text>
              <Switch
                value={!isDoorLocked}
                onValueChange={toggleDoor}
                disabled={loading}
                color="#2196F3"
              />
              <Text style={[
                styles.statusText,
                !isDoorLocked ? styles.statusOn : styles.statusOff
              ]}>
                {isDoorLocked ? 'LOCKED' : 'UNLOCKED'}
              </Text>
            </View>
          </View>
          
          {loading && <ActivityIndicator style={styles.loader} size="small" />}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Text style={styles.serverInfo}>
            Server: {API_URL}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  card: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  roomType: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  serverStatusText: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  controlsContainer: {
    marginTop: 20,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 80,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusOn: {
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusOff: {
    color: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 16,
    textAlign: 'center',
  },
  serverInfo: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});
