import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'
import VueAsyncComputed from 'vue-async-computed'
import './animate.css'
import '../../static/material-icons/material-icons.css'
import Spinner from 'vue-spinkit'
import SweetModal from 'sweet-modal-vue/src/plugin.js'
import AudioVisual from 'vue-audio-visual/src/index.js'
import VueObserveVibility from 'vue-observe-visibility'

import { ipcRenderer as ipc } from 'electron'

window.onerror = (event, source, lineNo, columnNo, error) => {
  ipc.send('app-error', {
    event,
    source,
    lineNo,
    columnNo,
    error
  })
}

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Vue.use(VueAsyncComputed)
Vue.use(SweetModal)
Vue.component('Spinner', Spinner)
Vue.use(AudioVisual)
Vue.use(VueObserveVibility)

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
