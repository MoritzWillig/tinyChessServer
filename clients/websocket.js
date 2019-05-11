///This websocket client enables the communication between the web interface and the gameserver class.

const GameClient = require("./gameclient.js");
const WebSocket = require('ws');


class WebSocketGameServer {
  
  constructor(server, config) {
    this._events = {
      "client.new": []
    };
    
    this.clients = [];
    
    this.wss = new WebSocket.Server({
      path: config["path"],
      server: server,
      verifyClient: (info) => {
        return true;
      }
    });
    
    this.wss.on('connection', (ws) => {
      let wsgc = new WebSocketGameClient(ws);
      wsgc.on("connection.close", (client) => {
        this.clients.remove(client);
      });
      this.clients.push(wsgc);
      this.doEvent("client.new", wsgc);
    });
    
    /*
    wss.clients
                .forEach(client => {
                    if (client != ws) {
                        client.send(`Hello, broadcast message -> ${message}`);
                    }    
    });
    */
  }
  
  on(eventName, eventHandler) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Error("unknown event name:" + eventName);
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


class WebSocketGameClient extends GameClient {
  
  constructor(ws) {
    super();
    this.ws = ws;
    
    this._events = {
      "client.ready": [],
      "client.game.message": [],
      "connection.close": []
    };
    
    ws.on('message', (message) => {
      let parts = message.split(" ");
      let command = parts[0];
      
      switch (this._state) {
        case "negotiating":
          if (command === "feature") {
            //TODO we should check the requested features ...
            this.sendMessage("accepted");
            this.setState("ready");
            this.doEvent("client.ready");
          }
          break;
        case "ready":
          break;
        case "playing":
          this.doEvent("client.game.message", message);
      }
    });
    
    ws.on('close', (code, reason) => {
      this.doEvent("connection.close", {code: code, reason: reason});
    });
    
  }
  
  sendMessage(message) {
    this.ws.send(message+"\n");
  }
  
  close() {
    this.ws.close();
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
      throw new Error("unknown event name: " + eventName);
    }
    
    for (let handler of handlers) {
      handler(data);
    }
  }
}

module.exports = WebSocketGameServer;