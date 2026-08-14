import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://127.0.0.1:4175/projects')
await page.waitForLoadState('networkidle')
await page.click('a[href="/projects/yelu"]')
await page.waitForTimeout(600)
console.log('after detail, title text:', (await page.textContent('h1')).trim())
await page.click('a.back-link')
await page.waitForTimeout(1000)
const h1 = await page.textContent('h1').catch(() => '(none)')
const bodyLen = (await page.content()).length
console.log('after back, h1:', h1 ? h1.trim() : '(none)', '| bodyLen:', bodyLen)
console.log('errors:', errors.length ? errors.join(' | ') : '(none)')
await page.screenshot({ path: '.repro.png' })
await browser.close()
