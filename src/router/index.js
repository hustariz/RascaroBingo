import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/components/app/HomePage.vue'
import BingoPage from '@/components/app/BingoPage.vue'
import ProfilePage from '@/components/app/ProfilePage.vue'
import AnalyticsPage from '@/components/app/AnalyticsPage.vue'
import LoginForm from '@/components/forms/LoginForm.vue'
import LeaderboardPage from '@/components/app/LeaderboardPage.vue'
import ShopPage from '@/components/app/ShopPage.vue'
import AboutPage from '@/components/app/AboutPage.vue'
import PaymentPage from '@/components/app/PaymentPage.vue'
import EmailVerification from '@/components/forms/EmailVerificationForm.vue'
import ResetPassword from '@/components/forms/ResetPasswordForm.vue'
import HyperliquidDashboard from '@/components/hyperliquid/HyperliquidDashboard.vue'

// Auth guard
const authGuard = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    next();
  } else {
    next({ 
      name: 'Home',
      query: { error: 'Please log in to access this page' }
    });
  }
};

// Admin route guard
const adminGuard = async (to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token) {
    next({ 
      name: 'Home', 
      query: { error: 'Please log in to access the admin panel' }
    });
    return;
  }

  try {
    const api = require('@/services/api').default;
    const user = await api.getCurrentUser();
    if (user && user.isAdmin) {
      next();
    } else {
      next({ 
        name: 'Home', 
        query: { error: 'Access denied. Only administrators can access this page.' }
      });
    }
  } catch (error) {
    console.error('Admin guard error:', error);
    next({ 
      name: 'Home', 
      query: { error: 'Authentication error. Please try logging in again.' }
    });
  }
};

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
    meta: { requiresAuth: false }
  },
  { 
    path: '/hyperliquid', 
    name: 'HyperliquidDashboard',
    component: HyperliquidDashboard,
    beforeEnter: authGuard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profile', 
    name: 'Profile',
    component: ProfilePage,
    beforeEnter: authGuard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/analytics', 
    name: 'Analytics',
    component: AnalyticsPage,
    beforeEnter: authGuard,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    props: {
      isOpen: true,
      onClose: () => router.back()
    }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardPage,
  },
  {
    path: '/shop',
    name: 'Shop',
    component: ShopPage
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage
  },
  {
    path: '/payment',
    name: 'Payment',
    component: PaymentPage
  },
  {
    path: '/verify-email/:token',
    name: 'EmailVerification',
    component: EmailVerification
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: () => import('@/components/app/AdminPanel.vue'),
    beforeEnter: [authGuard, adminGuard],
    meta: { requiresAuth: true, requiresAdmin: true }
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
  console.log(' Route navigation:', { to: to.path, requiresAuth: to.meta.requiresAuth })
  
  // Only check auth for routes that explicitly require it
  if (to.meta.requiresAuth === true && !token) {
    console.log(' Auth required, redirecting to home')
    next({ 
      name: 'Home',
      query: { error: 'Please log in to access this page' }
    })
  } else {
    console.log(' Navigation authorized')
    next()
  }
})

export default router