<template>
  <div class="tag-browser">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <span class="header-icon">🏷️</span>
        <h2>所有标签</h2>
        <span class="count" v-if="categories.length">· {{ categories.length }} 个分类</span>
      </div>
      <button class="btn-add-category" @click="showAddCategory = true">
        ＋ 新增分类
      </button>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <span>正在加载标签...</span>
    </div>

    <!-- Error -->
    <div class="error-state" v-else-if="error">
      <div class="icon">⚠️</div>
      <div class="msg">{{ error }}</div>
      <button class="retry" @click="loadData">🔄 重试</button>
    </div>

    <!-- Empty -->
    <div class="empty-state" v-else-if="!loading && categories.length === 0">
      <div class="icon">🏷️</div>
      <div class="msg">还没有标签分类</div>
      <div class="sub">点击「新增分类」开始建立标签体系</div>
    </div>

    <!-- Normal grid -->
    <div class="category-grid" v-else>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="category-card"
      >
        <!-- Card header -->
        <div class="card-header">
          <h3 class="card-title">{{ cat.name }}</h3>
          <div class="card-actions">
            <span class="tag-count">{{ cat.tags?.length || 0 }} 个标签</span>
            <button
              class="btn-icon btn-delete-cat"
              title="删除分类"
              @click="confirmDeleteCategory(cat)"
            >✕</button>
          </div>
        </div>

        <!-- Tags area -->
        <div class="tags-area">
          <span
            v-for="tag in cat.tags"
            :key="tag.id"
            class="tag-chip"
          >
            {{ tag.name }}
            <button
              class="tag-remove"
              title="删除标签"
              @click="deleteTag(tag)"
            >✕</button>
          </span>

          <!-- Inline add tag form -->
          <div class="add-tag-inline" v-if="addingTagCategoryId === cat.id">
            <input
              ref="tagInputRef"
              v-model="newTagName"
              class="tag-input"
              placeholder="标签名"
              @keyup.enter="submitTag(cat.id)"
              @keyup.escape="cancelAddTag"
            />
            <button class="btn-sm btn-confirm" @click="submitTag(cat.id)">确定</button>
            <button class="btn-sm btn-cancel" @click="cancelAddTag">取消</button>
          </div>
          <button
            v-else
            class="btn-add-tag"
            @click="startAddTag(cat)"
          >＋ 添加标签</button>
        </div>
      </div>
    </div>

    <!-- Add Category Dialog -->
    <div class="modal-overlay" v-if="showAddCategory" @click.self="showAddCategory = false">
      <div class="modal-dialog">
        <h3>新增分类</h3>
        <input
          v-model="newCategoryName"
          class="modal-input"
          placeholder="分类名称"
          @keyup.enter="submitCategory"
        />
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddCategory = false">取消</button>
          <button class="btn-confirm" @click="submitCategory">确定</button>
        </div>
      </div>
    </div>

    <!-- Delete Category Confirm -->
    <div class="modal-overlay" v-if="deletingCategory" @click.self="deletingCategory = null">
      <div class="modal-dialog modal-confirm">
        <div class="icon">⚠️</div>
        <h3>删除分类</h3>
        <p>确定要删除「{{ deletingCategory.name }}」吗？<br/>该分类下的所有标签也会被删除。</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deletingCategory = null">取消</button>
          <button class="btn-danger" @click="submitDeleteCategory">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Tag {
  id: number
  name: string
  category_id: number
  sort: number
}

interface Category {
  id: number
  name: string
  sort: number
  tags: Tag[]
}

const loading = ref(false)
const error = ref('')
const categories = ref<Category[]>([])

// Add category
const showAddCategory = ref(false)
const newCategoryName = ref('')

// Delete category
const deletingCategory = ref<Category | null>(null)

// Add tag inline
const addingTagCategoryId = ref<number | null>(null)
const newTagName = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await window.api.getTagsByCategory()
  } catch (err: any) {
    error.value = err?.message || '加载标签失败'
  } finally {
    loading.value = false
  }
}

// --- Category CRUD ---

async function submitCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  try {
    await window.api.createTagCategory({ name })
    newCategoryName.value = ''
    showAddCategory.value = false
    await loadData()
  } catch (err: any) {
    error.value = err?.message || '创建分类失败'
  }
}

function confirmDeleteCategory(cat: Category) {
  deletingCategory.value = cat
}

async function submitDeleteCategory() {
  if (!deletingCategory.value) return
  try {
    await window.api.deleteTagCategory(deletingCategory.value.id)
    deletingCategory.value = null
    await loadData()
  } catch (err: any) {
    error.value = err?.message || '删除分类失败'
  }
}

// --- Tag CRUD ---

function startAddTag(cat: Category) {
  newTagName.value = ''
  addingTagCategoryId.value = cat.id
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function cancelAddTag() {
  addingTagCategoryId.value = null
  newTagName.value = ''
}

async function submitTag(categoryId: number) {
  const name = newTagName.value.trim()
  if (!name) return
  try {
    await window.api.createTag({ name, categoryId })
    newTagName.value = ''
    addingTagCategoryId.value = null
    await loadData()
  } catch (err: any) {
    error.value = err?.message || '创建标签失败'
  }
}

async function deleteTag(tag: Tag) {
  try {
    await window.api.deleteTag(tag.id)
    await loadData()
  } catch (err: any) {
    error.value = err?.message || '删除标签失败'
  }
}

onMounted(loadData)
</script>

<style scoped>
.tag-browser {
  padding-bottom: 40px;
}

/* --- Header --- */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
}

.header-left h2 {
  font-family: Georgia, serif;
  font-size: 20px;
  color: var(--fg);
  font-weight: 400;
}

.count {
  font-size: 13px;
  color: var(--fg4);
}

.btn-add-category {
  padding: 7px 18px;
  border-radius: 18px;
  border: 1px solid var(--accent2);
  background: transparent;
  color: var(--accent2);
  font-size: 12px;
  transition: var(--transition);
  cursor: pointer;
}

.btn-add-category:hover {
  background: var(--accent2);
  color: #fff;
}

/* --- States --- */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
}

.loading-state .spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state span {
  color: var(--fg3);
  font-size: 14px;
}

.error-state .icon,
.empty-state .icon {
  font-size: 48px;
}

.error-state .msg,
.empty-state .msg {
  color: var(--fg3);
  font-size: 15px;
}

.empty-state .sub {
  color: var(--fg4);
  font-size: 12px;
}

.retry {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--fg);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.retry:hover {
  background: var(--surface);
  border-color: var(--accent);
}

/* --- Grid --- */
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 24px 28px;
}

/* --- Card --- */
.category-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  transition: var(--transition);
}

.category-card:hover {
  border-color: var(--surface);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.card-title {
  font-family: Georgia, serif;
  font-size: 16px;
  font-weight: 400;
  color: var(--accent2);
  word-break: break-word;
  line-height: 1.3;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tag-count {
  font-size: 11px;
  color: var(--fg4);
  white-space: nowrap;
}

.btn-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--fg4);
  font-size: 11px;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  opacity: 0;
}

.category-card:hover .btn-icon {
  opacity: 1;
}

.btn-icon:hover {
  background: var(--surface);
  color: var(--rose);
}

/* --- Tags area --- */
.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 12px;
  color: var(--fg3);
  transition: var(--transition);
  cursor: default;
}

.tag-chip:hover {
  color: var(--accent2);
  border-color: var(--accent2);
}

.tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  background: transparent;
  color: var(--fg4);
  font-size: 9px;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  opacity: 0;
  padding: 0;
  line-height: 1;
}

.tag-chip:hover .tag-remove {
  opacity: 0.6;
}

.tag-remove:hover {
  opacity: 1 !important;
  background: var(--border);
  color: var(--rose);
}

/* --- Add tag inline --- */
.add-tag-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-input {
  width: 90px;
  padding: 4px 8px;
  border-radius: 14px;
  border: 1px solid var(--accent2);
  background: var(--bg3);
  color: var(--fg);
  font-size: 12px;
  outline: none;
  transition: var(--transition);
}

.tag-input:focus {
  border-color: var(--accent2);
  box-shadow: 0 0 0 2px rgba(217, 142, 106, 0.15);
}

.btn-sm {
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-size: 11px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-confirm {
  background: var(--accent2);
  color: #fff;
  border-color: var(--accent2);
}

.btn-confirm:hover {
  opacity: 0.85;
}

.btn-cancel {
  background: var(--surface);
  color: var(--fg3);
  border-color: var(--border);
}

.btn-cancel:hover {
  color: var(--fg);
  border-color: var(--fg4);
}

.btn-add-tag {
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--fg4);
  font-size: 11px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-add-tag:hover {
  border-color: var(--accent2);
  color: var(--accent2);
  border-style: solid;
}

/* --- Modal --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-dialog {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  width: 360px;
  max-width: 90vw;
  box-shadow: var(--shadow);
}

.modal-dialog h3 {
  font-family: Georgia, serif;
  font-size: 18px;
  font-weight: 400;
  color: var(--fg);
  margin-bottom: 16px;
}

.modal-confirm {
  text-align: center;
}

.modal-confirm .icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.modal-confirm p {
  font-size: 13px;
  color: var(--fg3);
  line-height: 1.6;
  margin-bottom: 16px;
}

.modal-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: var(--bg3);
  color: var(--fg);
  font-size: 14px;
  outline: none;
  transition: var(--transition);
  margin-bottom: 16px;
}

.modal-input:focus {
  border-color: var(--accent2);
  box-shadow: 0 0 0 2px rgba(217, 142, 106, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions .btn-cancel,
.modal-actions .btn-confirm,
.modal-actions .btn-danger {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.modal-actions .btn-cancel {
  background: var(--surface);
  color: var(--fg3);
}

.modal-actions .btn-cancel:hover {
  color: var(--fg);
}

.modal-actions .btn-confirm {
  background: var(--accent2);
  color: #fff;
  border-color: var(--accent2);
}

.modal-actions .btn-confirm:hover {
  opacity: 0.85;
}

.modal-actions .btn-danger {
  background: var(--rose);
  color: #fff;
  border-color: var(--rose);
}

.modal-actions .btn-danger:hover {
  opacity: 0.85;
}
</style>
