
function* reverse(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i];
  }
}

class GameCommunicator {
  
  constructor() {
    this._events = {
      "receivedMessage": [],
      "close": []
    };
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
    this._events = {
      "client.ready": [],
      "client.status.message": [],
      "client.game.message": [],
      "connection.close": []
    };
    
    this._communicator = null;
    this._state = "disconnected";
    this._reset();
  }
  
  _reset() {
    this._features = [];
    this.flags = {
      otherBoard: false
    };
    this.setState("disconnected");
    this._communicator = null;
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
    });
    
    this.setState("negotiating");
    this.sendMessage("xboard");
    this.sendMessage("protover 4");
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
          this._parseFeatures(message);
          
          this._checkFeatures();
        }
        break;
      case "ready":
        this.doEvent("client.game.message", { client:this, message:message });
        break;
    }
  }
  
  _checkFeatures() {
    //TODO we should check for done=1 or set a timer ...
    //let doneValue = this.getLastFeatureValue("done");
    //if ((doneValue === null)) {
    //  return;
    //}
    
    this.flags["otherBoard"] = (this.getLastFeatureValue("otherboard") === "1");
    
    //accept the features
    //TODO check if we support the flags
    this.sendMessage("accepted");
    this.setState("ready");
    this.doEvent("client.ready");
  }
  
  _parseFeatures(featureString) {
    let featureRegex = /(\w+)=(?:(\w+)|(?:"((?:[^\\"]|\\.)*)"))/g;
    
    let match;
    while ((match = featureRegex.exec(featureString)) !== null) {
      this._features.push({key: match[1], value: ((match[2]===undefined)?"":match[2])+((match[3]===undefined)?"":match[3]) });
    }
  }
  
  getFirstFeatureValue(featureName) {
    for (let feature of this._features) {
      if (feature["key"] === featureName) {
        return feature["value"];
      }
    }
    return null;
  }
  
  getLastFeatureValue(featureName) {
    for (let feature of reverse(this._features)) {
      if (feature["key"] === featureName) {
        return feature["value"];
      }
    }
    return null;
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
    
    let communicator = this._communicator;
    this._reset();
    communicator.close();
    this.doEvent("connection.close", {communicator: communicator});
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