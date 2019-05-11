
class GameClient {
  
  constructor() {
    this._state = "unknown";
  }
  
  send(message) {
    //...
  }
  
  close() {
    //...
  }
  
  setState(state) {
    this._state = state;
  }
}


module.exports = GameClient;