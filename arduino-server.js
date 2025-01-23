const express = require('express');
const expressWs = require('express-ws');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Express & WebSocket Setup
const app = express();
expressWs(app);
const activeConnections = new Set();
const editConnections = new Set(); // New set for edit modal connections

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
    console.log('\n--- Arduino Data Received ---');
    console.log('Raw data:', data);
    
    // Parse weight data
    const weightMatch = data.match(/Reading:\s*([-]?\d+\.?\d*)\s*gram/);
    
    if (weightMatch) {
      const weight = Math.abs(parseFloat(weightMatch[1]));
      console.log('Parsed weight:', weight);
      console.log('Active entry connections:', activeConnections.size);
      console.log('Active edit connections:', editConnections.size);
      
      const message = JSON.stringify({
        type: 'weight',
        weight: weight,
        timestamp: Date.now()
      });

      // Broadcast to entry clients
      activeConnections.forEach((client) => {
        if (client.readyState === client.OPEN) {
          console.log('Broadcasting to entry client');
          client.send(message);
        }
      });

      // Broadcast to edit clients
      editConnections.forEach((client) => {
        if (client.readyState === client.OPEN) {
          console.log('Broadcasting to edit client');
          client.send(message);
        }
      });
    }
  } catch (error) {
    console.error('Error processing Arduino data:', error);
  }
});

// Original WebSocket endpoint for entry weight
app.ws('/ws', (ws, req) => {
  console.log('\n--- New Entry Connection ---');
  console.log('Total entry connections before:', activeConnections.size);
  activeConnections.add(ws);
  console.log('Total entry connections after:', activeConnections.size);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Entry client message:', data);
    } catch (error) {
      console.error('Error processing entry client message:', error);
    }
  });

  ws.on('close', () => {
    console.log('\n--- Entry Connection Closed ---');
    console.log('Total entry connections before:', activeConnections.size);
    activeConnections.delete(ws);
    console.log('Total entry connections after:', activeConnections.size);
  });

  ws.on('error', (error) => {
    console.error('Entry WebSocket error:', error);
    activeConnections.delete(ws);
  });
});

// New WebSocket endpoint for edit weight
app.ws('/ws-edit', (ws, req) => {
  console.log('\n--- New Edit Connection ---');
  console.log('Total edit connections before:', editConnections.size);
  editConnections.add(ws);
  console.log('Total edit connections after:', editConnections.size);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Edit client message:', data);
    } catch (error) {
      console.error('Error processing edit client message:', error);
    }
  });

  ws.on('close', () => {
    console.log('\n--- Edit Connection Closed ---');
    console.log('Total edit connections before:', editConnections.size);
    editConnections.delete(ws);
    console.log('Total edit connections after:', editConnections.size);
  });

  ws.on('error', (error) => {
    console.error('Edit WebSocket error:', error);
    editConnections.delete(ws);
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