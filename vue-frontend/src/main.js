import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex'

Vue.use(Vuex)

Vue.config.productionTip = false


/* Create Vuex Store */
const store = new Vuex.Store({
  state: {
    ws: new WebSocket("ws://localhost:80/websocketclient"),
    wsEvents: [],
    boards: {
      "boardA": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", //currently in fen notation
      "boardB": "RRRRRrr1/3nqpk1/pRRRp2p/Pp1pP1pP/2pP1PN1/2P1QRRR/2PRRRP1/RRRRRRK1 b - f3 0 28"}
  },
  mutations: {
    addWebsocketEvent (state, event) {
      state.wsEvents.push(event)
    },
    setNewFen(state, event){ // accepts messages of type ['boardA', *fen*]
      state.boards[event[0]] = event[1]
    }
  }
})

store.commit('addWebsocketEvent', {'command': 'xboard', 'function': () => {}})
store.commit('addWebsocketEvent', {'command': 'protover', 'function': () => {
  store.state.ws.send("feature san=1, time=1, variants=\"bughouse\", otherboard=1, colors=1, time=1, done=1");
}})

store.state.ws.onmessage = (event) => {
  let message = event.data;
  
  let idx = message.indexOf(" ");
  let command = (idx!=-1)?message.slice(0, idx):message;
  
  console.log("[server] "+message);

  store.state.wsEvents.forEach(element => {
    if (element.command === command) {
      element.function();
    }
  });
};

console.log(store.state.count) // -> 1


new Vue({
  store,
  render: h => h(App),
}).$mount('#app')