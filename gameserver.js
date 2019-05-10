//Processes and passes the messages passing between the game, the console and all connected clients

class GameServer {
  
  constructor(gameFactory) {
    this._events = {
      "game.new": new WeakSet(),
      "game.update": new WeakSet(),
      "game.end": new WeakSet(),
      "server.close": new WeakSet()
    };
    
    this.gameFactory = gameFactory;
    
    this.game = undefined;
    this.clients = [];
    
    this.state = "preparing0";
  }
  
  processMessage(sender, message) {
    if (sender === "console") {
      switch (message) {
        case "exit":
        case "close":
          this.broadcast("quit");
          this.doEvent("server.close");
          break;
          
      }
    }
    
    this.broadcast(`message [server] unknown message from ${sender}: message`);
  }
  
  addClient(client) {
    this.clients.push(client);
    
    client.on("client.ready", (client) => {
      this._processStateMessage("client_ready");
    });
    
    client.on("client.game.message", (client, message) => {
      this._processStateMessage("client_game_message", {client: message, message: message});
    });
    
    client.send("xboard");
    client.send("protover 4");
  }
  
  on(eventName, eventHandler) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Exception("unknown event name");
    }
    
    handlers.add(eventHandler);
  }
  
  _processStateMessage(message, data) {
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
        broadcast("#the game is ready to start");
        break;
      case "ready":
        if (message === "go") {
          broadcast("#game is starting");
          broadcast("new");
          this.state="in_progress";
          
          //TODO start timer
        }
        break;
      case "in_progress":
        switch (message) {
          case "ended":
            this.state="ready";
            break;
          case "client_game_message":
            _processGameMessage(data.client, data.message);
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
  }
  
  _processGameMessage(client, message) {
    //analyze message, check move validity, distribute to other clients
  }
  
  doEvent(eventName, data) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Exception("unknown event name");
    }
    
    for (let handler in handlers) {
      handler(data);
    }
  }
  
  broadcast(message) {
    for (let client of clients) {
      client.send(message);
    }
  }
  
}


module.exports = GameServer;