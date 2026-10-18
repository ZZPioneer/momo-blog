# 在页面左下角添加 Live2D 看板娘

## Context

用户希望在站点左下角加入与 `iamyukino.cn` 同款的 Live2D 看板娘（即官方 `live2d-widget` 项目生成的 `.waifu` 元素）。经确认采用两项决策：

- **资源本地内置**：把看板娘的运行库与模型文件放入本项目，由本站自己托管，不依赖外部 CDN。
- **移动端隐藏**：窄屏不显示，避免 280×250 的画布遮挡正文。

目标产出：`/`（首页）与各栏目页左下角出现可交互的 Live2D 看板娘，且完全离线可用。

## 现状调研（关键事实）

- HTML 入口 [index.html](file:///h:/momoblog/client/index.html)：`#root` + `/src/main.tsx`，**无 CSP**，无任何第三方 `<script>`。
- 静态资源目录 `client/public/`（Vite 默认 publicDir），构建时复制到 `dist/client/` 根目录；Express 用 `express.static` 提供（`/assets` 单独长缓存，见 [app.ts](file:///h:/momoblog/server/app.ts#L322-L346)）。→ 把看板娘放到 `client/public/live2d/`，线上路径即 `/live2d/...`。
- 左下角当前无 `position: fixed` 元素（fixed 元素为：`.admin-bar`/`.toast` 底部居中、`.refresh-indicator` 右下、`.skip-link` 左上），不会冲突。
- 使用的库是官方 `live2d-widget`（npm 包 `live2d-widgets@1.0.1`）。其 `dist/autoload.js` 会依次加载 `waifu.css`、`waifu-tips.js`（以 `type="module"` 注入），再由 `initWidget(config)` 注入 `.waifu` DOM 并加载模型。
- **上游仓库不含模型文件**，模型由 `cdnPath` 指向的静态目录提供：需要该目录下有 `model_list.json`，模型位于 `model/<name>/index.json`；Cubism 2 模型还会请求 `model/<name>/textures.cache`（源码里 `textureCache || []`，缺失时按空数组处理，因此非必需）。
- `model_list.json` 结构：`{ "models": (string|string[])[], "messages": string[] }`（数组项为同一模型的多种服装）。
- 本项目构建链：`npm run build` = typecheck → `vite build`（输出 `dist/client`）→ `tsc -p tsconfig.server.json`。

## 实现方案

### 1. 本地化资源：新增目录 `client/public/live2d/`

从 npm 包 `live2d-widgets@1.0.1` 的 `dist/` 下载运行库（以实际文件清单为准，含可能存在的 `chunk/` 目录）：

- `live2d.min.js`（Cubism 2 Core）
- `waifu-tips.js`（及 `chunk/index.js`、`chunk/index2.js` 等模块分片）
- `waifu.css`
- `waifu-tips.json`（改写为适配本站）

新增自建 `autoload.js`（改自官方 `dist/autoload.js`），关键配置：

```js
const live2d_path = "/live2d/";
// 移动端守卫（官方注释里预留的写法，取消注释）
if (screen.width < 768) return;
initWidget({
  waifuPath: live2d_path + "waifu-tips.json",
  cdnPath: live2d_path,              // 模型静态目录根，须以 / 结尾
  cubism2Path: live2d_path + "live2d.min.js",
  cubism5Path: "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js", // Cubism2 模型不会用到
  modelId: 0,
  tools: ["switch-model", "photo", "info", "quit"], // 全部为本地功能，不触发外部请求
  drag: false,
});
```

模型本地化（默认模型为 Cubism 2 的 `Potion-Maker/Pio`，体积适中）：

- `model_list.json`：只保留 `Potion-Maker/Pio`（及其 messages）
- `model/Potion-Maker/Pio/`：`index.json`、`model.moc`、`textures/default-costume.png`，以及 `index.json` 中 `motions` 列出的全部 `motions/*.mtn`

> 下载方式用 PowerShell `Invoke-WebRequest`（走系统证书库，规避此前 Node 内置 CA 不信任代理根证书的问题）。若个别二进制下载失败，将重试；实在无法落地的文件以官方 CDN 兜底地址补齐进场（仍写入本地目录，保证运行时不请求 CDN）。

`waifu-tips.json` 改写为适配本站的少量选择器（默认内容针对 Hexo NexT 主题，本站命中率极低），例如 `.site-header nav a`、`.button`、`.card`、`.hero-avatar`、`.friend-card` 等，并移除上游较长的敏感示例文案。

### 2. 引入：修改 [index.html](file:///h:/momoblog/client/index.html)

在 `</body>` 之前加入：

```html
<script src="/live2d/autoload.js"></script>
```

（该路径属于 `publicDir` 静态资源，Vite 不会打包处理；若构建阶段对 `<script src>` 有异常，改为在 [main.tsx](file:///h:/momoblog/client/src/main.tsx) 顶层动态注入同路径脚本作为兜底。）

### 3. 样式微调：修改 [styles.css](file:///h:/momoblog/client/src/styles.css)

- 覆盖 `.waifu` 的层级为 289（贴合用户给出的 `z-index:289`），避免遮挡站内弹窗/`toast`。
- 追加 `@media (max-width: 767px) { .waifu { display: none; } }`，与 autoload 的宽度守卫形成双保险。

### 4. 许可证说明（需用户知悉）

- 运行库代码为 GPLv3；`live2d.min.js` 受 Live2D 相关许可约束（Redistributable Code 条款内可再分发）。
- 模型素材版权属原作者，仅供学习研究、**不得用于商业用途**。

## 涉及文件

| 文件 | 操作 |
| --- | --- |
| `client/public/live2d/**` | 新增（运行库 + 自建 `autoload.js` + 模型） |
| [client/index.html](file:///h:/momoblog/client/index.html) | 追加一行 `<script>` |
| [client/src/styles.css](file:///h:/momoblog/client/src/styles.css) | 追加 `.waifu` 层级与窄屏隐藏规则 |

## 验证

1. `npm run build` 通过；确认 `dist/client/live2d/` 下文件齐全（`autoload.js`、`waifu.css`、`waifu-tips.js`、`live2d.min.js`、`waifu-tips.json`、`model_list.json`、`model/Potion-Maker/Pio/*`）。
2. 用 `node --use-system-ca dist/server/index.js` 启动后逐个检查 HTTP 200：
   `/live2d/autoload.js`、`/live2d/live2d.min.js`、`/live2d/model_list.json`、`/live2d/model/Potion-Maker/Pio/index.json`、`/live2d/model/Potion-Maker/Pio/model.moc`。
3. 浏览器打开 `http://127.0.0.1:4318/projects`（及首页 `/`）：
   - 左下角出现看板娘，模型正常渲染、无控制台报错；
   - 悬停站内元素时出现 `waifu-tips` 气泡；
   - 工具栏按钮可用（换模型/截图/信息/关闭）；
   - 将窗口缩到 <768px 时看板娘隐藏。
