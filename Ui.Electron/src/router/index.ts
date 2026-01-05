import { createRouter, createWebHashHistory } from 'vue-router'
import Index from '../pages/index.vue'
import Favorites from '../pages/favorites.vue'
import History from '../pages/history.vue'
import Network from '../pages/network.vue'
import Settings from '../pages/settings.vue'

const routes = [
  { path: '/', component: Index },
  { path: '/favorites', component: Favorites },
  { path: '/history', component: History },
  { path: '/network', component: Network },
  { path: '/settings', component: Settings },
]

const router = createRouter({
  // Use createWebHashHistory for Electron to avoid issues with file:// protocol
  history: createWebHashHistory(),
  routes,
})

export default router
