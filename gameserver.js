//Processes and passes the messages passing between the game, the console and all connected clients

class GameServer {
  
  constructor(gameFactory, clients) {
    this._events = new WeakMap();
    
    this.gameFactory = gameFactory;
    
    this.game = undefined;
    this.clients = [];
  }
  
  processMessage(sender, message) {
    if (sender === "console") {
      switch (message) {
        case "close":
          broadcast("exit");
          this.doEvent("server.close");
          break;
          
      }
    }
    
    this.broadcast(`message [server] unknown message from ${sender}: message`);
  }
  
  on(eventName, eventHandler) {
    let handlers = this._events.get(eventName);
    if (handlers === undefined) {
      handlers = [];
      this._events.set(eventName, handlers);
    }
    
    handlers.push(eventHandler);
  }
  
  doEvent(eventName, data) {
    let handlers = this._events.get(eventName);
    if (handlers === undefined) {
      return;
    }
    
    for (let handler in handlers) {
      handler(data);
    }
  }
  
}


module.exports = GameServer;