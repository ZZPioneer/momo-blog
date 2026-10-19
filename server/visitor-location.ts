import type { VisitorPlace } from "../shared/model.js";

/* 访客定位：按 IP 推断大致位置，只用于天气卡片的欢迎语。
   结果按 IP 缓存（成功 6 小时、失败 10 分钟），查询失败或内网地址
   返回 null，由调用方回退到站点地点。 */

const SUCCESS_TTL = 6 * 60 * 60_000;
const FAILURE_TTL = 10 * 60_000;
const MAX_ENTRIES = 512;
const TIMEOUT = 3000;

const text = (value: unknown, max = 40) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const joinPlace = (parts: (string | undefined)[]) => {
  const seen: string[] = [];
  for (const part of parts) {
    const value = text(part);
    if (value && !seen.includes(value)) seen.push(value);
  }
  return seen.join("·");
};

// 仅查询公网地址；回环、内网、链路本地和保留地址直接放弃。
export function isPublicIp(ip: string): boolean {
  const address = ip.trim().toLowerCase().replace(/^::ffff:/, "");
  if (!address) return false;
  if (address.includes(":")) {
    if (address === "::" || address === "::1") return false;
    if (/^f[cd]/.test(address)) return false; // fc00::/7 唯一本地地址
    if (/^fe[89ab]/.test(address)) return false; // fe80::/10 链路本地
    if (address.startsWith("2001:db8")) return false; // 文档前缀
    return true;
  }
  const parts = address.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return false;
  const [a, b] = parts.map(Number);
  if ([a, b].some((n) => n > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 192 && b === 168) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 169 && b === 254) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // 运营商级 NAT
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 192 && b === 0) return false; // 192.0.2.0/24 文档
  if (a === 203 && b === 0) return false; // 203.0.113.0/24 文档
  return true;
}

// 首选来源：中文「省·市」，UTF-8 返回，国内海外均为中文地名。
// （原淘宝 ip.taobao.com 接口已停用，恒定返回 QPS 超限。）
async function fromMir6(
  fetcher: typeof fetch,
  ip: string,
): Promise<VisitorPlace | null> {
  try {
    const res = await fetcher(
      `https://api.mir6.com/api/ip?ip=${encodeURIComponent(ip)}&type=json`,
      { signal: AbortSignal.timeout(TIMEOUT) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.code !== 200) return null;
    const info = data.data ?? {};
    const city = text(info.city),
      region = text(info.province),
      country = text(info.country);
    const label = joinPlace([country === "中国" ? "" : country, region, city]);
    if (!label) return null;
    return { city, region, label };
  } catch {
    return null;
  }
}

// 首选来源不可用时的备用来源，英文地名。
async function fromIpWhoIs(
  fetcher: typeof fetch,
  ip: string,
): Promise<VisitorPlace | null> {
  try {
    const res = await fetcher(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success) return null;
    const city = text(data.city),
      region = text(data.region),
      country = text(data.country);
    const label = joinPlace([country, region, city]);
    if (!label) return null;
    return { city, region, label };
  } catch {
    return null;
  }
}

async function lookup(
  fetcher: typeof fetch,
  ip: string,
): Promise<VisitorPlace | null> {
  const primary = await fromMir6(fetcher, ip);
  // 首选源只要给出可用地名就直接采用，不再为补全 city 多调一次备用源。
  if (primary && primary.label) return primary;
  return fromIpWhoIs(fetcher, ip);
}

export function createVisitorLocationService(fetcher: typeof fetch = fetch) {
  const cache = new Map<
    string,
    { place: VisitorPlace | null; expiry: number }
  >();
  return async function locate(ip: string): Promise<VisitorPlace | null> {
    if (!isPublicIp(ip)) return null;
    const cached = cache.get(ip);
    if (cached && cached.expiry > Date.now()) return cached.place;
    if (cached) cache.delete(ip);
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
    const place = await lookup(fetcher, ip);
    cache.set(ip, {
      place,
      expiry: Date.now() + (place ? SUCCESS_TTL : FAILURE_TTL),
    });
    return place;
  };
}
