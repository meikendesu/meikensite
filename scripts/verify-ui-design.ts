import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [homeView, styles] = await Promise.all([
  readFile(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
])

assert.match(homeView, /class="module-grid home-index"/, '首页导航应使用开放式工作台索引')
assert.equal((homeView.match(/class="module-card /g) || []).length, 4, '首页应保留四个原有模块入口')
assert.match(styles, /--studio-guide:/, '设计令牌应包含首页蓝色基准线')
assert.match(styles, /\.home-shell::before/, '首页应以一条基准线连接身份区与导航索引')
assert.match(styles, /\.module-card\s*>\s*i/, '模块入口应为图标、文案与箭头组成的索引行')
assert.doesNotMatch(styles, /linear-gradient\(145deg/, '头像与入口不应继续使用通用渐变光球')

console.log('UI design contract passed')
