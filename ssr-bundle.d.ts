declare module '*dist/server/entry-server.js' {
  export function render(
    url: string,
    request?: Request,
    env?: Env
  ): Promise<{
    html: string
    locale: string
    projects: unknown[]
    siteMethods: unknown[]
    status: number
  }>
}
