const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

// Configuration
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/ttyUSB0';  // Adjust this to your Arduino port
const BAUD_RATE = 9600;
const WS_PRODUCTION_URL = process.env.WS_URL || 'ws://localhost:3000/ws';  // Default to localhost for testing

console.log(`Starting Arduino bridge...`);
console.log(`Serial Port: ${SERIAL_PORT}`);
console.log(`WebSocket URL: ${WS_PRODUCTION_URL}`);

// Initialize Serial Port
const serialPort = new SerialPort.SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// WebSocket connection to production
let ws;
let isConnected = false;
let reconnectTimeout;

function connectWebSocket() {
  console.log(`Attempting to connect to WebSocket at ${WS_PRODUCTION_URL}`);
  ws = new WebSocket(WS_PRODUCTION_URL);

  ws.on('open', () => {
    console.log('Connected to WebSocket server');
    isConnected = true;
    clearTimeout(reconnectTimeout);
  });

  ws.on('close', () => {
    console.log('Disconnected from WebSocket server. Attempting to reconnect...');
    isConnected = false;
    // Try to reconnect after 5 seconds
    reconnectTimeout = setTimeout(connectWebSocket, 5000);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    console.log('If testing locally, make sure your web app is running and WebSocket server is enabled');
  });
}

// Handle Serial Port connection
serialPort.on('open', () => {
  console.log('Serial port opened successfully');
  connectWebSocket();
});

serialPort.on('error', (err) => {
  console.error('Serial Port error:', err);
  console.log('Tips for Serial Port issues:');
  console.log('1. Check if Arduino is connected');
  console.log('2. Verify the correct port (current: ' + SERIAL_PORT + ')');
  console.log('3. Ensure you have permissions (try: sudo chmod a+rw ' + SERIAL_PORT + ')');
});

// Process data from Arduino and send to production
parser.on('data', (data) => {
  try {
    console.log('Received from Arduino:', data);
    
    // Parse weight data (adjust the regex based on your Arduino output format)
    const weightMatch = data.match(/Reading:\s*([-]?\d+\.?\d*)\s*gram/);
    
    if (weightMatch && isConnected) {
      const weight = Math.abs(parseFloat(weightMatch[1]));
      console.log('Sending weight to WebSocket server:', weight);
      
      ws.send(JSON.stringify({
        type: 'weight',
        weight: weight,
        timestamp: Date.now()
      }));
    }
  } catch (error) {
    console.error('Error processing data:', error);
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Closing connections...');
  if (ws) ws.close();
  await serialPort.close();
  process.exit();
}); 