import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import GlimmerVale, { DEFAULT_ADVANCED } from "./GlimmerVale";
import glimmerValeSrc from "./GlimmerVale.tsx?raw";
import LumenCinch, { LumenCinchPreset } from "./LumenCinch";
import lumenCinchSrc from "./LumenCinch.tsx?raw";
import MarbleSprite, { DEFAULT_ADVANCED as MARBLE_ADVANCED } from "./MarbleSprite";
import marbleSpriteSrc from "./MarbleSprite.tsx?raw";
import HoloCard, { type HoloCardProps } from "./HoloCard";
import holoCardSrc from "./HoloCard.tsx?raw";
import TechText from "./TechText";
import techTextSrc from "./TechText.tsx?raw";
import TextLoop from "./TextLoop";
import textLoopSrc from "./TextLoop.tsx?raw";
import ParticleText from "./ParticleText";
import particleTextSrc from "./ParticleText.tsx?raw";
import SplitFlapText from "./SplitFlapText";
import splitFlapTextSrc from "./SplitFlapText.tsx?raw";
import WarpText from "./WarpText";
import warpTextSrc from "./WarpText.tsx?raw";
import DepthText from "./DepthText";
import depthTextSrc from "./DepthText.tsx?raw";
import EchoText from "./EchoText";
import echoTextSrc from "./EchoText.tsx?raw";
import SplitText from "./SplitText";
import splitTextSrc from "./SplitText.tsx?raw";
import BlurText from "./BlurText";
import blurTextSrc from "./BlurText.tsx?raw";
import CircularText from "./CircularText";
import circularTextSrc from "./CircularText.tsx?raw";
import TextType from "./TextType";
import textTypeSrc from "./TextType.tsx?raw";
import Shuffle from "./Shuffle";
import shuffleSrc from "./Shuffle.tsx?raw";
import ShinyText from "./ShinyText";
import shinyTextSrc from "./ShinyText.tsx?raw";
import TextPressure from "./TextPressure";
import textPressureSrc from "./TextPressure.tsx?raw";
import CurvedLoop from "./CurvedLoop";
import curvedLoopSrc from "./CurvedLoop.tsx?raw";
import FuzzyText from "./FuzzyText";
import fuzzyTextSrc from "./FuzzyText.tsx?raw";
import GradientText from "./GradientText";
import gradientTextSrc from "./GradientText.tsx?raw";
import FallingText from "./FallingText";
import fallingTextSrc from "./FallingText.tsx?raw";
import TextCursor from "./TextCursor";
import textCursorSrc from "./TextCursor.tsx?raw";
import DecryptedText from "./DecryptedText";
import decryptedTextSrc from "./DecryptedText.tsx?raw";
import TrueFocus from "./TrueFocus";
import trueFocusSrc from "./TrueFocus.tsx?raw";
import ScrollFloat from "./ScrollFloat";
import scrollFloatSrc from "./ScrollFloat.tsx?raw";
import ScrollReveal from "./ScrollReveal";
import scrollRevealSrc from "./ScrollReveal.tsx?raw";
import ScrambledText from "./ScrambledText";
import scrambledTextSrc from "./ScrambledText.tsx?raw";
import RotatingText from "./RotatingText";
import rotatingTextSrc from "./RotatingText.tsx?raw";
import GlitchText from "./GlitchText";
import glitchTextSrc from "./GlitchText.tsx?raw";
import ScrollVelocity from "./ScrollVelocity";
import scrollVelocitySrc from "./ScrollVelocity.tsx?raw";
import VariableProximity from "./VariableProximity";
import variableProximitySrc from "./VariableProximity.tsx?raw";
import CrystalizedBall from "./CrystalizedBall";
import crystalizedBallSrc from "./CrystalizedBall.tsx?raw";
import ElectricLogo from "./ElectricLogo";
import electricLogoSrc from "./ElectricLogo.tsx?raw";
import DitherVeil from "./DitherVeil";
import ditherVeilSrc from "./DitherVeil.tsx?raw";
import GlowCursor from "./GlowCursor";
import glowCursorSrc from "./GlowCursor.tsx?raw";
import RippleDistortion from "./RippleDistortion";
import rippleDistortionSrc from "./RippleDistortion.tsx?raw";
import ElasticMesh from "./ElasticMesh";
import elasticMeshSrc from "./ElasticMesh.tsx?raw";
import { CodeBlock } from "./CodeBlock";

/** Keeps a single crashing WebGL component from white-screening the whole lab. */
class PreviewBoundary extends Component<{ name: string; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="lab-preview__error">
          <p>「{this.props.name}」预览无法加载</p>
          <span>组件在初始化时抛出了异常，请检查控制台。</span>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * HoloCard sizes itself from its `width` prop and aspect ratio, so it can be
 * taller than the preview frame and get clipped. This wrapper scales it down
 * (never up) to fit the frame while keeping its true layout size, so the
 * `width` slider still works and the canvas stays crisp.
 */
function HoloCardLab(props: Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const ro = new ResizeObserver(() => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      if (!cw || !ch) return;
      const s = Math.min(parent.clientWidth / cw, parent.clientHeight / ch, 1) * 0.96;
      setScale(s);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <HoloCard {...(props as HoloCardProps)} />
    </div>
  );
}

// ── Live parameter controls ─────────────────────────────────────────────────
type RangeControl = {
  type: "range";
  group: string;
  label: string;
  /** "speed" for a top-level prop, "advanced.exposure" for a nested one. */
  path: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
};
type ColorControl = {
  type: "color";
  group: string;
  label: string;
  path: string;
  default: string;
};
type SelectControl = {
  type: "select";
  group: string;
  label: string;
  path: string;
  options: { label: string; value: string }[];
  default: string;
};
type ToggleControl = {
  type: "toggle";
  group: string;
  label: string;
  path: string;
  default: boolean;
};
export type ControlDef = RangeControl | ColorControl | SelectControl | ToggleControl;

/** Build the props object the Preview component receives from the current slider values. */
function buildProps(
  controls: ControlDef[],
  values: Record<string, number | string | boolean>,
  presetAdvanced?: Record<string, unknown>
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const adv: Record<string, unknown> = { ...(presetAdvanced ?? {}) };
  for (const c of controls) {
    const v = values[c.path];
    if (c.path.startsWith("advanced.")) adv[c.path.slice("advanced.".length)] = v;
    else props[c.path] = v;
  }
  if (Object.keys(adv).length) props.advanced = adv;
  return props;
}

/** Group controls by their `group` field, preserving first-seen order. */
function groupControls(controls: ControlDef[]): { name: string; items: ControlDef[] }[] {
  const order: string[] = [];
  const map = new Map<string, ControlDef[]>();
  for (const c of controls) {
    if (!map.has(c.group)) {
      map.set(c.group, []);
      order.push(c.group);
    }
    map.get(c.group)!.push(c);
  }
  return order.map((name) => ({ name, items: map.get(name)! }));
}

// ── LumenCinch parameter set ────────────────────────────────────────────────
// Defaults mirror LumenCinchPreset so the sliders start at the current look.
const LUMEN_CONTROLS: ControlDef[] = [
  // 运动 / Motion
  { type: "range", group: "运动", label: "整体速度", path: "speed", min: 0, max: 100, step: 1, default: 40, unit: "%" },
  { type: "range", group: "运动", label: "流动速度", path: "advanced.flowSpeed", min: 0, max: 200, step: 1, default: 40, unit: "%" },
  { type: "range", group: "运动", label: "闪烁", path: "advanced.flicker", min: 0, max: 100, step: 1, default: 30, unit: "%" },
  { type: "range", group: "运动", label: "呼吸幅度", path: "advanced.breathe", min: 0, max: 30, step: 1, default: 6, unit: "%" },
  // 形态 / Shape
  { type: "range", group: "形态", label: "整体缩放", path: "scale", min: 10, max: 300, step: 1, default: 130, unit: "%" },
  { type: "range", group: "形态", label: "光丝密度", path: "density", min: 10, max: 200, step: 1, default: 200, unit: "%" },
  { type: "range", group: "形态", label: "收束程度", path: "pinch", min: 0, max: 100, step: 1, default: 41, unit: "%" },
  { type: "range", group: "形态", label: "车道数", path: "advanced.lanes", min: 10, max: 200, step: 1, default: 41 },
  { type: "range", group: "形态", label: "倾斜", path: "advanced.lean", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "形态", label: "腰部位置", path: "advanced.waistY", min: 30, max: 70, step: 1, default: 50, unit: "%" },
  { type: "range", group: "形态", label: "扭转", path: "advanced.twist", min: 0, max: 20, step: 1, default: 2, unit: "%" },
  { type: "range", group: "形态", label: "光丝长度", path: "advanced.streakLength", min: 5, max: 60, step: 1, default: 27, unit: "%" },
  { type: "range", group: "形态", label: "光丝粗细", path: "advanced.streakWidth", min: 1, max: 20, step: 1, default: 1 },
  { type: "range", group: "形态", label: "失焦", path: "advanced.defocus", min: 0, max: 300, step: 1, default: 100, unit: "%" },
  { type: "range", group: "形态", label: "随机种子", path: "advanced.seed", min: 0, max: 99, step: 1, default: 22 },
  // 光感 / Light
  { type: "range", group: "光感", label: "曝光", path: "advanced.exposure", min: 20, max: 400, step: 1, default: 140, unit: "%" },
  { type: "range", group: "光感", label: "泛光", path: "advanced.bloom", min: 0, max: 200, step: 1, default: 65, unit: "%" },
  { type: "range", group: "光感", label: "雾感", path: "advanced.haze", min: 0, max: 200, step: 1, default: 4, unit: "%" },
  { type: "range", group: "光感", label: "纤维量", path: "advanced.fibres", min: 0, max: 300, step: 1, default: 175, unit: "%" },
  { type: "range", group: "光感", label: "尘埃", path: "advanced.dust", min: 0, max: 200, step: 1, default: 88, unit: "%" },
  { type: "range", group: "光感", label: "星点", path: "advanced.stars", min: 0, max: 200, step: 1, default: 50, unit: "%" },
  { type: "range", group: "光感", label: "颗粒", path: "advanced.grain", min: 0, max: 100, step: 1, default: 12, unit: "%" },
  { type: "range", group: "光感", label: "暗角", path: "advanced.vignette", min: 0, max: 100, step: 1, default: 10, unit: "%" },
  { type: "range", group: "光感", label: "色散", path: "fringe", min: 0, max: 100, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "青色占比", path: "advanced.cyanShare", min: 0, max: 100, step: 1, default: 58, unit: "%" },
  { type: "range", group: "光感", label: "紫色占比", path: "advanced.violetShare", min: 0, max: 100, step: 1, default: 85, unit: "%" },
  // 颜色 / Color
  { type: "color", group: "颜色", label: "背景", path: "background", default: "#131212" },
  { type: "color", group: "颜色", label: "暖色光", path: "baseColor", default: "#FF6800" },
  { type: "color", group: "颜色", label: "冷色散", path: "accentColor", default: "#FF0000" },
  { type: "color", group: "颜色", label: "核心色", path: "advanced.coreColor", default: "#D8CCC3" },
  { type: "color", group: "颜色", label: "紫色", path: "advanced.violetColor", default: "#8A6CFF" },
  { type: "color", group: "颜色", label: "中间色", path: "advanced.midColor", default: "#8D6A61" },
  { type: "color", group: "颜色", label: "雾色", path: "advanced.hazeColor", default: "#6F5449" },
  { type: "color", group: "颜色", label: "尘埃色", path: "advanced.dustColor", default: "#D8D0C8" },
];

// ── GlimmerVale parameter set ───────────────────────────────────────────────
// Defaults mirror __originkitPresetProps + DEFAULT_ADVANCED so the sliders
// start at the current look.
const GLIMMER_CONTROLS: ControlDef[] = [
  // 运动 / Motion
  { type: "range", group: "运动", label: "整体速度", path: "speed", min: 0, max: 100, step: 1, default: 53, unit: "%" },
  { type: "range", group: "运动", label: "循环周期", path: "advanced.loopSec", min: 2, max: 30, step: 1, default: 8, unit: "s" },
  { type: "range", group: "运动", label: "摇曳", path: "advanced.sway", min: 0, max: 100, step: 1, default: 50, unit: "%" },
  { type: "range", group: "运动", label: "浮动", path: "advanced.bob", min: 0, max: 30, step: 1, default: 6, unit: "%" },
  { type: "range", group: "运动", label: "闪烁锐度", path: "advanced.twinkleSharp", min: 1, max: 30, step: 1, default: 8 },
  { type: "range", group: "运动", label: "鼠标影响", path: "advanced.hover", min: 0, max: 100, step: 1, default: 50, unit: "%" },
  // 形态 / Shape
  { type: "range", group: "形态", label: "整体缩放", path: "scale", min: 30, max: 200, step: 1, default: 101, unit: "%" },
  { type: "range", group: "形态", label: "光点密度", path: "density", min: 10, max: 100, step: 1, default: 60, unit: "%" },
  { type: "range", group: "形态", label: "闪烁量", path: "sparkle", min: 0, max: 100, step: 1, default: 50, unit: "%" },
  { type: "range", group: "形态", label: "光点尺寸", path: "advanced.pointSize", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "形态", label: "波纹高度", path: "advanced.waveHeight", min: 0, max: 100, step: 1, default: 25, unit: "%" },
  { type: "range", group: "形态", label: "波纹长度", path: "advanced.waveLength", min: 10, max: 200, step: 1, default: 70, unit: "%" },
  { type: "range", group: "形态", label: "花朵大小", path: "advanced.flowerSize", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "形态", label: "花朵虚化", path: "advanced.flowerBlur", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "形态", label: "随机种子", path: "advanced.seed", min: 0, max: 99, step: 1, default: 7 },
  // 光感 / Light
  { type: "range", group: "光感", label: "脊线亮度", path: "advanced.crestBright", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "坡面亮度", path: "advanced.slopeBright", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "辉光强度", path: "advanced.glowStrength", min: 0, max: 200, step: 1, default: 60, unit: "%" },
  { type: "range", group: "光感", label: "热点强度", path: "advanced.hotspotStrength", min: 0, max: 200, step: 1, default: 70, unit: "%" },
  { type: "range", group: "光感", label: "热点位置", path: "advanced.hotspotX", min: 0, max: 100, step: 1, default: 65, unit: "%" },
  { type: "range", group: "光感", label: "虹彩占比", path: "advanced.prismShare", min: 0, max: 100, step: 1, default: 60, unit: "%" },
  { type: "range", group: "光感", label: "色散", path: "advanced.fringe", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "星点数量", path: "advanced.glintCount", min: 0, max: 60, step: 1, default: 20 },
  { type: "range", group: "光感", label: "星点大小", path: "advanced.glintSize", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "地平辉光", path: "advanced.horizonGlowStrength", min: 0, max: 200, step: 1, default: 30, unit: "%" },
  { type: "range", group: "光感", label: "颗粒", path: "advanced.grain", min: 0, max: 100, step: 1, default: 12, unit: "%" },
  { type: "range", group: "光感", label: "暗角", path: "advanced.vignette", min: 0, max: 100, step: 1, default: 15, unit: "%" },
  // 数量 / Count
  { type: "range", group: "数量", label: "雏菊数量", path: "advanced.midCount", min: 0, max: 200, step: 1, default: 110 },
  { type: "range", group: "数量", label: "散景数量", path: "advanced.bokehCount", min: 0, max: 200, step: 1, default: 90 },
  { type: "range", group: "数量", label: "草丛数量", path: "advanced.grassCount", min: 0, max: 400, step: 1, default: 320 },
  // 颜色 / Color
  { type: "color", group: "颜色", label: "背景", path: "background", default: "#000000" },
  { type: "color", group: "颜色", label: "天空顶部", path: "skyTop", default: "#3A3F8E" },
  { type: "color", group: "颜色", label: "天空地平", path: "skyHorizon", default: "#62649A" },
  { type: "color", group: "颜色", label: "脊线色", path: "advanced.crestColor", default: "#F4F0FF" },
  { type: "color", group: "颜色", label: "坡面色", path: "advanced.slopeColor", default: "#8C84C8" },
  { type: "color", group: "颜色", label: "坡面深", path: "advanced.slopeDeep", default: "#5A5290" },
  { type: "color", group: "颜色", label: "山影色", path: "advanced.hillShadow", default: "#2A2138" },
  { type: "color", group: "颜色", label: "辉光色", path: "advanced.glowColor", default: "#E8E2FF" },
  { type: "color", group: "颜色", label: "天空中段", path: "advanced.skyMid", default: "#4A5290" },
  { type: "color", group: "颜色", label: "地平辉光", path: "advanced.horizonGlow", default: "#F6E8E2" },
  { type: "color", group: "颜色", label: "花瓣色", path: "advanced.petalColor", default: "#F2EEFF" },
  { type: "color", group: "颜色", label: "花瓣尖", path: "advanced.petalTip", default: "#B8B0F0" },
  { type: "color", group: "颜色", label: "花心色", path: "advanced.flowerCore", default: "#E8502A" },
];

// ── MarbleSprite parameter set ──────────────────────────────────────────
// Defaults mirror DEFAULTS + DEFAULT_ADVANCED so the sliders start at the
// current look.
const MARBLE_CONTROLS: ControlDef[] = [
  // 外形 / Shape
  { type: "range", group: "外形", label: "整体缩放", path: "scale", min: 15, max: 135, step: 1, default: 90, unit: "%" },
  { type: "range", group: "外形", label: "精灵半径", path: "advanced.spriteSize", min: 20, max: 85, step: 0.5, default: 59.3, unit: "%" },
  { type: "range", group: "外形", label: "玻璃壁厚", path: "advanced.shell", min: 1, max: 25, step: 0.5, default: 4.5, unit: "%" },
  { type: "range", group: "外形", label: "接缝唇宽", path: "advanced.lip", min: 0, max: 20, step: 0.5, default: 6, unit: "%" },
  // 玻璃 / Glass
  { type: "range", group: "玻璃", label: "磨砂程度", path: "frost", min: 0, max: 10, step: 0.1, default: 5 },
  { type: "range", group: "玻璃", label: "接缝角度", path: "advanced.seamAngle", min: -180, max: 180, step: 1, default: 55, unit: "°" },
  { type: "range", group: "玻璃", label: "接缝俯仰", path: "advanced.seamTilt", min: 0, max: 90, step: 1, default: 64, unit: "°" },
  { type: "range", group: "玻璃", label: "接缝偏移", path: "advanced.seamOffset", min: -50, max: 50, step: 1, default: -5, unit: "%" },
  // 表情 / Expression
  {
    type: "select", group: "表情", label: "是否有眼", path: "face", default: "eyes",
    options: [{ label: "眼睛", value: "eyes" }, { label: "无脸", value: "none" }],
  },
  { type: "range", group: "表情", label: "静视·左右", path: "advanced.restX", min: -45, max: 45, step: 1, default: 12, unit: "°" },
  { type: "range", group: "表情", label: "静视·上下", path: "advanced.restY", min: -45, max: 45, step: 1, default: 10, unit: "°" },
  { type: "range", group: "表情", label: "面部倾斜", path: "advanced.roll", min: -45, max: 45, step: 1, default: -10, unit: "°" },
  { type: "range", group: "表情", label: "最大转头", path: "advanced.maxTurn", min: 5, max: 70, step: 1, default: 38, unit: "°" },
  { type: "range", group: "表情", label: "双眼间距", path: "advanced.eyeGap", min: 10, max: 90, step: 0.5, default: 45, unit: "°" },
  { type: "range", group: "表情", label: "眼睛长度", path: "advanced.eyeLength", min: 5, max: 60, step: 0.5, default: 34, unit: "°" },
  { type: "range", group: "表情", label: "眼睛宽度", path: "advanced.eyeWidth", min: 3, max: 25, step: 0.5, default: 10, unit: "°" },
  // 光感 / Light
  { type: "range", group: "光感", label: "光泽", path: "advanced.gloss", min: 0, max: 200, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "辉光", path: "advanced.glow", min: 0, max: 300, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "颗粒", path: "advanced.grain", min: 0, max: 300, step: 1, default: 100, unit: "%" },
  { type: "range", group: "光感", label: "灯光角度", path: "advanced.lightAngle", min: -180, max: 180, step: 1, default: 0, unit: "°" },
  // 互动 / Interaction
  {
    type: "select", group: "互动", label: "跟随方式", path: "follow", default: "frame",
    options: [{ label: "整页", value: "page" }, { label: "框内", value: "frame" }, { label: "关闭", value: "off" }],
  },
  { type: "range", group: "互动", label: "注视力度", path: "reach", min: 0, max: 10, step: 0.1, default: 10 },
  { type: "range", group: "互动", label: "倾斜力度", path: "lean", min: 0, max: 10, step: 0.1, default: 10 },
  { type: "range", group: "互动", label: "眨眼频率", path: "blink", min: 0, max: 10, step: 0.1, default: 10 },
  { type: "range", group: "互动", label: "漂浮幅度", path: "float", min: 0, max: 15, step: 0.1, default: 15 },
  { type: "range", group: "互动", label: "注视缓动", path: "advanced.followMs", min: 10, max: 600, step: 1, default: 90, unit: "ms" },
  { type: "range", group: "互动", label: "眨眼时长", path: "advanced.blinkMs", min: 60, max: 600, step: 5, default: 150, unit: "ms" },
  // 颜色 / Color
  { type: "color", group: "颜色", label: "背景", path: "background", default: "#000000" },
  { type: "color", group: "颜色", label: "精灵色", path: "spriteColor", default: "#1400F6" },
  { type: "color", group: "颜色", label: "眼睛色", path: "advanced.eyeColor", default: "#F3F2F8" },
];

// ── HoloCard parameter set ────────────────────────────────────────────────
// Defaults mirror the component's own defaults so the sliders start at the
// current look. Booleans (idle, shadow) use the new toggle control type.
const HOLO_CONTROLS: ControlDef[] = [
  // 图案 / Pattern
  {
    type: "select", group: "图案", label: "箔面图案", path: "preset", default: "bursts",
    options: [
      { label: "爆发", value: "bursts" },
      { label: "星点", value: "stars" },
      { label: "碎片", value: "shards" },
      { label: "星云", value: "cosmos" },
      { label: "彩虹", value: "rainbow" },
      { label: "漩涡", value: "swirl" },
      { label: "闪粉", value: "glitter" },
      { label: "鎏金", value: "gold" },
    ],
  },
  { type: "range", group: "图案", label: "光泽强度", path: "intensity", min: 0, max: 1, step: 0.05, default: 0.85 },
  { type: "range", group: "图案", label: "图案缩放", path: "scale", min: 0.25, max: 4, step: 0.05, default: 1 },
  { type: "range", group: "图案", label: "边缘闪点", path: "edgeSparkle", min: 0, max: 1, step: 0.05, default: 0.8 },
  { type: "range", group: "图案", label: "边框宽度", path: "frame", min: 0, max: 20, step: 0.5, default: 4, unit: "px" },
  { type: "range", group: "图案", label: "反光强度", path: "glare", min: 0, max: 1, step: 0.05, default: 0.5 },
  // 形态 / Shape
  { type: "range", group: "形态", label: "卡片宽度", path: "width", min: 200, max: 440, step: 10, default: 320, unit: "px" },
  { type: "range", group: "形态", label: "圆角", path: "radius", min: 0, max: 40, step: 1, default: 14, unit: "px" },
  { type: "range", group: "形态", label: "最大倾斜", path: "tiltMax", min: 0, max: 45, step: 1, default: 14, unit: "°" },
  { type: "range", group: "形态", label: "悬停缩放", path: "hoverScale", min: 0.8, max: 1.3, step: 0.01, default: 1.04 },
  // 颜色 / Color
  { type: "color", group: "颜色", label: "箔面色", path: "foilColor", default: "#e2e6ec" },
  // 行为 / Behavior
  { type: "toggle", group: "行为", label: "待机漂浮", path: "idle", default: true },
  { type: "toggle", group: "行为", label: "投影", path: "shadow", default: true },
];

// ── TechText parameter set ─────────────────────────────────────────────────
// Defaults mirror the component's own props so the sliders start at the
// current look. Light color defaults so the canvas text reads on the dark
// preview frame.
const TECHTEXT_CONTROLS: ControlDef[] = [
  // 文字 / Text
  {
    type: "select", group: "文字", label: "字体", path: "fontFamily", default: "",
    options: [
      { label: "默认", value: "" },
      { label: "无衬线", value: "sans-serif" },
      { label: "衬线", value: "serif" },
      { label: "等宽", value: "monospace" },
    ],
  },
  { type: "range", group: "文字", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 600 },
  { type: "range", group: "文字", label: "字号基准", path: "fontSize", min: 60, max: 300, step: 10, default: 150 },
  { type: "range", group: "文字", label: "字间距", path: "letterSpacing", min: -0.2, max: 0.2, step: 0.01, default: -0.05 },
  {
    type: "select", group: "文字", label: "对齐", path: "align", default: "center",
    options: [
      { label: "居左", value: "left" },
      { label: "居中", value: "center" },
      { label: "居右", value: "right" },
    ],
  },
  { type: "color", group: "文字", label: "文字色", path: "color", default: "#EDEAFF" },
  { type: "color", group: "文字", label: "强调色", path: "accentColor", default: "#8C7CFF" },
  // 描边 / Stroke
  { type: "range", group: "描边", label: "描边宽度", path: "strokeWidth", min: 0.5, max: 6, step: 0.5, default: 1.5 },
  {
    type: "select", group: "描边", label: "线型", path: "lineStyle", default: "dashed",
    options: [
      { label: "虚线", value: "dashed" },
      { label: "实线", value: "solid" },
    ],
  },
  { type: "range", group: "描边", label: "虚线长", path: "dashLength", min: 1, max: 20, step: 1, default: 4 },
  { type: "range", group: "描边", label: "虚线间距", path: "dashGap", min: 0, max: 20, step: 1, default: 2 },
  { type: "range", group: "描边", label: "柔化", path: "softness", min: 0, max: 1, step: 0.05, default: 0.7 },
  // 揭示 / Reveal
  {
    type: "select", group: "揭示", label: "揭示方式", path: "reveal", default: "letter",
    options: [
      { label: "逐字", value: "letter" },
      { label: "区域", value: "area" },
      { label: "关闭", value: "off" },
    ],
  },
  { type: "range", group: "揭示", label: "揭示半径", path: "reach", min: 50, max: 400, step: 10, default: 200, unit: "px" },
  // 装饰 / Decor
  { type: "range", group: "装饰", label: "装饰点", path: "specks", min: 0, max: 60, step: 1, default: 15 },
  { type: "toggle", group: "装饰", label: "标注尺寸", path: "labels", default: true },
  { type: "toggle", group: "装饰", label: "选中框", path: "selection", default: true },
  { type: "toggle", group: "装饰", label: "辅助线", path: "guides", default: false },
  // 互动 / Interaction
  { type: "toggle", group: "互动", label: "可拖拽", path: "draggable", default: true },
  { type: "toggle", group: "互动", label: "点击弹动", path: "clickKick", default: true },
  { type: "range", group: "互动", label: "回弹", path: "bounce", min: 0, max: 0.95, step: 0.05, default: 0.4 },
  { type: "toggle", group: "互动", label: "自动巡游", path: "sweep", default: true },
  { type: "range", group: "互动", label: "巡游速度", path: "speed", min: 0, max: 3, step: 0.1, default: 1 },
  // 入场 / Intro
  {
    type: "select", group: "入场", label: "入场动画", path: "intro", default: "none",
    options: [
      { label: "无", value: "none" },
      { label: "打字", value: "type" },
      { label: "拼装", value: "assemble" },
      { label: "度量", value: "metrics" },
    ],
  },
  { type: "range", group: "入场", label: "动画时长", path: "introDuration", min: 0.5, max: 6, step: 0.5, default: 2, unit: "s" },
];

// ── TextLoop parameter set ─────────────────────────────────────────────────
// Defaults mirror the component's own props so the sliders start at the
// current look. GSAP drives the loop; ribbon defaults to a violet stroke with
// white text, which reads well on the dark preview frame.
const TEXTLOOP_CONTROLS: ControlDef[] = [
  // 文字 / Text
  { type: "range", group: "文字", label: "字号", path: "fontSize", min: 20, max: 120, step: 2, default: 46 },
  { type: "range", group: "文字", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 800 },
  { type: "range", group: "文字", label: "字间距", path: "letterSpacing", min: -5, max: 20, step: 0.5, default: 2 },
  { type: "toggle", group: "文字", label: "大写", path: "uppercase", default: true },
  // 路径 / Path
  {
    type: "select", group: "路径", label: "形状", path: "shape", default: "wave",
    options: [
      { label: "波浪", value: "wave" },
      { label: "圆环", value: "circle" },
      { label: "无穷", value: "infinity" },
      { label: "拱形", value: "arch" },
      { label: "直线", value: "line" },
    ],
  },
  { type: "range", group: "路径", label: "弯曲度", path: "curviness", min: 0, max: 200, step: 1, default: 90 },
  { type: "range", group: "路径", label: "倾斜", path: "tilt", min: -45, max: 45, step: 1, default: 0, unit: "°" },
  // 运动 / Motion
  { type: "range", group: "运动", label: "速度", path: "speed", min: 0, max: 400, step: 5, default: 90 },
  {
    type: "select", group: "运动", label: "方向", path: "direction", default: "forward",
    options: [
      { label: "正向", value: "forward" },
      { label: "反向", value: "reverse" },
    ],
  },
  { type: "toggle", group: "运动", label: "悬停暂停", path: "pauseOnHover", default: true },
  { type: "toggle", group: "运动", label: "可拖拽", path: "draggable", default: false },
  { type: "range", group: "运动", label: "滚动加速", path: "scrollBoost", min: 0, max: 500, step: 10, default: 0 },
  // 丝带 / Ribbon
  { type: "toggle", group: "丝带", label: "显示丝带", path: "ribbon", default: true },
  { type: "color", group: "丝带", label: "丝带色", path: "ribbonColor", default: "#5227FF" },
  { type: "range", group: "丝带", label: "丝带宽度", path: "ribbonWidth", min: 10, max: 200, step: 2, default: 86 },
  // 特效 / Effects
  { type: "toggle", group: "特效", label: "交叉带", path: "cross", default: false },
  { type: "color", group: "特效", label: "交叉带色", path: "crossColor", default: "#BDAFFF" },
  { type: "range", group: "特效", label: "交叉角度", path: "crossAngle", min: 0, max: 45, step: 1, default: 16, unit: "°" },
  { type: "range", group: "特效", label: "边缘渐隐", path: "edgeFade", min: 0, max: 1, step: 0.05, default: 0 },
  { type: "toggle", group: "特效", label: "描边字", path: "outline", default: false },
  { type: "range", group: "特效", label: "描边粗细", path: "outlineWidth", min: 0.5, max: 6, step: 0.5, default: 1.5 },
];

// ── ParticleText parameter set ──────────────────────────────────────────────
// Defaults mirror the component's own props so the sliders start at the current
// look. The canvas fills the frame; on the dark preview background the particle
// gradient runs from a light lavender base to an orange highlight.
const PARTICLE_CONTROLS: ControlDef[] = [
  // 文字 / Text
  { type: "range", group: "文字", label: "字号", path: "fontSize", min: 40, max: 220, step: 5, default: 120 },
  { type: "range", group: "文字", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 800 },
  { type: "color", group: "文字", label: "粒子色", path: "color", default: "#EDEAFF" },
  { type: "color", group: "文字", label: "高亮色", path: "highlightColor", default: "#ff5a36" },
  {
    type: "select", group: "文字", label: "高亮模式", path: "highlightMode", default: "motion",
    options: [
      { label: "动态热力", value: "motion" },
      { label: "位置渐变", value: "gradient" },
    ],
  },
  // 粒子 / Particles
  { type: "range", group: "粒子", label: "粒子大小", path: "particleSize", min: 1, max: 10, step: 0.5, default: 2 },
  { type: "range", group: "粒子", label: "密度", path: "density", min: 1, max: 12, step: 1, default: 4 },
  {
    type: "select", group: "粒子", label: "形状", path: "shape", default: "circle",
    options: [
      { label: "圆点", value: "circle" },
      { label: "方块", value: "square" },
      { label: "线条", value: "line" },
    ],
  },
  { type: "toggle", group: "粒子", label: "辉光", path: "glow", default: true },
  // 入场 / Intro
  {
    type: "select", group: "入场", label: "入场动画", path: "intro", default: "gather",
    options: [
      { label: "聚拢", value: "gather" },
      { label: "下落", value: "rain" },
      { label: "螺旋", value: "spiral" },
      { label: "扫描", value: "scan" },
    ],
  },
  { type: "range", group: "入场", label: "扩散范围", path: "scatter", min: 0, max: 500, step: 10, default: 180 },
  { type: "range", group: "入场", label: "聚拢时长", path: "gatherDuration", min: 400, max: 4000, step: 100, default: 1600, unit: "ms" },
  { type: "range", group: "入场", label: "错峰间隔", path: "stagger", min: 0, max: 1200, step: 20, default: 420, unit: "ms" },
  // 互动 / Interaction
  {
    type: "select", group: "互动", label: "触发方式", path: "trigger", default: "mount",
    options: [
      { label: "挂载即放", value: "mount" },
      { label: "悬停则放", value: "hover" },
      { label: "点击则放", value: "click" },
    ],
  },
  { type: "toggle", group: "互动", label: "点击爆裂", path: "clickBurst", default: true },
  { type: "range", group: "互动", label: "爆裂强度", path: "burstStrength", min: 0, max: 5, step: 0.1, default: 1 },
  { type: "range", group: "互动", label: "指针排斥", path: "pointerRepel", min: 0, max: 200, step: 5, default: 40 },
  { type: "range", group: "互动", label: "排斥半径", path: "repelRadius", min: 20, max: 400, step: 10, default: 120 },
  { type: "range", group: "互动", label: "待机漂移", path: "idleDrift", min: 0, max: 3, step: 0.1, default: 0.7 },
];

interface ShowcaseEntry {
  id: string;
  index: string;
  name: string;
  tag: string;
  description: string;
  fileName: string;
  code: string;
  Preview: ComponentType<Record<string, unknown>>;
  previewProps?: Record<string, unknown>;
  hint?: string;
  controls?: ControlDef[];
  presetAdvanced?: Record<string, unknown>;
}

// ── SplitFlapText parameter set ─────────────────────────────────────────────
// Defaults mirror the component's own props so the sliders start at the current
// look. The board uses a dark tile with light text, which reads on the dark
// preview frame; it auto-cycles through its three phrases.
const SPLITFLAP_CONTROLS: ControlDef[] = [
  // 文字 / Text
  {
    type: "select", group: "文字", label: "字符集", path: "charset", default: "alphanumeric",
    options: [
      { label: "字母数字", value: "alphanumeric" },
      { label: "仅字母", value: "alpha" },
      { label: "仅数字", value: "numeric" },
    ],
  },
  { type: "range", group: "文字", label: "每字翻转次数", path: "flipsPerChar", min: 0, max: 20, step: 1, default: 8 },
  { type: "range", group: "文字", label: "字号", path: "fontSize", min: 20, max: 80, step: 2, default: 38 },
  {
    type: "select", group: "文字", label: "对齐", path: "align", default: "left",
    options: [
      { label: "居左", value: "left" },
      { label: "居中", value: "center" },
      { label: "居右", value: "right" },
    ],
  },
  {
    type: "select", group: "文字", label: "翻动顺序", path: "order", default: "left",
    options: [
      { label: "从左到右", value: "left" },
      { label: "从右到左", value: "right" },
      { label: "从中间", value: "center" },
      { label: "随机", value: "random" },
    ],
  },
  {
    type: "select", group: "文字", label: "卡片样式", path: "tileStyle", default: "board",
    options: [
      { label: "立体牌", value: "board" },
      { label: "极简线", value: "minimal" },
    ],
  },
  // 运动 / Motion
  { type: "range", group: "运动", label: "翻转时长", path: "flipDuration", min: 0.04, max: 0.5, step: 0.01, default: 0.12, unit: "s" },
  { type: "range", group: "运动", label: "错峰间隔", path: "stagger", min: 0, max: 0.3, step: 0.01, default: 0.06, unit: "s" },
  { type: "range", group: "运动", label: "循环间隔", path: "cycleDelay", min: 400, max: 6000, step: 100, default: 2400, unit: "ms" },
  { type: "toggle", group: "运动", label: "循环翻页", path: "loop", default: true },
  { type: "toggle", group: "运动", label: "入场翻动", path: "intro", default: true },
  // 外观 / Appearance
  { type: "color", group: "外观", label: "卡片色", path: "tileColor", default: "#111827" },
  { type: "color", group: "外观", label: "文字色", path: "textColor", default: "#f8fafc" },
  { type: "range", group: "外观", label: "圆角", path: "tileRadius", min: 0, max: 24, step: 1, default: 8, unit: "px" },
  { type: "range", group: "外观", label: "卡片间距", path: "gap", min: 0, max: 16, step: 1, default: 6, unit: "px" },
  { type: "range", group: "外观", label: "字符宽度", path: "padTo", min: 4, max: 20, step: 1, default: 12 },
  { type: "range", group: "外观", label: "立体深度", path: "depth", min: 0, max: 1, step: 0.05, default: 0.5 },
  { type: "range", group: "外观", label: "反光强度", path: "glare", min: 0, max: 1, step: 0.05, default: 0 },
];

// ── WarpText parameter set ───────────────────────────────────────────────────
// WebGL (ogl) liquid-text shader. Same flat path → prop mapping. `text` is left
// at the component default; `color` defaults to a light ink so it reads on the
// dark preview frame (the shader uses luminance to decide the backdrop blend).
const WARP_CONTROLS: ControlDef[] = [
  // 扭曲 / Warp
  { type: "range", group: "扭曲", label: "扭曲强度", path: "warpStrength", min: 0, max: 0.3, step: 0.005, default: 0.08 },
  { type: "range", group: "扭曲", label: "扭曲尺度", path: "warpScale", min: 0.2, max: 4, step: 0.1, default: 1.7 },
  { type: "range", group: "扭曲", label: "流动速度", path: "speed", min: 0, max: 2, step: 0.05, default: 0.55 },
  { type: "range", group: "扭曲", label: "折射", path: "refraction", min: 0, max: 0.08, step: 0.002, default: 0.018 },
  { type: "range", group: "扭曲", label: "色散", path: "chromatic", min: 0, max: 1, step: 0.05, default: 0 },
  // 指针交互 / Pointer
  { type: "range", group: "指针交互", label: "影响半径", path: "pointerInfluence", min: 0.1, max: 1, step: 0.02, default: 0.42 },
  { type: "range", group: "指针交互", label: "指针力度", path: "pointerStrength", min: 0, max: 1, step: 0.02, default: 0.38 },
  {
    type: "select", group: "指针交互", label: "透镜", path: "lens", default: "bulge",
    options: [
      { label: "凸起", value: "bulge" },
      { label: "凹陷", value: "pinch" },
      { label: "漩涡", value: "swirl" },
    ],
  },
  { type: "toggle", group: "指针交互", label: "悬停涟漪", path: "ripple", default: true },
  { type: "toggle", group: "指针交互", label: "点击涟漪", path: "clickRipple", default: true },
  { type: "range", group: "指针交互", label: "待机漂移", path: "idleDrift", min: 0, max: 1, step: 0.05, default: 0.2 },
  // 文字与入场 / Text
  { type: "color", group: "文字", label: "文字色", path: "color", default: "#e6e9ff" },
  { type: "toggle", group: "文字", label: "入场动画", path: "intro", default: true },
];

// ── DepthText parameter set ──────────────────────────────────────────────────
// Zero-dependency DOM + CSS 3D extruded text. Flat path → prop mapping; `text`
// is pinned via previewProps (no text-input control type exists). `faceColor`
// defaults to a light ink so it reads on the dark preview frame; `fontWeight`
// is passed as a string ("900") which the component feeds straight into CSS.
const DEPTH_CONTROLS: ControlDef[] = [
  // 文字与深度 / Depth
  { type: "range", group: "文字与深度", label: "层叠数", path: "layers", min: 2, max: 64, step: 1, default: 34 },
  { type: "range", group: "文字与深度", label: "厚度", path: "depth", min: 0, max: 12, step: 0.2, default: 2.4, unit: "px" },
  { type: "color", group: "文字与深度", label: "正面色", path: "faceColor", default: "#f3f0ff" },
  { type: "color", group: "文字与深度", label: "深度色", path: "depthColor", default: "#7c3aed" },
  { type: "toggle", group: "文字与深度", label: "渐变深度", path: "gradientDepth", default: false },
  {
    type: "select", group: "文字与深度", label: "字重", path: "fontWeight", default: "900",
    options: [
      { label: "常规", value: "400" },
      { label: "中粗", value: "700" },
      { label: "特粗", value: "900" },
    ],
  },
  // 运动与交互 / Motion
  { type: "range", group: "运动与交互", label: "倾斜角度", path: "tilt", min: 0, max: 12, step: 0.5, default: 7.5, unit: "°" },
  { type: "toggle", group: "运动与交互", label: "指针跟随", path: "pointerTracking", default: true },
  { type: "range", group: "运动与交互", label: "跟随平滑", path: "smoothing", min: 0.02, max: 0.35, step: 0.01, default: 0.14 },
  { type: "toggle", group: "运动与交互", label: "自动环绕", path: "autoOrbit", default: true },
  { type: "range", group: "运动与交互", label: "环绕速度", path: "orbitSpeed", min: 0, max: 2, step: 0.05, default: 0.35 },
  { type: "range", group: "运动与交互", label: "悬停推入", path: "hoverPush", min: 0, max: 1, step: 0.05, default: 0 },
  { type: "toggle", group: "运动与交互", label: "漂浮", path: "float", default: false },
  // 视角与外观 / View
  { type: "range", group: "视角与外观", label: "透视距离", path: "perspective", min: 300, max: 2000, step: 50, default: 900 },
  { type: "toggle", group: "视角与外观", label: "投影", path: "shadow", default: true },
  { type: "toggle", group: "视角与外观", label: "描边轮廓", path: "outline", default: false },
  { type: "toggle", group: "视角与外观", label: "入场动画", path: "intro", default: true },
];

// ── One lab entry (isolates slider state so only it re-renders) ───────────────
function LabEntry({
  entry,
  isActive,
  onActivate,
}: {
  entry: ShowcaseEntry;
  isActive: boolean;
  onActivate: () => void;
}) {
  const controls = entry.controls ?? [];
  const groups = useMemo(() => groupControls(controls), [controls]);
  const [values, setValues] = useState<Record<string, number | string | boolean>>(() => {
    const v: Record<string, number | string | boolean> = {};
    for (const c of controls) v[c.path] = c.default;
    return v;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>(() => groups[0]?.name ?? "");

  const dynamicProps = useMemo(
    () => buildProps(controls, values, entry.presetAdvanced),
    [controls, values, entry.presetAdvanced]
  );
  const previewProps = useMemo(
    () => ({ ...(entry.previewProps ?? {}), ...dynamicProps }),
    [entry.previewProps, dynamicProps]
  );
  const Preview = entry.Preview;

  return (
    <section
      id={`lab-${entry.id}`}
      className={`lab-entry${isActive ? " is-active" : ""}`}
      onMouseEnter={onActivate}
    >
      <div className="lab-entry__head">
        <span className="lab-entry__no">{entry.index}</span>
        <div className="lab-entry__titles">
          <h2>{entry.name}</h2>
          <p>{entry.description}</p>
        </div>
        <span className="lab-entry__tag">{entry.tag}</span>
      </div>

      <div className="lab-entry__body">
        <div className="lab-preview">
          <div className="lab-preview__frame">
            <PreviewBoundary name={entry.name}>
              <Preview {...previewProps} />
            </PreviewBoundary>
          </div>
          <span className="lab-preview__hint">{entry.hint ?? "移动鼠标，拨动光"}</span>
        </div>

        <div className="lab-code">
          <CodeBlock code={entry.code} fileName={entry.fileName} />
        </div>
      </div>

      {controls.length > 0 && (
        <div className={`lab-controls${collapsed ? " is-collapsed" : ""}`}>
          <div className="lab-controls__head">
            <button
              type="button"
              className="lab-controls__toggle"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((c) => !c)}
            >
              <span className="lab-controls__chevron" aria-hidden="true">
                {collapsed ? "▸" : "▾"}
              </span>
              <span className="lab-controls__title">参数调节</span>
            </button>
            <button
              type="button"
              className="lab-controls__reset"
              onClick={() => {
                const v: Record<string, number | string | boolean> = {};
                for (const c of controls) v[c.path] = c.default;
                setValues(v);
              }}
            >
              重置
            </button>
          </div>
          {!collapsed && (
            <>
              <div className="lab-controls__tabs" role="tablist" aria-label="参数分组">
                {groups.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    role="tab"
                    aria-selected={g.name === activeGroup}
                    className={`lab-controls__tab${g.name === activeGroup ? " is-active" : ""}`}
                    onClick={() => setActiveGroup(g.name)}
                  >
                    {g.name}
                    <span className="lab-controls__tab-count">{g.items.length}</span>
                  </button>
                ))}
              </div>
              <div className="lab-controls__grid" role="tabpanel">
                {(groups.find((g) => g.name === activeGroup) ?? groups[0])?.items.map(
                  (c) => (
                    <div className="lab-control" key={c.path}>
                      <div className="lab-control__label">
                        <span>{c.label}</span>
                        {c.type === "range" && (
                          <span className="lab-control__val">
                            {String(values[c.path])}
                            {c.unit ?? ""}
                          </span>
                        )}
                        {c.type === "toggle" && (
                          <span className="lab-control__val">
                            {values[c.path] ? "开" : "关"}
                          </span>
                        )}
                      </div>
                      {c.type === "range" ? (
                        <input
                          className="lab-control__range"
                          type="range"
                          min={c.min}
                          max={c.max}
                          step={c.step}
                          value={values[c.path] as number}
                          onChange={(e) =>
                            setValues((s) => ({ ...s, [c.path]: Number(e.target.value) }))
                          }
                        />
                      ) : c.type === "color" ? (
                        <input
                          className="lab-control__color"
                          type="color"
                          value={values[c.path] as string}
                          onChange={(e) =>
                            setValues((s) => ({ ...s, [c.path]: e.target.value }))
                          }
                        />
                      ) : c.type === "toggle" ? (
                        <label className="lab-control__toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(values[c.path])}
                            onChange={(e) =>
                              setValues((s) => ({ ...s, [c.path]: e.target.checked }))
                            }
                          />
                          <span className="lab-control__toggle-track" aria-hidden="true">
                            <span className="lab-control__toggle-thumb" />
                          </span>
                        </label>
                      ) : (
                        <select
                          className="lab-control__select"
                          value={values[c.path] as string}
                          onChange={(e) =>
                            setValues((s) => ({ ...s, [c.path]: e.target.value }))
                          }
                        >
                          {c.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

// ── EchoText parameter set ──────────────────────────────────────────────────
// Zero-dependency DOM motion-echo text. Flat path → prop mapping; `text` is
// pinned via previewProps (no text-input control type). `color`/`tint` default
// to light inks so the front word and its echoes read on the dark frame; the
// component blends `tint` into `currentColor`, so `color` must be a concrete
// value (not "currentColor"). `echoColors` (a 2-tuple) is intentionally not
// exposed — it would need a paired control the framework doesn't have.
const ECHO_CONTROLS: ControlDef[] = [
  // 拖尾与外观 / Echo
  { type: "range", group: "拖尾与外观", label: "拖尾数", path: "echoes", min: 0, max: 24, step: 1, default: 12 },
  { type: "range", group: "拖尾与外观", label: "拖尾长度", path: "offset", min: 0, max: 120, step: 2, default: 36, unit: "px" },
  {
    type: "select", group: "拖尾与外观", label: "方向", path: "direction", default: "right",
    options: [
      { label: "右", value: "right" },
      { label: "左", value: "left" },
      { label: "上", value: "up" },
      { label: "下", value: "down" },
      { label: "斜", value: "diagonal" },
    ],
  },
  {
    type: "select", group: "拖尾与外观", label: "字重", path: "fontWeight", default: "800",
    options: [
      { label: "常规", value: "400" },
      { label: "中粗", value: "700" },
      { label: "特粗", value: "800" },
      { label: "黑体", value: "900" },
    ],
  },
  {
    type: "select", group: "拖尾与外观", label: "描边", path: "echoStyle", default: "solid",
    options: [
      { label: "实心", value: "solid" },
      { label: "描边", value: "outline" },
    ],
  },
  { type: "range", group: "拖尾与外观", label: "缩放差", path: "echoScale", min: 0.25, max: 2.5, step: 0.05, default: 1 },
  // 颜色 / Color
  { type: "color", group: "颜色", label: "文字色", path: "color", default: "#f3f0ff" },
  { type: "color", group: "颜色", label: "拖尾色", path: "tint", default: "#7dd3fc" },
  { type: "range", group: "颜色", label: "衰减", path: "fade", min: 0.1, max: 0.95, step: 0.01, default: 0.72 },
  { type: "range", group: "颜色", label: "模糊", path: "blur", min: 0, max: 16, step: 0.5, default: 3, unit: "px" },
  // 运动与交互 / Motion
  {
    type: "select", group: "运动与交互", label: "动画模式", path: "mode", default: "both",
    options: [
      { label: "入场", value: "entrance" },
      { label: "指针", value: "pointer" },
      { label: "两者", value: "both" },
    ],
  },
  {
    type: "select", group: "运动与交互", label: "拖尾触发", path: "trail", default: "pointer",
    options: [
      { label: "指针", value: "pointer" },
      { label: "自动漂移", value: "auto" },
      { label: "滚动", value: "scroll" },
    ],
  },
  { type: "range", group: "运动与交互", label: "拖尾延迟", path: "lag", min: 0.02, max: 0.5, step: 0.01, default: 0.24 },
  {
    type: "select", group: "运动与交互", label: "缓动", path: "ease", default: "ease-out",
    options: [
      { label: "线性", value: "linear" },
      { label: "缓出", value: "ease-out" },
      { label: "缓入缓出", value: "ease-in-out" },
      { label: "干脆", value: "snappy" },
    ],
  },
  { type: "range", group: "运动与交互", label: "入场时长", path: "duration", min: 0, max: 3000, step: 100, default: 900, unit: "ms" },
  { type: "range", group: "运动与交互", label: "指针半径", path: "cursorRadius", min: 40, max: 1200, step: 20, default: 320, unit: "px" },
  { type: "toggle", group: "运动与交互", label: "点击爆发", path: "clickBurst", default: true },
];

// ── SplitText parameter set ──────────────────────────────────────────────────
// GSAP (ScrollTrigger + SplitText + useGSAP) per-character reveal. Flat path →
// prop mapping; `text` is required and pinned via previewProps. `from`/`to` are
// arbitrary TweenVars objects the framework can't express, so `effect` (which
// supplies a matching from/to pair + ease) is the main motion knob. `effect`
// drives its own built-in ease, but `ease` is still exposed as a named curve.
const SPLITTEXT_CONTROLS: ControlDef[] = [
  // 拆分与入场 / Split & Entrance
  {
    type: "select", group: "拆分与入场", label: "拆分粒度", path: "splitType", default: "chars",
    options: [
      { label: "字符", value: "chars" },
      { label: "单词", value: "words" },
      { label: "行", value: "lines" },
      { label: "词+字", value: "words, chars" },
    ],
  },
  {
    type: "select", group: "拆分与入场", label: "入场特效", path: "effect", default: "rise",
    options: [
      { label: "升起", value: "rise" },
      { label: "淡入", value: "fade" },
      { label: "模糊", value: "blur" },
      { label: "翻转", value: "flip" },
      { label: "弹出", value: "pop" },
      { label: "斜切", value: "skew" },
      { label: "波浪", value: "wave" },
    ],
  },
  {
    type: "select", group: "拆分与入场", label: "错峰起点", path: "staggerFrom", default: "start",
    options: [
      { label: "从头", value: "start" },
      { label: "居中", value: "center" },
      { label: "从尾", value: "end" },
      { label: "两端", value: "edges" },
      { label: "随机", value: "random" },
    ],
  },
  { type: "range", group: "拆分与入场", label: "逐字间隔", path: "delay", min: 0, max: 200, step: 5, default: 50, unit: "ms" },
  { type: "range", group: "拆分与入场", label: "时长", path: "duration", min: 0.2, max: 3, step: 0.05, default: 1.25, unit: "s" },
  { type: "range", group: "拆分与入场", label: "触发阈值", path: "threshold", min: 0, max: 1, step: 0.05, default: 0.1 },
  { type: "toggle", group: "拆分与入场", label: "遮罩裁切", path: "mask", default: false },
  // 触发与循环 / Trigger
  {
    type: "select", group: "触发与循环", label: "触发方式", path: "trigger", default: "view",
    options: [
      { label: "入场可见", value: "view" },
      { label: "加载即播", value: "load" },
      { label: "悬停循环", value: "hover" },
      { label: "点击循环", value: "click" },
    ],
  },
  { type: "toggle", group: "触发与循环", label: "循环", path: "loop", default: false },
  { type: "range", group: "触发与循环", label: "循环间隔", path: "loopDelay", min: 0, max: 5, step: 0.25, default: 1.5, unit: "s" },
  {
    type: "select", group: "触发与循环", label: "悬停互动", path: "hoverEffect", default: "none",
    options: [
      { label: "无", value: "none" },
      { label: "抬升", value: "lift" },
      { label: "波纹", value: "wave" },
    ],
  },
  // 样式 / Style
  {
    type: "select", group: "样式", label: "对齐", path: "textAlign", default: "center",
    options: [
      { label: "左", value: "left" },
      { label: "中", value: "center" },
      { label: "右", value: "right" },
    ],
  },
  {
    type: "select", group: "样式", label: "标签", path: "tag", default: "p",
    options: [
      { label: "p", value: "p" },
      { label: "h1", value: "h1" },
      { label: "h2", value: "h2" },
      { label: "h3", value: "h3" },
      { label: "span", value: "span" },
    ],
  },
  { type: "color", group: "样式", label: "文字色", path: "color", default: "#f3f0ff" },
  { type: "color", group: "样式", label: "强调色", path: "accentColor", default: "#fbbf24" },
  {
    type: "select", group: "样式", label: "缓动", path: "ease", default: "power3.out",
    options: [
      { label: "power3.out", value: "power3.out" },
      { label: "power2.inOut", value: "power2.inOut" },
      { label: "power2.out", value: "power2.out" },
      { label: "expo.out", value: "expo.out" },
      { label: "back.out", value: "back.out(1.6)" },
      { label: "elastic", value: "elastic.out(1, 0.5)" },
    ],
  },
];

// ── BlurText parameter set ────────────────────────────────────────────────────
// Framer Motion (motion/react) staggered blur/scale reveal. Flat path → prop
// mapping; `text` is pinned via previewProps (no text-input control type exists).
// `className` "blur-text-lab" gives the preview a hero-scale size (the component
// inherits font-size and has no style prop of its own). `color`/`fromColor`
// default to light ink + accent tint so they read on the dark preview frame.
const BLUR_CONTROLS: ControlDef[] = [
  // 拆分与方向 / Split & Direction
  {
    type: "select", group: "拆分与方向", label: "拆分粒度", path: "animateBy", default: "words",
    options: [
      { label: "按词", value: "words" },
      { label: "按字", value: "letters" },
    ],
  },
  {
    type: "select", group: "拆分与方向", label: "入场方向", path: "direction", default: "top",
    options: [
      { label: "上", value: "top" },
      { label: "下", value: "bottom" },
      { label: "左", value: "left" },
      { label: "右", value: "right" },
    ],
  },
  {
    type: "select", group: "拆分与方向", label: "错峰起点", path: "staggerFrom", default: "start",
    options: [
      { label: "从头", value: "start" },
      { label: "居中", value: "center" },
      { label: "从尾", value: "end" },
      { label: "随机", value: "random" },
    ],
  },
  // 特效参数 / Effect
  {
    type: "select", group: "特效参数", label: "特效", path: "effect", default: "blur",
    options: [
      { label: "模糊浮现", value: "blur" },
      { label: "缩放弹入", value: "zoom" },
      { label: "倾斜翻入", value: "tilt" },
      { label: "聚焦清晰", value: "focus" },
      { label: "漂移滑入", value: "drift" },
    ],
  },
  { type: "range", group: "特效参数", label: "模糊量", path: "blur", min: 0, max: 30, step: 1, default: 10, unit: "px" },
  { type: "range", group: "特效参数", label: "位移距离", path: "distance", min: 0, max: 120, step: 2, default: 50, unit: "px" },
  { type: "range", group: "特效参数", label: "单步时长", path: "stepDuration", min: 0.1, max: 1, step: 0.05, default: 0.35, unit: "s" },
  { type: "range", group: "特效参数", label: "错峰间隔", path: "delay", min: 0, max: 800, step: 20, default: 200, unit: "ms" },
  { type: "range", group: "特效参数", label: "触发阈值", path: "threshold", min: 0, max: 1, step: 0.05, default: 0.1 },
  // 触发与配色 / Trigger & Color
  {
    type: "select", group: "触发与配色", label: "触发方式", path: "trigger", default: "view",
    options: [
      { label: "滚动入场", value: "view" },
      { label: "加载即播", value: "load" },
      { label: "悬停触发", value: "hover" },
      { label: "点击触发", value: "click" },
    ],
  },
  { type: "toggle", group: "触发与配色", label: "循环", path: "loop", default: false },
  { type: "range", group: "触发与配色", label: "循环间隔", path: "loopDelay", min: 0.5, max: 5, step: 0.25, default: 2, unit: "s" },
  { type: "color", group: "触发与配色", label: "文字色", path: "color", default: "#eef1ff" },
  { type: "color", group: "触发与配色", label: "入场染色", path: "fromColor", default: "#7c3aed" },
  { type: "toggle", group: "触发与配色", label: "悬停聚焦", path: "focusOnHover", default: false },
];

// ── CircularText parameter set ────────────────────────────────────────────────
// Framer Motion (motion/react) rotating circular text. Flat path → prop mapping;
// `text` is required and pinned via previewProps (no text-input control type).
// Root `<div>` carries its own width/height (size), so the preview frame's flex
// centers it as a fixed-size block (no width:100% needed). `color`/`ringColor`
// default to light ink + accent so they read on the dark preview frame.
const CIRCULAR_CONTROLS: ControlDef[] = [
  // 旋转与运动 / Spin & Motion
  { type: "range", group: "旋转与运动", label: "旋转一圈时长", path: "spinDuration", min: 2, max: 60, step: 1, default: 20, unit: "s" },
  {
    type: "select", group: "旋转与运动", label: "方向", path: "direction", default: "clockwise",
    options: [
      { label: "顺时针", value: "clockwise" },
      { label: "逆时针", value: "counterclockwise" },
    ],
  },
  {
    type: "select", group: "旋转与运动", label: "悬停反应", path: "onHover", default: "speedUp",
    options: [
      { label: "加速", value: "speedUp" },
      { label: "减速", value: "slowDown" },
      { label: "暂停", value: "pause" },
      { label: "疯转", value: "goBonkers" },
    ],
  },
  // 文字与外观 / Text & Appearance
  { type: "range", group: "文字与外观", label: "字号", path: "fontSize", min: 12, max: 40, step: 1, default: 24, unit: "px" },
  {
    type: "select", group: "文字与外观", label: "字重", path: "fontWeight", default: "900",
    options: [
      { label: "常规", value: "400" },
      { label: "中粗", value: "700" },
      { label: "特粗", value: "900" },
    ],
  },
  { type: "range", group: "文字与外观", label: "字间距", path: "letterSpacing", min: 0, max: 0.4, step: 0.02, default: 0 },
  { type: "color", group: "文字与外观", label: "文字色", path: "color", default: "#eef1ff" },
  { type: "range", group: "文字与外观", label: "起始角度", path: "startAngle", min: 0, max: 360, step: 5, default: 0, unit: "°" },
  { type: "range", group: "文字与外观", label: "重复圈数", path: "repeat", min: 1, max: 4, step: 1, default: 1 },
  { type: "toggle", group: "文字与外观", label: "铺满整圈", path: "fill", default: true },
  // 交互与装饰 / Interaction & Deco
  { type: "range", group: "交互与装饰", label: "直径", path: "size", min: 140, max: 320, step: 10, default: 220, unit: "px" },
  { type: "range", group: "交互与装饰", label: "静态倾斜", path: "tilt", min: 0, max: 45, step: 1, default: 0, unit: "°" },
  { type: "range", group: "交互与装饰", label: "悬停倾斜", path: "hoverTilt", min: 0, max: 30, step: 1, default: 0, unit: "°" },
  { type: "toggle", group: "交互与装饰", label: "可拖拽", path: "draggable", default: false },
  { type: "toggle", group: "交互与装饰", label: "显示圆环", path: "ring", default: false },
  { type: "color", group: "交互与装饰", label: "圆环色", path: "ringColor", default: "#7c3aed" },
];

// ── TextType parameter set ────────────────────────────────────────────────────
// GSAP-driven typing animation. Flat path → prop mapping; `text` is required and
// pinned via previewProps (no text-input control type). `typeEffect` injects a
// per-character animation (fade/blur/rise) and `cursorStyle` switches between
// character / bar / block / underscore carets. `cursorColor` defaults to a warm
// amber so the caret reads on the dark preview frame; `mistakes` seeds the
// "typo then correct" flourish. `prefixColor` is intentionally omitted because
// `prefix` (a text prop) has no matching control.
const TEXTTYPE_CONTROLS: ControlDef[] = [
  // 打字节奏 / Rhythm
  { type: "range", group: "打字节奏", label: "每字耗时", path: "typingSpeed", min: 10, max: 200, step: 5, default: 50, unit: "ms" },
  { type: "range", group: "打字节奏", label: "起始延时", path: "initialDelay", min: 0, max: 2000, step: 50, default: 0, unit: "ms" },
  { type: "range", group: "打字节奏", label: "停留时长", path: "pauseDuration", min: 200, max: 6000, step: 100, default: 2000, unit: "ms" },
  { type: "range", group: "打字节奏", label: "删除速度", path: "deletingSpeed", min: 10, max: 200, step: 5, default: 30, unit: "ms" },
  // 转场效果 / Transition
  {
    type: "select", group: "转场效果", label: "删除方式", path: "deleteMode", default: "backspace",
    options: [
      { label: "退格", value: "backspace" },
      { label: "选中", value: "select" },
    ],
  },
  { type: "toggle", group: "转场效果", label: "循环", path: "loop", default: true },
  {
    type: "select", group: "转场效果", label: "入场特效", path: "typeEffect", default: "none",
    options: [
      { label: "无", value: "none" },
      { label: "淡入", value: "fade" },
      { label: "模糊", value: "blur" },
      { label: "升起", value: "rise" },
    ],
  },
  { type: "range", group: "转场效果", label: "错字率", path: "mistakes", min: 0, max: 5, step: 0.5, default: 0 },
  { type: "toggle", group: "转场效果", label: "反向模式", path: "reverseMode", default: false },
  // 光标 / Cursor
  { type: "toggle", group: "光标", label: "显示光标", path: "showCursor", default: true },
  { type: "toggle", group: "光标", label: "打字时隐藏", path: "hideCursorWhileTyping", default: false },
  {
    type: "select", group: "光标", label: "光标样式", path: "cursorStyle", default: "character",
    options: [
      { label: "字符", value: "character" },
      { label: "竖条", value: "bar" },
      { label: "方块", value: "block" },
      { label: "下划线", value: "underscore" },
    ],
  },
  { type: "color", group: "光标", label: "光标色", path: "cursorColor", default: "#fbbf24" },
  { type: "range", group: "光标", label: "闪烁周期", path: "cursorBlinkDuration", min: 0, max: 2, step: 0.1, default: 0.5, unit: "s" },
  { type: "toggle", group: "光标", label: "光标滑移", path: "cursorGlide", default: true },
];

const SHUFFLE_CONTROLS: ControlDef[] = [
  // 洗牌与方向 / Shuffle
  {
    type: "select", group: "洗牌与方向", label: "方向", path: "shuffleDirection", default: "right",
    options: [
      { label: "向右", value: "right" },
      { label: "向左", value: "left" },
      { label: "向上", value: "up" },
      { label: "向下", value: "down" },
    ],
  },
  { type: "range", group: "洗牌与方向", label: "单字时长", path: "duration", min: 0.1, max: 1.5, step: 0.05, default: 0.35, unit: "s" },
  { type: "range", group: "洗牌与方向", label: "随机最大延时", path: "maxDelay", min: 0, max: 1, step: 0.05, default: 0, unit: "s" },
  { type: "range", group: "洗牌与方向", label: "错落间隔", path: "stagger", min: 0, max: 0.3, step: 0.01, default: 0.03, unit: "s" },
  { type: "range", group: "洗牌与方向", label: "洗牌轮数", path: "shuffleTimes", min: 1, max: 5, step: 1, default: 1 },
  {
    type: "select", group: "洗牌与方向", label: "动画次序", path: "animationMode", default: "evenodd",
    options: [
      { label: "奇偶交替", value: "evenodd" },
      { label: "顺序", value: "sequence" },
      { label: "中心扩散", value: "center" },
      { label: "随机", value: "random" },
    ],
  },
  { type: "toggle", group: "洗牌与方向", label: "循环", path: "loop", default: false },
  { type: "range", group: "洗牌与方向", label: "循环间隔", path: "loopDelay", min: 0, max: 3, step: 0.1, default: 0, unit: "s" },
  // 效果 / Effect
  {
    type: "select", group: "效果", label: "效果类型", path: "effect", default: "slide",
    options: [
      { label: "滑入", value: "slide" },
      { label: "翻转", value: "flip" },
      { label: "模糊", value: "blur" },
    ],
  },
  { type: "toggle", group: "效果", label: "运动模糊", path: "motionBlur", default: false },
  { type: "range", group: "效果", label: "悬停半径", path: "hoverRadius", min: 0, max: 200, step: 10, default: 0, unit: "px" },
  { type: "toggle", group: "效果", label: "悬停触发", path: "triggerOnHover", default: true },
  { type: "toggle", group: "效果", label: "只触发一次", path: "triggerOnce", default: true },
  { type: "toggle", group: "效果", label: "尊重减弱动效", path: "respectReducedMotion", default: true },
  // 颜色 / Color
  { type: "color", group: "颜色", label: "文字色", path: "color", default: "#eef1ff" },
  { type: "color", group: "颜色", label: "起始色", path: "colorFrom", default: "#7c3aed" },
  { type: "color", group: "颜色", label: "结束色", path: "colorTo", default: "#eef1ff" },
  { type: "color", group: "颜色", label: "重码色", path: "accentColor", default: "#fbbf24" },
  {
    type: "select", group: "颜色", label: "对齐", path: "textAlign", default: "center",
    options: [
      { label: "居中", value: "center" },
      { label: "左", value: "left" },
      { label: "右", value: "right" },
    ],
  },
];

const SHINYTEXT_CONTROLS: ControlDef[] = [
  // 颜色 / Color
  { type: "color", group: "颜色", label: "底色", path: "color", default: "#b5b5b5" },
  { type: "color", group: "颜色", label: "流光色", path: "shineColor", default: "#ffffff" },
  { type: "range", group: "颜色", label: "光晕强度", path: "glow", min: 0, max: 1, step: 0.05, default: 0 },
  // 闪光 / Shine
  { type: "range", group: "闪光", label: "扫光时长", path: "speed", min: 0.5, max: 10, step: 0.5, default: 2, unit: "s" },
  { type: "range", group: "闪光", label: "循环间隔", path: "delay", min: 0, max: 5, step: 0.1, default: 0, unit: "s" },
  { type: "range", group: "闪光", label: "光带角度", path: "angle", min: 0, max: 360, step: 5, default: 120, unit: "°" },
  { type: "range", group: "闪光", label: "光带宽度", path: "shineWidth", min: 2, max: 200, step: 1, default: 40, unit: "px" },
  { type: "range", group: "闪光", label: "边缘柔化", path: "softness", min: 0, max: 1, step: 0.05, default: 0.8 },
  { type: "range", group: "闪光", label: "光带数量", path: "bands", min: 1, max: 3, step: 1, default: 1 },
  // 行为 / Behaviour
  {
    type: "select", group: "行为", label: "方向", path: "direction", default: "left",
    options: [
      { label: "向左", value: "left" },
      { label: "向右", value: "right" },
    ],
  },
  {
    type: "select", group: "行为", label: "缓动", path: "easing", default: "smooth",
    options: [
      { label: "平滑", value: "smooth" },
      { label: "线性", value: "linear" },
      { label: "锐利", value: "snappy" },
    ],
  },
  {
    type: "select", group: "行为", label: "触发方式", path: "trigger", default: "loop",
    options: [
      { label: "自动循环", value: "loop" },
      { label: "悬停触发", value: "hover" },
      { label: "进入视口", value: "view" },
    ],
  },
  { type: "toggle", group: "行为", label: "往返扫描", path: "yoyo", default: false },
  { type: "toggle", group: "行为", label: "跟随指针", path: "followPointer", default: false },
  { type: "toggle", group: "行为", label: "悬停暂停", path: "pauseOnHover", default: false },
  { type: "toggle", group: "行为", label: "停用", path: "disabled", default: false },
];

const TEXTPRESSURE_CONTROLS: ControlDef[] = [
  // 形变 / Shape
  { type: "toggle", group: "形变", label: "宽度变化", path: "width", default: true },
  { type: "toggle", group: "形变", label: "字重变化", path: "weight", default: true },
  { type: "toggle", group: "形变", label: "斜体倾斜", path: "italic", default: true },
  { type: "toggle", group: "形变", label: "透明度渐隐", path: "alpha", default: false },
  { type: "toggle", group: "形变", label: "纵向拉伸", path: "scale", default: false },
  { type: "toggle", group: "形变", label: "描边", path: "stroke", default: false },
  { type: "range", group: "形变", label: "描边粗细", path: "strokeWidth", min: 0, max: 10, step: 1, default: 3, unit: "px" },
  { type: "range", group: "形变", label: "感应半径", path: "radius", min: 0.1, max: 1, step: 0.05, default: 0.5 },
  { type: "range", group: "形变", label: "跟随平滑", path: "smoothing", min: 0, max: 1, step: 0.05, default: 0.5 },
  // 配色 / Color
  { type: "color", group: "配色", label: "文字颜色", path: "textColor", default: "#eef0ff" },
  { type: "color", group: "配色", label: "受压着色", path: "pressureColor", default: "#6ea8ff" },
  { type: "color", group: "配色", label: "描边颜色", path: "strokeColor", default: "#ff3b6b" },
  // 交互 / Interaction
  {
    type: "select", group: "交互", label: "空闲律动", path: "idle", default: "none",
    options: [
      { label: "静止", value: "none" },
      { label: "波浪", value: "wave" },
      { label: "呼吸", value: "pulse" },
    ],
  },
  { type: "range", group: "交互", label: "律动速度", path: "idleSpeed", min: 0.2, max: 3, step: 0.1, default: 1, unit: "×" },
  { type: "toggle", group: "交互", label: "点击涟漪", path: "clickRipple", default: true },
];

const CURVEDLOOP_CONTROLS: ControlDef[] = [
  // 文字 / Text
  { type: "color", group: "文字", label: "文字颜色", path: "color", default: "#eef0ff" },
  { type: "range", group: "文字", label: "字号", path: "fontSize", min: 24, max: 200, step: 4, default: 96, unit: "px" },
  {
    type: "range", group: "文字", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 700,
  },
  { type: "range", group: "文字", label: "字距", path: "letterSpacing", min: -10, max: 40, step: 1, default: 0, unit: "px" },
  // 路径 / Path
  {
    type: "select", group: "路径", label: "形状", path: "shape", default: "arc",
    options: [
      { label: "弧线", value: "arc" },
      { label: "波浪", value: "wave" },
      { label: "圆环", value: "circle" },
      { label: "直线", value: "line" },
    ],
  },
  { type: "range", group: "路径", label: "弯曲幅度", path: "curveAmount", min: 0, max: 400, step: 10, default: 120, unit: "px" },
  {
    type: "select", group: "路径", label: "方向", path: "direction", default: "left",
    options: [
      { label: "向左", value: "left" },
      { label: "向右", value: "right" },
    ],
  },
  // 运动 / Motion
  { type: "range", group: "运动", label: "速度", path: "speed", min: 0.2, max: 12, step: 0.2, default: 2 },
  { type: "toggle", group: "运动", label: "可拖拽", path: "interactive", default: true },
  { type: "toggle", group: "运动", label: "悬停暂停", path: "pauseOnHover", default: false },
  { type: "range", group: "运动", label: "滚动加速", path: "scrollBoost", min: 0, max: 10, step: 0.5, default: 0 },
  // 外观 / Look
  { type: "range", group: "外观", label: "边缘渐隐", path: "edgeFade", min: 0, max: 1, step: 0.05, default: 0 },
  { type: "toggle", group: "外观", label: "描边轮廓", path: "outline", default: false },
];

const FUZZYTEXT_CONTROLS: ControlDef[] = [
  // 模糊 / Fuzz
  { type: "range", group: "模糊", label: "基础强度", path: "baseIntensity", min: 0, max: 1, step: 0.02, default: 0.18 },
  { type: "range", group: "模糊", label: "悬停强度", path: "hoverIntensity", min: 0, max: 1, step: 0.02, default: 0.5 },
  { type: "range", group: "模糊", label: "撕裂范围", path: "fuzzRange", min: 0, max: 60, step: 2, default: 30, unit: "px" },
  {
    type: "select", group: "模糊", label: "方向", path: "direction", default: "horizontal",
    options: [
      { label: "水平", value: "horizontal" },
      { label: "垂直", value: "vertical" },
      { label: "双向", value: "both" },
    ],
  },
  { type: "range", group: "模糊", label: "切片尺寸", path: "sliceSize", min: 1, max: 10, step: 1, default: 1, unit: "px" },
  // 文字 / Text
  { type: "color", group: "文字", label: "颜色", path: "color", default: "#eef0ff" },
  { type: "range", group: "文字", label: "字号", path: "fontSize", min: 24, max: 160, step: 4, default: 88, unit: "px" },
  { type: "range", group: "文字", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 900 },
  { type: "range", group: "文字", label: "字距", path: "letterSpacing", min: -5, max: 20, step: 1, default: 0, unit: "px" },
  // 运动 / Motion
  {
    type: "select", group: "运动", label: "触发方式", path: "trigger", default: "hover",
    options: [
      { label: "悬停", value: "hover" },
      { label: "常驻", value: "always" },
      { label: "点击", value: "click" },
    ],
  },
  { type: "toggle", group: "运动", label: "启用悬停", path: "enableHover", default: true },
  { type: "range", group: "运动", label: "过渡时长", path: "transitionDuration", min: 0, max: 1500, step: 50, default: 0, unit: "ms" },
  { type: "range", group: "运动", label: "帧率", path: "fps", min: 10, max: 60, step: 5, default: 60 },
  { type: "toggle", group: "运动", label: "点击爆发", path: "clickEffect", default: false },
  // 故障 / Glitch
  { type: "toggle", group: "故障", label: "故障模式", path: "glitchMode", default: false },
  { type: "range", group: "故障", label: "故障间隔", path: "glitchInterval", min: 200, max: 5000, step: 100, default: 2000, unit: "ms" },
  { type: "range", group: "故障", label: "故障时长", path: "glitchDuration", min: 50, max: 1000, step: 10, default: 200, unit: "ms" },
  { type: "toggle", group: "故障", label: "入场动画", path: "intro", default: false },
  { type: "range", group: "故障", label: "入场时长", path: "introDuration", min: 200, max: 4000, step: 100, default: 1400, unit: "ms" },
  { type: "range", group: "故障", label: "色彩分离", path: "colorSplit", min: 0, max: 1, step: 0.02, default: 0 },
];

const GRADIENTTEXT_CONTROLS: ControlDef[] = [
  // 渐变 / Gradient
  { type: "range", group: "渐变", label: "动画速度", path: "animationSpeed", min: 1, max: 30, step: 1, default: 8 },
  {
    type: "select", group: "渐变", label: "变体", path: "variant", default: "linear",
    options: [
      { label: "线性", value: "linear" },
      { label: "流体", value: "flow" },
      { label: "锥形", value: "conic" },
    ],
  },
  { type: "range", group: "渐变", label: "角度", path: "angle", min: 0, max: 360, step: 5, default: 90, unit: "°" },
  {
    type: "select", group: "渐变", label: "方向", path: "direction", default: "horizontal",
    options: [
      { label: "水平", value: "horizontal" },
      { label: "垂直", value: "vertical" },
      { label: "对角", value: "diagonal" },
    ],
  },
  { type: "range", group: "渐变", label: "缩放", path: "scale", min: 1, max: 6, step: 0.5, default: 3 },
  { type: "toggle", group: "渐变", label: "往返", path: "yoyo", default: true },
  // 外观 / Style
  { type: "range", group: "外观", label: "辉光", path: "glow", min: 0, max: 1, step: 0.05, default: 0 },
  { type: "toggle", group: "外观", label: "描边边框", path: "showBorder", default: false },
  { type: "range", group: "外观", label: "边框宽度", path: "borderWidth", min: 1, max: 6, step: 0.5, default: 1.5, unit: "px" },
  { type: "toggle", group: "外观", label: "悬停暂停", path: "pauseOnHover", default: false },
  { type: "toggle", group: "外观", label: "指针跟随", path: "followPointer", default: false },
];

const FALLINGTEXT_CONTROLS: ControlDef[] = [
  // 物理 / Physics
  { type: "range", group: "物理", label: "重力", path: "gravity", min: 0, max: 4, step: 0.1, default: 1 },
  { type: "range", group: "物理", label: "弹性", path: "bounciness", min: 0, max: 1, step: 0.05, default: 0.2 },
  { type: "range", group: "物理", label: "散开", path: "scatter", min: 0, max: 1, step: 0.05, default: 0.5 },
  { type: "range", group: "物理", label: "错峰", path: "stagger", min: 0, max: 0.2, step: 0.01, default: 0.03, unit: "s" },
  {
    type: "select", group: "物理", label: "出场次序", path: "order", default: "random",
    options: [
      { label: "随机", value: "random" },
      { label: "顺序", value: "sequence" },
      { label: "居中", value: "center" },
      { label: "一起", value: "together" },
    ],
  },
  // 外观 / Style
  {
    type: "select", group: "外观", label: "形态", path: "variant", default: "text",
    options: [
      { label: "文字", value: "text" },
      { label: "卡片", value: "tiles" },
    ],
  },
  {
    type: "select", group: "外观", label: "拆分", path: "split", default: "words",
    options: [
      { label: "按词", value: "words" },
      { label: "按字", value: "letters" },
    ],
  },
  { type: "color", group: "外观", label: "强调色", path: "accentColor", default: "#5b8cff" },
  {
    type: "select", group: "外观", label: "主题", path: "theme", default: "dark",
    options: [
      { label: "暗色", value: "dark" },
      { label: "亮色", value: "light" },
    ],
  },
  { type: "toggle", group: "外观", label: "可拖拽", path: "draggable", default: true },
  { type: "range", group: "外观", label: "指针推力", path: "cursorPush", min: 0, max: 2, step: 0.1, default: 0.5 },
];

const TEXTCURSOR_CONTROLS: ControlDef[] = [
  // 模式 / Mode
  {
    type: "select", group: "模式", label: "样式", path: "mode", default: "stamp",
    options: [
      { label: "盖章", value: "stamp" },
      { label: "链条", value: "chain" },
      { label: "丝带", value: "ribbon" },
    ],
  },
  { type: "range", group: "模式", label: "最大点数", path: "maxPoints", min: 1, max: 20, step: 1, default: 7 },
  { type: "range", group: "模式", label: "间距", path: "spacing", min: 20, max: 200, step: 4, default: 88, unit: "px" },
  { type: "toggle", group: "模式", label: "跟随方向", path: "followMouseDirection", default: true },
  { type: "toggle", group: "模式", label: "随机漂浮", path: "randomFloat", default: true },
  // 外观 / Style
  { type: "range", group: "外观", label: "字号", path: "fontSize", min: 16, max: 64, step: 2, default: 30, unit: "px" },
  { type: "color", group: "外观", label: "颜色", path: "color", default: "#eef0ff" },
  { type: "toggle", group: "外观", label: "保持正立", path: "keepUpright", default: true },
  { type: "toggle", group: "外观", label: "弹入", path: "popIn", default: true },
  { type: "toggle", group: "外观", label: "隐藏指针", path: "hideCursor", default: false },
  { type: "range", group: "外观", label: "收缩", path: "shrink", min: 0, max: 1, step: 0.05, default: 0.5 },
  { type: "range", group: "外观", label: "淡出", path: "fade", min: 0, max: 1, step: 0.05, default: 0.6 },
  { type: "range", group: "外观", label: "平滑", path: "smoothing", min: 0, max: 1, step: 0.05, default: 0.3 },
];

const DECRYPTEDTEXT_CONTROLS: ControlDef[] = [
  // 解码 / Decode
  {
    type: "select", group: "解码", label: "效果", path: "effect", default: "scramble",
    options: [
      { label: "乱码", value: "scramble" },
      { label: "翻转", value: "flip" },
      { label: "淡入", value: "fade" },
    ],
  },
  {
    type: "select", group: "解码", label: "触发", path: "animateOn", default: "hover",
    options: [
      { label: "悬停", value: "hover" },
      { label: "进入视图", value: "view" },
      { label: "视图内悬停", value: "inViewHover" },
      { label: "点击", value: "click" },
    ],
  },
  { type: "range", group: "解码", label: "速度", path: "speed", min: 20, max: 200, step: 10, default: 50 },
  { type: "range", group: "解码", label: "最大轮次", path: "maxIterations", min: 2, max: 30, step: 1, default: 10 },
  { type: "toggle", group: "解码", label: "顺序揭示", path: "sequential", default: false },
  {
    type: "select", group: "解码", label: "揭示方向", path: "revealDirection", default: "start",
    options: [
      { label: "从头", value: "start" },
      { label: "从尾", value: "end" },
      { label: "居中", value: "center" },
      { label: "随机", value: "random" },
    ],
  },
  { type: "toggle", group: "解码", label: "仅用原字", path: "useOriginalCharsOnly", default: false },
  // 外观 / Style
  { type: "color", group: "外观", label: "乱码色", path: "scrambleColor", default: "#ff5f6d" },
  { type: "toggle", group: "外观", label: "循环", path: "loop", default: false },
  {
    type: "select", group: "外观", label: "点击模式", path: "clickMode", default: "once",
    options: [
      { label: "一次", value: "once" },
      { label: "开关", value: "toggle" },
    ],
  },
  { type: "range", group: "外观", label: "悬停半径", path: "hoverRadius", min: 0, max: 300, step: 10, default: 0, unit: "px" },
];

const TRUEFOCUS_CONTROLS: ControlDef[] = [
  // 样式 / Style
  {
    type: "select", group: "样式", label: "焦点样式", path: "focusStyle", default: "brackets",
    options: [
      { label: "括号", value: "brackets" },
      { label: "方框", value: "box" },
      { label: "下划线", value: "underline" },
      { label: "高亮", value: "highlight" },
    ],
  },
  {
    type: "select", group: "样式", label: "次序", path: "order", default: "sequential",
    options: [
      { label: "顺序", value: "sequential" },
      { label: "随机", value: "random" },
    ],
  },
  {
    type: "select", group: "样式", label: "缓动", path: "easing", default: "smooth",
    options: [
      { label: "平滑", value: "smooth" },
      { label: "弹簧", value: "spring" },
    ],
  },
  { type: "range", group: "样式", label: "模糊量", path: "blurAmount", min: 0, max: 12, step: 0.5, default: 5 },
  { type: "range", group: "样式", label: "聚焦缩放", path: "focusScale", min: 1, max: 1.6, step: 0.05, default: 1 },
  { type: "range", group: "样式", label: "未聚焦透明", path: "unfocusedOpacity", min: 0.1, max: 1, step: 0.05, default: 1 },
  // 框 / Frame
  { type: "color", group: "框", label: "边框色", path: "borderColor", default: "#5b8cff" },
  { type: "range", group: "框", label: "角标尺寸", path: "cornerSize", min: 6, max: 40, step: 2, default: 16, unit: "px" },
  { type: "range", group: "框", label: "边框宽度", path: "borderWidth", min: 1, max: 8, step: 1, default: 3, unit: "px" },
  { type: "color", group: "框", label: "辉光色", path: "glowColor", default: "#5b8cff" },
  { type: "range", group: "框", label: "动画时长", path: "animationDuration", min: 0.2, max: 2, step: 0.1, default: 0.5, unit: "s" },
  { type: "range", group: "框", label: "间隔", path: "pauseBetweenAnimations", min: 0, max: 4, step: 0.2, default: 1, unit: "s" },
];

const SCROLLFLOAT_CONTROLS: ControlDef[] = [
  // 效果 / Effect
  {
    type: "select", group: "效果", label: "效果", path: "effect", default: "float",
    options: [
      { label: "浮动", value: "float" },
      { label: "翻转", value: "flip" },
      { label: "飞散", value: "scatter" },
      { label: "模糊", value: "blur" },
      { label: "波浪", value: "wave" },
    ],
  },
  {
    type: "select", group: "效果", label: "拆分", path: "splitBy", default: "chars",
    options: [
      { label: "字符", value: "chars" },
      { label: "单词", value: "words" },
    ],
  },
  {
    type: "select", group: "效果", label: "方向", path: "direction", default: "up",
    options: [
      { label: "向上", value: "up" },
      { label: "向下", value: "down" },
    ],
  },
  {
    type: "select", group: "效果", label: "顺序", path: "order", default: "start",
    options: [
      { label: "从头", value: "start" },
      { label: "从尾", value: "end" },
      { label: "居中", value: "center" },
      { label: "边缘", value: "edges" },
      { label: "随机", value: "random" },
    ],
  },
  // 参数 / Params
  { type: "range", group: "参数", label: "动画时长", path: "animationDuration", min: 0.2, max: 3, step: 0.1, default: 1, unit: "s" },
  { type: "range", group: "参数", label: "错峰", path: "stagger", min: 0, max: 0.2, step: 0.005, default: 0.03, unit: "s" },
  { type: "range", group: "参数", label: "距离", path: "distance", min: 0, max: 400, step: 10, default: 120, unit: "px" },
  { type: "range", group: "参数", label: "拉伸", path: "stretch", min: 1, max: 4, step: 0.1, default: 2.3 },
  { type: "range", group: "参数", label: "平滑", path: "smoothing", min: 0, max: 1, step: 0.05, default: 0 },
  { type: "color", group: "参数", label: "起始色", path: "fromColor", default: "#ff8a5b" },
];

const SCROLLREVEAL_CONTROLS: ControlDef[] = [
  // 效果 / Effect
  {
    type: "select", group: "效果", label: "效果", path: "effect", default: "fade",
    options: [
      { label: "淡入", value: "fade" },
      { label: "升起", value: "rise" },
      { label: "翻转", value: "flip" },
      { label: "缩放", value: "scale" },
    ],
  },
  {
    type: "select", group: "效果", label: "拆分", path: "splitBy", default: "words",
    options: [
      { label: "词", value: "words" },
      { label: "字", value: "chars" },
      { label: "行", value: "lines" },
    ],
  },
  {
    type: "select", group: "效果", label: "模式", path: "mode", default: "scrub",
    options: [
      { label: "滚动擦除", value: "scrub" },
      { label: "进入播放", value: "enter" },
    ],
  },
  // 参数 / Params
  { type: "toggle", group: "参数", label: "启用模糊", path: "enableBlur", default: true },
  { type: "range", group: "参数", label: "基础透明", path: "baseOpacity", min: 0, max: 1, step: 0.05, default: 0.1 },
  { type: "range", group: "参数", label: "基础旋转", path: "baseRotation", min: 0, max: 20, step: 1, default: 3, unit: "°" },
  { type: "range", group: "参数", label: "模糊强度", path: "blurStrength", min: 0, max: 20, step: 1, default: 4 },
  { type: "range", group: "参数", label: "基础偏移", path: "baseOffset", min: 0, max: 40, step: 2, default: 0, unit: "px" },
  { type: "range", group: "参数", label: "错峰", path: "stagger", min: 0, max: 0.3, step: 0.01, default: 0.05, unit: "s" },
  { type: "range", group: "参数", label: "平滑", path: "smoothing", min: 0, max: 1, step: 0.05, default: 0 },
  { type: "range", group: "参数", label: "时长", path: "duration", min: 0.2, max: 3, step: 0.1, default: 0.8, unit: "s" },
  { type: "color", group: "参数", label: "高亮色", path: "highlightColor", default: "#ffd166" },
];

const SCRAMBLEDTEXT_CONTROLS: ControlDef[] = [
  // 交互 / Interaction
  {
    type: "select", group: "交互", label: "效果", path: "effect", default: "scramble",
    options: [
      { label: "乱码", value: "scramble" },
      { label: "浮起", value: "lift" },
      { label: "模糊", value: "blur" },
      { label: "放大", value: "magnify" },
    ],
  },
  { type: "range", group: "交互", label: "半径", path: "radius", min: 10, max: 300, step: 5, default: 100, unit: "px" },
  { type: "range", group: "交互", label: "时长", path: "duration", min: 0.2, max: 3, step: 0.1, default: 1.2, unit: "s" },
  { type: "range", group: "交互", label: "速度", path: "speed", min: 0.1, max: 2, step: 0.1, default: 0.5 },
  { type: "range", group: "交互", label: "强度", path: "strength", min: 0, max: 3, step: 0.1, default: 1 },
  { type: "range", group: "交互", label: "拖尾", path: "trail", min: 0, max: 2, step: 0.1, default: 0.6 },
  { type: "toggle", group: "交互", label: "点击爆发", path: "clickBurst", default: true },
  { type: "toggle", group: "交互", label: "入场", path: "intro", default: true },
  // 外观 / Style
  {
    type: "select", group: "外观", label: "乱码字符", path: "scrambleChars", default: ".:",
    options: [
      { label: "点冒号", value: ".: " },


      { label: "字母", value: "ABCDEF" },
      { label: "数字", value: "01" },
      { label: "符号", value: "#%&@$?<>" },
    ],
  },
  { type: "color", group: "外观", label: "乱码色", path: "scrambleColor", default: "#ff5f6d" },
  { type: "color", group: "外观", label: "文字色", path: "color", default: "" },
  {
    type: "select", group: "外观", label: "字体", path: "fontFamily", default: "monospace",
    options: [
      { label: "等宽", value: "monospace" },
      { label: "无衬线", value: "sans-serif" },
      { label: "衬线", value: "serif" },
      { label: "手写", value: "cursive" },
    ],
  },
];

const ROTATINGTEXT_CONTROLS: ControlDef[] = [
  // 动画 / Animation
  {
    type: "select", group: "动画", label: "效果", path: "effect", default: "slide",
    options: [
      { label: "滑入", value: "slide" },
      { label: "翻转", value: "flip" },
      { label: "模糊", value: "blur" },
      { label: "缩放", value: "scale" },
      { label: "坠落", value: "drop" },
    ],
  },
  {
    type: "select", group: "动画", label: "方向", path: "direction", default: "up",
    options: [
      { label: "向上", value: "up" },
      { label: "向下", value: "down" },
    ],
  },
  {
    type: "select", group: "动画", label: "拆分", path: "splitBy", default: "characters",
    options: [
      { label: "字符", value: "characters" },
      { label: "单词", value: "words" },
      { label: "行", value: "lines" },
    ],
  },
  { type: "range", group: "动画", label: "模糊", path: "blur", min: 0, max: 20, step: 1, default: 0 },
  { type: "range", group: "动画", label: "切换间隔", path: "rotationInterval", min: 500, max: 5000, step: 100, default: 2000, unit: "ms" },
  { type: "range", group: "动画", label: "错峰", path: "staggerDuration", min: 0, max: 0.2, step: 0.005, default: 0, unit: "s" },
  {
    type: "select", group: "动画", label: "错峰次序", path: "staggerFrom", default: "first",
    options: [
      { label: "从头", value: "first" },
      { label: "从尾", value: "last" },
      { label: "居中", value: "center" },
      { label: "随机", value: "random" },
    ],
  },
  // 行为 / Behavior
  { type: "toggle", group: "行为", label: "循环", path: "loop", default: true },
  { type: "toggle", group: "行为", label: "自动", path: "auto", default: true },
  { type: "toggle", group: "行为", label: "悬停暂停", path: "pauseOnHover", default: false },
  { type: "toggle", group: "行为", label: "高亮块", path: "highlight", default: false },
  { type: "color", group: "行为", label: "高亮色", path: "highlightColor", default: "#a855f7" },
];

const GLITCHTEXT_CONTROLS: ControlDef[] = [
  // 故障 / Glitch
  {
    type: "select", group: "故障", label: "模式", path: "mode", default: "slices",
    options: [
      { label: "切片", value: "slices" },
      { label: "RGB", value: "rgb" },
      { label: "扫描", value: "scan" },
      { label: "噪点", value: "noise" },
    ],
  },
  {
    type: "select", group: "故障", label: "触发", path: "trigger", default: "always",
    options: [
      { label: "常驻", value: "always" },
      { label: "悬停", value: "hover" },
      { label: "点击", value: "click" },
    ],
  },
  { type: "range", group: "故障", label: "强度", path: "intensity", min: 0, max: 1, step: 0.05, default: 0.5 },
  { type: "range", group: "故障", label: "速度", path: "speed", min: 0.1, max: 2, step: 0.1, default: 0.5 },
  { type: "range", group: "故障", label: "偏移", path: "offset", min: 0, max: 30, step: 1, default: 10, unit: "px" },
  { type: "toggle", group: "故障", label: "闪烁", path: "flicker", default: false },
  { type: "range", group: "故障", label: "倾斜", path: "skew", min: -2, max: 2, step: 0.1, default: 0 },
  { type: "range", group: "故障", label: "爆发时长", path: "burstDuration", min: 0.1, max: 2, step: 0.1, default: 0.6, unit: "s" },
  // 外观 / Style
  { type: "toggle", group: "外观", label: "阴影", path: "enableShadows", default: true },
  { type: "color", group: "外观", label: "文字色", path: "color", default: "" },
  { type: "range", group: "外观", label: "字号", path: "fontSize", min: 16, max: 120, step: 1, default: 56, unit: "px" },
  { type: "range", group: "外观", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 900 },
];

// ── ScrollVelocity parameter set ──────────────────────────────────────────
const SCROLLVELOCITY_CONTROLS: ControlDef[] = [
  // 运动
  { type: "range", group: "运动", label: "滚动速度", path: "velocity", min: 10, max: 400, step: 10, default: 100, unit: "px/s" },
  { type: "range", group: "运动", label: "速度倾斜", path: "skewWithVelocity", min: 0, max: 30, step: 1, default: 0, unit: "°" },
  { type: "range", group: "运动", label: "速度缩放", path: "scaleWithVelocity", min: 0, max: 1, step: 0.01, default: 0 },
  { type: "range", group: "运动", label: "字间距", path: "gap", min: 0, max: 40, step: 1, default: 0, unit: "px" },
  // 外观
  { type: "range", group: "外观", label: "复制份数", path: "numCopies", min: 1, max: 12, step: 1, default: 6 },
  { type: "range", group: "外观", label: "字号", path: "fontSize", min: 16, max: 120, step: 1, default: 60, unit: "px" },
  { type: "range", group: "外观", label: "字重", path: "fontWeight", min: 100, max: 900, step: 100, default: 700 },
  { type: "color", group: "外观", label: "颜色", path: "color", default: "#ffffff" },
  { type: "toggle", group: "外观", label: "隔行描边", path: "outlineAlternate", default: false },
  { type: "toggle", group: "外观", label: "边缘渐隐", path: "fadeEdges", default: false },
  // 行为
  { type: "range", group: "行为", label: "阻尼", path: "damping", min: 10, max: 100, step: 1, default: 50 },
  { type: "range", group: "行为", label: "刚度", path: "stiffness", min: 100, max: 800, step: 10, default: 400 },
  { type: "toggle", group: "行为", label: "悬停暂停", path: "pauseOnHover", default: false },
  { type: "toggle", group: "行为", label: "可拖拽", path: "draggable", default: false }
];

// ── VariableProximity parameter set ───────────────────────────────────────
const VARIABLEPROXIMITY_CONTROLS: ControlDef[] = [
  // 效果
  { type: "range", group: "效果", label: "放大", path: "scale", min: 1, max: 2, step: 0.01, default: 1 },
  { type: "range", group: "效果", label: "浮起", path: "lift", min: 0, max: 1, step: 0.01, default: 0, unit: "em" },
  { type: "range", group: "效果", label: "影响半径", path: "radius", min: 10, max: 200, step: 1, default: 50, unit: "px" },
  { type: "range", group: "效果", label: "平滑", path: "smoothing", min: 0, max: 1, step: 0.01, default: 0.2 },
  {
    type: "select",
    group: "效果",
    label: "衰减",
    path: "falloff",
    default: "linear",
    options: [
      { label: "线性", value: "linear" },
      { label: "指数", value: "exponential" },
      { label: "高斯", value: "gaussian" }
    ]
  },
  { type: "toggle", group: "效果", label: "闲置波浪", path: "idleWave", default: false },
  // 颜色
  { type: "color", group: "颜色", label: "基础色", path: "fromColor", default: "#ffffff" },
  { type: "color", group: "颜色", label: "近距色", path: "toColor", default: "#5CFFC8" },
  { type: "range", group: "颜色", label: "字号", path: "fontSize", min: 16, max: 96, step: 1, default: 48, unit: "px" }
];

// ── CrystalizedBall parameter set ─────────────────────────────────────────
const CRYSTALIZEDBALL_CONTROLS: ControlDef[] = [
  // 预设
  {
    type: "select",
    group: "预设",
    label: "预设",
    path: "preset",
    default: "plasma",
    options: [
      { label: "Plasma", value: "plasma" },
      { label: "Aurora", value: "aurora" },
      { label: "Nebula", value: "nebula" },
      { label: "Ember", value: "ember" },
      { label: "Frost", value: "frost" },
      { label: "Solar", value: "solar" },
      { label: "Eclipse", value: "eclipse" },
      { label: "Abyss", value: "abyss" }
    ]
  },
  {
    type: "select",
    group: "预设",
    label: "主题",
    path: "theme",
    default: "dark",
    options: [
      { label: "暗色", value: "dark" },
      { label: "亮色", value: "light" }
    ]
  },
  { type: "color", group: "预设", label: "主色", path: "color", default: "#F25BD0" },
  { type: "range", group: "预设", label: "尺寸", path: "size", min: 0.1, max: 1.5, step: 0.01, default: 0.7 },
  { type: "range", group: "预设", label: "速度", path: "speed", min: 0, max: 3, step: 0.01, default: 1 },
  // 效果
  { type: "range", group: "效果", label: "辉光", path: "glow", min: 0, max: 2, step: 0.01, default: 0.9 },
  { type: "range", group: "效果", label: "裂纹", path: "crackle", min: 0, max: 1.5, step: 0.01, default: 0.85 },
  { type: "range", group: "效果", label: "弧光", path: "flares", min: 0, max: 1, step: 0.01, default: 0.65 },
  { type: "range", group: "效果", label: "雾感", path: "haze", min: 0, max: 2, step: 0.01, default: 0.7 },
  { type: "range", group: "效果", label: "闪烁", path: "twinkle", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "range", group: "效果", label: "景深", path: "depth", min: 0, max: 1, step: 0.01, default: 0.6 },
  { type: "range", group: "效果", label: "摇曳", path: "sway", min: 0, max: 1, step: 0.01, default: 0.5 },
  // 行为
  { type: "range", group: "行为", label: "填充", path: "fill", min: 0, max: 1, step: 0.01, default: 0.5 },
  {
    type: "select",
    group: "行为",
    label: "运动",
    path: "motion",
    default: "rise",
    options: [
      { label: "上升", value: "rise" },
      { label: "下落", value: "fall" },
      { label: "漂移", value: "drift" },
      { label: "环绕", value: "orbit" }
    ]
  },
  {
    type: "select",
    group: "行为",
    label: "粒子形",
    path: "particleShape",
    default: "square",
    options: [
      { label: "方形", value: "square" },
      { label: "圆形", value: "round" }
    ]
  },
  { type: "range", group: "行为", label: "粒子数", path: "particleCount", min: 1000, max: 40000, step: 1000, default: 15000 },
  { type: "toggle", group: "行为", label: "可交互", path: "interactive", default: true },
  { type: "toggle", group: "行为", label: "暂停", path: "paused", default: false }
];

// ── ElectricLogo parameter set ──────────────────────────────────────────────
const ELECTRICLOGO_CONTROLS: ControlDef[] = [
  // 外观
  { type: "color", group: "外观", label: "主色", path: "color", default: "#ecc7ff" },
  { type: "color", group: "外观", label: "辉光色", path: "glowColor", default: "#ad6dff" },
  { type: "range", group: "外观", label: "缩放", path: "scale", min: 0.2, max: 1.5, step: 0.05, default: 0.7 },
  { type: "range", group: "外观", label: "强度", path: "intensity", min: 0, max: 3, step: 0.05, default: 1 },
  { type: "range", group: "外观", label: "辉光", path: "glow", min: 0, max: 2, step: 0.05, default: 1 },
  { type: "range", group: "外观", label: "填充", path: "fill", min: 0, max: 1, step: 0.05, default: 0 },
  {
    type: "select",
    group: "外观",
    label: "主题",
    path: "theme",
    default: "dark",
    options: [
      { label: "暗色", value: "dark" },
      { label: "亮色", value: "light" }
    ]
  },
  // 形状
  { type: "range", group: "形状", label: "粗细", path: "thickness", min: 0.2, max: 3, step: 0.05, default: 1.5 },
  { type: "range", group: "形状", label: "丝数", path: "strands", min: 1, max: 6, step: 1, default: 4 },
  { type: "range", group: "形状", label: "弯曲", path: "bend", min: 0, max: 1.5, step: 0.05, default: 0.6 },
  { type: "range", group: "形状", label: "碎裂", path: "crackle", min: 0, max: 3, step: 0.05, default: 1.5 },
  { type: "range", group: "形状", label: "弧光", path: "arcs", min: 0, max: 3, step: 1, default: 1 },
  { type: "range", group: "形状", label: "闪烁", path: "flicker", min: 0, max: 1, step: 0.05, default: 0.6 },
  // 交互
  { type: "range", group: "交互", label: "速度", path: "speed", min: 0, max: 6, step: 0.1, default: 2.5 },
  { type: "toggle", group: "交互", label: "可交互", path: "interactive", default: true },
  { type: "range", group: "交互", label: "光标强度", path: "cursorIntensity", min: 0, max: 1, step: 0.05, default: 0.75 },
  { type: "range", group: "交互", label: "光标半径", path: "cursorRadius", min: 20, max: 300, step: 5, default: 100 }
];

// ── DitherVeil parameter set ───────────────────────────────────────────────
const DITHERVEIL_CONTROLS: ControlDef[] = [
  // 图像
  {
    type: "select",
    group: "图像",
    label: "适配",
    path: "fit",
    default: "contain",
    options: [
      { label: "包含", value: "contain" },
      { label: "覆盖", value: "cover" }
    ]
  },
  {
    type: "select",
    group: "图像",
    label: "图案",
    path: "pattern",
    default: "floyd",
    options: [
      { label: "Bayer", value: "bayer" },
      { label: "噪声", value: "noise" },
      { label: "Atkinson", value: "atkinson" },
      { label: "Floyd", value: "floyd" },
      { label: "线条", value: "lines" }
    ]
  },
  { type: "range", group: "图像", label: "像素尺寸", path: "pixelSize", min: 1, max: 8, step: 0.5, default: 2 },
  { type: "range", group: "图像", label: "层级", path: "levels", min: 2, max: 8, step: 1, default: 2 },
  {
    type: "select",
    group: "图像",
    label: "调色板",
    path: "palette",
    default: "duotone",
    options: [
      { label: "双色", value: "duotone" },
      { label: "RGB", value: "rgb" }
    ]
  },
  // 调色
  { type: "color", group: "调色", label: "墨色", path: "inkColor", default: "#120f17" },
  { type: "color", group: "调色", label: "纸色", path: "paperColor", default: "#f4f1ea" },
  { type: "range", group: "调色", label: "对比度", path: "contrast", min: 0.5, max: 2, step: 0.05, default: 1.15 },
  { type: "range", group: "调色", label: "亮度", path: "brightness", min: -0.5, max: 0.5, step: 0.05, default: 0 },
  { type: "color", group: "调色", label: "描边色", path: "rimColor", default: "#a78bfa" },
  { type: "range", group: "调色", label: "描边", path: "rim", min: 0, max: 0.95, step: 0.05, default: 0 },
  // 交互
  { type: "range", group: "交互", label: "揭示半径", path: "revealRadius", min: 50, max: 500, step: 10, default: 200 },
  { type: "range", group: "交互", label: "柔和度", path: "softness", min: 0, max: 1, step: 0.05, default: 0.6 },
  { type: "range", group: "交互", label: "余留", path: "linger", min: 0.1, max: 5, step: 0.1, default: 1 },
  { type: "toggle", group: "交互", label: "反相", path: "reverse", default: false },
  { type: "toggle", group: "交互", label: "游移", path: "wander", default: false },
  { type: "toggle", group: "交互", label: "点击爆发", path: "clickBurst", default: true }
];

// ── GlowCursor parameter set ──────────────────────────────────────────────
const GLOWCURSOR_CONTROLS: ControlDef[] = [
  // 外观
  { type: "color", group: "外观", label: "颜色", path: "color", default: "#5f8bff" },
  { type: "range", group: "外观", label: "强度", path: "intensity", min: 0, max: 3, step: 0.05, default: 1.3 },
  { type: "range", group: "外观", label: "辉光", path: "glow", min: 0, max: 3, step: 0.05, default: 1.2 },
  { type: "range", group: "外观", label: "热斑", path: "hotspot", min: 0, max: 2, step: 0.05, default: 0.8 },
  { type: "range", group: "外观", label: "颗粒", path: "grain", min: 0, max: 1, step: 0.05, default: 0 },
  {
    type: "select",
    group: "外观",
    label: "主题",
    path: "theme",
    default: "dark",
    options: [
      { label: "暗色", value: "dark" },
      { label: "亮色", value: "light" }
    ]
  },
  {
    type: "select",
    group: "外观",
    label: "质量",
    path: "quality",
    default: "high",
    options: [
      { label: "低", value: "low" },
      { label: "中", value: "medium" },
      { label: "高", value: "high" }
    ]
  },
  // 行为
  { type: "range", group: "行为", label: "轨迹宽度", path: "trailWidth", min: 0.5, max: 40, step: 0.5, default: 3 },
  { type: "range", group: "行为", label: "余留", path: "linger", min: 0.1, max: 10, step: 0.1, default: 1.4 },
  { type: "range", group: "行为", label: "跟随速度", path: "followSpeed", min: 0, max: 1, step: 0.05, default: 0.6 },
  { type: "toggle", group: "行为", label: "点击爆发", path: "clickBurst", default: true },
  { type: "toggle", group: "行为", label: "启用", path: "enabled", default: true }
];

// ── RippleDistortion parameter set ─────────────────────────────────────────
// ogl instanced ripple + composite shader. `src` is pinned via previewProps to an
// offline SVG so the texture loads without the external Unsplash default.
const RIPPLE_CONTROLS: ControlDef[] = [
  // 图像 / Image
  { type: "color", group: "图像", label: "染色", path: "tint", default: "#a855f7" },
  { type: "range", group: "图像", label: "染色强度", path: "tintAmount", min: 0, max: 1, step: 0.02, default: 0.1 },
  { type: "toggle", group: "图像", label: "灰度", path: "grayscale", default: true },
  { type: "color", group: "图像", label: "高光色", path: "highlightColor", default: "#ffffff" },
  // 波纹 / Waves
  { type: "range", group: "波纹", label: "笔刷大小", path: "brushSize", min: 20, max: 400, step: 5, default: 150 },
  { type: "range", group: "波纹", label: "扭曲强度", path: "strength", min: 0, max: 1, step: 0.02, default: 0.2 },
  { type: "range", group: "波纹", label: "漩涡", path: "swirl", min: 0, max: 3, step: 0.05, default: 1 },
  { type: "range", group: "波纹", label: "波纹环数", path: "rings", min: 1, max: 10, step: 1, default: 4 },
  { type: "range", group: "波纹", label: "扩散", path: "spread", min: 1, max: 12, step: 0.5, default: 5 },
  { type: "range", group: "波纹", label: "消退", path: "fade", min: 0.5, max: 10, step: 0.1, default: 3 },
  { type: "range", group: "波纹", label: "笔触间隔", path: "spacing", min: 1, max: 60, step: 1, default: 15 },
  // 交互 / Interaction
  {
    type: "select", group: "交互", label: "触发方式", path: "trigger", default: "hover",
    options: [
      { label: "悬停", value: "hover" },
      { label: "点击", value: "click" },
      { label: "两者", value: "both" },
    ],
  },
  { type: "range", group: "交互", label: "点击强度", path: "clickStrength", min: 1, max: 6, step: 0.1, default: 2 },
  {
    type: "select", group: "交互", label: "画质", path: "quality", default: "low",
    options: [
      { label: "低", value: "low" },
      { label: "中", value: "medium" },
      { label: "高", value: "high" },
    ],
  },
  { type: "toggle", group: "交互", label: "启用", path: "enabled", default: true },
  // 特效 / Effects
  { type: "range", group: "特效", label: "色散", path: "dispersion", min: 0, max: 1, step: 0.02, default: 0 },
  { type: "range", group: "特效", label: "高光", path: "glint", min: 0, max: 1, step: 0.02, default: 0 },
];

// ── ElasticMesh parameter set ──────────────────────────────────────────────
// Native WebGL2 elastic grid. `text`/`src` keep component defaults (text mode).
const ELASTIC_CONTROLS: ControlDef[] = [
  // 外观 / Appearance
  {
    type: "select", group: "外观", label: "材质", path: "material", default: "balloon",
    options: [
      { label: "气球", value: "balloon" },
      { label: "镜面", value: "chrome" },
      { label: "果冻", value: "jelly" },
      { label: "黏土", value: "clay" },
    ],
  },
  { type: "color", group: "外观", label: "颜色", path: "color", default: "#3b5bff" },
  {
    type: "select", group: "外观", label: "主题", path: "theme", default: "dark",
    options: [
      { label: "暗色", value: "dark" },
      { label: "亮色", value: "light" },
    ],
  },
  { type: "range", group: "外观", label: "阴影", path: "shadow", min: 0, max: 1, step: 0.05, default: 0.5 },
  { type: "toggle", group: "外观", label: "图片取色", path: "imageColors", default: true },
  // 物理 / Physics
  { type: "range", group: "物理", label: "膨胀", path: "inflate", min: 0.1, max: 3, step: 0.05, default: 1 },
  { type: "range", group: "物理", label: "刚度", path: "stiffness", min: 0, max: 1, step: 0.02, default: 0.5 },
  { type: "range", group: "物理", label: "抖动", path: "wobble", min: 0, max: 1, step: 0.02, default: 0.6 },
  { type: "range", group: "物理", label: "抓取半径", path: "grabRadius", min: 10, max: 400, step: 5, default: 70 },
  { type: "range", group: "物理", label: "拉伸", path: "stretch", min: 0, max: 1, step: 0.02, default: 0.5 },
  { type: "range", group: "物理", label: "按压", path: "press", min: 0, max: 1, step: 0.02, default: 0.5 },
  // 入场 / Intro
  { type: "toggle", group: "入场", label: "入场动画", path: "intro", default: true },
  {
    type: "select", group: "入场", label: "字重", path: "fontWeight", default: "900",
    options: [
      { label: "常规", value: "400" },
      { label: "中粗", value: "700" },
      { label: "特粗", value: "900" },
    ],
  },
];

const ENTRIES: ShowcaseEntry[] = [
  {
    id: "glimmer-vale",
    index: "01",
    name: "Glimmer Vale",
    tag: "WebGL2 · React · 夜雾草地",
    description:
      "一片夜色草甸：山脊上铺着虹彩微光，雏菊在前景里虚化成光斑。基于高度场透视相机、HDR 渲染与双重 Kawase 泛光，全部用原生 WebGL2 着色器写成。",
    fileName: "GlimmerVale.tsx",
    code: glimmerValeSrc,
    Preview: GlimmerVale as ComponentType<Record<string, unknown>>,
    previewProps: { style: { minWidth: 0, minHeight: 0, width: "100%", height: "100%" } },
    hint: "移动鼠标，拨动山脊的光",
    controls: GLIMMER_CONTROLS,
    presetAdvanced: DEFAULT_ADVANCED as Record<string, unknown>,
  },
  {
    id: "lumen-cinch",
    index: "02",
    name: "LumenCinch",
    tag: "WebGL2 · React · 流光沙漏",
    description:
      "一束光丝在腰间收束、向两端张开成沙漏形，微微斜成一道柔和的 S。原生 WebGL2 绘制：车道空间纤维纹理、实例化光带、泛光与软裁切，鼠标移上去光流会随你加速。",
    fileName: "LumenCinch.tsx",
    code: lumenCinchSrc,
    Preview: LumenCinch as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "100%" } },
    hint: "移动鼠标到光带上，光流会加速流动",
    controls: LUMEN_CONTROLS,
    presetAdvanced: LumenCinchPreset.advanced as Record<string, unknown>,
  },
  {
    id: "marble-sprite",
    index: "03",
    name: "Marble Sprite",
    tag: "WebGL · React · 钴蓝精灵",
    description:
      "一颗天蓝的精灵封进厚厚的玻璃胶囊：上半清澈、下半磨砂，两半在一条倾斜接缝处相接成带状椭圆。它会转头看向光标、眨眼睛，胶囊也朝你轻轻倾斜——而玻璃上的高光留在原处。单次片元着色器逐像素光线追踪，正交投影。",
    fileName: "MarbleSprite.tsx",
    code: marbleSpriteSrc,
    Preview: MarbleSprite as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "100%" } },
    hint: "移动鼠标，它会转头看你；按住会变成开心的眯眼",
    controls: MARBLE_CONTROLS,
    presetAdvanced: MARBLE_ADVANCED as Record<string, unknown>,
  },
  {
    id: "holo-card",
    index: "04",
    name: "HoloCard",
    tag: "WebGL2 · React · 全息箔面卡",
    description:
      "一张会跟着鼠标倾斜、表面覆着彩虹全息箔的卡片：爆发、星点、碎片、鎏金等八种箔面花纹，边缘还会迸出六边形闪光。原生 WebGL2 着色器逐像素合成箔光，并用弹簧物理驱动 3D 倾斜与悬停放大。",
    fileName: "HoloCard.tsx",
    code: holoCardSrc,
    Preview: HoloCardLab as ComponentType<Record<string, unknown>>,
    previewProps: {
      image:
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNjAiIGhlaWdodD0iNTAyIiB2aWV3Qm94PSIwIDAgMzYwIDUwMiI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjN2I0Mzk3Ii8+PHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiMyZjgwZWQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxZmM4ZGIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzYwIiBoZWlnaHQ9IjUwMiIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==",
    },
    hint: "移动鼠标，卡片会朝你倾斜并洒出闪光",
    controls: HOLO_CONTROLS,
  },
  {
    id: "tech-text",
    index: "05",
    name: "TechText",
    tag: "Canvas2D · React · 工程字效",
    description:
      "把一段文字渲染成会呼吸的「工程制图」效果：悬停到字母上会浮出虚线描边、尺寸标注与四角选区，还能拖拽弹动、点击踢一下。原生 Canvas2D 逐字光栅化、弹簧物理与自动巡游，支持打字、拼装、度量三种入场动画。",
    fileName: "TechText.tsx",
    code: techTextSrc,
    Preview: TechText as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "100%" }, text: "React Bits" },
    hint: "移到字母上：描边、标注、选区；可拖拽、点击弹动",
    controls: TECHTEXT_CONTROLS,
  },
  {
    id: "text-loop",
    index: "06",
    name: "TextLoop",
    tag: "SVG · GSAP · 路径文字循环",
    description:
      "把一段文字沿任意路径（波浪、圆环、无穷、拱形、直线）无限循环滚动：可选紫色丝带打底、白字浮于其上，还能叠加一条交叉带并投影。GSAP 驱动时间轴，悬停会减速、可拖拽甩动、滚动页面能给循环加速。",
    fileName: "TextLoop.tsx",
    code: textLoopSrc,
    Preview: TextLoop as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "auto" } },
    hint: "悬停减速、可开启拖拽甩动；切形状看不同路径",
    controls: TEXTLOOP_CONTROLS,
  },
  {
    id: "particle-text",
    index: "07",
    name: "ParticleText",
    tag: "Canvas2D · React · 粒子文字",
    description:
      "把一段文字拆成成千上万个发光粒子：挂载时从四散聚拢成字，鼠标掠过会被排斥、点击会爆裂飞散，待机时轻轻漂浮。原生 Canvas2D 逐字光栅采样、按运动热力在浅紫到橙红之间着色，并带辉光叠加。",
    fileName: "ParticleText.tsx",
    code: particleTextSrc,
    Preview: ParticleText as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "100%" }, text: "React Bits" },
    hint: "鼠标推开粒子、点击爆裂；切入场看聚拢/下落/螺旋/扫描",
    controls: PARTICLE_CONTROLS,
  },
  {
    id: "split-flap-text",
    index: "08",
    name: "SplitFlapText",
    tag: "DOM · React · 翻牌时钟",
    description:
      "一块像机场航班屏的翻牌显示器：字符逐格翻转、随机滚动几下再落定，多段文字之间自动循环轮播。纯 DOM + CSS 3D 翻转实现，立体牌面带铰链阴影，也提供极简线框样式。",
    fileName: "SplitFlapText.tsx",
    code: splitFlapTextSrc,
    Preview: SplitFlapText as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "100%" } },
    hint: "看它自动翻页；切样式/顺序/字符集看不同效果",
    controls: SPLITFLAP_CONTROLS,
  },
  {
    id: "warp-text",
    index: "09",
    name: "WarpText",
    tag: "WebGL · OGL · 液态文字",
    description:
      "基于 OGL 的实时着色器扭曲文字：把文字先光栅化到纹理，再用噪声场与鼠标透镜（凸起 / 凹陷 / 漩涡）做流体般的弯曲、折射与色散。悬停有涟漪、点击有冲击波，入场带液态揭示。",
    fileName: "WarpText.tsx",
    code: warpTextSrc,
    Preview: WarpText as ComponentType<Record<string, unknown>>,
    previewProps: { style: { width: "100%", height: "100%" }, text: "Bend the moment" } as Record<string, unknown>,
    hint: "移动鼠标拨动墨面；点击激起冲击波；切透镜看不同形变",
    controls: WARP_CONTROLS,
  },
  {
    id: "depth-text",
    index: "10",
    name: "DepthText",
    tag: "DOM · CSS3D · 立体镂空字",
    description:
      "把一段文字沿 Z 轴复制成几十层、逐层推远成实心立体字：正面亮、背面深，可渐变成半透明镂空，还能随鼠标自由转向、自动环绕、悬停推近或轻轻漂浮。纯 DOM + CSS 3D 变换实现，弹簧物理驱动，零依赖。",
    fileName: "DepthText.tsx",
    code: depthTextSrc,
    Preview: DepthText as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "Elevate",
      fontSize: "5rem",
    } as Record<string, unknown>,
    hint: "移动鼠标让它转向；开漂浮/推入看不同手感",
    controls: DEPTH_CONTROLS,
  },
  {
    id: "echo-text",
    index: "11",
    name: "EchoText",
    tag: "DOM · React · 运动拖尾字",
    description:
      "把一段文字复制成十几层半透明残影，像高速运动留下的拖尾：随指针方向甩出、入场时从一侧滑入、点击在落点炸开一圈涟漪。纯 DOM + 位移变换实现，按距离衰减透明度与模糊，自动避让 reduce-motion，零依赖。",
    fileName: "EchoText.tsx",
    code: echoTextSrc,
    Preview: EchoText as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "Motion Echo",
      fontSize: "4.5rem",
    } as Record<string, unknown>,
    hint: "移动鼠标把字甩出拖尾；点击在落点炸开一圈",
    controls: ECHO_CONTROLS,
  },
  {
    id: "split-text",
    index: "12",
    name: "SplitText",
    tag: "GSAP · SplitText · 逐字揭示",
    description:
      "基于 GSAP（ScrollTrigger + SplitText + useGSAP）的逐字揭示：把标题拆成字符/单词/行，按错峰顺序升起、淡入、翻转、弹出、波浪般涌出，可随滚动入场、悬停/点击循环，还能让字符在指针下抬升或荡起波纹。",
    fileName: "SplitText.tsx",
    code: splitTextSrc,
    Preview: SplitText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "Split Reveal",
    } as Record<string, unknown>,
    hint: "滚动到此处看它逐字升起；切特效/触发方式看不同节奏",
    controls: SPLITTEXT_CONTROLS,
  },
  {
    id: "blur-text",
    index: "13",
    name: "BlurText",
    tag: "Motion · 模糊渐显",
    description:
      "基于 Framer Motion（motion/react）的逐词/逐字模糊渐显：文字从虚到实、从远到近、倾斜翻入或漂移滑入，可随滚动入场、悬停/点击循环，还能让字符在指针下抬升或荡起波纹。",
    fileName: "BlurText.tsx",
    code: blurTextSrc,
    Preview: BlurText as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "Blur Reveal",
      className: "blur-text-lab",
    } as Record<string, unknown>,
    hint: "滚动到此处看它由虚到实；切特效/触发方式看不同节奏",
    controls: BLUR_CONTROLS,
  },
  {
    id: "circular-text",
    index: "14",
    name: "CircularText",
    tag: "Motion · 旋转环字",
    description:
      "基于 Framer Motion（motion/react）的旋转环形文字：把一段文字绕圆圈排布并匀速旋转，悬停可加速/减速/暂停/疯转，还能拖拽甩动、倾斜透视、内嵌中心内容或描出圆环。带惯性甩动与 reduced-motion 兜底。",
    fileName: "CircularText.tsx",
    code: circularTextSrc,
    Preview: CircularText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "CIRCULAR TEXT EFFECT · ",
    } as Record<string, unknown>,
    hint: "悬停看它加速旋转；开可拖拽可甩动它",
    controls: CIRCULAR_CONTROLS,
  },
  {
    id: "text-type",
    index: "15",
    name: "TextType",
    tag: "GSAP · 打字机文字",
    description:
      "一个带光标、会逐字打出来的打字机文字：支持多句循环、退格/选中两种删除、停错字再改对的俏皮效果，以及淡入/模糊/升起三种逐字入场。光标可切换字符、竖条、方块、下划线四种样式，并带滑移、闪烁与 reduced-motion 兜底，由 GSAP 驱动。",
    fileName: "TextType.tsx",
    code: textTypeSrc,
    Preview: TextType as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: ["Design", "Animate", "Delight"],
      style: { fontSize: "2.4rem", fontWeight: 700, color: "#eef1ff", letterSpacing: "0.02em" },
    } as Record<string, unknown>,
    hint: "看它逐字打出三句话；切光标样式/入场特效看不同手感",
    controls: TEXTTYPE_CONTROLS,
  },
  {
    id: "shuffle",
    index: "16",
    name: "Shuffle",
    tag: "GSAP · 字符洗牌文字",
    description:
      "一行会「洗牌」显形的文字：每个字符从一堆随机乱码里滑入、翻转或模糊地定格成目标字母，支持左右上下四个方向、奇偶/顺序/中心/随机四种出场次序，以及滑入、翻转、模糊三种效果。鼠标悬停可重新洗牌，还可叠加运动模糊与起止渐变色，由 GSAP 的 SplitText + ScrollTrigger 驱动。",
    fileName: "Shuffle.tsx",
    code: shuffleSrc,
    Preview: Shuffle as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "SHUFFLE ME",
      playOnMount: true,
      style: { fontSize: "2.6rem", fontWeight: 700, letterSpacing: "0.04em" },
    } as Record<string, unknown>,
    hint: "加载即洗牌显形；把鼠标移到文字上可再洗一次；切方向与效果看不同手感",
    controls: SHUFFLE_CONTROLS,
  },
  {
    id: "shiny-text",
    index: "17",
    name: "ShinyText",
    tag: "CSS · React · 流光描金字",
    description:
      "一行会不断扫过一道金属流光的文字：底色与高光沿任意角度在字符间滑过，可叠加柔光晕、多道并列光带与柔化边缘，并切换平滑 / 线性 / 锐利三种缓动，以及自动循环、悬停触发、进入视口、指针跟随等模式。纯 Canvas 取色 + 渐变裁剪 + requestAnimationFrame 驱动，零依赖。",
    fileName: "ShinyText.tsx",
    code: shinyTextSrc,
    Preview: ShinyText as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "SHINY TEXT",
      style: { fontSize: "2.6rem", fontWeight: 700, letterSpacing: "0.06em" },
    } as Record<string, unknown>,
    hint: "看文字上一道流光不停扫过；切方向 / 触发方式 / 缓动看不同节奏",
    controls: SHINYTEXT_CONTROLS,
  },
  {
    id: "text-pressure",
    index: "18",
    name: "TextPressure",
    tag: "React · 可变字体 · 鼠标压感文字",
    description:
      "一行随鼠标位置实时变形的文字：靠近光标的字符被「压」得更宽、更重、更斜，离开则缓缓回弹。基于 Roboto Flex 可变字体的 wght / wdth / ital 轴逐字驱动，支持描边、透明度渐隐、纵向拉伸，以及空闲时的波浪 / 呼吸律动与点击涟漪。",
    fileName: "TextPressure.tsx",
    code: textPressureSrc,
    Preview: TextPressure as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "PRESSURE",
    } as Record<string, unknown>,
    hint: "移动鼠标掠过文字，字符会被光标压扁；点一下试试涟漪",
    controls: TEXTPRESSURE_CONTROLS,
  },
  {
    id: "curved-loop",
    index: "19",
    name: "CurvedLoop",
    tag: "React · SVG · 沿路径滚动的文字",
    description:
      "一行文字沿着弧线 / 波浪 / 圆环 / 直线路径无限滚动：支持鼠标拖拽甩动、悬停暂停、随页面滚动加速，以及描边轮廓、边缘渐隐、分隔符着色等效果。基于 SVG textPath 逐字排版，纯 React 零依赖。",
    fileName: "CurvedLoop.tsx",
    code: curvedLoopSrc,
    Preview: CurvedLoop as ComponentType<Record<string, unknown>>,
    previewProps: {
      marqueeText: "CURVED LOOP",
    } as Record<string, unknown>,
    hint: "文字沿弧线滚动；用鼠标按住拖一下可以甩动它",
    controls: CURVEDLOOP_CONTROLS,
  },
  {
    id: "fuzzy-text",
    index: "20",
    name: "FuzzyText",
    tag: "React · Canvas · 撕裂模糊文字",
    description:
      "一行文字用 Canvas 逐帧重绘成「撕裂 + 抖动」的故障质感：可随悬停增强、点击爆发，也能常驻或走故障/入场动画，还支持 RGB 色彩分离与渐变填充。纯 Canvas 2D，无第三方依赖。",
    fileName: "FuzzyText.tsx",
    code: fuzzyTextSrc,
    Preview: FuzzyText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      children: "FUZZY TEXT",
    } as Record<string, unknown>,
    hint: "默认随悬停加剧模糊；开「故障模式」会周期性抖动；点一下试试",
    controls: FUZZYTEXT_CONTROLS,
  },
  {
    id: "gradient-text",
    index: "21",
    name: "GradientText",
    tag: "React · CSS 渐变流光字",
    description:
      "一行文字被填充成循环流动的渐变：支持线性 / 流体 / 锥形三种变体，可随指针跟随、悬停暂停，还能加描边边框与辉光。纯 CSS 自定义属性驱动，零依赖。",
    fileName: "GradientText.tsx",
    code: gradientTextSrc,
    Preview: GradientText as ComponentType<Record<string, unknown>>,
    previewProps: {
      children: "GRADIENT",
    } as Record<string, unknown>,
    hint: "渐变在流动；切变体看不同质感，开「指针跟随」移动鼠标试试",
    controls: GRADIENTTEXT_CONTROLS,
  },
  {
    id: "falling-text",
    index: "22",
    name: "FallingText",
    tag: "React · Matter.js · 物理掉落文字",
    description:
      "文字被拆成词/字块，用 Matter.js 物理引擎做重力掉落、弹跳、堆叠、拖拽与指针推挤，可配置重力、弹性、散开、次序与主题。基于真实刚体模拟。",
    fileName: "FallingText.tsx",
    code: fallingTextSrc,
    Preview: FallingText as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "Falling Words",
      fontSize: "2.6rem",
    } as Record<string, unknown>,
    hint: "文字入框即掉落堆叠；拖拽可甩动，移动鼠标能推开字块",
    controls: FALLINGTEXT_CONTROLS,
  },
  {
    id: "text-cursor",
    index: "23",
    name: "TextCursor",
    tag: "React · 鼠标轨迹碎字",
    description:
      "跟随鼠标轨迹拖出一条由文字组成的尾巴：可盖章、连成链条，或绕成一条流动丝带，支持方向跟随、随机漂浮与自动消失。纯 DOM + requestAnimationFrame。",
    fileName: "TextCursor.tsx",
    code: textCursorSrc,
    Preview: TextCursor as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "CURSOR",
      fontSize: 30,
    } as Record<string, unknown>,
    hint: "在框内移动鼠标，看文字尾巴跟随拖出；切样式看不同轨迹",
    controls: TEXTCURSOR_CONTROLS,
  },
  {
    id: "decrypted-text",
    index: "24",
    name: "DecryptedText",
    tag: "React · Motion · 解密文字",
    description:
      "文字从随机乱码逐字「解密」成目标词句：支持乱码 / 翻转 / 淡入三种效果，可顺序或随机揭示、循环播放、悬停/进入视图/点击触发，还能叠加 RGB 乱码色与指针半径加热。基于 Motion 的逐帧动画。",
    fileName: "DecryptedText.tsx",
    code: decryptedTextSrc,
    Preview: DecryptedText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      text: "Decrypt me",
      animateOn: "hover",
    } as Record<string, unknown>,
    hint: "把鼠标移到文字上，看它从乱码里解密出来",
    controls: DECRYPTEDTEXT_CONTROLS,
  },
  {
    id: "true-focus",
    index: "25",
    name: "TrueFocus",
    tag: "React · Motion · 焦点游走",
    description:
      "一组词里，焦点框会自动游走或用括号/方框/下划线/高亮标出当前词，并让其它词失焦模糊。基于 Motion 的布局测量与过渡。",
    fileName: "TrueFocus.tsx",
    code: trueFocusSrc,
    Preview: TrueFocus as ComponentType<Record<string, unknown>>,
    previewProps: {
      sentence: "True Focus",
    } as Record<string, unknown>,
    hint: "焦点框在词之间自动游走；切「焦点样式」看不同高亮",
    controls: TRUEFOCUS_CONTROLS,
  },
  {
    id: "scroll-float",
    index: "26",
    name: "ScrollFloat",
    tag: "React · GSAP · 滚动浮起文字",
    description:
      "文字随页面滚动逐字浮起/翻转/飞散/模糊/波浪涌出，可拆字或拆词、控制方向、顺序与色彩迁移。基于 GSAP ScrollTrigger 的滚动驱动时间线。",
    fileName: "ScrollFloat.tsx",
    code: scrollFloatSrc,
    Preview: ScrollFloat as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      children: "Scroll Float",
    } as Record<string, unknown>,
    hint: "滚动本页看文字逐字浮起；切「效果」看不同入场",
    controls: SCROLLFLOAT_CONTROLS,
  },
  {
    id: "scroll-reveal",
    index: "27",
    name: "ScrollReveal",
    tag: "React · GSAP · 滚动揭示文字",
    description:
      "文字随滚动逐词/逐字淡入、升起、翻转或缩放揭示，可配置模糊、基础透明、旋转、高亮与拆分粒度，支持滚动擦除或进入即播放两种模式。基于 GSAP ScrollTrigger。",
    fileName: "ScrollReveal.tsx",
    code: scrollRevealSrc,
    Preview: ScrollReveal as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      children: "Scroll Reveal",
    } as Record<string, unknown>,
    hint: "滚动本页看文字逐段揭示；切「效果」与「模式」看不同节奏",
    controls: SCROLLREVEAL_CONTROLS,
  },
  {
    id: "scrambled-text",
    index: "28",
    name: "ScrambledText",
    tag: "React · GSAP · 乱码解密文字",
    description:
      "文字平时正常显示，鼠标掠过或点击会在指针半径内逐字乱码解密、浮起、模糊或放大，并叠加点击爆发波。基于 GSAP SplitText 拆字与 ScrambleTextPlugin 逐帧解密，另有入场自动解密。",
    fileName: "ScrambledText.tsx",
    code: scrambledTextSrc,
    Preview: ScrambledText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      children: "Scrambled Text",
    } as Record<string, unknown>,
    hint: "鼠标在文字上移动看逐字解密；点击触发爆发波",
    controls: SCRAMBLEDTEXT_CONTROLS,
  },
  {
    id: "rotating-text",
    index: "29",
    name: "RotatingText",
    tag: "React · Motion · 轮播旋转文字",
    description:
      "一组词之间循环旋转切换：支持滑入、翻转、模糊、缩放、坠落五种入场，可拆字/词/行、控制方向、错峰、高亮块与悬停暂停。基于 Motion 的 AnimatePresence 过渡。",
    fileName: "RotatingText.tsx",
    code: rotatingTextSrc,
    Preview: RotatingText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      texts: ["React", "Motion", "Rotate", "Words"],
    } as Record<string, unknown>,
    hint: "文字自动轮播；切「效果」看不同入场，开「高亮块」看背景块",
    controls: ROTATINGTEXT_CONTROLS,
  },
  {
    id: "glitch-text",
    index: "30",
    name: "GlitchText",
    tag: "React · CSS · 故障文字",
    description:
      "文字做故障/故障率失真效果：切片错位、RGB 色散、扫描线、噪点替换四种模式，可调节强度、速度、偏移、倾斜与点击爆发，并支持常驻/悬停/点击触发。纯 CSS 遮罩 + rAF 驱动。",
    fileName: "GlitchText.tsx",
    code: glitchTextSrc,
    Preview: GlitchText as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      children: "GLITCH",
    } as Record<string, unknown>,
    hint: "文字持续故障；切「模式」看切片/RGB/扫描/噪点，点击触发爆发",
    controls: GLITCHTEXT_CONTROLS,
  },
  {
    id: "scroll-velocity",
    index: "31",
    name: "ScrollVelocity",
    tag: "React · Motion · 滚动速度文字",
    description:
      "多行文字以基础速度持续横向滚动，滚动视口的快慢会让文字加速、倾斜或缩放；支持悬停暂停与拖拽抛掷。基于 Motion 的 useScroll / useVelocity / useSpring 实时计算。",
    fileName: "ScrollVelocity.tsx",
    code: scrollVelocitySrc,
    Preview: ScrollVelocity as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      texts: ["Velocity", "Scroll", "Motion", "Velocity", "Scroll", "Motion"],
    } as Record<string, unknown>,
    hint: "文字持续滚动；鼠标拖拽可抛掷，滚动页面会加速",
    controls: SCROLLVELOCITY_CONTROLS,
  },
  {
    id: "variable-proximity",
    index: "32",
    name: "VariableProximity",
    tag: "React · 可变字体 · 临近变形",
    description:
      "文字随鼠标靠近逐字改变字重/字距/颜色与浮起幅度，形成「注视处变粗变亮」的可变字体视差；支持闲置波浪。依赖 Roboto Flex 可变字体。",
    fileName: "VariableProximity.tsx",
    code: variableProximitySrc,
    Preview: VariableProximity as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {
      label: "Variable Proximity",
    } as Record<string, unknown>,
    hint: "把鼠标移到文字附近，注视处字体会变粗变亮并浮起",
    controls: VARIABLEPROXIMITY_CONTROLS,
  },
  {
    id: "crystalized-ball",
    index: "33",
    name: "CrystalizedBall",
    tag: "React · WebGL(ogl) · 水晶球",
    description:
      "用 ogl 在 WebGL 中实时渲染一颗能量水晶球：内部光丝缠绕、弧光游走、粒子尘埃升腾，并随鼠标交互爆发电弧。提供 8 种预设与暗/亮主题，可调辉光、裂纹、雾感等。",
    fileName: "CrystalizedBall.tsx",
    code: crystalizedBallSrc,
    Preview: CrystalizedBall as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {} as Record<string, unknown>,
    hint: "鼠标移入球内会聚光、点击触发电弧爆发；切预设看不同质感",
    controls: CRYSTALIZEDBALL_CONTROLS,
  },
  {
    id: "electric-logo",
    index: "34",
    name: "ElectricLogo",
    tag: "React · WebGL(ogl) · 电光描边 Logo",
    description:
      "用 ogl 在 WebGL 里把任意图片（默认一道闪电）实时描成电光轮廓：边缘电丝游走、弧光随机游走、点击迸发电弧，并随鼠标聚光。基于距离场追踪、快速行进与噪声形变着色器。",
    fileName: "ElectricLogo.tsx",
    code: electricLogoSrc,
    Preview: ElectricLogo as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {} as Record<string, unknown>,
    hint: "鼠标移到闪电上聚光、点击迸发电弧；调主色/辉光色与丝数看变化",
    controls: ELECTRICLOGO_CONTROLS,
  },
  {
    id: "dither-veil",
    index: "35",
    name: "DitherVeil",
    tag: "React · WebGL(ogl) · 抖动揭示影像",
    description:
      "把一张照片做成交互式网屏/误差扩散抖动：鼠标滑过如揭开面纱，可切换 Bayer、蓝噪声、雕刻线、Atkinson、Floyd 多种图案，并支持余留、游移与点击冲击波。原生 ogl 双通道渲染。",
    fileName: "DitherVeil.tsx",
    code: ditherVeilSrc,
    Preview: DitherVeil as unknown as ComponentType<Record<string, unknown>>,
    // Pin an offline-safe data-URI image so the dither reveal works without the
    // external Unsplash default (which would 404/console-error in a sandbox).
    previewProps: {
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1037"/><stop offset="0.55" stop-color="#7b2f8f"/><stop offset="0.8" stop-color="#e8633f"/><stop offset="1" stop-color="#ffd35e"/></linearGradient></defs><rect width="240" height="160" fill="url(#g)"/><circle cx="120" cy="92" r="34" fill="#fff2b0" opacity="0.92"/></svg>'
      )}`
    } as Record<string, unknown>,
    hint: "鼠标在画面上划过揭开抖动影像；切图案看 Bayer/Floyd/线条等",
    controls: DITHERVEIL_CONTROLS,
  },
  {
    id: "glow-cursor",
    index: "36",
    name: "GlowCursor",
    tag: "React · WebGL2 · 流体辉光光标",
    description:
      "用原生 WebGL2 流体模拟（平流、压力投影、MacCormack 校正、泛光）把鼠标拖尾渲染成发光的流体光迹，点击迸发喷射。支持暗/亮主题、强度、轨迹宽度与画质档位。",
    fileName: "GlowCursor.tsx",
    code: glowCursorSrc,
    Preview: GlowCursor as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {} as Record<string, unknown>,
    hint: "在框内移动鼠标拉出发光流体；点击迸发喷射，调主题看明暗差异",
    controls: GLOWCURSOR_CONTROLS,
  },
  {
    id: "ripple-distortion",
    index: "37",
    name: "RippleDistortion",
    tag: "React · WebGL(ogl) · 波纹扭曲影像",
    description:
      "鼠标划过或点击照片时，水波般的位移场把图像推挤、旋拧、色散并泛起高光，像在水面下搅动一张图。原生 ogl 实例化波纹 + 合成着色器，可调染色、漩涡、色散与高光。",
    fileName: "RippleDistortion.tsx",
    code: rippleDistortionSrc,
    Preview: RippleDistortion as unknown as ComponentType<Record<string, unknown>>,
    // Pin an offline-safe SVG so the ripple distortion works without the external
    // Unsplash default (which would 404/console-error in a sandbox).
    previewProps: {
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1037"/><stop offset="0.5" stop-color="#6a2ea0"/><stop offset="0.8" stop-color="#e8633f"/><stop offset="1" stop-color="#ffd35e"/></linearGradient></defs><rect width="240" height="160" fill="url(#g)"/><circle cx="120" cy="86" r="30" fill="#ffffff" opacity="0.92"/></svg>'
      )}`
    } as Record<string, unknown>,
    hint: "在画面上移动或点击，搅起波纹扭曲；调强度/漩涡/色散看变化",
    controls: RIPPLE_CONTROLS,
  },
  {
    id: "elastic-mesh",
    index: "38",
    name: "ElasticMesh",
    tag: "React · WebGL2 · 弹性网格文字/图标",
    description:
      "一段文字或图标被铺成弹性网格，可被拉扯、戳压、揉捏，带气球/镜面/果冻/黏土四种材质与入场聚拢动画。原生 WebGL2 物理网格 + 距离场渲染。",
    fileName: "ElasticMesh.tsx",
    code: elasticMeshSrc,
    Preview: ElasticMesh as unknown as ComponentType<Record<string, unknown>>,
    previewProps: {} as Record<string, unknown>,
    hint: "在框内按下并拖拽揉捏；切换材质看气球/镜面/果冻/黏土",
    controls: ELASTIC_CONTROLS,
  },
];

export function LabPage() {
  const [active, setActive] = useState(ENTRIES[0]?.id ?? "");
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [progressOpen, setProgressOpen] = useState(true);
  const [progress, setProgress] = useState({ pct: 0, current: 1 });
  const mainRef = useRef<HTMLElement | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    mainRef.current = document.getElementById("main");
  }, []);

  // Track reading progress through the lab entries inside the #main scroll
  // container: overall scroll percentage + which module is currently on top.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const update = () => {
      const max = main.scrollHeight - main.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (main.scrollTop / max) * 100)) : 0;
      const mainRect = main.getBoundingClientRect();
      let current = 1;
      for (let i = 0; i < ENTRIES.length; i++) {
        const el = document.getElementById(`lab-${ENTRIES[i].id}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - mainRect.top <= mainRect.height * 0.35) current = i + 1;
      }
      setProgress({ pct, current });
    };
    update();
    main.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      main.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Hovering a nav item opens a floating preview popover (it does NOT scroll /
  // jump the page). The popover shows the live component so you can peek the
  // whole effect without losing your place in the list. A short hide delay lets
  // the pointer travel from the nav item into the popover.
  const showFlyout = (id: string, el: HTMLElement) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    const r = el.getBoundingClientRect();
    const w = 372;
    const h = 296;
    let left = r.right + 14;
    if (left + w > window.innerWidth - 12) left = Math.max(12, r.left - w - 14);
    let top = Math.min(r.top, window.innerHeight - h - 12);
    top = Math.max(12, top);
    setHover({ id, x: left, y: top });
  };
  const scheduleHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHover(null), 160);
  };
  const cancelHide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  };

  // Close the popover on scroll — its fixed position would otherwise go stale.
  useEffect(() => {
    if (!hover) return;
    const main = mainRef.current;
    const close = () => setHover(null);
    main?.addEventListener("scroll", close, { passive: true });
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      main?.removeEventListener("scroll", close);
      window.removeEventListener("scroll", close);
    };
  }, [hover]);

  // Clicking a nav item still jumps to the full entry.
  const revealEntry = (id: string) => {
    const el = document.getElementById(`lab-${id}`);
    const main = mainRef.current;
    if (!el || !main) return;
    const elRect = el.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const offset = elRect.top - mainRect.top + main.scrollTop - 16;
    main.scrollTo({ top: offset, behavior: "smooth" });
  };
  const choose = (id: string) => {
    setActive(id);
    revealEntry(id);
  };

  const flyoutEntry = hover ? ENTRIES.find((e) => e.id === hover.id) : null;

  return (
    <div className="lab-page">
      <header className="lab-head">
        <p className="lab-eyebrow">COMPONENT LAB · 组件实验室</p>
        <h1 className="lab-title">把玩这些会动的小东西</h1>
        <p className="lab-intro">
          左边是实时渲染的效果预览，右边是它完整的组件源码。把鼠标移到左侧目录上即可呼出悬浮预览窗看效果，点击目录则跳到对应卡片；拖动卡片下方的滑块即可实时调整参数、观察变化，也可以直接把代码复制走。
        </p>
      </header>

      <div className="lab-layout">
        <aside className="lab-nav" aria-label="组件目录">
          <button
            type="button"
            className="lab-nav__progress-toggle"
            aria-expanded={progressOpen}
            onClick={() => setProgressOpen((v) => !v)}
          >
            <span className="lab-nav__progress-label">
              阅读进度 · 第 {progress.current}/{ENTRIES.length}
            </span>
            <span className="lab-nav__progress-pct">{Math.round(progress.pct)}%</span>
            <span className={`lab-nav__chevron${progressOpen ? " is-open" : ""}`} aria-hidden="true">
              ▾
            </span>
          </button>
          <div className={`lab-nav__progress-panel${progressOpen ? " is-open" : ""}`}>
            <div className="lab-nav__progress-track">
              <div className="lab-nav__progress-fill" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>

          <p className="lab-nav__title">组件目录</p>
          <nav className="lab-nav__list">
            {ENTRIES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`lab-nav__item${entry.id === active ? " is-active" : ""}`}
                aria-current={entry.id === active ? "true" : undefined}
                onMouseEnter={(e) => showFlyout(entry.id, e.currentTarget)}
                onMouseLeave={scheduleHide}
                onClick={() => choose(entry.id)}
              >
                <span className="lab-nav__no">{entry.index}</span>
                <span className="lab-nav__name">{entry.name}</span>
                <span className="lab-nav__tag">{entry.tag}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="lab-list">
          {ENTRIES.map((entry) => (
            <LabEntry
              key={entry.id}
              entry={entry}
              isActive={entry.id === active}
              onActivate={() => setActive(entry.id)}
            />
          ))}
        </div>
      </div>

      {flyoutEntry && (
        (() => {
          const Preview = flyoutEntry.Preview;
          return (
            <div
              className="lab-flyout"
              style={{ left: hover!.x, top: hover!.y }}
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
              role="dialog"
              aria-label={`${flyoutEntry.name} 预览`}
            >
              <div className="lab-flyout__head">
                <span className="lab-flyout__no">{flyoutEntry.index}</span>
                <span className="lab-flyout__name">{flyoutEntry.name}</span>
                <span className="lab-flyout__tag">{flyoutEntry.tag}</span>
              </div>
              <div className="lab-flyout__frame">
                <PreviewBoundary name={flyoutEntry.name}>
                  <Preview {...(flyoutEntry.previewProps ?? {})} />
                </PreviewBoundary>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
