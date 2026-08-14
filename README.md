# MEIKEN · Vue 3 + Vite 版

原零依赖多页静态站（`../` 根目录）重构为 Vue 3 SPA，保留全部视觉与文案，仅工程化升级。

## 技术栈

- Vue 3（`<script setup>`）
- Vue Router 4（hash 路由，静态托管刷新不 404）
- Vite 5 构建
- Font Awesome 仍走 CDN（`index.html` 引入）
- 样式直接复用根目录优化后的 `styles.css`

## 目录结构

```
vue-app/
├── index.html              # Vite 入口（含 Font Awesome CDN / favicon）
├── vite.config.js
├── src/
│   ├── main.js             # 挂载 App + 注册路由
│   ├── App.vue             # skip-link + <router-view>（带过渡）
│   ├── router.js           # 5 条路由 + 标题切换 + 滚动复位
│   ├── styles.css          # 原样复用根目录样式
│   ├── components/
│   │   ├── PageHeader.vue  # 子页顶栏（title / avatar 入口可配）
│   │   └── TabBar.vue      # 底部导航（router-link 自动 active + aria-current）
│   └── views/              # 5 个页面
│       ├── HomeView.vue
│       ├── AboutView.vue
│       ├── ProjectsView.vue
│       ├── ContactView.vue
│       └── SupportView.vue # 含 USDT 复制逻辑
└── public/                 # 二维码等静态资源放这里
```

## 命令

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（默认 http://localhost:5173）
npm run build    # 产出 dist/
npm run preview  # 本地预览构建产物
```

## 路由

| 路径        | 视图            |
| ----------- | --------------- |
| `/`         | HomeView        |
| `/about`    | AboutView       |
| `/projects` | ProjectsView    |
| `/contact`  | ContactView     |
| `/support`  | SupportView     |

> 采用 `createWebHashHistory`，URL 形如 `/#/about`，纯静态托管无需服务器 SPA fallback。
> 若部署环境支持 history fallback（如 Nginx `try_files`），可改用 `createWebHistory()` 获得干净 URL。

## 待填写（沿用原站预留）

- `SupportView.vue` 中 `walletAddress`：替换为真实 USDT (TRC20) 地址后即可启用复制。
- 二维码图片放至 `public/payment/`，并把 `SupportView.vue` 里的占位 `qr-placeholder` 换成 `<img>`。
- `ContactView.vue` 中 Instagram / 小红书占位 `href="#"`：替换为真实链接。
- 不要把收款密钥写入仓库。
