import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloudy,
  Droplets,
  MapPin,
  Shirt,
  Sun,
  Sunrise,
  Sunset,
  Umbrella,
  Wind,
} from "lucide-react";
import { useSite } from "../store";
import { request } from "../api";
import {
  weatherLocationKey,
  zonedDay,
  type VisitorPlace,
  type Weather,
} from "../../../shared/model";
import {
  clothingAdvice,
  uvLevel,
  weatherCondition,
  windLabel,
  type WeatherKind,
} from "../../../shared/weather";
import { useClock } from "./HomeCards";

const conditionIcons: Record<WeatherKind, typeof Sun> = {
  sunny: Sun,
  cloudy: CloudSun,
  overcast: Cloudy,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
  unknown: Cloud,
};

const amount = (value: number | undefined, unit = "") =>
  value === undefined ? "—" : `${Math.round(value)}${unit}`;

export function WeatherCard() {
  const { content, home } = useSite();
  const { name, timeZone } = content!.location;
  const key = weatherLocationKey(content!.location);
  const preview = key !== weatherLocationKey(home!.content.location);
  const [weather, setWeather] = useState<{
    key: string;
    value: Weather;
  } | null>(null);
  const [place, setPlace] = useState<VisitorPlace | null>(null);
  const now = useClock();
  useEffect(() => {
    let active = true;
    const load = () =>
      request<Weather>(
        preview ? "/api/weather/preview" : "/api/weather",
        preview
          ? {
              method: "POST",
              body: JSON.stringify({
                latitude: content!.location.latitude,
                longitude: content!.location.longitude,
                timeZone: content!.location.timeZone,
              }),
            }
          : {},
      )
        .then((w) => {
          if (active) setWeather({ key, value: w });
        })
        .catch(() => {
          if (active) setWeather({ key, value: { available: false } });
        });
    void load();
    const timer = setInterval(() => void load(), 15 * 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [key, preview]);
  useEffect(() => {
    let active = true;
    request<{ available: boolean; place?: VisitorPlace }>(
      "/api/visitor-location",
    )
      .then((value) => {
        if (active) setPlace(value.available ? (value.place ?? null) : null);
      })
      .catch(() => {
        if (active) setPlace(null);
      });
    return () => {
      active = false;
    };
  }, []);
  const current = weather?.key === key ? weather.value : null;
  const condition = weatherCondition(
    current?.available ? current.code : undefined,
  );
  const CondIcon = conditionIcons[condition.kind];
  const advice = current?.available
    ? clothingAdvice({ code: current.code, tempHigh: current.tempHigh })
    : null;
  // 访客定位失败（内网/回环地址或第三方不可用）时不冒充站点城市，
  // 只给一句通用的欢迎语。
  const placeLabel = place?.label ?? "";
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .split(":");
  const date = zonedDay(now, timeZone).replaceAll("-", ".");
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    weekday: "short",
  }).format(now);
  return (
    <section className="weather-card" aria-label={`${name} 天气`}>
      <header className="weather-head">
        <span className="weather-brand">WEATHER · {name}</span>
        <span className="weather-date">
          {date} · {weekday}
        </span>
      </header>
      <div className="weather-body">
        <div className="weather-hero">
          <div className="weather-hero-top">
            <span className="weather-cond">
              <CondIcon size={24} strokeWidth={1.6} aria-hidden="true" />
              {current && !current.available ? "暂不可用" : condition.label}
              {current?.stale && <small>上次记录</small>}
            </span>
            <span className="weather-temp">
              {amount(current?.temperature)}
              <i>℃</i>
            </span>
          </div>
          <p className="weather-clock" aria-label="当前时间">
            {clock[0]}:{clock[1]}
            <span className="weather-seconds">:{clock[2]}</span>
          </p>
        </div>
        <p className="weather-line weather-temps">
          <span className="weather-temp-item">
            <span className="weather-temp-label">最高</span>
            <span className="weather-temp-value">
              {amount(current?.tempHigh, "°")}
            </span>
          </span>
          <span className="weather-temp-item">
            <span className="weather-temp-label">最低</span>
            <span className="weather-temp-value">
              {amount(current?.tempLow, "°")}
            </span>
          </span>
          <span className="weather-temp-item">
            <span className="weather-temp-label">体感</span>
            <span className="weather-temp-value">
              {amount(current?.apparent, "°")}
            </span>
          </span>
        </p>
        <div className="weather-line weather-row">
          <span className="weather-param">
            <Droplets size={16} aria-hidden="true" /> 湿度
            {amount(current?.humidity, "%")}
          </span>
          <span className="weather-row-divider" aria-hidden="true" />
          <span className="weather-param">
            <Wind size={16} aria-hidden="true" />{" "}
            {windLabel(current?.windSpeed, current?.windDirection) ?? "—"}
          </span>
        </div>
        <div className="weather-line weather-row">
          <span className="weather-param">
            <Umbrella size={16} aria-hidden="true" /> 降水概率
            {amount(current?.precipitationProbability, "%")}
          </span>
          <span className="weather-row-divider" aria-hidden="true" />
          <span className="weather-param">
            <CloudRain size={16} aria-hidden="true" /> 降水量
            {amount(current?.precipitation, "mm")}
          </span>
        </div>
        <div className="weather-line weather-row">
          <span className="weather-param">
            <Sun size={16} aria-hidden="true" /> 紫外线
            {current?.uvIndex === undefined
              ? "—"
              : `${Math.round(current.uvIndex)}（${uvLevel(current.uvIndex)}）`}
          </span>
        </div>
        <div className="weather-line weather-row">
          <span className="weather-param">
            <Sunrise size={16} aria-hidden="true" /> 日出
            {current?.sunrise ?? "—"}
          </span>
          <span className="weather-row-divider" aria-hidden="true" />
          <span className="weather-param">
            <Sunset size={16} aria-hidden="true" /> 日落
            {current?.sunset ?? "—"}
          </span>
        </div>
        <p className="weather-line weather-advice">
          <Shirt size={16} aria-hidden="true" />
          <span>穿衣建议：{advice ?? "—"}</span>
        </p>
      </div>
      <p className="weather-welcome">
        <MapPin size={14} aria-hidden="true" />
        <span>
          {placeLabel ? (
            <>
              欢迎来自 <span className="weather-place">{placeLabel}</span>{" "}
              的朋友访问
            </>
          ) : (
            "欢迎来自远方的朋友访问"
          )}
        </span>
      </p>
    </section>
  );
}
