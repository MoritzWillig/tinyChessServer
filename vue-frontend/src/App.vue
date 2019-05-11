<template>
  <div id="app">
    <h2>Bughouse Chess Server</h2>
    <GameBoards/>
  </div>
</template>

<script>
import GameBoards from './components/GameBoards.vue'

export default {
  name: 'app',
  components: {
    GameBoards
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
