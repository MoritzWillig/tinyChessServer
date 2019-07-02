var os = require('os');

const GameCommunicator = require("./gameclient.js").GameCommunicator;
const child_process = require('child_process');
const readline = require('readline');


class CLICreator {
  
  constructor(config) {
    this._events = {
      "client.new": []
    };
    
    this.config = config;
  }
  
  createClients() {
    for (let cliConfig of this.config["engines"]) {
      if (cliConfig["enabled"] !== true) {
        continue;
      }
      
      let cligc = new CLIGameCommunicator(cliConfig);
      this.doEvent("client.new", { communicator: cligc, position: parseInt(cliConfig["position"]) });
    }
  }
  
  on(eventName, eventHandler) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Error("unknown event name:" + eventName);
    }
    
    handlers.push(eventHandler);
  }
  
  doEvent(eventName, data) {
    let handlers = this._events[eventName];
    if (handlers === undefined) {
      throw new Error("unknown event name:" + eventName);
    }
    
    for (let handler of handlers) {
      handler(data);
    }
  }
}

class CLIGameCommunicator extends GameCommunicator {
  
  constructor(cliConfig) {
    super();
    
    this.child = child_process.exec(cliConfig["command"], {
      cwd: cliConfig["cwd"],
      encoding: "utf8"
    }, (error, stdout, stderr) => {
      //nothing to do
    });
    
    this.child.stderr.on('data', data => {
      console.log(`[cli client] reported an error: ${data}`);
    });

    this.child.on('close', (code) => {
      console.log(`[cli client] process exited with code ${code}`);
      this.doEvent("close", { code: code, reason: "" });
    });
    
    this.rl = readline.createInterface({
      input: this.child.stdout,
      output: this.child.stdin
    });
    
    this.rl.on('line', (line) => {
      this.doEvent("receivedMessage", line.trim());
    });
  }
  
  sendMessage(message) {
    this.rl.write(message + os.EOL);
  }
  
  close() {
    this.cli.close();
  }
  
}

module.exports = CLICreator;