# Task 1: 初始化项目结构和依赖

**Files to create:**
- `package.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `index.html`
- `electron-builder.yml`
- `.gitignore`

## Step 1: package.json

```json
{
  "name": "av-cinema",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "vite",
    "electron:build": "vite build && electron-builder",
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "element-plus": "^2.9.0",
    "pinia": "^2.3.0",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "electron": "^42.4.0",
    "electron-builder": "^25.1.0",
    "electron-rebuild": "^3.2.9",
    "typescript": "^5.7.0",
    "vite": "^5.4.0",
    "vite-plugin-electron": "^0.28.8",
    "vite-plugin-electron-renderer": "^0.14.6",
    "vue-tsc": "^2.2.0",
    "@types/better-sqlite3": "^7.6.12"
  }
}
```

## Step 2: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["better-sqlite3"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "electron/**/*.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Step 3: tsconfig.node.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "electron-builder.yml"]
}
```

## Step 4: vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['better-sqlite3']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) { options.reload() },
        vite: {
          build: { outDir: 'dist-electron' }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  base: './'
})
```

## Step 5: index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AV Cinema</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## Step 6: electron-builder.yml

```yaml
appId: com.avcinema.app
productName: AV Cinema
directories:
  output: release
files:
  - dist
  - dist-electron
win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
```

## Step 7: .gitignore

```
node_modules/
dist/
dist-electron/
release/
*.db
*.db-backup
*.dll
*.dll.backup
.DS_Store
thumbs.db
```

## Step 8: Install dependencies

Run: `npm install`

If electron-rebuild fails, also run: `npx electron-rebuild -f -w better-sqlite3`

## Step 9: Commit

```
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html electron-builder.yml .gitignore
git commit -m "feat: scaffold project with Vite + Vue 3 + Electron + TypeScript"
```

## Working Directory

The project is at: `/c/Users/Administrator/Desktop/CLADUE/NEW AV`

**Important:** The git root is `/c/Users/Administrator/Desktop/CLADUE`. All git commands must be run from that directory, not from NEW AV subdirectory.
