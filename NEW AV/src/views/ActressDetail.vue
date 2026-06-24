<template>
  <div class="detail-page">
    <!-- Header -->
    <div class="detail-header">
      <span class="back" @click="goBack">◀</span>
      <span class="loc">女优详情</span>
      <div class="actions">
        <button @click="toggleEdit">{{ isEditing ? '💾 保存' : '✏️ 编辑' }}</button>
        <button :class="{ favActive: actress?.is_favorite }" @click="toggleFav">
          {{ actress?.is_favorite ? '♥' : '♡' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <span>正在加载女优信息...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="error">
      <div class="icon">⚠️</div>
      <div class="msg">女优不存在</div>
      <div class="sub">{{ error }}</div>
      <button class="retry" @click="goBack">◀ 返回</button>
    </div>

    <!-- Normal -->
    <template v-else-if="actress">
      <!-- Avatar + Info section -->
      <div class="actress-hero">
        <div class="avatar-circle">
          <span class="avatar-placeholder">🎭</span>
        </div>
        <div class="info-block">
          <!-- Name -->
          <template v-if="isEditing">
            <div class="edit-name-row">
              <input v-model="editForm.name" class="edit-input name-input" placeholder="女优名" />
              <input v-model="editForm.name_cn" class="edit-input subname-input" placeholder="中文名" />
            </div>
          </template>
          <template v-else>
            <h1 class="actress-name">{{ actress.name || '未知' }}</h1>
            <div class="actress-subname" v-if="actress.name_cn">{{ actress.name_cn }}</div>
          </template>

          <!-- Info row -->
          <div class="info-row">
            <div class="info-item">
              生日
              <strong v-if="!isEditing">{{ actress.birthday || '未知' }}</strong>
              <input v-else v-model="editForm.birthday" class="edit-input info-edit-input" placeholder="YYYY-MM-DD" />
            </div>
            <div class="info-item">
              身高
              <strong v-if="!isEditing">{{ actress.height ? actress.height + ' cm' : '未知' }}</strong>
              <input v-else v-model="editForm.height" class="edit-input info-edit-input" placeholder="cm" />
            </div>
            <div class="info-item">
              三围
              <strong v-if="!isEditing">{{ actress.bwh || '未知' }}</strong>
              <input v-else v-model="editForm.bwh" class="edit-input info-edit-input" placeholder="xx-xx-xx" />
            </div>
            <div class="info-item">
              罩杯
              <strong v-if="!isEditing">{{ actress.cup || '未知' }}</strong>
              <input v-else v-model="editForm.cup" class="edit-input info-edit-input" placeholder="如 G" />
            </div>
            <div class="info-item">
              出道
              <strong v-if="!isEditing">{{ actress.debut_date || '未知' }}</strong>
              <input v-else v-model="editForm.debut_date" class="edit-input info-edit-input" placeholder="YYYY-MM" />
            </div>
            <div class="info-item">
              作品数
              <strong class="movie-count">{{ movies.length }}</strong>
            </div>
          </div>

          <!-- Tags: breast_type + is_mature as rose chips -->
          <div class="tag-row" v-if="!isEditing">
            <span v-if="actress.breast_type" class="rose-chip">{{ actress.breast_type }}</span>
            <span v-if="actress.is_mature" class="rose-chip">熟女</span>
          </div>
          <div class="tag-row" v-else>
            <div class="edit-tags">
              <label class="edit-tag-label">
                <span class="tag-label-text">胸部:</span>
                <select v-model="editForm.breast_type" class="edit-select">
                  <option value="">无</option>
                  <option value="人工">人工</option>
                  <option value="天然">天然</option>
                </select>
              </label>
              <label class="edit-tag-label">
                <input type="checkbox" v-model="editForm.is_mature" class="edit-checkbox" />
                <span>熟女</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Works list title + filter -->
      <div class="works-bar">
        <span class="works-title">作品列表 · {{ movies.length }} 部</span>
        <div class="filter-group">
          <span
            v-for="f in filters"
            :key="f.key"
            class="tag"
            :class="{ active: activeFilter === f.key }"
            @click="activeFilter = f.key"
          >{{ f.label }}</span>
        </div>
      </div>

      <!-- Empty works -->
      <div class="empty-works" v-if="filteredMovies.length === 0 && !loadingMovies">
        <div class="icon">📭</div>
        <div class="msg">女优存在但没有作品</div>
        <div class="sub">暂无符合条件的影片</div>
      </div>

      <!-- Works grid -->
      <div class="grid" v-else-if="filteredMovies.length > 0">
        <MovieCard
          v-for="m in filteredMovies"
          :key="m.id"
          :movie="m"
          @deleted="onMovieDeleted"
          @favChanged="onMovieFavChanged"
        />
      </div>

      <!-- Loading movies -->
      <div class="loading-state" v-else-if="loadingMovies">
        <div class="spinner"></div>
        <span>正在加载作品列表...</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'

const route = useRoute()
const router = useRouter()

// State
const actress = ref<any>(null)
const movies = ref<any[]>([])
const loading = ref(true)
const loadingMovies = ref(false)
const error = ref<string | null>(null)
const isEditing = ref(false)
const activeFilter = ref('all')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'uncensored', label: '无码' },
  { key: 'censored', label: '有码' },
  { key: 'subtitle', label: '中字' }
]

const editForm = ref({
  name: '',
  name_cn: '',
  birthday: '',
  height: '',
  bwh: '',
  cup: '',
  debut_date: '',
  breast_type: '',
  is_mature: false
})

// Computed
const filteredMovies = computed(() => {
  const f = activeFilter.value
  if (f === 'all') return movies.value
  if (f === 'uncensored') return movies.value.filter((m: any) => m.is_uncensored)
  if (f === 'censored') return movies.value.filter((m: any) => !m.is_uncensored)
  if (f === 'subtitle') return movies.value.filter((m: any) => m.has_subtitle)
  return movies.value
})

// Methods
async function fetchActress() {
  const id = Number(route.params.id)
  if (isNaN(id)) {
    error.value = '无效的女优 ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    const result = await window.api.getActress(id)
    if (!result) {
      error.value = '女优不存在'
      return
    }
    actress.value = result
    // Initialize edit form
    editForm.value = {
      name: result.name || '',
      name_cn: result.name_cn || '',
      birthday: result.birthday || '',
      height: result.height ? String(result.height) : '',
      bwh: result.bwh || '',
      cup: result.cup || '',
      debut_date: result.debut_date || '',
      breast_type: result.breast_type || '',
      is_mature: !!result.is_mature
    }
    // Fetch movies
    fetchMovies(id)
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchMovies(actressId: number) {
  loadingMovies.value = true
  try {
    const result = await window.api.getActressMovies(actressId)
    movies.value = result || []
  } catch (err) {
    console.error('Failed to fetch movies:', err)
    movies.value = []
  } finally {
    loadingMovies.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/actresses')
  }
}

async function toggleFav() {
  if (!actress.value) return
  try {
    const result = await window.api.toggleActressFavorite(actress.value.id)
    actress.value.is_favorite = result
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

async function toggleEdit() {
  if (!actress.value) return

  if (!isEditing.value) {
    isEditing.value = true
    return
  }

  // Save
  try {
    const payload: any = {}
    if (editForm.value.name !== (actress.value.name || '')) payload.name = editForm.value.name
    if (editForm.value.name_cn !== (actress.value.name_cn || '')) payload.name_cn = editForm.value.name_cn
    if (editForm.value.birthday !== (actress.value.birthday || '')) payload.birthday = editForm.value.birthday
    const heightNum = editForm.value.height ? parseInt(editForm.value.height) : null
    if (heightNum !== actress.value.height) payload.height = heightNum
    if (editForm.value.bwh !== (actress.value.bwh || '')) payload.bwh = editForm.value.bwh
    if (editForm.value.cup !== (actress.value.cup || '')) payload.cup = editForm.value.cup
    if (editForm.value.debut_date !== (actress.value.debut_date || '')) payload.debut_date = editForm.value.debut_date
    if (editForm.value.breast_type !== (actress.value.breast_type || '')) payload.breast_type = editForm.value.breast_type
    if (editForm.value.is_mature !== !!actress.value.is_mature) payload.is_mature = editForm.value.is_mature

    if (Object.keys(payload).length > 0) {
      const updated = await window.api.updateActress(actress.value.id, payload)
      // Merge updated fields
      Object.assign(actress.value, updated || payload)
    }
    isEditing.value = false
  } catch (err) {
    console.error('Failed to save:', err)
  }
}

function onMovieDeleted(id: number) {
  movies.value = movies.value.filter((m: any) => m.id !== id)
}

function onMovieFavChanged(id: number, isFav: boolean) {
  const m = movies.value.find((m: any) => m.id === id)
  if (m) m.is_favorite = isFav
}

// Lifecycle
onMounted(() => {
  fetchActress()
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
  margin-bottom: 24px;
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

/* ===== Actress Hero Section ===== */
.actress-hero {
  display: flex;
  gap: 28px;
  align-items: flex-start;
  margin-bottom: 28px;
}

.avatar-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: var(--surface);
  border: 3px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  flex-shrink: 0;
  transition: var(--transition);
}
.avatar-circle:hover {
  border-color: var(--accent2);
}

.info-block {
  flex: 1;
  min-width: 0;
}

.actress-name {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 26px;
  color: var(--accent2);
  line-height: 1.2;
}
.actress-subname {
  font-size: 13px;
  color: var(--fg3);
  margin-top: 4px;
}

/* Edit name row */
.edit-name-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.name-input {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  color: var(--accent2);
  max-width: 260px;
}
.subname-input {
  font-size: 14px;
  max-width: 200px;
}

/* Info row */
.info-row {
  display: flex;
  gap: 20px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.info-item {
  font-size: 12px;
  color: var(--fg4);
}
.info-item strong {
  display: block;
  color: var(--fg);
  font-weight: 400;
  font-size: 13px;
  margin-top: 2px;
}
.info-item .movie-count {
  color: var(--accent2);
  font-weight: 700;
}

/* Tag row */
.tag-row {
  margin-top: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.rose-chip {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  background: rgba(162, 74, 58, .2);
  color: var(--rose);
  border: 1px solid rgba(162, 74, 58, .25);
}

/* Edit tags */
.edit-tags {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.edit-tag-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--fg3);
  cursor: pointer;
}
.tag-label-text {
  color: var(--fg4);
}
.edit-select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 10px;
  color: var(--fg);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: var(--transition);
}
.edit-select:focus {
  border-color: var(--accent);
}
.edit-checkbox {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
}

/* ===== Works bar ===== */
.works-bar {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}
.works-title {
  font-size: 13px;
  color: var(--fg3);
  font-weight: 600;
}
.filter-group {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.filter-group .tag {
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--fg3);
  cursor: pointer;
  transition: var(--transition);
}
.filter-group .tag:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.filter-group .tag.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* ===== Works grid ===== */
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  padding-bottom: 40px;
}

/* ===== Empty works ===== */
.empty-works {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 8px;
  color: var(--fg4);
}
.empty-works .icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: .4;
}
.empty-works .msg {
  font-size: 15px;
  color: var(--fg);
}
.empty-works .sub {
  font-size: 12px;
  color: var(--fg4);
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
.info-edit-input {
  font-size: 13px;
  color: var(--fg);
  font-weight: 400;
  min-width: 100px;
  margin-top: 2px;
}
</style>
