import { createRouter, createWebHistory } from 'vue-router'
import Subscriptions from '../views/Subscriptions.vue'
import Calendar from '../views/Calendar.vue'
import Settings from '../views/Settings.vue'
import Statistics from '../views/Statistics.vue'
import { isAuthenticated } from '../services/auth'

const routes = [
  {
    path: '/',
    name: 'Subscriptions',
    component: Subscriptions,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // If not authenticated, try to authenticate via Telegram
    // The auth will be handled by App.vue
    next()
  } else {
    next()
  }
})

export default router








