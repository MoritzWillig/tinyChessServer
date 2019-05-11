import Vue from 'vue'
import App from './App.vue'
import VueWebsocket from "vue-websocket";

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

Vue.use(VueWebsocket, "/ws");