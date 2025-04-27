export function subscribeToWebSocket(userId, onMessage) {
  const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', userId }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}

export function sendWebSocketMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    ws.onopen = () => {
      ws.send(JSON.stringify(message));
    };
  }
}