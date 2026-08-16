ALTER TABLE projects ADD COLUMN published_at TEXT;

UPDATE projects
SET published_at = COALESCE(NULLIF(substr(created_at, 1, 10), ''), date('now')),
    updated_at = COALESCE(NULLIF(substr(updated_at, 1, 10), ''), date('now'));

CREATE TABLE IF NOT EXISTS about_content (
  locale TEXT PRIMARY KEY CHECK (locale IN ('zh-CN', 'zh-TW', 'en', 'ja')),
  hero_title_line_1 TEXT NOT NULL,
  hero_title_line_2 TEXT NOT NULL,
  hero_copy TEXT NOT NULL DEFAULT '',
  intro_heading TEXT NOT NULL,
  intro_paragraph_1 TEXT NOT NULL DEFAULT '',
  intro_paragraph_2 TEXT NOT NULL DEFAULT '',
  facts_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO about_content (
  locale, hero_title_line_1, hero_title_line_2, hero_copy, intro_heading,
  intro_paragraph_1, intro_paragraph_2, facts_json
) VALUES
  (
    'zh-CN', '把复杂的事，', '做得清楚一点。', '关于本人的一些信息。', '一点自我介绍',
    '我喜欢观察人与日常，也喜欢把零散的想法变成可以使用、可以阅读的东西。目前关注品牌、数字产品与有温度的叙事。',
    '好设计不必大声解释自己；它应该恰好让人觉得，一切都很自然。',
    '[{"label":"在校大学生","value":"黑龙江某职业学院 2026 级新生"},{"label":"业余开发者","value":"略懂一些编程、AI 和 Linux 等..."},{"label":"菜鸡音游痴","value":"舞萌 / 中二 / PJSK / DJMAX / ..."}]'
  ),
  (
    'zh-TW', '把複雜的事，', '做得清楚一點。', '關於本人的一些資訊。', '一點自我介紹',
    '我喜歡觀察人與日常，也喜歡把零散的想法變成可以使用、可以閱讀的東西。目前關注品牌、數位產品與有溫度的敘事。',
    '好設計不必大聲解釋自己；它應該恰好讓人覺得，一切都很自然。',
    '[{"label":"在校大學生","value":"黑龍江某職業學院 2026 級新生"},{"label":"業餘開發者","value":"略懂一些程式設計、AI 和 Linux 等..."},{"label":"菜雞音遊癡","value":"舞萌 / 中二 / PJSK / DJMAX / ..."}]'
  ),
  (
    'en', 'Making complex things', 'a little clearer.', 'A few things about me.', 'A short intro',
    'I enjoy observing people and everyday life, and turning scattered ideas into things you can use and read. Right now I focus on branding, digital products, and warm storytelling.',
    'Good design shouldn''t have to explain itself loudly; it should simply feel natural.',
    '[{"label":"Student","value":"Class of 2026, a vocational college in Heilongjiang"},{"label":"Hobbyist dev","value":"A bit of coding, AI and Linux..."},{"label":"Rhythm gamer","value":"Maimai / Chunithm / PJSK / DJMAX / ..."}]'
  ),
  (
    'ja', '複雑なことを、', '少しわかりやすく。', '私についてのいくつかのこと。', '簡単な自己紹介',
    '人と日常を観察するのが好きで、散らばったアイデアを「使えるもの」「読めるもの」に変えるのが好きです。いまはブランド、デジタルプロダクト、温度のあるストーリーに関心があります。',
    'よいデザインは声高に自分を説明する必要はありません。すべてが自然だと感じさせるものであるべきです。',
    '[{"label":"大学生","value":"黒龍江の職業学院 2026 年入学"},{"label":"趣味の開発者","value":"プログラミング・AI・Linux などを少々..."},{"label":"音ゲー好き","value":"maimai / チュウニズム / PJSK / DJMAX / ..."}]'
  );
