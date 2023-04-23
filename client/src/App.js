import React, { useRef, useState } from "react";
const crypto = require("crypto");
const zlib = require("zlib");
const dotenv = require('dotenv');
dotenv.config();


const encryptionString = process.env.REACT_APP_ENCRYPTION_KEY;
// const encryptionKey = crypto.createHash('sha256').update(String(encryptionString)).digest('base64').substring(0, 32);
const encryptionKey = encryptionString;

const WebSocketComponent = () => {
  const [socket, setSocket] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  let selectedFilename = useRef("");  

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    selectedFilename.current = file.name;
  };

  const handleWebSocketOpen = () => {
    console.log("WebSocket connection opened");
  };

  const handleWebSocketMessage = (event) => {
    const receivedData = JSON.parse(event.data);

    // Assume the server sends back an object with a "type" field that indicates the file type
    if (receivedData.type === "text") {
      const receivedText = receivedData.content;
      const blob = new Blob([receivedText], { type: "text/plain" });
      setReceivedFile(blob);
    } else if (receivedData.type === "image") {
      const receivedImage = receivedData.content;
      const blob = new Blob([receivedImage], { type: "image/jpeg" });
      setReceivedFile(blob);
    } else if (receivedData.type === "audio") {
      const receivedAudio = receivedData.content;
      const blob = new Blob([receivedAudio], { type: "audio/mpeg" });
      setReceivedFile(blob);
    } else {
      console.error("Received unknown file type:", receivedData.type);
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
    // if (!socket || socket.readyState !== WebSocket.OPEN) {
    //   console.error("WebSocket connection is not open");
    //   return;
    // }

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
    // console.log(base64FileContent)

    const saveFileObject = {
      requestType: "saveFile",
      name: selectedFilename.current,
      body: base64FileContent,
    };


    // TODO:
    let originalFile;
    try {
      originalFile = await decryptFile(base64FileContent, encryptionKey);
    } catch (err) {
      console.error(err);
      return;
    }
    saveBlobToFile(originalFile, "fileName.txt");

    // socket.send(JSON.stringify(saveFileObject));
  };

  const handleConnectButtonClick = () => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("open", handleWebSocketOpen);
    newSocket.addEventListener("message", handleWebSocketMessage);
    newSocket.addEventListener("close", handleWebSocketClose);

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
          {receivedFile.type.startsWith("image") && (
            <img src={URL.createObjectURL(receivedFile)} />
          )}
          {receivedFile.type.startsWith("audio") && (
            <audio controls src={URL.createObjectURL(receivedFile)} />
          )}
          {receivedFile.type === "text/plain" && (
            <pre>{receivedFile.text()}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default WebSocketComponent;
