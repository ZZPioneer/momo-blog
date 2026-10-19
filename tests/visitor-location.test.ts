import test from "node:test";
import assert from "node:assert/strict";
import {
  createVisitorLocationService,
  isPublicIp,
} from "../server/visitor-location";

test("内网、回环与保留地址不查询第三方服务", async () => {
  let calls = 0;
  const locate = createVisitorLocationService((async () => {
    calls++;
    return Response.json({});
  }) as typeof fetch);
  for (const ip of [
    "",
    "127.0.0.1",
    "::1",
    "::",
    "10.1.2.3",
    "192.168.1.5",
    "172.16.0.9",
    "172.31.255.255",
    "169.254.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "192.0.2.1",
    "203.0.113.9",
    "224.0.0.1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fd00::1",
    "2001:db8::1",
    "not-an-ip",
  ])
    assert.equal(await locate(ip), null, ip);
  assert.equal(calls, 0);
});

test("公网地址判定", () => {
  assert.equal(isPublicIp("122.240.195.57"), true);
  assert.equal(isPublicIp("1.1.1.1"), true);
  assert.equal(isPublicIp("::ffff:8.8.8.8"), true);
  assert.equal(isPublicIp("223.5.5.5"), true);
  assert.equal(isPublicIp("240.0.0.1"), false);
});

test("国内 IP 走 mir6 定位，得到中文「省·市」", async () => {
  const locate = createVisitorLocationService((async (input) => {
    assert.match(String(input), /api\.mir6\.com/);
    return Response.json({
      code: 200,
      data: { country: "中国", province: "浙江", city: "温州" },
    });
  }) as typeof fetch);
  assert.deepEqual(await locate("122.240.195.57"), {
    city: "温州",
    region: "浙江",
    label: "浙江·温州",
  });
});

test("mir6 有可用地名时直接用中文地名，不再请求备用源", async () => {
  const calls: string[] = [];
  const locate = createVisitorLocationService((async (input) => {
    calls.push(String(input));
    return Response.json({
      code: 200,
      data: { country: "中国", province: "浙江省", city: "" },
    });
  }) as typeof fetch);
  assert.deepEqual(await locate("122.240.195.57"), {
    city: "",
    region: "浙江省",
    label: "浙江省",
  });
  assert.equal(calls.length, 1);
});

test("mir6 完全无结果时回退到 ipwho.is", async () => {
  const locate = createVisitorLocationService((async (input) => {
    const url = String(input);
    if (url.includes("api.mir6.com")) return Response.json({ code: 500 });
    assert.match(url, /ipwho\.is/);
    return Response.json({
      success: true,
      country: "Australia",
      region: "Queensland",
      city: "Brisbane",
    });
  }) as typeof fetch);
  assert.deepEqual(await locate("1.1.1.1"), {
    city: "Brisbane",
    region: "Queensland",
    label: "Australia·Queensland·Brisbane",
  });
});

test("两个来源都失败时返回 null，并按 IP 缓存避免重复请求", async () => {
  let calls = 0;
  const locate = createVisitorLocationService((async () => {
    calls++;
    throw new Error("offline");
  }) as typeof fetch);
  assert.equal(await locate("8.8.8.8"), null);
  const after = calls;
  assert.ok(after >= 2, "依次尝试了两个来源");
  assert.equal(await locate("8.8.8.8"), null);
  assert.equal(calls, after);
});

test("成功结果按 IP 缓存，不同 IP 分别查询", async () => {
  const seen: string[] = [];
  const locate = createVisitorLocationService((async (input) => {
    const ip = new URL(String(input)).searchParams.get("ip")!;
    seen.push(ip);
    return Response.json({
      code: 200,
      data: { country: "中国", province: "广东", city: "深圳" },
    });
  }) as typeof fetch);
  const first = await locate("119.147.1.1");
  assert.equal(first?.label, "广东·深圳");
  assert.deepEqual(await locate("119.147.1.1"), first);
  assert.deepEqual(seen, ["119.147.1.1"]);
  await locate("183.3.1.1");
  assert.deepEqual(seen, ["119.147.1.1", "183.3.1.1"]);
});
