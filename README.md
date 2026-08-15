# MEIKEN · Vue 3 + Vite SSR

Vue 3 + Cloudflare Workers SSR 个人站。项目文章和管理员认证数据存储在 Cloudflare D1。

## 技术栈

- Vue 3（`<script setup>`）
- Vue Router 4（HTML5 history 路由）
- Vite 6（客户端 + SSR 构建）
- Cloudflare Workers + Assets
- Cloudflare D1（项目文章、管理员密码哈希、登录会话）
- Markdown It（安全模式，不执行文章中的原始 HTML）

## 主要目录

```text
meikensite/
├── worker.js               # Worker SSR 与 API 入口
├── wrangler.jsonc          # Assets、D1 和日志配置
├── migrations/             # D1 数据库迁移
├── src/
│   ├── entry-client.js     # 浏览器 hydration 入口
│   ├── entry-server.js     # SSR 入口
│   ├── router.js           # 页面路由与按需拆包
│   ├── data/projects.js    # 项目数据 store / API 客户端
│   └── views/AdminView.vue # 登录、改密、Markdown 项目管理
└── public/                 # 字体、USDT 二维码等静态资源
```

## 常用命令

```bash
npm install
npm run dev                 # 仅启动 Vite 客户端，不包含 Worker API
npm run build               # 产出 dist/client 与 dist/server
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
3. 新建或编辑项目，可直接撰写 Markdown，也可导入不超过 400 KB 的 `.md` 文件。
4. 勾选“公开发布”后保存，文章会出现在 `/projects`。

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

`migrations/0001_admin_projects.sql` 会创建管理员、会话、项目表，并迁移原有 Wawawa 项目文章。生产站首次访问 `/admin` 时仍使用 `123456`，登录后必须立刻修改。

备份生产文章：

```bash
npx wrangler d1 export meikensite-db --remote --output backup.sql
```

## 捐助信息待填写

- 在 `src/views/SupportView.vue` 的 `methods` 中填写 USDT、ETH、BTC 公开收款地址和 PayPal.Me 链接。
- USDT 二维码位于 `public/payment/usdt-qr.svg`；微信和支付宝方式及二维码已删除。
- 仓库只允许保存公开收款地址，不要写入钱包私钥、助记词、PayPal 密钥或真实后台密码。
