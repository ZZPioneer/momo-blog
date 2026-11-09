/*
 * 构建 GitHub Pages 静态演示站：
 * 1) 编译服务端，用临时数据目录起一次真实服务，取出示例内容与素材；
 * 2) 把媒体 id 改写为 "demo:" 前缀的静态路径，快照写入 client/public/demo/；
 * 3) 以子路径 base 构建前端，并生成 404.html 兜底直达链接。
 */
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const run = promisify(execFile);
const root = resolve(".");
const demoDir = join(root, "client/public/demo");
const tempData = join(root, "pages-demo-data");
// 注意：Express 的 send 默认忽略点目录，临时目录名不能以 "." 开头，否则素材一律 404。
const port = 4399;
const origin = `http://127.0.0.1:${port}`;
const MEDIA_KEYS = new Set([
  "avatarId",
  "coverId",
  "mediaId",
  "imageId",
  "audioId",
]);
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};

const base = (() => {
  if (process.env.PAGES_BASE) return process.env.PAGES_BASE;
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  // 用户站点（xxx.github.io）发布在根路径，项目站点发布在 /<repo>/ 子路径。
  if (!repo) return "/momo-blog/";
  return repo.endsWith(".github.io") ? "/" : `/${repo}/`;
})();

function wait(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

async function waitForServer(timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${origin}/api/home`);
      if (res.ok) return;
    } catch {
      // 服务尚未就绪，继续轮询
    }
    await wait(300);
  }
  throw new Error("临时演示服务未能在限定时间内启动");
}

function collectMediaIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectMediaIds(item, ids);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (MEDIA_KEYS.has(key) && typeof item === "string") ids.add(item);
      else collectMediaIds(item, ids);
    }
  }
  return ids;
}

function rewriteMediaIds(value, map) {
  if (Array.isArray(value)) return value.map((v) => rewriteMediaIds(v, map));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        MEDIA_KEYS.has(key) && typeof item === "string"
          ? (map.get(item) ?? item)
          : rewriteMediaIds(item, map),
      ]),
    );
  return value;
}

async function snapshot() {
  await rm(demoDir, { recursive: true, force: true });
  await rm(tempData, { recursive: true, force: true });
  await mkdir(join(demoDir, "media"), { recursive: true });

  await run(
    process.execPath,
    ["node_modules/typescript/bin/tsc", "-p", "tsconfig.server.json"],
    { cwd: root },
  );

  const server = spawn(process.execPath, ["dist/server/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      DATA_DIR: tempData,
      PORT: String(port),
      HOST: "127.0.0.1",
      APP_URL: origin,
      SETUP_TOKEN: "demo-build-only",
    },
    stdio: "inherit",
  });

  try {
    await waitForServer();
    const home = await (await fetch(`${origin}/api/home`)).json();
    const state = await (await fetch(`${origin}/api/state`)).json();

    const ids = collectMediaIds(home.content);
    const map = new Map();
    for (const id of ids) {
      const res = await fetch(`${origin}/api/media/${encodeURIComponent(id)}`);
      if (!res.ok)
        throw new Error(
          `示例素材下载失败：${id} (${res.status}) ${await res.text()}`,
        );
      const type = res.headers.get("content-type")?.split(";")[0] ?? "";
      const ext = EXTENSIONS[type];
      if (!ext) throw new Error(`未知的素材类型：${id} (${type})`);
      const name = `${id}.${ext}`;
      await writeFile(
        join(demoDir, "media", name),
        Buffer.from(await res.arrayBuffer()),
      );
      map.set(id, `demo:/demo/media/${name}`);
    }

    home.content = rewriteMediaIds(home.content, map);
    // 演示站不允许登录与编辑，固定为「已初始化、未登录」，避免出现创建管理员入口。
    state.auth = { initialized: true, authenticated: false };
    await Promise.all([
      writeFile(join(demoDir, "home.json"), JSON.stringify(home)),
      writeFile(join(demoDir, "state.json"), JSON.stringify(state)),
    ]);
    console.log(
      `演示快照完成：${home.content.projects.length} 个项目、${home.content.photos.length} 张照片、${map.size} 个素材。`,
    );
  } finally {
    server.kill();
    await wait(400);
    await rm(tempData, { recursive: true, force: true });
  }
}

await snapshot();
await run(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
  cwd: root,
  env: {
    ...process.env,
    PAGES_BASE: base,
    VITE_STATIC_DEMO: "1",
  },
});
await cp(join(root, "dist/client/index.html"), join(root, "dist/client/404.html"));
await rm(join(root, "client/public/demo"), { recursive: true, force: true });
console.log(`GitHub Pages 演示站构建完成：${base}（输出目录 dist/client）`);
