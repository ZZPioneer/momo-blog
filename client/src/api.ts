import { basePath } from "./base";
import type {
  HomeResponse,
  Stats,
  VisitorState,
  Weather,
  WeatherLocation,
} from "../../shared/model";
import { parseWeatherPayload } from "../../shared/weather";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// GitHub Pages 演示站没有服务端：数据来自构建时生成的示例快照，
// 天气直接请求 Open-Meteo（它允许跨域），互动状态只在当前会话内模拟。
const staticDemo = import.meta.env.VITE_STATIC_DEMO === "1";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok)
    throw new ApiError(res.status, "演示数据加载失败，请稍后刷新重试。");
  return res.json() as Promise<T>;
}

let demoData: Promise<{ home: HomeResponse; state: VisitorState }> | null = null;
function loadDemo() {
  demoData ??= Promise.all([
    getJson<HomeResponse>(`${basePath}/demo/home.json`),
    getJson<VisitorState>(`${basePath}/demo/state.json`),
  ]).then(([home, state]) => ({ home, state }));
  return demoData;
}

async function demoWeather(location: WeatherLocation): Promise<Weather> {
  try {
    const query = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current:
        "temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m",
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset",
      timezone: location.timeZone,
      wind_speed_unit: "ms",
      forecast_days: "1",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("weather unavailable");
    return parseWeatherPayload(await res.json()) ?? { available: false };
  } catch {
    return { available: false };
  }
}

let demoStats: Stats | null = null;

async function demoRequest<T>(path: string, init: RequestInit): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const { home, state } = await loadDemo();
  let stats: Stats = (demoStats ??= state.stats);
  switch (path) {
    case "/api/home":
      if (method === "PUT")
        throw new ApiError(403, "这是静态演示站，内容不可编辑。");
      return home as T;
    case "/api/state":
      return state as T;
    case "/api/visits":
      return stats as T;
    case "/api/checkin":
      stats = { ...stats, checkedIn: true, checkins: stats.checkins + 1 };
      demoStats = stats;
      return stats as T;
    case "/api/likes": {
      const liked = Boolean(
        JSON.parse(String(init.body ?? "{}")).liked as boolean,
      );
      stats = {
        ...stats,
        liked,
        likeCount: stats.likeCount + (liked ? 1 : -1),
      };
      demoStats = stats;
      return stats as T;
    }
    case "/api/contributions":
      return { available: false } as T;
    case "/api/visitor-location":
      return { available: false } as T;
    case "/api/weather":
    case "/api/weather/preview":
      return (await demoWeather(home.content.location)) as T;
  }
  throw new ApiError(404, "这是静态演示站，该功能需要自托管部署后才能使用。");
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (staticDemo) return demoRequest<T>(path, init);
  const res = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  const data = await res
    .json()
    .catch(() => ({ error: "服务暂时没有响应，请重试。" }));
  if (!res.ok)
    throw new ApiError(
      res.status,
      data.error?.message || data.error || data.message || "操作失败，请重试。",
    );
  return data;
}
