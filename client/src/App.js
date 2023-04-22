import React, { useState, useRef } from 'react';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [receivedMessage, setReceivedMessage] = useState('');

  const webSocketRef = useRef(null);

  const connectWebSocket = () => {
    // Replace 'ws://localhost:8080' with the URL of your WebSocket server
    const webSocket = new WebSocket('ws://localhost:8080');

    webSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      webSocketRef.current = webSocket;
    };

    webSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      webSocketRef.current = null;
    };

    webSocket.onmessage = (event) => {
      console.log('WebSocket received message:', event.data);
      setReceivedMessage(event.data);
    };
  };

  const sendMessage = () => {
    if (webSocketRef.current) {
      webSocketRef.current.send(message);
      setMessage('');
    }
  };

  return (
    <div>
      <button onClick={connectWebSocket} disabled={isConnected}>
        {isConnected ? 'WebSocket connected' : 'Connect WebSocket'}
      </button>
      <br />
      <input type="text" value={message} onChange={(event) => setMessage(event.target.value)} />
      <button onClick={sendMessage} disabled={!isConnected}>
        Send Message
      </button>
      <br />
      <div>Received message: {receivedMessage}</div>
    </div>
  );
};

export default App;
