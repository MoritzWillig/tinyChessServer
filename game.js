/// Handles the state of the board and processes messages from the clients that are playing the game.
/// 
/// This class checks the validity of the moves played and delivers the (private) messages
/// to the players.

class Game {
  
  constructor(clients) {
    this.board = new Board();
    this.clients = clients;
  }
}


module.exports = Game;