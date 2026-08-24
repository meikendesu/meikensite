# MEIKEN 1.0.0 · Vue 3 + Vite SSR

Vue 3 + Cloudflare Workers SSR 个人站。项目文章、关于页面内容和管理员认证数据存储在 Cloudflare D1，项目封面与可执行文件存储在私有 Cloudflare R2 存储桶。

当前仓库为 2026-08-17 正式发布的 `1.0.0` 版本。生产静态资源使用内容哈希与长期不可变缓存，内容页面保持服务端渲染，后台内容和按需翻译继续由 D1 与 Workers AI 提供。

1.0 的生产性能基线、包体对比和优化取舍记录在 [PERFORMANCE.md](./PERFORMANCE.md)。

## 技术栈

- Vue 3（`<script setup lang="ts">`）
- TypeScript 5.9（前端、SSR、构建脚本与 Cloudflare Worker）
- Tailwind CSS 4（Vite 插件、CSS-first 设计令牌与组件层）
- Vue Router 4（HTML5 history 路由）
- Vite 6（客户端 + SSR 构建）
- Cloudflare Workers + Assets
- Cloudflare Workers AI（访客选择语言后按需翻译公开内容）
- Cloudflare D1（项目文章、管理员密码哈希、登录会话）
- Cloudflare R2（管理员上传的项目封面、可执行文件与安装包）
- Markdown It（安全模式，不执行文章中的原始 HTML）
- Font Awesome Free 7（本地依赖，不再依赖第三方 CDN）
- Noto Sans 可变字体（英文单文件 + 中日韩统一 Noto Sans CJK 单文件，本地 WOFF2）

## 主要目录

```text
meikensite/
├── worker.ts               # Worker SSR 与 API 入口
├── wrangler.jsonc          # Assets、D1、R2 和日志配置
├── migrations/             # D1 数据库迁移（项目、联系方式、捐助方式）
├── src/
│   ├── entry-client.ts     # 浏览器 hydration 入口
│   ├── entry-server.ts     # SSR 入口
│   ├── router.ts           # 页面路由与按需拆包
│   ├── fonts.css           # Noto Sans 与 Noto Sans CJK 单文件字体声明
│   ├── styles.css          # Tailwind 入口、设计令牌与语义组件层
│   ├── assets/fonts/noto/  # 本地 Noto Sans 可变 WOFF2 字体与许可证
│   ├── data/projects.ts    # 项目数据 store / API 客户端
│   ├── data/freeFontAwesomeIcons.ts # 构建前自动生成的免费图标目录
│   ├── components/         # 自定义下拉框、图标选择器等复用组件
│   └── views/              # 公开页面、Admin 列表与独立编辑页面
├── scripts/                # 字体/图标更新、Worker 回归验证
└── public/                 # 无需打包转换的静态资源
```

## 常用命令

```bash
npm install
npm run dev                 # 仅启动 Vite 客户端，不包含 Worker API
npm run typecheck           # 生成 Worker 绑定类型并检查全部 TypeScript/Vue 文件
npm run fonts:update        # 从官方在线源更新两个本地 Noto 可变 WOFF2 字体
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
| `/projects` | 已发布项目列表，每页 10 条 |
| `/projects/:slug` | Markdown 项目详情 |
| `/contact` | 联系方式 |
| `/support` | USDT、ETH、BTC、PayPal 捐助方式 |
| `/admin` | 私有管理员入口；未授权访问返回 HTTP 404 |
| `/admin/about` | 简体中文关于页面编辑 |
| `/admin/projects/new` | 独立的项目与 Markdown 新建页面 |
| `/admin/projects/:id/edit` | 独立的项目与 Markdown 编辑页面 |
| `/admin/methods/new` | 独立的联系方式/捐助方式添加页面 |
| `/admin/methods/:id/edit` | 独立的联系方式/捐助方式编辑页面 |

## 本地使用 Admin

首次准备：

```bash
npm install
npm run db:migrate:local
Copy-Item .dev.vars.example .dev.vars # Windows PowerShell
npm run dev:worker
```

先把 `.dev.vars` 中的 `ADMIN_ENTRY_KEY` 换成长随机值，再打开：

```text
http://127.0.0.1:8787/admin#access=你的ADMIN_ENTRY_KEY
```

URL 片段不会发送到 Worker；页面会以同源请求换取最长 12 小时的 `HttpOnly` 门禁 Cookie，并立即从地址栏清除片段。直接访问 `/admin`、后台子路径或后台 API 会返回 404。

进入登录页后：

1. 完成 Cloudflare Turnstile 人机验证，再使用初始密码 `123456` 登录。
2. 首次登录会被强制要求设置至少 8 个字符的新密码。
3. 新建或编辑项目必须填写发布日期和更新日期；内置 Markdown 工具栏支持标题、粗体、斜体、链接、列表、引用和代码，并同步显示实时预览。
4. 项目编辑页可以上传一个不超过 10 MB 的 JPG、PNG、WebP 或 AVIF 横向封面；有封面时项目列表显示缩略 Banner，详情页显示宽幅 Banner，没有封面则保持原来的纯色布局。
5. 项目编辑页可以选择一个不超过 100 MB 的可执行文件或安装包；封面和项目文件保存时都会直接流式上传到 R2，已有资源可以替换或显式移除，不重新选择时会保留原资源。
6. 勾选“公开发布”后保存，文章会出现在 `/projects`；只有已发布且已上传文件的项目详情会显示下载按钮。
7. 联系方式和捐助方式在两个独立分组中管理；使用每张卡片左侧把手，只能在当前分组内拖动排序。
8. 方式编辑页可搜索并选择 Font Awesome 的全部免费图标，自定义下拉框不会调用浏览器原生弹层，表单下方会实时预览公开页面效果。
9. 加密货币捐助方式填写公开收款地址并勾选“自动生成二维码”后，Worker 会根据数据库中的当前地址生成 SVG 二维码。
10. 关于页面、项目文章、联系方式与捐助方式都只维护简体中文源内容。繁体中文由 Worker 使用 OpenCC 台湾词汇表即时转换；英语和日语由 Workers AI 的 Qwen3 30B 翻译并缓存到 D1。部署完成后会通过线上 Worker 预热缓存；管理端保存内容后也会在响应返回后后台刷新相关翻译。翻译结果经过结构校验，源内容或翻译版本修改后缓存会自动失效，访客遇到冷缓存时仍有同步翻译兜底。

密码不会明文保存。Worker 使用 PBKDF2-SHA-256 和随机盐生成密码哈希；会话令牌只以 SHA-256 摘要写入 D1，并通过 `HttpOnly`、`Secure`、`SameSite=Strict` Cookie 发送。

管理员登录还会在 Worker 内调用 Turnstile Siteverify，并严格校验 `success`、`admin_login` action 和部署环境允许的 hostname。生产密钥存储为 Worker secret `TURNSTILE_SECRET`，不会提交到仓库；生产 hostname 通过 `TURNSTILE_HOSTNAMES=983765.xyz` 固定，本地开发则在 `.dev.vars` 中使用 `localhost,127.0.0.1`。

公开页面首次访问时也会先显示独立的 Turnstile 验证页。Cloudflare Assets 对 `/` 和 `/index.html` 启用 `run_worker_first`，避免缓存的 SPA 壳绕过门禁；Worker 在 Siteverify 严格校验 `site_access` action 与 hostname 后签发最长 24 小时的加密签名 `HttpOnly` Cookie，验证前不会执行或返回 Vue SSR 页面内容。其他静态资源和公开内容 API 不经过页面门禁，以保证资源缓存、翻译预热与部署流程正常；后台继续使用私有入口和登录 Turnstile，不重复显示全站验证。

## 添加并部署 Cloudflare D1 与 R2

先登录 Cloudflare，并创建生产数据库：

```bash
npx wrangler login
npx wrangler d1 create meikensite-db
npx wrangler r2 bucket create meiken-storage
```

Cloudflare R2 存储桶名称不能包含下划线，因此需求中的逻辑名称 `meiken_storage` 在配置中使用合法的实际桶名 `meiken-storage`。Worker 通过 `PROJECT_FILES` binding 访问该私有桶，不需要公开 R2 域名。

命令会输出 `database_id`。把它加入 `wrangler.jsonc` 的现有 `d1_databases[0]`：

```jsonc
{
  "binding": "DB",
  "database_name": "meikensite-db",
  "database_id": "这里填写命令返回的 UUID",
  "migrations_dir": "migrations"
}
```

初始化生产表、设置私有入口密钥并部署：

```bash
npm run db:migrate:remote
npx wrangler secret put ADMIN_ENTRY_KEY
npm run deploy
```

`migrations/0001_admin_projects.sql` 会创建管理员、会话、项目表并迁移原有 Wawawa 项目文章；`migrations/0004_site_methods.sql` 会创建联系方式和捐助方式表；`migrations/0005_about_content_and_project_dates.sql` 会加入关于页面内容以及项目发布日期字段；`migrations/0006_on_demand_translation_cache.sql` 会清理旧的非简体中文关于页副本，并建立按需翻译缓存；`migrations/0007_project_executables.sql` 会为项目加入 R2 可执行文件元数据；`migrations/0008_project_cover_images.sql` 会加入 R2 封面图片元数据。`wrangler.jsonc` 已声明 `AI` 与 `PROJECT_FILES` binding，不需要额外提供模型或 R2 API Key。生产站通过私有入口打开登录页后，首次仍使用 `123456`，登录后必须立刻修改。

`npm run deploy` 会先构建并部署 Worker，再运行 `scripts/prewarm-translations.ts` 请求线上公开接口；AI 调用始终发生在已部署的 Worker 内。Cloudflare Workers Builds 保持 Build command 为 `npm run build`，并将 Deploy command 设置为 `npm run deploy:worker`，避免重复构建，同时让 GitHub 后续每次推送都自动完成部署和预热。自定义域名变化时，可通过 `MEIKEN_SITE_URL=https://你的域名 npm run translations:prewarm` 指定预热地址。

英语和日语翻译使用 Cloudflare Workers AI 的免费额度；繁体中文转换不消耗 AI 额度。额度耗尽或模型暂时不可用时，语言切换器会明确提示失败并继续显示简体中文，不会改写源内容。相同源内容、语言和翻译版本会直接复用 D1 缓存。

生产私有入口格式如下，请勿公开或提交真实密钥：

```text
https://你的域名/admin#access=你的ADMIN_ENTRY_KEY
```

所有页面在客户端路由与异步条目加载期间显示圆环占位，加载完成后立即隐藏，不再人为延迟首屏内容。

项目列表和项目详情根据 D1 封面元数据，通过同源 Worker 接口从私有 R2 桶流式显示 Banner；URL 带上传版本用于更新后自动刷新缓存。项目详情根据文件元数据决定是否显示下载按钮；下载请求由 Worker 校验已发布项目后从私有 R2 桶流式返回，并强制使用附件下载。

备份生产文章：

```bash
npx wrangler d1 export meikensite-db --remote --output backup.sql
```

## 联系方式与捐助信息

- 联系方式和捐助方式均存储在 D1 的 `site_methods` 表，通过 `/admin` 管理，不再修改 Vue 页面中的硬编码数组。
- USDT、ETH、BTC 初始值仍是醒目的“待填写”占位内容，且默认不开启二维码；填写真实公开地址后再启用二维码。
- 二维码由 `/api/site-methods/:id/qr` 按数据库中的当前地址动态生成，修改地址后不需要替换或提交静态二维码文件。
- 数据库只允许保存公开收款地址，不要写入钱包私钥、助记词、PayPal 密钥或真实后台密码。
