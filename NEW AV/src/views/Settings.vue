<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <span class="header-icon">⚙️</span>
        <h2>设置</h2>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <span>正在加载设置...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="error">
      <div class="icon">⚠️</div>
      <div class="msg">{{ error }}</div>
      <button class="retry" @click="loadSettings">🔄 重试</button>
    </div>

    <!-- Settings Form -->
    <div class="settings-form" v-else>
      <!-- 1. Player Path -->
      <div class="setting-group">
        <div class="group-header">
          <span class="group-icon">▶️</span>
          <span class="group-title">播放器路径</span>
        </div>
        <div class="group-body">
          <div class="input-row">
            <input
              type="text"
              v-model="form.player_path"
              class="setting-input"
              placeholder="例如: C:\PotPlayer\PotPlayerMini64.exe"
            />
            <button class="btn-browse" @click="browsePlayerPath">浏览</button>
          </div>
          <p class="setting-desc">留空使用系统默认</p>
        </div>
      </div>

      <!-- 2. Media Root -->
      <div class="setting-group">
        <div class="group-header">
          <span class="group-icon">📁</span>
          <span class="group-title">媒体根目录</span>
        </div>
        <div class="group-body">
          <input
            type="text"
            v-model="form.media_root"
            class="setting-input"
            placeholder="选择视频文件存放的根路径"
          />
          <p class="setting-desc">视频文件存放的根路径</p>
        </div>
      </div>

      <!-- 3. Translation API -->
      <div class="setting-group">
        <div class="group-header">
          <span class="group-icon">🌐</span>
          <span class="group-title">翻译 API</span>
        </div>
        <div class="group-body">
          <div class="field-row">
            <label class="field-label">API Key</label>
            <input
              type="password"
              v-model="form.translate_api_key"
              class="setting-input"
              placeholder="输入 API Key"
            />
          </div>
          <div class="field-row">
            <label class="field-label">Endpoint</label>
            <input
              type="text"
              v-model="form.translate_api_endpoint"
              class="setting-input"
              placeholder="输入 API Endpoint"
            />
          </div>
          <p class="setting-desc">用于翻译片名</p>
        </div>
      </div>

      <!-- 4. Actress Sync -->
      <div class="setting-group">
        <div class="group-header">
          <span class="group-icon">👩</span>
          <span class="group-title">女优同步</span>
        </div>
        <div class="group-body">
          <div class="toggle-row">
            <label class="toggle-label">启用自动同步</label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="form.sync_enabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button class="btn-sync" @click="scanActresses">立即扫描</button>
        </div>
      </div>

      <!-- 5. Link Movies -->
      <div class="setting-group">
        <div class="group-header">
          <span class="group-icon">🔗</span>
          <span class="group-title">关联影片</span>
        </div>
        <div class="group-body">
          <button class="btn-link" @click="startLinking">开始关联</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'

const loading = ref(true)
const error = ref<string | null>(null)

const form = reactive({
  player_path: '',
  media_root: '',
  translate_api_key: '',
  translate_api_endpoint: '',
  sync_enabled: false
})

// Load all settings at once
async function loadSettings() {
  loading.value = true
  error.value = null
  try {
    const settings = await window.api.getSettings()
    form.player_path = settings.player_path || ''
    form.media_root = settings.media_root || ''
    form.translate_api_key = settings.translate_api_key || ''
    form.translate_api_endpoint = settings.translate_api_endpoint || ''
    form.sync_enabled = settings.sync_enabled === 'true'
  } catch (e: any) {
    error.value = e.message || '加载设置失败'
  } finally {
    loading.value = false
  }
}

// Auto-save on change: debounced via watcher
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleSave(key: string, value: string) {
  const existing = saveTimers.get(key)
  if (existing) clearTimeout(existing)
  saveTimers.set(key, setTimeout(() => {
    window.api.updateSetting(key, value).catch((e: any) => {
      console.error(`Failed to save ${key}:`, e)
    })
    saveTimers.delete(key)
  }, 500))
}

watch(() => form.player_path, (v) => scheduleSave('player_path', v))
watch(() => form.media_root, (v) => scheduleSave('media_root', v))
watch(() => form.translate_api_key, (v) => scheduleSave('translate_api_key', v))
watch(() => form.translate_api_endpoint, (v) => scheduleSave('translate_api_endpoint', v))
watch(() => form.sync_enabled, (v) => scheduleSave('sync_enabled', v ? 'true' : 'false'))

// Action callbacks — these use the available IPC API.
// The actual file-dialog, actress-scan, and movie-linking logic lives
// at the Electron layer (channels registered in main process).
// For now, we invoke via updateSetting (simulating triggers) and show
// feedback so the user knows the request was received.
async function browsePlayerPath() {
  try {
    // Use a placeholder — Electron's dialog.showOpenDialog would be
    // wired up via a dedicated IPC channel in a future iteration.
    // For now, instruct the user to type or paste the path.
    alert('请手动输入播放器路径，或粘贴文件路径。\n未来版本将支持文件浏览对话框。')
  } catch (e: any) {
    console.error('Browse failed:', e)
  }
}

async function scanActresses() {
  try {
    // Placeholder: actress scanning is not yet wired as an IPC channel.
    alert('女优同步功能将在后续版本中实现。')
  } catch (e: any) {
    alert('扫描失败: ' + (e.message || '未知错误'))
  }
}

async function startLinking() {
  try {
    // Placeholder: movie linking is not yet wired as an IPC channel.
    alert('影片关联功能将在后续版本中实现。')
  } catch (e: any) {
    alert('关联失败: ' + (e.message || '未知错误'))
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.settings-page {
  padding: 28px 32px;
  max-width: 640px;
}

/* ---- Header ---- */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  font-size: 22px;
}
.header-left h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--fg);
  margin: 0;
}

/* ---- Loading / Error / Empty shared ---- */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: var(--fg3);
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--accent2);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-state .icon { font-size: 32px; }
.error-state .msg { color: var(--fg2); font-size: 14px; }
.retry {
  padding: 7px 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--fg3);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
}
.retry:hover { background: var(--surface); color: var(--fg); }

/* ---- Setting Group ---- */
.setting-group {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.group-icon { font-size: 16px; }
.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
}
.group-body {
  padding: 14px 18px 16px;
}

/* ---- Inputs ---- */
.setting-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--fg);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.setting-input:focus {
  border-color: var(--accent2);
}
.setting-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--fg3);
}

/* ---- Row helpers ---- */
.input-row {
  display: flex;
  gap: 8px;
}
.input-row .setting-input {
  flex: 1;
}
.field-row {
  margin-bottom: 10px;
}
.field-row:last-child {
  margin-bottom: 0;
}
.field-label {
  display: block;
  font-size: 12px;
  color: var(--fg3);
  margin-bottom: 4px;
}

/* ---- Toggle switch ---- */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.toggle-label {
  font-size: 13px;
  color: var(--fg2);
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--border);
  border-radius: 22px;
  cursor: pointer;
  transition: background 0.25s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s;
}
.toggle-switch input:checked + .toggle-slider {
  background: var(--accent2, #d98e6a);
}
.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* ---- Buttons ---- */
.btn-browse {
  padding: 7px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--fg2);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: var(--transition);
}
.btn-browse:hover {
  background: var(--surface);
  color: var(--fg);
  border-color: var(--accent2);
}
.btn-sync,
.btn-link {
  padding: 7px 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--fg2);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
}
.btn-sync:hover,
.btn-link:hover {
  background: var(--surface);
  color: var(--fg);
  border-color: var(--accent2);
}
</style>
