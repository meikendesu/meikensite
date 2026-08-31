# MEIKEN 1.5 性能评估

评估日期：2026-08-31

生产地址：<https://983765.xyz/>

工具：Chrome DevTools Performance、Lighthouse、Vite 6、Wrangler 4.123.0

## 评估方法

- 桌面基线：无网络限速、无 CPU 限速。
- 移动基线：390 × 844、设备像素比 3、Slow 4G、4 倍 CPU 降速。
- 所有页面均使用冷导航重新加载，记录实验室 LCP、TTFB、渲染延迟和 CLS。
- 当前站点没有可用的 CrUX 真实用户数据，因此本报告不把实验室结果表述为真实用户分布。
- 指标分级参考 [Web Vitals](https://web.dev/articles/vitals)，静态资源缓存实现参考 [Cloudflare Workers Static Assets Headers](https://developers.cloudflare.com/workers/static-assets/headers/)。

## 1.0 生产基线

| 页面 | 环境 | LCP | TTFB | 渲染延迟 | CLS |
| --- | --- | ---: | ---: | ---: | ---: |
| 首页 | 桌面 | 563 ms | 234 ms | 329 ms | 0.00 |
| 首页 | 移动 | 1,525 ms | 234 ms | 1,291 ms | 0.00 |
| 关于 | 移动 | 1,432 ms | 265 ms | 1,167 ms | 0.00 |
| 项目列表 | 移动 | 1,374 ms | 271 ms | 1,103 ms | 0.00 |
| 项目详情 | 移动 | 1,473 ms | 269 ms | 1,204 ms | 0.00 |
| 联系 | 移动 | 1,396 ms | 269 ms | 1,127 ms | 0.00 |
| 捐助 | 移动 | 1,417 ms | 279 ms | 1,138 ms | 0.00 |

移动 Lighthouse 非性能分类结果：Accessibility 100、Best Practices 100、SEO 100、Agentic Browsing 100，共 48 项通过、0 项失败。

## 1.0 包体基线

| 产物 | 原始大小 | gzip |
| --- | ---: | ---: |
| 主客户端 JavaScript | 117.69 kB | 46.02 kB |
| 主 CSS | 135.97 kB | 32.16 kB |
| Markdown 独立异步块 | 114.44 kB | 48.08 kB |
| Worker 上传包（优化前） | 2,950.24 KiB | 715.42 KiB |

## 1.5 发布前评估

1.5 使用正式生产构建在本机 Vite Preview 上重新跟踪首页（无网络限速、无 CPU 限速）。该结果用于发现回归，不替代 Cloudflare 线上网络数据。

| 指标 | 1.5 本机构建 |
| --- | ---: |
| LCP | 103 ms |
| TTFB | 5 ms |
| 渲染延迟 | 99 ms |
| CLS | 0.00 |
| 强制回流 | 46 ms，DevTools 预计节省 0 ms |

| 产物 | 1.0 gzip | 1.5 原始大小 | 1.5 gzip | gzip 变化 |
| --- | ---: | ---: | ---: | ---: |
| 主客户端 JavaScript | 46.02 kB | 117.36 kB | 45.67 kB | -0.35 kB |
| 主 CSS | 32.16 kB | 157.56 kB | 35.45 kB | +3.29 kB |
| Markdown 独立异步块 | 48.08 kB | 114.44 kB | 48.08 kB | 0 kB |

- CSS 增量来自公开页细节、Admin 工作台和响应式底栏；Admin 与 Markdown 编辑器仍按路由拆包，不进入首页主 JavaScript。
- 主 CSS 仍是渲染阻塞请求，但本次跟踪只耗时约 6 ms，DevTools 对 FCP/LCP 的预计节省均为 0 ms。
- 320 px 窄屏检查中，底栏宽 296 px、左右各 12 px，六个入口均为 44 × 48 px；页面宽度与视口同为 320 px，没有横向溢出。
- 修复旧页脚 11 px 文字对比度后，移动 Lighthouse Accessibility 与 Best Practices 均为 100。`robots.txt` 与 `llms.txt` 在 Vite Preview 中回退到应用 HTML，因此本地 SEO/Agentic 分项不作为生产结论。

## 发现与处理

1. 内容哈希的 `/assets/*` 默认仍返回 `Cache-Control: public, max-age=0, must-revalidate`。1.0 通过 `public/_headers` 改为一年 `immutable`，减少重复访问时的重新验证请求。
2. `public/fonts` 中两个旧字体已无任何代码引用，仍会增加 9,733,372 字节部署资产。1.0 删除这两个文件，不改变浏览器实际使用的系统字体与 Font Awesome 图标字体。
3. Worker 原先未压缩上传。`wrangler.jsonc` 启用 `minify` 后，干运行包体降至 2,443.03 KiB / gzip 647.82 KiB：原始体积减少 507.21 KiB（17.2%），gzip 减少 67.60 KiB（9.4%）。
4. 首页移动跟踪发现约 154 ms 强制回流，但 DevTools 没有给出可量化节省，且其他公开页面未复现。当前 LCP 已处于良好范围，因此不以删除页面加载动画或卡片动效换取不可证实的收益。
5. 主 CSS 是渲染阻塞资源，但 DevTools 对 FCP/LCP 的预计节省均为 0 ms；Cloudflare Web Analytics 主线程开销约 23 ms，也没有预计指标收益。两者不列为 1.0 阻塞项。

## 1.5 验证标准

- TypeScript 与 Vue 类型检查通过。
- 客户端和 SSR 生产构建通过。
- Worker SSR、404、500、静态资源回退、翻译缓存和 Admin 隐藏路由回归通过。
- UI 契约覆盖首页竖线、整卡跳转、项目详情布局、Admin 实色层级与移动底栏安全区。
- Wrangler 干运行通过，D1、Workers AI 与 Assets 绑定保持一致。
- 发布后复测 `/assets/*` 的长期缓存响应头，并再次记录首页桌面与移动 LCP。
