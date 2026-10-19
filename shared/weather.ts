/* 天气展示辅助函数：WMO 天气代码、风向、蒲福风级、紫外线等级与穿衣建议。
   服务端只做数据透传，展示逻辑在此共享，便于测试与复用。 */

export type WeatherKind =
  | "sunny"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder"
  | "unknown";

const conditions: Record<number, { label: string; kind: WeatherKind }> = {
  0: { label: "晴", kind: "sunny" },
  1: { label: "晴间多云", kind: "sunny" },
  2: { label: "多云", kind: "cloudy" },
  3: { label: "阴", kind: "overcast" },
  45: { label: "雾", kind: "fog" },
  48: { label: "雾凇", kind: "fog" },
  51: { label: "毛毛雨", kind: "drizzle" },
  53: { label: "毛毛雨", kind: "drizzle" },
  55: { label: "浓毛毛雨", kind: "drizzle" },
  56: { label: "冻毛毛雨", kind: "drizzle" },
  57: { label: "冻毛毛雨", kind: "drizzle" },
  61: { label: "小雨", kind: "rain" },
  63: { label: "中雨", kind: "rain" },
  65: { label: "大雨", kind: "rain" },
  66: { label: "冻雨", kind: "rain" },
  67: { label: "冻雨", kind: "rain" },
  71: { label: "小雪", kind: "snow" },
  73: { label: "中雪", kind: "snow" },
  75: { label: "大雪", kind: "snow" },
  77: { label: "雪粒", kind: "snow" },
  80: { label: "小阵雨", kind: "rain" },
  81: { label: "阵雨", kind: "rain" },
  82: { label: "强阵雨", kind: "rain" },
  85: { label: "小阵雪", kind: "snow" },
  86: { label: "大阵雪", kind: "snow" },
  95: { label: "雷暴", kind: "thunder" },
  96: { label: "雷暴伴冰雹", kind: "thunder" },
  99: { label: "雷暴伴冰雹", kind: "thunder" },
};

export function weatherCondition(code: number | undefined): {
  label: string;
  kind: WeatherKind;
} {
  if (code === undefined) return { label: "—", kind: "unknown" };
  return conditions[code] ?? { label: "天气多变", kind: "unknown" };
}

const DIRECTIONS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];

export function windDirectionName(degrees: number): string {
  const normalized = (((degrees % 360) + 360) % 360) / 45;
  return DIRECTIONS[Math.round(normalized) % 8];
}

// 蒲福风级，风速单位 m/s。
const BEAUFORT = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];

export function beaufortLevel(ms: number): number {
  let level = 0;
  while (level < BEAUFORT.length && ms >= BEAUFORT[level]) level++;
  return level;
}

export function windLabel(speed?: number, direction?: number): string | null {
  if (speed === undefined || direction === undefined) return null;
  return `${windDirectionName(direction)}风 ${beaufortLevel(speed)}级`;
}

export function uvLevel(index: number): string {
  if (index <= 2) return "弱";
  if (index <= 5) return "中等";
  if (index <= 7) return "强";
  if (index <= 10) return "很强";
  return "极强";
}

export function clothingAdvice(input: {
  code?: number;
  tempHigh?: number;
}): string | null {
  const { code, tempHigh } = input;
  if (tempHigh === undefined) return null;
  const kind = weatherCondition(code).kind;
  let base: string;
  if (tempHigh >= 32) base = "天气炎热，注意防暑降温，多补充水分";
  else if (tempHigh >= 28) base = "短袖薄衫，注意防暑降温";
  else if (tempHigh >= 23) base = "短袖短裤，舒适出行";
  else if (tempHigh >= 18) base = "长袖衬衫，早晚可添件薄外套";
  else if (tempHigh >= 12) base = "薄外套加身，注意保暖";
  else if (tempHigh >= 5) base = "厚外套或风衣，注意添衣";
  else base = "羽绒服厚外套，注意防寒保暖";
  if (kind === "snow") return `${base}；路面湿滑注意防滑`;
  if (kind === "rain" || kind === "drizzle" || kind === "thunder")
    return `${base}；出门记得带伞`;
  return base;
}
