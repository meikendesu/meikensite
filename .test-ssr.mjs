import { render } from './dist/server/entry-server.js'
const req = { headers: { get: (k) => (k === 'accept-language' ? 'zh-CN,zh;q=0.9' : null) } }
const { html, locale } = await render('/', req)
console.log('locale:', locale)
console.log('rendered content length:', html.length)
console.log('contains 你好:', html.includes('你好'))
console.log('contains MEIKEN:', html.includes('MEIKEN'))
console.log('--- preview ---')
console.log(html.replace(/></g, '>\n<').slice(0, 600))
