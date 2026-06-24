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
        <span v-for="tag in parsedTags.slice(0, 4)" :key="tag" :class="tagClass(tag)">
          {{ tag }}
        </span>
      </div>
    </div>
    <!-- Context menu -->
    <Teleport to="body">
      <div class="ctx-menu" v-if="ctxVisible" :style="ctxStyle" @click.stop>
        <div class="ctx-item" @click="play">▶ 播放</div>
        <div class="ctx-item" @click="openLocation">📂 打开文件位置</div>
        <div class="ctx-item" @click="goDetail">✏️ 编辑影片</div>
        <div class="ctx-sep"></div>
        <div class="ctx-item" @click="toggleFav">{{ movie.is_favorite ? '♥' : '♡' }} 收藏</div>
        <div class="ctx-item danger" @click="confirmDelete">🗑️ 删除</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ACTRESS_TAG_KEYWORDS } from '@/utils/tags'

const props = defineProps<{ movie: any }>()
const emit = defineEmits<{
  (e: 'deleted', id: number): void
  (e: 'favChanged', id: number, isFav: boolean): void
}>()

const router = useRouter()

const actressKeywords = ACTRESS_TAG_KEYWORDS

// Context menu state
const ctxVisible = ref(false)
const ctxStyle = ref({ left: '0px', top: '0px' })

// Computed
const isNew = computed(() => {
  if (!props.movie.created_at) return false
  const created = new Date(props.movie.created_at)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
})

const hasFlags = computed(() => {
  return isNew.value || props.movie.has_subtitle || props.movie.is_uncensored || props.movie.has_chinese
})

const parsedTags = computed(() => {
  if (!props.movie.tags) return []
  if (Array.isArray(props.movie.tags)) return props.movie.tags
  try {
    const parsed = typeof props.movie.tags === 'string' ? JSON.parse(props.movie.tags) : props.movie.tags
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

function tagClass(tag: string): string {
  return actressKeywords.some(kw => tag.includes(kw)) ? 'r' : 'b'
}

// Methods
function goDetail() {
  router.push(`/movie/${props.movie.id}`)
}

async function toggleFav() {
  const newFav = !props.movie.is_favorite
  try {
    await window.api.updateMovie(props.movie.id, { is_favorite: newFav })
    props.movie.is_favorite = newFav
    emit('favChanged', props.movie.id, newFav)
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

function play() {
  ctxVisible.value = false
  if (props.movie.video_path) {
    window.api.playMovie(props.movie.video_path)
  }
}

function openLocation() {
  ctxVisible.value = false
  if (props.movie.video_path) {
    window.api.openFileLocation(props.movie.video_path)
  }
}

function confirmDelete() {
  ctxVisible.value = false
  if (confirm(`确定删除「${props.movie.title || props.movie.code}」？`)) {
    window.api.deleteMovie(props.movie.id).then(() => {
      emit('deleted', props.movie.id)
    }).catch((err: any) => {
      console.error('Failed to delete movie:', err)
    })
  }
}

function showContextMenu(e: MouseEvent) {
  ctxStyle.value = { left: `${e.clientX}px`, top: `${e.clientY}px` }
  ctxVisible.value = true
}

function closeContextMenu() {
  ctxVisible.value = false
}

function onDocumentClick(e: MouseEvent) {
  if (ctxVisible.value) {
    ctxVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
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
</style>

<!-- Context menu styles are global because Teleport moves them outside the scoped root -->
<style>
.ctx-menu { position: fixed; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px; box-shadow: var(--shadow); z-index: 1000; min-width: 160px; }
.ctx-item { padding: 8px 14px; border-radius: 6px; font-size: 13px; color: var(--fg3); transition: var(--transition); cursor: pointer; }
.ctx-item:hover { background: var(--surface); color: var(--fg); }
.ctx-item.danger:hover { background: rgba(162,74,58,.2); color: var(--rose); }
.ctx-sep { margin: 4px 0; border-top: 1px solid var(--border); }
</style>
