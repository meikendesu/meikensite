-- 公开内容只保留简体中文源；其他语言是按需生成、可随时重建的派生缓存。
DELETE FROM about_content WHERE locale <> 'zh-CN';

CREATE TABLE IF NOT EXISTS translation_cache (
  scope TEXT NOT NULL,
  source_key TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('zh-TW', 'en', 'ja')),
  source_hash TEXT NOT NULL,
  translated_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, source_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_updated_at
  ON translation_cache(updated_at);
