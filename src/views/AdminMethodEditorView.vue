<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi, requireAdminSession } from '../data/adminApi.js'

const route = useRoute()
const router = useRouter()
const status = ref('loading')
const error = ref('')
const editor = reactive(emptyMethod())
const isEditing = computed(() => Boolean(route.params.id))

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
    sortOrder: 0
  }
}

async function loadEditor() {
  try {
    if (!(await requireAdminSession(router))) return
    if (isEditing.value) {
      const id = Number(route.params.id)
      if (!Number.isInteger(id) || id < 1) throw new Error('方式 ID 无效。')
      const data = await adminApi('/api/admin/site-methods')
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
          <span class="custom-select">
            <select v-model="editor.category" @change="resetQr">
              <option value="contact">联系方式</option>
              <option value="donation">捐助方式</option>
            </select>
            <i class="fa-solid fa-chevron-down"></i>
          </span>
        </label>
        <label>唯一标识<input v-model="editor.methodKey" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例如 wechat" maxlength="80" required /></label>
        <label>显示名称<input v-model="editor.name" maxlength="80" required /></label>
        <label>说明<input v-model="editor.description" maxlength="120" placeholder="例如 BTC Mainnet" /></label>
        <label>操作类型
          <span class="custom-select">
            <select v-model="editor.actionType" @change="resetQr">
              <option value="link">打开链接</option>
              <option value="email">发送邮件</option>
              <option value="copy">复制内容</option>
              <option value="crypto">加密货币地址</option>
            </select>
            <i class="fa-solid fa-chevron-down"></i>
          </span>
        </label>
        <label>Font Awesome 图标<input v-model="editor.icon" maxlength="100" placeholder="fa-solid fa-link" required /></label>
        <label>排序<input v-model.number="editor.sortOrder" type="number" min="0" max="9999" required /></label>
        <label class="admin-published"><input v-model="editor.enabled" type="checkbox" /> 在公开页面显示</label>
        <label class="admin-published">
          <input v-model="editor.qrEnabled" type="checkbox" :disabled="editor.category !== 'donation' || editor.actionType !== 'crypto'" />
          自动生成二维码
        </label>
      </div>
      <label>链接、邮箱或公开收款地址<textarea v-model="editor.value" maxlength="500" rows="4" required></textarea></label>
      <p class="admin-help">二维码由服务器直接读取当前公开收款地址生成；请勿填写私钥、助记词或 API 密钥。</p>
      <div class="admin-form-actions">
        <router-link class="work-btn" to="/admin">取消</router-link>
        <button class="admin-primary" type="submit">保存方式</button>
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>
