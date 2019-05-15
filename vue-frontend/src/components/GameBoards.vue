<template>
  <div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[0]" :time="0"/>
      <ChessPocket :enabled="turnColor === 'black'" @selection="selectPocketPiece" class="bottom-margin" color="black" :pieces="pieces"/>
      <div @click="getBoardPos">
        <chessboard @onMove="setNewFen" :fen="boards['boardA']"/>
      </div>
      <ChessPocket :enabled="turnColor === 'white'" @selection="selectPocketPiece"  :pieces="pieces"/>
      <GameClock align="right" :name="engineNames[1]" :time="250"/>
    </div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[2]" :time="250"/>
      <ChessPocket class="bottom-margin" :pieces="pieces"/>
      <div @click="getBoardPos">
        <chessboard orientation="black" :fen="boards['boardB']"/>
      </div>
      <ChessPocket color="black" :pieces="pieces"/>
      <GameClock align="right" :name="engineNames[3]" :time="250"/>
    </div>
    {{turnColor}}
  </div>
</template>

<script>
import ChessPocket from './ChessPocket'
import GameClock from './GameClock'
import {chessboard} from 'vue-chessboard'
import 'vue-chessboard/dist/vue-chessboard.css'

export default {
  name: 'GameBoards',
  components: {
    chessboard, ChessPocket, GameClock
  },
  computed: {
    boards () {
      return this.$store.state.boards
    },
    turnColor () {
      return this.boards['boardA'].includes(" w ") ? 'white' : 'black';
    }
  },
  props: {
    engineNames: {
      type: Array,
      default: () => ["Engine 1", "Engine 2", "Engine 3", "Engine 4"]
    }
  },
  data () {
    return {
      pieces: [{'type': 'queen', 'count': 1, 'selected': 'no'}, {'type': 'rook', 'count': 1, 'selected': 'no'}, {'type': 'pawn', 'count': 4, 'selected': 'no'}],
      selectedPiece: null
    }
  },
  methods: {
    selectPocketPiece(piece){
      this.pieces.forEach(element => {
        if(piece.type === element.type) {
          if (element.selected === 'selected') {
            element.selected = 'no'
            this.selectedPiece = null
          } else {
            element.selected = 'selected'
            this.selectedPiece = element.type
          }
        } else {
          element.selected = 'no'
        }
      });
    },
    deselectPocketPieces(){
      this.pieces.forEach(element => {
        element.selected = 'no'
      });
      this.selectedPiece = null
    },
    removeFromPocket(type){
      this.pieces.forEach(element => {
        if(type === element.type) {
          if(element.count == 1){
            this.pieces = this.pieces.filter(function(value){
              return value.type !== type;
            });
          } else {
            element.count -= 1;
          }
        }
      });
    },
    getBoardPos(event) {
      if (event.explicitOriginalTarget.className === "cg-board" && this.selectedPiece) {
        var x = Math.floor(event.layerX / 40);
        var y = Math.floor(event.layerY / 40)
        var oldFen = this.boards['boardA']
        var stringPos = y * 9 + x

        var replaceAt = (str, index, replacement) => {
            return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
        }

        oldFen = oldFen.replace(new RegExp('8', 'g'), '11111111');
        oldFen = oldFen.replace(new RegExp('7', 'g'), '1111111');
        oldFen = oldFen.replace(new RegExp('6', 'g'), '111111');
        oldFen = oldFen.replace(new RegExp('5', 'g'), '11111');
        oldFen = oldFen.replace(new RegExp('4', 'g'), '1111');
        oldFen = oldFen.replace(new RegExp('3', 'g'), '111');
        oldFen = oldFen.replace(new RegExp('2', 'g'), '11');

        var newFen = oldFen
        switch (this.selectedPiece) {
          case 'queen':
            newFen = replaceAt(oldFen, stringPos, this.turnColor === 'white' ? 'Q':'q')
            break;
          case 'rook':
            newFen = replaceAt(oldFen, stringPos, this.turnColor === 'white' ? 'R':'r')
            break;
          case 'bishop':
            newFen = replaceAt(oldFen, stringPos, this.turnColor === 'white' ? 'B':'b')
            break;
          case 'knight':
            newFen = replaceAt(oldFen, stringPos, this.turnColor === 'white' ? 'N':'n')
            break;
          case 'pawn':
            newFen = replaceAt(oldFen, stringPos, this.turnColor === 'white' ? 'P':'p')
            break;
          default:
            break;
        }
        this.removeFromPocket(this.selectedPiece)
        this.deselectPocketPieces()
        
        newFen = newFen.replace(new RegExp('11111111', 'g'), '8');
        newFen = newFen.replace(new RegExp('1111111', 'g'), '7');
        newFen = newFen.replace(new RegExp('111111', 'g'), '6');
        newFen = newFen.replace(new RegExp('11111', 'g'), '5');
        newFen = newFen.replace(new RegExp('1111', 'g'), '4');
        newFen = newFen.replace(new RegExp('111', 'g'), '3');
        newFen = newFen.replace(new RegExp('11', 'g'), '2');
        this.setNewFen({'fen': newFen})
        // this.changeTurnColor();
      }
      else {
        this.deselectPocketPieces();
      }
    },
    changeTurnColor () {
        var oldFen = this.boards['boardA']
        console.log(oldFen)
        if (this.turnColor == 'white') {
          oldFen = oldFen.replace(new RegExp(' w ', 'g'), ' b ');
        } else {
          oldFen = oldFen.replace(new RegExp(' b ', 'g'), ' w ');
        }
        console.log(oldFen)
        this.setNewFen({'fen': oldFen})
    },
    setNewFen(event) {
      this.$store.commit('setNewFen', ['boardA', event.fen])
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.chessboard-wrapper {
  display: inline-block;
  margin: 1em 3em;
}
.bottom-margin {
  margin-bottom: 1.5em;
}
</style>
