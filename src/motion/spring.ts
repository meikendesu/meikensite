export interface SpringState { position: number; velocity: number }

// 临界阻尼；保留速度以支持随时反向，限制长帧避免切回标签页时跳动。
export function advanceSpring(state: SpringState, target: number, elapsed: number): SpringState {
  const dt = Math.max(0, Math.min(elapsed, 1 / 30))
  const offset = state.position - target
  const momentum = state.velocity + 13 * offset
  const decay = Math.exp(-13 * dt)
  return {
    position: target + (offset + momentum * dt) * decay,
    velocity: (state.velocity - 13 * momentum * dt) * decay
  }
}
