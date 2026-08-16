-- 已初始化的数据库中可能仍保留旧的演示视频死链，仅替换这一个已知资源。
UPDATE projects
SET markdown = replace(
  markdown,
  '[查看项目演示视频](/shared-assets/videos/flower.mp4)',
  '> 演示视频暂未提供。'
)
WHERE slug = 'wawawa'
  AND instr(markdown, '/shared-assets/videos/flower.mp4') > 0;
