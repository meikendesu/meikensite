import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [homeView, aboutView, projectsView, detailView, contactView, supportView, errorView, styles] = await Promise.all([
  readFile(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/AboutView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ProjectsView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ProjectDetailView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ContactView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/SupportView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ErrorView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
])

assert.match(homeView, /class="module-grid home-index"/, '首页导航应使用开放式工作台索引')
assert.equal((homeView.match(/class="module-card /g) || []).length, 4, '首页应保留四个原有模块入口')
assert.match(styles, /--studio-guide:/, '设计令牌应包含首页蓝色基准线')
assert.match(styles, /\.home-shell::before/, '首页应以一条基准线连接身份区与导航索引')
assert.match(styles, /\.module-card\s*>\s*i/, '模块入口应为图标、文案与箭头组成的索引行')
assert.doesNotMatch(styles, /linear-gradient\(145deg/, '头像与入口不应继续使用通用渐变光球')

for (const [name, view] of [
  ['关于页', aboutView],
  ['项目列表页', projectsView],
  ['项目详情页', detailView],
  ['联系页', contactView],
  ['捐助页', supportView],
  ['错误页', errorView]
] as const) {
  assert.match(view, /class="[^"]*editorial-shell[^"]*"/, `${name}应接入主页面的编辑式视觉框架`)
}

assert.doesNotMatch(styles, /--editorial-axis:/, '内页不应再保留中轴线位置令牌')
assert.doesNotMatch(styles, /\.editorial-shell::before/, '内页不应再显示蓝色结构线')
assert.match(styles, /--editorial-card-pad:/, '内页应使用统一的卡片横向内边距令牌')
assert.match(
  styles,
  /\.editorial-shell\s*>\s*\.page-hero\s*\{[^}]*position:\s*sticky/s,
  '桌面端内页左侧命题区应在滚动时固定'
)
assert.match(
  styles,
  /@media\s*\(max-width:\s*450px\)[\s\S]*?\.editorial-shell\s*\{[^}]*padding-inline:\s*16px/s,
  '手机端内页应使用对称的 16px 页边距'
)
assert.match(styles, /\.editorial-shell\s+\.content-block/, '关于内容应使用开放式编辑排版')
assert.match(styles, /\.editorial-shell\s+\.project-stack/, '项目列表应使用开放式纵向索引')
assert.match(styles, /\.editorial-shell\s+\.contact-options/, '联系方式应使用开放式索引行')
assert.match(styles, /\.editorial-shell\s+\.payment-card/, '捐助方式应使用开放式账本行')
assert.match(
  styles,
  /\.editorial-shell\s+\.wallet-line\s*\{[^}]*width:\s*auto/s,
  '捐助地址行应让浏览器扣除左外边距，避免复制按钮被卡片裁切'
)
assert.match(styles, /\.editorial-shell\.error-shell/, '错误页应复用相同视觉中轴')

console.log('UI design contract passed')
