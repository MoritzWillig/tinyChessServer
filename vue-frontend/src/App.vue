<template>
  <div id="app">
    <h2>Bughouse Chess Server</h2>
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
