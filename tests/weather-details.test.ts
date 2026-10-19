import test from "node:test";
import assert from "node:assert/strict";
import {
  beaufortLevel,
  clothingAdvice,
  uvLevel,
  weatherCondition,
  windDirectionName,
  windLabel,
} from "../shared/weather";

test("WMO 天气代码映射中文与图标类别", () => {
  assert.deepEqual(weatherCondition(0), { label: "晴", kind: "sunny" });
  assert.deepEqual(weatherCondition(2), { label: "多云", kind: "cloudy" });
  assert.deepEqual(weatherCondition(3), { label: "阴", kind: "overcast" });
  assert.deepEqual(weatherCondition(48), { label: "雾凇", kind: "fog" });
  assert.deepEqual(weatherCondition(61), { label: "小雨", kind: "rain" });
  assert.deepEqual(weatherCondition(75), { label: "大雪", kind: "snow" });
  assert.deepEqual(weatherCondition(95), { label: "雷暴", kind: "thunder" });
  assert.equal(weatherCondition(42).kind, "unknown");
  assert.equal(weatherCondition(42).label, "天气多变");
  assert.deepEqual(weatherCondition(undefined), { label: "—", kind: "unknown" });
});

test("风向按 45 度分档取中文名", () => {
  assert.equal(windDirectionName(0), "北");
  assert.equal(windDirectionName(44), "东北");
  assert.equal(windDirectionName(90), "东");
  assert.equal(windDirectionName(135), "东南");
  assert.equal(windDirectionName(181), "南");
  assert.equal(windDirectionName(270), "西");
  assert.equal(windDirectionName(359), "北");
  assert.equal(windDirectionName(720), "北");
  assert.equal(windDirectionName(-90), "西");
});

test("蒲福风级按 m/s 分档", () => {
  assert.equal(beaufortLevel(0), 0);
  assert.equal(beaufortLevel(0.2), 0);
  assert.equal(beaufortLevel(0.3), 1);
  assert.equal(beaufortLevel(2), 2);
  assert.equal(beaufortLevel(3.4), 3);
  assert.equal(beaufortLevel(24.5), 10);
  assert.equal(beaufortLevel(40), 12);
});

test("风力标签缺数据时返回 null", () => {
  assert.equal(windLabel(2.4, 96), "东风 2级");
  assert.equal(windLabel(undefined, 96), null);
  assert.equal(windLabel(2.4, undefined), null);
});

test("紫外线等级分段", () => {
  assert.equal(uvLevel(0), "弱");
  assert.equal(uvLevel(2), "弱");
  assert.equal(uvLevel(3), "中等");
  assert.equal(uvLevel(5), "中等");
  assert.equal(uvLevel(6), "强");
  assert.equal(uvLevel(7), "强");
  assert.equal(uvLevel(8), "很强");
  assert.equal(uvLevel(10), "很强");
  assert.equal(uvLevel(11), "极强");
});

test("穿衣建议随温度与天气变化，无温度时为空", () => {
  assert.equal(clothingAdvice({ code: 0, tempHigh: 28 }), "短袖薄衫，注意防暑降温");
  assert.equal(clothingAdvice({ code: 1, tempHigh: 35 }), "天气炎热，注意防暑降温，多补充水分");
  assert.equal(clothingAdvice({ code: 2, tempHigh: 23 }), "短袖短裤，舒适出行");
  assert.equal(clothingAdvice({ code: 3, tempHigh: 18 }), "长袖衬衫，早晚可添件薄外套");
  assert.equal(clothingAdvice({ code: 0, tempHigh: 12 }), "薄外套加身，注意保暖");
  assert.equal(clothingAdvice({ code: 0, tempHigh: 5 }), "厚外套或风衣，注意添衣");
  assert.equal(clothingAdvice({ code: 0, tempHigh: -3 }), "羽绒服厚外套，注意防寒保暖");
  assert.equal(
    clothingAdvice({ code: 61, tempHigh: 23 }),
    "短袖短裤，舒适出行；出门记得带伞",
  );
  assert.equal(
    clothingAdvice({ code: 75, tempHigh: 2 }),
    "羽绒服厚外套，注意防寒保暖；路面湿滑注意防滑",
  );
  assert.equal(clothingAdvice({ code: 0 }), null);
});
