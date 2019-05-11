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
    
    this.game = null;
    this.clients = [];
    this.observers = [];
    
    this.timers = [0,0,0,0];
    
    this.state = "preparing0";
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
  
  addClient(client) {
    if (this.clients.length == 4) {
      console.log("[server] rejected client. There are already four clients connected!");
      return false;
    }
    
    console.log("registering new client");
    
    this.clients.push(client);
    
    client.on("client.ready", (client) => {
      this._processStateMessage("client_ready");
    });
    
    client.on("client.game.message", (client, message) => {
      this._processStateMessage("client_game_message", {client: message, message: message});
    });
    
    client.setState("negotiating");
    client.send("xboard");
    client.send("protover 4");
    
    return true;
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
        this.broadcast("#the game is ready to start. Type 'go' to start");
        break;
      case "ready":
        if (message === "go") {
          this.broadcast("#the game is starting");
          this.state="in_progress";
          
          this.game = this.gameFactory();
          this.timers[0] = this.timers[1] = this.timers[2] = this.timers[3] = this.config["time"];
          
          for (let i in this.clients) {
            let client = this.clients[i];
            
            let partner = this._getPartner(i);
            
            client.setState("playing");
            client.sendMessage("new");
            client.sendMessage("variant bughouse");
            client.sendMessage("partner "+partner);
            client.sendMessage("time "+this.timers[i]);
            client.sendMessage("otim "+this.timers[partner]);
            client.sendMessage(this._getColor(i));
            //TODO start timer
          }
        }
        break;
      case "in_progress":
        switch (message) {
          case "ended":
            //TODO broadcast results
            this.broadcast("#the game is ready to start. Type 'go' to start");
            this.state="ready";
            break;
          case "client_game_message":
            this._processGameMessage(data.client, data.message);
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
    console.log("server state changed to",this.state);
  }
  
  _getPartner(clientIdx) {
    //pair players 0&1 and 2&3
    (Math.floor(clientIdx/2)*2+1-(clientIdx%2))
  }
  
  _getColor(clientIdx) {
    return (clientIdx%2 == 0)?"white":"black";
  }
  
  _processGameMessage(client, message) {
    //analyze message, check move validity, distribute to other clients
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
  
  broadcast(message) {
    console.log("[broadcasting]", message);
    for (let client of this.clients) {
      client.send(message);
    }
  }
  
}


module.exports = GameServer;