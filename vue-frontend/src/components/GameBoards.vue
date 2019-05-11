<template>
  <div>
    <div class="chessboard-wrapper">
      <chessboard/>
      <ChessPocket/>
    </div>
    <div class="chessboard-wrapper">
      <chessboard orientation="black"/>
      <ChessPocket color="black" :pieces="pieces"/>
    </div>
  </div>
</template>

<script>
import ChessPocket from './ChessPocket'
import {chessboard} from 'vue-chessboard'
import 'vue-chessboard/dist/vue-chessboard.css'

export default {
  name: 'GameBoards',
  components: {
    chessboard, ChessPocket
  },
  props: {
    msg: String
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
</style>
