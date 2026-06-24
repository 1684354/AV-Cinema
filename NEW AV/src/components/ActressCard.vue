<template>
  <div class="acard" @click="goDetail">
    <div class="avatar">
      <img v-if="actress.avatar_path" :src="'file:///' + actress.avatar_path.replace(/\\/g, '/')" class="avatar-img" @error="avatarError = true" />
      <span v-if="!actress.avatar_path || avatarError" class="avatar-fallback">🎭</span>
    </div>
    <div class="aname">{{ actress.name || '未知' }}</div>
    <div class="asub">
      <span v-if="actress.cup">{{ actress.cup }}罩杯</span>
      <span v-if="actress.height">{{ actress.height }}cm</span>
    </div>
    <div class="acount">{{ actress.movie_count || 0 }} 部作品</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ actress: any }>()
const router = useRouter()
const avatarError = ref(false)

function goDetail() {
  router.push(`/actress/${props.actress.id}`)
}
</script>

<style scoped>
.acard {
  background: var(--bg2);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 20px 16px 16px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.acard:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0,0,0,.4), 0 0 0 1px rgba(162,74,58,.25);
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--surface), var(--border));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}
.avatar .avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar .avatar-fallback { font-size: 32px; }

.aname {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
  line-height: 1.3;
}

.asub {
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: var(--fg3);
}

.acount {
  font-size: 11px;
  color: var(--accent2);
  font-weight: 600;
  margin-top: 2px;
}
</style>
