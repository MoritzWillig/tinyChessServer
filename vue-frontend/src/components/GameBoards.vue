<template>
  <div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[0]" :time="0"/>
      <ChessPocket class="bottom-margin" color="black" :pieces="pieces"/>
      <chessboard :fen="boards['boardA']"/>
      <ChessPocket/>
      <GameClock align="right" :name="engineNames[1]" :time="250"/>
    </div>
    <div class="chessboard-wrapper">
      <GameClock :name="engineNames[2]" :time="250"/>
      <ChessPocket class="bottom-margin" :pieces="pieces"/>
      <chessboard orientation="black" :fen="boards['boardB']"/>
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
      pieces: ['king']
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
