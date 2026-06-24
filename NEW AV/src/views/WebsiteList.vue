<template>
  <div class="website-list">
    <!-- Header -->
    <div class="header">
      <h2 class="title">&#x1F310; 网站导航</h2>
      <button class="btn-add" @click="showAddDialog = true">+ 添加网站</button>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading && websites.length === 0">
      <div class="spinner"></div><span>正在加载...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="error && websites.length === 0">
      <div class="icon">&#x26A0;&#xFE0F;</div>
      <div class="msg">{{ error }}</div>
      <button class="retry" @click="loadWebsites">&#x1F504; 重试</button>
    </div>

    <!-- Empty -->
    <div class="empty-state" v-else-if="!loading && websites.length === 0">
      <div class="icon">&#x1F30D;</div>
      <div class="msg">还没有添加网站</div>
      <div class="sub">点击上方"添加网站"开始收藏常用站点</div>
    </div>

    <!-- Card Grid -->
    <div class="grid" v-else>
      <div
        v-for="site in websites"
        :key="site.id"
        class="card"
        @click="openWebsite(site.url)"
      >
        <div class="card-icon">{{ site.icon || '&#x1F310;' }}</div>
        <div class="card-body">
          <div class="card-name">{{ site.name }}</div>
          <div class="card-url">{{ site.url }}</div>
          <div class="card-desc" v-if="site.description">{{ site.description }}</div>
        </div>
        <div class="card-actions">
          <button class="btn-icon" title="编辑" @click.stop="editWebsite(site)">&#x270F;&#xFE0F;</button>
          <button class="btn-icon btn-delete" title="删除" @click.stop="deleteWebsite(site)">&#x1F5D1;&#xFE0F;</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Dialog -->
    <div class="dialog-overlay" v-if="showAddDialog || showEditDialog" @click.self="closeDialogs">
      <div class="dialog">
        <h3>{{ showEditDialog ? '编辑网站' : '添加网站' }}</h3>
        <div class="form">
          <div class="field">
            <label>名称</label>
            <input v-model="form.name" placeholder="例: JavDB" />
          </div>
          <div class="field">
            <label>网址</label>
            <input v-model="form.url" placeholder="https://example.com" />
          </div>
          <div class="field">
            <label>图标 (Emoji)</label>
            <input v-model="form.icon" placeholder="&#x1F310; (选填)" maxlength="4" />
          </div>
          <div class="field">
            <label>描述</label>
            <textarea v-model="form.description" placeholder="简短描述 (选填)" rows="2"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="closeDialogs">取消</button>
          <button class="btn-save" @click="saveWebsite" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'

interface Website {
  id: number
  name: string
  url: string
  icon?: string
  description?: string
}

const websites = ref<Website[]>([])
const loading = ref(false)
const error = ref('')
const saving = ref(false)

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  url: '',
  icon: '',
  description: ''
})

onMounted(() => {
  loadWebsites()
})

async function loadWebsites() {
  loading.value = true
  error.value = ''
  try {
    websites.value = await window.api.getWebsites()
  } catch (err: any) {
    error.value = err?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function openWebsite(url: string) {
  if (url) {
    window.api.openWebsite(url)
  }
}

function editWebsite(site: Website) {
  editingId.value = site.id
  form.name = site.name
  form.url = site.url
  form.icon = site.icon || ''
  form.description = site.description || ''
  showEditDialog.value = true
}

async function deleteWebsite(site: Website) {
  if (!confirm(`确定要删除 "${site.name}" 吗？`)) return
  try {
    await window.api.deleteWebsite(site.id)
    websites.value = websites.value.filter(w => w.id !== site.id)
  } catch (err: any) {
    alert('删除失败: ' + (err?.message || '未知错误'))
  }
}

function closeDialogs() {
  showAddDialog.value = false
  showEditDialog.value = false
  editingId.value = null
  resetForm()
}

function resetForm() {
  form.name = ''
  form.url = ''
  form.icon = ''
  form.description = ''
}

async function saveWebsite() {
  if (!form.name.trim() || !form.url.trim()) {
    alert('名称和网址不能为空')
    return
  }

  saving.value = true
  try {
    const data = {
      name: form.name.trim(),
      url: form.url.trim(),
      icon: form.icon.trim() || undefined,
      description: form.description.trim() || undefined
    }

    if (showEditDialog.value && editingId.value !== null) {
      await window.api.updateWebsite(editingId.value, data)
    } else {
      await window.api.createWebsite(data)
    }

    closeDialogs()
    await loadWebsites()
  } catch (err: any) {
    alert('保存失败: ' + (err?.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.website-list { padding: 0; }

/* Header */
.header { display: flex; align-items: center; justify-content: space-between; padding: 18px 28px; border-bottom: 1px solid var(--border); gap: 16px; }
.title { font-size: 18px; color: var(--fg); }
.btn-add { padding: 7px 18px; border-radius: 18px; border: 1px solid var(--accent); background: var(--accent); color: #fff; font-size: 13px; cursor: pointer; transition: var(--transition); white-space: nowrap; }
.btn-add:hover { background: var(--accent3); border-color: var(--accent3); }

/* States */
.loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
.loading-state .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state span { color: var(--fg3); font-size: 14px; }
.error-state .icon, .empty-state .icon { font-size: 48px; }
.error-state .msg, .empty-state .msg { color: var(--fg3); font-size: 15px; }
.empty-state .sub { color: var(--fg4); font-size: 12px; }
.retry { padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg); font-size: 13px; cursor: pointer; transition: var(--transition); }
.retry:hover { background: var(--surface); border-color: var(--accent); }

/* Card Grid */
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px 28px; }

.card { display: flex; align-items: flex-start; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px; cursor: pointer; transition: var(--transition); position: relative; }
.card:hover { border-color: var(--accent2); background: var(--bg2); transform: translateY(-2px); box-shadow: var(--shadow); }

.card-icon { font-size: 28px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-body { flex: 1; min-width: 0; }
.card-name { font-size: 14px; font-weight: 600; color: var(--fg); margin-bottom: 4px; }
.card-url { font-size: 11px; color: var(--fg4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
.card-desc { font-size: 12px; color: var(--fg3); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; opacity: 0; transition: var(--transition); }
.card:hover .card-actions { opacity: 1; }

.btn-icon { width: 28px; height: 28px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg2); color: var(--fg3); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.btn-icon:hover { background: var(--surface); border-color: var(--accent2); color: var(--fg); }
.btn-delete:hover { border-color: var(--rose); color: var(--rose); }

/* Dialog */
.dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; width: 420px; max-width: 90vw; box-shadow: var(--shadow); }
.dialog h3 { font-size: 17px; color: var(--fg); margin-bottom: 20px; }
.form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12px; color: var(--fg3); }
.field input, .field textarea { padding: 9px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border); background: var(--bg); color: var(--fg); font-size: 13px; outline: none; transition: var(--transition); font-family: inherit; }
.field input:focus, .field textarea:focus { border-color: var(--accent2); }
.field textarea { resize: vertical; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.btn-cancel { padding: 7px 20px; border-radius: 18px; border: 1px solid var(--border); background: transparent; color: var(--fg3); font-size: 13px; cursor: pointer; transition: var(--transition); }
.btn-cancel:hover { background: var(--surface); color: var(--fg); }
.btn-save { padding: 7px 24px; border-radius: 18px; border: 1px solid var(--accent); background: var(--accent); color: #fff; font-size: 13px; cursor: pointer; transition: var(--transition); }
.btn-save:hover { background: var(--accent3); border-color: var(--accent3); }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
</style>
