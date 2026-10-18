import test from "node:test";
import assert from "node:assert/strict";
import {
  createContributionsService,
  parseContributionsHtml,
} from "../server/contributions";

const DAY = 86400000;

// Build a fragment that mirrors GitHub's server-rendered calendar markup.
function fragment(
  count: (index: number) => number,
  level: (index: number) => number,
) {
  const first = Date.UTC(2024, 0, 1);
  let html = "";
  for (let i = 0; i < 365; i++) {
    const date = new Date(first + i * DAY).toISOString().slice(0, 10);
    const id = `contribution-day-component-${i}`;
    html += `<td class="ContributionCalendar-day" data-date="${date}" data-level="${level(i)}" id="${id}"></td>`;
    const n = count(i);
    html += `<tool-tip for="${id}">${
      n ? `${n} contributions on ${date}` : `No contributions on ${date}`
    }</tool-tip>`;
  }
  return html;
}

test("解析贡献日历，按 id 配对日期、次数与等级", () => {
  const html = fragment((i) => (i === 10 ? 5 : 0), (i) => (i === 10 ? 3 : 0));
  const days = parseContributionsHtml(html);
  assert.equal(days.length, 1);
  assert.deepEqual(days[0], { date: "2024-01-11", count: 5, level: 3 });
});

test("缺口片段视为无效日历", () => {
  assert.throws(() => parseContributionsHtml("<td></td>"));
});

test("无用户、离线或错误响应不生成虚假贡献", async () => {
  for (const f of [
    async () => {
      throw new Error("offline");
    },
    async () => new Response("{}", { status: 503 }),
    async () => new Response("<table></table>"),
  ]) {
    const contributions = createContributionsService(f as typeof fetch, "me");
    assert.deepEqual(await contributions(2024), { available: false });
  }
  const empty = createContributionsService((async () => {
    throw new Error("should not be called");
  }) as typeof fetch, "");
  assert.deepEqual(await empty(2024), { available: false });
});

test("贡献缓存与并发请求合并，URL 带上用户与年份区间", async () => {
  const requests: URL[] = [];
  let calls = 0;
  const contributions = createContributionsService((async (input) => {
    calls++;
    requests.push(new URL(String(input)));
    await new Promise((resolve) => setTimeout(resolve, 10));
    return new Response(fragment((i) => (i === 0 ? 2 : 0), (i) => (i === 0 ? 2 : 0)));
  }) as typeof fetch, "zzpioneer");
  const results = await Promise.all([
    contributions(2024),
    contributions(2024),
    contributions(2024),
  ]);
  assert.equal(calls, 1);
  assert.equal(results[0].available, true);
  assert.deepEqual(results[0].days, [{ date: "2024-01-01", count: 2, level: 2 }]);
  assert.equal(requests[0].pathname, "/users/zzpioneer/contributions");
  assert.equal(requests[0].searchParams.get("from"), "2024-01-01");
  assert.equal(requests[0].searchParams.get("to"), "2024-12-31");
  await contributions(2024);
  assert.equal(calls, 1);
});
