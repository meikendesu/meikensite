import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [
  homeView,
  aboutView,
  projectsView,
  detailView,
  contactView,
  supportView,
  errorView,
  adminView,
  adminAboutView,
  adminProjectView,
  adminMethodView,
  localeSwitcher,
  styles,
  packageJson
] = await Promise.all([
  readFile(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/AboutView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ProjectsView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ProjectDetailView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ContactView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/SupportView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/ErrorView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/AdminView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/AdminAboutEditorView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/AdminProjectEditorView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/AdminMethodEditorView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/LocaleSwitcher.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8')
])

function rulesFor(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = [...styles.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'gs'))]
  assert.ok(matches.length > 0, `找不到样式规则：${selector}`)
  return matches.map((match) => match[1]).join('\n')
}

function assertFilledWithoutHorizontalLines(selector: string) {
  const rule = rulesFor(selector)
  assert.match(rule, /background:\s*var\(--surface-[^)]+\)/, `${selector} 应使用层级底色`)
  const lastBorderReset = rule.lastIndexOf('border: 0')
  const lastHorizontalLine = Math.max(rule.lastIndexOf('border-top:'), rule.lastIndexOf('border-bottom:'))
  assert.ok(lastBorderReset > lastHorizontalLine, `${selector} 不应使用横向分隔线`)
}

assert.match(homeView, /class="module-grid home-index"/, '首页导航应使用开放式工作台索引')
assert.equal((homeView.match(/class="module-card /g) || []).length, 4, '首页应保留四个原有模块入口')
assert.doesNotMatch(styles, /--studio-guide:/, '首页不应再保留蓝色基准线令牌')
assert.doesNotMatch(styles, /\.home-shell::before/, '首页不应再显示蓝色竖线')
assert.match(styles, /\.module-card\s*>\s*i/, '模块入口应为图标、文案与箭头组成的索引行')
assert.doesNotMatch(styles, /linear-gradient\(145deg/, '头像与入口不应继续使用通用渐变光球')
assert.match(
  styles,
  /@media\s*\(max-width:\s*450px\)[\s\S]*?\.home-shell\s*\{[^}]*padding:\s*28px\s+20px\s+30px/s,
  '手机端首页应使用对称的 20px 左右页边距'
)
assert.match(styles, /--surface-soft:/, '公开页面应定义柔和内容底色')
assert.match(styles, /--surface-raised:/, '公开页面应定义交互层底色')
assert.match(rulesFor('.module-grid'), /gap:\s*12px/, '首页模块之间应以留白代替横线')
assertFilledWithoutHorizontalLines('.module-card')

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
assert.match(rulesFor('.editorial-shell .contact-options'), /gap:\s*12px/, '联系方式卡片之间应保留稳定间距')
assert.match(rulesFor('.editorial-shell .contact-row'), /display:\s*grid/, '手机端联系方式应使用稳定网格')
assert.match(
  rulesFor('.editorial-shell .contact-row'),
  /grid-template-columns:\s*48px\s+minmax\(0,\s*1fr\)\s+32px/,
  '手机端联系方式应固定图标列与操作列，并让文字列弹性伸缩'
)
assert.match(rulesFor('.editorial-shell .contact-row > div'), /min-width:\s*0/, '联系方式文字列应允许安全收缩')
for (const selector of [
  '.editorial-shell .content-block',
  '.editorial-shell .facts-list div',
  '.editorial-shell .work-card',
  '.editorial-shell .contact-row',
  '.editorial-shell .payment-card',
  '.editorial-shell.error-shell .error-box'
]) {
  assertFilledWithoutHorizontalLines(selector)
}
assert.doesNotMatch(projectsView, /class="work-actions"|class="work-btn"/, '项目卡片不应保留查看按钮')
assert.match(projectsView, /useRouter/, '项目卡片应通过路由器直接打开详情')
assert.match(projectsView, /role="link"/, '可点击的项目卡片应声明链接语义')
assert.match(projectsView, /tabindex="0"/, '项目卡片应支持键盘聚焦')
assert.match(projectsView, /@click="openProject\(p\)"/, '点击项目卡片应打开详情')
assert.match(projectsView, /@keydown\.enter="openProject\(p\)"/, 'Enter 键应打开项目详情')
assert.match(projectsView, /@keydown\.space\.prevent="openProject\(p\)"/, '空格键应打开项目详情')
assert.doesNotMatch(detailView, /PageHeader|<header/, '项目详情页不应保留顶部 Header')
assert.match(detailView, /class="detail-back-float"/, '项目详情页应提供固定悬浮返回按钮')
assert.match(detailView, /to="\/projects"/, '项目详情返回按钮应回到项目列表')
assert.match(rulesFor('.detail-back-float'), /position:\s*fixed/, '项目详情返回按钮应固定在视口左上角')
assert.match(rulesFor('.detail-back-float'), /min-height:\s*44px/, '项目详情返回按钮应保留足够触控高度')
assert.match(detailView, /<article class="markdown-body"/, '项目正文应保持为主区域的直接 article')
assert.match(rulesFor('.editorial-shell .detail-download'), /background:\s*transparent/, '下载入口应去除底色')
assert.match(rulesFor('.editorial-shell .markdown-body'), /background:\s*transparent/, '项目正文应去除底色')
assert.match(
  styles,
  /@media\s*\(min-width:\s*900px\)[\s\S]*?\.detail-shell\s*>\s*\.detail-download\s*\{[^}]*grid-column:\s*1/s,
  '桌面端下载入口应放在左侧'
)
assert.match(
  styles,
  /@media\s*\(min-width:\s*900px\)[\s\S]*?\.editorial-shell\s+\.work-card\s*\{[^}]*padding:\s*20px\s+var\(--editorial-card-pad\)/s,
  '桌面端项目卡片应稍微收紧高度'
)
assert.match(
  styles,
  /\.editorial-shell\s+\.wallet-line\s*\{[^}]*width:\s*auto/s,
  '捐助地址行应让浏览器扣除左外边距，避免复制按钮被卡片裁切'
)
assert.match(styles, /\.editorial-shell\.error-shell/, '错误页应复用相同视觉中轴')
assert.match(rulesFor('.tabbar a.active'), /background:\s*var\(--surface-accent\)/, '菜单选中态应使用底色而不是下划线')
assert.ok(
  rulesFor('.tabbar a.active').lastIndexOf('border: 0') > rulesFor('.tabbar a.active').lastIndexOf('border-bottom'),
  '菜单选中态不应保留横线'
)
assert.match(
  rulesFor('.tabbar'),
  /width:\s*min\(calc\(100%\s*-\s*24px\),\s*372px\)/,
  '移动端底栏应利用可用宽度，避免六个入口拥挤'
)
assert.match(rulesFor('.tabbar'), /bottom:\s*max\(12px,\s*env\(safe-area-inset-bottom\)\)/, '移动端底栏应适配底部安全区')
assert.match(rulesFor('.tabbar a'), /min-height:\s*48px/, '移动端底栏入口应提供稳定触控高度')
assert.match(rulesFor('.tabbar a'), /width:\s*100%/, '移动端底栏入口应均分可点击区域')
assert.match(rulesFor('.locale-switcher-trigger'), /min-height:\s*48px/, '移动端语言入口应与其他入口保持相同触控高度')
assert.match(localeSwitcher, /:class="\{ open \}"/, '语言入口应暴露菜单打开态供底栏显示反馈')
assert.match(rulesFor('.tabbar .locale-switcher-trigger'), /align-content:\s*center/, '底栏语言入口的图标和文字应垂直居中')
assert.match(rulesFor('.tabbar .locale-switcher-trigger'), /padding:\s*5px\s+2px/, '底栏语言入口应与其他 Tab 使用相同内边距')
assert.match(
  rulesFor('.tabbar .locale-switcher.open .locale-switcher-trigger'),
  /background:\s*var\(--surface-accent\)/,
  '语言菜单展开时应显示与选中 Tab 一致的底色反馈'
)
assert.match(aboutView, /class="shell page-shell editorial-shell about-shell"/, '关于页应提供独立的内容高度调整作用域')
assert.match(rulesFor('.editorial-shell.about-shell > .content-block'), /align-self:\s*start/, '关于简介卡片高度应由内容决定')
assert.match(rulesFor('.editorial-shell.about-shell .facts-list div'), /min-height:\s*0/, '关于信息卡片不应保留固定最小高度')
assert.match(rulesFor('.site-footer'), /color:\s*var\(--label-2\)/, '首页页脚文字应保持可读对比度')
assert.match(rulesFor('.support-note'), /visibility:\s*hidden/, '未触发的捐助提示不应留下空白浮层')
assert.match(rulesFor('.support-note.show'), /visibility:\s*visible/, '触发后的捐助提示应正常显示')

for (const [name, view] of [
  ['管理首页', adminView],
  ['关于编辑页', adminAboutView],
  ['项目编辑页', adminProjectView],
  ['方法编辑页', adminMethodView]
] as const) {
  assert.match(view, /class="[^\"]*admin-shell[^\"]*"/, `${name}应使用统一 Admin 工作台`)
}
assert.match(rulesFor('.admin-shell'), /--admin-panel:\s*var\(--surface-soft\)/, 'Admin 应复用公开页柔和表面令牌')
assert.match(rulesFor('.admin-shell'), /--admin-control:\s*var\(--surface-raised\)/, 'Admin 控件应使用抬升表面令牌')
assert.match(rulesFor('.admin-panel'), /background:\s*var\(--admin-panel\)/, 'Admin 分组应使用实色工作台表面')
assert.match(rulesFor('.admin-panel'), /border:\s*0/, 'Admin 分组不应使用描边卡片')
assert.match(rulesFor('.admin-project-list'), /gap:\s*10px/, 'Admin 列表应以留白分隔行项目')
assert.match(rulesFor('.admin-project-list article'), /background:\s*var\(--admin-control\)/, 'Admin 行项目应使用独立底色')
assert.match(rulesFor('.admin-project-list article'), /border:\s*0/, 'Admin 行项目不应使用横线')
assert.match(rulesFor('.admin-panel input'), /background:\s*var\(--admin-control\)/, 'Admin 输入控件应使用统一底色')
assert.equal(JSON.parse(packageJson).version, '1.5.0', '1.5 发布应同步 package 版本')

console.log('UI design contract passed')
