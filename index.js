const GameServer = require("./gameserver");
const Games = require("./games.js");
const WebServer = require("./webserver");
const WebSocketGameServer = require("./clients/websocket");

const http = require('http');
const fs = require("fs");
const readline = require('readline');

config = JSON.parse(fs.readFileSync("./config.json"));

/**
 * TODO
 * command line arguments:
 * --help
 *    prints help
 * --gui
 *    enables the web gui
**/


const gameserver = new GameServer(() => {
  //TODO create new game here
  let game = new Games.ChessCLIGame(config["game"]);
  return game;
}, config["game"]);

let httpServer = null;
let webserver = null;
let websocketserver = null;
let websocketObserverServerA = null;
let websocketObserverServerB = null;

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
  
  console.log("Setup of the game server completed. Waiting for 4 players to connect.");
}

//observers
/*if (config["observers"]["websocket"]["enabled"] === true) {
  let configA = Object.assign({}, config["observers"]["websocket"]);
  configA["path"] = configA["boardA"];
  
  websocketObserverServerA = new WebSocketGameServer(httpServer, configA);
  websocketObserverServerA.on("client.new", (client) => {
    if (!gameserver.addObserver("a", client)) {
      client.close();
    }
  });

  let configB = Object.assign({}, config["observers"]["websocket"]);
  configB["path"] = configB["boardB"];
  
  websocketObserverServerB = new WebSocketGameServer(httpServer, configB);
  websocketObserverServerB.on("client.new", (client) => {
    if (!gameserver.addObserver("b", client)) {
      client.close();
    }
  });
}*/


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


