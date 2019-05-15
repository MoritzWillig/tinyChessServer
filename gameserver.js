//Processes and passes the messages passing between the game, the console and all connected clients

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
          
    this.clients = [];
    this.observers = {
      "a": [],
      "b": []
    };
    
    this.turns = {
      "a": "white",
      "b": "white"
    };
    this.timers = [0,0,0,0];
    this.isMoveQueued = {
      "a": true,
      "b": true
    };
    //there are no qeued moves, but this prevent any moves from beeing made before the game starts
    
    this.state = "preparing0";
    
    //game_messages[0] is the message, that is currently processed by
    //the game.
    this.game_messages = [];
    /*message: {
      callback: fn,
      type: "fen"|"new"|"close"|"move"
    }*/
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
    
    board = this.observers[boardName];
    board.push(client);
    
    client.on("client.ready", (client) => {
      // send current board state
      this._queueGameMessage("fen", boardName, answer => {
        client.sendMessage('new');
        client.sendMessage("variant bughouse");
        client.sendMessage("force");
        client.sendMessage('setboard '+answer);
        
        client.setState("listening");
      });
    });
    
    client.on("client.close", (client) => {
      board.splice(board.indexOf(client), 1);
    });
    
    //observer messages are ignored (~only needed for the handshake)
    client.on("client.game.message", (client, message) => {
      this._processObserverMessage("client_game_message", {client: message, message: message});
    });
    
    client.on("client.game.needs_state", (client) => {
      client.sendMessage('setboard '+game.getFen());
    });
    
    client.setState("negotiating");
    client.sendMessage("xboard");
    client.sendMessage("protover 4");
    
    return true;
  }
  
  addClient(client) {
    if (this.clients.length == 4) {
      console.log("[server] rejected client. There are already four clients connected!");
      return false;
    }
    
    console.log("[server] registering a new client");
    
    this.clients.push(client);
    
    client.on("client.ready", (client) => {
      this._processStateMessage("client_ready");
    });
    
    client.on("client.game.message", data => {
      this._processStateMessage("client_game_message", {client: data.client, message: data.message});
    });
    
    client.setState("negotiating");
    client.sendMessage("xboard");
    client.sendMessage("protover 4");
    
    return true;
  }
  
  _processStateMessage(message, data) {
    let old_state = this.state;
    
    console.log("[server] processing message: ", message);
    
    switch (this.state) {
      case "preparing0":
        if (message === "client_ready") {
          this.state = "preparing1";
        }
        break;
      case "preparing1":
        if (message === "client_ready") {
          this.state = "preparing2";
        }
        break;
      case "preparing2":
        if (message === "client_ready") {
          this.state = "preparing3";
        }
        break;
      case "preparing3":
        this.state = "ready";
        console.log("[server] the game is ready to start. Type 'go' to start");
        break;
      case "ready":
        if (message === "go") {
          this.broadcast("#the game is starting");
          this.state="in_progress";
          
          //TODO remove any move commands from the queue
          
          this._queueGameMessage("new", undefined, (answer) => {
            console.log(">>new answer: ", answer);
            
            this.timers[0] = this.timers[1] = this.timers[2] = this.timers[3] = this.config["time"];
            this.turns = {
              "a": "white",
              "b": "white"
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
              
              let partner = this._getPartner(0|i);
              
              client.sendMessage("new");
              client.sendMessage("variant bughouse");
              client.sendMessage("partner "+partner);
              client.sendMessage("time "+this.timers[i]);
              client.sendMessage("otim "+this.timers[partner]);
              if (this._getColor(i) == "white") {
                client.sendMessage("go");
              } else {
                client.sendMessage("playother");
              }
              
              //TODO start timer
            }
          });
        }
        break;
      case "in_progress":
        switch (message) {
          case "game_ended":
            //TODO remove any queued moves
            //prevent any further moves from beeing queued
            this.isMoveQueued = {
              "a": true,
              "b": true,
            };
            //TODO broadcast results
            let result = data.result;
            this.broadcast(result+" {one of the players was mated D:}");
            
            this.state="ready";
            this.broadcast("#the game is ready to start. Type 'go' to start a new game");
            break;
          case "client_game_message":
            this._processClientGameMessage(data.client, data.message);
            break;
        }
        break;
      case "error":
        break;
      default:
        this.state="error";
        broadcast("#internal server error");
        broadcast("quit");
    }
    
    if (old_state != this.state) {
      console.log("[server] server state changed to", this.state);
    }
  }
  
  _getPartner(clientIdx) {
    //pair players 0&1 and 2&3
    switch (clientIdx) {
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
    return (clientIdx%2 == 0)?"white":"black";
  }
  
  _getBoard(clientIdx) {
    return (clientIdx<2)?"a":"b";
  }
  
  _processClientGameMessage(client, message) {
    //sanitize message string: only word chars (a-z) and space is allowed
    message = message.replace(/[^\w ]/gi, "");
    
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
    
    this.isMoveQueued[board] = true;
    
    //TODO stop timers and timer states
    
    //try to make the move
    this._queueGameMessage("move", board+">"+message, answer => {
      this.isMoveQueued[board] = false;
      
      if (answer == "rejected") {
        //start timers and apply
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
      let game_ended = (answer != "ok");
      if (game_ended) {
        let result = answer.slice(3);
        this._processStateMessage("game_ended", { result: result });
      } else {
        //TODO start the other timer
      }
    });
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