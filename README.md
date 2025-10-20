# 订阅管理服务

该项目是基于 Cloudflare Workers 的订阅转换与管理服务，支持以下功能：

- 节点解析与转换（vmess/vless/trojan/ss/ssr/hysteria/hy2/tuic）
- 生成 Clash / Sing-Box 配置
- 基于规则模板的分组与规则合并（内置 Nano 规则模板）
- 密码登录保护（基于 Cookie）
- 节点集合管理、固定订阅链接

本仓库已在不影响 Cloudflare 部署的前提下，新增对 Vercel 平台的网页一键部署支持。


## 一、Cloudflare Workers 部署（原有方式）

1. 创建 KV 命名空间
   - SUBLINK_KV
   - TEMPLATE_CONFIG
2. 将命名空间绑定到 wrangler.toml（示例已给出）
3. 在 Cloudflare Dashboard 配置 ACCESS_PASSWORD 环境变量（可选）
4. 使用 `wrangler deploy` 部署（或 Dashboard 一键部署）


## 二、Vercel 网页部署

本项目已增加 `api/index.js` 与 `vercel.json`，实现对 Vercel 的 Edge Function 兼容，所有路径通过 `vercel.json` 重写到该函数，保持与 Cloudflare 一致的路由行为。

- 入口：`api/index.js`（Edge Runtime）
- 重写：`vercel.json` 将所有路径 `/(.*)` 重写到 `/api/index.js`
- 不修改原有 `_worker.js`，因此不影响 Cloudflare 部署

### 步骤

1) 在 Vercel 中创建项目
- 打开 https://vercel.com/import 或 "Add New Project"
- 选择本仓库（或 Fork 后导入）
- Framework 选择 "Other"
- Build Command 留空；Output Directory 留空（或 `.`）

2) 配置环境变量（必须）
- ACCESS_PASSWORD：访问管理后台的密码（可选，默认 `admin123456`）

3) 配置持久化存储（强烈建议）
为保证节点、模板、固定订阅等数据的持久化，在 Vercel 中添加 KV 数据库（Upstash 驱动）：

- 在 Vercel Dashboard -> Storage -> KV，新建一个数据库，并将其绑定到当前项目环境
- 绑定后，Vercel 会自动在项目的环境变量中注入：
  - KV_REST_API_URL
  - KV_REST_API_TOKEN

如果你的项目使用 Upstash Redis（非 Vercel KV），也可以设置：
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

本项目在 Vercel 环境下会优先使用 `KV_REST_API_URL/KV_REST_API_TOKEN`，其次尝试 `UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN`；若均未配置，则使用内存存储（不持久，冷启动会丢失数据）。

4) 部署
- 点击 Deploy 完成部署
- 首次访问会跳转登录页（/login），输入 ACCESS_PASSWORD

### 路由与功能

部署在 Vercel 后，保持与 Cloudflare 路由一致：
- GET /           管理后台（需登录）
- GET /login      登录页
- POST /api/login 登录接口
- POST /api/logout 登出接口
- GET /clash      订阅转换为 Clash（公开）
- GET /singbox    订阅转换为 Sing-Box（公开）
- GET /base64     基础 Base64 订阅（公开）
- GET /sub/:id    固定订阅入口（公开，自动重定向到相应格式）
- 管理类 API：/api/nodes、/api/templates、/api/templates/:id、/api/subscribe、/api/fixed-subscriptions


## 三、Vercel 运行时说明

- 运行时：Edge Runtime（与 Cloudflare Workers 语义一致，使用 Web Fetch API）
- `_worker.js` 中使用的 `env.SUBLINK_KV`、`env.TEMPLATE_CONFIG` 在 Vercel 下由 `api/index.js` 注入的适配层提供：
  - get(key)
  - put(key, value, opts?)（支持 `{ expirationTtl: seconds }`）
  - delete(key)
  - list({ prefix }) 返回 `{ keys: [{ name }], list_complete: true }`
- 适配层会尝试使用 Vercel KV / Upstash Redis 的 REST API；
  若未配置，将退化为内存 Map（不持久）。


## 四、常见问题

1) 为什么没有在 Vercel 上使用 Next.js？
- 本项目是原生 Cloudflare Worker 风格，通过 Edge Function + 路由重写即可保持原有接口与行为一致，无需引入额外框架。

2) KV 没配置能用吗？
- 能启动，但数据不持久。建议务必在 Vercel 项目绑定 KV，否则节点/模板/固定订阅数据会在冷启动后丢失。

3) Cloudflare 部署会受影响吗？
- 不会。我们没有修改 `_worker.js` 逻辑，仅新增了 Vercel 的入口文件和路由重写配置。


## 五、开发提示

- 目录结构简洁：
  - `_worker.js` 路由与业务逻辑
  - `parser.js` 解析订阅与节点
  - `clash.js` / `singbox.js` 格式转换
  - `base.js` 基础 Base64 输出
  - `rules.js` 内置规则模板
  - `html.js` 管理后台页面
  - `api/index.js` Vercel Edge 入口与 KV 适配
  - `vercel.json` 路由重写
- 推荐在 Cloudflare Workers 模式下开发与调试（wrangler dev），Vercel 仅作为生产部署时的另一平台选择。

## 六、架构决策（ADR）

- ADR-0001：保持 Cloudflare Workers 架构，不迁移到 Next.js。详情见 `docs/ADR-0001-no-nextjs-migration.md`
- 摘要：当前服务为轻量 API 与管理台，使用 Edge Function（Vercel）与 Cloudflare Workers 能满足需求；仅在前端复杂度显著增加或出现 SEO/多用户等诉求时，才考虑引入 Next.js（优先仅前端独立化）。
