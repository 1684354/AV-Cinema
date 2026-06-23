# 完整代码审查报告

## 概述

回退后的代码为原始版本，main.cjs（44 个 IPC handler）和 preload.cjs（18 个 API）之间存在较大的桥接缺口。

---

## 问题 1：数据库加载失败（最高优先级）

### 现象
应用启动时 `initDatabase()` 调用 `new SQL.Database(buffer)` 抛出 `database disk image is malformed`。

### 根因
`data.dll`（17,667,840 字节）文件头声明的页数是 1735，实际文件只有 1726 页——**缺失 9 页（~9KB）**。sql.js 严格校验文件头，直接崩溃。

### 影响
`db` 变量保持为 `null`。所有查询返回空数组，所有写入返回 `'数据库未连接'`，整个应用事实上不可用。

### 修复
在 `initDatabase()` 中读取 buffer 后、传给 `new SQL.Database()` 前，检查并修复文件头：

```javascript
let buffer = fs.readFileSync(DB_PATH)
if (buffer.length >= 100) {
  const pageSize = buffer.readUInt16BE(16)
  if (pageSize >= 512 && pageSize <= 65536) {
    const declared = buffer.readUInt32BE(28)
    const actual = Math.floor(buffer.length / pageSize)
    if (declared > actual) {
      buffer.writeUInt32BE(actual, 28)
    }
  }
}
```

---

## 问题 2：preload.cjs API 严重不足（最高优先级）

main.cjs 有 44 个 IPC handler，preload.cjs 只暴露了 18 个。以下功能不可用：

### 缺失的 API 清单

| 类别 | 缺失的 API | 调用的前端代码 |
|------|-----------|---------------|
| 视频播放 | `playVideo` → `video:play` | dataService.js `playVideo()` |
| 配置 | `setMediaRoot`, `getPlayerPath`, `setPlayerPath` | dataService.js + Settings.vue |
| 写入 | `updateMovieRating`, `updateMovieTags`, `updateTagClass`, `addLike`, `removeLike`, `addMovie`, `deleteMovie`, `deleteActress`, `editWebsite`, `deleteWebsite` | dataService.js |
| 刮削 | `getScrapeSources`, `openInBrowser`, `fetchMovieInfo`, `organizeFiles`, `extractPh` | dataService.js + AddMovie.vue + WebsiteList.vue |
| 窗口 | `showOpenDialog` | AddMovie.vue `selectFile()` |
| 迁移 | 无（已暴露 `getMigrationStatus` 和 `runMigration`） | — |
| 翻译 | 无（main.cjs 中有 handler 但 preload 未暴露） | — |

### preload.cjs 目前只覆盖了 18 个 API

```
getCategories, getActressCategories, getMovies, getMovie,
getActresses, getActress, getLikes, getWebsites, search, getStats,
getActressAvatar, getMovieThumbnail, getMovieScreenshots,
getMediaRoot, setMediaRoot,
minimize, maximize, close
```

---

## 问题 3：刮削没有封面图片

### 根因
`AddMovie.vue` L161 调用 `organizeFiles` 时**没有传入 `coverUrl`**：

```javascript
orgResult = await organizeFiles({
  sourcePath: file.path, ph, category: cat, mediaRoot: 'G:\\aiqiyi'
  // ← coverUrl: movie?.cover 缺失
})
```

`fetchMovieInfo(ph)` 返回的数据中包含 `data.cover`（JavDB 封面 URL），但没传下去。

`organizeFiles` handler（main.cjs L910）解构了 `coverUrl` 参数：
```javascript
const { sourcePath, ph, category, mediaRoot: root, coverUrl } = params
//                                    coverUrl = undefined
if (coverUrl) {
  // ← 条件不成立，封面下载被跳过
}
```

### 修复
```javascript
orgResult = await organizeFiles({
  sourcePath: file.path, ph, category: cat, mediaRoot: 'G:\\aiqiyi',
  coverUrl: movie?.cover || ''
})
```

---

## 问题 4：空截图文件导致缩略图栏异常

### 根因
`organizeFiles`（main.cjs L980-985）创建 21 个截图占位文件，但其中只有 `p1.jpg`（封面）可能不为空：

```javascript
for (let i = 1; i <= 21; i++) {
  const jtFile = path.join(targetDir, `${ph}-p${i}.jpg`)
  if (!fs.existsSync(jtFile)) {
    try { require('fs').writeFileSync(jtFile, '') } catch {} // ← 0 字节空文件
  }
}
```

`readImageAsBase64`（main.cjs L183-190）只检查文件存在性，不检查大小：
```javascript
function readImageAsBase64(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) { return null }
    // ← 文件存在但大小为 0，filePath 通过检查
    return `data:image/jpeg;base64,${fs.readFileSync(filePath).toString('base64')}`
    //                                            ↑ 空 Buffer → 空字符串
  } catch { return null }
}
```

前端 `filter(Boolean)` 无法过滤空 base64 字符串。

### 影响
详情页的 `screenshots` 数组包含 21 个元素（1 个有效图 + 20 个空图），缩略图栏显示大量破损图片。

### 修复
在 `readImageAsBase64` 中增加文件大小检查：
```javascript
if (!filePath || !fs.existsSync(filePath)) { return null }
if (fs.statSync(filePath).size === 0) { return null } // ← 新增
```

---

## 问题 5：`addActress` / `addWebsite` / `editActress` handler 缺失

### 现象
main.cjs 中有 `editWebsite` handler（L415），但**没有** `addActress`、`addWebsite` 和 `editActress` 的 IPC handler。

### 调用的前端代码
- `AddMovie.vue` L228: `window.electronAPI.addActress(data)`
- `AddMovie.vue` L236: `window.electronAPI.addWebsite(data)`
- `ActressDetail.vue` L193: `window.electronAPI.editActress(id, field, value)`

### 需要添加的 handler
```javascript
// db:addActress
ipcMain.handle('db:addActress', (event, data) => {
  if (!db) return { success: false, error: '数据库未连接' }
  try {
    const stmt = db.prepare('INSERT INTO femas (mz, bm, cs, sg, zb, xw, yw, tw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    stmt.bind([data.mz, data.bm || '', data.cs || '', data.sg || '', data.zb || '', data.xw || '', data.yw || '', data.tw || ''])
    stmt.step()
    stmt.free()
    persistDb()
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
})

// db:addWebsite
ipcMain.handle('db:addWebsite', (event, data) => {
  if (!db) return { success: false, error: '数据库未连接' }
  try {
    const stmt = db.prepare('INSERT INTO website (zm, wz, fl, ms, tjrq) VALUES (?, ?, ?, ?, ?)')
    stmt.bind([data.zm, data.wz, data.fl || '', data.ms || '', Date.now()])
    stmt.step()
    stmt.free()
    persistDb()
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
})

// db:editActress
ipcMain.handle('db:editActress', (event, id, field, value) => {
  if (!db) return { success: false, error: '数据库未连接' }
  const allowed = ['mz','bm','cs','sg','zb','xw','yw','tw','bz']
  if (!allowed.includes(field)) return { success: false, error: '无效字段' }
  try {
    db.run(`UPDATE femas SET ${field} = ? WHERE id = ?`, [value, id])
    persistDb()
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
})
```

---

## 问题 6：`getActressCategories` 在 main.cjs 中不存在

### 现象
preload.cjs L6 暴露了：
```javascript
getActressCategories: () => ipcRenderer.invoke('db:getActressCategories')
```

但 main.cjs 中没有 `db:getActressCategories` 这个 handler。前端的路由 `getActressCategories` 不存在。

---

## 问题 7：`getActressesWithVideo` 未在 preload 暴露

### 现象
dataService.js 调用 `electronCall('getActressesWithVideo')`，main.cjs 有 `db:getActressesWithVideo` handler（L319），但 preload.cjs 中没有对应的 API。

ActressList.vue `onMounted` 中调用了 `getActressesWithVideo()`：
```javascript
if (isElectron) actresses.value = await getActressesWithVideo()
// 因为 preload 无此 API → electronAPI.getActressesWithVideo = undefined
// → 在 isElectron=true 时调用 undefined 会报错或静默失败
```

---

## 问题 8：翻译功能在前端调用和 IPC 之间不匹配

### main.cjs 已有的 handler（3 个）
- `translate:text` — Google 翻译单条文本
- `translate:batchActressNames` — 批量翻译女优名
- `translate:batchMovieTitles` — 批量翻译片名

### preload 未暴露
- `translateText` → `translate:text` 未暴露
- `batchTranslateActresses` → `translate:batchActressNames` 未暴露
- `batchTranslateMovies` → `translate:batchMovieTitles` 未暴露

### Vue 视图直接调用以下 API（在 main 和 preload 都不存在）
- `translateTitle(id, pm, apiKey)` — MovieDetail.vue L215（DeepSeek 翻译，不是 Google 翻译）
- `translateProgress()` — ActressList.vue L164, MovieList.vue L158
- `translateStop()` — ActressList.vue L190, MovieList.vue L169
- `translateBatchActresses(key)` — ActressList.vue L174
- `translateBatchMovies(key)` — MovieList.vue L161

Vue 视图传递了 `apiKey`（DeepSeek API Key），但 main.cjs 的 handler 用的是 Google 免费翻译 API，参数不兼容。

---

## 问题 9：Settings.vue 中 `setProxy` / `testProxy` handler 缺失

main.cjs 中没有 `config:setProxy` 和 `config:testProxy` handler，但 Settings.vue L164/L174 调用了：
```javascript
await window.electronAPI.setProxy(proxyAddr.value)
const r = await window.electronAPI.testProxy(proxyAddr.value)
```

---

## 摘要

| # | 问题 | 优先级 | 影响范围 |
|---|------|--------|---------|
| 1 | 数据库 page count 未修复，sql.js 崩溃 | 🔴 | 整个应用不可用 |
| 2 | preload 只暴露 18/44 个 API | 🔴 | 写入/刮削/配置/翻译全部不可用 |
| 3 | organizeFiles 没传 coverUrl | 🔴 | 刮削无封面图 |
| 4 | readImageAsBase64 过滤不了 0 字节文件 | 🟡 | 缩略图栏出现破损图片 |
| 5 | addActress / addWebsite / editActress handler 缺失 | 🟡 | 手动添加女优/网站/编辑女优失败 |
| 6 | getActressCategories IPC channel 不存在 | 🟡 | 预检失败 |
| 7 | getActressesWithVideo 未在 preload 暴露 | 🟡 | 女优列表首次加载可能空白 |
| 8 | 翻译 API 参数不兼容（DeepSeek vs Google） | 🟡 | 翻译功能全链路失效 |
| 9 | setProxy / testProxy handler 缺失 | 🟢 | 代理设置不生效 |

### 修复顺序建议

1. **🔴 修复数据库加载**（问题 1）— 让应用能启动
2. **🔴 补全 preload.cjs**（问题 2）— 让所有 IPC 通路连通
3. **🔴 修复 organizeFiles coverUrl**（问题 3）— 让刮削能下载封面
4. **🟡 修复空文件过滤**（问题 4）— 让预览图正常显示
5. **🟡 补充缺失的 IPC handler**（问题 5/6/9）— 让写入功能完整
6. **🟡 对齐翻译 API**（问题 8）— 让翻译回归
