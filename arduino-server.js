const express = require('express');
const expressWs = require('express-ws');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Express & WebSocket Setup
const app = express();
expressWs(app);
const activeConnections = new Set();

// Arduino Configuration
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/ttyUSB0';
const BAUD_RATE = 9600;

console.log('Starting Arduino WebSocket Server...');
console.log(`Serial Port: ${SERIAL_PORT}`);

// Initialize Serial Port
const serialPort = new SerialPort.SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Handle Serial Port connection
serialPort.on('open', () => {
  console.log('Serial port opened successfully');
});

serialPort.on('error', (err) => {
  console.error('Serial Port error:', err);
  console.log('Tips for Serial Port issues:');
  console.log('1. Check if Arduino is connected');
  console.log('2. Verify the correct port (current: ' + SERIAL_PORT + ')');
  console.log('3. Ensure you have permissions (try: sudo chmod a+rw ' + SERIAL_PORT + ')');
});

// Process data from Arduino and broadcast to all WebSocket clients
parser.on('data', (data) => {
  try {
    console.log('Received from Arduino:', data);
    
    // Parse weight data
    const weightMatch = data.match(/Reading:\s*([-]?\d+\.?\d*)\s*gram/);
    
    if (weightMatch) {
      const weight = Math.abs(parseFloat(weightMatch[1]));
      console.log('Broadcasting weight to clients:', weight);
      
      const message = JSON.stringify({
        type: 'weight',
        weight: weight,
        timestamp: Date.now()
      });

      // Broadcast to all connected clients
      activeConnections.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(message);
        }
      });
    }
  } catch (error) {
    console.error('Error processing Arduino data:', error);
  }
});

// WebSocket endpoint
app.ws('/ws', (ws, req) => {
  console.log('New WebSocket client connected');
  activeConnections.add(ws);

  // Handle client messages (if needed)
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received from client:', data);
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    activeConnections.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket client error:', error);
    activeConnections.delete(ws);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Arduino WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nClosing connections...');
  activeConnections.forEach(client => client.close());
  await serialPort.close();
  process.exit();
}); 