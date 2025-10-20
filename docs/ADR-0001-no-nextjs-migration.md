# ADR-0001: 保持 Cloudflare Workers 架构，不迁移到 Next.js

日期: 2025-10-20
状态: Accepted

## 背景
本项目是一个基于 Cloudflare Workers 的订阅转换与管理服务，核心特性包括：
- 解析并转换多种节点协议（vmess/vless/trojan/ss/ssr/hysteria/hy2/tuic）
- 生成 Clash / Sing-Box 配置并合并规则模板
- 提供一个受密码保护的管理台（内置 HTML），并使用 Cloudflare KV 存储节点、模板与固定订阅
- 路由全部在 Worker 一处维护

为方便在 Vercel 平台部署，项目已增加 Edge Function 入口（api/index.js）与 vercel.json 路由重写，保持与 Cloudflare 环境一致的 Edge 运行时语义。

## 决策
暂不迁移到 Next.js。继续采用 Cloudflare Workers + KV 的架构，并在需要时通过 Vercel Edge Function 适配部署。

## 理由
- 需求匹配：当前服务以轻量 API + 管理台为主，SSR/SEO 并非诉求
- 部署一致：Cloudflare Workers 与 Vercel Edge 同属 Edge Runtime 语义，现有代码无需重写即可在两端运行
- 复杂度控制：引入 Next.js 将显著增加构建、依赖与调试复杂度，并带来运行时限制（Edge 对部分 Node 库不兼容）
- 维护成本：无需将 Worker 路由与业务逻辑拆分为 Next.js API Routes/Middleware，避免大规模重构与回归

## 替代方案与取舍
- 仅前端使用 Next.js/Remix/Astro/SvelteKit 等，作为独立管理台，调用现有 Worker API（推荐在 UI 复杂度增加时采用）
- 仍在 Worker 内逐步优化：引入轻量路由器（如 Hono）、拆分 html.js 模板、完善测试与类型标注
- 全量迁移 Next.js（next-on-pages）以统一技术栈：收益有限，成本高，暂不采纳

## 影响
- 保持现有部署形态与运行成本，快速稳定
- 前端开发体验不如现代框架，但可按需渐进升级（独立前端）
- 持续关注 Edge Runtime 生态变化与 KV 适配

## 何时重新评估
- 管理台页面与交互显著增加（多页面路由、复杂表单与状态管理）
- 需要 SEO/SSR/SSG 的公开站点形态
- 多用户、OAuth/NextAuth、RBAC 等复杂鉴权需求
- 团队明确希望沉淀 React 组件库与设计系统

## 若未来采用 Next.js，建议迁移路径
1. 前后端分离：保留 Workers 作为 API，仅将管理台前端迁移到 Next.js（静态导出或 Edge Runtime）
2. 验证 next-on-pages：小范围 PoC，确认 KV/R2 绑定方式与运行时限制
3. 渐进迁移 API：将部分非核心接口迁至 Next API Routes，观察维护与性能收益

本决策记录随需求演进可更新。
