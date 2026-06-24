# Task 15: WebsiteList 网站导航页面

**Files to modify:**
- `src/views/WebsiteList.vue` (full rewrite from placeholder)

## Requirements

Website navigation page showing saved websites as cards.

### Layout

```
Header: "🌐 网站导航" + [+ 添加网站] button
4-column card grid:
  Card:
    - Icon (emoji, 28px)
    - Website name
    - URL
    - Description
    - Click → open in browser
```

### API
- `window.api.getWebsites()` → websites[]
- `window.api.createWebsite(data)` → new website
- `window.api.updateWebsite(id, data)` → update
- `window.api.deleteWebsite(id)` → delete
- `window.api.openWebsite(url)` → open in browser

### States
- Loading
- Error
- Normal (card grid)
- Empty ("还没有添加网站")

### What to do

1. Rewrite `src/views/WebsiteList.vue`
2. Build & commit
