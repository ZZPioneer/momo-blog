# /projects 页面顶部「贡献热力图」组件 — 实现方案

## Context（背景与目标）

用户从 starssr.com 复制了一段「GitHub 贡献日历」HTML 表格，希望把它**改写为 momo-blog 自己的 React 组件**，放在 **/projects 页面顶部**（栏目大标题下方、项目列表上方）。

原片段是 Alpine.js 模板 + 该站自有的 Tailwind/CSS 类（`x-for`、`x-text`、`chart-th`/`chart-td`、`text-primary` 等），依赖外部运行时，无法直接使用，必须重写。

**已与用户确认的决策：**
- 数据源：本站文章发布情况 → **蓝色**色阶；GitHub 贡献 → **绿色**色阶；**两者都有时优先显示 GitHub 绿色**。
- 时间范围：**当前自然年**（1–12 月）。
- GitHub 接入：`.env` 的 `GITHUB_USER` 配置用户名（默认 `zzpioneer`），**后端抓取** `https://github.com/users/{user}/contributions` 并缓存（参考 `server/weather.ts`），无需 token；未配置/抓取失败则降级为蓝色文章热力图。
- 位置：`/projects` **列表页顶部**。

预期结果：/projects 列表页顶部出现一块卡片式热力图（7 行=周一~周日 × 约 53 列=周，顶部月份标签，0–4 档深浅，hover 显示 tooltip），三套主题与深浅色下均正确显示。

## 关键事实（已核实）

- 插入骨架：[Drawers.tsx](file:///h:/momoblog/client/src/components/Drawers.tsx#L107-L163) 里 `ContentPage` 先渲染 `header.section-heading`（126–152 行），紧接着 153 行 `<div className="section-content">`。`isDetail` 在 120–123 行。
- `ContentBody` 被 `ContentDialog` 复用（对话框），**必须插在 `ContentPage` 而不是 `ContentBody`**，才只影响 `/projects` 路由页。
- **不改** `store.tsx` / `api.ts`：`content`（含 `articles` 与 `location.timeZone`）已可用；`api.ts` 的 `request<T>()` 已够用。
- 日期工具可复用：`shared/articles.ts` `articleDateParts(value, timeZone)`；`shared/model.ts` `zonedDay(date, timeZone)`。
- 本站既有网格约定：**周一为第一列/行**（`HomeCards.tsx` 日历用 `(getUTCDay()+6)%7`）。
- 抓取范式：`server/weather.ts`（Map 缓存 + pending 合并 + 成功/失败双 TTL + 失败 stale）。
- 环境限制（实测）：默认 `fetch` 对 github.com 报 `fetch failed`（证书校验失败）；加 `--use-system-ca` 后 `200 OK`。GitHub 片段实测含 365 个 `td.ContributionCalendar-day`（`data-date`/`data-level`/`id`）+ 365 个 `<tool-tip for=...>`，`?from=&to=` 可精确限定自然年。

## 文件清单

**新增**
1. `shared/heatmap.ts` — 纯函数：`buildYearGrid(year)`（7×N 网格 + 月份 colspan）、`articleLevel(count)`、`bucketLevel(count)`。纯工具，可被 `npm test` 覆盖。**内部 import 必须带 `.js` 后缀**（同 `shared/articles.ts`）。
2. `server/contributions.ts` — `parseContributionsHtml(html)`（导出以便测试）+ `createContributionsService(fetcher, user)`（对齐 `weather.ts`）。
3. `client/src/components/ContributionHeatmap.tsx` — 组件（取数 + 选数据源 + 渲染 + tooltip）。
4. `tests/contributions.test.ts` — 解析 + 缓存/降级测试（对齐 `tests/weather.test.ts`）。（可选把 `buildYearGrid` 断言并入此文件。）

**修改**
5. `shared/model.ts` — 在 `Weather` 接口后加 `ContributionDay`（`{date;count;level}`）与 `Contributions`（`{available;user?;year?;days?;updatedAt?;stale?}`），风格同 `Weather`。
6. `server/app.ts` — `AppOptions` 加 `contributions?: (year:number)=>Promise<Contributions>`；默认实现 `createContributionsService()`；在 `/api/weather` 之后加 `/api/contributions` 路由（公开、不加限流，靠服务端缓存约束出网）。
7. `server/index.ts` — 读 `const githubUser = (process.env.GITHUB_USER ?? "zzpioneer").trim();`，传入 `createApp(...)`。
8. `.env.example` — 追加带注释的 `GITHUB_USER` 示例（含 `--use-system-ca` 提示）。
9. `client/src/components/Drawers.tsx` — 加 import；在 152/153 行之间插入 `{panel === "projects" && !isDetail && <ContributionHeatmap />}`。
10. `client/src/styles.css` — 组件基础样式 + 浅色蓝/绿色阶（用组件级 CSS 变量）。
11. `client/src/themes.css` — 追加 `[data-theme="midnight"]` 下的深色蓝/绿覆盖。

## 前端组件设计

无 props，从 `useSite()` 取数（同 `ClockCard`/`CalendarCard`）。
- `year = Number(zonedDay(new Date(), timeZone).slice(0,4))`。
- 蓝色：遍历 `content.articles`，用 `articleDateParts(a.date, timeZone).day` 按天计数（只取 `${year}-` 前缀）。
- 绿色：`useState<Contributions|null>` + `useEffect` 调 `request<Contributions>("/api/contributions")`，`catch` 时 `setGithub({available:false})`（照 `HomeCards.tsx` ClockCard 范式，`active` 标志防卸载后 setState）。
- **优先判定在前端**：`const useGithub = github?.available === true;` → 绿；否则蓝。加载期先渲染蓝色，可用时切绿（仅底色变化 + `transition: background-color .2s`，不跳动）。
- 卡片头部小字说明当前来源（「GitHub 贡献」/「本站发布」+ 年份），同时充当 `aria-label`。

### 网格算法 `buildYearGrid(year)`
全部用 `Date.UTC`；周一为第 0 行 `一…日`：
```
first=Date.UTC(year,0,1); last=Date.UTC(year,11,31);
lead=(new Date(first).getUTCDay()+6)%7;      // 2026: 3
total=Math.round((last-first)/86400000)+1;
weeks=Math.ceil((lead+total)/7);              // 2026: 53
```
- 输出 `weeks*7` 个槽位，**列优先**（`column=floor(i/7)`, `row=i%7`）；CSS `grid-auto-flow: column; grid-template-rows: repeat(7,--heat-cell); grid-template-columns: repeat(var(--weeks),--heat-cell)`。
- `dayOffset=i-lead`；越界（元旦前 / 12-31 后）渲染隐藏占位格，保持矩形。
- 日期键：`new Date(first+dayOffset*86400000).toISOString().slice(0,10)`，与 `data-date` 同构；未来日（`> today`）加 `data-future`（`opacity:.45`）。
- 月份标签：独立一行 grid，模板列与网格一致；每月 1 号所在列 `grid-column: col+1 / span min(3, weeks-col)`，`overflow:hidden; white-space:nowrap`，短名 `1月…12月`。

### 颜色（含 light/dark）
`styles.css`（fresh/blush 共用浅色值）：
```
.contribution-heatmap{
  --heat-cell:11px; --heat-gap:3px; --heat-month-row:15px;
  --heat-empty: var(--theme-soft,#ebedf0);   /* 空格子跟随主题 */
  --heat-blue-1:#cfe6ff; --heat-blue-2:#9ecbf5; --heat-blue-3:#5aa2e6; --heat-blue-4:#2f74c9;
  --heat-green-1:#9be9a8; --heat-green-2:#40c463; --heat-green-3:#30a14e; --heat-green-4:#216e39;
  --heat-0:var(--heat-empty); --heat-1:var(--heat-blue-1); --heat-2:var(--heat-blue-2);
  --heat-3:var(--heat-blue-3); --heat-4:var(--heat-blue-4);
}
.contribution-heatmap.is-github{ --heat-1:var(--heat-green-1); --heat-2:var(--heat-green-2); --heat-3:var(--heat-green-3); --heat-4:var(--heat-green-4); }
.heat-cell{border-radius:2px;background:var(--heat-0);transition:background-color .2s}
.heat-cell.lv-1{background:var(--heat-1)} … .heat-cell.lv-4{background:var(--heat-4)}
.heat-cell[data-future]{opacity:.45}
```
`themes.css`（midnight 深色覆盖）：
```
:root[data-theme="midnight"] .contribution-heatmap{
  --heat-blue-1:#16324f;--heat-blue-2:#1c4c7d;--heat-blue-3:#2a6fb0;--heat-blue-4:#56a1e4;
  --heat-green-1:#0e4429;--heat-green-2:#006d32;--heat-green-3:#26a641;--heat-green-4:#39d353;
}
```
- 容器外观复用既有卡片约定：`border:1px solid var(--theme-line,var(--line)); border-radius:13px; background:var(--card); padding:18px 20px;`，三套主题自动正确，无需单独覆盖。
- 档位：GitHub 直接用 `data-level`(0–4)；文章用 `articleLevel`：`0→0,1→1,2→2,3→3,≥4→4`。

### tooltip（自绘 fixed 浮层）
- 事件委托：网格容器 `onMouseOver/onMouseMove` → `closest(".heat-cell[data-date]")` 读 `data-date`/`data-count`，`getBoundingClientRect()` 定位；`onMouseLeave` 清除。
- `position:fixed; transform:translate(-50%,calc(-100% - 6px)); pointer-events:none; z-index:20; background:var(--theme-chrome,#25271ce0); color:var(--theme-on-chrome,#fffefa);`（fixed 避免被 `overflow-x:auto` 与 `.section-page` 裁切）。滚动容器滚动时收起：`document.addEventListener("scroll", clear, true)`。
- 文案：`2026-04-12 周日 · 2 篇文章` / `… · 3 次贡献`。
- 无障碍：网格容器 `role="img"` + `aria-label` 汇总；格子不设 tabbable。

## 后端设计

- 路由 `app.get("/api/contributions", ...)`：`year = Number(zonedDay(now(), siteTimeZone()).slice(0,4))` → `res.json(await contributions(year))`。位置在 `/api/weather` 之后，公开路由。
- 抓取：`https://github.com/users/${encodeURIComponent(user)}/contributions?from=${year}-01-01&to=${year}-12-31`，header `accept:text/html` + `user-agent`，`AbortSignal.timeout(8000)`，`!res.ok → throw`。
- 解析：先 `/ <td\b[^>]*>/g` 取标签，命中 `/class="[^"]*ContributionCalendar-day/` 者，分别抽 `data-date`/`data-level`/`id`（不依赖属性顺序）；再 `/ <tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)< \/tool-tip>/g` 取计数，按 `for` id 关联；缺 `data-level` 用 `bucketLevel`（1–9→1,10–19→2,20–29→3,≥30→4）。
- 自检：`if(cells.length<300) throw` —— 同时挡住「用户不存在」错误页 / 改版 / 限流页。返回按 `date` 升序、**只保留 `count>0` 的天**。
- 缓存：`Map<year,{cached;nextFetch;pending}>`（上限 8，超限删最早）；成功 TTL 30 分钟，失败 TTL 10 分钟；失败返回 `cached?.available ? {...cached,stale:true} : {available:false}`。
- 未配置用户：`if(!user) return {available:false};`（200，不出网）→ 前端自动蓝色。
- TLS 降级：抓取失败命中 catch → `{available:false}` → 前端蓝色、无报错。文档提示启动前 `NODE_OPTIONS=--use-system-ca`（写在 `.env` 里很可能不生效，只作提示）。

## 插入点与影响范围

[Drawers.tsx](file:///h:/momoblog/client/src/components/Drawers.tsx#L124-L162)：在 header 块 `)}`（152 行）与 `section-content`（153 行）之间插入
```
{panel === "projects" && !isDetail && <ContributionHeatmap />}
```
- 只在 `/projects` 列表页显示；进详情（`?item=xxx`，`isDetail`）或其它栏目即隐藏。
- 编辑态不特殊处理：组件读 `content`（草稿优先），管理员改文章 date 时蓝色实时变化；组件无可编辑字段，不影响保存/取消/校验。

## 验证步骤

1. `npm run typecheck` → `npm run build`（`tsc` 覆盖 client/server/shared/tests）。
2. `$env:NODE_OPTIONS="--use-system-ca"; npm start`（端口 4318；`/projects` 由后端回落 `index.html`）。
3. `npm test`（`tsx --test tests/*.test.ts`）：`tests/contributions.test.ts` 覆盖离线/503/无格子 → `{available:false}`、缓存 + 并发合并（`calls===1`）、URL 含正确 `user` 与 `from/to`、小片段的 `date/count/level` 配对。
4. 接口自检：`curl.exe "http://127.0.0.1:4318/api/contributions"` → `available:true, year:2026`；把 `GITHUB_USER` 置空重启 → `{"available":false}` 且无出网。
5. 人工重点：三套主题（fresh/blush/midnight）空槽色与四档对比度、深色可区分、跨年（2026/2027/2028）列数与月份标签不裁切、未来日灰显、降级（断网/无 --use-system-ca/空用户名）全蓝且无报错无跳动、编辑态实时变化、详情页与项目对话框不出现热力图、tooltip 横扫不闪不残留且滚动即隐、≤620px 可横向滚动且不撑破布局。

## 取舍说明

- 网格算法放 `shared/heatmap.ts`：能被 `npm test` 直接覆盖（跨年/列数/月标签最易错），与 `shared/articles.ts` 定位一致；代价是多一个文件且 import 带 `.js`。
- tooltip 用自绘 fixed 浮层而非贴格 CSS：`overflow-x:auto` 必然裁切贴格浮层，fixed + 滚动隐藏约 20 行即可，避免过度设计。
