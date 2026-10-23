import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = "http://127.0.0.1:4318";
const artifacts = "artifacts";
mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${base}/projects`, { waitUntil: "networkidle" });
await page.waitForSelector(".welcome-card");
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 700));

const info = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };
  const main = q(".projects-overview__main");
  const weather = q(".weather-card");
  const welcome = q(".welcome-card");
  const bg = q(".welcome-card__bg");
  const stats = [...document.querySelectorAll(".welcome-card__stats div")].map((d) => ({
    label: d.querySelector("dt")?.textContent,
    count: d.querySelector("dd a")?.textContent,
    href: d.querySelector("dd a")?.getAttribute("href"),
  }));
  const btns = [...document.querySelectorAll(".welcome-card__btn")].map((b) => b.textContent.trim());
  const bgImg = bg ? getComputedStyle(bg).backgroundImage : "";
  return {
    main: r(main), weather: r(weather), welcome: r(welcome),
    sameRow: Math.abs(r(weather).y - r(welcome).y) < 4,
    bgPresent: bgImg.includes("url("),
    stats, btns,
    eyebrow: q(".welcome-card__eyebrow")?.textContent,
    avatar: !!q(".welcome-card__avatar"),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: `${artifacts}/welcome-fresh.png` });

// midnight
await page.evaluate(() => { document.documentElement.dataset.theme = "midnight"; });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${artifacts}/welcome-midnight.png` });

// narrow
await page.setViewportSize({ width: 480, height: 1000 });
await page.evaluate(() => { document.documentElement.dataset.theme = "fresh"; });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${artifacts}/welcome-mobile.png`, fullPage: false });

// click 关于我 -> about panel opens
await page.setViewportSize({ width: 1440, height: 1000 });
await page.evaluate(() => { document.documentElement.dataset.theme = "fresh"; });
await new Promise((r) => setTimeout(r, 300));
await page.click(".welcome-card__btn"); // first button = 关于我
await new Promise((r) => setTimeout(r, 500));
const aboutOpen = await page.locator(".about-content").count();
console.log("about panel opened by 关于我:", aboutOpen > 0);

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
