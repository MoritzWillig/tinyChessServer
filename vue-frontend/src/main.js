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
  }
}

/* Create Vuex Store */
const store = new Vuex.Store({
  state: {
    wsA: new WebSocket("ws://localhost:80/websocketObserverA"),
    wsB: new WebSocket("ws://localhost:80/websocketObserverB"),
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
        "white": [{'type': 'queen', 'count': 1}, {'type': 'rook', 'count': 1}, {'type': 'pawn', 'count': 4}],
        "black": [{'type': 'queen', 'count': 1}]
      },
      "boardB": {
        'white': [{'type': 'queen', 'count': 1}, {'type': 'pawn', 'count': 4}],
        'black': []
      }
    },
    selectedPockedPiece: {
      "boardA": "pawn",
      "boardB": ""
    }
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
    insertPieceAtXBoardPosition(context, payload){
      var board = payload[0]
      var command = payload[1]
      var piece = command.charAt(0)
      var position = Vue.methds.getOffsetForFen(command.charAt(2), command.charAt(3))
      context.dispatch('insertPieceAtPosition', [board, piece, position])
    },
    /* inserts piece (e.g. 'p') at fen-offset position, changes turn color */
    insertPieceAtPosition(context, payload){
      var board = payload[0]
      var piece = payload[1]
      var position = payload[2]

      var boardFen = context.getters.getBoardWithExplicitNumbers(board)
      var fen = Vue.methds.replaceAt(boardFen, position, piece)
      fen = Vue.methds.changeFenTurnColor(fen)
      context.dispatch('removePieceFromPocket', [board, piece])
      context.dispatch('setBoardWithExplicitNumbers', [board, fen])
    },
    removePieceFromPocket(context, payload){
      var board = payload[0]
      var piece = Vue.methds.pieceShortToType(payload[1])
      var turnColor = context.getters.currentTurnColor(board)
      var pocket = context.state.pockets["boardA"][turnColor]

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
    move(context, payload){
      var board = payload[0]
      var command = payload[1]
      var fen = context.getters.getBoardWithExplicitNumbers(board)

      // get FEN offsets
      var offsetOldPos = Vue.methds.getOffsetForFen(command.charAt(0), command.charAt(1))
      var offsetNewPos = Vue.methds.getOffsetForFen(command.charAt(2), command.charAt(3))

      // get type of element that was moved
      if (command.length == 5) {
        var elToMoveType = command.charAt(4)
      } else {
        var elToMoveType = fen.charAt(offsetOldPos)
      }

      fen = Vue.methds.replaceAt(fen, offsetOldPos, '1')
      fen = Vue.methds.replaceAt(fen, offsetNewPos, elToMoveType)
      fen = Vue.methds.changeFenTurnColor(fen)

      context.dispatch('setBoardWithExplicitNumbers', [board, fen])
    },
    setBoardWithExplicitNumbers (context, payload) {
      var board = payload[0]
      var fen = Vue.methds.makeFenImplicit(payload[1])
      console.log('setting new fen', fen)
      context.commit('setNewFen', [board, fen])
    }
  },
  mutations: {
    selectPocketPiece(state, payload){
      var board = payload[0]
      var piece = payload[1]
      state.selectedPockedPiece[board] = piece
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
    setNewFen(state, event){ // accepts messages of type ['boardA', *fen*]
      state.boards[event[0]] = event[1]
      state.selectedPockedPiece[event[0]] = ''
    }
  }
})

/*store.commit('addWebsocketEvent', {'command': 'xboard', 'function': () => {}})
store.commit('addWebsocketEvent', {'command': 'protover', 'function': () => {
  store.state.ws.send("feature san=1, time=1, variants=\"bughouse\", otherboard=1, colors=1, time=1, done=1");
}})*/

var onmessageFunc = (event, boardName) => {
  let message = event.data;
  
  let idx = message.indexOf(" ");
  let command = (idx!=-1)?message.slice(0, idx):message;
  
  console.log("[server, "+boardName+"] "+message);

  store.state.wsEvents.forEach(element => {
    if (element.command === command) {
      element.function();
    }
  });
  // simple move e.g. e2e4
  // TODO: remove pieces correctly
  if (command.length == 4 && command.match(/\w\d\w\d/i)) {
    store.dispatch('move', [boardName, command])
  }
  // pawn promotion e.g. e7e8q
  if (command.length == 4 && command.match(/\w\d\w\d\w/i)) {
    store.dispatch('move', [boardName, command])
  }  
  // Bughouse/crazyhouse drop:	P@h3
  if (command.length == 4 && command.match(/\w@\w\d\w/i)) {
    store.dispatch('insertPieceAtXBoardPosition', [boardName, command])
  }
  // castling (rochade): e1g1, e1c1, e8g8, e8c8
  // ICS Wild 0/1 castling:	d1f1, d1b1, d8f8, d8b8
  // FischerRandom castling:	O-O, O-O-O (oh, not zero)
  // Multi-leg move:	c4d5,d5e4 (legs separated by comma)
  // Null move:	@@@@
};

store.state.wsA.onmessage = (event) => {onmessageFunc(event, "boardA")};
store.state.wsB.onmessage = (event) => {onmessageFunc(event, "boardB")};


new Vue({
  store,
  render: h => h(App),
}).$mount('#app')