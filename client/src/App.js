import React, { useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // replace with your server URL

function App() {
  const [socket, setSocket] = useState(null);
  const [filePath, setFilePath] = useState(null);

  const handleConnect = () => {
    // creating a socket connection with the server based on the SOCKET_URL
    const newSocket = io(SOCKET_URL, {
      query: {
        entityType: "client",
        entityId: "aritra" 
      }
    });
    setSocket(newSocket);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setFilePath(file.path);
  };

  const handleFileSend = () => {
    if (!socket || !filePath) {
      console.error('WebSocket not connected or no file selected.');
      return;
    }

    const fileData = {
      name: filePath.split('\\').pop(), // get just the filename from the full path
      path: filePath
    };

    socket.emit('file', fileData);
    console.log('File sent:', fileData);
  };

  return (
    <div>
      <button onClick={handleConnect}>Connect to WebSocket</button>
      <br />
      <input type="file" onChange={handleFileSelect} />
      <button onClick={handleFileSend}>Send file to WebSocket</button>
    </div>
  );
}

export default App;
