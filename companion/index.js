import { inbox } from "file-transfer";
import * as messaging from "messaging";

messaging.peerSocket.addEventListener("open", (evt) => {
  console.log("Ready to send or receive messages");
  sendMessage("", "auth");
});

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

const wsUri = "wss://testws.teofilos.ro/";
let websocket = new WebSocket(wsUri);

websocket.addEventListener("open", onOpen);
websocket.addEventListener("close", onClose);
websocket.addEventListener("message", onMessage);
websocket.addEventListener("error", onError);

function onOpen(evt) {
   console.log("CONNECTED");
   //websocket.send("whassup");
}

function onClose(evt) {
   console.log("DISCONNECTED");
   websocket = new WebSocket(wsUri);

}

function onMessage(evt) {
    //console.log(`MESSAGE: ${evt.data}`);
    //console.log(isJSONString(evt.data));
    try {
        const jsonMessage = JSON.parse(evt.data);
        handleCommand(jsonMessage);
    } catch (error) {
        console.error('Invalid JSON message received:', error);
    }
}

// Function to handle received commands
function handleCommand(jsonMessage) {
    if (jsonMessage.set) {
        handleSet(jsonMessage.set);
    } else if (jsonMessage.get) {
        handleGet(jsonMessage.get);
    } else if (jsonMessage.notify) {
        handleNotify(jsonMessage.notify);
    } else if (jsonMessage.auth) {
        handleAuth(jsonMessage.auth);
    } else if (jsonMessage["keep-alive"]) {
        console.log("Received a ping command!")
    } else if (jsonMessage.welcome) {
        handleWelcome(jsonMessage.welcome);
    } else {
        console.log('Unknown command received:', jsonMessage);
    }
}

// Handlers for each command type
function handleSet(argument) {
    console.log('Handling set command with argument:', argument);
    // Add your logic for handling 'set' command here
}

// Function to handle 'get' command
function handleGet(argument) {
    // Check if argument is a valid object with the required properties
    if (typeof argument === 'object' && argument !== null && 'target' in argument && 'command' in argument) {
        const { target, command } = argument;

        if (target === 'companion') {
            console.log('Handling get command for companion with command:', command);
            // Add your logic for handling 'get' command with target 'companion' here
        } else if (target === 'app') {
            console.log('Handling get command for app with command:', command);
            sendMessage("get", command);
        } else {
            console.log('Unknown target in get command:', target);
        }
    } else {
        console.log('Invalid get command argument:', argument);
    }
}

function handleNotify(argument) {
    console.log('Handling notify command with argument:', argument);
    // Add your logic for handling 'notify' command here
}

function handleAuth(argument) {
    console.log('Handling auth command with argument:', argument);
    // Add your logic for handling 'auth' command here
}

function handleWelcome(argument) {
    console.log('Connected to the cloud gateway');
    // Add your logic for handling 'auth' command here
}

function onError(evt) {
   console.error(`ERROR: ${evt.data}`);
}

async function processAllFiles() {
  let file;
  if (websocket.readyState === "OPEN") websocket.send("Incoming file!!!");
  while ((file = await inbox.pop())) {
    const payload = await file.arrayBuffer();
    console.log(`file contents: ${payload}`);
    let bytes = new Uint8Array(payload);
    sendWSMessage("file", bytes);
    console.log("Data packet sent to the cloud")
    // Log every pair of 48 bytes on a new line
    /*
    for (let i = 0; i < bytes.length; i += 6) {
      // Slice out 6 bytes
      let slice = bytes.slice(i, i + 6);
  
      // Convert each byte in the slice to binary and concatenate
      let binaryString = Array.from(slice).map(byte => byte.toString(2).padStart(8, '0')).join(' ');
      //console.log(binaryString);
      //websocket.send(binaryString);
      sendMessage(binaryString); 
    }*/
  }
}
/*
setInterval(() => {
  
  if (websocket.readyState === websocket.OPEN) {
    // The WebSocket connection is open, so you can send data
    //webSocket.send(data);
    //websocket.send("Incoming file!!!");
    sendMessage
} else {
    // The WebSocket connection is not open
    console.log("WebSocket is not open. readyState:", websocket.readyState);
    console.log("Websocket: retrying connection...");
    if (websocket.readyState !== websocket.CONNECTING) websocket = new WebSocket(wsUri);
}
}, 5000);*/

inbox.addEventListener("newfile", processAllFiles);

processAllFiles()

function sendBufferAsJson(buffer) {
    const base64Payload = buffer.toString('base64');
    const jsonPayload = JSON.stringify({ payload: base64Payload });
    websocket.send(jsonPayload);
}

function sendWSMessage(type, message) {

  if (websocket.readyState === websocket.OPEN) {
      // The WebSocket connection is open, so you can send data
      //webSocket.send(data);
      /*for (let i = 0; i < message.length; i += 6) {
        // Slice out 6 bytes
        let slice = message.slice(i, i + 6);
    
        // Convert each byte in the slice to binary and concatenate
        let binaryString = Array.from(slice).map(byte => byte.toString(2).padStart(8, '0')).join(' ');
        //console.log(binaryString);
        //websocket.send(binaryString);
      }*/
        if(type === "file") {
            sendBufferAsJson(message);
            console.log("Incoming binary file!")
            //websocket.send({"payload":binaryString});
        }
        else {
            console.log("Incoming message!")
        }
       
  } else {
        // The WebSocket connection is not open
        console.log("WebSocket is not open. readyState:", websocket.readyState);
        console.log("Websocket: retrying connection...");
        if (websocket.readyState !== websocket.CONNECTING) websocket = new WebSocket(wsUri);
  }
}

function sendMessage(type, message) {
  const data = {
    'message': message,
    'type': type
  }

  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send(data);
  }
  
}

function isJSONString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}

function isDeviceIDPresent(jsonString) {
  try {
    const jsonObject = JSON.parse(jsonString);
    return jsonObject.hasOwnProperty('devid');
    // Alternatively, you can use the 'in' operator:
    // return 'authkey' in jsonObject;
  } catch (error) {
    return false; // JSON parsing failed
  }
}