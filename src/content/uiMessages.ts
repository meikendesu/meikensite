export type TranslationValue = string | TranslationObject | TranslationValue[]

export interface TranslationObject {
  [key: string]: TranslationValue
}

// 公开站点的唯一界面文案源。其他语言由 Worker 在访客选择后按需翻译。
export const UI_MESSAGES_ZH_CN: TranslationObject = {
  language: {
    label: '选择语言',
    translating: '正在翻译页面内容…',
    failed: '自动翻译失败，请稍后重试。'
  },
  nav: { home: '首页', about: '关于', projects: '项目', contact: '联系', support: '捐助' },
  a11y: {
    skip: '跳到主要内容',
    navigation: '页面导航',
    modules: '网站模块',
    pageLoading: '页面加载中'
  },
  common: {
    backHome: '首页',
    backProjects: '项目',
    viewProject: '查看项目',
    downloadProject: '下载项目文件',
    copy: '复制',
    open: '打开',
    close: '关闭'
  },
  home: {
    hello: '你好，',
    iAm: '我是',
    subtitle: '持续记录想法、作品和日常灵感。',
    about: '关于我',
    aboutSub: '认识一下我',
    projects: '我的项目',
    projectsSub: '看看作品',
    contact: '联系我',
    contactSub: '打个招呼',
    support: '捐助我',
    supportSub: '请我喝咖啡',
    footer: '© 2026 MEIKEN · 慢慢制作。'
  },
  projects: {
    title1: '我正在开发/参与',
    title2: '的项目。',
    pagination: '项目分页',
    previous: '上一页',
    next: '下一页',
    coverImage: '项目封面',
    publishedAt: '发布',
    updatedAt: '更新',
    listLoadFailed: '项目列表加载失败。'
  },
  contact: {
    title: '有什么想说的？',
    heroCopy: '无论是项目合作、灵感交换，还是简单地打个招呼，都很欢迎。',
    copyFailed: '复制失败，请手动复制。',
    loadFailed: '联系方式加载失败。'
  },
  support: {
    title: '请我喝一杯咖啡吧。',
    heroCopy: '每一份小小的支持，都会变成持续做下去的能量。',
    showQr: '展示二维码',
    paymentMethods: '捐助方式',
    methodUnset: '收款信息尚未填写。',
    addressCopied: '地址已复制。',
    copyFailed: '复制失败，请手动复制地址。',
    loadFailed: '捐助方式加载失败。',
    qrCode: '收款二维码'
  },
  error: {
    notFoundTitle: '页面不存在',
    notFoundDesc: '你要找的页面可能已被移动、删除，或者地址输入有误。',
    serverTitle: '服务器开小差了',
    serverDesc: '服务器暂时遇到了一点问题，请稍后再试。',
    forbiddenTitle: '没有访问权限',
    forbiddenDesc: '你没有权限查看这个页面。',
    backHome: '返回首页'
  },
  detail: {
    title: '项目详情',
    notFound: '项目不存在',
    notFoundDesc: '没有找到这个项目，可能已被移除或地址有误。',
    loading: '正在加载项目…',
    loadFailed: '项目详情加载失败。',
    executableFile: '项目文件'
  },
  about: { loadFailed: '关于页面内容加载失败。' },
  docTitle: {
    home: 'MEIKEN',
    about: '关于我 · MEIKEN',
    projects: '我的项目 · MEIKEN',
    detail: '项目详情 · MEIKEN',
    contact: '联系我 · MEIKEN',
    support: '捐助我 · MEIKEN',
    error500: '500 · 服务器错误',
    error404: '404 · 页面不存在'
  }
}
