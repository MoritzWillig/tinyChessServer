<template>
  <div id="app">
    <h2>Bughouse Chess Server</h2>
    <div v-if="status === 'preparing0'">Waiting...</div>
    <div v-if="status === 'preparing1'">1 Client connected</div>
    <div v-if="status === 'preparing2'">2 Clients connected</div>
    <div v-if="status === 'preparing3'">3 Clients connected</div>
    <div v-if="status === 'ready'" style="margin: 1em">ready <a class="button" @click="startGame">Go!</a></div>
    <div v-if="status === 'in_prograss'">Game in progress!</div>
    <hr>
    <GameBoards/>
    <hr style="margin-bottom: 0em">
    <OptionMenu/>
  </div>
</template>

<script>
import GameBoards from "./components/GameBoards.vue";
import OptionMenu from "./components/OptionMenu.vue";

export default {
  name: "app",
  components: {
    GameBoards,
    OptionMenu
  },
  computed: {
    status () {
      return this.$store.state.status
    }
  },
  methods: {
    startGame() {
      this.$store.state.wsA.send("go")
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  font-variant: small-caps;
}
.button {
  background-color: rgb(71, 71, 71);
  border: 1px solid grey;
  border-radius: 5px;
  margin: 5px;
  padding: 7px;
  color: white;
  cursor: pointer;
}

.button.disabled {
  background-color: rgb(190, 190, 190);
  border: 1px solid rgb(202, 202, 202);
  cursor: default;
}

.alert-box {
  background-color: yellow;
  border: 2px solid black;
  border-radius: 5px;
  margin: 1em;
  padding: 1em;
}
</style>
