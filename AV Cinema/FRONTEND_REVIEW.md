# AV Cinema 集成版前端评估报告

评估目标：`C:\Users\Administrator\Desktop\CLADUE\AV Cinema\av-cinema-integrated`

---

## 致命问题（应用无法启动）

### 1. index.html 同时包含两套应用，互相冲突

`index.html` 里写了 562 行内联代码——包含了旧版单页应用的**全部 DOM 结构、全部 CSS、全部 JS 逻辑**（导航、渲染、数据管理）。同时 `main.js` 又要初始化 Vue 3 + Element Plus + Vue Router 去挂载一个 `#app` 节点——**但 index.html 里根本没有 `<div id="app">`**。

后果：Vue 应用挂载不了，旧版 SPA 的内联代码又占着 DOM。两套系统死锁，浏览器一片空白。

**修正方法**：把 `index.html` 里的 562 行内联代码全部删掉，替换成：
```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

### 2. 缺少 vite.config.js

所有 `import ... from '@/...'` 都需要 `vite.config.js` 配置 `@` 路径别名。项目根目录**没有这个文件**，Vite 构建时会提示找不到模块。

**修正方法**：创建 `vite.config.js`：
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  base: './'
})
```

---

## 高严重度问题

### 3. ActressDetail.vue 第 311 行：调用了不存在的函数

```js
loadMovies()  // 这个函数没有定义
```

行 311 的代码路径尝试调用 `loadMovies()`，但整个文件中不存在这个函数（正确的函数名应该是 `loadRelatedMovies()`）。在 Electron 模式下编辑女优名字保存后会崩溃。

### 4. WebsiteList.vue 第 115 行：未检查 Electron 环境

```js
await window.electronAPI.addWebsite(editForm.value)
```

`window.electronAPI` 只在 Electron 模式下存在。浏览器模式下 `window.electronAPI` 是 `undefined`，这行代码会直接报错。

### 5. AddMovie.vue 多处：原生 `<button>` 用了 `:loading`

```html
<button class="btn" ... :loading="batchLoading">
```

`:loading` 是 Element Plus `<el-button>` 组件的属性，原生 HTML `<button>` 不认这个，没有任何效果。应该换成 `<el-button>`。

---

## 中严重度问题

### 6. ActressList.vue：无限递归风险

`actressLoadMore` 函数（第 125 行附近）在内容不足以填满视口时，会通过 `nextTick` 反复调用自身。如果视口高度始终大于内容高度，这个递归会无限循环直至栈溢出。缺少最大递归次数限制。

### 7. Favorites.vue（Pinia store）：收藏删除后不同步

`removeMovie` 和 `removeActress` 不管 IPC 是否成功，都直接修改了本地缓存数组。如果后端删除失败（`removeLike` 返回 false），前端已经把人移除了，刷新后数据又会重新出现，造成不一致。

### 8. MovieList.vue：标记筛选只出现在 AV 分类

zz/pj/lc（中字/破解/无码）的筛选复选框只在 `categoryKey === 'AV'` 时显示。动漫/欧美/国产分类下这些标记就不显示了（原始版本是始终显示的）。

### 9. Settings.vue：代理功能有代码无界面

`proxyAddr`、`testProxy`、`detectProxy` 等变量和函数都定义了，但模板里没有对应的 UI 控件，只在返回按钮附近隐藏了。用户没法用这些功能。

---

## 低严重度问题

### 10. 多处未使用的 import

| 文件 | 未使用的 import | 行号 |
|---|---|---|
| MovieList.vue | `getMovieThumbnail` | 90 |
| MovieDetail.vue | `addLike, removeLike` | 134 |
| MovieDetail.vue | `Search` 图标 | 136 |
| ActressList.vue | `Document` 图标 | 94 |

### 11. ActressDetail.vue：翻译按钮缺失

`translateActressName` 函数定义在第 125 行，但模板里没有任何按钮调用它。女优名字翻译功能有代码但用户找不到入口。

### 12. MovieDetail.vue 第 161 行：无防御代码

```js
return movie.value.ph.replace(/-(C|U|UC)$/, '')
```

如果 `movie.value.ph` 为 `undefined`，`.replace()` 会崩溃。虽然 `|| ''` 已经检查了 falsy，但 `undefined` 也是 falsy，`displayPh` 会在 `movie.value` 为 null 时返回 `''`，不会真正崩溃。不过最好显式处理。

### 13. HTML 和 Vue 的 CSS 变量名不同

`index.html` 内联 `<style>` 定义了一套 CSS 变量（`--bg: #fcf8f3`、`--text-primary: #2d241e` 等），而 Vue 的 `global.css` 定义的是另一套（`--bg-primary: #faf8f5`、`--text-primary: #2d2a24` 等）。两套名字不同，值接近但不完全一致。如果 `index.html` 不清理掉，会有样式冲突。

---

## 功能对比总结

| 页面 | 集成版对比原版 | 详情 |
|---|---|---|
| MovieList | 大部分功能继承，随机排序缺失，标记筛选限于 AV 分类 | 略有退步 |
| MovieDetail | 大幅增强——截图轮播、编辑模式、标签排序、翻译撤回 | 明显进步 |
| ActressList | 新增无限滚动、视频状态筛选、右键删除、头像加载 | 明显进步 |
| ActressDetail | 新增头像编辑、信息编辑、标签编辑 | 明显进步 |
| AddMovie | 大幅增强——完整刮削流程、计数器、完整表单 | 明显进步 |
| TagBrowser | 大幅增强——拖拽排序、编辑模式、批量重命名 | 明显进步 |
| Favorites | 新增分页、右键取消收藏 | 明显进步 |
| WebsiteList | 大幅增强——增删改弹窗、Logo 加载 | 明显进步 |
| Settings | 代理/迁移功能代码级但无 UI、翻译提示词自定义 | 部分进步 |
| SearchResults | 一致 | 持平 |

**总体评价**：集成版的前端功能比原版丰富很多（截图编辑、标签拖拽、女优编辑、网站 CRUD、代理配置等）。但 `index.html` 保留了旧版全部代码导致死锁，加上缺少 `vite.config.js`，整个应用根本跑不起来。修复后功能上是原版的超集。
