import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('@/views/UploadView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/process',
      name: 'process',
      component: () => import('@/views/ProcessView.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/manual-fees',
      name: 'manual-fees',
      component: () => import('@/views/ManualFeeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/receipts',
      name: 'receipts',
      component: () => import('@/views/ReceiptsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/charges',
      name: 'charges',
      component: () => import('@/views/ChargesView.vue'),
      meta: { requiresAuth: true }
    },
    // Admin routes
    {
      path: '/admin/promotion',
      name: 'admin-promotion',
      component: () => import('@/views/PromotionView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/equity',
      name: 'admin-equity',
      component: () => import('@/views/EquityTransactionsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/students',
      name: 'students',
      component: () => import('@/views/admin/StudentsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // If not authenticated, try to initialize auth from stored token
    if (!authStore.isAuthenticated) {
      await authStore.initializeAuth()
    }
    
    // If still not authenticated, redirect to login
    if (!authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  // If authenticated and trying to access login, redirect to home
  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'home' })
    return
  }
  
  next()
})

export default router