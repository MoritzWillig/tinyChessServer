/// Handles the state of the board and processes messages from the clients that are playing the game.
/// 
/// This class checks the validity of the moves played and delivers the (private) messages
/// to the players.

let child_process = require('child_process');
const readline = require('readline');

class Game {
  
  constructor() {
    //
  }
  
  makeMove(moveStr) {
    //...
  }
  
  reset() {
    //
  }
  
  getFen() {
    //
  }
  
}

class ChessCLIGame extends Game {
  
  constructor(config) {
    super();
    this._events = {
      "game.answer": []
    };
    
    this.child = child_process.exec(config["backend_command"], {
      cwd: config["backend_cwd"],
      encoding: "utf8"
    }, (error, stdout, stderr) => {
      //noting to do
    });
    
    this.rl = readline.createInterface({
      input: this.child.stdout,
      output: this.child.stdin
    });
    
    this.child.stderr.on('data', data => {
        console.log(`game script reported an error: ${data}`);
    });

    this.child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
  
  _sendMessage(msg) {
    this.rl.question(msg, (answer) => {
      this.doEvent("game.answer", answer);
    });
  }
  
  makeMove(moveStr) {
    //only single lines are accepted
    if (moveStr.indexOf("\n") != -1) {
      //answer rejected
    }
    
    //filter command strings
    if ((moveStr == "new") || (moveStr == "close") || (moveStr == "fen") || (moveStr == "fen a") || (moveStr == "fen b")) {
      //answer "rejected"
    }
    this._sendMessage(moveStr+"\n");
  }
  
  reset() {
    this._sendMessage("new\n");
  }
  
  getFen(board) {
    if (board == "") {
      this._sendMessage("fen\n");
      return;
    }
    
    if ((board != "a") && (board != "b")) {
      this._sendMessage("fen "+board+"\n");
    } else {
      //answer rejected
    }
  }
  
  close() {
    this._sendMessage("close\n");
  }
  
  on(eventName, eventHandler) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Error("unknown event name: " + eventName);
    }
    
    handlers.push(eventHandler);
  }
  
  doEvent(eventName, data) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Error("unknown event name:" + eventName);
    }
    
    for (let handler of handlers) {
      handler(data);
    }
  }
  
}


module.exports = {
  Game: Game,
  ChessCLIGame: ChessCLIGame
};