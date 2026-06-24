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
