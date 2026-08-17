export const TRANSLATION_VERSION = '2026-08-17-qwen3-opencc-twp-v1'

export function versionedTranslationUrl(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}translationVersion=${encodeURIComponent(TRANSLATION_VERSION)}`
}
