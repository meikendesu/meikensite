import assert from 'node:assert/strict'
import { advanceSpring } from '../src/motion/spring'
import { enterPage, installSiteMotion } from '../src/motion/siteMotion'

let state = { position: 0, velocity: 0 }
for (let frame = 0; frame < 180; frame++) {
  state = advanceSpring(state, 1, 1 / 60)
  assert.ok(state.position >= 0 && state.position <= 1.001, '静止目标不应产生明显过冲')
}
assert.ok(Math.abs(state.position - 1) < 0.001, '弹簧应收敛到目标')

state = advanceSpring({ position: 0.4, velocity: 2 }, -1, 1 / 120)
assert.ok(state.position > 0.4, '反向操作应保留当前速度，再平滑转向')
assert.ok(state.position < 0.42, '目标变化不应造成位置跳变')
assert.deepEqual(
  advanceSpring({ position: 0, velocity: 0 }, 1, 10),
  advanceSpring({ position: 0, velocity: 0 }, 1, 1 / 30),
  '后台恢复时应限制时间步长，避免长帧造成数值爆炸'
)
assert.deepEqual(advanceSpring({ position: 0.5, velocity: 1 }, 1, 0), { position: 0.5, velocity: 1 })
console.log('Motion: convergence, interruption, long-frame and zero-frame checks passed.')

// 小型浏览器替身只验证可访问性与生命周期，不断言 CSS 的具体实现。
class TestElement extends EventTarget {
  attributes = new Set<string>()
  isConnected = true
  children: TestElement[] = []
  parentElement: TestElement | null = null
  style = { removeProperty() {} }
  matches() { return false }
  querySelectorAll() { return this.children }
  contains() { return false }
  setAttribute(name: string) { this.attributes.add(name) }
  removeAttribute(name: string) { this.attributes.delete(name) }
  animate() { throw new Error('减少动态效果时不应调用动画 API') }
}
const preference = new EventTarget() as EventTarget & { matches: boolean }
preference.matches = true
let disconnected = 0
let observed = 0
class TestObserver {
  observe() { observed++ }
  unobserve() {}
  disconnect() { disconnected++ }
}
const testDocument = new EventTarget() as EventTarget & { activeElement: null; hidden: boolean }
testDocument.activeElement = null
testDocument.hidden = false
Object.assign(globalThis, {
  Element: TestElement, HTMLElement: TestElement, document: testDocument,
  IntersectionObserver: TestObserver, MutationObserver: TestObserver,
  cancelAnimationFrame() {},
  window: { matchMedia: () => preference, IntersectionObserver: TestObserver }
})
const root = new TestElement()
const section = new TestElement()
root.children.push(section)
let cleanup = installSiteMotion(root as unknown as HTMLElement)
assert.equal(section.attributes.has('data-motion-pending'), false, '减少动态效果时正文立即可见')
cleanup()
assert.equal(disconnected, 2, '卸载时应断开两个观察器')

preference.matches = false
cleanup = installSiteMotion(root as unknown as HTMLElement)
assert.equal(section.attributes.has('data-motion-pending'), true, '普通模式为内容准备滚动入场')
assert.ok(observed > 0, '滚动入场应注册观察器')
preference.matches = true
preference.dispatchEvent(new Event('change'))
assert.equal(section.attributes.has('data-motion-pending'), false, '运行中切换减少动态效果应立即显示未入场内容')
cleanup()

preference.matches = false
cleanup = installSiteMotion(root as unknown as HTMLElement)
cleanup()
assert.equal(section.attributes.has('data-motion-pending'), false, '卸载不能遗留透明内容')
console.log('Motion: reduced-motion preference, live changes and cleanup checks passed.')

let pageDone = 0
let pageCancelled = 0
const pageAnimation = {
  onfinish: null as (() => void) | null,
  oncancel: null as (() => void) | null,
  cancel() { pageCancelled++; this.oncancel?.() }
}
const page = { animate: () => pageAnimation } as unknown as Element
enterPage(page, () => pageDone++)
preference.matches = true
preference.dispatchEvent(new Event('change'))
assert.equal(pageDone, 1, '页面切换中启用减少动态效果应立即完成，且只回调一次')
assert.equal(pageCancelled, 1, '页面淡入应在偏好变化时取消')
enterPage(page, () => pageDone++)
assert.equal(pageDone, 2, '减少动态效果下切页不能等待动画')
console.log('Motion: page transitions respect live preference changes without blocking navigation.')
