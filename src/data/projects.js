import { ref } from 'vue'

export const ProjectStoreKey = Symbol('project-store')

export function createProjectStore(initialProjects = []) {
  const projects = ref(initialProjects)
  const loaded = ref(initialProjects.length > 0)

  async function loadProjects(force = false) {
    if (loaded.value && !force) return projects.value
    const response = await fetch('/api/projects')
    if (!response.ok) throw new Error('项目列表加载失败。')
    const data = await response.json()
    projects.value = data.projects || []
    loaded.value = true
    return projects.value
  }

  async function loadProject(slug) {
    const existing = projects.value.find((project) => project.slug === slug)
    if (existing?.markdown) return existing
    const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error('项目详情加载失败。')
    const { project } = await response.json()
    const index = projects.value.findIndex((item) => item.slug === slug)
    if (index >= 0) projects.value[index] = project
    else projects.value.push(project)
    return project
  }

  function getProjectBySlug(slug) {
    return projects.value.find((project) => project.slug === slug)
  }

  return { projects, loaded, loadProjects, loadProject, getProjectBySlug }
}
