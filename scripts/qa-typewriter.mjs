import { chromium } from "playwright";

const base = "http://127.0.0.1:4318";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${base}/projects`, { waitUntil: "networkidle" });
await page.waitForSelector(".welcome-card__desc");
await page.evaluate(() => document.fonts.ready);

const cursorCount = await page.locator(".welcome-card__cursor").count();
console.log("cursor present:", cursorCount > 0);

const statsY = async () =>
  Math.round(
    (await page.locator(".welcome-card__stats").boundingBox()).y,
  );

// sample desc text over ~6s to confirm typing + cycling
const samples = [];
const y0 = await statsY();
for (let i = 0; i < 12; i++) {
  const t = await page.locator(".welcome-card__desc span").first().textContent();
  samples.push(t);
  await new Promise((r) => setTimeout(r, 600));
}
const y1 = await statsY();
const uniq = [...new Set(samples)];
console.log("distinct sampled texts (incl. partial):", uniq.length);
console.log("first few samples:", JSON.stringify(samples.slice(0, 6)));
console.log("stats y stable (no reflow):", y0, "->", y1, y0 === y1);

// confirm it eventually reaches the full first line and then a later line
const reachedFull = samples.some((s) => s === "山海自有归期，风雨自有相逢");
console.log("reached full first line:", reachedFull);

// reduced motion -> static first line, no cursor
const page2 = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page2.emulateMedia({ reducedMotion: "reduce" });
await page2.goto(`${base}/projects`, { waitUntil: "networkidle" });
await page2.waitForSelector(".welcome-card__desc");
await new Promise((r) => setTimeout(r, 500));
const rmText = await page2
  .locator(".welcome-card__desc span")
  .first()
  .textContent();
const rmCursor = await page2.locator(".welcome-card__cursor").count();
console.log("reduced-motion text:", JSON.stringify(rmText), "cursor:", rmCursor);

console.log("page errors:", errors.length ? errors : "none");
await browser.close();
