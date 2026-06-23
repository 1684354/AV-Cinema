# 女优名字体系重构方案

## 核心概念

每个女优有一个**永久不变的显示名**（`femas.mz`），和一个**别名列表**（`femas.bm`）。影片中出现的所有曾用艺名都放到别名里，匹配时靠别名找回家。

```
女优档案（femas 表）
┌─────┬──────────┬──────────────────────────┐
│ id  │ mz(显示名)│ bm(别名，逗号分隔)        │
├─────┼──────────┼──────────────────────────┤
│ 1   │ 王五     │ 张三, Alice, さとう      │
│ 2   │ 赵六     │ 李四, Bob, たなか        │
└─────┴──────────┴──────────────────────────┘
```

**规则**：显示名只有一个，别名可以有多个。不管影片里写的是"张三"还是"Alice"，都通过别名匹配到女优"王五"，详情页只显示"王五"。

---

## 数据流向（四条路径）

### 路径1：刮削添加影片

```
用户拖入 ABC-001.mp4
  → extractPhCode → "ABC-001"
  → scrapeJavDB → 返回数据 { yy: "张三，李四", ... }
  → addMovie:
    1. INSERT INTO movies (ph, pm, yy="张三，李四", ...)
    2. 拆 yy：["张三", "李四"]
    3. 逐个名字匹配 femas：
       SELECT id FROM femas WHERE mz = '张三' OR bm LIKE '%张三%'
       → 找到 id=1（王五）→ INSERT INTO movie_actress (movie_id, 1)
       SELECT id FROM femas WHERE mz = '李四' OR bm LIKE '%李四%'
       → 找到 id=2（赵六）→ INSERT INTO movie_actress (movie_id, 2)
    4. 如果某个名字没匹配到 → 自动创建新女优：
       INSERT INTO femas (mz='张三', bm='张三')
       → 用这个名字本身作为显示名和别名
       → movie_actress 关联新 id
```

**匹配优先级**：
```
1. mz 精确匹配（femas.mz = '张三'）
2. bm 模糊匹配（femas.bm LIKE '%张三%'）
   先试 '%，张三%'（逗号分隔的别名），再试 '%张三%'（包含）
3. 全都没匹配到 → 新建女优
```

### 路径2：影片详情页显示

```
MovieDetail.vue 加载影片 id
  → getMovie(id) → formatMovie():
    // 旧逻辑：读 yy 字段分割显示
    // 新逻辑：
    actressIds = q("SELECT actress_id FROM movie_actress WHERE movie_id = ?", [id])
    → 每个 actress_id 查 femas 拿 mz（显示名）
    → 返回 yyDisplay = "王五，赵六"
  
  → 页面渲染：
    <div v-for="actress in yyDisplay">
      {{ actress.mz }}  ← 永远是显示名，不是 yy 原始名
```

**关键**：页面显示的永远是 `femas.mz`，不再直接展示 `movies.yy`。`yy` 字段只保留原始刮削数据做备份和调试用。

如果某个影片还没有 `movie_actress` 关联（旧数据），降级显示 `yy` 原始字段。

### 路径3：女优详情页作品列表

```
ActressDetail.vue 加载女优 id = 1（王五）
  → 查作品：
    SELECT m.* FROM movies m
    JOIN movie_actress ma ON ma.movie_id = m.id
    WHERE ma.actress_id = 1
    ORDER BY m.tjrq DESC

  → 返回所有王五出演的影片
  → 包括王五和赵六共演的 ABC-001
```

**因为用的是 `movie_actress` 关联表，多女优共演自然支持**。王五和赵六各自查各自的 `actress_id`，两人都能看到 ABC-001。

### 路径4：女优列表页

```
ActressList.vue
  → SELECT * FROM femas ORDER BY pf DESC

  → 每张卡片显示 femas.mz（显示名）
  → "张三，李四"这样的脏数据不会出现，
     因为迁移后它们没有 movie_actress 关联，
     可以在界面上标记为"未关联"让用户手动处理
```

---

## 女优同步（syncMissingActresses）新逻辑

```
1. SELECT yy FROM movies WHERE yy IS NOT NULL
2. 每条 yy 按中文逗号/英文逗号/顿号/斜杠拆分成单个名字
3. 去重（同一个名字只处理一次）
4. 对每个名字 n：
   a. SELECT id FROM femas WHERE mz = n OR bm LIKE '%，n%' OR bm LIKE '%,n%'
   b. 如果找到 → 跳过（已存在）
   c. 如果找不到 → INSERT INTO femas (mz=n, bm=n, fl='AV')
5. 写入 movie_actress
```

---

## 影片-女优关联（linkMovieActress）新逻辑

```
1. SELECT id, yy FROM movies
2. 对每条记录：
   a. 拆分 yy 成单个名字
   b. 对每个名字 n：
      - 查 femas 找匹配
      - 如果 movie_actress 还没有这条关联 → INSERT
3. 已有 movie_actress 的跳过（幂等）
```

---

## 涉及别名修改的流程（用户手动编辑）

用户给女优"王五"添加一个别名"さとう"：

```
设置页 / 女优编辑 → 更新 femas.bm = "张三, Alice, さとう"
```

下次刮削时，如果影片 yy 包含"さとう"，就能匹配到"王五"。**不需要重新刮削已有影片**，只需要跑一次 `linkMovieActress`。

---

## 降级兼容（不改旧数据）

| 场景 | 处理方式 |
|---|---|
| `movie_actress` 表不存在（旧版本） | 建表时报错处理，自动创建 |
| 某影片没有任何 `movie_actress` 记录 | 降级显示 `movies.yy` 原始字段 |
| `femas` 表里有脏数据（"张三，李四"一条记录） | 迁移脚本检测 → 日志警告但不自动删除 |
| 某女优没有 `bm` 值 | 匹配时只查 `mz` |

---

## 实施顺序

1. **建 `movie_actress` 表**（autoMigrate 阶段）
2. **改写 `addMovie`**：插入影片后拆分女优名、匹配别名、写关联表
3. **重写 `syncMissingActresses`**：先拆分再判断
4. **重写 `linkMovieActress`**：为已有影片补齐关联数据
5. **改写 `formatMovie`**：返回 `yyDisplay`（通过关联表查显示名）
6. **改写 `MovieDetail.vue`**：优先显示 `yyDisplay`，降级 `yy`
7. **改写 `ActressDetail.vue`**：作品查询改用 JOIN `movie_actress`
8. **迁移脚本**：把旧 `femas` 脏数据用户警告 + 补齐 `movie_actress`

---

## 不改的

- `movies.yy` 字段：保留原始数据
- `movies.yid` 字段：保留但弃用
- `femas.mz` 含义不变：就是显示名
- `femas.bm` 含义不变：就是别名，已经在用了
