import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import BingoPage from '../components/BingoPage.vue'
import ProfilePage from '@/components/ProfilePage.vue'
import AnalyticsPage from '@/components/AnalyticsPage.vue'
import LoginForm from '@/components/LoginForm.vue'
import LeaderboardPage from '@/components/LeaderboardPage.vue'
import ShopPage from '@/components/ShopPage.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home',
    component: HomePage 
  },
  { 
    path: '/bingo', 
    name: 'Bingo',
    component: BingoPage,
  },
  { 
    path: '/profile', 
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  },
  { 
    path: '/analytics', 
    name: 'Analytics',
    component: AnalyticsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardPage
  },
  {
    path: '/shop',
    name: 'Shop',
    component: ShopPage
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  console.log('🛣️ Route navigation:', { to: to.path, requiresAuth: to.meta.requiresAuth })
  
  if (to.meta.requiresAuth && !token) {
    console.log('🔒 Auth required, redirecting to login')
    next('/login')
  } else {
    console.log('✅ Navigation authorized')
    next()
  }
})

export default router