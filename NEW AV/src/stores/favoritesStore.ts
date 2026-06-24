import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const activeTab = ref<'movies' | 'actresses'>('movies')
  const movies = ref<any[]>([])
  const actresses = ref<any[]>([])
  const movieTotal = ref(0)
  const actressTotal = ref(0)
  const moviePage = ref(1)
  const actressPage = ref(1)
  const loading = ref(false)

  async function loadFavorites(reset = false) {
    if (loading.value) return
    loading.value = true
    try {
      if (reset) { moviePage.value = 1; actressPage.value = 1; movies.value = []; actresses.value = [] }

      const mResult = await window.api.getMovies({
        category: undefined,
        sort: 'created_at',
        page: moviePage.value,
        pageSize: 20,
        isFavorite: true
      })
      const favMovies = mResult.movies.filter((m: any) => m.is_favorite)
      if (reset) movies.value = favMovies
      else movies.value.push(...favMovies)
      movieTotal.value = mResult.total
      moviePage.value++

      const aResult = await window.api.getActresses({
        sort: 'name',
        page: actressPage.value,
        pageSize: 20
      })
      const favActresses = aResult.actresses.filter((a: any) => a.is_favorite)
      if (reset) actresses.value = favActresses
      else actresses.value.push(...favActresses)
      actressTotal.value = aResult.total
      actressPage.value++
    } catch {}
    finally { loading.value = false }
  }

  function setTab(tab: 'movies' | 'actresses') { activeTab.value = tab }

  return { activeTab, movies, actresses, movieTotal, actressTotal, loading, loadFavorites, setTab }
})
