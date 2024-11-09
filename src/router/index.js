import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import BingoPage from '../components/BingoPage.vue'
import ProfilePage from '@/components/ProfilePage.vue'
import AnalyticsPage from '@/components/AnalyticsPage.vue'
import LoginForm from '@/components/LoginForm.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home',
    component: HomePage 
  },
  { 
    path: '/bingo', 
    name: 'Bingo',
    component: BingoPage
    // Remove meta: { requiresAuth: true }
  },
  { 
    path: '/profile', 
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true } // Keep auth for profile
  },
  { 
    path: '/analytics', 
    name: 'Analytics',
    component: AnalyticsPage,
    meta: { requiresAuth: true } // Keep auth for analytics
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router