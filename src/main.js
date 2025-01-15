import { createApp } from 'vue'
import './assets/styles/main.css';
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faSignOutAlt, faCog, faDice, faEnvelope, faChartBar, faTrophy, faStore, faCircleQuestion, faExclamationCircle, faCreditCard, faLock } from '@fortawesome/free-solid-svg-icons'
import router from './router'
import api from '@/services/api'
import '@fortawesome/fontawesome-free/css/all.css'
import store from './store'

library.add(faUser, faSignOutAlt, faCog, faDice, faEnvelope, faChartBar, faTrophy, faStore, faCircleQuestion, faExclamationCircle, faCreditCard, faLock)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(store)
app.use(router)

if (api.isAuthenticated()) {
    api.checkAuth().catch(error => {
        console.error('Auth check failed:', error);
        api.logout();
    });
}

app.mount('#app')