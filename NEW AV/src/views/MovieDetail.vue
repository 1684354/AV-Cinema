<template>
  <div class="detail-page">
    <!-- Header -->
    <div class="detail-header">
      <span class="back" @click="goBack">◀</span>
      <span class="loc">影片详情</span>
      <div class="actions">
        <button @click="toggleEdit">{{ isEditing ? '💾 保存' : '✏️ 编辑' }}</button>
        <button :class="{ favActive: movie?.is_favorite }" @click="toggleFav">
          {{ movie?.is_favorite ? '♥' : '♡' }}
        </button>
        <button class="play" @click="play">▶ 播放</button>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <span>正在加载影片...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="error">
      <div class="icon">⚠️</div>
      <div class="msg">影片不存在</div>
      <div class="sub">{{ error }}</div>
      <button class="retry" @click="goBack">◀ 返回</button>
    </div>

    <!-- Empty -->
    <div class="empty-state" v-else-if="!movie">
      <div class="icon">📭</div>
      <div class="msg">未找到影片</div>
      <div class="sub">该影片可能已被删除</div>
      <button class="retry" @click="goBack">◀ 返回</button>
    </div>

    <!-- Normal -->
    <template v-else>
      <!-- Preview area -->
      <div class="preview-area">
        <div class="big">🎬</div>
        <div class="dots">
          <span
            v-for="(_, i) in previewDots"
            :key="i"
            :class="{ active: i === activePreview }"
          ></span>
        </div>
      </div>

      <!-- Filmstrip -->
      <div class="filmstrip" v-if="filmstripThumbs.length > 0">
        <div
          v-for="(thumb, i) in filmstripThumbs"
          :key="i"
          class="thumb"
          :class="{ active: i === activePreview }"
          @click="activePreview = i"
        >
          🎬
        </div>
      </div>

      <!-- Detail grid -->
      <div class="detail-grid">
        <!-- Column 1: Info panel -->
        <div class="info-panel">
          <div class="code">
            <template v-if="isEditing">
              <input v-model="editForm.code" class="edit-input code-input" />
            </template>
            <template v-else>
              {{ movie.code || '未知' }}
            </template>
            <span class="copy" @click="copyCode">📋 复制</span>
          </div>
          <div class="category" v-if="!isEditing">
            <span class="cat-badge">{{ movie.category || 'AV' }}</span>
            <span class="cat-divider">·</span>
            <span class="cat-badge" :class="{ uncensored: movie.is_uncensored }">
              {{ movie.is_uncensored ? '无码' : '有码' }}
            </span>
            <span v-if="movie.has_subtitle" class="cat-badge subtitle">中字</span>
            <span v-if="movie.has_chinese" class="cat-badge chinese">破解</span>
          </div>
          <div class="title" v-if="!isEditing">{{ movie.title || '未命名' }}</div>
          <div class="title" v-else>
            <input v-model="editForm.title" class="edit-input title-input" placeholder="影片标题" />
          </div>

          <div class="info-fields">
            <div class="f">
              番号
              <strong v-if="!isEditing">{{ movie.code || '未知' }}</strong>
              <input v-else v-model="editForm.code" class="edit-input" />
            </div>
            <div class="f">
              女优
              <strong v-if="!isEditing">
                <span v-if="actressNames.length > 0">
                  <span
                    v-for="(name, i) in actressNames"
                    :key="i"
                    class="link"
                    @click="goActress(name.id)"
                  >{{ name.name }}{{ i < actressNames.length - 1 ? '、' : '' }}</span>
                </span>
                <span v-else class="no-data">无</span>
              </strong>
              <input v-else v-model="editForm.actress" class="edit-input" placeholder="女优名, 逗号分隔" />
            </div>
            <div class="f">
              发行日期
              <strong v-if="!isEditing">{{ movie.release_date || '未知' }}</strong>
              <input v-else v-model="editForm.release_date" class="edit-input" placeholder="YYYY-MM-DD" />
            </div>
            <div class="f">
              时长
              <strong v-if="!isEditing">{{ movie.duration ? movie.duration + ' 分钟' : '未知' }}</strong>
              <input v-else v-model="editForm.duration" class="edit-input" placeholder="分钟" />
            </div>
            <div class="f">
              系列
              <strong v-if="!isEditing">{{ movie.series || '未知' }}</strong>
              <input v-else v-model="editForm.series" class="edit-input" placeholder="系列名称" />
            </div>
            <div class="f">
              播放次数
              <strong>{{ movie.play_count ?? 0 }} 次</strong>
            </div>
            <div class="f">
              文件大小
              <strong>{{ formattedSize }}</strong>
            </div>
            <div class="f">
              加入日期
              <strong>{{ movie.created_at ? new Date(movie.created_at).toLocaleDateString('zh-CN') : '未知' }}</strong>
            </div>
          </div>
        </div>

        <!-- Column 2: Tags + actions -->
        <div class="info-panel">
          <div class="tags-section">
            <div class="gLabel">👩 女优标签</div>
            <div class="tags" v-if="actressTags.length > 0">
              <span v-for="tag in actressTags" :key="tag" class="t red">{{ tag }}</span>
            </div>
            <div class="no-tags" v-else>暂无女优标签</div>
          </div>

          <div class="tags-section">
            <div class="gLabel">🏷️ 影片标签</div>
            <div class="tags" v-if="movieTags.length > 0">
              <span v-for="tag in movieTags" :key="tag" class="t blue">{{ tag }}</span>
            </div>
            <div class="no-tags" v-else>暂无影片标签</div>
          </div>

          <div class="detail-actions">
            <button @click="translateTitle">🌐 翻译片名</button>
            <button @click="openLocation">📂 打开位置</button>
            <button @click="searchOnline">🔗 在线搜索</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ACTRESS_TAG_KEYWORDS } from '@/utils/tags'

const route = useRoute()
const router = useRouter()

// State
const movie = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)
const activePreview = ref(0)

const editForm = ref({
  code: '',
  title: '',
  actress: '',
  release_date: '',
  duration: '',
  series: ''
})

// Actress keywords for tag classification (must match MovieCard.vue)
const actressKeywords = ACTRESS_TAG_KEYWORDS

// Computed
const actressNames = computed<any[]>(() => {
  if (!movie.value?.actress_ids) return []
  try {
    const parsed = typeof movie.value.actress_ids === 'string'
      ? JSON.parse(movie.value.actress_ids)
      : movie.value.actress_ids
    if (typeof parsed === 'string') return [{ id: 0, name: parsed }]
    if (Array.isArray(parsed)) {
      return parsed.map((a: any) => {
        if (typeof a === 'string') return { id: 0, name: a }
        return { id: a.id || 0, name: a.name || String(a) }
      })
    }
    return []
  } catch {
    return []
  }
})

const previewDots = computed(() => {
  return Array.from({ length: Math.max(1, filmstripThumbs.value.length || 1) })
})

const filmstripThumbs = computed(() => {
  // Generate placeholder thumbs based on tags count, minimum 1
  const count = Math.max(1, Math.min(parsedTags.value.length || 3, 8))
  return Array.from({ length: count })
})

const parsedTags = computed<string[]>(() => {
  if (!movie.value?.tags) return []
  if (Array.isArray(movie.value.tags)) return movie.value.tags
  try {
    const parsed = typeof movie.value.tags === 'string' ? JSON.parse(movie.value.tags) : movie.value.tags
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const actressTags = computed<string[]>(() => {
  return parsedTags.value.filter(tag =>
    actressKeywords.some(kw => tag.includes(kw))
  )
})

const movieTags = computed<string[]>(() => {
  return parsedTags.value.filter(tag =>
    !actressKeywords.some(kw => tag.includes(kw))
  )
})

const formattedSize = computed(() => {
  const size = movie.value?.file_size
  if (!size) return '未知'
  const num = parseFloat(size)
  if (isNaN(num)) return String(size)
  if (num >= 1073741824) return (num / 1073741824).toFixed(1) + ' GB'
  if (num >= 1048576) return (num / 1048576).toFixed(1) + ' MB'
  if (num >= 1024) return (num / 1024).toFixed(1) + ' KB'
  return num + ' B'
})

// Methods
async function fetchMovie() {
  const id = Number(route.params.id)
  if (isNaN(id)) {
    error.value = '无效的影片 ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    const result = await window.api.getMovie(id)
    if (!result) {
      error.value = '影片不存在'
      return
    }
    movie.value = result
    // Initialize edit form
    editForm.value = {
      code: result.code || '',
      title: result.title || '',
      actress: result.actress || '',
      release_date: result.release_date || '',
      duration: result.duration ? String(result.duration) : '',
      series: result.series || ''
    }
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function goActress(id: number) {
  if (id > 0) {
    router.push(`/actress/${id}`)
  }
}

async function copyCode() {
  const code = movie.value?.code
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    // Brief visual feedback
    const copyEl = document.querySelector('.copy')
    if (copyEl) {
      copyEl.textContent = '✅ 已复制'
      setTimeout(() => { copyEl.textContent = '📋 复制' }, 1500)
    }
  } catch {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

async function toggleFav() {
  if (!movie.value) return
  try {
    const result = await window.api.toggleMovieFavorite(movie.value.id)
    movie.value.is_favorite = result
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

async function toggleEdit() {
  if (!isEditing.value) {
    isEditing.value = true
    return
  }

  // Save
  try {
    const payload: any = {}
    if (editForm.value.code !== movie.value.code) payload.code = editForm.value.code
    if (editForm.value.title !== movie.value.title) payload.title = editForm.value.title
    if (editForm.value.actress !== (movie.value.actress || '')) payload.actresses = editForm.value.actress
    if (editForm.value.release_date !== movie.value.release_date) payload.release_date = editForm.value.release_date
    if (editForm.value.duration !== String(movie.value.duration || '')) payload.duration = editForm.value.duration ? parseInt(editForm.value.duration) : null
    if (editForm.value.series !== movie.value.series) payload.series = editForm.value.series

    if (Object.keys(payload).length > 0) {
      await window.api.updateMovie(movie.value.id, payload)
      Object.assign(movie.value, payload)
      if (payload.duration !== undefined) movie.value.duration = payload.duration
    }
    isEditing.value = false
  } catch (err) {
    console.error('Failed to save movie:', err)
  }
}

function play() {
  if (movie.value?.video_path) {
    window.api.playMovie(movie.value.video_path)
  }
}

function openLocation() {
  if (movie.value?.video_path) {
    window.api.openFileLocation(movie.value.video_path)
  }
}

function translateTitle() {
  // Placeholder for translation feature
  if (movie.value?.code) {
    window.open(`https://translate.google.com/?sl=ja&tl=zh-CN&text=${encodeURIComponent(movie.value.title || '')}`, '_blank')
  }
}

function searchOnline() {
  if (movie.value?.code) {
    window.open(`https://javdb.com/search?q=${encodeURIComponent(movie.value.code)}`, '_blank')
  }
}

// Lifecycle
onMounted(() => {
  fetchMovie()
})
</script>

<style scoped>
.detail-page {
  height: 100%;
  overflow-y: auto;
  padding: 24px 28px;
  background: var(--bg3);
}

/* ===== Header ===== */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.detail-header .back {
  font-size: 16px;
  color: var(--fg3);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: var(--transition);
}
.detail-header .back:hover {
  background: var(--surface);
  color: var(--fg);
}
.detail-header .loc {
  font-size: 13px;
  color: var(--fg4);
}
.detail-header .actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.detail-header .actions button {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 12px;
  background: var(--bg2);
  color: var(--fg3);
  transition: var(--transition);
  cursor: pointer;
}
.detail-header .actions button:hover {
  background: var(--surface);
  color: var(--fg);
}
.detail-header .actions .play {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.detail-header .actions .play:hover {
  background: var(--accent3);
}
.detail-header .actions .favActive {
  color: var(--accent2);
}

/* ===== States ===== */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
  color: var(--fg4);
  font-size: 13px;
}
.loading-state .spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  gap: 8px;
  color: var(--fg4);
}
.error-state .icon {
  font-size: 48px;
  margin-bottom: 8px;
}
.error-state .msg {
  font-size: 16px;
  color: var(--rose);
  font-weight: 600;
}
.error-state .sub {
  font-size: 12px;
  color: var(--fg4);
}
.error-state .retry {
  margin-top: 16px;
  padding: 8px 24px;
  border-radius: 16px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent2);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.error-state .retry:hover {
  background: var(--accent);
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  gap: 8px;
  color: var(--fg4);
}
.empty-state .icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: .4;
}
.empty-state .msg {
  font-size: 15px;
}
.empty-state .sub {
  font-size: 12px;
  color: var(--fg4);
}
.empty-state .retry {
  margin-top: 16px;
  padding: 8px 24px;
  border-radius: 16px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent2);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.empty-state .retry:hover {
  background: var(--accent);
  color: #fff;
}

/* ===== Preview area ===== */
.preview-area {
  background: var(--bg3);
  border-radius: var(--radius);
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
}
.preview-area .big {
  font-size: 64px;
  opacity: .4;
}
.preview-area .dots {
  position: absolute;
  bottom: 16px;
  display: flex;
  gap: 6px;
}
.preview-area .dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
  cursor: pointer;
  transition: var(--transition);
}
.preview-area .dots span.active {
  background: var(--accent2);
  width: 20px;
  border-radius: 3px;
}

/* ===== Filmstrip ===== */
.filmstrip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 12px 0 20px;
  padding-bottom: 4px;
}
.filmstrip .thumb {
  flex-shrink: 0;
  width: 80px;
  height: 56px;
  background: var(--surface);
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.filmstrip .thumb:hover {
  border-color: var(--fg4);
}
.filmstrip .thumb.active {
  border-color: var(--accent2);
}

/* ===== Detail grid ===== */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ===== Info panel ===== */
.info-panel {
  background: var(--bg2);
  border-radius: var(--radius);
  padding: 24px;
  border: 1px solid var(--border);
}
.info-panel .code {
  font-family: Georgia, serif;
  font-size: 20px;
  color: var(--accent2);
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.info-panel .code .copy {
  font-size: 11px;
  color: var(--fg4);
  cursor: pointer;
  padding: 2px 10px;
  border-radius: 8px;
  background: var(--surface);
  transition: var(--transition);
  user-select: none;
}
.info-panel .code .copy:hover {
  background: var(--border);
  color: var(--fg);
}
.info-panel .code-input {
  font-family: Georgia, serif;
  font-size: 20px;
  color: var(--accent2);
}

/* Category badges */
.category {
  font-size: 12px;
  color: var(--accent2);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cat-badge {
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.cat-badge.uncensored {
  color: var(--rose);
}
.cat-badge.subtitle {
  color: var(--fg);
  background: rgba(162, 74, 58, .2);
}
.cat-badge.chinese {
  color: var(--fg);
  background: rgba(59, 100, 140, .2);
}
.cat-divider {
  color: var(--fg4);
}

.info-panel .title {
  font-size: 17px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.info-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.info-fields .f {
  font-size: 12px;
  color: var(--fg4);
}
.info-fields .f strong {
  display: block;
  color: var(--fg);
  font-weight: 400;
  font-size: 13px;
  margin-top: 2px;
}
.info-fields .f .link {
  color: var(--accent2);
  cursor: pointer;
  transition: var(--transition);
}
.info-fields .f .link:hover {
  color: var(--accent);
}
.info-fields .f .no-data {
  color: var(--fg4);
  font-style: italic;
}

/* ===== Tags section ===== */
.tags-section {
  margin-bottom: 16px;
}
.tags-section .gLabel {
  font-size: 10px;
  color: var(--fg4);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.tags-section .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.tags-section .tags .t {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
}
.tags-section .tags .t.red {
  background: rgba(162, 74, 58, .2);
  color: var(--rose);
  border: 1px solid rgba(162, 74, 58, .25);
}
.tags-section .tags .t.blue {
  background: rgba(59, 100, 140, .2);
  color: var(--blue);
  border: 1px solid rgba(59, 100, 140, .25);
}
.tags-section .no-tags {
  font-size: 11px;
  color: var(--fg4);
  font-style: italic;
}

/* ===== Detail actions ===== */
.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.detail-actions button {
  padding: 8px 18px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg3);
  font-size: 12px;
  transition: var(--transition);
  cursor: pointer;
}
.detail-actions button:hover {
  background: var(--border);
  color: var(--fg);
}

/* ===== Edit inputs ===== */
.edit-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--fg);
  font-size: 13px;
  outline: none;
  width: 100%;
  transition: var(--transition);
}
.edit-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(162, 74, 58, .15);
}
.title-input {
  font-size: 17px;
  margin-bottom: 16px;
}
</style>
