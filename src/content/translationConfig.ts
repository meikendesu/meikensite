export const TRANSLATION_VERSION = '2026-11-09-unified-home-v2'

export function versionedTranslationUrl(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}translationVersion=${encodeURIComponent(TRANSLATION_VERSION)}`
}
