import clock from "clock";
import * as document from "document";
import { preferences } from "user-settings";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { listDirSync } from "fs";
import { outbox } from "file-transfer";
import * as fs from "fs";
import * as messaging from "messaging";


messaging.peerSocket.addEventListener("open", (evt) => {
  console.log("Ready to send or receive messages");
});

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

messaging.peerSocket.addEventListener("message", (evt) => {
  console.error(JSON.stringify(evt.data));
});

//let file = fs.openSync("filename.bin", "w+");
//let buffer = new ArrayBuffer(3);
//let bytes = new Uint8Array(buffer);
//bytes[0] = 1;
//bytes[1] = 2;
//bytes[2] = 3;
//fs.writeSync(file, buffer);

//const fileDescriptor = fs.openSync('filename.bin', 'w+');
//const stream = fs.createWriteStream('log.bin', { flags: 'a' });

const debug = true;
const _onHand = false;
let _lastHR = 0;

const numefishier = 'hrdata';

const listDir = listDirSync("/private/data");

do {
  const dirIter = listDir.next();
  if (dirIter.done) {
    break;
  }
  console.log(dirIter.value);
} while (true);

if (fs.existsSync("/private/data/DeviceMonId.bin"))
  console.log("Device ID found!");
  else {
    console.log("No device ID found!");
    console.log("Generating ID!");
    let random8BitString = '';
    for(let i = 0; i < 16; i++) {
        random8BitString += Math.floor(Math.random() * 2).toString();
    }

    let file = fs.openSync("DeviceMonId.bin", "w+");
    buffer = new ArrayBuffer(3);
    bytes = new Uint8Array(buffer);
    bytes[0] = random8BitString;
    fs.writeSync(file, buffer);
    fs.closeSync(file);
  }


/* if (HeartRateSensor) {
  if (debug)
    console.log("This device has a HeartRateSensor!");
  const hrm = new HeartRateSensor();
  hrm.addEventListener("reading", () => {
  _lastHR = hrm.heartRate;
  console.log(`Current heart rate: ${hrm.heartRate} at ${Math.floor(Date.now())}`);
  });
  hrm.start();
  } else {
    // console.log("This device does NOT have a HeartRateSensor!");
}
*/

function padStartManual(str, targetLength, padString) {
  str = str.toString(); // Ensure the value is a string
  if (str.length >= targetLength) {
    return str;
  }
  const padLength = targetLength - str.length;
  const fullPadString = new Array(padLength + 1).join(padString); // Create a long pad string
  return fullPadString + str; // Concatenate pad string and original string
}

if (BodyPresenceSensor && HeartRateSensor) {
  if (debug)
    console.log("This device has a BodyPresenceSensor and a HeartRateSensor!");
  const hrm = new HeartRateSensor();
  const bodyPresence = new BodyPresenceSensor();
  hrm.addEventListener("reading", () => {
  _lastHR = hrm.heartRate;
  console.log(`Current heart rate: ${_lastHR} at ${Math.floor(Date.now())}`);
  //const _last8digitsoftimestamp = Math.floor(Date.now()) % 10e10;
  const _last8digitsoftimestamp = Date.now() % 0xffffffffff;
  const _last8digitsoftimestampInBinary = padStartManual(_last8digitsoftimestamp.toString(2), 40, '0');
  //const _last8digitsoftimestampInBinary = _last8digitsoftimestamp.toString(2); // 40 bit for timestamp
  const _HRinBinary = padStartManual(_lastHR.toString(2), 8, '0'); // 8 bit for value
  //console.log(`Binary packet: ${_HRinBinary + _last8digitsoftimestampInBinary}`);
  const zaPackInBinary = _HRinBinary + _last8digitsoftimestampInBinary;
  //write48BytesToFile(fileDescriptor, _HRinBinary + _last8digitsoftimestampInBinary);
  const bytes = _HRinBinary + _last8digitsoftimestampInBinary;
  //appendDataToFile('filename.bin', bytes);
      console.log(bytes);
  // Prepare an ArrayBuffer of the right size (6 bytes for 48 bits)
  const buffer = new ArrayBuffer(6);
  const view = new Uint8Array(buffer);

  // Split the binary string into 8-bit chunks and convert each to a byte
  for (let i = 0; i < 6; i++) {
    // Extract an 8-bit segment from the binary string
    const bitSegment = zaPackInBinary.substring(i * 8, (i + 1) * 8);
  
    // Parse the segment as a binary number and store it in the array
    view[i] = parseInt(bitSegment, 2);
}

  //console.log(view);
  // Writing the ArrayBuffer to file
  appendDataToFile(`${numefishier}.bin`, view); // scrie datele in fishier

  let stats = fs.statSync(`${numefishier}.bin`);
  if (stats) {
    console.log("File size: " + stats.size + " bytes");
  //console.log("Last modified: " + stats.mtime);
  }

  });
  bodyPresence.addEventListener("reading", () => {
    if (debug)
      console.log(`The device is${bodyPresence.present ? '' : ' not'} on the user's body.`);
    if (bodyPresence.present) {
      hrm.start();
      if (debug) 
        console.log("HR monitoring start");
    } else {
      hrm.stop();
      if (debug) 
        console.log("HR monitoring stop");
    }
  });
  bodyPresence.start();
} else {
  if (debug)
    console.log("This device does NOT have a BodyPresenceSensor and a HeartRateSensor!");
    fs.closeSync(file);
}

function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function appendDataToFile(filePath, data) {
  // Convert ArrayBuffer to Uint8Array for writing
  const uint8View = new Uint8Array(data);

  // Open the file in append mode ('a'), which creates the file if it doesn't exist
  const fileDescriptor = fs.openSync(filePath, 'a');

  // Write the Uint8Array to the file
  // fs.writeSync expects a file descriptor, buffer (Uint8Array in this case), offset, length, and position
  // Since we want to write the whole Uint8Array, offset is 0, and length is the Uint8Array length
  fs.writeSync(fileDescriptor, uint8View, 0, uint8View.length);

  // Close the file
  fs.closeSync(fileDescriptor);
}

/*
function write48BytesToFile(fd, data) {
  if (data.length !== 48) {
      throw new Error('Data must be exactly 48 bytes');
  }
  fs.writeSync(fd, data, 0, data.length);
}
*/

// Update the clock every minute
clock.granularity = "seconds";

// Get a handle on the <text> element
const _ceas = document.getElementById("Ceas");
const Daate = document.getElementById("Daate");
const RitmCardiac = document.getElementById("RitmCardiac");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
let today = evt.date;

let hours = today.getHours();
if (preferences.clockDisplay === "24h") {
    // 12h format
    hours = hours % 12 || 12;
} else {
    // 24h format
    hours = zeroPad(hours);
}
let mins = zeroPad(today.getMinutes());
let secs = zeroPad(today.getSeconds());
_ceas.text = `${hours}:${mins}:${secs}`;

// let now = evt.date;

// Extract the day, month, and year
let day = today.getDate(); // Day of the month
let month = today.getMonth(); // Month (add 1 because it's 0-indexed)
let year = today.getFullYear(); // Full year

// Log day, month, and year
//console.log(`Day: ${day}, Month: ${month + 1}, Year: ${year}`);
Daate.text = `${zeroPad(day)} ${months[month]} ${year}`;
//Daate.text = `${zeroPad(day)}:${now.toLocaleDateString('en-US', { month: 'short' })}:${year}`;
RitmCardiac.text = `${_lastHR}`;
}


setInterval(() => {
  outbox
  .enqueueFile(`/private/data/${numefishier}.bin`)
  .then(ft => {
    console.log(`Transfer of ${ft.name} successfully queued.`);
  })
  .catch(err => {
    console.log(`Failed to schedule transfer: ${err}`);
  });
  // console.log("Fucking transfer");
  const listDir = listDirSync("/private/data");
  while((dirIter = listDir.next()) && !dirIter.done) {
    console.log(dirIter.value);
  }
  // Open the file for reading
//  let file = fs.openSync(`${numefishier}.bin`, "r");

  // Get the file size
//  const stats = fs.fstatSync(file);
//  const fileSize = stats.size;

  // Calculate the position to start reading the last 6 bytes
//  const startPosition = fileSize - 6;

  // Prepare a buffer of 6 bytes
//  let buffer = new ArrayBuffer(6);
//  let bytes = new Uint8Array(buffer);

  // Read the last 6 bytes into the buffer
  // Arguments for fs.readSync are:
  // file descriptor, buffer, offset in the buffer to start writing,
  // number of bytes to read, position in the file to start reading
//  fs.readSync(file, bytes, 0, 6, startPosition);

  // Output the bytes
//  console.log("Last 6 bytes:", bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);

  // Close the file
//  fs.closeSync(file);
}, 60*1000);




// fs.unlinkSync("hrdata.bin");


