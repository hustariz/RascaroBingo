import { createApp } from 'vue'
import './assets/styles/main.css'; // Testing Pull Request
import App from './App.vue'
import router from './router'
import store from './store'

const app = createApp(App)
app.use(router)
app.use(store)
store.dispatch('checkAuth')
app.mount('#app')
