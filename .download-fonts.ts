import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const css = readFileSync('.gf-tmp.css', 'utf8')
const urls = [...css.matchAll(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g)].map((m) => m[0])
const unique = [...new Set(urls)]
console.log('total urls:', urls.length, '| unique:', unique.length)

mkdirSync('public/fonts', { recursive: true })

let done = 0
const queue = [...unique]
const workers = Array.from({ length: 20 }, async () => {
  while (queue.length) {
    const url = queue.shift()
    const name = basename(new URL(url).pathname)
    const dest = join('public/fonts', name)
    if (existsSync(dest)) {
      done++
      continue
    }
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    } catch (e) {
      console.error('FAIL', name, e.message)
    }
    done++
    if (done % 50 === 0) console.log('downloaded', done, '/', unique.length)
  }
})
await Promise.all(workers)
console.log('finished', done)

// 生成本地 fonts.css（URL 改为相对路径）
let local = css
for (const url of unique) {
  const name = basename(new URL(url).pathname)
  local = local.split(url).join('./' + name)
}
writeFileSync('public/fonts/fonts.css', local)
console.log('fonts.css written, size:', local.length)
