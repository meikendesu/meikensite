import { computed, ref } from 'vue'

const pendingLoads = ref(1)

export const pageLoading = computed(() => pendingLoads.value > 0)

export function beginPageLoading() {
  pendingLoads.value += 1
  let finished = false
  return () => {
    if (finished) return
    finished = true
    pendingLoads.value = Math.max(0, pendingLoads.value - 1)
  }
}

export function finishInitialPageLoading() {
  pendingLoads.value = Math.max(0, pendingLoads.value - 1)
}
