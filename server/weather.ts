import {
  DEFAULT_LOCATION,
  weatherLocationKey,
  type Weather,
  type WeatherLocation,
} from "../shared/model.js";
import { parseWeatherPayload } from "../shared/weather.js";

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
    state.pending = (async (): Promise<Weather> => {
      let result: Weather;
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
        const parsed = parseWeatherPayload(await res.json());
        if (!parsed) throw new Error("invalid weather");
        result = parsed;
        state.nextFetch = Date.now() + 15 * 60_000;
      } catch {
        result = state.cached?.available
          ? { ...state.cached, stale: true }
          : { available: false };
        state.nextFetch = Date.now() + 60_000;
      }
      state.cached = result;
      return result;
    })().finally(() => {
      state.pending = null;
    });
    return state.pending;
  };
}
