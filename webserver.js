/// The WebServer class delivers the files of the web interface for this 

const express = require("express");

class WebServer {
  
  constructor(board, channels) {
    this.board = board;
    this.channels = channels;
    
    this.app = null;
  }
  
  listen(config) {
    this.app = express();
    this.app.use('/', express.static(config["static_dir"]));

    this.app.get('/api/:bookId', function (req, res) {
      res.send('Hello World!')
    })

    this.app.listen(config.port, () => console.log(`Serving ${config["static_dir"]} at port ${config["port"]}`));
  }
}

module.exports = WebServer;
