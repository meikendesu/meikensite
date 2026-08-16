CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
  ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO projects (
  slug, tag, title, description, markdown, is_published
) VALUES (
  'wawawa',
  'Android 应用程序',
  'Wawawa 摇晃发声程序',
  '后台持续监听陀螺仪传感器数据，检测手表的摇晃动作并播放音效文件，多次摇晃可同时触发多次播放，根据摇动幅度动态调整音频播放速度',
  '## 主要功能

后台持续监听陀螺仪传感器数据，检测手表的摇晃动作。

检测到摇晃时播放指定音频，并支持多次触发叠加播放，还可根据摇动幅度动态调整播放速度。

## 适用平台

基于 Android 系统的手表（WearOS）。

## 项目演示

> 演示视频暂未提供。
',
  1
);
