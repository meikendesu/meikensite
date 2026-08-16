/// <reference types="vite/client" />

import type { Project, SiteMethod } from './src/types'

declare global {
  interface Window {
    __MEIKEN_STATE__?: {
      projects?: Project[]
      siteMethods?: SiteMethod[]
    }
  }
}

export {}
