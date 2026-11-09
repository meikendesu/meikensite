import assert from 'node:assert/strict'
import { createServer } from 'vite'

// 使用真实 Vue SSR 和路由验证整合行为，不将 CSS 写法当成产品行为。
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.ts')
  const { createApp } = await server.ssrLoadModule('/src/app.ts')
  const about = {
    locale: 'zh-CN', heroTitleLine1: '真实个人介绍，', heroTitleLine2: '来自后台。',
    heroCopy: '个人说明', introHeading: '自我介绍', introParagraph1: '后台维护的介绍正文。',
    introParagraph2: '第二段内容。', factsJson: '[{"label":"身份","value":"开发者"}]'
  }
  const project = {
    id: 1, slug: 'real-project', name: '后台项目', tag: '应用', desc: '项目介绍', markdown: '## 正文',
    published: 1, publishedAt: '2026-11-01', updatedAt: '2026-11-02', hasCover: 0, hasExecutable: 0
  }
  const methods = [
    { id: 1, category: 'contact', methodKey: 'email', name: '电子邮箱', description: '邮件联系', value: 'hello@example.com', actionType: 'email', icon: 'fa-regular fa-envelope', enabled: 1, qrEnabled: 0 },
    { id: 2, category: 'donation', methodKey: 'support', name: '支持入口', description: '支持创作', value: 'https://example.com/support', actionType: 'link', icon: 'fa-solid fa-heart', enabled: 1, qrEnabled: 0 }
  ]
  const env = { DB: { prepare(sql: string) {
    let params: unknown[] = []
    return {
      bind(...values: unknown[]) { params = values; return this },
      async first() {
        if (sql.includes('about_content')) return about
        if (sql.includes('COUNT(*)')) return { count: 1 }
        if (sql.includes('FROM projects')) return project
        return null
      },
      async all() {
        if (sql.includes('FROM projects')) return { results: [project] }
        if (sql.includes('FROM site_methods')) return { results: methods.filter(m => !params[0] || m.category === params[0]) }
        return { results: [] }
      }
    }
  } } }
  const home = await render('/', undefined, env)
  let previous = -1
  for (const id of ['home', 'about', 'projects', 'contact', 'support']) {
    const position = home.html.indexOf(`id="${id}"`)
    assert.ok(position > previous, `主页应依次渲染 ${id} 区块`)
    previous = position
  }
  for (const text of ['后台维护的介绍正文。', '后台项目', 'mailto:hello@example.com', 'https://example.com/support', '查看更多项目']) {
    assert.ok(home.html.includes(text), `首页 SSR 应提供真实内容及入口：${text}`)
  }
  assert.ok(home.html.includes('href="/projects"'), '查看更多项目应进入独立列表')
  assert.ok(home.html.includes('/projects/real-project'), '精选项目应链接独立详情')
  assert.equal(home.projects.length, 1)
  assert.equal(home.siteMethods.length, 2)
  assert.equal(home.aboutContent.introParagraph1, about.introParagraph1)
  for (const [path, hash] of [['/about', '#about'], ['/contact', '#contact'], ['/support', '#support']]) {
    const { router } = createApp({ url: path })
    await router.push(path)
    await router.isReady()
    assert.equal(router.currentRoute.value.path, '/', `${path} 应回到主页`)
    assert.equal(router.currentRoute.value.hash, hash)
    const legacy = await render(path, undefined, env)
    assert.ok(legacy.html.includes('后台维护的介绍正文。'), '旧链接也应预加载整页内容')
  }
  for (const path of ['/projects', '/projects/real-project']) {
    const { router } = createApp({ url: path })
    await router.push(path)
    assert.equal(router.currentRoute.value.path, path, '项目列表和详情应独立保留')
  }
  const { router: anchorRouter } = createApp({ url: '/' })
  await anchorRouter.push('/')
  const current = anchorRouter.currentRoute.value
  assert.deepEqual(await anchorRouter.options.scrollBehavior({ ...current, hash: '#access=local-test-only' }, current, null), { top: 0 }, '私有入口片段不应交给 CSS 选择器解析')
  assert.equal((await anchorRouter.options.scrollBehavior({ ...current, hash: '#about' }, current, null)).el, '#about', '已知区块应正常定位')
  const empty = await render('/')
  assert.ok(empty.html.includes('id="support"'), '数据未就绪时仍应保留导航目标')
  assert.ok(!empty.html.includes('后台项目'), '空数据不能展示虚构项目')
  console.log('✓ 合并主页 SSR、后台数据、旧链接定位、独立项目路由和空状态验证通过')
} finally {
  await server.close()
}
