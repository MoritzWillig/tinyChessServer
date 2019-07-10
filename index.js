const GameServer = require("./gameserver");
const Games = require("./games.js");
const WebServer = require("./webserver");
const WebSocketGameServer = require("./clients/websocket");
const CLICreator = require("./clients/cli");

const http = require('http');
const url = require('url');
const fs = require("fs");
const readline = require('readline');
const process = require('process');

let config_file = "config.json";

if (process.argv.length > 2) {
  config_file = process.argv.slice(2)[0];
}

let config = JSON.parse(fs.readFileSync(config_file));
let applicationConfig = config["application"];
let gameConfig = config["game"];

/**
 * TODO
 * command line arguments:
 * --help
 *    prints help
 * --gui
 *    enables the web gui
**/

let httpServer = null;
let webserver = null;

let websocketserver = null;
let clicreator = null;
let websocketBoardAObserverServer = null;
let websocketBoardBObserverServer = null;


const gameserver = new GameServer(() => {
  return new Games.ChessCLIGame(gameConfig);
}, gameConfig);

gameserver.on("server.close", function() {
  console.log("[application] closing the server");
  if (httpServer !== null) {
    httpServer.close();
  }
  process.exit(0);
});

gameserver.on("state.change", function() {
  switch (gameserver.state) {
    case "ready":
      if (applicationConfig["start_if_enough_players_connected"] === true) {
        console.log("[application] four players connected. starting the game!");
        gameserver.processMessage("go");
      } else {
        console.log("[application] the game is ready to start. Type 'go' to start");
      }
  }
});

gameserver.on("communicator.remove", function(data) {
  if (applicationConfig["disconnect_as_defeat"] === true) {
    gameserver.defeat(data.client, "disconnected from the server");
  }
});

function testSingleGame() {
  if (applicationConfig["play_single_game_only"] === true) {
    console.log("[application] server is set to single game mode");
    gameserver.processMessage("close");
  }
}

gameserver.on("game.end", function(bpgn) {
  //TODO duplicated code, ... "close" should wait for the game to get saved ... 
  if (applicationConfig["save"]["save_games"] === true) {
    gameserver.saveBpgn(applicationConfig["save"]["save_dir"], applicationConfig["save"]["filename"],
        applicationConfig["save"]["meta"], (answer, filename) => {
      console.log("[application] saved bpgn to "+filename);
      testSingleGame();
    });
  } else {
    testSingleGame();
  }
});


if (config["httpServer"]["serve_webclient"] === true) {
  webserver = new WebServer(config["httpServer"]);
}

if (config["httpServer"]["enabled"] === true) {
  httpServer = http.createServer(webserver.getApp());
}


if (config["clients"]["websocket"]["enabled"] === true) {
  websocketserver = new WebSocketGameServer();
  websocketserver.on("client.new", (data) => {
    let gameCommunicator = data.communicator;
    let position = data.position;
    if (!gameserver.addCommunicator(gameCommunicator, position)) {
      client.close();
    }
  });
}

if (config["clients"]["cli"]["enabled"] === true) {
  clicreator = new CLICreator(config["clients"]["cli"]);
  clicreator.on("client.new", (data) => {
    let communicator = data.communicator;
    let position = data.position;
    if (!gameserver.addCommunicator(communicator, position)) {
      client.close();
    }
  });
}

//observers
if (config["observers"]["websocket"]["enabled"] === true) {
  websocketBoardAObserverServer = new WebSocketGameServer();
  websocketBoardAObserverServer.on("client.new", (client) => {
    if (!gameserver.addObserver("a", client.communicator)) {
      client.close();
    }
  });
  
  websocketBoardBObserverServer = new WebSocketGameServer();
  websocketBoardBObserverServer.on("client.new", (client) => {
    if (!gameserver.addObserver("b", client.communicator)) {
      client.close();
    }
  });
}

if (httpServer !== null) {
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
}


let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  gameserver.processMessage(line.trim());
}).on('close', () => {
  gameserver.processMessage("close");
});


if (clicreator !== null) {
  clicreator.createClients();
}

console.log("Setup of the game server completed. Waiting for players to connect.");
