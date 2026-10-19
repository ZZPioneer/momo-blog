import test from "node:test";
import assert from "node:assert/strict";
import { createWeatherService } from "../server/weather";
import { DEFAULT_LOCATION } from "../shared/model";
test("天气失败、错误响应不生成虚假天气", async () => {
  for (const f of [
    async () => {
      throw new Error("offline");
    },
    async () => new Response("{}", { status: 503 }),
    async () => Response.json({ current: { temperature_2m: "wrong" } }),
  ]) {
    const weather = createWeatherService(f as typeof fetch);
    assert.deepEqual(await weather(), { available: false });
  }
});
test("天气缓存与同时请求合并", async () => {
  let calls = 0;
  const weather = createWeatherService((async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 10));
    return Response.json({
      current: { temperature_2m: 18.5, weather_code: 1 },
    });
  }) as typeof fetch);
  const results = await Promise.all([weather(), weather(), weather()]);
  assert.equal(calls, 1);
  assert.equal(results[0].temperature, 18.5);
  assert.equal(results[0].available, true);
  await weather();
  assert.equal(calls, 1);
});
test("不同地点的天气和失败缓存隔离，请求使用设置的坐标与时区", async () => {
  const requests: URL[] = [];
  const weather = createWeatherService((async (input) => {
    const url = new URL(String(input));
    requests.push(url);
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (url.searchParams.get("timezone") === "Europe/London")
      return new Response("{}", { status: 503 });
    return Response.json({
      current: {
        temperature_2m:
          url.searchParams.get("timezone") === "Asia/Shanghai" ? 28 : 16,
        weather_code: 1,
      },
    });
  }) as typeof fetch);
  const shanghai = {
    latitude: 31.2222,
    longitude: 121.4581,
    timeZone: "Asia/Shanghai",
  };
  const [sydney, china, chinaAgain] = await Promise.all([
    weather(DEFAULT_LOCATION),
    weather(shanghai),
    weather(shanghai),
  ]);
  assert.equal(requests.length, 2);
  assert.equal(sydney.temperature, 16);
  assert.equal(china.temperature, 28);
  assert.deepEqual(chinaAgain, china);
  assert.equal(requests[1].searchParams.get("latitude"), "31.2222");
  assert.equal(requests[1].searchParams.get("longitude"), "121.4581");
  assert.equal(requests[1].searchParams.get("timezone"), "Asia/Shanghai");
  assert.deepEqual(
    await weather({
      latitude: 51.5085,
      longitude: -0.1257,
      timeZone: "Europe/London",
    }),
    { available: false },
  );
  assert.equal((await weather(DEFAULT_LOCATION)).temperature, 16);
  assert.equal((await weather(shanghai)).temperature, 28);
  assert.equal(requests.length, 3);
});
test("当日详情字段随请求一起解析，日出日落只保留时钟", async () => {
  const requests: URL[] = [];
  const weather = createWeatherService((async (input) => {
    requests.push(new URL(String(input)));
    return Response.json({
      current: {
        temperature_2m: 28.4,
        weather_code: 0,
        relative_humidity_2m: 68,
        apparent_temperature: 31.2,
        wind_speed_10m: 2.4,
        wind_direction_10m: 96,
      },
      daily: {
        temperature_2m_max: [28.6],
        temperature_2m_min: [24.1],
        precipitation_sum: [0],
        precipitation_probability_max: [0],
        uv_index_max: [5.2],
        sunrise: ["2026-10-19T05:58"],
        sunset: ["2026-10-19T17:23"],
      },
    });
  }) as typeof fetch);
  const value = await weather();
  assert.equal(value.available, true);
  assert.equal(value.tempHigh, 28.6);
  assert.equal(value.tempLow, 24.1);
  assert.equal(value.apparent, 31.2);
  assert.equal(value.humidity, 68);
  assert.equal(value.windSpeed, 2.4);
  assert.equal(value.windDirection, 96);
  assert.equal(value.precipitationProbability, 0);
  assert.equal(value.precipitation, 0);
  assert.equal(value.uvIndex, 5.2);
  assert.equal(value.sunrise, "05:58");
  assert.equal(value.sunset, "17:23");
  const query = requests[0].searchParams;
  assert.match(query.get("current")!, /apparent_temperature/);
  assert.match(query.get("daily")!, /uv_index_max/);
  assert.equal(query.get("wind_speed_unit"), "ms");
  assert.equal(query.get("forecast_days"), "1");
});
test("只有核心字段时详情留空，不影响可用性", async () => {
  const weather = createWeatherService((async () =>
    Response.json({
      current: { temperature_2m: 18.5, weather_code: 1 },
      daily: {},
    })) as typeof fetch);
  const value = await weather();
  assert.equal(value.available, true);
  assert.equal(value.temperature, 18.5);
  assert.equal(value.tempHigh, undefined);
  assert.equal(value.humidity, undefined);
  assert.equal(value.sunrise, undefined);
  assert.equal(value.sunset, undefined);
});
