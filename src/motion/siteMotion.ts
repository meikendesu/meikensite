import { advanceSpring, type SpringState } from './spring'

const entranceSelector = [
  '.hero-copy-block > h1', '.hero-copy-block > p', '.hero-actions', '.hero-art',
  '.home-section > h2', '.section-heading', '.about-intro', '.facts-list > div',
  '.featured-project', '.more-projects', '.contact-row', '.support-heading', '.payment-card',
  '.page-hero', '.work-card', '.project-detail-cover', '.detail-download',
  '.admin-header', '.admin-panel', '.auth-panel', '.site-footer'
].join(',')

/** 渐进增强：服务端内容始终可见，只有客户端准备好后才启用入场效果。 */
export function installSiteMotion(root: HTMLElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  const seen = new WeakSet<Element>()
  const pending = new Set<HTMLElement>()
  const animations = new Set<Animation>()
  let observer: IntersectionObserver | undefined
  let stopped = false

  function animate(element: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) {
    if (reduced.matches || !element.animate) return
    const animation = element.animate(frames, options)
    animations.add(animation)
    const release = () => { animations.delete(animation); animation.cancel() }
    animation.addEventListener('finish', release, { once: true })
    animation.addEventListener('cancel', () => animations.delete(animation), { once: true })
  }
  function reveal(element: HTMLElement, immediate = false) {
    pending.delete(element)
    observer?.unobserve(element)
    element.removeAttribute('data-motion-pending')
    if (immediate || reduced.matches) return
    const index = Array.from(element.parentElement?.children || []).indexOf(element)
    animate(element, [
      { opacity: 0, transform: 'translateY(22px) scale(.985)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], { duration: 620, delay: Math.min(Math.max(index, 0), 4) * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' })
  }
  if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) reveal(entry.target as HTMLElement)
    }, { threshold: 0 })
  }
  function scan(container: Element) {
    const elements = [...(container.matches(entranceSelector) ? [container] : []), ...container.querySelectorAll(entranceSelector)]
    for (const element of elements) {
      if (!(element instanceof HTMLElement) || seen.has(element)) continue
      seen.add(element)
      if (!observer || reduced.matches || element.contains(document.activeElement)) continue
      pending.add(element)
      element.setAttribute('data-motion-pending', '')
      observer.observe(element)
    }
  }
  scan(root)
  const mutations = new MutationObserver(records => {
    for (const record of records) for (const added of record.addedNodes) {
      if (added instanceof Element) scan(added)
    }
    for (const element of pending) if (!element.isConnected) {
      observer?.unobserve(element)
      pending.delete(element)
    }
  })
  mutations.observe(root, { childList: true, subtree: true })

  // 键盘定位不等待视觉入场，焦点不能落在暂时透明的内容里。
  function onFocus(event: FocusEvent) {
    if (!(event.target instanceof Element)) return
    const element = event.target.closest<HTMLElement>('[data-motion-pending]')
    if (element) reveal(element, true)
    for (const animation of animations) {
      const target = (animation.effect as KeyframeEffect | null)?.target
      if (target instanceof Element && target.contains(event.target)) animation.cancel()
    }
  }
  root.addEventListener('focusin', onFocus)

  // 两个独立弹簧保留当前位置和速度，快速改变方向也不会突然跳回原点。
  let image: HTMLElement | null = null
  let x: SpringState = { position: 0, velocity: 0 }
  let y: SpringState = { position: 0, velocity: 0 }
  let targetX = 0
  let targetY = 0
  let frame = 0
  let previousTime = 0
  function resetHero() {
    cancelAnimationFrame(frame)
    frame = 0
    image?.style.removeProperty('transform')
    image?.style.removeProperty('will-change')
    image = null
    x = { position: 0, velocity: 0 }
    y = { position: 0, velocity: 0 }
    targetX = targetY = previousTime = 0
  }
  function tick(time: number) {
    frame = 0
    if (stopped || reduced.matches || !image?.isConnected || document.hidden) { resetHero(); return }
    const dt = previousTime ? (time - previousTime) / 1000 : 1 / 60
    previousTime = time
    x = advanceSpring(x, targetX, dt)
    y = advanceSpring(y, targetY, dt)
    image.style.transform = `perspective(900px) rotateX(${-y.position * 3}deg) rotateY(${x.position * 4}deg) translate3d(${x.position * 7}px,${y.position * 7}px,0)`
    if (Math.abs(x.position - targetX) + Math.abs(y.position - targetY) + Math.abs(x.velocity) + Math.abs(y.velocity) > .003) {
      frame = requestAnimationFrame(tick)
    } else {
      previousTime = 0
      image.style.removeProperty('will-change')
      if (!targetX && !targetY) resetHero()
    }
  }
  function startHero() {
    if (!frame) { image?.style.setProperty('will-change', 'transform'); frame = requestAnimationFrame(tick) }
  }
  function onPointerMove(event: PointerEvent) {
    if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse' || !(event.target instanceof Element)) return
    const hero = event.target.closest<HTMLElement>('.home-hero')
    if (!hero) {
      if (image && (targetX || targetY)) { targetX = targetY = 0; startHero() }
      return
    }
    image = hero.querySelector('.hero-art img')
    if (!image) return
    const bounds = hero.getBoundingClientRect()
    targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
    targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
    startHero()
  }
  function onPointerLeave() { if (image) { targetX = targetY = 0; startHero() } }
  root.addEventListener('pointermove', onPointerMove, { passive: true })
  root.addEventListener('pointerleave', onPointerLeave)

  function onVisibility() {
    if (!document.hidden) return
    resetHero()
    for (const element of [...pending]) reveal(element, true)
    for (const animation of animations) animation.cancel()
  }
  function onPreferenceChange() {
    resetHero()
    if (!reduced.matches) return
    for (const element of [...pending]) reveal(element, true)
    for (const animation of animations) animation.cancel()
  }
  reduced.addEventListener('change', onPreferenceChange)
  finePointer.addEventListener('change', resetHero)
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    stopped = true
    resetHero()
    observer?.disconnect()
    mutations.disconnect()
    for (const element of pending) element.removeAttribute('data-motion-pending')
    for (const animation of animations) animation.cancel()
    root.removeEventListener('focusin', onFocus)
    root.removeEventListener('pointermove', onPointerMove)
    root.removeEventListener('pointerleave', onPointerLeave)
    reduced.removeEventListener('change', onPreferenceChange)
    finePointer.removeEventListener('change', resetHero)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

export function enterPage(element: Element, done: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (preference.matches || !element.animate) { done(); return }
  const animation = element.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' })
  function finish() {
    animation.onfinish = animation.oncancel = null
    preference.removeEventListener('change', finish)
    animation.cancel()
    done()
  }
  preference.addEventListener('change', finish)
  animation.onfinish = animation.oncancel = finish
}
