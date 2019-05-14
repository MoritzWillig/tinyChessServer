import Vue from 'vue'
import App from './App.vue'
import socketio from 'socket.io-client';
import VueSocketIO from 'vue-socket.io';
import Vuex from 'vuex'

Vue.use(Vuex)

Vue.config.productionTip = false

//const SocketInstance = socketio('/ws/websocketclient');


//Vue.use(VueSocketIO, 'http://localhost:80/websocketclient')


const store = new Vuex.Store({
  state: {
    ws: new WebSocket("ws://localhost:80/websocketclient")
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