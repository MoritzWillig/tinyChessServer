const GameServer = require("./gameserver");
const WebServer = require("./webserver");
const WebSocketGameServer = require("./clients/websocket");

const http = require('http');
const fs = require("fs");
const readline = require('readline');

config = JSON.parse(fs.readFileSync("./config.json"));

/**
 * command line arguments:
 * --help
 *    prints help
 * --gui
 *    enables the web gui
 * --client web|cli|tcp
 *    registeres
 * --single
 *    plays a single game and quits the application
**/


const gameserver = new GameServer(() => {
  //TODO create new game here
  let game = null;
  return game;
}, config["game"]);

let httpServer = null;
let webserver = null;
let websocketserver = null;

if (config["httpServer"]["serve_webclient"] === true) {
  webserver = new WebServer(config["httpServer"]);
}

if (config["httpServer"]["enabled"] === true) {
  httpServer = http.createServer(webserver.getApp());
}

if (config["clients"]["websocket"]["enabled"] === true) {
  websocketserver = new WebSocketGameServer(httpServer, config["clients"]["websocket"]);
  websocketserver.on("client.new", (client) => {
    if (!gameserver.addClient(client)) {
      client.close();
    }
  });
}

httpServer.listen(config["httpServer"]["port"]);


gameserver.on("server.close", function() {
  console.log("closing the server");
  if (httpServer !== null) {
    httpServer.close();
  }
  process.exit(0);
});


let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  gameserver.processMessage("console", line.trim());
}).on('close', () => {
  gameserver.processMessage("console", "close");
});


