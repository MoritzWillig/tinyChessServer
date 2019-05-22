<template>
  <div>
    <div class="option-wrapper" v-if="currentOption">
      <div class="options" v-if="currentOption == 'newGame'">
        <div class="alert-box" v-if="websocketConnection.readyState != 1">Websocket not connected!</div>
        <div class="alert-box">Currently, this is not used / not working</div>
        <input type="text" placeholder="Name@Server" v-model="nameInput"/>
        <a class="button" @click="joinServer">Join</a>
        <a class="button" @click="currentOption = ''">Cancel</a>
      </div>
      <div class="options" v-if="currentOption == 'walkThrough'">
        <div style="margin: 3em">
          <div style="display: inline-block">
            <textarea style="display: block; height: 10em; width: 20em"  v-model="messagesA" placeholder="add multiple commands"></textarea>
            <a class="button" @click="sendCommandA">Send command (A)</a>
          </div>
          <div  style="display: inline-block">
            <textarea  style="display: block; height: 10em; width: 20em" v-model="messagesB" placeholder="add multiple commands"></textarea>
            <a class="button" @click="sendCommandB">Send command (B)</a>
          </div>
        </div>
        <a class="button" @click="currentOption = ''">Cancel</a>
      </div>
      <hr/>
    </div>
    <div class="option-buttons" style="margin-top: 1em">
      <a class="button" @click="newGame">New Game</a>
      <a class="button" @click="currentOption = 'walkThrough'">Walk through</a>
      <!--<a class="button" @click="joinServer">Join Game</a>
      <a class="button disabled">See Websocket Connections</a>-->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentOption: "",
      messagesA: "e2e4 d7d5 e4d5 e7e5 d5e6 f7f5 f1b5 c7c6 g1f3 d8d7 e6d7 e8e7 e1g1 h7h5 d7d8q e7e6 d1e1 e6f7 d8e7 f7g6 e7g5 g6f7 b5c4 c8e6 c4e6 f7e8 b1c3 a7a5 c3b5 f8a3 b2a3 a5a4 b5d6 e8f8 g5d8",
      messagesB: "e2e4 p@f5",
      nameInput: "human@webinterface"
    }
  },
  computed: {
    websocketConnection () {
      return this.$store.state.wsA
    }
  },
  methods: {
    sendCommandA() {
      var first = this.messagesA.split(' ')[0]      
      this.messagesA = this.messagesA.split(' ').slice(1).join(' ')
      this.$store.dispatch('processCommand', ["boardA", first])
    },
    sendCommandB() {
      //this.websocketConnection.send('game_ended')
      var first = this.messagesB.split(' ')[0]      
      this.messagesB = this.messagesB.split(' ').slice(1).join(' ')
      this.$store.dispatch('processCommand', ["boardB", first])
    },
    joinServer() {
      return null
    },
    newGame(){
      this.$store.commit('newGame')
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