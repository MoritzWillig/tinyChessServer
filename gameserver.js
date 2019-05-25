//Processes and passes the messages passing between the game, the console and all connected clients

const GameClient = require("./clients/gameclient.js").GameClient;

class GameServer {
  
  constructor(gameFactory, config) {
    this._events = {
      "game.new": [],
      "game.update": [],
      "game.end": [],
      "server.close": []
    };
    
    this.config = config;
    this.gameFactory = gameFactory;
    
    this.game = this.gameFactory();
    this.game.on("game.answer", (answer) => {
      this._processGameAnswer(answer);
    });
          
    this.clients = [
      this._createClient(),
      this._createClient(),
      this._createClient(),
      this._createClient()
    ];
    this.connectedClients = 0;
    
    this.observers = {
      "a": [],
      "b": []
    };
    
    this.turns = {
      "a": "white",
      "b": "white"
    };
    this.timers = {
      "a": [null, null],
      "b": [null, null],
    };
    this.pockets = {
      "a": "[] []",
      "b": "[] []"
    };
    this.isMoveQueued = {
      "a": true,
      "b": true
    };
    //there are no queued moves, but this prevents any moves from being made before the game starts
    
    this._setState("preparing0");
    
    //game_messages[0] is the message, that is currently processed by
    //the game.
    this.game_messages = [];
    /*message: {
      callback: fn,
      type: "fen"|"new"|"close"|"move"
    }*/
  }
  
  _createClient() {
    let client = new GameClient()
    client.on("client.ready", (client) => {
      this._processStateMessage("client_ready");
    });
    
    client.on("client.game.message", data => {
      this._processStateMessage("client_game_message", {client: data.client, message: data.message});
    });
    
    client.on("connection.close", () => {
      console.log("lost connection to a player client");
      this.connectedClients--;
      
      //if (this.clients.length == 0) {
      //  TODO stop game (reset game and stop timer)
      //  this._setState("preparing0");
      //}
    });
    
    return client;
  }
  
  processMessage(sender, message) {
    if (sender === "console") {
      switch (message) {
        case "go":
          this._processStateMessage("go");
          break;
        case "exit":
        case "close":
          this.broadcast("quit");
          this.doEvent("server.close");
          break;
        default:
          console.log(`[server] unknown message from ${sender}: ${message}`);
      }
    }
  }
  
  _queueGameMessage(type, data, fn) {
    if ((type!="fen") && (type!="new") && (type!="close") && (type!="move")) {
      throw new Error("unknown message type: "+ type);
    }
    
    let message = {
      callback: fn,
      type: type,
      data: data
    };
    this.game_messages.push(message);
    
    if (this.game_messages.length == 1) {
      this._sendGameRequest(message);
    }
  }
  
  _processGameAnswer(answer) {
    //remove processed message
    let processedMessage = this.game_messages.splice(0, 1)[0];
    
    processedMessage.callback(answer);
    
    //start next query
    if (this.game_messages.length != 0) {
      this._sendGameRequest(this.game_messages[0]);
    }
  }
  
  /**
   * Do not send messages to the game directly! Use _queueGameMessage to add messages
   * to the message queue.
  **/
  _sendGameRequest(message) {
    switch (message.type) {
      case "fen":
        this.game.getFen(message.data);
        break;
      case "new":
        this.game.reset();
        break;
      case "close":
        this.game.close();
        break;
      case "move":
        this.game.makeMove(message.data);
        break;
      default:
        throw new Error("unknown message type: "+message.type);
    }
  }
  
  addObserver(boardName, client) {
    console.log("[server] registering a new observer");
    
    let board = this.observers[boardName];
    board.push(client);
    
    client.on("client.ready", () => {
      // send current board state
      this._queueGameMessage("fen", boardName, answer => {
        client.sendMessage('new');
        client.sendMessage("variant bughouse");
        client.sendMessage("force");
        client.sendMessage('setboard '+answer);
      });
    });
    
    client.on("connection.close", (client) => {
      board.splice(board.indexOf(client), 1);
    });

    client.on("client.status.message", data => {
      this._processStateMessage(data.message, {});
    })
    
    //observer messages are ignored (only needed for the handshake)
    client.on("client.game.message", data => {
      this._processStateMessage("client_observer_message", { board: boardName, client: data.client, message: data.message});
    });
    
    //client.on("client.game.needs_state", (client) => {
    //  this.game.getFen(boardName, answer => { client.send(client.sendMessage('setboard '+ answer); }));
    //});
    
    client.setState("negotiating");
    client.sendMessage("xboard");
    client.sendMessage("protover 4");
    return true;
  }
  
  getInactiveClient() {
    for (let client of this.clients) {
      if (!client.isActive()) {
        return client;
      }
    }
    
    return null;
  }
  
  addCommunicator(gameCommunicator) {
    if (this.connectedClients == 4) {
      console.log("[server] rejected client. There are already four connected clients!");
      return false;
    }
    
    console.log("[server] registering a new client");
    
    this.connectedClients++;
    let client = this.getInactiveClient();
    client.setCommunicator(gameCommunicator);
    
    client.setState("negotiating");
    client.sendMessage("xboard");
    client.sendMessage("protover 4");
    return true;
  }

  _sendToAllObservers(message) {
    this.observers["a"].forEach(observer => { observer.sendMessage(message) });
    this.observers["b"].forEach(observer => { observer.sendMessage(message) });
  }

  _setState(state) {
    this.state = state;
    this._sendToAllObservers("# status " + this.state);
  }
  
  _processStateMessage(message, data) {
    let old_state = this.state;
    
    console.log("[server] processing message: ", message);
    
    switch (this.state) {
      case "preparing0":
        if (message === "client_ready") {
          this._setState("preparing1");
        }
        break;
      case "preparing1":
        if (message === "client_ready") {
          this._setState("preparing2");
        }
        break;
      case "preparing2":
        if (message === "client_ready") {
          this._setState("preparing3");
        }
        break;
      case "preparing3":
        this._setState("ready");
        console.log("[server] the game is ready to start. Type 'go' to start");
        break;
      case "ready":
        if (message === "go") {
          this.broadcast("#the game is starting");
          this._setState("in_progress");
          
          //TODO remove any move commands from the queue
          
          this._queueGameMessage("new", undefined, (answer) => {
            this.turns = {
              "a": "white",
              "b": "white"
            };
            this.pockets = {
              "a": "[] []",
              "b": "[] []"
            };
            //allow moves to get queued
            this.isMoveQueued = {
              "a": false,
              "b": false,
            };
            
            for (let client of this.observers["a"]) {
              client.sendMessage("new");
              client.sendMessage("variant bughouse");
              client.sendMessage("force");
            }
            for (let client of this.observers["b"]) {
              client.sendMessage("new");
              client.sendMessage("variant bughouse");
              client.sendMessage("force");
            }
            
            for (let i in this.clients) {
              let client = this.clients[i];
              
              let partner = this._getPartner(parseInt(i));
              
              client.sendMessage("new");
              client.sendMessage("variant bughouse");
              client.sendMessage("partner "+partner);
              client.sendMessage("time "+(this.config["time"] * 100)); //in hundreds of a second
              client.sendMessage("otim "+(this.config["time"] * 100));
              if (this._getColor(i) == "white") {
                client.sendMessage("go");
              } else {
                client.sendMessage("playother");
              }
            }
            
            //start timers
            //The "paused" flag is only set during the time, the server checks for a received move
            //to be valid.
            this.timers = {
              "a": [{
                "remaining": this.config["time"] * 1000,
                "lastStart": (+new Date()),
                "paused": false
              }, {
                "remaining": this.config["time"] * 1000,
                "lastStart": null,
                "paused": false
              }],
              "b": [{
                "remaining": this.config["time"] * 1000,
                "lastStart": (+new Date()),
                "paused": false
              }, {
                "remaining": this.config["time"] * 1000,
                "lastStart": null,
                "paused": false
              }],
              "timer": setInterval(() => { this._checkClocks(); }, 100) //update every tenth of a second
            };
            
          });
        }
        break;
      case "in_progress":
        switch (message) {
          case "game_ended":
            //TODO remove any queued moves
            //prevent any further moves from getting queued
            this.isMoveQueued = {
              "a": true,
              "b": true,
            };
            //clear timer
            clearInterval(this.timers["timer"]);
            
            //broadcast results
            let board = data.board;
            let result = data.result;
            let onTime = data.onTime;
            let comment = "";
            
            if (result == "*") {
              //no more moves to play on both boards. check timers.
              let onTheMoveA = (this.turns["a"]=="white")?0:1;
              let onTheMoveB = (this.turns["b"]=="white")?0:1;
              
              if (onTheMoveA != onTheMoveB) {
                //the same team has to make a move on both boards
                board = "a";
                result = `${onTheMoveA}-${1-onTheMoveA}`;
                onTime = true;
                comment = "The team can play no more moves. Time will run out.";
              } else {
                //check which player of both teams will run out of time earlier.
                let remainingA = this.timers["a"][onTheMoveA]["remaining"];
                let remainingB = this.timers["b"][onTheMoveB]["remaining"];
                
                if (remainingA == remainingB) {
                  board = "a";
                  result = "1/2-1/2";
                  onTime = true;
                  comment = "No more moves to play. Both teams have the _exact_ same amount of time remaining!";
                } else {
                  if (remainingA < remainingB) {
                    board = "a";
                    result = `${onTheMoveA}-${1-onTheMoveA}`;
                    onTime = true;
                    comment = `No more moves to play. ${(onTheMoveA==0)?"White":"Black"} will run out of time.`;
                  } else {
                    board = "b";
                    result = `${onTheMoveB}-${1-onTheMoveB}`;
                    onTime = true;
                    comment = `No more moves to play. ${(onTheMoveB==0)?"White":"Black"} will run out of time.`;
                  }
                }
              }
            } else {
              //regular mate
              comment = `${this.turns[board]} mated.`;
            }
            
            //broadcast the result for the deciding board
            this.broadcast(result+" {"+comment+"}", board);
            
            //broadcast result to the other board. Since the players of the teams, play different colors
            //the result has to be inversed.
            let otherBoard = (board=="a")?"b":"a";
            let otherResult = result.split("-").reverse().join("-");
            this.broadcast(otherResult+" {The other board finished}", otherBoard);
            
            this._setState("ready");
            console.log("#the game is ready to start. Type 'go' to start a new game");
            break;
          case "client_game_message":
            this._processClientGameMessage(data.client, data.message);
            break;
          case "client_observer_message":
            //observer messages are currently ignored
            break;
        }
        break;
      case "error":
        break;
      default:
        this._setState("error");
        broadcast("#internal server error");
        broadcast("quit");
    }
    
    if (old_state != this.state) {
      console.log("[server] server state changed to", this.state);
    }
  }
  
  /**
   * returns true if the game is still ongoing; false if a player run out of time.
  **/
  _checkClocks(board, currentTime) {
    if (currentTime === undefined) {
      currentTime = (+new Date());
    }
    
    let boards = [board];
    if (board == undefined) {
      boards = ["a", "b"];
    }
    
    for (let board of boards) {
      let onTheMove = (this.turns[board] == "white")?0:1;
      
      let clock = this.timers[board][onTheMove];
      
      //check if the timer is currently being paused.
      if (clock["paused"] === true) {
        continue;
      }
      
      let timePassed = currentTime - clock["lastStart"];
      if (clock["remaining"] - timePassed <= 0) {
        //time run out
        this._processStateMessage("game_ended", { board: board, result: `${onTheMove}-${1-onTheMove}`, onTime: true });
        return false;
      }
    }
    
    return true;
  }
  
  _getPartner(clientIdx) {
    //pair players 0&1 and 2&3
    switch (parseInt(clientIdx)) {
      case 0:
        return 1;
      case 1:
        return 0;
      case 2:
        return 3;
      case 3:
        return 2;
    }
    throw new Error("Invalid client index: "+clientIdx);
  }
  
  _getColor(clientIdx) {
    //0 (white) plays against 2 (black), and 1 (black) against 3 (white).
    switch (parseInt(clientIdx)) {
      case 0:
        return "white";
      case 1:
        return "black";
      case 2:
        return "black";
      case 3:
        return "white";
    }
  }
  
  _getColorIndex(clientIdx) {
    switch (parseInt(clientIdx)) {
      case 0:
        return 0;
      case 1:
        return 1;
      case 2:
        return 1;
      case 3:
        return 0;
    }
  }
  
  _getBoard(clientIdx) {
    switch (parseInt(clientIdx)) {
      case 0:
        return "a";
      case 1:
        return "b";
      case 2:
        return "a";
      case 3:
        return "b";
    }
  }
  
  _processClientGameMessage(client, message) {
    let currentTime = (+new Date());
    
    //sanitize message string: a-z, 0-9 and some special chars are allowed
    message = message.replace(/[^\w \+\-\#\@\!\?\=\*\~\'\"\$\%\&\|\[\]\(\)\{\}\<\>\.\,\:\;\_\/\\\`\´]/gi, "");
    
    console.log("processing client game message:", message);
    
    let playerIdx = this.clients.indexOf(client);
    let board = this._getBoard(playerIdx);
    let playerColor = this._getColor(playerIdx);
    
    if (this.turns[board] != playerColor) {
      client.sendMessage("Error (not on the move): "+message);
      return;
    }
    
    if (this.isMoveQueued[board] == true) {
      client.sendMessage("Error (another move is queued): "+message);
      return;
    }
    
    
    //check if the move arrived within time
    if (!this._checkClocks(board, currentTime)) {
      return;
    }
    //stop this timer while we check for validity
    let clock = this.timers[board][this._getColorIndex(playerIdx)];
    clock.paused = true;
    
    //try to make the move
    this.isMoveQueued[board] = true;
    this._queueGameMessage("move", board+">"+message, answer => {
      this.isMoveQueued[board] = false;
      
      //For a valid move, update the timers.
      //Illegal moves are ignored. Pretend, that the timers were never stopped.
      clock.paused = false;
      
      if (answer == "rejected") {
        client.sendMessage("Error (not a move): "+message);
        return;
      }
      if (answer == "illegal") {
        client.sendMessage("Illegal move: "+message);
        return;
      }
      
      //otherwise the move was valid and was applied at the game backend.
      
      //other player is on the move
      this.turns[board] = (this.turns[board] == "white")?"black":"white";
      
      //broadcast move to other clients
      this.broadcast(message, board, client);
      
      //check if the game has ended
      let vbar = answer.indexOf("|");
      let pockets = answer.slice(2,(vbar==-1)?undefined:vbar);
      let colon = pockets.indexOf(":");
      let pocketsA = pockets.slice(0,colon);
      let pocketsB = pockets.slice(colon+1);
      this.checkPocketUpdate(pocketsA, pocketsB);
      
      let game_ended = (vbar != -1);
      if (game_ended) {
        let result = answer.slice(vbar+1);
        this._processStateMessage("game_ended", { board:board, result: result, onTime: false });
      } else {
        //update the current and start the other clock
        clock["remaining"] -= currentTime - clock["lastStart"];
        clock["lastStart"] = null;
        
        let otherClock = this.timers[board][this._getColorIndex(playerIdx)==0?1:0];
        otherClock["lastStart"] = (+new Date());
      }
    });
  }
  
  checkPocketUpdate(newPocketsA, newPocketsB) {
    if (this.pockets["a"] != newPocketsA) {
      this.pockets["a"] = newPocketsA;
      this.broadcast("holding "+newPocketsA, "a");
    }
    if (this.pockets["b"] != newPocketsB) {
      this.pockets["b"] = newPocketsB;
      this.broadcast("holding "+newPocketsB, "b");
    }
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
  
  /**
   * toBoard: undefined->send to a and b; "a" send only to board A; "b" send only to board B
   * exceptClient: use this to prevent sending a message (or move) back to the client who sent it.
  **/
  broadcast(message, toBoard, exceptClient) {
    let toA = (toBoard != "b");
    let toB = (toBoard != "a");
    
    console.log("[broadcasting to board(s):"+(toA?"a":"")+(toB?"b":"")+"]", message);
    for (let i in this.clients) {
      let client = this.clients[i];
      let board = this._getBoard(i);
      
      if ((((board == "a") && toA) || ((board == "b") && toB)) && (client != exceptClient)) {
        client.sendMessage(message);
      }
    }
    
    if (toA) {
      for (let client of this.observers["a"]) {
        if (client != exceptClient) {
          client.sendMessage(message);
        }
      }
    }
    
    if (toB) {
      for (let client of this.observers["b"]) {
        if (client != exceptClient) {
          client.sendMessage(message);
        }
      }
    }
  }
  
}


module.exports = GameServer;