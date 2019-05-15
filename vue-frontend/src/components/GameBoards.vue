<template>
  <div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[0]" :time="0"/>
      <ChessPocket @selection="selectPocketPiece" class="bottom-margin" color="black" :pieces="pieces"/>
      <div @click="getBoardPos">
        <chessboard @onMove="setNewFen" :fen="boards['boardA']"/>
      </div>
      <ChessPocket/>
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
      pieces: [{'type': 'queen', 'count': 1, 'selected': 'no'}, {'type': 'rook', 'count': 1, 'selected': 'no'}]
    }
  },
  methods: {
    selectPocketPiece(piece){
      this.pieces.forEach(element => {
        if(piece.type === element.type) {
          if (element.selected === 'selected') {
            element.selected = 'no'
          } else {
            element.selected = 'selected'
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
    },
    getBoardPos(event) {
      if (event.explicitOriginalTarget.className === "cg-board") {
        var x = Math.floor(event.layerX / 40);
        var y = Math.floor(event.layerY / 40)
        var oldFen = this.boards['boardA']
        console.log(oldFen)
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

        var newFen = replaceAt(oldFen, stringPos, 'r')

        newFen = newFen.replace(new RegExp('11111111', 'g'), '8');
        newFen = newFen.replace(new RegExp('1111111', 'g'), '7');
        newFen = newFen.replace(new RegExp('111111', 'g'), '6');
        newFen = newFen.replace(new RegExp('11111', 'g'), '5');
        newFen = newFen.replace(new RegExp('1111', 'g'), '4');
        newFen = newFen.replace(new RegExp('111', 'g'), '3');
        newFen = newFen.replace(new RegExp('11', 'g'), '2');
        console.log(newFen)
        this.setNewFen({'fen': newFen})
      }
      else {
        this.deselectPocketPieces();
      }
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
  margin-bottom: 1em;
}
</style>
