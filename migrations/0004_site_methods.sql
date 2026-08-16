CREATE TABLE IF NOT EXISTS site_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK (category IN ('contact', 'donation')),
  method_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'fa-solid fa-link',
  action_type TEXT NOT NULL DEFAULT 'link' CHECK (action_type IN ('email', 'link', 'copy', 'crypto')),
  qr_enabled INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_methods_category_order
  ON site_methods(category, is_enabled, sort_order, id);

INSERT OR IGNORE INTO site_methods
  (category, method_key, name, description, value, icon, action_type, qr_enabled, sort_order)
VALUES
  ('contact', 'email', 'alphametatech@gmail.com', '电子邮箱', 'alphametatech@gmail.com', 'fa-regular fa-envelope', 'email', 0, 10),
  ('contact', 'github', 'MEIKEN', 'Github', 'https://github.com/meikendesu', 'fa-brands fa-github', 'link', 0, 20),
  ('contact', 'x', 'めいけん@meikendesu', 'X (Twitter)', 'https://twitter.com/meikendesu', 'fa-brands fa-x-twitter', 'link', 0, 30),
  ('contact', 'telegram', 'めいけん', 'Telegram', 'https://t.me/meikendesu', 'fa-brands fa-telegram', 'link', 0, 40),
  ('contact', 'youtube', 'めいけん', 'Youtube', 'https://www.youtube.com/@meikendesu', 'fa-brands fa-youtube', 'link', 0, 50),
  ('contact', 'bilibili', '洛鸣希_mxli', '哔哩哔哩', 'https://space.bilibili.com/625693351', 'fa-brands fa-bilibili', 'link', 0, 60),
  ('donation', 'usdt', 'USDT', 'TRC20', '待填写 USDT 地址', 'fa-solid fa-dollar-sign', 'crypto', 0, 10),
  ('donation', 'eth', 'Ethereum', 'ETH Mainnet', '待填写 ETH 地址', 'fa-brands fa-ethereum', 'crypto', 0, 20),
  ('donation', 'btc', 'Bitcoin', 'BTC Mainnet', '待填写 BTC 地址', 'fa-brands fa-bitcoin', 'crypto', 0, 30),
  ('donation', 'paypal', 'PayPal', 'PayPal.Me', '待填写 PayPal.Me 链接', 'fa-brands fa-paypal', 'link', 0, 40);
