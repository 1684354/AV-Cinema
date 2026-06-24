# AV Cinema — 本地影片管理软件 设计文档

> 日期：2026-06-24
> 状态：设计定稿
> 技术栈：Electron + Vue 3 + TypeScript + better-sqlite3

---

## 1. 项目概述

本地影片收藏管理桌面应用，运行于 Windows。管理影片元数据、女优资料、标签分类、收藏和播放。从旧版 AV Cinema（Vue 3 + sql.js + Element Plus）迁移数据并全面重构架构。

---

## 2. 技术架构

### 2.1 技术选型

| 层面 | 技术 | 理由 |
|------|------|------|
| 桌面壳 | Electron | UI 表现力最强，暖色调/卡片动画/过渡效果轻松实现 |
| 前端框架 | Vue 3 + Composition API + TypeScript | 沿用现有项目熟悉的生态，类型安全 |
| UI 组件库 | Element Plus | 与 Vue 3 原生集成，组件丰富 |
| 状态管理 | Pinia | Vue 3 官方推荐 |
| 路由 | Vue Router (hash history) | SPA 路由，保持与旧版一致 |
| 数据库 | better-sqlite3 | 同步 API，直接读写磁盘，比 sql.js 快 10-100 倍 |
| 打包 | electron-builder | Windows 安装包构建 |
| 构建 | Vite | 快速 HMR，TypeScript 原生支持 |

### 2.2 架构分层

```
Electron Main Process
├── database/      → 数据库层：连接管理、表定义、迁移
├── services/      → 业务逻辑层：影片/女优/标签/搜索/文件/抓取
└── ipc/           → IPC 通信层：薄翻译层，暴露 API 给渲染进程

Electron Renderer Process
├── Pinia stores   → 状态管理
├── Vue Router     → 路由
├── views/         → 页面组件
└── components/    → 通用 UI 组件
```

### 2.3 目录结构

```
av-cinema/
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── database/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   │       └── 001_import_legacy.ts
│   ├── services/
│   │   ├── movieService.ts
│   │   ├── actressService.ts
│   │   ├── tagService.ts
│   │   ├── websiteService.ts
│   │   ├── searchService.ts
│   │   ├── crawlService.ts
│   │   ├── fileService.ts
│   │   └── settingsService.ts
│   └── ipc/
│       ├── movieIpc.ts
│       ├── actressIpc.ts
│       ├── tagIpc.ts
│       ├── websiteIpc.ts
│       ├── crawlIpc.ts
│       ├── settingsIpc.ts
│       └── searchIpc.ts
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── styles/
│   │   └── theme.scss
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   ├── movieStore.ts
│   │   ├── actressStore.ts
│   │   ├── uiStore.ts
│   │   └── favoritesStore.ts
│   ├── views/
│   │   ├── MovieList.vue
│   │   ├── MovieDetail.vue
│   │   ├── ActressList.vue
│   │   ├── ActressDetail.vue
│   │   ├── Favorites.vue
│   │   ├── TagBrowser.vue
│   │   ├── WebsiteList.vue
│   │   ├── AddMovie.vue
│   │   ├── SearchResults.vue
│   │   └── Settings.vue
│   └── components/
│       ├── MovieCard.vue
│       ├── ActressCard.vue
│       ├── TagChip.vue
│       ├── ScreenshotGrid.vue
│       ├── Sidebar.vue
│       └── SearchBar.vue
├── package.json
├── vite.config.ts
├── electron-builder.yml
├── tsconfig.json
└── docs/superpowers/specs/2026-06-24-av-cinema-design.md
```

---

## 3. 视觉设计

### 3.1 色彩系统（暗色主题）

| Token | 色值 | 用途 |
|-------|------|------|
| `--bg` | `#1a1513` | 主背景 |
| `--bg2` | `#1f1a17` | 面板/卡片背景 |
| `--bg3` | `#0f0c0b` | 深色强调区（预览区） |
| `--surface` | `#25201d` | 输入框/悬停态 |
| `--border` | `#2a2320` | 边框/分割线 |
| `--fg` | `#f0ebe7` | 主文字 |
| `--fg2` | `#cfa899` | 暖灰次要文字 |
| `--fg3` | `#8a7a72` | 辅助文字 |
| `--fg4` | `#5a4d45` | 最淡文字 |
| `--accent` | `#a24a3a` | 强调色（按钮/选中态） |
| `--accent2` | `#d98e6a` | 暖橙强调（番号/标题） |
| `--rose` | `#e88a7a` | 女优标签色 |
| `--blue` | `#7ab8e8` | 影片标签色 |

### 3.2 字体

- 标题：Georgia, serif（衬线体）
- 正文/UI：'Segoe UI', system-ui, sans-serif（无衬线体）

### 3.3 关键 UI 模式

- 圆角：卡片 16px、小元素 8-10px、按钮 20px（药丸形）
- 阴影：`0 4px 16px rgba(0,0,0,.3)`（柔和阴影，弹窗加深）
- 卡片悬停：`translateY(-5px)` + 阴影放大 + 1px 玫瑰色边框发光
- 过渡：`all .25s cubic-bezier(.4,0,.2,t)`
- 滚动条：窄 5px，圆角，暗色

---

## 4. 数据库设计

### 4.1 数据库文件

新数据库：`AV_CINEMA.db`（位置：用户数据目录或媒体根目录下的 `DataBase/`）

### 4.2 movies 表

```sql
CREATE TABLE movies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category      TEXT NOT NULL,        -- AV/动漫/欧美/国产
  code          TEXT,                 -- 番号（可重复，非唯一）
  title         TEXT,                 -- 原片名
  title_cn      TEXT DEFAULT '',      -- 翻译后的中文片名
  actress_ids   TEXT DEFAULT '[]',    -- JSON: [1, 2, 3]
  actresses     TEXT DEFAULT '',      -- 女优名（空格分隔，兼容旧数据）
  release_date  TEXT DEFAULT '',      -- 发行日期 YYYY-MM-DD
  duration      INTEGER DEFAULT 0,   -- 时长（分钟）
  series        TEXT DEFAULT '',      -- 系列
  tags          TEXT DEFAULT '[]',    -- JSON: ["标签1", "标签2"]
  has_subtitle  INTEGER DEFAULT 0,   -- 1=有中文字幕
  is_uncensored INTEGER DEFAULT 0,   -- 1=无码
  has_chinese   INTEGER DEFAULT 0,   -- 1=中文/破解版
  play_count    INTEGER DEFAULT 0,   -- 播放次数
  cover_path    TEXT DEFAULT '',      -- 封面路径
  screenshot_paths TEXT DEFAULT '[]',-- JSON: [路径数组]
  video_path    TEXT DEFAULT '',      -- 视频文件路径
  file_size     INTEGER DEFAULT 0,   -- 文件大小（字节）
  source        TEXT DEFAULT '',      -- 数据来源：manual/crawl/legacy
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
);

-- 索引
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_code ON movies(code);
CREATE INDEX idx_movies_release_date ON movies(release_date);
CREATE INDEX idx_movies_created_at ON movies(created_at);
```

### 4.3 actresses 表

```sql
CREATE TABLE actresses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,         -- 日文名/英文名
  name_cn       TEXT DEFAULT '',       -- 中文名
  category      TEXT DEFAULT 'AV',     -- 分类
  birthday      TEXT DEFAULT '',       -- 生日 YYYY-MM-DD
  debut_date    TEXT DEFAULT '',       -- 出道日期 YYYY-MM
  height        INTEGER DEFAULT 0,    -- 身高 cm
  bust          INTEGER DEFAULT 0,    -- 胸围
  waist         INTEGER DEFAULT 0,    -- 腰围
  hips          INTEGER DEFAULT 0,    -- 臀围
  cup           TEXT DEFAULT '',       -- 罩杯
  breast_type   TEXT DEFAULT '',       -- 胸型：人工/天然
  is_mature     INTEGER DEFAULT 0,    -- 熟女标记
  is_favorite   INTEGER DEFAULT 0,    -- 收藏
  avatar_path   TEXT DEFAULT '',       -- 头像路径
  movie_count   INTEGER DEFAULT 0,    -- 作品数
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX idx_actresses_name ON actresses(name);
```

### 4.4 其他表

```sql
-- 标签分类
CREATE TABLE tag_categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0
);

-- 标签
CREATE TABLE tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category_id INTEGER REFERENCES tag_categories(id),
  sort        INTEGER DEFAULT 0
);

-- 网站导航
CREATE TABLE websites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT DEFAULT '',        -- 分类：番号库/在线站等
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_path   TEXT DEFAULT '',
  sort        INTEGER DEFAULT 0
);

-- 设置
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- 迁移记录
CREATE TABLE migration_log (
  version    INTEGER PRIMARY KEY,
  desc       TEXT,
  applied_at TEXT DEFAULT (datetime('now','localtime'))
);
```

### 4.5 旧数据迁移

首次启动时检测 `data.dll` 存在且 `migration_log` 为空，自动执行一次性迁移：

- `movies` → 逐字段映射
- `femas` → `actresses`（丢弃 rating, status）
- `website` → `websites`
- `tagclas` → 展开为 `tag_categories` + `tags`
- `likes` → 标记 `is_favorite`
- `settings` → 写入 `settings` 表
- `movie_actress` → 不保留，转为 JSON 写入 movies.actress_ids

---

## 5. 路由与页面

### 5.1 路由表

| 路径 | 视图 | 说明 |
|------|------|------|
| `/` | 重定向 | → `/category/all` |
| `/category/:type` | MovieList | type=all/av/anime/euro/cn |
| `/movie/:id` | MovieDetail | 影片详情 |
| `/actresses` | ActressList | 女优列表 |
| `/actress/:id` | ActressDetail | 女优详情 |
| `/favorites` | Favorites | 收藏（Tab 切影片/女优） |
| `/tags` | TagBrowser | 标签浏览 |
| `/websites` | WebsiteList | 网站导航 |
| `/add` | AddMovie | 添加影片 |
| `/search?q=xxx` | SearchResults | 全局搜索 |
| `/settings` | Settings | 设置 |

### 5.2 页面设计

采用**深色沉浸式主题（暗房影集风格）**：

**侧边栏**：固定宽度 200px，包含浏览（全部/AV/动漫/欧美/国产）、发现（女优/收藏/标签/网站）、管理（添加/设置）三组导航，带数字徽标。

**顶栏**：搜索框（全局搜索）+ 随机按钮。在详情页自动隐藏。

**影片列表页**：
- 排序栏：加入日期 / 发行日期 / 女优名 / 播放次数 / 随机
- 筛选：中文字幕 / 破解版 / 无码（toggle 按钮）
- 卡片网格 5 列，圆角 16px，悬停浮起发光
- 右键卡片弹出菜单（播放/打开位置/编辑/收藏/删除）
- 滚动到底加载更多
- 记住滚动位置

**影片详情页**：
- 大图预览 + 导航点 + 截图胶卷条（缩略图行，可拖拽）
- 信息面板：番号（可复制）、女优名（可点击跳转）、发行日期、时长、系列、播放次数
- 标签区分色：女优相关→玫瑰红 `var(--rose)`、影片相关→蓝色 `var(--blue)`
- 操作按钮：播放 / 翻译片名 / 打开位置
- 编辑模式切换（字段变输入框、标签分类选择器、截图增删）

**女优列表页**：圆形头像 + 名字 + 罩杯 + 身高 + 作品数，分类筛选
**女优详情页**：大头像、全信息（三围/生日/出道/胸型标签/熟女标记）、作品列表
**收藏页**：影片/女优双 Tab，超过 20 条自动分页
**标签浏览页**：按分类分组，标签计数，新增分类
**网站导航页**：卡片网格 + 名称/URL/描述，可增删改
**添加影片页**：输入番号 → 自动抓取信息
**设置页**：播放器路径、媒体根目录、翻译 API、女优同步、关联影片

### 5.3 状态处理

每个页面需覆盖四种状态：

| 状态 | 展示 |
|------|------|
| 正常 | 数据内容渲染 |
| 空状态 | 图标 + 文案提示 + 行动按钮 |
| 加载中 | 旋转动画 + "正在加载..." |
| 错误 | 错误图标 + 描述 + 重试按钮 |

---

## 6. 功能模块

### 6.1 影片管理

- CRUD 全操作，番号不设唯一约束（欧美影片用女优名当番号）
- 唯一性校验通过视频文件路径保证
- 排序：加入日期/发行日期/女优名/播放次数/随机
- 筛选：中文字幕/破解版/无码（多选交集）
- 分类筛选：全部/AV/动漫/欧美/国产
- 无限滚动（每次 20 条）
- 滚动位置恢复

### 6.2 女优管理

- 按分类、作品状态筛选
- 胸型标签（人工/天然）
- 熟女标记
- 头像更换

### 6.3 标签系统

- 按分类分组（主题/体型/服饰/行为/画质/场景等）
- 多标签联合筛选（交集）
- 新增分类、拖拽排序、删除

### 6.4 收藏

- 影片和女优独立收藏
- 双 Tab 展示
- 超过 20 条分页

### 6.5 网站导航

- 分类管理（番号库/在线站）
- 点击浏览器打开
- 增删改

### 6.6 添加影片

- 输入番号自动抓取（片名、女优、封面、截图）
- 自动整理文件到分类目录
- 番号重复提示（允许重复，因为欧美影片番号不标准）

### 6.7 设置

- 自定义播放器路径
- 媒体文件根目录
- 翻译 API 配置（接口地址 + API Key）
- 女优同步（自动发现未录入女优）
- 关联影片（按文件名匹配）

### 6.8 全局搜索

- 搜索影片和女优，结果分两部分展示
- 匹配文字高亮

---

## 7. 数据迁移

首次启动自动检测并执行：

1. 检查旧 `data.dll` 是否存在
2. 检查 `migration_log` 表是否为空
3. 如需要迁移，创建新表结构
4. 逐表迁移数据：movies → movies（丢弃 rating）、femas → actresses（丢弃 status/rating）、website → websites、tagclas → tag_categories + tags
5. movie_actress 关系表不保留，转为 actresses_ids JSON 字段
6. 迁移过程中显示进度条
7. 迁移完成后标记 `migration_log`
8. 成功后删除或重命名旧 `.dll` 文件（可选）

---

## 8. 文件管理

### 8.1 目录约定

```
G:\aiqiyi\
├── AV\          → AV 影片
├── 有码\         → 有码 AV
├── 动漫\         → 动画
├── 欧美\         → 欧美
├── 国产\         → 国产
├── DataBase\
│   └── META-INF\ → 旧数据库 & 资源
└── AV_CINEMA.db  → 新数据库
```

### 8.2 自动整理

添加影片时，根据分类字段，将视频文件移动到对应分类目录的番号文件夹下：
```
G:\aiqiyi\AV\<番号>\
├── <番号>.mp4
├── <番号>-cover.jpg
├── <番号>-p1.jpg
├── <番号>-p2.jpg
└── ...
```

---

## 9. 功能模块依赖图

```
用户操作
  ├── 浏览影片 → MovieList → movieService → database
  ├── 查看详情 → MovieDetail → movieService
  ├── 播放影片 → movieService.getPlayPath → shell.openPath(播放器)
  ├── 女优管理 → ActressList/Detail → actressService
  ├── 标签筛选 → TagBrowser → tagService → movieService
  ├── 收藏管理 → Favorites → movieService/actressService
  ├── 添加影片 → AddMovie → crawlService → movieService + fileService
  ├── 设置页面 → Settings → settingsService
  ├── 网站导航 → WebsiteList → websiteService
  └── 全局搜索 → SearchBar → searchService → movieService + actressService
```

---

## 10. 番号唯一性设计

| 场景 | 校验规则 |
|------|---------|
| 添加 AV 影片 | 同分类下同名番号提示 + 视频文件路径去重 |
| 添加 欧美/动漫/国产 | 仅视频文件路径去重 |
| 自动抓取 | 番号+分类 联合检查，提示可覆盖 |

视频文件路径是最终的唯一标识。

---

## 11. 构建与部署

- 开发：`vite` + `electron:dev`（Vite HMR + Electron 并行）
- 构建：`vite build` + `electron-builder`
- 输出：Windows NSIS 安装包（.exe）
- 自动更新：后续考虑 electron-updater

---

## 12. 界面预览

完整视觉原型参见项目根目录：
- `mockup-darkroom-complete.html` — 深色沉浸风格完整交互原型
- 覆盖所有 10 个页面视图 + 右键菜单 + 删除弹窗 + 排序筛选交互
