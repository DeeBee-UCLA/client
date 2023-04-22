import React, { useRef, useState } from 'react';


const WebSocketComponent = () => {
  const [socket, setSocket] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  let selectedFilename = useRef('');
  
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    selectedFilename.current = file.name;
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

  const patelFunction = (fileObject) => {
    // insert functionality here
    // expect a base 64 string from this
    return "";
  }


  const handleSendButtonClick = async () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection is not open');
      return;
    }

    if (!selectedFile) {
      console.error('No file selected');
      return;
    }

    // sending a File Object
    let base64FileContent = patelFunction(selectedFile);

    let saveFileObject = {
      requestType: "saveFile",
      name: selectedFilename.current,
      body: base64FileContent
    };

    socket.send(JSON.stringify(saveFileObject));
 
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
