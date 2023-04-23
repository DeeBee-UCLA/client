import React, { useRef, useState } from 'react';
import LoginForm from "./LoginForm";
import { RequestType, Status } from './constants';
import './App.css';

const WebSocketComponent = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  let selectedFilename = useRef('');
  let currUsername = useRef('');
  let currPassword = useRef('');
  let socket = useRef(null);
  
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    selectedFilename.current = file.name;
  };

  const handleWebSocketOpen = () => {
    console.log('WebSocket connection opened');
   
      let initObject = {	
        requestType: RequestType.INIT,
        username: currUsername.current,
        password: currPassword.current
      }
      socket.current.send(JSON.stringify(initObject));
   
  };

  const handleWebSocketMessage = (event) => {
    const receivedData = JSON.parse(event.data);
    console.log("Response from server:", receivedData);
    let requestType = receivedData.requestType;
    let status = receivedData.status;
    switch(requestType) {
      case RequestType.INIT:
        if (status === Status.SUCCESS) {
          console.log("Successfully init current username with server")
        }
        else {
          // this should not happen
        }
        break;
      case RequestType.SAVE_FILE:
        if (status === Status.SUCCESS) {
          console.log("File successfully sent!")
        }
        else {
          console.log("Error:", receivedData.message);
        }
        break;
      case RequestType.RETRIEVE_FILE:
        if (status === Status.SUCCESS) {
          console.log("File retrieved");
        }
        else {
          console.log("Error", receivedData.message);
        }
        break;
      default:
        console.log("Error: requestType, ", requestType)
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
      username: currUsername.current,
      password: currPassword.current,
      requestType: RequestType.SAVE_FILE,
      filename: selectedFilename.current,
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
    socket.current = newSocket;
  };

  const handleLogin = ({ username, password }) => {
    console.log("Login data:", { username, password });
    currUsername.current = username;
    currPassword.current = password;
  };

  return (
    <div className="container">
      <div className="login-banner">
        <div className="navbar">
          <h1 className="title">Login Form</h1>
        </div>
      </div>
      <div className="login-form">
        <LoginForm onLogin={handleLogin} />
      </div>
      <div className="button-group">
        <button className="btn" onClick={handleConnectButtonClick}>
          Initialize Connection
        </button>
        <div className="input-group">
          <input type="file" className="file-input" onChange={handleFileInputChange} />
          <button className="btn" onClick={handleSendButtonClick}>
            Send File
          </button>
        </div>
      </div>
    </div>
  );
  

  
};

export default WebSocketComponent;
