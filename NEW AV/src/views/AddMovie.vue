<template>
  <div class="add-movie">
    <!-- Header -->
    <div class="header">
      <h1>添加影片</h1>
      <p class="subtitle">输入番号自动抓取信息，或手动填写</p>
    </div>

    <!-- Card -->
    <div class="card">
      <!-- Input row: code + fetch button -->
      <div class="input-row">
        <div class="code-input-wrapper">
          <input
            v-model="code"
            type="text"
            class="code-input"
            placeholder="输入番号，如 ABP-123"
            @keyup.enter="handleFetch"
            :disabled="fetching"
          />
        </div>
        <button class="btn-fetch" @click="handleFetch" :disabled="fetching || !code.trim()">
          <span class="btn-icon">&#x1F50D;</span>
          {{ fetching ? '抓取中...' : '抓取' }}
        </button>
      </div>

      <!-- Duplicate warning -->
      <div class="duplicate-warning" v-if="duplicate">
        <span class="warn-icon">&#x26A0;&#xFE0F;</span>
        <span>番号 "{{ duplicate }}" 已存在，继续添加将创建重复记录</span>
      </div>

      <!-- Error message -->
      <div class="error-msg" v-if="error">
        <span class="err-icon">&#x274C;</span>
        <span>{{ error }}</span>
      </div>

      <!-- Manual fields -->
      <div class="form-fields" v-if="showForm">
        <div class="field">
          <label>标题</label>
          <input v-model="form.title" type="text" class="field-input" placeholder="影片标题" />
        </div>
        <div class="field-row">
          <div class="field flex-1">
            <label>番号</label>
            <input v-model="form.code" type="text" class="field-input" placeholder="ABP-123" />
          </div>
          <div class="field flex-1">
            <label>发行日期</label>
            <input v-model="form.releaseDate" type="date" class="field-input" />
          </div>
        </div>
        <div class="field">
          <label>女优</label>
          <input v-model="form.actress" type="text" class="field-input" placeholder="女优名（多个用逗号分隔）" />
        </div>
        <div class="field">
          <label>时长（分钟）</label>
          <input v-model="form.duration" type="number" class="field-input" placeholder="例如 120" min="0" />
        </div>
        <div class="field">
          <label>封面 URL</label>
          <input v-model="form.coverUrl" type="text" class="field-input" placeholder="https://example.com/cover.jpg" />
        </div>
        <div class="field">
          <label>标签</label>
          <input v-model="form.tags" type="text" class="field-input" placeholder="标签（多个用逗号分隔）" />
        </div>
        <div class="field">
          <label>简介</label>
          <textarea v-model="form.description" class="field-textarea" placeholder="影片简介" rows="3"></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions" v-if="showForm">
        <button class="btn-cancel" @click="resetForm">重置</button>
        <button class="btn-save" @click="handleCreate" :disabled="saving">
          {{ saving ? '保存中...' : '保存影片' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const code = ref('')
const fetching = ref(false)
const saving = ref(false)
const duplicate = ref('')
const error = ref('')
const showForm = ref(false)

const form = reactive({
  title: '',
  code: '',
  releaseDate: '',
  actress: '',
  duration: '',
  coverUrl: '',
  tags: '',
  description: '',
})

async function handleFetch() {
  const trimmed = code.value.trim()
  if (!trimmed) return

  fetching.value = true
  error.value = ''
  duplicate.value = ''

  try {
    // Check for duplicates first
    const existing = await window.api.getMovies({ search: trimmed, page: 1, pageSize: 1 })
    if (existing.movies && existing.movies.length > 0) {
      duplicate.value = trimmed
    }

    // Try to scrape metadata from JavDB
    try {
      const info = await window.api.scrapeMovie(trimmed)
      if (info) {
        form.title = info.title || ''
        form.code = info.code || trimmed
        form.releaseDate = info.release_date || ''
        form.actress = (info.actress || []).join(', ')
        form.duration = info.duration ? String(info.duration) : ''
        form.coverUrl = info.cover_url || ''
        form.tags = (info.tags || []).join(', ')
        form.description = info.description || ''
      }
    } catch {
      // Scrape failed — prefill code only
      form.code = trimmed
      form.title = ''
      form.releaseDate = ''
      form.actress = ''
      form.duration = ''
      form.coverUrl = ''
      form.tags = ''
      form.description = ''
    }

    showForm.value = true
  } catch (e: any) {
    error.value = e.message || '操作失败'
  } finally {
    fetching.value = false
  }
}

async function handleCreate() {
  if (!form.code.trim()) {
    ElMessage.warning('请输入番号')
    return
  }
  if (!form.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }

  saving.value = true
  error.value = ''

  try {
    const payload: Record<string, any> = {
      code: form.code.trim(),
      title: form.title.trim(),
    }
    if (form.releaseDate) payload.release_date = form.releaseDate
    if (form.actress.trim()) payload.actresses = form.actress.split(',').map((s: string) => s.trim()).filter(Boolean).join(' ')
    if (form.duration) payload.duration = parseInt(form.duration, 10)
    if (form.coverUrl.trim()) payload.cover_path = form.coverUrl.trim()
    if (form.tags.trim()) payload.tags = JSON.stringify(form.tags.split(',').map((s: string) => s.trim()).filter(Boolean))
    if (form.description.trim()) payload.description = form.description.trim()

    await window.api.createMovie(payload)
    ElMessage.success('影片添加成功')
    resetForm()
  } catch (e: any) {
    error.value = e.message || '保存失败'
    ElMessage.error(error.value)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  code.value = ''
  duplicate.value = ''
  error.value = ''
  showForm.value = false
  form.title = ''
  form.code = ''
  form.releaseDate = ''
  form.actress = ''
  form.duration = ''
  form.coverUrl = ''
  form.tags = ''
  form.description = ''
}
</script>

<style scoped>
.add-movie {
  padding: 32px 28px;
  max-width: 640px;
  margin: 0 auto;
}

/* Header */
.header { margin-bottom: 24px; }
.header h1 { font-size: 24px; color: var(--fg); margin-bottom: 4px; }
.subtitle { font-size: 13px; color: var(--fg4); }

/* Card */
.card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}

/* Input row */
.input-row { display: flex; gap: 10px; margin-bottom: 16px; }
.code-input-wrapper { flex: 1; }
.code-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  font-size: 14px;
  outline: none;
  transition: var(--transition);
}
.code-input:focus { border-color: var(--accent); }
.code-input:disabled { opacity: .5; }
.code-input::placeholder { color: var(--fg4); }

.btn-fetch {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-fetch:hover:not(:disabled) { background: var(--accent3); }
.btn-fetch:disabled { opacity: .5; cursor: not-allowed; }
.btn-icon { font-size: 14px; }

/* Duplicate warning */
.duplicate-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(255, 193, 7, .1);
  border: 1px solid rgba(255, 193, 7, .3);
  color: var(--fg2);
  font-size: 13px;
  margin-bottom: 16px;
}
.warn-icon { font-size: 16px; }

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(196, 42, 42, .1);
  border: 1px solid rgba(196, 42, 42, .3);
  color: var(--rose);
  font-size: 13px;
  margin-bottom: 16px;
}
.err-icon { font-size: 14px; }

/* Form fields */
.form-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }
.field label { font-size: 12px; color: var(--fg4); font-weight: 500; }
.field-input {
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  font-size: 13px;
  outline: none;
  transition: var(--transition);
}
.field-input:focus { border-color: var(--accent2); }
.field-input::placeholder { color: var(--fg4); }
.field-textarea {
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  font-size: 13px;
  outline: none;
  transition: var(--transition);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}
.field-textarea:focus { border-color: var(--accent2); }
.field-textarea::placeholder { color: var(--fg4); }

/* Actions */
.actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel {
  padding: 9px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg3);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.btn-cancel:hover { background: var(--surface); color: var(--fg); }
.btn-save {
  padding: 9px 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.btn-save:hover:not(:disabled) { background: var(--accent3); }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
</style>
