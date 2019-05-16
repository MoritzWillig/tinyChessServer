# tinyChessServer

1. Install all dependencies:
```
$ npm install
```
 
 2. Clone python-chess repository from https://github.com/TimSchneider42/python-chess into `backend/`
 
 3. Start server (the port used in defined in config.js)
 ```
 node index.js
 ```
 
 4. Open a new wepage with `http://localhost:<port>/`
 
 5. You can open developer view and console with `F12`
 
 6. Open 3 new tabs and hit `play`
 
 7. In the server console enter `go`
 
 8. You can send a new move with ` ws.send("e2e4")` for example in the developer console. 
 (If you send the same move twice or an illegal move you will get an error.)
