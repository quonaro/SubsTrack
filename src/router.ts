import { createRouter, createWebHistory } from 'vue-router'
import { logger } from './log'

const log = logger('router')

export const NAV_KEY = 'substrack:nav'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomePage.vue') },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: () => import('./views/SubscriptionsPage.vue'),
  },
  // Creation and editing happen in modals on the pages themselves; keep the
  // old paths as redirects so a saved route from a previous build still
  // lands somewhere sensible.
  { path: '/subscriptions/new', redirect: { name: 'subscriptions' } },
  { path: '/subscriptions/:id(\\d+)/edit', redirect: { name: 'subscriptions' } },
  { path: '/calendar', name: 'calendar', component: () => import('./views/CalendarPage.vue') },
  { path: '/history', name: 'history', component: () => import('./views/HistoryPage.vue') },
  { path: '/stats', name: 'stats', component: () => import('./views/StatsPage.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/SettingsPage.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// Display order for the page-slide direction in App.vue: the bottom-nav
// tabs in order, with /history right after home since it's pushed from there.
export const ROUTE_ORDER = ['/', '/history', '/subscriptions', '/calendar', '/stats', '/settings']

export function slideDirection(toPath: string, fromPath: string): 'fwd' | 'back' {
  const to = ROUTE_ORDER.indexOf(toPath)
  const from = ROUTE_ORDER.indexOf(fromPath)
  return to >= 0 && from >= 0 && to < from ? 'back' : 'fwd'
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Restore the last open page on app start (native WebView always boots on
// '/'): the saved route is applied once, on the first navigation.
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
