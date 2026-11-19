import { createRouter, createWebHistory } from 'vue-router'
import { store } from './store'
import { logger } from './log'

const log = logger('router')

export const NAV_KEY = 'substrack:nav'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: () => import('./views/SubscriptionsView.vue'),
  },
  {
    path: '/subscriptions/new',
    name: 'sub-new',
    component: () => import('./views/SubscriptionFormView.vue'),
  },
  {
    path: '/subscriptions/:id(\\d+)/edit',
    name: 'sub-edit',
    component: () => import('./views/SubscriptionFormView.vue'),
  },
  { path: '/calendar', name: 'calendar', component: () => import('./views/CalendarView.vue') },
  { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue') },
  { path: '/stats', name: 'stats', component: () => import('./views/StatsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Restore the last open page on app start (native WebView always boots on
// '/'): the saved route is applied once the store is ready so guards can
// fall back when the target entity no longer exists.
let restored = false

router.beforeEach((to) => {
  if (!restored) {
    restored = true
    const saved = readSavedRoute()
    if (saved && saved !== to.fullPath) {
      log.debug('restoring last route', saved)
      return saved
    }
  }
  // Edit page for a subscription that no longer exists -> back to the list.
  if (to.name === 'sub-edit' && store.ready) {
    const id = Number(to.params.id)
    if (!store.subscriptions.some((s) => s.id === id)) {
      log.debug('nav target subscription missing, falling back to list', id)
      return { name: 'subscriptions' }
    }
  }
  return true
})

router.afterEach((to) => {
  try {
    localStorage.setItem(NAV_KEY, to.fullPath)
  } catch {
    /* storage may be unavailable */
  }
})

function readSavedRoute(): string | null {
  try {
    const v = localStorage.getItem(NAV_KEY)
    return v && v !== '/' ? v : null
  } catch {
    return null
  }
}
