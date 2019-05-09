/// The WebServer class delivers the files of the web interface for this 

const express = require("express");

class WebServer {
  
  constructor(board, channels) {
    this.board = board;
    this.channels = channels;
  }
}

/*
const app = express();
if (config["serve_static"] === true) {
  app.use('/', express.static('static'));
}

app.get('/api/:bookId', function (req, res) {
  res.send('Hello World!')
})

app.listen(config.port, () => console.log(`Serving "${config.appname}" at port ${config.port}`));
*/
