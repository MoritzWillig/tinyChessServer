/// Handles the state of the board and processes messages from the clients that are playing the game.
/// 
/// This class checks the validity of the moves played and delivers the (private) messages
/// to the players.

class Game {
  
  constructor(clients) {
    this.board = new Board();
    this.clients = clients;
    
    this.broadcast("new");
    this.broadcast("variant bughouse");
  }
  
  registerMove(moveStr) {
    //...
  }
  
  broadcast(message) {
    for (let client of this.clients) {
      client.send(message);
    }
  }
}


module.exports = Game;