/// <reference types="vite/client" />

import type { AboutContent, Project, ProjectPagination, SiteMethod } from './src/types'

declare global {
  interface Window {
    __MEIKEN_STATE__?: {
      projects?: Project[]
      projectPagination?: ProjectPagination
      siteMethods?: SiteMethod[]
      aboutContent?: AboutContent | null
    }
  }
}

export {}
