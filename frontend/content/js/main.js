
const unicode_pieces = {
  "P": "&#9817;", "p": "&#9823;",
  "N": "&#9816;", "n": "&#9822;",
  "B": "&#9815;", "b": "&#9821;",
  "R": "&#9814;", "r": "&#9820;",
  "Q": "&#9813;", "q": "&#9819;",
  "K": "&#9812;", "k": "&#9818;",
};

const columnNames = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rowNames = ["1", "2", "3", "4", "5", "6", "7", "8"];

class Board {
  
  constructor(boardId, pocketId, flipped) {
    let el = $(boardId);
    el.addClass("board");
    
    let pEl = $(pocketId);
    pEl.addClass("pocket");
    
    let cellClass = "boardCell";
    if (flipped === true) {
      cellClass += " flipped";
      el.addClass("flipped");
    }
    
    let board = {};
    for (let y=0; y<8; y++) {
      var row = $("<div>").addClass("boardRow");
      el.append(row);
      
      for (let x=0; x<8; x++) {
        let cellName = columnNames[x]+rowNames[flipped?y:7-y];
        let cell = $("<div>").addClass(cellClass+" "+cellName);
        row.append(cell);
        
        board[cellName] = cell;
      }
    }
    
    this.board = board;
    this.boardUI = el;
    this.pocketUI = pEl;
    this.flipped = flipped;
    this.pieces = {};
    this.pocket = {};
    
    this.setupInitial();
  }
  
  cleanBoard() {
    for (let i in this.pieces) {
      let piece = this.pieces[i];
      this.board[piece.position].text("");
    }
    
    for (piece in this.pocket) {
      let piece = this.pocket[i];
      
      piece.ui.detach();
    }
    
    this.pieces = {};
    this.pocket = {};
  }
  
  setupInitial() {
    this.cleanBoard();
    
    this.setPiece("a1",this._makePiece("R"));
    this.setPiece("b1",this._makePiece("N"));
    this.setPiece("c1",this._makePiece("B"));
    this.setPiece("d1",this._makePiece("Q"));
    this.setPiece("e1",this._makePiece("K"));
    this.setPiece("f1",this._makePiece("B"));
    this.setPiece("g1",this._makePiece("N"));
    this.setPiece("h1",this._makePiece("R"));
    
    this.setPiece("a8",this._makePiece("r"));
    this.setPiece("b8",this._makePiece("n"));
    this.setPiece("c8",this._makePiece("b"));
    this.setPiece("d8",this._makePiece("q"));
    this.setPiece("e8",this._makePiece("k"));
    this.setPiece("f8",this._makePiece("b"));
    this.setPiece("g8",this._makePiece("n"));
    this.setPiece("h8",this._makePiece("r"));
    
    for (let cName of columnNames) {
      this.setPiece(cName+"2",this._makePiece("P"));
      this.setPiece(cName+"7",this._makePiece("p"));
    }
  }
  
  setPiece(position, piece) {
    if (piece.position !== null) {
      this.board[piece.position].text("");
    }
    
    piece.position = position;
    this.board[position].html(piece.html);
  }
  
  _makePiece(pieceName) {
    return {
      name: pieceName,
      html: unicode_pieces[pieceName],
      position: null
    };
  }
  
}

function init() {
  boardA = new Board("#boardA", "#pocketA");
  boardB = new Board("#boardB", "#pocketB", true);
}

var ws=null;
function connect() {
  if (ws!==null) {
    return;
  }
  
  ws = new WebSocket("ws://127.0.0.1:80/websocketclient");
}

