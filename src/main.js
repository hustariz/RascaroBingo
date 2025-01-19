import { createApp } from 'vue'
import './assets/styles/main.css';
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faUser, 
  faSignOutAlt, 
  faCheck, 
  faTimes, 
  faEdit, 
  faEnvelope, 
  faPencilAlt, 
  faTrashAlt,
  faCheckCircle,
  faCog, 
  faDice, 
  faChartBar, 
  faTrophy, 
  faStore, 
  faCircleQuestion, 
  faExclamationCircle, 
  faCreditCard, 
  faLock,
  faChartLine,
  faBrain,
  faCrown,
  faUserShield
} from '@fortawesome/free-solid-svg-icons'

import router from './router'
import api from '@/services/api'
import '@fortawesome/fontawesome-free/css/all.css'
import store from './store'

library.add(
  faUser,
  faSignOutAlt,
  faCheck,
  faTimes,
  faEdit,
  faEnvelope,
  faPencilAlt,
  faTrashAlt,
  faCheckCircle,
  faCog,
  faDice,
  faChartBar,
  faTrophy,
  faStore,
  faCircleQuestion,
  faExclamationCircle,
  faCreditCard,
  faLock,
  faChartLine,
  faBrain,
  faCrown,
  faUserShield
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(store)

if (api.isAuthenticated()) {
    api.checkAuth().catch(error => {
        console.error('Auth check failed:', error);
        api.logout();
    });
}

app.mount('#app')