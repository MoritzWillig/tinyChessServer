/// The WebServer class delivers the files of the web interface for this 

const express = require("express");

class WebServer {
  
  constructor(config) {
    this.app = express();
    this.app.use('/', express.static(config["static_dir"]));
  }
  
  getApp() {
    return this.app;
  }
}

module.exports = WebServer;
