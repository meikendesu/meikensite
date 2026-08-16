import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// base: '/' —— history 路由需绝对路径；若部署到子目录需改为 '/子目录/'
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [vue(), tailwindcss()],
  base: '/',
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  build: {
    // 每次构建清理各自输出目录，避免旧哈希资源持续进入部署包。
    emptyOutDir: true,
    // SSR Worker 通过 ASSETS 提供静态文件，服务端包无需重复复制 public/。
    copyPublicDir: !isSsrBuild
  }
}))
