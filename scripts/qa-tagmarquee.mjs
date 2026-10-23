import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

const root = process.cwd();
const artifacts = resolve("artifacts");
await mkdir(artifacts, { recursive: true });
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const note = (m) => {
  results.push(m);
  console.log(m);
};
const errors = [];

// ---------- Part A: guest marquee on the running server ----------
const guestBase = "http://127.0.0.1:4318";
const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
});

async function startTempServer() {
  const folder = await mkdtemp(join(tmpdir(), "tagmarquee-qa-"));
  const port = 4399;
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ["dist/server/index.js"], {
    cwd: root,
    env: { ...process.env, DATA_DIR: folder, PORT: String(port), APP_URL: base },
    stdio: "pipe",
  });
  server.stderr.on("data", (d) => process.stderr.write(`[temp] ${d}`));
  for (let n = 0; n < 80; n++) {
    try {
      const r = await fetch(`${base}/api/admin/status`);
      if (r.ok) return { server, folder, base, port };
    } catch {}
    await delay(150);
  }
  throw new Error("temp QA server did not start");
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));

try {
  await page.goto(`${guestBase}/projects`, { waitUntil: "networkidle" });
  await page.waitForSelector(".tag-marquee", { timeout: 8000 });
  await page.evaluate(() => document.fonts.ready);
  await delay(800);

  const names = await page.$$eval(
    ".tag-marquee__item .tag-marquee__name",
    (els) => [...new Set(els.map((e) => e.textContent))],
  );
  note(`标签名集合: ${names.join("、")}`);
  const rows = await page.$$eval(".tag-marquee__viewport", (e) => e.length);
  note(`跑马灯行数: ${rows}（应为 2：上行正向、下行反向）`);
  const reverse = await page.$$eval(".tag-marquee__track--reverse", (e) => e.length);
  note(`反向轨道数: ${reverse}（第二行应为 1）`);
  const groups = await page.$$eval(".tag-marquee__group", (e) => e.length);
  note(`无缝滚动分组数: ${groups}（每个视口 2 组，共 4）`);

  await page.screenshot({ path: join(artifacts, "tagmarquee-fresh.png") });

  await page.evaluate(() => (document.documentElement.dataset.theme = "blush"));
  await delay(400);
  await page.screenshot({ path: join(artifacts, "tagmarquee-blush.png") });

  await page.evaluate(() => (document.documentElement.dataset.theme = "midnight"));
  await delay(400);
  await page.screenshot({ path: join(artifacts, "tagmarquee-midnight.png") });

  await page.evaluate(() => (document.documentElement.dataset.theme = "fresh"));

  // hover pause
  await page.hover(".tag-marquee__viewport");
  await delay(250);
  const paused = await page.evaluate(() => {
    const t = document.querySelector(".tag-marquee__track");
    return t ? getComputedStyle(t).animationPlayState : "n/a";
  });
  note(`悬停时动画状态: ${paused}（应为 paused）`);

  // overflow at several widths
  for (const w of [1440, 820, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await delay(300);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    note(`视口 ${w}px 页面 scrollWidth = ${sw}（应 == ${w}，无横向溢出）`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await delay(300);
  await page.screenshot({ path: join(artifacts, "tagmarquee-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 900 });
} catch (e) {
  note(`Part A 出错: ${e.message}`);
} finally {
  await page.close();
}

// ---------- Part B: admin tag editor on a throwaway server ----------
try {
  const { server, folder, base } = await startTempServer();
  const admin = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  admin.on("pageerror", (e) => errors.push(`admin: ${e.message}`));
  try {
    await admin.goto(`${base}/login`, { waitUntil: "networkidle" });
    await admin
      .getByRole("heading", { name: "创建你的管理员账号" })
      .waitFor({ timeout: 8000 });
    const token = (await readFile(join(folder, "setup-token.txt"), "utf8")).trim();
    await admin.getByLabel("初始化令牌", { exact: true }).fill(token);
    await admin.getByLabel("邮箱", { exact: true }).fill("tag-qa@example.com");
    await admin
      .getByLabel("密码", { exact: true })
      .fill("tagmarquee-test-12345");
    await admin.getByRole("button", { name: "创建并登录", exact: true }).click();
    await admin.getByRole("button", { name: "编辑页面", exact: true }).waitFor({
      timeout: 8000,
    });
    note("管理员初始化并登录成功");

    await admin.goto(`${base}/projects`, { waitUntil: "networkidle" });
    await admin.waitForSelector(".tag-marquee");
    await admin.getByRole("button", { name: "编辑标签", exact: true }).click();
    await admin.getByRole("dialog").waitFor({ timeout: 5000 });
    await admin.screenshot({ path: join(artifacts, "tag-editor.png") });
    note("标签编辑弹窗已打开并截图");

    await admin.getByRole("button", { name: "添加标签", exact: true }).click();
    const lastItem = admin.locator(".tag-editor-list > li").last();
    await lastItem
      .locator(".tag-editor-field")
      .nth(0)
      .locator("input")
      .fill("手作");
    await lastItem.locator(".tag-editor-count input").fill("12");
    await lastItem.locator(".tag-editor-color input").fill("#ff8800");
    await admin.screenshot({
      path: join(artifacts, "tag-editor-filled.png"),
    });
    note("新增标签（手作 / 12 / #ff8800）已填写");

    // save and publish
    await admin.getByRole("button", { name: "完成", exact: true }).click();
    await admin.getByRole("dialog").waitFor({ state: "detached", timeout: 5000 });
    note("标签编辑弹窗已关闭（草稿保留）");
    const saveBtn = admin.getByRole("button", { name: "保存修改", exact: true });
    await saveBtn.waitFor({ timeout: 5000 });
    await saveBtn.click();
    // after a successful save the editor closes and "编辑页面" reappears
    await admin
      .getByRole("button", { name: "编辑页面", exact: true })
      .waitFor({ timeout: 6000 })
      .catch(async () => {
        const err = await admin
          .locator('[role="alert"]')
          .first()
          .innerText()
          .catch(() => "（无错误提示）");
        note(`保存未成功，提示：${err}`);
      });
    await delay(600);
    const apiTags = await (
      await admin.request.get(`${base}/api/home`)
    ).json();
    note(
      `发布后 /api/home 的 tags: ${JSON.stringify(apiTags.content.tags)}`,
    );
    await admin.goto(`${base}/projects`, { waitUntil: "networkidle" });
    await admin.waitForSelector(".tag-marquee");
    await delay(500);
    const hasHandmade = await admin
      .locator(".tag-marquee__item", { hasText: "手作" })
      .count();
    note(`保存发布后跑马灯是否出现“手作”: ${hasHandmade > 0}`);
    await admin.screenshot({ path: join(artifacts, "tagmarquee-with-curated.png") });
  } finally {
    await admin.close();
    server.kill("SIGTERM");
    await rm(folder, { recursive: true, force: true });
  }
} catch (e) {
  note(`Part B 出错: ${e.message}`);
}

note(`浏览器运行时错误: ${errors.length ? errors.join(" | ") : "无"}`);
await browser.close();
console.log("\nDONE");
