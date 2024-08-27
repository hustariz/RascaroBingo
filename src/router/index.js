import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import BingoPage from '../components/BingoPage.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/bingo', component: BingoPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router