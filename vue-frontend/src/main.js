import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex'

Vue.use(Vuex)

Vue.config.productionTip = false

const store = new Vuex.Store({
  state: {
    ws: new WebSocket("ws://localhost:80/websocketclient"),
    boards: {
      "boardA": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", //currently in fen notation
      "boardB": "RRRRRrr1/3nqpk1/pRRRp2p/Pp1pP1pP/2pP1PN1/2P1QRRR/2PRRRP1/RRRRRRK1 b - f3 0 28"}
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})

store.commit('increment')

console.log(store.state.count) // -> 1


new Vue({
  store,
  render: h => h(App),
}).$mount('#app')