import {
  DEFAULT_LOCATION,
  weatherLocationKey,
  type Weather,
  type WeatherLocation,
} from "../shared/model.js";

const num = (value: unknown) =>
  Number.isFinite(value) ? (value as number) : undefined;

// Open-Meteo 按请求时区返回本地 ISO 时间（如 "2026-10-19T05:58"），
// 卡片只需要时钟部分。
const clock = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const time = value.split("T")[1];
  return time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : undefined;
};

const first = (value: unknown) =>
  Array.isArray(value) ? value[0] : undefined;

export function createWeatherService(fetcher: typeof fetch = fetch) {
  const cache = new Map<
    string,
    {
      cached: Weather | null;
      nextFetch: number;
      pending: Promise<Weather> | null;
    }
  >();
  return async function weather(
    location: WeatherLocation = DEFAULT_LOCATION,
  ): Promise<Weather> {
    const key = weatherLocationKey(location);
    let entry = cache.get(key);
    if (!entry) {
      // Bound the cache used by saved locations and admin previews.
      if (cache.size >= 32) cache.delete(cache.keys().next().value!);
      entry = { cached: null, nextFetch: 0, pending: null };
      cache.set(key, entry);
    }
    const state = entry;
    if (Date.now() < state.nextFetch && state.cached) return state.cached;
    if (state.pending) return state.pending;
    state.pending = (async () => {
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
        const res = await fetcher(
          `https://api.open-meteo.com/v1/forecast?${query}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error("weather unavailable");
        const data = await res.json();
        if (
          !Number.isFinite(data.current?.temperature_2m) ||
          !Number.isFinite(data.current?.weather_code)
        )
          throw new Error("invalid weather");
        // 核心字段有效即视为可用；其余字段按接口返回逐项解析，
        // 缺失时留空，由卡片显示占位符。
        const daily = data.daily ?? {};
        state.cached = {
          available: true,
          temperature: data.current.temperature_2m,
          code: data.current.weather_code,
          tempHigh: num(first(daily.temperature_2m_max)),
          tempLow: num(first(daily.temperature_2m_min)),
          apparent: num(data.current.apparent_temperature),
          humidity: num(data.current.relative_humidity_2m),
          windSpeed: num(data.current.wind_speed_10m),
          windDirection: num(data.current.wind_direction_10m),
          precipitationProbability: num(
            first(daily.precipitation_probability_max),
          ),
          precipitation: num(first(daily.precipitation_sum)),
          uvIndex: num(first(daily.uv_index_max)),
          sunrise: clock(first(daily.sunrise)),
          sunset: clock(first(daily.sunset)),
          updatedAt: new Date().toISOString(),
          stale: false,
        };
        state.nextFetch = Date.now() + 15 * 60_000;
      } catch {
        state.cached = state.cached?.available
          ? { ...state.cached, stale: true }
          : { available: false };
        state.nextFetch = Date.now() + 60_000;
      }
      return state.cached;
    })().finally(() => {
      state.pending = null;
    });
    return state.pending;
  };
}
