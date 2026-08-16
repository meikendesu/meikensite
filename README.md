# MEIKEN · Vue 3 + Vite SSR

Vue 3 + Cloudflare Workers SSR 个人站。项目文章和管理员认证数据存储在 Cloudflare D1。

## 技术栈

- Vue 3（`<script setup lang="ts">`）
- TypeScript 5.9（前端、SSR、构建脚本与 Cloudflare Worker）
- Tailwind CSS 4（Vite 插件、CSS-first 设计令牌与组件层）
- Vue Router 4（HTML5 history 路由）
- Vite 6（客户端 + SSR 构建）
- Cloudflare Workers + Assets
- Cloudflare D1（项目文章、管理员密码哈希、登录会话）
- Markdown It（安全模式，不执行文章中的原始 HTML）
- Font Awesome Free 7（本地依赖，不再依赖第三方 CDN）

## 主要目录

```text
meikensite/
├── worker.ts               # Worker SSR 与 API 入口
├── wrangler.jsonc          # Assets、D1 和日志配置
├── migrations/             # D1 数据库迁移（项目、联系方式、捐助方式）
├── src/
│   ├── entry-client.ts     # 浏览器 hydration 入口
│   ├── entry-server.ts     # SSR 入口
│   ├── router.ts           # 页面路由与按需拆包
│   ├── styles.css          # Tailwind 入口、设计令牌与语义组件层
│   ├── data/projects.ts    # 项目数据 store / API 客户端
│   ├── data/freeFontAwesomeIcons.ts # 构建前自动生成的免费图标目录
│   ├── components/         # 自定义下拉框、图标选择器等复用组件
│   └── views/              # 公开页面、Admin 列表与独立编辑页面
├── scripts/                # 图标目录生成、Worker 回归验证
└── public/                 # 字体等静态资源
```

## 常用命令

```bash
npm install
npm run dev                 # 仅启动 Vite 客户端，不包含 Worker API
npm run typecheck           # 生成 Worker 绑定类型并检查全部 TypeScript/Vue 文件
npm run build               # 更新免费图标目录并产出 dist/client 与 dist/server
npm run verify:worker       # 构建并执行 SSR、错误页和静态资源回归检查
npm run preview             # 预览 dist/client
npm run db:migrate:local    # 初始化本地 D1
npm run dev:worker          # 构建并启动完整 Worker + D1 环境
```

## 页面路由

| 路径 | 用途 |
| --- | --- |
| `/` | 首页 |
| `/about` | 关于 |
| `/projects` | 已发布项目列表 |
| `/projects/:slug` | Markdown 项目详情 |
| `/contact` | 联系方式 |
| `/support` | USDT、ETH、BTC、PayPal 捐助方式 |
| `/admin` | 管理员登录与项目发布 |
| `/admin/projects/new` | 独立的项目与 Markdown 新建页面 |
| `/admin/projects/:id/edit` | 独立的项目与 Markdown 编辑页面 |
| `/admin/methods/new` | 独立的联系方式/捐助方式添加页面 |
| `/admin/methods/:id/edit` | 独立的联系方式/捐助方式编辑页面 |

## 本地使用 Admin

首次准备：

```bash
npm install
npm run db:migrate:local
npm run dev:worker
```

打开 `http://127.0.0.1:8787/admin`：

1. 使用初始密码 `123456` 登录。
2. 首次登录会被强制要求设置至少 8 个字符的新密码。
3. 新建或编辑项目会进入独立页面；内置 Markdown 工具栏支持标题、粗体、斜体、链接、列表、引用和代码，并同步显示实时预览。
4. 勾选“公开发布”后保存，文章会出现在 `/projects`。
5. 联系方式和捐助方式在两个独立分组中管理；使用每张卡片左侧把手，只能在当前分组内拖动排序。
6. 方式编辑页可搜索并选择 Font Awesome 的全部免费图标，自定义下拉框不会调用浏览器原生弹层，表单下方会实时预览公开页面效果。
7. 加密货币捐助方式填写公开收款地址并勾选“自动生成二维码”后，Worker 会根据数据库中的当前地址生成 SVG 二维码。

密码不会明文保存。Worker 使用 PBKDF2-SHA-256 和随机盐生成密码哈希；会话令牌只以 SHA-256 摘要写入 D1，并通过 `HttpOnly`、`Secure`、`SameSite=Strict` Cookie 发送。

## 添加并部署 Cloudflare D1

先登录 Cloudflare，并创建生产数据库：

```bash
npx wrangler login
npx wrangler d1 create meikensite-db
```

命令会输出 `database_id`。把它加入 `wrangler.jsonc` 的现有 `d1_databases[0]`：

```jsonc
{
  "binding": "DB",
  "database_name": "meikensite-db",
  "database_id": "这里填写命令返回的 UUID",
  "migrations_dir": "migrations"
}
```

初始化生产表并部署：

```bash
npm run db:migrate:remote
npm run deploy
```

`migrations/0001_admin_projects.sql` 会创建管理员、会话、项目表并迁移原有 Wawawa 项目文章；`migrations/0004_site_methods.sql` 会创建联系方式和捐助方式表，并写入当前页面使用的初始数据。生产站首次访问 `/admin` 时仍使用 `123456`，登录后必须立刻修改。

备份生产文章：

```bash
npx wrangler d1 export meikensite-db --remote --output backup.sql
```

## 联系方式与捐助信息

- 联系方式和捐助方式均存储在 D1 的 `site_methods` 表，通过 `/admin` 管理，不再修改 Vue 页面中的硬编码数组。
- USDT、ETH、BTC 初始值仍是醒目的“待填写”占位内容，且默认不开启二维码；填写真实公开地址后再启用二维码。
- 二维码由 `/api/site-methods/:id/qr` 按数据库中的当前地址动态生成，修改地址后不需要替换或提交静态二维码文件。
- 数据库只允许保存公开收款地址，不要写入钱包私钥、助记词、PayPal 密钥或真实后台密码。
