import { createApp } from 'vue';
import './assets/styles/main.css';
import App from './App.vue';
import router from './router';
import store from './store';
import api from '@/services/api';
import '@fortawesome/fontawesome-free/css/all.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
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
  faUserShield,
  faCircleNotch,
  faKey,
  faCalendar,
  faComment,
  faDownload,
  faCode,
  faLightbulb,
  faUsers,
  faHourglassStart,
  faCalendarAlt,
  faChartPie,
  faExchangeAlt,
  faRobot,
  faServer,
  faSync,
  faSpinner,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

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
  faUserShield,
  faCircleNotch,
  faKey,
  faCalendar,
  faComment,
  faDownload,
  faCode,
  faLightbulb,
  faUsers,
  faHourglassStart,
  faCalendarAlt,
  faChartPie,
  faExchangeAlt,
  faRobot,
  faServer,
  faSync,
  faSpinner,
  faPlus
);

const app = createApp(App);

app.component('font-awesome-icon', FontAwesomeIcon);
app.use(store);
app.use(router);

if (api.isAuthenticated()) {
    api.checkAuth().catch(error => {
        console.error('Auth check failed:', error);
        // Only clear token, don't force logout
        localStorage.removeItem('token');
    });
}

app.mount('#app');