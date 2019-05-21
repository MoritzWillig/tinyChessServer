<template>
  <div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[0]" :time="0" :on-move="turnColor == 'black'"/>
      <ChessPocket :enabled="turnColor === 'black'" :selected-piece="turnColor === 'black' ? selectedPockedPiece['boardA'] : ''" @selection="selectPocketPiece" class="bottom-margin" color="black" :pieces="pockets['boardA']['black']"/>
      <div @click="getBoardPos">
        <chessboard @onMove="setNewFen" :fen="boards['boardA']"/>
      </div>
      <ChessPocket :enabled="turnColor === 'white'" :selected-piece="turnColor === 'white' ? selectedPockedPiece['boardA'] : ''" @selection="selectPocketPiece"  :pieces="pockets['boardA']['white']"/>
      <GameClock align="right" :name="engineNames[1]" :time="250" :on-move="turnColor == 'white'"/>
    </div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[2]" :time="250" :on-move="turnColorB == 'white'"/>
      <ChessPocket class="bottom-margin" :pieces="pockets['boardB']['white']"/>
      <div @click="getBoardPos">
        <chessboard @onMove="setNewFenB" orientation="black" :fen="boards['boardB']"/>
      </div>
      <ChessPocket color="black" :pieces="pockets['boardB']['black']"/>
      <GameClock align="right" :name="engineNames[3]" :time="250" :on-move="turnColorB == 'black'"/>
    </div>
  </div>
</template>

<script>
import ChessPocket from './ChessPocket'
import GameClock from './GameClock'
import {chessboard} from 'vue-chessboard'
import 'vue-chessboard/dist/vue-chessboard.css'
import Vue from 'vue'

export default {
  name: 'GameBoards',
  components: {
    chessboard, ChessPocket, GameClock
  },
  computed: {
    boards () {
      return this.$store.state.boards
    },
    pockets () {
      return this.$store.state.pockets
    },
    selectedPockedPiece() {
      return this.$store.state.selectedPockedPiece
    },
    turnColor () {
      return this.$store.getters.currentTurnColor('boardA')
    },
    turnColorB () {
      return this.$store.getters.currentTurnColor('boardB')
    }
  },
  props: {
    engineNames: {
      type: Array,
      default: () => ["Engine 1", "Engine 2", "Engine 3", "Engine 4"]
    }
  },
  methods: {
    selectPocketPiece(piece){
      this.$store.commit('selectPocketPiece', ['boardA', piece.type])
    },
    deselectPocketPieces(){
      this.$store.commit('selectPocketPiece', ['boardA', ''])
    },
    getBoardPos(event) {
      if (event.explicitOriginalTarget.className === "cg-board" && this.selectedPockedPiece['boardA'] !== '') {
        
        // get click field
        var x = Math.floor(event.layerX / 40);
        var y = Math.floor(event.layerY / 40)
        var stringPos = y * 9 + x

        var pieceCode = Vue.methds.pieceTypeToShort(this.selectedPockedPiece['boardA'])

        pieceCode = this.turnColor === 'white' ? pieceCode.toUpperCase() : pieceCode

        this.$store.dispatch('insertPieceAtPosition', ['boardA', pieceCode, stringPos])
      }
      else {
        this.deselectPocketPieces();
      }
    },
    setNewFen(event) {
      this.$store.commit('setNewFen', ['boardA', event.fen])
    },
    setNewFenB(event) {
      this.$store.commit('setNewFen', ['boardB', event.fen])
    }
  }
}
</script>

<style scoped>
.chessboard-wrapper {
  display: inline-block;
  margin: 1em 3em;
}
.bottom-margin {
  margin-bottom: 1.5em;
}
</style>
