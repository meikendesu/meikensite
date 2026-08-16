<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi, requireAdminSession } from '../data/adminApi'
import CustomSelect from '../components/CustomSelect.vue'
import IconPicker from '../components/IconPicker.vue'
import type { SiteMethod, SiteMethodCategory } from '../types'

const route = useRoute()
const router = useRouter()
const status = ref('loading')
const error = ref('')
const editor = reactive(emptyMethod())
const isEditing = computed(() => Boolean(route.params.id))
const categoryOptions = [
  { value: 'contact', label: '联系方式', icon: 'fa-solid fa-address-book' },
  { value: 'donation', label: '捐助方式', icon: 'fa-solid fa-hand-holding-heart' }
]
const actionOptions = [
  { value: 'link', label: '打开链接', icon: 'fa-solid fa-arrow-up-right-from-square' },
  { value: 'email', label: '发送邮件', icon: 'fa-solid fa-envelope' },
  { value: 'copy', label: '复制内容', icon: 'fa-solid fa-copy' },
  { value: 'crypto', label: '加密货币地址', icon: 'fa-brands fa-bitcoin' }
]

function emptyMethod() {
  return {
    id: null,
    category: 'contact',
    methodKey: '',
    name: '',
    description: '',
    value: '',
    icon: 'fa-solid fa-link',
    actionType: 'link',
    qrEnabled: false,
    enabled: true,
  }
}

async function loadEditor() {
  try {
    if (!(await requireAdminSession(router))) return
    const requestedCategory = Array.isArray(route.query.category) ? route.query.category[0] : route.query.category
    if (!isEditing.value && (requestedCategory === 'contact' || requestedCategory === 'donation')) {
      editor.category = requestedCategory as SiteMethodCategory
    }
    if (isEditing.value) {
      const id = Number(route.params.id)
      if (!Number.isInteger(id) || id < 1) throw new Error('方式 ID 无效。')
      const data = await adminApi<{ methods: SiteMethod[] }>('/api/admin/site-methods')
      const method = (data.methods || []).find((item) => item.id === id)
      if (!method) throw new Error('方式不存在或已被删除。')
      Object.assign(editor, method)
    }
    status.value = 'ready'
  } catch (requestError) {
    error.value = requestError.message
    status.value = 'error'
  }
}

function resetQr() {
  editor.qrEnabled = false
}

async function saveMethod() {
  error.value = ''
  try {
    await adminApi('/api/admin/site-methods', { method: 'POST', body: JSON.stringify(editor) })
    await router.push({ path: '/admin', query: { saved: 'method' } })
  } catch (requestError) {
    error.value = requestError.message
  }
}

onMounted(loadEditor)
</script>

<template>
  <main id="main" tabindex="-1" class="shell page-shell admin-shell admin-method-page">
    <header class="admin-header">
      <div><p class="overline">METHOD EDITOR</p><h1>{{ isEditing ? '编辑方式' : '添加方式' }}</h1></div>
      <router-link class="work-btn" to="/admin"><i class="fa-solid fa-arrow-left"></i> 返回管理页</router-link>
    </header>

    <p v-if="status === 'loading'" class="form-message">正在加载表单…</p>
    <section v-else-if="status === 'error'" class="admin-panel">
      <p class="form-message error" role="alert">{{ error }}</p>
      <router-link class="work-btn" to="/admin">返回管理页</router-link>
    </section>

    <form v-else class="admin-panel admin-method-editor" @submit.prevent="saveMethod">
      <div class="admin-fields-grid">
        <label>分类
          <CustomSelect v-model="editor.category" :options="categoryOptions" aria-label="选择方式分类" @update:model-value="resetQr" />
        </label>
        <label>唯一标识<input v-model="editor.methodKey" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例如 wechat" maxlength="80" required /></label>
        <label>显示名称<input v-model="editor.name" maxlength="80" required /></label>
        <label>说明<input v-model="editor.description" maxlength="120" placeholder="例如 BTC Mainnet" /></label>
        <label>操作类型
          <CustomSelect v-model="editor.actionType" :options="actionOptions" aria-label="选择操作类型" @update:model-value="resetQr" />
        </label>
        <label class="admin-icon-field">Font Awesome 免费图标<IconPicker v-model="editor.icon" /></label>
        <label class="admin-published"><input v-model="editor.enabled" type="checkbox" /> 在公开页面显示</label>
        <label class="admin-published">
          <input v-model="editor.qrEnabled" type="checkbox" :disabled="editor.category !== 'donation' || editor.actionType !== 'crypto'" />
          自动生成二维码
        </label>
      </div>
      <label>链接、邮箱或公开收款地址<textarea v-model="editor.value" maxlength="500" rows="4" required></textarea></label>
      <p class="admin-help">二维码由服务器直接读取当前公开收款地址生成；请勿填写私钥、助记词或 API 密钥。</p>

      <section class="admin-method-preview">
        <div class="admin-section-title"><div><p class="overline">LIVE PREVIEW</p><h2>页面预览</h2></div></div>
        <article v-if="editor.category === 'contact'" class="contact-row method-preview-card">
          <span class="row-icon"><i :class="editor.icon"></i></span>
          <div><small>{{ editor.description || '联系方式说明' }}</small><strong>{{ editor.name || '显示名称' }}</strong></div>
          <b><i class="fa-solid fa-chevron-right"></i></b>
        </article>
        <article v-else class="payment-card method-preview-card" :class="editor.methodKey">
          <div class="payment-heading">
            <span class="payment-icon"><i :class="editor.icon"></i></span>
            <div><h2>{{ editor.name || '捐助方式' }}</h2><p>{{ editor.description || '网络或方式说明' }}</p></div>
          </div>
          <div class="wallet-line"><code>{{ editor.value || '公开收款地址或链接' }}</code><button type="button" tabindex="-1">预览</button></div>
        </article>
      </section>
      <div class="admin-form-actions">
        <router-link class="work-btn" to="/admin">取消</router-link>
        <button class="admin-primary" type="submit">保存方式</button>
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>
