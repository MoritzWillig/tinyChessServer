<template>
  <div>
    <div class="option-wrapper" v-if="currentOption">
      <div class="options">
        <div class="alert-box" v-if="websocketConnection.readyState != 1">Websocket not connected!</div>
        <input type="text" placeholder="Name@Server" v-model="nameInput"/>
        <a class="button" @click="joinServer">Join</a>
        <a class="button" @click="currentOption = ''">Cancel</a>
      </div>
      <hr/>
    </div>
    <div class="option-buttons" style="margin-top: 1em">
      <a class="button" @click="currentOption = 'newGame'">New Game</a>
      <a class="button disabled">Join Game</a>
      <a class="button disabled">See Websocket Connections</a>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentOption: "",
      nameInput: "human@webinterface"
    }
  },
  computed: {
    websocketConnection () {
      return this.$store.state.ws
    }
  },
  methods: {
    joinServer() {
      console.log(this.websocketConnection)
      console.log()
      this.websocketConnection.send('game_ended')
    }
  }
}
</script>

<style scoped>
.option-wrapper {
  background-color: rgb(211, 211, 211);
}
.options {
  padding: 20px;
}
</style>