import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex'
import Chess from 'chess.js'

Vue.use(Vuex)

Vue.config.productionTip = false


Vue.methds = {
  replaceAt: (str, index, replacement) => {
    return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
  },
  getOffsetForFen: (char, index) => {
    return char.charCodeAt() - 97 + ((8 - index) * 9)
  },
  makeFenExplicit: (fen) => {
    fen = fen.replace(new RegExp('8', 'g'), '11111111');
    fen = fen.replace(new RegExp('7', 'g'), '1111111');
    fen = fen.replace(new RegExp('6', 'g'), '111111');
    fen = fen.replace(new RegExp('5', 'g'), '11111');
    fen = fen.replace(new RegExp('4', 'g'), '1111');
    fen = fen.replace(new RegExp('3', 'g'), '111');
    return fen.replace(new RegExp('2', 'g'), '11');
  },
  makeFenImplicit: (fen) => {
    fen = fen.replace(new RegExp('11111111', 'g'), '8');
    fen = fen.replace(new RegExp('1111111', 'g'), '7');
    fen = fen.replace(new RegExp('111111', 'g'), '6');
    fen = fen.replace(new RegExp('11111', 'g'), '5');
    fen = fen.replace(new RegExp('1111', 'g'), '4');
    fen = fen.replace(new RegExp('111', 'g'), '3');
    return fen.replace(new RegExp('11', 'g'), '2');
  },
  getFenTurnColor: (fen) => {
    return fen.includes(" w ") ? 'white' : 'black';
  },
  changeFenTurnColor: (fen) => {
    var turnColor = Vue.methds.getFenTurnColor(fen)
    if (turnColor == 'white') {
      return fen.replace(new RegExp(' w ', 'g'), ' b ');
    } else {
      return fen.replace(new RegExp(' b ', 'g'), ' w ');
    }
  },
  pieceCorrespondants: [['p', 'pawn'], ['q', 'queen'], ['k', 'king'], ['r', 'rook'], ['n', 'knight'], ['b', 'bishop']], 
  pieceShortToType: (str) => {
    str = str.toLowerCase()
    var retEl = ''
    Vue.methds.pieceCorrespondants.forEach(element => {
      if (element[0] === str) {
        retEl = element[1]
      }
    });
    return retEl
  },
  pieceTypeToShort: (str) => {
    str = str.toLowerCase()
    var retEl = ''
    Vue.methds.pieceCorrespondants.forEach(element => {
      if (element[1] === str) {
        retEl = element[0]
      }
    });
    return retEl
  },
  removeEnPassantFromFen: (str) => {
    str = str.split(" ")
    str[3] = "-"
    str = str.join(" ")
    return str
  }
}

/* Create Vuex Store */
const store = new Vuex.Store({
  state: {
    wsA: new WebSocket("ws://localhost:8080/websocketObserverA"),
    wsB: new WebSocket("ws://localhost:8080/websocketObserverB"),
    wsEvents: [],
    games: {
      "boardA": new Chess(),
      "boardB": new Chess() 
    },
    boards: {
      "boardA": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", //in fen notation
      "boardB": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     },
    pockets: {
      "boardA": {
        "white": [],
        "black": []
      },
      "boardB": {
        'white': [],
        'black': []
      }
    },
    selectedPockedPiece: {
      "boardA": "pawn",
      "boardB": ""
    },
    status: "preparing0"
  },
  getters: {
    getBoardWithExplicitNumbers: (state) => (board) => {
      var fen = state.boards[board]
      return Vue.methds.makeFenExplicit(fen)
    },
    currentTurnColor: (state) => (board) => {
      var fen = state.boards[board]
      return Vue.methds.getFenTurnColor(fen)
    },
  },
  actions: {
    processCommand(context, payload){
      var boardName = payload[0]
      var command = payload[1]
      console.log(boardName, command)
      // simple move e.g. e2e4
      // castling (rochade): e1g1, e1c1, e8g8, e8c8
      if (command == 'new') {
        store.commit('newGame')
      }
      if (command.charAt(0) == "#"){
        var command_split = command.split(" ")
        console.log(command_split)
        console.log(command_split[1])
        console.log(command_split[2])
        if (command_split[1] == "status"){
          store.commit('setStatus', [boardName, command_split[2]])
        }
      }
      command = command.replace("move ", "");
      if (command.length == 4 && command.match(/\w\d\w\d/i)) {
        store.dispatch('move', [boardName, command])
      }
      // pawn promotion e.g. e7e8q
      if (command.length == 5 && command.match(/\w\d\w\d\w/i)) {
        store.dispatch('move', [boardName, command])
      }  
      // Bughouse/crazyhouse drop:	P@h3
      if (command.length == 4 && command.match(/\w@\w\d/i)) {
        console.log('insertation')
        store.dispatch('insertPieceAtXBoardPosition', [boardName, command])
      }
      // ICS Wild 0/1 castling:	d1f1, d1b1, d8f8, d8b8
      // FischerRandom castling:	O-O, O-O-O (oh, not zero)
      // Multi-leg move:	c4d5,d5e4 (legs separated by comma)
      // Null move:	@@@@
    },
    insertPieceAtXBoardPosition(context, payload){
      var board = payload[0]
      var command = payload[1]
      var piece = command.charAt(0)
      var position = command.charAt(2) + command.charAt(3)
      // var position = Vue.methds.getOffsetForFen(command.charAt(2), command.charAt(3))
      context.dispatch('insertPieceAtPosition', [board, {'type': piece, 'color': context.getters.currentTurnColor(board).charAt(0)}, position])
    },
    /* inserts piece (e.g. 'p') at fen-offset position, changes turn color */
    insertPieceAtPosition(context, payload){
      var board = payload[0]
      var piece = payload[1]
      var position = payload[2]
      console.log(piece, position)
      
      context.state.games[board].put(piece, position)
      var fen = context.state.games[board].fen()
      fen = Vue.methds.changeFenTurnColor(fen)
      fen = Vue.methds.removeEnPassantFromFen(fen)
      context.state.games[board].load(fen)

      context.dispatch('removePieceFromPocket', [board, piece.type])
      context.commit('updateFenFromGame', board)
    },
    removePieceFromPocket(context, payload){
      var board = payload[0]
      var piece = Vue.methds.pieceShortToType(payload[1])
      var turnColor = context.getters.currentTurnColor(board)
      var pocket = context.state.pockets[board][turnColor]

      pocket.forEach((element, indx) => {
        if(piece === element.type) {
          if(element.count == 1){
            pocket = pocket.filter(function(value){
              return value.type !== piece;
            });
          } else {
            pocket[indx]['count'] -= 1;      
          }
        }
      })
      context.commit('setNewPocket', [board, turnColor, pocket])
    },
    addPieceToPocket(context, payload){
      var board = payload[0]
      var color = payload[1]
      var piece = Vue.methds.pieceShortToType(payload[2])
      var pocket = context.state.pockets[board][color]

      var isPlaced = false
      pocket.forEach((element, indx) => {
        if(piece === element.type) {
          pocket[indx]['count'] += 1;
          isPlaced = true
        }
      })
      if (!isPlaced) {
        pocket.push({'type': piece, 'count': 1})
      }
      context.commit('setNewPocket', [board, color, pocket])
    },
    move(context, payload){
      var board = payload[0]
      var command = payload[1]
      var res = context.state.games[board].move(command, {sloppy: true})
      console.log(res)
      if (res && "captured" in res){
        context.dispatch('addPieceToPocket', [board == 'boardA' ? 'boardB' : 'boardA', res.color == 'w' ? 'black' : 'white', res.captured])
      }
      context.commit('updateFenFromGame', board)
    }
  },
  mutations: {
    newGame(state){
      state.games['boardA'].reset()
      state.games['boardB'].reset()
      state.pockets['boardA']['white'] = []
      state.pockets['boardA']['black'] = []
      state.pockets['boardB']['white'] = []
      state.pockets['boardB']['black'] = []
      state.boards['boardA'] = state.games['boardA'].fen()
      state.boards['boardB'] = state.games['boardB'].fen()
    },
    undo(state){
      console.log('undo')
      state.games['boardA'].undo()
      state.games['boardB'].undo()
      state.boards['boardA'] = state.games['boardA'].fen()
      state.boards['boardB'] = state.games['boardB'].fen()
    },
    selectPocketPiece(state, payload){
      var board = payload[0]
      var piece = payload[1]
      state.selectedPockedPiece[board] = piece
    },
    setStatus(state, status){
      state.status = status[1]
    },
    setNewPocket(state, payload){
      var board = payload[0]
      var color = payload[1]
      var pocket = payload[2]
      state.pockets[board][color] = pocket
    },
    addWebsocketEvent (state, event) {
      state.wsEvents.push(event)
    },
    updateFenFromGame(state, board){
      state.selectedPockedPiece[board] = ''
      state.boards[board] = state.games[board].fen()
    }
  }
})

/*store.commit('addWebsocketEvent', {'command': 'xboard', 'function': () => {}})
store.commit('addWebsocketEvent', {'command': 'protover', 'function': () => {
  store.state.ws.send("feature san=1, time=1, variants=\"bughouse\", otherboard=1, colors=1, time=1, done=1");
}})*/

var onmessageFunc = (event, boardName) => {
  let message = event.data;
  
  let command = message
  // let idx = message.indexOf(" ");
  // let command = (idx!=-1)?message.slice(0, idx):message;
  
  console.log("[server, "+boardName+"] "+message);

  store.state.wsEvents.forEach(element => {
    if (element.command === command) {
      element.function();
    }
  });
  store.dispatch('processCommand', [boardName, command])
};

store.state.wsA.onmessage = (event) => {onmessageFunc(event, "boardA")};
store.state.wsB.onmessage = (event) => {onmessageFunc(event, "boardB")};


new Vue({
  store,
  render: h => h(App),
}).$mount('#app')