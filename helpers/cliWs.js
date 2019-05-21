const child_process = require('child_process');
const readline = require('readline');
const process = require('process');
const WebSocket = require('ws');

let command_line = "";
let command_cwd = "";
let websocket_url = "ws://127.0.0.1/path";

console.log("[application]",`Starting "${command_line}"`);
console.log("[application]",`cwd "${command_cwd}"`);
console.log("[application]",`Connecting to "${websocket_url}"`);


let isClosing = false;

function doClose() {
  if (isClosing === true) {
    return;
  }
  isClosing = true;
  
  child.kill();
  ws.close();
  process.exit();
}

//start child process
const child = child_process.exec(command_line, {
  cwd: command_cwd,
  encoding: "utf8"
}); //, (error, stdout, stderr) => { /*nothing to do */ });
child.stderr.on('data', data => {
  console.log(`[binary|stderr] error: ${data}`);
});
child.on('close', (code) => {
  console.log(`[binary|close] child process exited with code ${code}`);
  doClose();
});

const child_rl = readline.createInterface({
  input: this.child.stdout,
  output: this.child.stdin
});
child.stderr.on('data', (data) => {
  console.log("[binary|error]", data);
});
child_rl.on('line', (line) => {
  console.log("[binary|message]", line);
  ws.send(line);
}).on('close', () => {
  console.log("[binary|close]", "close");
  doClose();
});


//connect to websocket
const ws = new WebSocket(websocket_url);
ws.on('open', () => {
  console.log('[ws|connected]');
});
ws.on('message', (data) => {
  console.log("[ws|message]", data);
  child_rl.write(data+"\n");
});
ws.on('close', () => {
  console.log('[ws|closed]');
  doClose();
});


//user input
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  if ((line.trim() == "close") || (line.trim() == "exit")) {
    //close application
    doClose();
  }
}).on('close', () => {
  console.log("[application]", "closing");
  doClose();
});
