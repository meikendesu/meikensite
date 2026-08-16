import { ref } from 'vue'
import type { Locale } from '../types'

type MessageTree = { [key: string]: string | MessageTree }

// 多语言文案字典：简体中文 / 繁体中文 / 英语 / 日语
export const messages: Record<Locale, MessageTree> = {
  'zh-CN': {
    nav: { home: '首页', about: '关于', projects: '项目', contact: '联系', support: '捐助' },
    a11y: { skip: '跳到主要内容' },
    common: { backHome: '首页', backProjects: '项目', viewProject: '查看项目', downloadApp: '下载应用', downloadUnavailable: '暂未提供下载', copy: '复制' },
    home: {
      hello: '你好，',
      iAm: '我是',
      subtitle: '持续记录想法、作品和日常灵感。',
      about: '关于我', aboutSub: 'About me',
      projects: '我的项目', projectsSub: 'My project',
      contact: '联系我', contactSub: 'Say hello',
      support: '捐助我', supportSub: 'Buy me a coffee',
      footer: '© 2026 MEIKEN · Made slowly.'
    },
    projects: { title1: '我正在开发/参与', title2: '的项目。', pagination: '项目分页', previous: '上一页', next: '下一页', publishedAt: '发布', updatedAt: '更新' },
    contact: {
      title: '有什么想说的？',
      heroCopy: '无论是项目合作、灵感交换，还是简单地打个招呼，都很欢迎。',
      emailLabel: 'EMAIL', emailValue: '通过 Email 联系',
      githubLabel: 'GITHUB',
      xLabel: 'X (TWITTER)',
      telegramLabel: 'TELEGRAM',
      youtubeLabel: 'YOUTUBE',
      biliLabel: '哔哩哔哩'
    },
    support: {
      title: '请我喝一杯咖啡吧。',
      heroCopy: '每一份小小的支持，都会变成持续做下去的能量。',
      usdt: 'USDT', usdtDesc: '推荐使用 TRC20 网络',
      showQr: '展示二维码',
      modalHint: '打开对应 App 扫描二维码赞赏',
      noteUnset: 'USDT 钱包地址尚未填写。',
      noteFill: '请先填写实际 USDT 钱包地址。',
      noteCopied: 'USDT 钱包地址已复制。',
      noteCopyFailed: '复制失败，请手动复制地址。'
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
    detail: { title: '项目详情', notFound: '项目不存在', notFoundDesc: '没有找到这个项目，可能已被移除或地址有误。' },
    docTitle: { home: 'MEIKEN', about: '关于我 · MEIKEN', projects: '我的项目 · MEIKEN', detail: '项目详情 · MEIKEN', contact: '联系我 · MEIKEN', support: '捐助我 · MEIKEN', error500: '500 · 服务器错误', error404: '404 · 页面不存在' }
  },

  'zh-TW': {
    nav: { home: '首頁', about: '關於', projects: '項目', contact: '聯繫', support: '捐助' },
    a11y: { skip: '跳到主要內容' },
    common: { backHome: '首頁', backProjects: '項目', viewProject: '查看項目', downloadApp: '下載應用', downloadUnavailable: '暫未提供下載', copy: '複製' },
    home: {
      hello: '你好，',
      iAm: '我是',
      subtitle: '持續記錄想法、作品和日常靈感。',
      about: '關於我', aboutSub: 'About me',
      projects: '我的項目', projectsSub: 'My project',
      contact: '聯繫我', contactSub: 'Say hello',
      support: '捐助我', supportSub: 'Buy me a coffee',
      footer: '© 2026 MEIKEN · Made slowly.'
    },
    projects: { title1: '我正在開發/參與', title2: '的項目。', pagination: '項目分頁', previous: '上一頁', next: '下一頁', publishedAt: '發布', updatedAt: '更新' },
    contact: {
      title: '有什麼想說的？',
      heroCopy: '無論是項目合作、靈感交換，還是簡單地打個招呼，都很歡迎。',
      emailLabel: 'EMAIL', emailValue: '透過 Email 聯繫',
      githubLabel: 'GITHUB',
      xLabel: 'X (TWITTER)',
      telegramLabel: 'TELEGRAM',
      youtubeLabel: 'YOUTUBE',
      biliLabel: '嗶哩嗶哩'
    },
    support: {
      title: '請我喝一杯咖啡吧。',
      heroCopy: '每一份小小的支持，都會變成持續做下去的能量。',
      usdt: 'USDT', usdtDesc: '推薦使用 TRC20 網路',
      showQr: '展示二維碼',
      modalHint: '開啟對應 App 掃描二維碼讚賞',
      noteUnset: 'USDT 錢包地址尚未填寫。',
      noteFill: '請先填寫實際 USDT 錢包地址。',
      noteCopied: 'USDT 錢包地址已複製。',
      noteCopyFailed: '複製失敗，請手動複製地址。'
    },
    error: {
      notFoundTitle: '頁面不存在',
      notFoundDesc: '你要找的頁面可能已被移動、刪除，或者地址輸入有誤。',
      serverTitle: '伺服器開小差了',
      serverDesc: '伺服器暫時遇到了一點問題，請稍後再試。',
      forbiddenTitle: '沒有存取權限',
      forbiddenDesc: '你沒有權限查看這個頁面。',
      backHome: '返回首頁'
    },
    detail: { title: '項目詳情', notFound: '項目不存在', notFoundDesc: '沒有找到這個項目，可能已被移除或地址有誤。' },
    docTitle: { home: 'MEIKEN', about: '關於我 · MEIKEN', projects: '我的項目 · MEIKEN', detail: '項目詳情 · MEIKEN', contact: '聯繫我 · MEIKEN', support: '捐助我 · MEIKEN', error500: '500 · 伺服器錯誤', error404: '404 · 頁面不存在' }
  },

  en: {
    nav: { home: 'Home', about: 'About', projects: 'Projects', contact: 'Contact', support: 'Support' },
    a11y: { skip: 'Skip to content' },
    common: { backHome: 'Home', backProjects: 'Projects', viewProject: 'View project', downloadApp: 'Download app', downloadUnavailable: 'Download unavailable', copy: 'Copy' },
    home: {
      hello: 'Hello, ',
      iAm: "I'm",
      subtitle: 'A space for thoughts, works, and everyday inspiration.',
      about: 'About me', aboutSub: 'About me',
      projects: 'My projects', projectsSub: 'My projects',
      contact: 'Contact', contactSub: 'Say hello',
      support: 'Support me', supportSub: 'Buy me a coffee',
      footer: '© 2026 MEIKEN · Made slowly.'
    },
    projects: { title1: 'Things I build', title2: 'or take part in.', pagination: 'Project pages', previous: 'Previous', next: 'Next', publishedAt: 'Published', updatedAt: 'Updated' },
    contact: {
      title: 'Want to say hi?',
      heroCopy: 'Whether it is a collaboration, an idea, or just a hello — always welcome.',
      emailLabel: 'EMAIL', emailValue: 'Contact via email',
      githubLabel: 'GITHUB',
      xLabel: 'X (TWITTER)',
      telegramLabel: 'TELEGRAM',
      youtubeLabel: 'YOUTUBE',
      biliLabel: 'Bilibili'
    },
    support: {
      title: 'Buy me a coffee.',
      heroCopy: 'Every bit of support keeps the momentum going.',
      usdt: 'USDT', usdtDesc: 'TRC20 network recommended',
      showQr: 'Show QR code',
      modalHint: 'Open the matching app and scan the QR code',
      noteUnset: 'USDT wallet address not set yet.',
      noteFill: 'Please fill in your USDT wallet address first.',
      noteCopied: 'USDT wallet address copied.',
      noteCopyFailed: 'Copy failed, please copy the address manually.'
    },
    error: {
      notFoundTitle: 'Page not found',
      notFoundDesc: 'The page you are looking for may have been moved, deleted, or the address is wrong.',
      serverTitle: 'Something went wrong',
      serverDesc: 'The server hit a snag. Please try again later.',
      forbiddenTitle: 'Access denied',
      forbiddenDesc: 'You do not have permission to view this page.',
      backHome: 'Back to home'
    },
    detail: { title: 'Project', notFound: 'Project not found', notFoundDesc: 'This project may have been removed or the address is wrong.' },
    docTitle: { home: 'MEIKEN', about: 'About · MEIKEN', projects: 'Projects · MEIKEN', detail: 'Project · MEIKEN', contact: 'Contact · MEIKEN', support: 'Support · MEIKEN', error500: '500 · Server Error', error404: '404 · Not Found' }
  },

  ja: {
    nav: { home: 'ホーム', about: '自己紹介', projects: 'プロジェクト', contact: '連絡', support: '支援' },
    a11y: { skip: '本文へスキップ' },
    common: { backHome: 'ホーム', backProjects: 'プロジェクト', viewProject: 'プロジェクトを見る', downloadApp: 'アプリをダウンロード', downloadUnavailable: 'ダウンロードはまだありません', copy: 'コピー' },
    home: {
      hello: 'こんにちは、',
      iAm: '私は',
      subtitle: '考え・作品・日々のひらめきを記録する場所。',
      about: '自己紹介', aboutSub: 'About me',
      projects: 'プロジェクト', projectsSub: 'My projects',
      contact: '連絡', contactSub: 'Say hello',
      support: '支援', supportSub: 'Buy me a coffee',
      footer: '© 2026 MEIKEN · Made slowly.'
    },
    projects: { title1: '私が作る・', title2: '参加するプロジェクト。', pagination: 'プロジェクトのページ', previous: '前へ', next: '次へ', publishedAt: '公開', updatedAt: '更新' },
    contact: {
      title: 'なにか一言ありますか？',
      heroCopy: 'コラボ、アイデア、それとも単なる挨拶でも、大歓迎です。',
      emailLabel: 'EMAIL', emailValue: 'メールで連絡',
      githubLabel: 'GITHUB',
      xLabel: 'X (TWITTER)',
      telegramLabel: 'TELEGRAM',
      youtubeLabel: 'YOUTUBE',
      biliLabel: 'Bilibili'
    },
    support: {
      title: 'コーヒーをおごってください。',
      heroCopy: '小さな支援が、続ける力になります。',
      usdt: 'USDT', usdtDesc: 'TRC20 ネットワーク推奨',
      showQr: 'QR コードを表示',
      modalHint: '対応アプリを開いて QR コードをスキャン',
      noteUnset: 'USDT ウォレットアドレスが未設定です。',
      noteFill: '先に実際の USDT ウォレットアドレスを入力してください。',
      noteCopied: 'USDT ウォレットアドレスをコピーしました。',
      noteCopyFailed: 'コピーに失敗しました。アドレスを手動でコピーしてください。'
    },
    error: {
      notFoundTitle: 'ページが見つかりません',
      notFoundDesc: 'お探しのページは移動・削除されたか、アドレスが間違っている可能性があります。',
      serverTitle: 'サーバーで問題が発生しました',
      serverDesc: 'サーバーで一時的な問題が起きています。しばらくしてから再度お試しください。',
      forbiddenTitle: 'アクセス権限がありません',
      forbiddenDesc: 'このページを閲覧する権限がありません。',
      backHome: 'ホームへ戻る'
    },
    detail: { title: 'プロジェクト', notFound: 'プロジェクトが見つかりません', notFoundDesc: 'このプロジェクトは削除されたか、アドレスが間違っている可能性があります。' },
    docTitle: { home: 'MEIKEN', about: '自己紹介 · MEIKEN', projects: 'プロジェクト · MEIKEN', detail: 'プロジェクト · MEIKEN', contact: '連絡 · MEIKEN', support: '支援 · MEIKEN', error500: '500 · サーバーエラー', error404: '404 · 見つかりません' }
  }
}

const STORAGE_KEY = 'meiken-locale'

// 从语言字符串（浏览器 language 或 Accept-Language 头）推断 locale
function isLocale(value: string): value is Locale {
  return value in messages
}

function resolveLocale(lang?: string | null): Locale {
  if (!lang) return 'zh-CN'
  const l = String(lang).toLowerCase()
  if (l.startsWith('zh')) {
    return /(tw|hk|mo|hant)/.test(l) ? 'zh-TW' : 'zh-CN'
  }
  if (l.startsWith('ja')) return 'ja'
  if (l.startsWith('en')) return 'en'
  return 'zh-CN'
}

// SSR 安全：客户端优先读 localStorage / navigator，服务端无这些全局对象
function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && isLocale(saved)) return saved
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return resolveLocale(navigator.language)
  }
  return 'zh-CN'
}

export const locale = ref<Locale>(detectLocale())

// SSR 时根据请求的 Accept-Language 头设置初始语言（避免 hydration 不一致）
export function initLocale(acceptLanguage?: string | null) {
  if (!acceptLanguage) return
  locale.value = resolveLocale(acceptLanguage.split(',')[0])
}

export function t(key: string): string {
  let value: string | MessageTree | undefined = messages[locale.value]
  for (const segment of key.split('.')) {
    value = typeof value === 'object' ? value[segment] : undefined
  }
  return typeof value === 'string' ? value : key
}

export function setLocale(value: Locale) {
  locale.value = value
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, value)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = value
  }
}
