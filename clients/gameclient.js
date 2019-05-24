
class GameClient {
  
  constructor() {
    this._state = "unknown";
  }
  
  sendMessage(message) {
    //...
  }
  
  close() {
    //...
  }
  
  setState(state) {
    this._state = state;
  }
  
  on(eventName, eventHandler) {
    //...
  }
  
  doEvent(eventName, data) {
    //...
  }
}


module.exports = GameClient;