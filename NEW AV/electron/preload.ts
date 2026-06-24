import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // 影片
  getMovies: (params: any) => ipcRenderer.invoke('getMovies', params),
  getMovie: (id: number) => ipcRenderer.invoke('getMovie', id),
  createMovie: (data: any) => ipcRenderer.invoke('createMovie', data),
  updateMovie: (id: number, data: any) => ipcRenderer.invoke('updateMovie', id, data),
  deleteMovie: (id: number) => ipcRenderer.invoke('deleteMovie', id),
  getMovieCount: () => ipcRenderer.invoke('getMovieCount'),
  playMovie: (videoPath: string) => ipcRenderer.invoke('playMovie', videoPath),
  openFileLocation: (videoPath: string) => ipcRenderer.invoke('openFileLocation', videoPath),
  toggleMovieFavorite: (id: number) => ipcRenderer.invoke('toggleMovieFavorite', id),

  // 女优
  getActresses: (params: any) => ipcRenderer.invoke('getActresses', params),
  getActress: (id: number) => ipcRenderer.invoke('getActress', id),
  updateActress: (id: number, data: any) => ipcRenderer.invoke('updateActress', id, data),
  getActressMovies: (actressId: number) => ipcRenderer.invoke('getActressMovies', actressId),
  toggleActressFavorite: (id: number) => ipcRenderer.invoke('toggleActressFavorite', id),

  // 标签
  getTagCategories: () => ipcRenderer.invoke('getTagCategories'),
  getTagsByCategory: (categoryId?: number) => ipcRenderer.invoke('getTagsByCategory', categoryId),
  createTagCategory: (data: { name: string }) => ipcRenderer.invoke('createTagCategory', data),
  deleteTagCategory: (id: number) => ipcRenderer.invoke('deleteTagCategory', id),
  createTag: (data: { name: string; categoryId: number }) => ipcRenderer.invoke('createTag', data),
  deleteTag: (id: number) => ipcRenderer.invoke('deleteTag', id),
  updateTagCategorySort: (categories: { id: number; sort: number }[]) => ipcRenderer.invoke('updateTagCategorySort', categories),

  // 网站
  getWebsites: () => ipcRenderer.invoke('getWebsites'),
  createWebsite: (data: any) => ipcRenderer.invoke('createWebsite', data),
  updateWebsite: (id: number, data: any) => ipcRenderer.invoke('updateWebsite', id, data),
  deleteWebsite: (id: number) => ipcRenderer.invoke('deleteWebsite', id),
  openWebsite: (url: string) => ipcRenderer.invoke('openWebsite', url),

  // 设置
  getSettings: () => ipcRenderer.invoke('getSettings'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('updateSetting', key, value),
  getSetting: (key: string) => ipcRenderer.invoke('getSetting', key),

  // 搜索
  searchAll: (query: string) => ipcRenderer.invoke('searchAll', query),

  // 通用（旧的ping保留）
  ping: () => ipcRenderer.invoke('ping'),
}

contextBridge.exposeInMainWorld('api', api)
