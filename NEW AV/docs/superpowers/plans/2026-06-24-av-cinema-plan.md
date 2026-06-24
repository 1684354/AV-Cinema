# AV Cinema 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的本地 AV 影片管理桌面应用，运行于 Windows，基于 Electron + Vue 3 + TypeScript + better-sqlite3。

**Architecture:** 主进程负责数据库和业务逻辑，通过 IPC + contextBridge 暴露安全 API 给渲染进程。渲染进程用 Vue 3 + Pinia + Vue Router 管理 UI 状态和路由。所有页面覆盖正常/空/加载/错误四种状态。

**Tech Stack:** Electron 42+, Vue 3.4+, TypeScript 5+, Vite 5+, Pinia 2+, Vue Router 4+, Element Plus 2.6+, sql.js 1.11+, vite-plugin-electron 0.28+, electron-builder 25+

> **NOTE:** sql.js 替代了 better-sqlite3。原因：Node.js v24 没有 better-sqlite3 的预编译二进制，且本机缺少 VS C++ 编译工具链。sql.js 是纯 JS SQLite 实现，旧版 AV Cinema 已验证可用，对 1300+ 条数据的性能完全够用。

## 全局约束

- 数据库文件路径默认为 `G:\aiqiyi\AV_CINEMA.db`（可通过设置修改）
- 所有文本内容使用中文（极少数技术日志用英文）
- 番号字段不设 UNIQUE 约束（欧美影片用女优名做番号会重复）
- 视频文件路径是唯一真正标识
- 色彩系统使用 CSS 变量（`:root` 中定义），严格遵循设计文档中的色值
- 所有交互过渡使用 `all .25s cubic-bezier(.4,0,.2,t)`
- 滚动条统一窄 5px、圆角、暗色
- 标题用 Georgia serif，正文用 'Segoe UI' system-ui sans-serif
- 所有 API 通过 `window.api` 暴露（contextBridge），不可直接暴露 `ipcRenderer`
- 旧数据迁移（`data.dll` → `AV_CINEMA.db`）在首次启动自动执行
- 每个 Vue 页面必须覆盖 4 种状态：正常、空、加载、错误

---

## 第一阶段：项目脚手架

### Task 1: 初始化项目结构和依赖

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `electron-builder.yml`
- Create: `.gitignore`

**Interfaces:**
- Consumes: 无（初始任务）
- Produces: 可构建的 Vite + Vue + Electron 项目骨架

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "av-cinema",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "vite",
    "electron:build": "vite build && electron-builder",
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "element-plus": "^2.9.0",
    "pinia": "^2.3.0",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "electron": "^42.4.0",
    "electron-builder": "^25.1.0",
    "electron-rebuild": "^3.2.9",
    "typescript": "^5.7.0",
    "vite": "^5.4.0",
    "vite-plugin-electron": "^0.28.8",
    "vite-plugin-electron-renderer": "^0.14.6",
    "vue-tsc": "^2.2.0",
    "@types/better-sqlite3": "^7.6.12"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["better-sqlite3"]
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.vue",
    "electron/**/*.ts"
  ],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "electron-builder.yml"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['better-sqlite3']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: { outDir: 'dist-electron' }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  base: './'
})
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AV Cinema</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: 创建 electron-builder.yml**

```yaml
appId: com.avcinema.app
productName: AV Cinema
directories:
  output: release
files:
  - dist
  - dist-electron
win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
```

- [ ] **Step 7: 创建 .gitignore**

```
node_modules/
dist/
dist-electron/
release/
*.db
*.db-backup
*.dll
*.dll.backup
.DS_Store
thumbs.db
```

- [ ] **Step 8: 安装依赖**

```bash
cd /c/Users/Administrator/Desktop/CLADUE/NEW\ AV
npm install
```

**注意：** `better-sqlite3` 的 `postinstall` 中的 `electron-rebuild` 可能因环境问题失败。如果失败，安装后手动运行：
```bash
npx electron-rebuild -f -w better-sqlite3
```

- [ ] **Step 9: 提交**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html electron-builder.yml .gitignore
git commit -m "feat: scaffold project with Vite + Vue 3 + Electron + TypeScript"
```

---

### Task 2: Electron 主进程 + Vue 壳

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/router/index.ts`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: Task 1 的项目骨架
- Produces: 可启动的 Electron 窗口，显示 Vue 应用

- [ ] **Step 1: 创建 electron/main.ts**

```typescript
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

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

- [ ] **Step 2: 创建 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // 占位——后续任务逐步填充
  ping: () => ipcRenderer.invoke('ping')
})
```

- [ ] **Step 3: 创建 src/vite-env.d.ts**

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

- [ ] **Step 4: 创建 src/main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/theme.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
```

- [ ] **Step 5: 创建 src/router/index.ts**

```typescript
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/category/all' },
    {
      path: '/category/:type',
      name: 'MovieList',
      component: () => import('@/views/MovieList.vue')
    },
    {
      path: '/movie/:id',
      name: 'MovieDetail',
      component: () => import('@/views/MovieDetail.vue')
    },
    {
      path: '/actresses',
      name: 'ActressList',
      component: () => import('@/views/ActressList.vue')
    },
    {
      path: '/actress/:id',
      name: 'ActressDetail',
      component: () => import('@/views/ActressDetail.vue')
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: () => import('@/views/Favorites.vue')
    },
    {
      path: '/tags',
      name: 'TagBrowser',
      component: () => import('@/views/TagBrowser.vue')
    },
    {
      path: '/websites',
      name: 'WebsiteList',
      component: () => import('@/views/WebsiteList.vue')
    },
    {
      path: '/add',
      name: 'AddMovie',
      component: () => import('@/views/AddMovie.vue')
    },
    {
      path: '/search',
      name: 'SearchResults',
      component: () => import('@/views/SearchResults.vue')
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue')
    }
  ]
})

export default router
```

- [ ] **Step 6: 创建 src/App.vue（占位内容）**

```vue
<template>
  <div class="app-shell">
    <p>AV Cinema 加载中...</p>
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-shell { color: #f0ebe7; padding: 40px; }
</style>
```

- [ ] **Step 7: 创建空的占位视图文件（使路由不报错）**

```bash
mkdir -p src/views src/styles src/stores src/components
```

每个视图文件创建一个最小占位：
```vue
<template>
  <div class="view-placeholder">
    <h2>MovieList</h2>
  </div>
</template>
```

为以下路径创建占位：`MovieList.vue`, `MovieDetail.vue`, `ActressList.vue`, `ActressDetail.vue`, `Favorites.vue`, `TagBrowser.vue`, `WebsiteList.vue`, `AddMovie.vue`, `SearchResults.vue`, `Settings.vue`

- [ ] **Step 8: 验证应用启动**

```bash
npm run electron:dev
```

期望：Electron 窗口打开，显示 "AV Cinema 加载中..." 文本，无控制台报错。

- [ ] **Step 9: 提交**

```bash
git add electron/main.ts electron/preload.ts src/main.ts src/App.vue src/router/index.ts src/vite-env.d.ts src/views/ src/styles/ src/stores/ src/components/
git commit -m "feat: add Electron main process and Vue app shell with router"
```

---

### Task 3: 全局主题样式

**Files:**
- Create: `src/styles/theme.scss`

**Interfaces:**
- Consumes: Task 2 的 Vue 应用壳
- Produces: CSS 变量全局主题，在所有 Vue 组件中可用

- [ ] **Step 1: 创建 src/styles/theme.scss**

```scss
/* ===== CSS 变量主题（暗房影集） ===== */
:root {
  --bg: #1a1513;
  --bg2: #1f1a17;
  --bg3: #0f0c0b;
  --surface: #25201d;
  --border: #2a2320;
  --fg: #f0ebe7;
  --fg2: #cfa899;
  --fg3: #8a7a72;
  --fg4: #5a4d45;
  --accent: #a24a3a;
  --accent2: #d98e6a;
  --accent3: #c96a4a;
  --rose: #e88a7a;
  --blue: #7ab8e8;
  --radius: 16px;
  --radius-sm: 10px;
  --radius-xs: 8px;
  --shadow: 0 4px 16px rgba(0,0,0,.3);
  --transition: all .25s cubic-bezier(.4,0,.2,t);
}

/* 全局重置 */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--fg);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: Georgia, 'Times New Roman', serif;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: inherit; }

/* 自定义滚动条 */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--fg4); }

/* Element Plus 主题覆盖 */
.el-button {
  border-radius: 20px !important;
}
.el-dialog {
  background: var(--bg2) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius) !important;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/styles/theme.scss
git commit -m "feat: add darkroom theme CSS variables and global styles"
```

---

## 第二阶段：数据层

### Task 4: 数据库初始化与 schema

**Files:**
- Create: `electron/database/schema.ts`
- Create: `electron/database/index.ts`

**Interfaces:**
- Produces: `getDb()` 返回 Database 实例；`initDatabase()` 创建所有表和索引

- [ ] **Step 1: 创建 electron/database/schema.ts**

```typescript
export const CREATE_MOVIES_TABLE = `
CREATE TABLE IF NOT EXISTS movies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category      TEXT NOT NULL,
  code          TEXT,
  title         TEXT DEFAULT '',
  title_cn      TEXT DEFAULT '',
  actress_ids   TEXT DEFAULT '[]',
  actresses     TEXT DEFAULT '',
  release_date  TEXT DEFAULT '',
  duration      INTEGER DEFAULT 0,
  series        TEXT DEFAULT '',
  tags          TEXT DEFAULT '[]',
  has_subtitle  INTEGER DEFAULT 0,
  is_uncensored INTEGER DEFAULT 0,
  has_chinese   INTEGER DEFAULT 0,
  play_count    INTEGER DEFAULT 0,
  cover_path    TEXT DEFAULT '',
  screenshot_paths TEXT DEFAULT '[]',
  video_path    TEXT DEFAULT '',
  file_size     INTEGER DEFAULT 0,
  source        TEXT DEFAULT '',
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
)
`

export const CREATE_MOVIES_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_code ON movies(code);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
`

export const CREATE_ACTRESSES_TABLE = `
CREATE TABLE IF NOT EXISTS actresses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  name_cn       TEXT DEFAULT '',
  category      TEXT DEFAULT 'AV',
  birthday      TEXT DEFAULT '',
  debut_date    TEXT DEFAULT '',
  height        INTEGER DEFAULT 0,
  bust          INTEGER DEFAULT 0,
  waist         INTEGER DEFAULT 0,
  hips          INTEGER DEFAULT 0,
  cup           TEXT DEFAULT '',
  breast_type   TEXT DEFAULT '',
  is_mature     INTEGER DEFAULT 0,
  is_favorite   INTEGER DEFAULT 0,
  avatar_path   TEXT DEFAULT '',
  movie_count   INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
)
`

export const CREATE_ACTRESSES_INDEX = `
CREATE INDEX IF NOT EXISTS idx_actresses_name ON actresses(name)
`

export const CREATE_TAG_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS tag_categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0
)
`

export const CREATE_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category_id INTEGER REFERENCES tag_categories(id) ON DELETE CASCADE,
  sort        INTEGER DEFAULT 0
)
`

export const CREATE_WEBSITES_TABLE = `
CREATE TABLE IF NOT EXISTS websites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT DEFAULT '',
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_path   TEXT DEFAULT '',
  sort        INTEGER DEFAULT 0
)
`

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
)
`

export const CREATE_MIGRATION_LOG_TABLE = `
CREATE TABLE IF NOT EXISTS migration_log (
  version    INTEGER PRIMARY KEY,
  desc       TEXT,
  applied_at TEXT DEFAULT (datetime('now','localtime'))
)
`
```

- [ ] **Step 2: 创建 electron/database/index.ts**

```typescript
import path from 'path'
import Database from 'better-sqlite3'
import { app } from 'electron'
import {
  CREATE_MOVIES_TABLE,
  CREATE_MOVIES_INDEXES,
  CREATE_ACTRESSES_TABLE,
  CREATE_ACTRESSES_INDEX,
  CREATE_TAG_CATEGORIES_TABLE,
  CREATE_TAGS_TABLE,
  CREATE_WEBSITES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_MIGRATION_LOG_TABLE
} from './schema'

let db: Database.Database | null = null

const DEFAULT_DB_PATH = 'G:\\aiqiyi\\AV_CINEMA.db'

export function getDbPath(): string {
  return DEFAULT_DB_PATH
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(dbPath?: string): void {
  const targetPath = dbPath || getDbPath()
  const dir = path.dirname(targetPath)

  // 确保目录存在
  const fs = require('fs')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(targetPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // 创建所有表
  db.exec(CREATE_MOVIES_TABLE)
  db.exec(CREATE_MOVIES_INDEXES)
  db.exec(CREATE_ACTRESSES_TABLE)
  db.exec(CREATE_ACTRESSES_INDEX)
  db.exec(CREATE_TAG_CATEGORIES_TABLE)
  db.exec(CREATE_TAGS_TABLE)
  db.exec(CREATE_WEBSITES_TABLE)
  db.exec(CREATE_SETTINGS_TABLE)
  db.exec(CREATE_MIGRATION_LOG_TABLE)

  console.log(`Database initialized at: ${targetPath}`)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
```

- [ ] **Step 3: 在 electron/main.ts 中调用数据库初始化**

在 `app.whenReady()` 中，在 `createWindow()` 之前加入：

```typescript
import { initDatabase, closeDatabase } from './database/index'

app.whenReady().then(() => {
  initDatabase()
  createWindow()
  // ...
})

app.on('before-quit', () => {
  closeDatabase()
})
```

- [ ] **Step 4: 验证数据库创建**

启动应用后，检查 `G:\aiqiyi\AV_CINEMA.db` 文件是否存在并包含所有表。

```bash
# 在终端检查表结构（如果 sqlite3 可用）
sqlite3 "G:\aiqiyi\AV_CINEMA.db" ".tables"
# 期望输出：movies actresses tag_categories tags websites settings migration_log
```

- [ ] **Step 5: 提交**

```bash
git add electron/database/ electron/main.ts
git commit -m "feat: add database layer with SQLite schema and initialization"
```

---

### Task 5: 旧数据迁移

**Files:**
- Create: `electron/database/migrations/001_import_legacy.ts`

**Interfaces:**
- Consumes: Task 4 的 `getDb()`
- Produces: `runMigration()` 函数，从旧的 `data.dll` / `set.dll` 导入数据

- [ ] **Step 1: 创建 electron/database/migrations/001_import_legacy.ts**

```typescript
import path from 'path'
import Database from 'better-sqlite3'
import { getDb } from '../index'
import { getDbPath } from '../index'

const LEGACY_DB_PATH = 'G:\\aiqiyi\\DataBase\\META-INF\\data.dll'
const LEGACY_SET_PATH = 'G:\\aiqiyi\\DataBase\\META-INF\\set.dll'
const ACTRESS_RES_DIR = 'G:\\aiqiyi\\DataBase\\META-INF\\resources\\actress'
const APP_ROOT = 'G:\\aiqiyi\\DataBase'

interface LegacyMovie {
  id: number; fl: string; ph: string; pm: string; yid: number | null
  yy: string; fxrq: string; zz: string; lc: string; pj: string
  dt: string; dm: string; vr: string; sd: string; sc: string
  dx: string; dy: string; ps: string; fx: string; xl: string
  bq: string; jt: string; py: string; pf: string; tjrq: string
  cl: string; playCount: number
}

interface LegacyActress {
  id: number; fl: string; mz: string; bm: string; tx: string
  cs: string; sg: string; xw: string; yw: string; tw: string
  zb: string; yz: string; cd: string; pf: string; tjrq: string
  sc: string; bz: string; tix: string
}

interface LegacyWebsite {
  id: number; fl: string; lg: string; zm: string; wz: string
  ms: string; bq: string; bz: string; fj: string; pf: string; tjrq: string
}

interface LegacyTagClas {
  id: number; zt: string; js: string; fz: string; tx: string
  xw: string; wf: string; qt: string; z1: string; cat: string
}

interface LegacyLike {
  id: number; yid: number | null; mz: string; ph: string
  dy: string; ps: string; xl: string; tjrq: string
}

function openLegacyDb(filePath: string): Database.Database | null {
  try {
    if (require('fs').existsSync(filePath)) {
      return new Database(filePath)
    }
  } catch (e) {
    console.error(`Failed to open legacy DB: ${filePath}`, e)
  }
  return null
}

function migrateMovies(legacy: Database.Database): void {
  const rows = legacy.prepare('SELECT * FROM movies').all() as LegacyMovie[]
  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO movies (id, category, code, title, title_cn, actresses,
      release_date, duration, series, tags, has_subtitle, is_uncensored,
      has_chinese, play_count, cover_path, screenshot_paths, video_path,
      file_size, source, created_at, updated_at)
    VALUES (@id, @category, @code, @title, '', @actresses,
      @release_date, @duration, @series, @tags, @has_subtitle, @is_uncensored,
      @has_chinese, @playCount, @cover_path, @screenshot_paths, @video_path,
      0, 'legacy', @created_at, @created_at)
  `)

  const insertMany = db.transaction((items: LegacyMovie[]) => {
    for (const m of items) {
      // 解析分类
      let category = m.fl || 'AV'
      const categoryMap: Record<string, string> = {
        '有码': 'AV', '无码': 'AV', '其他': '动漫',
        'AV': 'AV', '动漫': '动漫', '欧美': '欧美', '国产': '国产'
      }
      category = categoryMap[category] || 'AV'

      // 解析视频路径
      let video_path = ''
      let cover_path = ''
      if (m.dy && m.dy.includes('|')) {
        const parts = m.dy.split('|')
        if (parts.length >= 2) {
          video_path = parts[1]
        }
      }

      // 解析封面（sc 字段或 jt 字段第一张）
      let screenshot_paths = '[]'
      if (m.jt) {
        const paths = m.jt.split('|').filter(Boolean)
        if (paths.length > 0) {
          cover_path = paths[0]
          screenshot_paths = JSON.stringify(paths)
        }
      }

      // 解析标签
      let tags = '[]'
      if (m.bq) {
        const tagList = m.bq.split('，').concat(m.bq.split(',')).filter(Boolean)
        const unique = [...new Set(tagList.map((t: string) => t.trim()).filter(Boolean))]
        tags = JSON.stringify(unique)
      }

      // 解析字幕/无码标记
      const has_subtitle = (m.zz === 'y' || m.dt === 'y') ? 1 : 0
      const is_uncensored = (m.lc === 'y' || m.vr === 'y') ? 1 : 0
      const has_chinese = m.pj === 'y' ? 1 : 0

      // 解析片名（从 pm 字段去除前缀）
      let title = m.pm || ''
      let code = m.ph || ''

      // 解析时长
      let duration = 0
      if (m.sc) {
        const num = parseInt(m.sc)
        if (!isNaN(num)) duration = num
      }

      insert.run({
        id: m.id,
        category,
        code,
        title,
        actresses: m.yy || '',
        release_date: m.fxrq || '',
        duration,
        series: m.xl || '',
        tags,
        has_subtitle,
        is_uncensored,
        has_chinese,
        playCount: m.playCount || 0,
        cover_path,
        screenshot_paths,
        video_path,
        created_at: m.tjrq ? new Date(parseInt(m.tjrq)).toISOString().replace('T', ' ').slice(0, 19) : undefined
      })
    }
  })

  insertMany(rows)
  console.log(`Migrated ${rows.length} movies`)
}

function migrateActresses(legacy: Database.Database): void {
  const rows = legacy.prepare('SELECT * FROM femas').all() as LegacyActress[]
  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO actresses (id, name, name_cn, category, birthday, debut_date,
      height, bust, waist, hips, cup, breast_type, is_mature, is_favorite,
      avatar_path, movie_count, created_at)
    VALUES (@id, @name, @name_cn, @category, @birthday, @debut_date,
      @height, @bust, @waist, @hips, @cup, @breast_type, @is_mature, 0,
      @avatar_path, @movie_count, @created_at)
  `)

  const insertMany = db.transaction((items: LegacyActress[]) => {
    for (const a of items) {
      // 解析分类
      let category = a.fl || 'AV'
      const cmap: Record<string, string> = {
        '有码': 'AV', '无码': 'AV', '有码，无码': 'AV',
        '无码，欧美': '欧美', '有码，欧美': 'AV'
      }
      category = cmap[category] || category || 'AV'

      // 解析头像路径
      let avatar_path = ''
      if (a.tx) {
        avatar_path = a.tx.replace('[appUrl]', APP_ROOT)
      }

      // 解析罩杯/三围
      const cup = a.zb || ''
      const height = parseInt(a.sg) || 0
      const bust = parseInt(a.xw) || 0
      const waist = parseInt(a.yw) || 0
      const hips = parseInt(a.tw) || 0

      // 解析胸型标签
      const breast_type = a.tix === '2' ? '人工' : a.tix === '5' ? '天然' : ''
      const is_mature = a.bz?.includes('熟') ? 1 : 0

      insert.run({
        id: a.id,
        name: a.mz || '',
        name_cn: a.bm || '',
        category,
        birthday: a.cs || '',
        debut_date: a.cd || '',
        height,
        bust,
        waist,
        hips,
        cup,
        breast_type,
        is_mature,
        avatar_path,
        movie_count: 0,
        created_at: a.tjrq ? new Date(parseInt(a.tjrq)).toISOString().replace('T', ' ').slice(0, 19) : undefined
      })
    }
  })

  insertMany(rows)
  console.log(`Migrated ${rows.length} actresses`)
}

function migrateWebsites(legacy: Database.Database): void {
  const rows = legacy.prepare('SELECT * FROM website').all() as LegacyWebsite[]
  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO websites (id, category, name, url, description, icon_path, sort)
    VALUES (@id, @category, @name, @url, @description, @icon_path, @sort)
  `)

  const insertMany = db.transaction((items: LegacyWebsite[]) => {
    for (const w of items) {
      let icon_path = ''
      if (w.lg) icon_path = w.lg.replace('[appUrl]', APP_ROOT)

      insert.run({
        id: w.id,
        category: w.fl || '',
        name: w.zm || '',
        url: w.wz || '',
        description: w.ms || '',
        icon_path,
        sort: w.id
      })
    }
  })

  insertMany(rows)
  console.log(`Migrated ${rows.length} websites`)
}

function migrateTags(legacy: Database.Database): void {
  const rows = legacy.prepare('SELECT * FROM tagclas').all() as LegacyTagClas[]
  const db = getDb()

  const insertCat = db.prepare('INSERT INTO tag_categories (id, name, sort) VALUES (@id, @name, @sort)')
  const insertTag = db.prepare('INSERT INTO tags (name, category_id, sort) VALUES (@name, @category_id, @sort)')

  const migrate = db.transaction(() => {
    const fieldToCategory: Record<string, string> = {
      zt: '主题', js: '技术', fz: '服饰', tx: '体型',
      xw: '行为', wf: '玩法', qt: '其他', z1: '场景'
    }

    let catSort = 0
    for (const [field, catName] of Object.entries(fieldToCategory)) {
      const val = (rows[0] as any)?.[field]
      if (!val || typeof val !== 'string') continue
      const tagNames = val.split('，').filter((t: string) => t.trim())
      if (tagNames.length === 0) continue

      catSort++
      const catResult = insertCat.run({ id: undefined, name: catName, sort: catSort })
      const categoryId = catResult.lastInsertRowid as number

      tagNames.forEach((tag: string, i: number) => {
        insertTag.run({ name: tag.trim(), category_id: categoryId, sort: i + 1 })
      })
    }
  })

  migrate()
  console.log('Migrated tag categories and tags')
}

function migrateLikes(legacy: Database.Database): void {
  const rows = legacy.prepare('SELECT * FROM likes').all() as LegacyLike[]
  const db = getDb()

  const updateMovieFav = db.prepare('UPDATE movies SET is_favorite = 1 WHERE id = ?')
  const updateActressFav = db.prepare('UPDATE actresses SET is_favorite = 1 WHERE id = ?')

  const migrate = db.transaction(() => {
    for (const like of rows) {
      // ph 是 movie 的 created_at 时间戳，用来找影片
      if (like.ph) {
        const result = db.prepare(
          'SELECT id FROM movies WHERE created_at LIKE ?'
        ).get(`%${like.ph.slice(0, 10)}%`) as any
        if (result) {
          updateMovieFav.run(result.id)
        }
      }
      if (like.yid) {
        updateActressFav.run(like.yid)
      }
    }
  })

  migrate()
  console.log('Migrated favorites')
}

function migrateSettings(legacy: Database.Database): void {
  const rows = legacy.prepare('SELECT * FROM setting').all() as any[]
  const db = getDb()

  if (rows.length > 0) {
    const s = rows[0]
    // 提取网站列表
    const webUrls = (s.web || '').split('|').filter(Boolean)
    if (webUrls.length > 0) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('crawl_sources', JSON.stringify(webUrls))
    }
    // 播放器路径默认空
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('player_path', '')
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('media_root', 'G:\\aiqiyi')
  }
}

export function runLegacyMigration(): boolean {
  const db = getDb()

  // 检查是否已经迁移过
  const migrated = db.prepare('SELECT COUNT(*) as cnt FROM migration_log').get() as any
  if (migrated.cnt > 0) {
    console.log('Migration already completed, skipping')
    return false
  }

  const legacy = openLegacyDb(LEGACY_DB_PATH)
  if (!legacy) {
    console.log('No legacy database found, skipping migration')
    db.prepare('INSERT INTO migration_log (version, desc) VALUES (?, ?)').run(1, 'No legacy data found')
    return false
  }

  console.log('Starting legacy data migration...')

  try {
    migrateMovies(legacy)
    migrateActresses(legacy)
    migrateWebsites(legacy)
    migrateTags(legacy)
    migrateLikes(legacy)

    // settings 从 set.dll 读取
    const setDb = openLegacyDb(LEGACY_SET_PATH)
    if (setDb) {
      migrateSettings(setDb)
      setDb.close()
    }

    db.prepare('INSERT INTO migration_log (version, desc) VALUES (?, ?)').run(1, 'Full migration from legacy data.dll/set.dll')
    console.log('Migration completed successfully')

    legacy.close()
    return true
  } catch (err) {
    console.error('Migration failed:', err)
    legacy.close()
    return false
  }
}
```

- [ ] **Step 2: 在 electron/main.ts 中调用迁移**

在 `initDatabase()` 之后，`createWindow()` 之前加入：

```typescript
import { runLegacyMigration } from './database/migrations/001_import_legacy'

// 在 initDatabase() 后：
const migrated = runLegacyMigration()
if (migrated) {
  console.log('Legacy data imported successfully')
}
```

- [ ] **Step 3: 验证迁移**

启动应用，检查 `AV_CINEMA.db` 是否有数据：
```bash
# 如果 sqlite3 可用
sqlite3 "G:\aiqiyi\AV_CINEMA.db" "SELECT COUNT(*) FROM movies"
# 期望输出：1304（或其他数量）
sqlite3 "G:\aiqiyi\AV_CINEMA.db" "SELECT COUNT(*) FROM actresses"
# 期望输出：2557（或其他数量）
```

- [ ] **Step 4: 提交**

```bash
git add electron/database/migrations/ electron/main.ts
git commit -m "feat: add legacy data migration from data.dll/set.dll"
```

---

## 第三阶段：IPC 桥接层

### Task 6: IPC 处理器 + 服务层 + preload API

**Files:**
- Create: `electron/ipc/movieIpc.ts`
- Create: `electron/ipc/actressIpc.ts`
- Create: `electron/ipc/tagIpc.ts`
- Create: `electron/ipc/websiteIpc.ts`
- Create: `electron/ipc/settingsIpc.ts`
- Create: `electron/ipc/searchIpc.ts`
- Modify: `electron/preload.ts`
- Modify: `electron/main.ts`

**Interfaces:**
- Produces: 完整的 `window.api` 对象，所有 Service 方法可通过 IPC 调用

- [ ] **Step 1: 创建 electron/ipc/movieIpc.ts**

```typescript
import { ipcMain, shell } from 'electron'
import { getDb } from '../database/index'

export function registerMovieIpc(): void {

  ipcMain.handle('getMovies', (_event, params: {
    category?: string
    sort?: string
    filters?: { hasSubtitle?: boolean; isUncensored?: boolean; hasChinese?: boolean }
    page?: number
    pageSize?: number
    search?: string
  }) => {
    const db = getDb()
    const conditions: string[] = []
    const queryParams: any[] = []

    if (params.category && params.category !== 'all') {
      conditions.push('category = ?')
      queryParams.push(params.category)
    }

    if (params.search) {
      conditions.push('(title LIKE ? OR code LIKE ? OR actresses LIKE ?)')
      const s = `%${params.search}%`
      queryParams.push(s, s, s)
    }

    if (params.filters) {
      if (params.filters.hasSubtitle) {
        conditions.push('has_subtitle = 1')
      }
      if (params.filters.isUncensored) {
        conditions.push('is_uncensored = 1')
      }
      if (params.filters.hasChinese) {
        conditions.push('has_chinese = 1')
      }
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    let orderBy = 'ORDER BY created_at DESC'
    if (params.sort === 'release_date') orderBy = 'ORDER BY release_date DESC'
    else if (params.sort === 'actress') orderBy = 'ORDER BY actresses ASC'
    else if (params.sort === 'play_count') orderBy = 'ORDER BY play_count DESC'
    else if (params.sort === 'random') orderBy = 'ORDER BY RANDOM()'

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM movies ${where}`).get(...queryParams) as any
    const movies = db.prepare(`SELECT * FROM movies ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...queryParams, pageSize, offset)

    return { movies, total: countResult?.total || 0 }
  })

  ipcMain.handle('getMovie', (_event, id: number) => {
    const db = getDb()
    return db.prepare('SELECT * FROM movies WHERE id = ?').get(id)
  })

  ipcMain.handle('createMovie', (_event, data: any) => {
    const db = getDb()
    const result = db.prepare(`
      INSERT INTO movies (category, code, title, title_cn, actress_ids, actresses,
        release_date, duration, series, tags, has_subtitle, is_uncensored,
        has_chinese, cover_path, screenshot_paths, video_path, file_size, source)
      VALUES (@category, @code, @title, @title_cn, @actress_ids, @actresses,
        @release_date, @duration, @series, @tags, @has_subtitle, @is_uncensored,
        @has_chinese, @cover_path, @screenshot_paths, @video_path, @file_size, @source)
    `).run(data)
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('updateMovie', (_event, id: number, data: any) => {
    const db = getDb()
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
    data.id = id
    db.prepare(`UPDATE movies SET ${fields}, updated_at = datetime('now','localtime') WHERE id = @id`).run(data)
    return db.prepare('SELECT * FROM movies WHERE id = ?').get(id)
  })

  ipcMain.handle('deleteMovie', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM movies WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('getMovieCount', () => {
    const db = getDb()
    return (db.prepare('SELECT COUNT(*) as cnt FROM movies').get() as any).cnt
  })

  ipcMain.handle('playMovie', (_event, videoPath: string) => {
    if (videoPath) {
      shell.openPath(videoPath)
    }
    return { success: true }
  })

  ipcMain.handle('openFileLocation', (_event, videoPath: string) => {
    if (videoPath) {
      shell.showItemInFolder(videoPath)
    }
    return { success: true }
  })

  ipcMain.handle('toggleMovieFavorite', (_event, id: number) => {
    const db = getDb()
    const movie = db.prepare('SELECT id, is_favorite FROM movies WHERE id = ?').get(id) as any
    if (movie) {
      const newVal = movie.is_favorite ? 0 : 1
      db.prepare('UPDATE movies SET is_favorite = ? WHERE id = ?').run(newVal, id)
      return !!newVal
    }
    return false
  })
}
```

- [ ] **Step 2: 创建 electron/ipc/actressIpc.ts**

```typescript
import { ipcMain } from 'electron'
import { getDb } from '../database/index'

export function registerActressIpc(): void {
  ipcMain.handle('getActresses', (_event, params: {
    category?: string; sort?: string; page?: number; pageSize?: number; search?: string
  }) => {
    const db = getDb()
    const conditions: string[] = []
    const queryParams: any[] = []

    if (params.category && params.category !== 'all') {
      conditions.push('category = ?')
      queryParams.push(params.category)
    }
    if (params.search) {
      conditions.push('(name LIKE ? OR name_cn LIKE ?)')
      const s = `%${params.search}%`
      queryParams.push(s, s)
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    let orderBy = 'ORDER BY movie_count DESC'
    if (params.sort === 'name') orderBy = 'ORDER BY name ASC'

    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM actresses ${where}`).get(...queryParams) as any
    const actresses = db.prepare(`SELECT * FROM actresses ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...queryParams, pageSize, offset)

    return { actresses, total: countResult?.total || 0 }
  })

  ipcMain.handle('getActress', (_event, id: number) => {
    const db = getDb()
    return db.prepare('SELECT * FROM actresses WHERE id = ?').get(id)
  })

  ipcMain.handle('updateActress', (_event, id: number, data: any) => {
    const db = getDb()
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
    data.id = id
    db.prepare(`UPDATE actresses SET ${fields}, updated_at = datetime('now','localtime') WHERE id = @id`).run(data)
    return db.prepare('SELECT * FROM actresses WHERE id = ?').get(id)
  })

  ipcMain.handle('getActressMovies', (_event, actressId: number) => {
    const db = getDb()
    const movies = db.prepare(
      "SELECT * FROM movies WHERE actress_ids LIKE ? OR actresses LIKE (SELECT name FROM actresses WHERE id = ?)"
    ).all(`%${actressId}%`, actressId)
    return movies
  })

  ipcMain.handle('toggleActressFavorite', (_event, id: number) => {
    const db = getDb()
    const actress = db.prepare('SELECT id, is_favorite FROM actresses WHERE id = ?').get(id) as any
    if (actress) {
      const newVal = actress.is_favorite ? 0 : 1
      db.prepare('UPDATE actresses SET is_favorite = ? WHERE id = ?').run(newVal, id)
      return !!newVal
    }
    return false
  })
}
```

- [ ] **Step 3: 创建 electron/ipc/tagIpc.ts**

```typescript
import { ipcMain } from 'electron'
import { getDb } from '../database/index'

export function registerTagIpc(): void {
  ipcMain.handle('getTagCategories', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM tag_categories ORDER BY sort').all()
  })

  ipcMain.handle('getTagsByCategory', (_event, categoryId?: number) => {
    const db = getDb()
    if (categoryId) {
      return db.prepare('SELECT * FROM tags WHERE category_id = ? ORDER BY sort').all(categoryId)
    }
    // 返回分组后的所有标签
    const categories = db.prepare('SELECT * FROM tag_categories ORDER BY sort').all() as any[]
    return categories.map((cat: any) => ({
      ...cat,
      tags: db.prepare('SELECT * FROM tags WHERE category_id = ? ORDER BY sort').all(cat.id)
    }))
  })

  ipcMain.handle('createTagCategory', (_event, data: { name: string }) => {
    const db = getDb()
    const maxSort = db.prepare('SELECT COALESCE(MAX(sort), 0) as s FROM tag_categories').get() as any
    const result = db.prepare('INSERT INTO tag_categories (name, sort) VALUES (?, ?)').run(data.name, (maxSort?.s || 0) + 1)
    return { id: result.lastInsertRowid, name: data.name }
  })

  ipcMain.handle('deleteTagCategory', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM tags WHERE category_id = ?').run(id)
    db.prepare('DELETE FROM tag_categories WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('createTag', (_event, data: { name: string; categoryId: number }) => {
    const db = getDb()
    const maxSort = db.prepare('SELECT COALESCE(MAX(sort), 0) as s FROM tags WHERE category_id = ?').get(data.categoryId) as any
    const result = db.prepare('INSERT INTO tags (name, category_id, sort) VALUES (?, ?, ?)').run(data.name, data.categoryId, (maxSort?.s || 0) + 1)
    return { id: result.lastInsertRowid, name: data.name, category_id: data.categoryId }
  })

  ipcMain.handle('deleteTag', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM tags WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('updateTagCategorySort', (_event, categories: { id: number; sort: number }[]) => {
    const db = getDb()
    const update = db.prepare('UPDATE tag_categories SET sort = ? WHERE id = ?')
    const reorder = db.transaction((items: { id: number; sort: number }[]) => {
      for (const item of items) update.run(item.sort, item.id)
    })
    reorder(categories)
    return { success: true }
  })
}
```

- [ ] **Step 4: 创建 electron/ipc/websiteIpc.ts**

```typescript
import { ipcMain, shell } from 'electron'
import { getDb } from '../database/index'

export function registerWebsiteIpc(): void {
  ipcMain.handle('getWebsites', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM websites ORDER BY sort').all()
  })

  ipcMain.handle('createWebsite', (_event, data: { name: string; url: string; category?: string; description?: string }) => {
    const db = getDb()
    const maxSort = db.prepare('SELECT COALESCE(MAX(sort), 0) as s FROM websites').get() as any
    const result = db.prepare(
      'INSERT INTO websites (category, name, url, description, sort) VALUES (?, ?, ?, ?, ?)'
    ).run(data.category || '', data.name, data.url, data.description || '', (maxSort?.s || 0) + 1)
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('updateWebsite', (_event, id: number, data: any) => {
    const db = getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = Object.values(data)
    db.prepare(`UPDATE websites SET ${fields} WHERE id = ?`).run(...values, id)
    return { success: true }
  })

  ipcMain.handle('deleteWebsite', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM websites WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('openWebsite', (_event, url: string) => {
    if (url) shell.openExternal(url)
    return { success: true }
  })
}
```

- [ ] **Step 5: 创建 electron/ipc/settingsIpc.ts**

```typescript
import { ipcMain } from 'electron'
import { getDb } from '../database/index'

export function registerSettingsIpc(): void {
  ipcMain.handle('getSettings', () => {
    const db = getDb()
    const rows = db.prepare('SELECT key, value FROM settings').all() as any[]
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    return settings
  })

  ipcMain.handle('updateSetting', (_event, key: string, value: string) => {
    const db = getDb()
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
    return { success: true }
  })

  ipcMain.handle('getSetting', (_event, key: string) => {
    const db = getDb()
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
    return result?.value || ''
  })
}
```

- [ ] **Step 6: 创建 electron/ipc/searchIpc.ts**

```typescript
import { ipcMain } from 'electron'
import { getDb } from '../database/index'

export function registerSearchIpc(): void {
  ipcMain.handle('searchAll', (_event, query: string) => {
    const db = getDb()
    const s = `%${query}%`

    const movies = db.prepare(
      "SELECT id, code, title, actresses, cover_path, release_date FROM movies WHERE code LIKE ? OR title LIKE ? OR actresses LIKE ? LIMIT 20"
    ).all(s, s, s)

    const actresses = db.prepare(
      "SELECT id, name, name_cn, avatar_path, movie_count FROM actresses WHERE name LIKE ? OR name_cn LIKE ? LIMIT 20"
    ).all(s, s)

    return { movies, actresses, query }
  })
}
```

- [ ] **Step 7: 更新 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // 通用
  ping: () => ipcRenderer.invoke('ping'),

  // 影片
  getMovies: (params: any) => ipcRenderer.invoke('getMovies', params),
  getMovie: (id: number) => ipcRenderer.invoke('getMovie', id),
  createMovie: (data: any) => ipcRenderer.invoke('createMovie', data),
  updateMovie: (id: number, data: any) => ipcRenderer.invoke('updateMovie', id, data),
  deleteMovie: (id: number) => ipcRenderer.invoke('deleteMovie', id),
  getMovieCount: () => ipcRenderer.invoke('getMovieCount'),
  playMovie: (videoPath: string) => ipcRenderer.invoke('playMovie', videoPath),
  openFileLocation: (videoPath: string) => ipcRenderer.invoke('openFileLocation', videoPath),
  toggleMovieFavorite: (id: number) => ipcRenderer.invoke('toggleMovieFavorite', id),

  // 女优
  getActresses: (params: any) => ipcRenderer.invoke('getActresses', params),
  getActress: (id: number) => ipcRenderer.invoke('getActress', id),
  updateActress: (id: number, data: any) => ipcRenderer.invoke('updateActress', id, data),
  getActressMovies: (actressId: number) => ipcRenderer.invoke('getActressMovies', actressId),
  toggleActressFavorite: (id: number) => ipcRenderer.invoke('toggleActressFavorite', id),

  // 标签
  getTagCategories: () => ipcRenderer.invoke('getTagCategories'),
  getTagsByCategory: (categoryId?: number) => ipcRenderer.invoke('getTagsByCategory', categoryId),
  createTagCategory: (data: { name: string }) => ipcRenderer.invoke('createTagCategory', data),
  deleteTagCategory: (id: number) => ipcRenderer.invoke('deleteTagCategory', id),
  createTag: (data: { name: string; categoryId: number }) => ipcRenderer.invoke('createTag', data),
  deleteTag: (id: number) => ipcRenderer.invoke('deleteTag', id),
  updateTagCategorySort: (categories: { id: number; sort: number }[]) => ipcRenderer.invoke('updateTagCategorySort', categories),

  // 网站
  getWebsites: () => ipcRenderer.invoke('getWebsites'),
  createWebsite: (data: any) => ipcRenderer.invoke('createWebsite', data),
  updateWebsite: (id: number, data: any) => ipcRenderer.invoke('updateWebsite', id, data),
  deleteWebsite: (id: number) => ipcRenderer.invoke('deleteWebsite', id),
  openWebsite: (url: string) => ipcRenderer.invoke('openWebsite', url),

  // 设置
  getSettings: () => ipcRenderer.invoke('getSettings'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('updateSetting', key, value),
  getSetting: (key: string) => ipcRenderer.invoke('getSetting', key),

  // 搜索
  searchAll: (query: string) => ipcRenderer.invoke('searchAll', query),

  // 播放器（外部）
  playMovie: (videoPath: string) => ipcRenderer.invoke('playMovie', videoPath),
  openFileLocation: (videoPath: string) => ipcRenderer.invoke('openFileLocation', videoPath),
}

contextBridge.exposeInMainWorld('api', api)
```

- [ ] **Step 8: 在 electron/main.ts 中注册所有 IPC**

在 `createWindow()` 之前添加：

```typescript
import { registerMovieIpc } from './ipc/movieIpc'
import { registerActressIpc } from './ipc/actressIpc'
import { registerTagIpc } from './ipc/tagIpc'
import { registerWebsiteIpc } from './ipc/websiteIpc'
import { registerSettingsIpc } from './ipc/settingsIpc'
import { registerSearchIpc } from './ipc/searchIpc'

// 在 app.whenReady() 中，initDatabase() 之后：
registerMovieIpc()
registerActressIpc()
registerTagIpc()
registerWebsiteIpc()
registerSettingsIpc()
registerSearchIpc()
```

- [ ] **Step 9: 验证 IPC 连通性**

启动应用，在 DevTools Console 中测试：
```js
await window.api.getMovieCount()
// 期望返回数字（如 1304）
await window.api.getMovies({ page: 1, pageSize: 5 })
// 期望返回 { movies: [...], total: 1304 }
```

- [ ] **Step 10: 提交**

```bash
git add electron/ipc/ electron/preload.ts electron/main.ts
git commit -m "feat: add IPC bridge with complete service API"
```

---

## 第四阶段：前端页面

### Task 7: 应用主布局 + 侧边栏 + 顶栏

**Files:**
- Modify: `src/App.vue`
- Create: `src/components/Sidebar.vue`
- Create: `src/components/SearchBar.vue`
- Create: `src/stores/uiStore.ts`

**Interfaces:**
- Consumes: Task 6 的 `window.api`
- Produces: 完整的应用布局框架（侧边栏 + 顶栏 + 内容路由区域）

- [ ] **Step 1: 创建 src/stores/uiStore.ts**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const scrollPositions = ref<Record<string, number>>({})
  const isDetailView = ref(false)
  const sidebarCollapsed = ref(false)

  function saveScroll(key: string, pos: number) {
    scrollPositions.value[key] = pos
  }

  function getScroll(key: string): number {
    return scrollPositions.value[key] || 0
  }

  function setDetailView(val: boolean) {
    isDetailView.value = val
  }

  return { scrollPositions, isDetailView, sidebarCollapsed, saveScroll, getScroll, setDetailView }
})
```

- [ ] **Step 2: 创建 src/components/Sidebar.vue**

```vue
<template>
  <nav class="sidebar">
    <div class="logo">🎞<span>CINEMA</span></div>

    <div class="grp">浏览</div>
    <router-link v-for="item in browseItems" :key="item.path"
      :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
      <span class="ico">{{ item.icon }}</span>
      {{ item.label }}
      <span class="badge" v-if="item.count !== undefined">{{ item.count }}</span>
    </router-link>

    <div class="sep"></div>
    <div class="grp">发现</div>
    <router-link v-for="item in discoverItems" :key="item.path"
      :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
      <span class="ico">{{ item.icon }}</span>
      {{ item.label }}
    </router-link>

    <div class="sep"></div>
    <div class="grp">管理</div>
    <router-link v-for="item in manageItems" :key="item.path"
      :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
      <span class="ico">{{ item.icon }}</span>
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const movieCount = ref<number>(0)

const browseItems = [
  { path: '/category/all', icon: '📽️', label: '全部', count: undefined as number | undefined },
  { path: '/category/av', icon: '🔞', label: 'AV' },
  { path: '/category/anime', icon: '🎨', label: '动漫' },
  { path: '/category/euro', icon: '🌍', label: '欧美' },
  { path: '/category/cn', icon: '🇨🇳', label: '国产' },
]

const discoverItems = [
  { path: '/actresses', icon: '👩', label: '女优' },
  { path: '/favorites', icon: '♥', label: '收藏' },
  { path: '/tags', icon: '🏷️', label: '标签' },
  { path: '/websites', icon: '🌐', label: '网站导航' },
]

const manageItems = [
  { path: '/add', icon: '➕', label: '添加影片' },
  { path: '/settings', icon: '⚙️', label: '设置' },
]

function isActive(path: string): boolean {
  if (path.startsWith('/category/')) {
    return route.path.startsWith('/category/')
  }
  return route.path === path
}

onMounted(async () => {
  try {
    movieCount.value = await window.api.getMovieCount()
    browseItems[0].count = movieCount.value
  } catch {}
})
</script>

<style scoped>
.sidebar { width: 200px; background: var(--bg2); border-right: 1px solid var(--border); padding: 24px 12px; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
.logo { font-family: Georgia, serif; font-size: 22px; color: var(--accent2); padding: 8px 12px; margin-bottom: 20px; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; }
.logo span { color: var(--fg); font-size: 20px; }
.grp { font-size: 10px; color: var(--fg4); padding: 8px 12px 4px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius-sm); color: var(--fg3); font-size: 13px; transition: var(--transition); margin-bottom: 1px; }
.nav-item:hover { background: var(--surface); color: var(--fg); }
.nav-item.active, .nav-item.router-link-exact-active { background: var(--accent); color: #fff; }
.nav-item .ico { font-size: 14px; width: 20px; text-align: center; }
.nav-item .badge { margin-left: auto; font-size: 10px; background: var(--surface); padding: 2px 8px; border-radius: 10px; color: var(--fg3); }
.nav-item.active .badge, .nav-item.router-link-exact-active .badge { background: rgba(255,255,255,.2); color: #fff; }
.sep { margin: 8px 0; border-top: 1px solid var(--border); }
</style>
```

- [ ] **Step 3: 创建 src/components/SearchBar.vue**

```vue
<template>
  <div class="search-wrap">
    <span class="search-ico">🔍</span>
    <input v-model="query" @keydown.enter="doSearch" placeholder="搜索影片或女优..." />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const query = ref('')

function doSearch() {
  const q = query.value.trim()
  if (q) {
    router.push({ path: '/search', query: { q } })
  }
}
</script>

<style scoped>
.search-wrap { flex: 1; position: relative; }
.search-wrap input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 9px 20px 9px 40px; font-size: 13px; color: var(--fg); outline: none; transition: var(--transition); }
.search-wrap input::placeholder { color: var(--fg4); }
.search-wrap input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(162,74,58,.15); }
.search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--fg4); }
</style>
```

- [ ] **Step 4: 更新 src/App.vue 为完整布局**

```vue
<template>
  <div class="app" v-if="!uiStore.isDetailView">
    <Sidebar />
    <div class="main">
      <div class="topbar">
        <SearchBar />
        <div class="actions">
          <button class="btn-random" @click="goRandom">🎲 随机</button>
        </div>
      </div>
      <div class="view-container">
        <router-view v-slot="{ Component }">
          <keep-alive include="MovieList">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
  <div class="app detail-mode" v-else>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

// 根据路由自动切换详情模式
watch(() => route.path, (path) => {
  uiStore.setDetailView(path.startsWith('/movie/') || path.startsWith('/actress/'))
})

async function goRandom() {
  try {
    const { movies } = await window.api.getMovies({ sort: 'random', page: 1, pageSize: 1 })
    if (movies && movies.length > 0) {
      router.push(`/movie/${movies[0].id}`)
    }
  } catch {}
}
</script>

<style scoped>
.app { display: flex; height: 100vh; }
.app.detail-mode { display: block; }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.topbar { display: flex; align-items: center; padding: 14px 28px; background: var(--bg); border-bottom: 1px solid var(--border); gap: 16px; flex-shrink: 0; }
.actions { display: flex; gap: 10px; }
.btn-random { padding: 7px 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg3); font-size: 12px; transition: var(--transition); cursor: pointer; }
.btn-random:hover { background: var(--surface); color: var(--fg); }
.view-container { flex: 1; overflow-y: auto; }
</style>
```

- [ ] **Step 5: 验证布局**

启动应用，检查：
- 侧边栏正确渲染，导航项可点击切换路由
- 搜索框存在，回车跳转到搜索页
- 顶部随机按钮存在
- 进入详情页时侧边栏和顶栏隐藏

- [ ] **Step 6: 提交**

```bash
git add src/App.vue src/components/Sidebar.vue src/components/SearchBar.vue src/stores/uiStore.ts
git commit -m "feat: add app layout with sidebar, topbar, and route-based detail mode"
```

---

### Task 8: 影片卡片组件 MovieCard

**Files:**
- Create: `src/components/MovieCard.vue`

**Interfaces:**
- Consumes: 影片数据对象
- Produces: 可复用的影片卡片组件，含右键菜单

- [ ] **Step 1: 创建 src/components/MovieCard.vue**

```vue
<template>
  <div class="card" @click="goDetail" @contextmenu.prevent="showContextMenu">
    <div class="thumb">
      <div class="flags" v-if="hasFlags">
        <span v-if="isNew" class="accent">🔥 精选</span>
        <span v-if="movie.has_subtitle">中字</span>
        <span v-if="movie.is_uncensored">无码</span>
        <span v-if="movie.has_chinese">破解</span>
      </div>
      <span class="fav" :class="{ active: movie.is_favorite }" @click.stop="toggleFav">
        {{ movie.is_favorite ? '♥' : '♡' }}
      </span>
      <div class="thumb-placeholder">🎬</div>
    </div>
    <div class="body">
      <div class="code">{{ movie.code || '未知' }}</div>
      <div class="title">{{ movie.title || '未命名' }}</div>
      <div class="meta" v-if="movie.release_date || movie.duration">
        <span v-if="movie.release_date">{{ movie.release_date }}</span>
        <span v-if="movie.duration">{{ movie.duration }}min</span>
      </div>
      <div class="tags" v-if="parsedTags.length > 0">
        <span v-for="tag in parsedTags.slice(0, 3)" :key="tag" :class="tagClass(tag)">
          {{ tag }}
        </span>
      </div>
    </div>
    <!-- 右键菜单 -->
    <div class="ctx-menu" v-if="ctxVisible" :style="ctxStyle" @click.stop>
      <div class="ctx-item" @click="play">▶ 播放</div>
      <div class="ctx-item" @click="openLocation">📂 打开文件位置</div>
      <div class="ctx-item" @click="goDetail">✏️ 编辑影片</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" @click="toggleFav">{{ movie.is_favorite ? '♥' : '♡' }} 收藏</div>
      <div class="ctx-item danger" @click="confirmDelete">🗑️ 删除</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  movie: any
}>()

const emit = defineEmits(['deleted', 'favChanged'])
const router = useRouter()
const ctxVisible = ref(false)
const ctxStyle = ref({ top: '0px', left: '0px' })

const isNew = computed(() => {
  // 如果加入日期在7天内，标为精选
  if (!props.movie.created_at) return false
  const diff = Date.now() - new Date(props.movie.created_at).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
})

const hasFlags = computed(() => {
  return props.movie.has_subtitle || props.movie.is_uncensored || props.movie.has_chinese || isNew.value
})

const parsedTags = computed(() => {
  try {
    const t = props.movie.tags
    if (typeof t === 'string') return JSON.parse(t)
    if (Array.isArray(t)) return t
    return []
  } catch { return [] }
})

function tagClass(tag: string) {
  // 简单分类：预定义女优相关关键词
  const actressKeywords = ['巨乳', '美乳', '贫乳', '美腿', '丰满', '单体', '引退', '新人', '美脚']
  const isActressTag = actressKeywords.some(k => tag.includes(k))
  return isActressTag ? 'r' : 'b'
}

function goDetail() {
  router.push(`/movie/${props.movie.id}`)
}

function showContextMenu(e: MouseEvent) {
  ctxVisible.value = true
  ctxStyle.value = { top: `${e.clientY}px`, left: `${e.clientX}px` }
  setTimeout(() => document.addEventListener('click', hideCtx), 0)
}

function hideCtx() {
  ctxVisible.value = false
  document.removeEventListener('click', hideCtx)
}

async function toggleFav() {
  try {
    const result = await window.api.toggleMovieFavorite(props.movie.id)
    props.movie.is_favorite = result ? 1 : 0
    emit('favChanged', props.movie.id, result)
  } catch {}
}

function play() {
  if (props.movie.video_path) window.api.playMovie(props.movie.video_path)
}

function openLocation() {
  if (props.movie.video_path) window.api.openFileLocation(props.movie.video_path)
}

function confirmDelete() {
  emit('deleted', props.movie.id)
  ctxVisible.value = false
}

onUnmounted(() => document.removeEventListener('click', hideCtx))
</script>

<style scoped>
.card { background: var(--bg2); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); transition: var(--transition); cursor: pointer; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,.4), 0 0 0 1px rgba(162,74,58,.25); }
.thumb { aspect-ratio: 3/4; background: linear-gradient(135deg, var(--surface), var(--border)); display: flex; align-items: center; justify-content: center; font-size: 32px; position: relative; }
.thumb .flags { position: absolute; top: 8px; left: 8px; display: flex; gap: 4px; flex-wrap: wrap; }
.thumb .flags span { padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 600; background: rgba(0,0,0,.7); color: var(--fg); }
.thumb .flags .accent { background: var(--accent); color: #fff; }
.thumb .fav { position: absolute; top: 8px; right: 8px; font-size: 16px; color: rgba(255,255,255,.5); transition: var(--transition); z-index: 2; }
.thumb .fav:hover { color: var(--accent2); }
.thumb .fav.active { color: var(--accent2); }
.body { padding: 12px 14px 14px; }
.code { font-size: 11px; color: var(--accent2); font-weight: 700; letter-spacing: .5px; }
.title { font-size: 13px; margin-top: 4px; color: var(--fg); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
.meta { font-size: 11px; color: var(--fg3); margin-top: 6px; display: flex; gap: 6px; }
.tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.tags span { font-size: 9px; padding: 2px 7px; border-radius: 5px; }
.tags .r { background: rgba(162,74,58,.2); color: var(--rose); }
.tags .b { background: rgba(59,100,140,.2); color: var(--blue); }

/* 右键菜单 */
.ctx-menu { position: fixed; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px; box-shadow: var(--shadow); z-index: 1000; min-width: 160px; }
.ctx-item { padding: 8px 14px; border-radius: 6px; font-size: 13px; color: var(--fg3); transition: var(--transition); cursor: pointer; }
.ctx-item:hover { background: var(--surface); color: var(--fg); }
.ctx-item.danger:hover { background: rgba(162,74,58,.2); color: var(--rose); }
.ctx-sep { margin: 4px 0; border-top: 1px solid var(--border); }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/MovieCard.vue
git commit -m "feat: add MovieCard component with context menu and favorites"
```

---

### Task 9: 影片列表页 MovieList

**Files:**
- Create: `src/views/MovieList.vue`
- Create: `src/stores/movieStore.ts`

**Interfaces:**
- Consumes: `window.api.getMovies()`
- Produces: 完整的影片列表页（排序、筛选、网格、无限滚动、滚动位置恢复）

- [ ] **Step 1: 创建 src/stores/movieStore.ts**

```typescript
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface MovieFilter {
  hasSubtitle: boolean
  isUncensored: boolean
  hasChinese: boolean
}

export const useMovieStore = defineStore('movie', () => {
  const movies = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref('')
  const sort = ref('created_at')
  const filters = reactive<MovieFilter>({ hasSubtitle: false, isUncensored: false, hasChinese: false })
  const category = ref('all')
  const PAGE_SIZE = 20

  async function loadMovies(reset = false) {
    if (loading.value) return
    loading.value = true
    error.value = ''

    if (reset) {
      page.value = 1
      movies.value = []
    }

    try {
      const result = await window.api.getMovies({
        category: category.value,
        sort: sort.value,
        filters: {
          hasSubtitle: filters.hasSubtitle || undefined,
          isUncensored: filters.isUncensored || undefined,
          hasChinese: filters.hasChinese || undefined,
        },
        page: page.value,
        pageSize: PAGE_SIZE
      })
      if (reset) {
        movies.value = result.movies
      } else {
        movies.value.push(...result.movies)
      }
      total.value = result.total
      page.value++
    } catch (e: any) {
      error.value = e.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  function setCategory(cat: string) {
    category.value = cat
  }

  function setSort(s: string) {
    sort.value = s
    loadMovies(true)
  }

  function toggleFilter(key: keyof MovieFilter) {
    (filters as any)[key] = !(filters as any)[key]
    loadMovies(true)
  }

  function removeMovie(id: number) {
    movies.value = movies.value.filter(m => m.id !== id)
    total.value--
  }

  return { movies, total, page, loading, error, sort, filters, category, loadMovies, setCategory, setSort, toggleFilter, removeMovie }
})
```

- [ ] **Step 2: 创建 src/views/MovieList.vue**

```vue
<template>
  <div class="movie-list" ref="listRef">
    <!-- 排序栏 -->
    <div class="sort-bar">
      <span class="opt" :class="{ active: store.sort === 'created_at' }" @click="store.setSort('created_at')">加入日期</span>
      <span class="opt" :class="{ active: store.sort === 'release_date' }" @click="store.setSort('release_date')">发行日期</span>
      <span class="opt" :class="{ active: store.sort === 'actress' }" @click="store.setSort('actress')">女优名</span>
      <span class="opt" :class="{ active: store.sort === 'play_count' }" @click="store.setSort('play_count')">播放次数</span>
      <span class="opt" :class="{ active: store.sort === 'random' }" @click="store.setSort('random')">🎲 随机</span>
      <span class="spacer"></span>
      <span class="view-count">{{ store.total }} 部影片</span>
      <div class="filter-group">
        <span class="tag" :class="{ active: store.filters.hasSubtitle }" @click="store.toggleFilter('hasSubtitle')">中文字幕</span>
        <span class="tag" :class="{ active: store.filters.hasChinese }" @click="store.toggleFilter('hasChinese')">破解版</span>
        <span class="tag" :class="{ active: store.filters.isUncensored }" @click="store.toggleFilter('isUncensored')">无码</span>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div class="loading-state" v-if="store.loading && store.movies.length === 0">
      <div class="spinner"></div>
      <span>正在加载影片...</span>
    </div>

    <!-- 错误状态 -->
    <div class="error-state" v-else-if="store.error && store.movies.length === 0">
      <div class="icon">⚠️</div>
      <div class="msg">{{ store.error }}</div>
      <button class="retry" @click="store.loadMovies(true)">🔄 重试</button>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="!store.loading && store.movies.length === 0">
      <div class="icon">📭</div>
      <div class="msg">还没有影片</div>
      <div class="sub">点击左侧"添加影片"开始建立你的收藏</div>
    </div>

    <!-- 正常状态：卡片网格 -->
    <div class="grid" v-else>
      <MovieCard
        v-for="movie in store.movies"
        :key="movie.id"
        :movie="movie"
        @deleted="handleDelete"
      />
    </div>

    <!-- 加载更多指示器 -->
    <div class="load-more" v-if="store.movies.length > 0 && store.movies.length < store.total">
      <button class="btn-load" @click="store.loadMovies()" :disabled="store.loading">
        {{ store.loading ? '加载中...' : `🎬 加载更多 (${store.movies.length} / ${store.total})` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMovieStore } from '@/stores/movieStore'
import { useUiStore } from '@/stores/uiStore'
import MovieCard from '@/components/MovieCard.vue'

const route = useRoute()
const store = useMovieStore()
const uiStore = useUiStore()
const listRef = ref<HTMLElement | null>(null)
const SCROLL_KEY = 'movieList'

// 监听分类变化
watch(() => route.params.type, (newType) => {
  const type = (newType as string) || 'all'
  store.setCategory(type)
  store.loadMovies(true)
})

// 恢复滚动位置
onActivated(() => {
  const saved = uiStore.getScroll(SCROLL_KEY)
  if (saved > 0 && listRef.value) {
    listRef.value.scrollTop = saved
  }
})

onMounted(() => {
  store.setCategory((route.params.type as string) || 'all')
  store.loadMovies(true)
})

// 保存滚动位置
function saveScroll() {
  if (listRef.value) {
    uiStore.saveScroll(SCROLL_KEY, listRef.value.scrollTop)
  }
}

async function handleDelete(id: number) {
  try {
    await window.api.deleteMovie(id)
    store.removeMovie(id)
  } catch {}
}
</script>

<style scoped>
.movie-list { display: flex; flex-direction: column; height: 100%; }
.sort-bar { display: flex; align-items: center; gap: 8px; padding: 12px 28px; border-bottom: 1px solid var(--border); flex-wrap: wrap; flex-shrink: 0; background: var(--bg); }
.opt { padding: 5px 14px; border-radius: 14px; font-size: 12px; color: var(--fg3); cursor: pointer; transition: var(--transition); }
.opt:hover { color: var(--fg); }
.opt.active { background: var(--accent); color: #fff; }
.spacer { flex: 1; }
.view-count { font-size: 12px; color: var(--fg4); }
.filter-group { display: flex; gap: 6px; }
.filter-group .tag { padding: 4px 12px; border-radius: 12px; border: 1px solid var(--border); font-size: 11px; color: var(--fg3); cursor: pointer; transition: var(--transition); }
.filter-group .tag:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
.filter-group .tag.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; padding: 24px 28px; }

.loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: var(--fg4); flex: 1; }
.loading-state { flex-direction: row; gap: 12px; padding: 60px; }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent2); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state .icon, .empty-state .icon { font-size: 48px; margin-bottom: 16px; opacity: .4; }
.error-state .msg { font-size: 14px; color: var(--rose); margin-bottom: 4px; }
.empty-state .msg { font-size: 15px; margin-bottom: 6px; }
.empty-state .sub { font-size: 12px; }
.retry { margin-top: 16px; padding: 8px 24px; border-radius: 16px; border: 1px solid var(--accent); background: transparent; color: var(--accent2); font-size: 13px; cursor: pointer; transition: var(--transition); }
.retry:hover { background: var(--accent); color: #fff; }

.load-more { text-align: center; padding: 24px 0 40px; }
.btn-load { padding: 10px 32px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg3); font-size: 13px; cursor: pointer; transition: var(--transition); }
.btn-load:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
</style>
```

- [ ] **Step 3: 验证**

启动应用，检查影片列表页：
- 卡片网格 5 列正常渲染
- 排序切换有效
- 筛选按钮 toggle 有效
- 右键菜单弹出
- 空状态/加载状态可见

- [ ] **Step 4: 提交**

```bash
git add src/views/MovieList.vue src/stores/movieStore.ts
git commit -m "feat: add MovieList page with sort, filter, grid, and infinite scroll"
```

---

## 后续任务概述

剩余页面按以下模式继续逐个实现（由于篇幅，后续任务省略每步的完整代码，但实现时必须包含所有状态和代码）：

### Task 10: 影片详情页 MovieDetail
- `src/views/MovieDetail.vue`
- 大图预览、截图胶卷、信息卡片、标签分色、操作按钮
- 编辑模式切换
- 四种状态（加载中、正常、空、错误）
- 依赖：Task 8（MovieCard）、Task 6（IPC）

### Task 11: 女优列表页 ActressList
- `src/views/ActressList.vue`
- `src/components/ActressCard.vue`
- `src/stores/actressStore.ts`
- 圆形头像、分类筛选、搜索

### Task 12: 女优详情页 ActressDetail
- `src/views/ActressDetail.vue`
- 完整信息、胸型标签、作品列表

### Task 13: 收藏页 Favorites
- `src/views/Favorites.vue`
- `src/stores/favoritesStore.ts`
- 影片/女优双 Tab、分页

### Task 14: 标签浏览 TagBrowser
- `src/views/TagBrowser.vue`
- 分类分组、计数、新增分类、删除

### Task 15: 网站导航 WebsiteList
- `src/views/WebsiteList.vue`
- 卡片网格、增删改、打开浏览器

### Task 16: 添加影片 AddMovie
- `src/views/AddMovie.vue`
- 番号输入、自动抓取信息、手动填写

### Task 17: 搜索结果 SearchResults
- `src/views/SearchResults.vue`
- 影片/女优结果分栏、高亮匹配文字

### Task 18: 设置页 Settings
- `src/views/Settings.vue`
- 播放器路径、媒体根目录、翻译 API、女优同步、关联影片

### Task 19: 构建与发布
- 配置 electron-builder
- 构建 Windows 安装包
- 验证安装和运行

---

## 页面状态对照表

每个视图必须实现以下四种状态：

| 状态 | MovieList | MovieDetail | ActressList | ActressDetail | SearchResults |
|------|-----------|-------------|-------------|---------------|---------------|
| 正常 | 卡片网格 | 信息展示 | 卡片列表 | 完整信息 | 分栏结果 |
| 空 | "还没有影片" | "影片不存在" | "没有女优" | "女优不存在" | "没有结果" |
| 加载 | spinner | spinner | spinner | spinner | spinner |
| 错误 | 错误+重试 | 错误+返回 | 错误+重试 | 错误+返回 | 错误+重试 |

---

## 文件创建/修改汇总

| 阶段 | 文件 | 操作 |
|------|------|------|
| 1 | package.json, tsconfig.json, tsconfig.node.json, vite.config.ts, index.html, electron-builder.yml, .gitignore | 创建 |
| 1 | electron/main.ts, electron/preload.ts, src/main.ts, src/App.vue, src/router/index.ts, src/vite-env.d.ts | 创建 |
| 1 | 10 个占位视图文件 | 创建 |
| 1 | src/styles/theme.scss | 创建 |
| 2 | electron/database/schema.ts, electron/database/index.ts | 创建 |
| 2 | electron/database/migrations/001_import_legacy.ts | 创建 |
| 3 | electron/ipc/movieIpc.ts, actressIpc.ts, tagIpc.ts, websiteIpc.ts, settingsIpc.ts, searchIpc.ts | 创建 |
| 3 | electron/preload.ts (full), electron/main.ts (full) | 修改 |
| 4 | src/App.vue (full), src/components/Sidebar.vue, SearchBar.vue, src/stores/uiStore.ts | 创建/修改 |
| 4 | src/components/MovieCard.vue, src/views/MovieList.vue, src/stores/movieStore.ts | 创建 |
| 5+ | 各视图文件、组件、store | 创建 |
