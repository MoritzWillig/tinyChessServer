const GameServer = require("./gameserver");
const WebServer = require("./webserver");
const fs = require("fs");

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


const gameserver = new GameServer();


let webserver = null;
if (config["webserver"]["enabled"] === true) {
  webserver = new WebServer();
}

gameserver.on("game.new", function() {
  gameserver.
});

gameserver.on("game.update", function() {
  asdf
});

gameserver.on("game.end", function() {
  asdf
});

gameserver.on("server.close", function() {
  if (webserver !==null) {
    webserver.close();
  }
  console.log("closing the server");
  process.exit(0);
});


let readline = require('readline');
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  gameserver.processMessage("console", line.trim());
}).on('close', () => {
  gameserver.processMessage("console", "close");
});


