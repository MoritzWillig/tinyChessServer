# tinyChessServer

## Installation

1. Install all nodejs dependencies:
 ```
 $ npm install
 ```

2. The project requires the modified python-chess repository from https://github.com/TimSchneider42/python-chess which is capable of handling bughouse games.
 ```
 git submodule update
 git submodule init
 ```

3. Create a copy the `config.json.default`-file and name it `config.json` and adjust the settings to to your system.

## Running the server

1. Start the server (the port used in defined in config.js)
 ```
 node index.js
 ```

2. Open a new wepage with `http://localhost:<port>/`

3. You can open developer view and console with `F12`

4. Open 3 new tabs and hit `play`

5. In the server console enter `go`

6. You can send a new move with `ws.send("move e2e4")` in the developer console.

## Configuration


### Positions
All clients get assigned an internal board position index. This index determines their team, the board they play on, as well as the side to play.
0: Team 0 - Board A White
1: Team 0 - Board B Black
2: Team 1 - Board A Black
3: Team 1 - Board B White