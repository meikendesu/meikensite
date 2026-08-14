import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: '/' —— history 路由需绝对路径；若部署到子目录需改为 '/子目录/'
// emptyOutDir: false —— 沙箱 safe-delete 无法删除旧 dist，改为直接覆盖写入
export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: { emptyOutDir: false }
})
