
class GameCommunicator {
  
  constructor() {
    this._events = {
      "client.ready": [],
      "client.status.message": [],
      "client.game.message": [],
      "connection.close": [],
      "receivedMessage": [],
      "close": [],
    };

    this._state = "disconnected";
  }
  
  setState(state) {
    this.state = state;
  }
  
  sendMessage(message) {
    //...
  }
  
  close() {
    //...
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

class GameClient {
  
  constructor() {
    this._communicator = null;
    this._state = "disconnected";
    
    this._events = {
      "client.ready": [],
      "client.status.message": [],
      "client.game.message": [],
      "connection.close": []
    };
  }
  
  setCommunicator(communicator) {
    if (this._communicator !== null) {
      throw new Error("Another communicator is already registered.");
    }
    this._communicator = communicator;
    this._communicator.on("receivedMessage", (message) => {
      this.processMessage(message);
    });
    this._communicator.on("close", (data) => {
      this.close();
      this.doEvent("connection.close", data);
    });
    
    this.setState("waiting");
  }
  
  processMessage(message) {
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
  }
  
  sendMessage(message) {
    if (!this.isActive()) {
      return;
    }
    
    this._communicator.sendMessage(message);
  }
  
  isActive() {
    return (this._state != "disconnected");
  }
  
  close() {
    if (!this.isActive()) {
      return;
    }
    
    this.setState("disconnected");
  }
  
  setState(state) {
    //without a communicator, we always stay disconnected
    if (this._communicator == null) {
      return;
    }
    
    this._state = state;
    
    if (this._state == "disconnected") {
      this._communicator = null;
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
      throw new Error("unknown event name: " + eventName);
    }
    
    for (let handler of handlers) {
      handler(data);
    }
  }
}


module.exports = {
  GameClient: GameClient,
  GameCommunicator: GameCommunicator
};