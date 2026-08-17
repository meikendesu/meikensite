# MEIKEN 1.0 性能评估

评估日期：2026-08-17

生产地址：<https://983765.xyz/>

工具：Chrome DevTools Performance、Lighthouse、Vite 6、Wrangler 4.123.0

## 评估方法

- 桌面基线：无网络限速、无 CPU 限速。
- 移动基线：390 × 844、设备像素比 3、Slow 4G、4 倍 CPU 降速。
- 所有页面均使用冷导航重新加载，记录实验室 LCP、TTFB、渲染延迟和 CLS。
- 当前站点没有可用的 CrUX 真实用户数据，因此本报告不把实验室结果表述为真实用户分布。
- 指标分级参考 [Web Vitals](https://web.dev/articles/vitals)，静态资源缓存实现参考 [Cloudflare Workers Static Assets Headers](https://developers.cloudflare.com/workers/static-assets/headers/)。

## 生产基线

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

## 包体基线

| 产物 | 原始大小 | gzip |
| --- | ---: | ---: |
| 主客户端 JavaScript | 117.69 kB | 46.02 kB |
| 主 CSS | 135.97 kB | 32.16 kB |
| Markdown 独立异步块 | 114.44 kB | 48.08 kB |
| Worker 上传包（优化前） | 2,950.24 KiB | 715.42 KiB |

## 发现与处理

1. 内容哈希的 `/assets/*` 默认仍返回 `Cache-Control: public, max-age=0, must-revalidate`。1.0 通过 `public/_headers` 改为一年 `immutable`，减少重复访问时的重新验证请求。
2. `public/fonts` 中两个旧字体已无任何代码引用，仍会增加 9,733,372 字节部署资产。1.0 删除这两个文件，不改变浏览器实际使用的系统字体与 Font Awesome 图标字体。
3. Worker 原先未压缩上传。`wrangler.jsonc` 启用 `minify` 后，干运行包体降至 2,443.03 KiB / gzip 647.82 KiB：原始体积减少 507.21 KiB（17.2%），gzip 减少 67.60 KiB（9.4%）。
4. 首页移动跟踪发现约 154 ms 强制回流，但 DevTools 没有给出可量化节省，且其他公开页面未复现。当前 LCP 已处于良好范围，因此不以删除页面加载动画或卡片动效换取不可证实的收益。
5. 主 CSS 是渲染阻塞资源，但 DevTools 对 FCP/LCP 的预计节省均为 0 ms；Cloudflare Web Analytics 主线程开销约 23 ms，也没有预计指标收益。两者不列为 1.0 阻塞项。

## 1.0 验证标准

- TypeScript 与 Vue 类型检查通过。
- 客户端和 SSR 生产构建通过。
- Worker SSR、404、500、静态资源回退、翻译缓存和 Admin 隐藏路由回归通过。
- Wrangler 干运行通过，D1、Workers AI 与 Assets 绑定保持一致。
- 发布后复测 `/assets/*` 的长期缓存响应头，并再次记录首页桌面与移动 LCP。
