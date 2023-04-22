import React, { useRef, useState } from 'react';
import LoginForm from "./LoginForm";

const WebSocketComponent = () => {
  const [socket, setSocket] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  let selectedFilename = useRef('');
  let currUsername = useRef('');
  let currPassword = useRef('');
  
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    selectedFilename.current = file.name;
  };

  const handleWebSocketOpen = () => {
    console.log('WebSocket connection opened');
    let initObject = {	
      requestType: "Init",
      username: currUsername.current,
      password: currPassword.current
    }
    socket.send(JSON.stringify(initObject));
  };

  const handleWebSocketMessage = (event) => {
    const receivedData = JSON.parse(event.data);
    console.log("Response from server:", receivedData);
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
      username: "",
      password: "",
      requestType: "saveFile",
      name: selectedFilename.current,
      body: base64FileContent
    };

    socket.send(JSON.stringify(saveFileObject));
    selectedFilename.current = "";
  };

  const handleConnectButtonClick = () => {
    const newSocket = new WebSocket('ws://localhost:8080');
    newSocket.addEventListener('open', handleWebSocketOpen);
    newSocket.addEventListener('message', handleWebSocketMessage);
    newSocket.addEventListener('close', handleWebSocketClose);

    setSocket(newSocket);
  };

  const handleLogin = ({ username, password }) => {
    console.log("Login data:", { username, password });
    currUsername.current = username;
    currPassword.current = password;
  };

  return (
    <div>
      <div>
      <h1>Login Form</h1>
      <LoginForm onLogin={handleLogin} />
    </div>
      <button onClick={handleConnectButtonClick}>Initialize Connection</button>
      <input type="file" onChange={handleFileInputChange} />
      <button onClick={handleSendButtonClick}>Send File</button>
   
    </div>
  );
};

export default WebSocketComponent;
