# Task 18: Settings 设置页面

**Files to modify:**
- `src/views/Settings.vue` (full rewrite from placeholder)

## Requirements

Settings page with configuration groups.

### Layout

```
Title: "⚙️ 设置"

Settings groups (max 600px):
1. ▶️ 播放器路径
   - Text input for player path + [Browse] button
   - Description: 留空使用系统默认

2. 📁 媒体根目录
   - Text input showing current media root path
   - Description: 视频文件存放的根路径

3. 🌐 翻译 API
   - API Key input + API endpoint input
   - Description: 用于翻译片名

4. 👩 女优同步
   - Toggle switch: 启用自动同步
   - [立即扫描] button

5. 🔗 关联影片
   - [开始关联] button
```

### API
- `window.api.getSettings()` → `Record<string, string>`
- `window.api.updateSetting(key, value)` → void
- `window.api.getSetting(key)` → string

### Setting keys
- `player_path`
- `media_root`
- `translate_api_key`
- `translate_api_endpoint`
- `sync_enabled`

### States
- Loading (fetching settings)
- Normal (form)
- Error

### What to do

1. Rewrite `src/views/Settings.vue`
2. Build & commit
