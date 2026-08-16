import { ref, type InjectionKey, type Ref } from 'vue'
import type { Project, ProjectPagination } from '../types'

const DEFAULT_PAGINATION: ProjectPagination = { page: 1, pageSize: 10, total: 0, totalPages: 1 }

export interface ProjectStore {
  projects: Ref<Project[]>
  pagination: Ref<ProjectPagination>
  loaded: Ref<boolean>
  loadProjects(page?: number, force?: boolean): Promise<Project[]>
  loadProject(slug: string): Promise<Project | null>
  getProjectBySlug(slug: string): Project | undefined
}

export const ProjectStoreKey: InjectionKey<ProjectStore> = Symbol('project-store')

export function createProjectStore(
  initialProjects: Project[] = [],
  initialPagination: ProjectPagination = DEFAULT_PAGINATION
): ProjectStore {
  const projects = ref<Project[]>(initialProjects)
  const pagination = ref<ProjectPagination>({ ...initialPagination })
  // 项目详情 SSR 也会注入单篇文章；只有带列表总数时才视为列表已加载。
  const loaded = ref(initialProjects.length > 0 && initialPagination.total > 0)

  async function loadProjects(page = 1, force = false) {
    if (loaded.value && pagination.value.page === page && !force) return projects.value
    const response = await fetch(`/api/projects?page=${page}`)
    if (!response.ok) throw new Error('项目列表加载失败。')
    const data = await response.json() as { projects?: Project[]; pagination?: ProjectPagination }
    projects.value = data.projects || []
    pagination.value = data.pagination || { ...DEFAULT_PAGINATION, page }
    loaded.value = true
    return projects.value
  }

  async function loadProject(slug: string) {
    const existing = projects.value.find((project) => project.slug === slug)
    if (existing?.markdown) return existing
    const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error('项目详情加载失败。')
    const { project } = await response.json() as { project: Project }
    const index = projects.value.findIndex((item) => item.slug === slug)
    if (index >= 0) projects.value[index] = project
    else projects.value.push(project)
    return project
  }

  function getProjectBySlug(slug: string) {
    return projects.value.find((project) => project.slug === slug)
  }

  return { projects, pagination, loaded, loadProjects, loadProject, getProjectBySlug }
}
