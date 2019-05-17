const GameServer = require("./gameserver");
const Games = require("./games.js");
const WebServer = require("./webserver");
const WebSocketGameServer = require("./clients/websocket");

const http = require('http');
const url = require('url');
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
let websocketBoardAObserverServer = null;
let websocketBoardBObserverServer = null;

if (config["httpServer"]["serve_webclient"] === true) {
  webserver = new WebServer(config["httpServer"]);
}

httpServer = http.createServer(webserver.getApp());

if (config["clients"]["websocket"]["enabled"] === true) {
  websocketserver = new WebSocketGameServer();
  websocketserver.on("client.new", (client) => {
    if (!gameserver.addClient(client)) {
      client.close();
    }
  });
  
  console.log("Setup of the game server completed. Waiting for 4 players to connect.");
}

//observers
if (config["observers"]["websocket"]["enabled"] === true) {
  websocketBoardAObserverServer = new WebSocketGameServer();
  websocketBoardAObserverServer.on("client.new", (client) => {
    if (!gameserver.addObserver("a", client)) {
      client.close();
    }
  });
  
  websocketBoardBObserverServer = new WebSocketGameServer();
  websocketBoardBObserverServer.on("client.new", (client) => {
    if (!gameserver.addObserver("b", client)) {
      client.close();
    }
  });
}

httpServer.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  if (pathname === config["clients"]["websocket"]["path"]) {
      let wss = websocketserver.getServer();
      wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === config["observers"]["websocket"]["pathBoardA"]) {
      let wss = websocketBoardAObserverServer.getServer();
      wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === config["observers"]["websocket"]["pathBoardB"]) {
      let wss = websocketBoardBObserverServer.getServer();
      wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    console.log("rejected", pathname);
    socket.destroy();
  }
});
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


