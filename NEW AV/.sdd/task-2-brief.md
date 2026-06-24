# Task 2: Electron 主进程 + Vue 壳

**Files to create:**
- `electron/main.ts` — Electron 入口，创建窗口
- `electron/preload.ts` — contextBridge 暴露 API
- `src/main.ts` — Vue app 入口
- `src/App.vue` — 主组件（占位）
- `src/router/index.ts` — 路由定义（含所有页面路径）
- `src/vite-env.d.ts` — TypeScript 类型声明

Plus placeholder views (one file each, minimal):
- `src/views/MovieList.vue`
- `src/views/MovieDetail.vue`
- `src/views/ActressList.vue`
- `src/views/ActressDetail.vue`
- `src/views/Favorites.vue`
- `src/views/TagBrowser.vue`
- `src/views/WebsiteList.vue`
- `src/views/AddMovie.vue`
- `src/views/SearchResults.vue`
- `src/views/Settings.vue`

Also create directories: `src/styles/`, `src/stores/`, `src/components/`

## electron/main.ts

```typescript
import { app, BrowserWindow, shell } from 'electron'
import path from 'path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let mainWindow: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#1a1513',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

## electron/preload.ts

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping')
})
```

## src/main.ts

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
```

## src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  api: Record<string, (...args: any[]) => Promise<any>>
}
```

## src/router/index.ts

```typescript
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
```

## src/App.vue

```vue
<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
.app { height: 100vh; background: #1a1513; color: #f0ebe7; }
</style>
```

## Placeholder view example (create for all 10 views)

```vue
<template>
  <div class="placeholder">
    <h2>MovieList</h2>
    <p>Loading...</p>
  </div>
</template>

<style scoped>
.placeholder { padding: 40px; }
.placeholder h2 { color: var(--accent2, #d98e6a); }
</style>
```

Replace "MovieList" with each view's name.

## Working directory

Project at `/c/Users/Administrator/Desktop/CLADUE/NEW AV`. Git root is `/c/Users/Administrator/Desktop/CLADUE`.
