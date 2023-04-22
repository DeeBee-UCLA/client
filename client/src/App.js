import React, { useState } from 'react';

const clientStates = {
  CONNECTED: "CONNECTED"
  
}

const WebSocketComponent = () => {
  const [socket, setSocket] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleWebSocketOpen = () => {
    console.log('WebSocket connection opened');
  };

  const handleWebSocketMessage = (event) => {
    const receivedData = JSON.parse(event.data);

    // Assume the server sends back an object with a "type" field that indicates the file type
    if (receivedData.type === 'text') {
      const receivedText = receivedData.content;
      const blob = new Blob([receivedText], { type: 'text/plain' });
      setReceivedFile(blob);
    } else if (receivedData.type === 'image') {
      const receivedImage = receivedData.content;
      const blob = new Blob([receivedImage], { type: 'image/jpeg' });
      setReceivedFile(blob);
    } else if (receivedData.type === 'audio') {
      const receivedAudio = receivedData.content;
      const blob = new Blob([receivedAudio], { type: 'audio/mpeg' });
      setReceivedFile(blob);
    } else {
      console.error('Received unknown file type:', receivedData.type);
    }
  };

  const handleWebSocketClose = () => {
    console.log('WebSocket connection closed');
  };

  const handleSendButtonClick = async () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection is not open');
      return;
    }

    if (!selectedFile) {
      console.error('No file selected');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const fileContent = reader.result;
      console.log(fileContent);
      // Assume the file type is determined based on the file extension
      const fileType = selectedFile.name.split('.').pop();

      const data = {
        type: fileType,
        content: fileContent,
      };
      console.log(data);
      socket.send(JSON.stringify(data));
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleConnectButtonClick = () => {
    const newSocket = new WebSocket('ws://localhost:8080');

    newSocket.addEventListener('open', handleWebSocketOpen);
    newSocket.addEventListener('message', handleWebSocketMessage);
    newSocket.addEventListener('close', handleWebSocketClose);

    setSocket(newSocket);
  };

  return (
    <div>
      <button onClick={handleConnectButtonClick}>Initialize Connection</button>
      <input type="file" onChange={handleFileInputChange} />
      <button onClick={handleSendButtonClick}>Send File</button>
      {receivedFile && (
        <div>
          <p>Received file:</p>
          {receivedFile.type.startsWith('image') && <img src={URL.createObjectURL(receivedFile)} />}
          {receivedFile.type.startsWith('audio') && <audio controls src={URL.createObjectURL(receivedFile)} />}
          {receivedFile.type === 'text/plain' && <pre>{receivedFile.text()}</pre>}
        </div>
      )}
    </div>
  );
};

export default WebSocketComponent;
