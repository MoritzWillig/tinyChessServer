///This websocket client enables the communication between the web interface and the gameserver class.

const GameCommunicator = require("./gameclient.js").GameCommunicator;
const WebSocket = require('ws');


class WebSocketGameServer {
  
  constructor() {
    this._events = {
      "client.new": []
    };
    
    this.wss = new WebSocket.Server({ noServer: true });
    
    this.wss.on('connection', (ws) => {
      let wsgc = new WebSocketGameCommunicator(ws);
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


class WebSocketGameCommunicator extends GameCommunicator {
  
  constructor(ws) {
    super();
    this.ws = ws;
    this.isClosing = false;
    
    ws.on('message', (message) => {
      this.doEvent("receivedMessage", message);
    });
    
    ws.on('close', (code, reason) => {
      this.close(code, reason);
    });
  }
  
  sendMessage(message) {
    try {
      this.ws.send(message);
    } catch(e) {
      console.log("[ws client] error writing to websocket.");
      console.log("[ws client]", e);
      this.close(-1, "error writing to websocket");
    }
  }
  
  close(code, reason) {
    if (this.isClosing) {
      return;
    }
    this.isClosing = true;
    
    this.sendMessage("quit");
    try {
      this.ws.close();
    } catch(e) {
      console.log("[ws client] error closing the websocket.");
      console.log("[ws client]", e);
    }
    
    this.doEvent("close", { code: code, reason: reason });
  }
}

module.exports = WebSocketGameServer;