import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/category/all' },
    { path: '/category/:type', name: 'MovieList', component: () => import('@/views/MovieList.vue') },
    { path: '/movie/:id', name: 'MovieDetail', component: () => import('@/views/MovieDetail.vue') },
    { path: '/actresses', name: 'ActressList', component: () => import('@/views/ActressList.vue') },
    { path: '/actress/:id', name: 'ActressDetail', component: () => import('@/views/ActressDetail.vue') },
    { path: '/favorites', name: 'Favorites', component: () => import('@/views/Favorites.vue') },
    { path: '/tags', name: 'TagBrowser', component: () => import('@/views/TagBrowser.vue') },
    { path: '/websites', name: 'WebsiteList', component: () => import('@/views/WebsiteList.vue') },
    { path: '/add', name: 'AddMovie', component: () => import('@/views/AddMovie.vue') },
    { path: '/search', name: 'SearchResults', component: () => import('@/views/SearchResults.vue') },
    { path: '/settings', name: 'Settings', component: () => import('@/views/Settings.vue') }
  ]
})

export default router
