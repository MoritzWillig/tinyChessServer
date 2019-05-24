///This websocket client enables the communication between the web interface and the gameserver class.

const GameClient = require("./gameclient.js");
const WebSocket = require('ws');


class WebSocketGameServer {
  
  constructor() {
    this._events = {
      "client.new": []
    };
    
    this.clients = [];
    
    this.wss = new WebSocket.Server({ noServer: true });
    
    this.wss.on('connection', (ws) => {
      let wsgc = new WebSocketGameClient(ws);
      wsgc.on("connection.close", (client) => {
        this.clients.splice(client, 1);
      });
      this.clients.push(wsgc);
      this.doEvent("client.new", wsgc);
    });
  }
  
  getServer() {
    return this.wss;
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
      "client.status.message": [],
      "client.game.message": [],
      "connection.close": []
    };
    
    ws.on('message', (message) => {
      let parts = message.split(" ");
      let command = parts[0];

      if (command === "go") {
        this.doEvent("client.status.message", { client:this, message:message });
      }

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
          this.doEvent("client.game.message", { client:this, message:message });
          break;
      }
    });
    
    ws.on('close', (code, reason) => {
      this.doEvent("connection.close", { code: code, reason: reason });
    });
  }
  
  sendMessage(message) {
    this.ws.send(message);
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