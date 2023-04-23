import React, { useRef, useState } from "react";
import LoginForm from "./LoginForm";
import { RequestType, Status } from './constants';
import './App.css';
const crypto = require("crypto");
const zlib = require("zlib");
const dotenv = require('dotenv');
dotenv.config();


const encryptionString = process.env.REACT_APP_ENCRYPTION_KEY;
// const encryptionKey = crypto.createHash('sha256').update(String(encryptionString)).digest('base64').substring(0, 32);
const encryptionKey = encryptionString;

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

  const handleWebSocketMessage = async (event) => {
    const receivedData = JSON.parse(event.data);
    console.log("Response from server:", receivedData);
    let requestType = receivedData.requestType;
    let status = receivedData.status;
    switch(requestType) {
      case RequestType.INIT:
        if (status === Status.SUCCESS) {
          console.log("Successfully init current username with server");
        }
        else {
          // this should not happen
          console.log("Failed Init");
        }
        break;
      case RequestType.SAVE_FILE:
        if (status === Status.SUCCESS) {
          console.log("File successfully sent!")
        }
        else {
          // This is for decryption on my end
          let base64FileContent = receivedData.body;
          let originalFile;
          try {
            originalFile = await decryptFile(base64FileContent, encryptionKey);
          } catch (err) {
            console.error(err);
            return;
          }
          saveBlobToFile(originalFile, "fileName.txt");
          console.log("Error:", receivedData.message);
        }
        break;
      case RequestType.RETRIEVE_FILE:
        if (status === Status.SUCCESS) {
          console.log("File retrieved");
          let base64FileContent = receivedData.body;    
          let originalFile;
          try {
            originalFile = await decryptFile(base64FileContent, encryptionKey);
          } catch (err) {
            console.error(err);
            return;
          }
          saveBlobToFile(originalFile, "fileName.txt");
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
    console.log("WebSocket connection closed");
  };

  const encryptFile = async (fileObject, encryptionKey) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fileObject);

    return new Promise((resolve, reject) => {
      reader.onload = function () {
        const uncompressedData = new Uint8Array(reader.result);
        zlib.deflate(uncompressedData, function (err, compressedData) {
          if (!err) {
            const iv = crypto.randomBytes(16); // Generate a random IV for encryption
            const cipher = crypto.createCipheriv(
              "aes-256-cbc",
              encryptionKey,
              iv
            );
            let encryptedData = cipher.update(compressedData);
            encryptedData = Buffer.concat([encryptedData, cipher.final()]);
            const encryptedDataWithIV = Buffer.concat([iv, encryptedData]);
            const base64Data = encryptedDataWithIV.toString("base64");
            resolve(base64Data);
          } else {
            reject(err);
          }
        });
      };
    });
  };

  const decryptFile = async (encryptedData, encryptionKey) => {
    const encryptedDataWithIV = Buffer.from(encryptedData, "base64");
    const iv = encryptedDataWithIV.slice(0, 16);
    const encryptedDataWithoutIV = encryptedDataWithIV.slice(16);

    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    let decryptedData = decipher.update(encryptedDataWithoutIV);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);

    const uncompressedData = await new Promise((resolve, reject) => {
      zlib.inflate(decryptedData, (err, uncompressedData) => {
        if (!err) {
          resolve(uncompressedData);
        } else {
          reject(err);
        }
      });
    });

    return new Blob([uncompressedData]);
  };

  const saveBlobToFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendButtonClick = async () => {
    // TODO:
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket connection is not open");
      return;
    }

    if (!selectedFile) {
      console.error("No file selected");
      return;
    }


    let base64FileContent;
    try {
      base64FileContent = await encryptFile(selectedFile, encryptionKey);
    } catch (err) {
      console.error(err);
      return;
    }

   currUsername.current = localStorage.getItem('username');

    let saveFileObject = {
      username: currUsername.current,
      requestType: RequestType.SAVE_FILE,
      filename: selectedFilename.current,
      body: base64FileContent
    };

    socket.current.send(JSON.stringify(saveFileObject));
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

  // return (
  //   <div className="container">
  //     <div className="login-banner">
  //       <div className="navbar">
  //         <h1 className="title">Login Form</h1>
  //       </div>
  //     </div>
  //     <div className="login-form">
  //       <LoginForm onLogin={handleLogin} />
  //     </div>
  //     <div className="button-group">
  //       <button className="btn" onClick={handleConnectButtonClick}>
  //         Initialize Connection
  //       </button>
  //       <div className="input-group">
  //         <input type="file" className="file-input" onChange={handleFileInputChange} />
  //         <button className="btn" onClick={handleSendButtonClick}>
  //           Send File
  //         </button>
          
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <>
    <LoginForm></LoginForm>
    </>
  )
  

  
};

export default WebSocketComponent;
