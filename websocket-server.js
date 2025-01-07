const express = require('express');
const expressWs = require('express-ws');
const app = express();

// Enable WebSocket
expressWs(app);

// Store active connections
let activeConnections = new Set();

// WebSocket endpoint
app.ws('/ws', (ws, req) => {
  console.log('New WebSocket connection');
  activeConnections.add(ws);

  // Handle incoming messages
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received:', data);
      
      // Broadcast to all connected clients
      activeConnections.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    activeConnections.delete(ws);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
}); 