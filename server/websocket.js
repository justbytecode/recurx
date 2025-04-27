import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: process.env.WEBSOCKET_PORT || 8080 });
const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.userId) {
        clients.set(data.userId, ws);
        ws.userId = data.userId;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });
});

export function broadcast(data) {
  const targetWs = clients.get(data.userId);
  if (targetWs && targetWs.readyState === WebSocketServer.OPEN) {
    targetWs.send(JSON.stringify(data));
  }
}