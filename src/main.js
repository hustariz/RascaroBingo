import { createApp } from 'vue'
import './assets/styles/main.css';
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faSignOutAlt, faCog, faDice, faEnvelope, faChartBar } from '@fortawesome/free-solid-svg-icons'
import router from './router'
import store from './store'

library.add(faUser, faSignOutAlt, faCog, faDice, faEnvelope, faChartBar)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(store)
store.dispatch('checkAuth')
app.mount('#app')
