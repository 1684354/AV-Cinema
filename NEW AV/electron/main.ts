import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, closeDatabase } from './database/index'
import { registerMovieIpc } from './ipc/movieIpc'
import { registerActressIpc } from './ipc/actressIpc'
import { registerTagIpc } from './ipc/tagIpc'
import { registerWebsiteIpc } from './ipc/websiteIpc'
import { registerSettingsIpc } from './ipc/settingsIpc'
import { registerSearchIpc } from './ipc/searchIpc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    backgroundColor: '#f5f0eb',
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

app.whenReady().then(async () => {
  await initDatabase()

  // Run legacy data migration (non-blocking for UI)
  try {
    const { runLegacyMigration } = await import('./database/migrations/001_import_legacy')
    await runLegacyMigration()
  } catch (err) {
    console.warn('[Main] Legacy migration skipped or failed:', (err as Error).message)
  }

  // Register IPC handlers
  registerMovieIpc()
  registerActressIpc()
  registerTagIpc()
  registerWebsiteIpc()
  registerSettingsIpc()
  registerSearchIpc()

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
