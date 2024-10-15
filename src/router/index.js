import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import BingoPage from '../components/BingoPage.vue'
import ProfilePage from '@/components/ProfilePage.vue'
import AnalyticsPage from '@/components/AnalyticsPage.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/bingo', component: BingoPage },
  { path: '/profile', component: ProfilePage},
  { path: '/Analytics', component: AnalyticsPage}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router