import React, { useRef, useState } from "react";
import LoginForm from "./LoginForm";
import { RequestType, Status } from "./constants";
import "./App.css";
import { ReactComponent as ReactLogo } from "./logo.svg";
import { ReactComponent as HiveLogo } from "./hive.svg";
const crypto = require("crypto");
const zlib = require("zlib");
const dotenv = require("dotenv");
dotenv.config();

const encryptionString = process.env.REACT_APP_ENCRYPTION_KEY;
// const encryptionKey = crypto.createHash('sha256').update(String(encryptionString)).digest('base64').substring(0, 32);
const encryptionKey = encryptionString;

const WebSocketComponent = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [pickedFile, setPickedFile] = useState("");
  const [login, setLogin] = useState(true);

  let selectedFilename = useRef("");
  const fileInput = useRef(null);
  let currUsername = useRef("");
  let currPassword = useRef("");
  let socket = useRef(null);

  const handleFileInputChange = (event) => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      selectedFilename.current = file.name;
    }
    else{
      setSelectedFile(null);
      selectedFilename.current = "";
    }
  };
  const handleOptionChange = (event) => {
    console.log(event.target.value);
    setPickedFile(event.target.value);
  };

  // =============================================================================

  const handleWebSocketOpen = () => {
    console.log("WebSocket connection opened");

    let initObject = {
      requestType: RequestType.INIT,
      entityType: "Client",
      username: currUsername.current,
      password: currPassword.current,
    };
    socket.current.send(JSON.stringify(initObject));
    handleFetchAllFiles();
    setLogin(false);
  };

  const handleWebSocketMessage = async (event) => {
    const receivedData = JSON.parse(event.data);
    console.log("Response from server:", receivedData);
    let requestType = receivedData.requestType;
    let status = receivedData.status;
    switch (requestType) {
      case RequestType.INIT:
        if (status === Status.SUCCESS) {
          console.log("Successfully init current username with server");
          setLogin(false);
        } else {
          // this should not happen
          console.log("Failed Init");
        }
        break;

      case RequestType.SAVE_FILE:
        if (status === Status.SUCCESS) {
          console.log("File successfully sent!");
        } else {
          console.log("Error:", receivedData.message);
        }
        break;

      case RequestType.RETRIEVE_FILE:
        if (status === Status.SUCCESS) {
          console.log("File retrieved");
          let originalFile;
          try {
            originalFile = await decryptFile(receivedData.body, encryptionKey);
          } catch (err) {
            console.error(err);
            return;
          }
          saveBlobToFile(originalFile, receivedData.filename);
        } else {
          console.log("Error", receivedData.message);
        }
        break;

      case RequestType.FETCH_ALL_FILES:
        if (status === Status.SUCCESS) {
          console.log("Files fetched");
          console.log(receivedData.message);
          let files = receivedData.message.files;
          setFileList(files);
        } else {
          console.log("Error", receivedData.message);
        }
        break;

      default:
        console.log("Error: requestType, ", requestType);
    }
  };

  const handleWebSocketClose = () => {
    console.log("WebSocket connection closed");
    setLogin(true);
    localStorage.setItem("username", "");
  };

  // ==========================================================================

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

  // ==================================================================================
  const handleFetchAllFiles = async () => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket connection is not open");
      return;
    }
    let fetchFilesObject = {
      username: currUsername.current,
      password: currUsername.current,
      requestType: RequestType.FETCH_ALL_FILES,
      entityType: "Client",
    };

    socket.current.send(JSON.stringify(fetchFilesObject));
  };

  const handleRetrieveButtonClick = async () => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket connection is not open");
      return;
    }

    if (!pickedFile) {
      console.error("No file selected");
      return;
    }

    let filename = pickedFile;
    let retrieveFileObject = {
      username: currUsername.current,
      password: currPassword.current,
      requestType: RequestType.RETRIEVE_FILE,
      entityType: "Client",
      filename: filename,
    };
    console.log(retrieveFileObject);
    socket.current.send(JSON.stringify(retrieveFileObject));
  };

  const handleSendButtonClick = async () => {
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

    currUsername.current = localStorage.getItem("username");

    let saveFileObject = {
      username: currUsername.current,
      requestType: RequestType.SAVE_FILE,
      entityType: "Client",
      filename: selectedFilename.current,
      body: base64FileContent,
    };
    console.log(saveFileObject);
    setFileList((prevState) => [...prevState, selectedFilename.current]);
    socket.current.send(JSON.stringify(saveFileObject));
  };

  const handleLogin = ({ username, password }) => {
    if (username.length < 3 || password.length < 3) {
      console.error("Username and password must be at least 5 characters long");
      return;
    }
    console.log("Login data:", { username, password });
    currUsername.current = username;
    currPassword.current = password;
    const newSocket = new WebSocket("ws://deebeeucla.herokuapp.com");
    newSocket.addEventListener("open", handleWebSocketOpen);
    newSocket.addEventListener("message", handleWebSocketMessage);
    newSocket.addEventListener("close", handleWebSocketClose);
    socket.current = newSocket;
  };

  return (
    <div className="vh">
      {login && (
        <div>
          <div style={{ display: "flex", justifyContent: "center", paddingTop:50 }}>
            <ReactLogo style={{ height: 200 }} />
          </div>
          <div className="login-container">
            <div className="login-banner">
                <h1 className="title">Login Form</h1>
            </div>
            <div className="login-form">
              <LoginForm onLogin={handleLogin} />
            </div>
          </div>
        </div>
      )}

      {!login && (
        <div>
          <div
            style={{
              height: "100vh",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <HiveLogo
              className="hive"
              style={{
                height: 1000,
                position: "absolute",
                bottom: -300,
                left: -100,
              }}
            />
          </div>
          <div className="outer">
            <div className="container">
              <div className="   ">
                <h1>Retrieve Data</h1>
                <button
                  style={{ backgroundColor: "#f1bf98", color: "#ffffff" }}
                  onClick={handleRetrieveButtonClick}
                >
                  Get File
                </button>
                <select
                  style={{
                    backgroundColor: "#e1f4cb",
                    color: "#717568",
                    fontFamily: "poppins",
                    fontWeight: "bold",
                  }}
                  onChange={handleOptionChange}
                >
                  <option value="">Select a file</option>
                  {fileList.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="center">
                  {pickedFile && <p>You picked: {pickedFile}</p>}
                </div>
              </div>
            </div>
            <div className="container">
              <div className="input-group">
                <h1>Store Data</h1>
                <input
                  style={{
                    backgroundColor: "#e1f4cb",
                    color: "#717568",
                    display: "none",
                  }}
                  type="file"
                  className="file-input"
                  ref={fileInput}
                  onChange={handleFileInputChange}
                />
                <div display="flex">
                  <button onClick={() => fileInput.current.click()}>
                    Choose File
                  </button>
                  {selectedFile && (
                    <p>File Selected: {selectedFilename.current}</p>
                  )}
                  <button
                    className="button"
                    onClick={handleSendButtonClick}
                    style={{ marginLeft: "10px" }}
                  >
                    Send File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WebSocketComponent;
