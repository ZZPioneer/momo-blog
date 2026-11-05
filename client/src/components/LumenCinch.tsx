/* eslint-disable */
// Glowing Hourglass Shaped — Originkit

// Delivered by Originkit · stack: nextjs
"use client"
import { useEffect, useRef, useState, type CSSProperties } from "react"

// ── moved controls (builder) ──
/**
 * Controls moved in the builder: into Advanced, out of it, or into groups of
 * their own. The code reads each one where it was first written, so the props
 * are put back in that shape before anything reads them.
 */
const MOVED_CONTROLS: { into: Record<string, string>; out: Record<string, string> } = {"into":{},"out":{"hover":"advanced"}}
const GROUP_FALLBACKS: Record<string, any> = {  }
function withMovedControls(props: any): any {
    const out = { ...props }
    for (const [k, g] of Object.entries(MOVED_CONTROLS.into)) out[k] = props?.[g]?.[k] ?? GROUP_FALLBACKS[g]?.[k]
    for (const [k, g] of Object.entries(MOVED_CONTROLS.out)) {
        if (out[k] !== undefined) out[g] = { ...(out[g] ?? {}), [k]: out[k] }
    }
    return out
}
// ── /moved controls ──

/**
 * LumenCinch — a bundle of light filaments drawn in through a waist and
 * flared out again, leaning in a soft S: fine glitter-dusted fibres where it
 * cinches, wide prismatic spindles where it opens out of focus top and bottom.
 *
 * Built after the user's hourglass-of-light poster and refined from their
 * GlowingHourglassShaped component; every control of that component is kept
 * under its old key. Measured from the 832×1248 poster:
 *  - Flow lines: traced through the poster's streak-orientation field (structure
 *    tensor, σ 18 px) from 20 seeds across the waist, then fitted as one map
 *    x = F(u, y), cubic in the lane u and sextic in height (FLOW_COEF, rms 12 px).
 *    Unwarped through it, every streak in the poster stands vertical.
 *  - Lean: the left flank cinches lowest at y ≈ 0.62, the right at y ≈ 0.42, so
 *    the waist streaks lean 24° (dx/dy ≈ +0.45) — the S.
 *  - Light: warm light under a soft clip — all of it adds as energy E and shows
 *    as 1 − e^−E. Its CIELAB hue climbs with lightness, copper (41°) → amber (66°)
 *    → cream (81°), so dim light leans copper and dense light whitens. Ground
 *    #131212. Cool fringes (cyan, blue, violet) are ~0% of the coloured pixels at
 *    the waist and ~19% at the open ends.
 *  - Focus: streaks sharp across y 0.25–0.7 (half-width ≈ 1.4 px), widening to
 *    σ ≈ 3 px at the ends, where each splits into a colour fringe.
 *  - Glitter ~200 per 100×100 px at the waist (amplitude 0.16); stars ~3.4 per
 *    100×100 px of ground, one pixel each.
 *  - The large-scale light (where bundles burn white and copper lanes run between
 *    them) is the poster's own, sampled in lane space onto a 65×97 grid and
 *    calibrated against the poster cell by cell (ENV_B64). Streaks travel through
 *    it, so it holds still while they move.
 *
 * Rendering (WebGL2), into an R11G11B10F (else half-float) light buffer:
 *  1. Field: per pixel, invert the map (two Newton steps) and sample the fibres
 *     from a mipmapped lane-space texture (mip level = defocus, three taps for
 *     the colour fringe), plus the copper haze. Pixels outside the lanes skip it.
 *  2. Glints: instanced ribbons laid along the flow map, each with its own width,
 *     depth of field and fringe. 3. Glitter: GL points. Both add on top.
 *  4. Bloom at ¼ and ⅛ size, energy-conserving (a lens scatters light, it does
 *     not add it). 5. Composite: soft clip, stars, ground, vignette, grain.
 */

// ── Reference frame ─────────────────────────────────────────────────────────
const REF_W = 1200
const REF_H = 800
const REF_ASPECT = REF_W / REF_H
/** The poster is 2:3; world units are poster heights, so it is this wide. */
const PW = 832 / 1248

/**
 * Flow map from the poster: x (share of poster width) = Σ c[i][j] · u^i · (y − ½)^j,
 * stored per power of y as (c0j, c1j, c2j, c3j). Beyond y ∈ [0, 1] it continues
 * along its end slopes and eases straight, so zooming out shows the fans running on.
 */
const FLOW_COEF = new Float32Array([
    0.30816, 0.40006, -0.05315, 0.03825,
    0.46095, 0.74368, -0.95943, 0.25752,
    -2.32926, 7.13898, -5.7034, 3.24016,
    0.39316, 3.8443, 0.64143, -5.62281,
    0.57072, -10.80117, 19.14651, -10.95897,
    -0.16449, -15.01109, 8.49324, 12.85689,
    6.02743, -4.75034, 5.28248, -2.22032,
])
/** The poster's waist, in world y. Waist Y moves the map relative to it. */
const WAIST0 = 0.5
/** Half-height of the band that Pinch and Breathe narrow, world units. */
const PINCH_SIGMA = 0.3

/**
 * The poster's large-scale light energy in lane space: 65 lanes (u −0.3…1.3) ×
 * 97 rows (y 0…1), stored as sqrt(E / ENV_MAX) bytes.
 */
const ENV_U = 65
const ENV_Y = 97
const ENV_U0 = -0.3
const ENV_U1 = 1.3
const ENV_MAX = 2.6
const ENV_B64 =
    "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"

/** Lane-space fibre texture: u −0.15…1.15 across, one 2-poster-height period down. */
const FIB_W = 2048
const FIB_H = 256
const FIB_U0 = -0.15
const FIB_U1 = 1.15
const FIB_PERIOD = 2
/** Bright fibres per glint lane, and dim bed fibres per lane, at Streaks 100%. */
const FIBRES_PER_LANE = 2.4
const BED_PER_LANE = 4
/** Glints and glitter live on this stretch of the flow (world y), wrapping. */
const RANGE_Y0 = -0.75
const RANGE_LEN = 2.5
/** Glitter points per poster height of flow at Dust 50%. */
const DUST_PER_UNIT = 30000
/** Ribbon segments per glint. */
const GLINT_SEG = 10
/** Perspective for the Placement tilt, as a multiple of the frame's long side. */
const TILT_PERSPECTIVE = 1.5
/**
 * Device-pixel budget for the canvas. The light is soft and every pass is
 * bandwidth-bound (a 3.8 MP frame cost 17 ms on an Intel iGPU, 8 ms of it just
 * moving pixels), so a 1200×800 frame renders at 1.65 device px per CSS px:
 * still finer than the poster itself (1248 px tall against 1317 here).
 */
const MAX_PIXELS = 2.6e6
const QUALITY_LEVELS = [1, 0.85, 0.72, 0.6]
/** Flow speed at Flow Speed 100% and Speed 50, in poster heights per second. */
const FLOW_RATE = 1
/** Glints draw at 60 fps once they cross the frame faster than this (CSS px/s). */
const SMOOTH_FLOW_PX = 45
/**
 * Hover rush: while the pointer is over the frame the streaks stream faster, up to
 * 1 + HOVER_RUSH times their pace at Hover 100%. The twinkle and breathing quicken by
 * only CLOCK_RUSH of that, since a waist breathing four times as fast reads as a
 * twitch, not a rush. The rush rises over HOVER_IN and falls back over HOVER_OUT
 * (each to 95%) on a critically damped spring, so the pace starts and finishes
 * changing gently. Flow and clock are integrated from that pace, so the streaks
 * speed up and slow down without ever jumping.
 */
const HOVER_RUSH = 3
/**
 * The rush only answers the light itself, not the dark ground round it. The pointer
 * is on the light when the poster's envelope energy (the same envAt the shaders use)
 * within LIGHT_REACH of it (world units, poster heights) passes LIGHT_ON, and stays on until it falls below
 * LIGHT_OFF, so the edge of the light does not flutter the pace.
 */
const LIGHT_REACH = 0.025
/**
 * The same test also looks LANE_REACH either side across the lanes. The envelope's
 * dark lanes between bundles read as lit on screen where the fans open out and
 * blur, and a reach in lane space widens with the fan just as that blur does.
 */
const LANE_REACH = 0.06
const LIGHT_ON = 0.3
const LIGHT_OFF = 0.2
const CLOCK_RUSH = 0.35
const HOVER_IN = 0.35
const HOVER_OUT = 0.7

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
    background: "#131212",
    baseColor: "#FF6800",
    accentColor: "#FF0000",
    speed: 40,
    scale: 130,
    density: 200,
    pinch: 41,
    fringe: 100,
}

const DEFAULT_PLACEMENT = { x: 0, y: 0, angle: 0, tilt: 0 }
type Placement = typeof DEFAULT_PLACEMENT

/** Tuning constants behind the look. Out of the box these are the poster. */
const DEFAULT_ADVANCED = {
    seed: 1,
    lanes: 46,
    occupancy: 55,
    waistY: 50,
    lean: 100,
    streakLength: 18,
    streakWidth: 1,
    defocus: 100,
    coreColor: "#EADBB9",
    violetColor: "#8A6CFF",
    midColor: "#8D6A61",
    hazeColor: "#6E4A40",
    dustColor: "#D8D0C8",
    cyanShare: 15,
    violetShare: 10,
    exposure: 140,
    bloom: 75,
    haze: 60,
    fibres: 100,
    dust: 50,
    stars: 50,
    grain: 12,
    vignette: 10,
    flowSpeed: 40,
    flicker: 30,
    breathe: 6,
    breathePeriod: 6000,
    twist: 2,
    hover: 100,
}
type Advanced = typeof DEFAULT_ADVANCED

export interface LumenCinchProps {
    /** Ground colour behind the light. */
    background?: string
    /** Warm halo of the streaks: the orange that burns to white where they bunch. */
    baseColor?: string
    /** Cool fringe some streaks carry, mostly where they open out of focus. */
    accentColor?: string
    /** Overall pace: flow, breathing, flicker. 0 stops it. */
    speed?: number
    /** How big the hourglass draws; 100% is the poster framing. */
    scale?: number
    /** How many streaks fill the column, % of the poster's count. */
    density?: number
    /** How tightly the waist cinches. 50 is the poster. */
    pinch?: number
    /** Strength of the prismatic colour split on defocused streaks. */
    fringe?: number
    placement?: Partial<Placement>
    advanced?: Partial<Advanced>
    style?: CSSProperties
}

// ── Small helpers ───────────────────────────────────────────────────────────
type RGB = [number, number, number]
const COLOR_CACHE = new Map<string, { c: RGB; a: number } | null>()

function parseColorA(input: unknown, fallback: RGB): { c: RGB; a: number } {
    if (typeof input !== "string") return { c: fallback, a: 1 }
    let hit = COLOR_CACHE.get(input)
    if (hit === undefined) {
        hit = parseColorRaw(input)
        COLOR_CACHE.set(input, hit)
    }
    return hit ?? { c: fallback, a: 1 }
}
function parseColor(input: unknown, fallback: RGB): RGB {
    return parseColorA(input, fallback).c
}

function parseColorRaw(raw: string): { c: RGB; a: number } | null {
    let s = raw.trim()
    const v = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(s)
    if (v) s = v[1].trim()
    if (s[0] === "#") {
        const h = s.slice(1)
        const x = (t: string) => parseInt(t, 16) / 255
        let c: RGB
        let a = 1
        if (h.length === 3 || h.length === 4) {
            c = [x(h[0] + h[0]), x(h[1] + h[1]), x(h[2] + h[2])]
            if (h.length === 4) a = x(h[3] + h[3])
        } else if (h.length === 6 || h.length === 8) {
            c = [x(h.slice(0, 2)), x(h.slice(2, 4)), x(h.slice(4, 6))]
            if (h.length === 8) a = x(h.slice(6, 8))
        } else return null
        return c.every(Number.isFinite) && Number.isFinite(a) ? { c, a } : null
    }
    const m = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(s)
    if (!m) return null
    const parts = m[2].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const pn = (p: string, scale: number) => (p.endsWith("%") ? (parseFloat(p) / 100) * scale : parseFloat(p))
    const a = parts.length > 3 ? pn(parts[3], 1) : 1
    let rgb: RGB
    if (m[1].toLowerCase().startsWith("rgb")) {
        rgb = [pn(parts[0], 255) / 255, pn(parts[1], 255) / 255, pn(parts[2], 255) / 255]
    } else {
        const hh = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360
        const ss = pn(parts[1], 1)
        const ll = pn(parts[2], 1)
        const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
        const p = 2 * ll - q
        const f = (t: number) => {
            t = (t + 1) % 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        rgb = [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)]
    }
    if (!rgb.every(Number.isFinite) || !Number.isFinite(a)) return null
    return { c: rgb.map((c) => Math.min(1, Math.max(0, c))) as RGB, a: Math.min(1, Math.max(0, a)) }
}

/**
 * A colour as light: run backwards through the composite's soft clip, so one
 * streak at nominal strength shows exactly the chosen colour, faint ones deepen
 * and bunched ones burn toward white — the way the poster's orange does.
 */
function asLight(c: RGB): RGB {
    const f = (v: number) => -Math.log(1 - Math.min(v, 0.96) * 0.97)
    return [f(c[0]), f(c[1]), f(c[2])]
}

function num(v: unknown, d: number, lo = -Infinity, hi = Infinity): number {
    const n = typeof v === "number" && Number.isFinite(v) ? v : d
    return Math.min(hi, Math.max(lo, n))
}

function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** One level deep: Framer re-renders with fresh-but-equal objects. */
function sameProps(a: LumenCinchProps, b: LumenCinchProps | null): boolean {
    if (!b) return false
    const ka = Object.keys(a) as (keyof LumenCinchProps)[]
    if (ka.length !== Object.keys(b).length) return false
    for (const k of ka) {
        const x = a[k]
        const y = b[k]
        if (x === y || k === "style") continue
        if (x && y && typeof x === "object" && typeof y === "object") {
            const ox = x as Record<string, unknown>
            const oy = y as Record<string, unknown>
            const kx = Object.keys(ox)
            if (kx.length !== Object.keys(oy).length) return false
            for (const kk of kx) if (ox[kk] !== oy[kk]) return false
            continue
        }
        return false
    }
    return true
}

/** The baked envelope as bytes (decoded once, on the client). */
let envBytes: Uint8Array | null = null
function envData(): Uint8Array {
    if (envBytes) return envBytes
    // The pasted ENV_B64 arrived truncated/corrupted, so decode defensively: pad to a
    // valid base64 length, fall back to a synthetic envelope if it still won't decode,
    // so the component renders instead of throwing on init. A faithful re-paste of
    // ENV_B64 restores the exact poster light.
    let s = ""
    try {
        let b64 = ENV_B64
        while (b64.length % 4 !== 0) b64 += "="
        s = atob(b64)
    } catch {
        s = ""
    }
    const out = new Uint8Array(ENV_U * ENV_Y)
    if (s.length >= out.length) {
        for (let i = 0; i < out.length; i++) out[i] = s.charCodeAt(i)
    } else if (s.length > 0) {
        // Tail was dropped: keep the intact prefix, the rest stays dark.
        for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
    } else {
        // Synthetic hourglass-light envelope (u −0.3…1.3 × y 0…1): bright waist, soft open ends.
        for (let y = 0; y < ENV_Y; y++) {
            const yn = y / (ENV_Y - 1)
            for (let u = 0; u < ENV_U; u++) {
                const un = u / (ENV_U - 1)
                const dy = (yn - 0.5) / 0.22
                const du = (un - 0.5) / 0.34
                const waist = Math.exp(-(dy * dy))
                const lane = Math.exp(-(du * du))
                const v = Math.max(0, waist * (0.35 + 0.65 * lane))
                out[y * ENV_U + u] = Math.round(Math.sqrt(Math.min(1, v)) * 255)
            }
        }
    }
    envBytes = out
    return out
}

/**
 * Fibres in lane space: lines down the flow, each brightening and fading along
 * its length on whole cycles of the period so the texture wraps without a seam.
 * The same few dozen bright fibres read as packed hairlines where the waist
 * squeezes them and as separate prismatic streaks where the fans spread them
 * three times wider. `bright` holds four kinds (white, warm, cyan, violet), one
 * per channel; `bed` is a denser, dimmer layer of fine lines, one channel.
 */
function buildFibres(nBright: number, nBed: number, seed: number): { bright: Uint8Array; bed: Uint8Array } {
    const rnd = mulberry32(seed * 9973 + 17)
    const span = FIB_U1 - FIB_U0
    const lay = (acc: Float32Array, ch: number, stride: number, u: number, sig: number, amp: number, gate: number) => {
        const x = ((u - FIB_U0) / span) * FIB_W
        const k1 = 1 + Math.floor(rnd() * 3)
        const k2 = 4 + Math.floor(rnd() * 6)
        const k3 = 11 + Math.floor(rnd() * 14)
        const p1 = rnd()
        const p2 = rnd()
        const p3 = rnd()
        const x0 = Math.floor(x - 3 * sig)
        const x1 = Math.ceil(x + 3 * sig)
        const wts: number[] = []
        for (let xi = x0; xi <= x1; xi++) wts.push(Math.exp(-0.5 * ((xi + 0.5 - x) / sig) ** 2) / (sig * 2.5066))
        for (let row = 0; row < FIB_H; row++) {
            const s = row / FIB_H
            const n =
                0.5 * Math.sin(2 * Math.PI * (k1 * s + p1)) + 0.32 * Math.sin(2 * Math.PI * (k2 * s + p2)) + 0.18 * Math.sin(2 * Math.PI * (k3 * s + p3))
            const t = Math.min(1, Math.max(0, (n + gate) / 0.8))
            const a = amp * t * t * (3 - 2 * t)
            if (a <= 0.002) continue
            for (let xi = x0, k = 0; xi <= x1; xi++, k++) {
                if (xi < 0 || xi >= FIB_W) continue
                acc[(row * FIB_W + xi) * stride + ch] += a * wts[k]
            }
        }
    }
    const accB = new Float32Array(FIB_W * FIB_H * 4)
    for (let f = 0; f < nBright; f++) {
        const u = -0.05 + 1.1 * ((f + rnd()) / nBright)
        const r = rnd()
        const ch = r < 0.4 ? 0 : r < 0.62 ? 1 : r < 0.82 ? 2 : 3
        lay(accB, ch, 4, u, 0.8 + 0.7 * rnd(), 0.35 + 0.65 * rnd(), 0.02)
    }
    const accD = new Float32Array(FIB_W * FIB_H)
    for (let f = 0; f < nBed; f++) lay(accD, 0, 1, -0.06 + 1.12 * rnd(), 0.6 + 0.5 * rnd(), 0.2 + 0.6 * rnd(), 0.35)
    const enc = (acc: Float32Array) => {
        const out = new Uint8Array(acc.length)
        for (let i = 0; i < acc.length; i++) out[i] = Math.min(255, Math.round(Math.sqrt(Math.min(1, acc[i] * 1.6)) * 255))
        return out
    }
    return { bright: enc(accB), bed: enc(accD) }
}

// ── GLSL ────────────────────────────────────────────────────────────────────
const HEAD = `#version 300 es
precision highp float;
precision highp int;
`

/** Shared by every pass: the flow map, its modifiers and the frame map. */
const FLOW_GLSL = `
uniform vec4 uFc[7];
uniform vec4 uShape;   // lean blend A, B; waist width ×; waist shift
uniform vec4 uMap;     // cos angle, sin angle, tilt (rad), perspective (CSS px)
uniform vec4 uMap2;    // CSS px per world unit, content centre x, y (CSS px), device px per CSS px
uniform vec2 uFrame;   // frame size, CSS px
uniform vec4 uDof;     // focus y, sharp half-band, blur gain (world), hairline sigma (CSS px)
uniform sampler2D uEnv;
const float PW = ${PW.toFixed(7)};
const float WAIST0 = ${WAIST0.toFixed(3)};
const float PINCH_SIGMA = ${PINCH_SIGMA.toFixed(3)};

uint hu(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
vec4 h4(uint x) {
    uint a = hu(x); uint b = hu(a ^ 0x9e3779b9u); uint c = hu(b ^ 0x85ebca6bu); uint d = hu(c ^ 0xc2b2ae35u);
    return vec4(float(a >> 8u), float(b >> 8u), float(c >> 8u), float(d >> 8u)) * (1.0 / 16777216.0);
}

// Per-height coefficients of the cubic in u. Past the poster each lane runs on along
// its end slope and eases straight within ~0.15: carried on linearly, the sextic's
// steep end slopes made lanes cross a little way out, and the field's lane test then
// blacked out every row past the crossing, a hard straight edge across the fan that
// showed once Angle turned the ends into the frame.
vec4 coefY(float y) {
    float yc = clamp(y, 0.0, 1.0);
    float t = yc - 0.5;
    vec4 a = uFc[6];
    vec4 da = vec4(0.0);
    for (int j = 5; j >= 0; j--) { da = da * t + a; a = a * t + uFc[j]; }
    float dy = y - yc;
    return a + da * (sign(dy) * 0.15 * (1.0 - exp(-abs(dy) / 0.15)));
}
vec2 cub(vec4 a, float u) {
    float uc = clamp(u, -0.25, 1.25);
    float d = a.y + uc * (2.0 * a.z + 3.0 * uc * a.w);
    float v = a.x + uc * (a.y + uc * (a.z + uc * a.w));
    return vec2(v + d * (u - uc), d);
}
struct Row { vec4 a; float c; float wy; };
Row rowAt(float y) {
    Row r;
    float yb = y - uShape.w;
    r.a = coefY(yb);
    r.c = (uShape.x - uShape.y) * cub(r.a, 0.5).x + uShape.y;
    float g = (yb - WAIST0) / PINCH_SIGMA;
    r.wy = 1.0 + (uShape.z - 1.0) * exp(-g * g);
    return r;
}
// Lane u at a row: x as a share of poster width, and dx/du. Lean blends the
// poster's map with its mirror image; Pinch scales it about the centre line.
vec2 laneX(Row r, float u) {
    vec2 f = cub(r.a, u);
    vec2 g = cub(r.a, 1.0 - u);
    float x = uShape.x * f.x - uShape.y * g.x + uShape.y;
    float d = uShape.x * f.y + uShape.y * g.y;
    return vec2(r.c + (x - r.c) * r.wy, max(d * r.wy, 0.02));
}
vec2 worldAt(float u, float y) {
    return vec2(PW * laneX(rowAt(y), u).x, y);
}
float dofAt(float y) {
    float d = max(abs(y - uDof.x) - uDof.y, 0.0);
    return uDof.z * pow(d, 1.3);
}
// How far into the open, defocused ends a height lies (0 at the waist, 1 by y ≈ 0.1
// and 0.85). The poster's colour changes there: whiter clumps, cool fringes, less haze.
float endsAt(float y) {
    return smoothstep(0.03, 0.2, max(abs(y - uDof.x) - uDof.y, 0.0));
}
vec2 toScreen(vec2 w) {
    vec2 q = (w - vec2(PW * 0.5, 0.5)) * uMap2.x;
    vec2 r = vec2(q.x * uMap.x - q.y * uMap.y, q.x * uMap.y + q.y * uMap.x);
    float k = uMap.w / max(uMap.w - r.y * sin(uMap.z), 1.0);
    return uMap2.yz + vec2(r.x, r.y * cos(uMap.z)) * k;
}
vec2 toWorld(vec2 s) {
    vec2 v = s - uMap2.yz;
    float st = sin(uMap.z);
    float ry = v.y * uMap.w / max(cos(uMap.z) * uMap.w + v.y * st, 1.0);
    float k = uMap.w / max(uMap.w - ry * st, 1.0);
    vec2 r = vec2(v.x / k, ry);
    vec2 q = vec2(r.x * uMap.x + r.y * uMap.y, -r.x * uMap.y + r.y * uMap.x);
    return q / uMap2.x + vec2(PW * 0.5, 0.5);
}
vec4 toClip(vec2 s) {
    return vec4(s.x / uFrame.x * 2.0 - 1.0, 1.0 - s.y / uFrame.y * 2.0, 0.0, 1.0);
}
float envRow(float u, float y) {
    vec2 tc = vec2(((u - ${ENV_U0.toFixed(2)}) / ${(ENV_U1 - ENV_U0).toFixed(2)} * ${(ENV_U - 1).toFixed(1)} + 0.5) / ${ENV_U.toFixed(1)},
                   (y * ${(ENV_Y - 1).toFixed(1)} + 0.5) / ${ENV_Y.toFixed(1)});
    return texture(uEnv, tc).r;
}
// The poster's large-scale light at lane u, height y. Past the poster's ends it
// thins as the fan spreads. The run-on keeps the light's slope at the poster's edge
// and eases it out, and the thinning starts flat: a hard clamp there put a crease
// in the light that showed as a straight line across the frame once Angle turned
// the ends into view.
float envAt(float u, float y) {
    float yc = clamp(y, 0.0, 1.0);
    float e = envRow(u, yc);
    float d = abs(y - yc);
    if (d > 0.0) {
        float yi = yc < 0.5 ? 0.04 : 0.96;
        float slope = (e - envRow(u, yi)) / 0.04;
        e = max(e + slope * 0.08 * (1.0 - exp(-d / 0.08)), 0.0);
    }
    float edge = smoothstep(${ENV_U0.toFixed(2)}, ${(ENV_U0 + 0.1).toFixed(2)}, u) * (1.0 - smoothstep(${(ENV_U1 - 0.1).toFixed(2)}, ${ENV_U1.toFixed(2)}, u));
    return e * e * ${ENV_MAX.toFixed(2)} * edge / (1.0 + 1.5 * d * d / (d + 0.15));
}
`

const GLINT_VS =
    HEAD +
    FLOW_GLSL +
    `
uniform vec4 uGl;   // lanes, slots per lane, cell length, range start
uniform vec4 uGl2;  // range length, flow offset, occupancy, seed
uniform vec4 uGl3;  // hairline sigma (CSS px), gain, cyan share, violet share
uniform vec4 uGl4;  // flicker, time, fringe per defocus px, fringe base px
uniform vec3 uCoreE;
uniform vec3 uBaseE;
uniform vec3 uAccE;
uniform vec3 uVioE;
out vec4 vA;
out float vSc;
out vec3 vCore;
out vec3 vHalo;
out float vI;
const int SEG = ${GLINT_SEG};
void main() {
    int corner = gl_VertexID % 6;
    int seg = gl_VertexID / 6;
    int rowOff = (corner == 2 || corner == 4 || corner == 5) ? 1 : 0;
    float side = (corner == 1 || corner == 3 || corner == 5) ? 1.0 : -1.0;
    uint inst = uint(gl_InstanceID);
    uint NS = uint(uGl.y);
    uint lane = inst / NS;
    uint slot = inst - lane * NS;
    uint sd = uint(uGl2.w) * 0x9E3779B1u;
    vec4 hl = h4(lane * 0x27d4eb2du + sd);
    float u = mix(-0.08, 1.08, (float(lane) + 0.5 + (hl.x - 0.5) * 0.9) / uGl.x);
    float cell = uGl.z;
    float P = uGl2.x;
    // Upward flow: the moving coordinate falls with time and wraps over the range.
    float m = (float(slot) + hl.y) * cell - uGl2.y * (0.8 + 0.4 * hl.z);
    float cyc = floor(m / P);
    float mw = m - cyc * P;
    uint cu = uint(int(cyc) + 65536);
    vec4 hs = h4(inst * 0x165667b1u + cu * 0x61c88647u + sd);
    vec4 hs2 = h4(hu(inst ^ 0x5bd1e995u) + cu * 0x2545f491u + sd);
    float yc = uGl.w + mw;
    // Wide clumps gather in the middle lanes; the flanks carry only slender spindles.
    float flank = smoothstep(0.25, 0.5, abs(u - 0.5));
    float wq = hs.w * (1.0 - 0.75 * flank);
    // Wider spindles run longer, keeping the poster's slender 10:1 shapes.
    // Where the fan spreads the lanes, spindles stretch with it, so they keep their
    // slender shape at the open ends instead of turning into blobs.
    float spread = laneX(rowAt(yc), u).y / 0.38;
    float len = cell * (0.12 + 0.5 * hs.y * hs.y) * (1.0 + 2.0 * wq * wq) * pow(max(spread, 0.5), 0.9);
    float env = envAt(u, yc);
    float fade = smoothstep(0.0, 0.25, mw) * smoothstep(0.0, 0.25, P - mw);
    if (hs.x > uGl2.z || env * fade < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

    float tau = float(seg + rowOff) / float(SEG);
    float y = yc + (tau - 0.5) * len;
    vec2 lx = laneX(rowAt(y), u);
    vec2 w0 = vec2(PW * lx.x, y);
    vec2 s0 = toScreen(w0);
    vec2 s1 = toScreen(worldAt(u, y + 0.004));
    vec2 t = s1 - s0;
    t = t / max(length(t), 1e-5);
    vec2 n = vec2(-t.y, t.x);
    float a = sin(3.14159265 * tau);
    a *= a;
    float dofPx = dofAt(y) * uMap2.x;
    // Each spindle has its own width in lane space, from a hairline to a soft clump a
    // few percent of the column wide, so it widens with the fan like everything else.
    float wU = 0.003 * pow(12.0, wq);
    float body = max(uGl3.x, wU * lx.y * PW * uMap2.x) * (0.35 + 0.65 * sqrt(a));
    float sig = sqrt(body * body + dofPx * dofPx);
    // The white-hot centre line stays a hairline (plus defocus) however wide the glow.
    vSc = sqrt(uGl3.x * uGl3.x + dofPx * dofPx);
    float delta = (uGl4.w + uGl4.z * dofPx) * (u < 0.5 ? -1.0 : 1.0);
    float ext = 3.0 * sig + abs(delta) + 1.0;
    gl_Position = toClip(s0 + n * side * ext);
    vA = vec4(side * ext, tau, sig, delta);
    float fl = 1.0 - uGl4.x + uGl4.x * (0.5 + 0.5 * sin(6.2831853 * (uGl4.y * (0.15 + 0.5 * hs2.x) + hs2.y)));
    vI = uGl3.y * env * fade * fl * (0.25 + 0.75 * hs.z * hs.z) * (body / sig);
    // Cool fringes belong to the defocused ends: none at the waist, twice the share at the ends.
    float ends = endsAt(yc);
    float cool = 2.0 * ends;
    // Warm light whitens where the poster's light is densest.
    // Amber spindles stay amber even over the brightest light, as the poster's do, each
    // a little redder or more golden than the last (the poster's warm hues span 9–23°).
    float hj = hs2.w - 0.5;
    vec3 halo = uBaseE * vec3(1.0, 1.0 + 0.9 * hj, 1.0 + 1.2 * hj);
    vec3 core = uCoreE;
    // Cool spindles are coloured right through; only warm ones carry a white core.
    // Only slender spindles carry a cool colour; the wide clumps are white-hot.
    float slim = 1.0 - smoothstep(0.35, 0.6, wq);
    if (hs2.z < uGl3.z * cool * slim) { halo = uAccE; core = mix(uCoreE, uAccE, 0.7); }
    else if (hs2.z < (uGl3.z + uGl3.w) * cool * slim) { halo = uVioE; core = mix(uCoreE, uVioE, 0.7); }
    // Slender spindles glow in their colour round a white line; the widest are white-hot clumps.
    float clump = smoothstep(0.5, 0.85, wq);
    vCore = core * (uGl3.x / vSc) * 0.6;
    vHalo = mix(halo, core * 0.6, clump);
}
`

const GLINT_FS =
    HEAD +
    `
in vec4 vA;
in float vSc;
in vec3 vCore;
in vec3 vHalo;
in float vI;
uniform float uOut;
out vec4 o;
void main() {
    float a = sin(3.14159265 * vA.y);
    a *= a;
    float s = max(vA.z, 0.3);
    float sc = max(min(vSc, s), 0.3);
    vec3 d = vec3(vA.x - vA.w, vA.x, vA.x + vA.w);
    vec3 E = vI * a * (vCore * exp(-0.5 * d * d / (sc * sc)) * sqrt(a) + vHalo * exp(-0.5 * d * d / (s * s)));
    o = vec4(clamp(E, vec3(0.0), vec3(64.0)) * uOut, 0.0);
}
`

const DUST_VS =
    HEAD +
    FLOW_GLSL +
    `
uniform vec4 uDu;   // range length, flow offset, point size (device px), strength
uniform vec4 uDu2;  // seed, time, range start, spray share
uniform vec3 uDustE;
out vec3 vC;
void main() {
    uint id = uint(gl_VertexID);
    uint sd = uint(uDu2.x) * 0x297a2d39u;
    vec4 h = h4(id * 0x2c1b3c6du + sd);
    vec4 h2 = h4(hu(id ^ 0x51ed270bu) + sd);
    float u = mix(-0.03, 1.03, h.w);
    float spray = 0.0;
    if (h.x < uDu2.w) {
        float o = 0.13 * h2.y * h2.y;
        u = h2.x < 0.5 ? -0.02 - o : 1.02 + o;
        spray = h2.y;
    }
    float P = uDu.x;
    float m = h.y * P - uDu.y * (0.25 + 0.15 * h.z);
    float mw = m - floor(m / P) * P;
    float y = uDu2.z + mw;
    vec2 wd = worldAt(u, y);
    vec2 s = toScreen(wd);
    float tw = max(0.0, 0.55 + 0.45 * sin(6.2831853 * (uDu2.y * (0.3 + 1.4 * h2.z) + h2.w)));
    float fade = smoothstep(0.0, 0.2, mw) * smoothstep(0.0, 0.2, P - mw);
    float b = uDu.w * tw * fade * (0.25 + 0.75 * h.z) * (1.0 - 0.8 * spray);
    gl_PointSize = uDu.z * (0.8 + 0.7 * h2.x * h2.x);
    gl_Position = b < 0.003 ? vec4(2.0, 2.0, 2.0, 1.0) : toClip(s);
    vC = uDustE * b;
}
`

const DUST_FS =
    HEAD +
    `
in vec3 vC;
uniform float uOut;
out vec4 o;
void main() {
    vec2 r = gl_PointCoord - 0.5;
    o = vec4(vC * exp(-dot(r, r) * 5.0) * uOut, 0.0);
}
`

const QUAD_VS =
    HEAD +
    `
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

/** 4×4 box down-sample: four bilinear taps one source texel either side of the block centre. */
const DOWN_FS =
    HEAD +
    `
uniform sampler2D uSrc;
uniform vec2 uSrcPx;   // 1 / source size
uniform vec2 uDstRes;
out vec4 o;
void main() {
    vec2 uv = gl_FragCoord.xy / uDstRes;
    vec2 d = uSrcPx;
    o = 0.25 * (texture(uSrc, uv + vec2(-d.x, -d.y)) + texture(uSrc, uv + vec2(d.x, -d.y)) +
                texture(uSrc, uv + vec2(-d.x, d.y)) + texture(uSrc, uv + d));
}
`

/** Separable Gaussian, σ = 2.5 texels, 11 taps. */
const BLUR_FS =
    HEAD +
    `
uniform sampler2D uSrc;
uniform vec2 uStep;    // one texel along the blur axis, in uv
uniform vec2 uDstRes;
out vec4 o;
void main() {
    vec2 uv = gl_FragCoord.xy / uDstRes;
    vec4 acc = texture(uSrc, uv) * 0.16;
    float w[5] = float[5](0.1478, 0.1078, 0.0688, 0.0384, 0.0187);
    for (int i = 0; i < 5; i++) {
        vec2 off = uStep * float(i + 1);
        acc += (texture(uSrc, uv + off) + texture(uSrc, uv - off)) * w[i];
    }
    o = acc / (0.16 + 2.0 * 0.3815);
}
`

/**
 * The light field: fine fibres sampled in lane space plus the copper haze,
 * written into the light buffer first so the bloom spreads all of it.
 */
const FIELD_FS =
    HEAD +
    FLOW_GLSL +
    `
uniform sampler2D uFib;
uniform sampler2D uBed;
uniform vec2 uBuf;
uniform vec4 uFibP;    // flow offset, bed gain, gain, fringe per defocus px
uniform vec3 uMidE;
uniform vec3 uK0;      // fibre kinds as light: white core,
uniform vec3 uK1;      // warm,
uniform vec3 uK2;      // cyan and
uniform vec3 uK3;      // violet; in focus the cool ones read near-white:
uniform vec3 uK2s;
uniform vec3 uK3s;
uniform vec4 uHazeN;   // haze light per unit of red, and its red energy
uniform vec3 uCoreN;   // core light, per unit of red
uniform vec3 uBaseN;   // halo light, per unit of red
uniform vec2 uField;   // light pulse, output scale
out vec4 o;
const float FIB_SPAN = ${(FIB_U1 - FIB_U0).toFixed(3)};
void main() {
    float pxc = uMap2.w;
    vec2 css = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / pxc;
    vec2 w = toWorld(css);
    float y = w.y;
    Row r = rowAt(y);
    float xf = w.x / PW;
    // Nothing is lit outside the envelope's lanes: skip those pixels before solving for u.
    // Ordered either way, so a row whose outer lanes swap sides is never blacked out whole.
    float xl = laneX(r, ${(ENV_U0 - 0.02).toFixed(2)}).x;
    float xr = laneX(r, ${(ENV_U1 + 0.02).toFixed(2)}).x;
    if (xf < min(xl, xr) || xf > max(xl, xr)) { o = vec4(0.0); return; }
    float x0 = laneX(r, 0.0).x;
    float x1 = laneX(r, 1.0).x;
    float u = (xf - x0) / max(x1 - x0, 1e-3);
    vec2 f = laneX(r, u);
    u -= (f.x - xf) / f.y;
    f = laneX(r, u);
    u -= (f.x - xf) / f.y;
    f = laneX(r, u);

    float env = envAt(u, y) * uField.x;
    if (env < 1e-3) { o = vec4(0.0); return; }
    // Bright light bunches: fibres and haze follow the envelope more than linearly,
    // so bundles burn white and the lanes between them stay copper.
    float envB = env * sqrt(env / 0.8);
    float devPerWorld = uMap2.x * pxc;
    float pxPerU = f.y * PW * devPerWorld;
    float dofPx = dofAt(y) * devPerWorld;
    float hairPx = uDof.w * pxc;
    // Fibres: the mip level follows the pixel footprint or the blur, whichever is wider.
    float texPerPx = ${FIB_W.toFixed(1)} / FIB_SPAN / pxPerU;
    float lod = log2(max(1.0, max(texPerPx, 3.4 * sqrt(hairPx * hairPx + dofPx * dofPx) * texPerPx)));
    float cs = endsAt(y);
    vec2 tc = vec2((u - ${FIB_U0.toFixed(3)}) / FIB_SPAN, (y + uFibP.x) / ${FIB_PERIOD.toFixed(2)});
    float dU = uFibP.w * dofPx / pxPerU / FIB_SPAN * (u < 0.5 ? -1.0 : 1.0);
    vec4 fr = textureLod(uFib, tc - vec2(dU, 0.0), lod);
    vec4 fg = textureLod(uFib, tc, lod);
    vec4 fb = textureLod(uFib, tc + vec2(dU, 0.0), lod);
    fr *= fr; fg *= fg; fb *= fb;
    float bed = textureLod(uBed, tc, lod).r;
    // Light whitens where it is densest and warms where it thins, as in the poster:
    // its brightest cells run G/R 0.83, its dim ones 0.62.
    // The in-focus waist stays amber even where it is bright; the open ends burn white.
    float wh = smoothstep(0.5, 1.8, env) * mix(0.35, 1.0, cs);
    vec3 fib = vec3(fr.x, fg.x, fb.x) * uK0 + vec3(fr.y, fg.y, fb.y) * mix(uK1, uK0, wh)
             + vec3(fr.z, fg.z, fb.z) * mix(uK2s, uK2, cs) + vec3(fr.w, fg.w, fb.w) * mix(uK3s, uK3, cs);
    // Dim light leans copper (the haze's hue), bright light keeps the core's gold.
    vec3 tint = mix(mix(vec3(1.0), uHazeN.rgb / max(uCoreN, vec3(0.05)), 0.7), vec3(1.0), wh);
    vec3 E = (fib * tint * uFibP.z * env / 0.8 + uMidE * (bed * bed * uFibP.y * (1.0 - 0.6 * cs))) * envB;
    // The copper haze is the waist's: it thins where the streaks open out of focus.
    vec3 haze = uHazeN.w * mix(mix(uHazeN.rgb, uBaseN, 0.1), uCoreN, wh * 0.7);
    E += haze * mix(env, envB, 0.5) * mix(1.0, 0.15, cs);
    // A degenerate colour pick must never poison the bloom.
    if (any(isnan(E)) || any(isinf(E))) E = vec3(0.0);
    o = vec4(min(E, vec3(64.0)) * uField.y, 0.0);
}
`

/** Soft clip of all the light, then the ground, stars, vignette and grain. */
const COMP_FS =
    HEAD +
    `
uniform sampler2D uScene;
uniform sampler2D uBloomA;
uniform sampler2D uBloomB;
uniform vec2 uBuf;
uniform vec4 uLook;    // exposure, bloom, scene scale, device px per CSS px
uniform vec4 uBg;      // ground (straight rgb), alpha
uniform vec4 uFx;      // grain, vignette, stars, time
uniform vec3 uDustE;
uniform float uSeed;
out vec4 o;
uint hu(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
vec4 h4(uint x) {
    uint a = hu(x); uint b = hu(a ^ 0x9e3779b9u); uint c = hu(b ^ 0x85ebca6bu); uint d = hu(c ^ 0xc2b2ae35u);
    return vec4(float(a >> 8u), float(b >> 8u), float(c >> 8u), float(d >> 8u)) * (1.0 / 16777216.0);
}
void main() {
    float pxc = uLook.w;
    vec2 css = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / pxc;
    vec2 uv = gl_FragCoord.xy / uBuf;
    // A lens scatters light rather than adding it: a share of it leaves the sharp image for the glow.
    vec3 E = (texture(uScene, uv).rgb * (1.0 - uLook.y) + uLook.y * (0.5 * texture(uBloomA, uv).rgb + 0.5 * texture(uBloomB, uv).rgb)) * uLook.z;
    vec3 lit = 1.0 - exp(-E * uLook.x);

    // Stars: the ground's own scatter, fixed to the frame.
    vec2 cell = floor(css / 14.0);
    vec4 hs = h4(uint(int(cell.x) + 4096) * 0x8da6b343u + uint(int(cell.y) + 4096) * 0xd8163841u + uint(uSeed) * 0xcb1ab31fu);
    float star = 0.0;
    if (hs.x < uFx.z) {
        vec2 c = (cell + 0.15 + 0.7 * hs.yz) * 14.0;
        vec2 dd = (css - c) * pxc;
        float rad = 0.35 * pxc + 0.2;
        float tw = 0.8 + 0.2 * sin(uFx.w * (0.4 + hs.w) * 2.0 + hs.y * 40.0);
        star = (0.08 + 0.55 * hs.w * hs.w * hs.w) * tw * exp(-dot(dd, dd) / (2.0 * rad * rad));
    }
    lit = 1.0 - (1.0 - lit) * (1.0 - star * uDustE / max(max(uDustE.r, uDustE.g), max(uDustE.b, 1e-3)));

    // Light over the ground (screen), then vignette and grain on the whole frame.
    float la = max(max(lit.r, lit.g), lit.b);
    vec3 rgb = lit + uBg.rgb * uBg.a * (1.0 - lit);
    float al = uBg.a + la * (1.0 - uBg.a);
    float vd = length(uv - 0.5) * 1.4142;
    rgb *= 1.0 - uFx.y * smoothstep(0.35, 1.0, vd);
    vec4 hg = h4(uint(gl_FragCoord.x) * 0x9e3779b1u + uint(gl_FragCoord.y) * 0x85ebca77u + uint(uFx.w * 24.0) * 0xc2b2ae3du);
    rgb += (hg.x - 0.5) * uFx.x * al;
    o = vec4(clamp(rgb, 0.0, al), al);
}
`

// ── GL plumbing ─────────────────────────────────────────────────────────────
function compile(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
    const sh = (type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) throw new Error("createShader failed")
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
            const log = gl.getShaderInfoLog(s) || "shader compile failed"
            gl.deleteShader(s)
            throw new Error(log)
        }
        return s
    }
    const p = gl.createProgram()
    if (!p) throw new Error("createProgram failed")
    const v = sh(gl.VERTEX_SHADER, vs)
    const f = sh(gl.FRAGMENT_SHADER, fs)
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.bindAttribLocation(p, 0, "aPos")
    gl.linkProgram(p)
    gl.deleteShader(v)
    gl.deleteShader(f)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
        throw new Error(gl.getProgramInfoLog(p) || "link failed")
    }
    return p
}

/** Uniform setter that uploads only on change (doubles, not float32). */
class Uniforms {
    private loc = new Map<string, WebGLUniformLocation | null>()
    private last = new Map<string, Float64Array>()
    constructor(
        private gl: WebGL2RenderingContext,
        private prog: WebGLProgram
    ) {}
    private get(name: string) {
        let l = this.loc.get(name)
        if (l === undefined) {
            l = this.gl.getUniformLocation(this.prog, name)
            this.loc.set(name, l)
        }
        return l
    }
    private changed(name: string, a: number, b = 0, c = 0, d = 0) {
        let v = this.last.get(name)
        if (!v) {
            v = new Float64Array([NaN, NaN, NaN, NaN])
            this.last.set(name, v)
        }
        if (v[0] === a && v[1] === b && v[2] === c && v[3] === d) return false
        v[0] = a
        v[1] = b
        v[2] = c
        v[3] = d
        return true
    }
    f1(n: string, a: number) {
        if (this.changed(n, a)) this.gl.uniform1f(this.get(n), a)
    }
    f2(n: string, a: number, b: number) {
        if (this.changed(n, a, b)) this.gl.uniform2f(this.get(n), a, b)
    }
    f3(n: string, a: number, b: number, c: number) {
        if (this.changed(n, a, b, c)) this.gl.uniform3f(this.get(n), a, b, c)
    }
    f4(n: string, a: number, b: number, c: number, d: number) {
        if (this.changed(n, a, b, c, d)) this.gl.uniform4f(this.get(n), a, b, c, d)
    }
    i1(n: string, a: number) {
        if (this.changed(n, a, -1)) this.gl.uniform1i(this.get(n), a)
    }
    /** Static arrays: uploaded once per program. */
    v4(n: string, data: Float32Array) {
        if (this.changed(n, -7, data.length)) this.gl.uniform4fv(this.get(n), data)
    }
}

interface Target {
    tex: WebGLTexture
    fbo: WebGLFramebuffer
    w: number
    h: number
}

/** Everything the frame map needs, in CSS px. */
interface FrameMap {
    unit: number
    cx: number
    cy: number
    ca: number
    sa: number
    tilt: number
    persp: number
}

function frameToWorld(m: FrameMap, sx: number, sy: number): [number, number] {
    const vx = sx - m.cx
    const vy = sy - m.cy
    const st = Math.sin(m.tilt)
    const ry = (vy * m.persp) / Math.max(Math.cos(m.tilt) * m.persp + vy * st, 1)
    const k = m.persp / Math.max(m.persp - ry * st, 1)
    const rx = vx / k
    const qx = rx * m.ca + ry * m.sa
    const qy = -rx * m.sa + ry * m.ca
    return [qx / m.unit + PW * 0.5, qy / m.unit + 0.5]
}

/** uShape: lean blend A, B; waist width ×; waist shift. Shared by the shaders and the hit test. */
type Shape = [number, number, number, number]

function shapeOf(p: LumenCinchProps, adv: Advanced, ph: number, out: Shape): Shape {
    const lean0 = num(adv.lean, DEFAULT_ADVANCED.lean, 0, 200) / 100
    const lean = lean0 + (num(adv.twist, DEFAULT_ADVANCED.twist, 0, 20) / 100) * 5 * Math.sin(ph) * (lean0 > 0 ? 1 : 0)
    out[0] = (1 + lean) / 2
    out[1] = (1 - lean) / 2
    out[2] = (1.5 - num(p.pinch, DEFAULTS.pinch, 0, 100) / 100) * (1 + (num(adv.breathe, DEFAULT_ADVANCED.breathe, 0, 30) / 100) * Math.sin(ph))
    out[3] = num(adv.waistY, DEFAULT_ADVANCED.waistY, 30, 70) / 100 - WAIST0
    return out
}

/**
 * CPU copies of the shaders' coefY / cub / rowAt / laneX / envAt, for the hover hit
 * test only. Same names and steps, so the two can be read side by side.
 */
const HIT_A = new Float64Array(4)
const HIT_DA = new Float64Array(4)
const HIT_ROW = { a: new Float64Array(4), c: 0, wy: 1 }
const HIT_CUB = [0, 0]

function hitCoefY(y: number, out: Float64Array) {
    const yc = Math.min(1, Math.max(0, y))
    const t = yc - 0.5
    for (let i = 0; i < 4; i++) {
        HIT_A[i] = FLOW_COEF[24 + i]
        HIT_DA[i] = 0
    }
    for (let j = 5; j >= 0; j--) {
        for (let i = 0; i < 4; i++) {
            HIT_DA[i] = HIT_DA[i] * t + HIT_A[i]
            HIT_A[i] = HIT_A[i] * t + FLOW_COEF[j * 4 + i]
        }
    }
    const dy = y - yc
    const run = Math.sign(dy) * 0.15 * (1 - Math.exp(-Math.abs(dy) / 0.15))
    for (let i = 0; i < 4; i++) out[i] = HIT_A[i] + HIT_DA[i] * run
}
function hitCub(a: Float64Array, u: number): number[] {
    const uc = Math.min(1.25, Math.max(-0.25, u))
    const d = a[1] + uc * (2 * a[2] + 3 * uc * a[3])
    const v = a[0] + uc * (a[1] + uc * (a[2] + uc * a[3]))
    HIT_CUB[0] = v + d * (u - uc)
    HIT_CUB[1] = d
    return HIT_CUB
}
function hitRowAt(sh: Shape, y: number) {
    const yb = y - sh[3]
    hitCoefY(yb, HIT_ROW.a)
    HIT_ROW.c = (sh[0] - sh[1]) * hitCub(HIT_ROW.a, 0.5)[0] + sh[1]
    const g = (yb - WAIST0) / PINCH_SIGMA
    HIT_ROW.wy = 1 + (sh[2] - 1) * Math.exp(-g * g)
}
/** Lane u at the current row: [x as a share of poster width, dx/du]. */
const HIT_LANE = [0, 0]
function hitLaneX(sh: Shape, u: number): number[] {
    const r = HIT_ROW
    const [fx, fd] = hitCub(r.a, u)
    const [gx, gd] = hitCub(r.a, 1 - u)
    const x = sh[0] * fx - sh[1] * gx + sh[1]
    const d = sh[0] * fd + sh[1] * gd
    HIT_LANE[0] = r.c + (x - r.c) * r.wy
    HIT_LANE[1] = Math.max(d * r.wy, 0.02)
    return HIT_LANE
}
function hitEnvRow(env: Uint8Array, u: number, y: number): number {
    const fx = Math.min(ENV_U - 1, Math.max(0, ((u - ENV_U0) / (ENV_U1 - ENV_U0)) * (ENV_U - 1)))
    const fy = Math.min(ENV_Y - 1, Math.max(0, y * (ENV_Y - 1)))
    const x0 = Math.min(ENV_U - 2, Math.floor(fx))
    const y0 = Math.min(ENV_Y - 2, Math.floor(fy))
    const tx = fx - x0
    const ty = fy - y0
    const at = (x: number, yy: number) => env[yy * ENV_U + x] / 255
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx
    const bot = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx
    return top * (1 - ty) + bot * ty
}
function hitEnvAt(env: Uint8Array, u: number, y: number): number {
    const yc = Math.min(1, Math.max(0, y))
    let e = hitEnvRow(env, u, yc)
    const d = Math.abs(y - yc)
    if (d > 0) {
        const slope = (e - hitEnvRow(env, u, yc < 0.5 ? 0.04 : 0.96)) / 0.04
        e = Math.max(e + slope * 0.08 * (1 - Math.exp(-d / 0.08)), 0)
    }
    const ss = (a: number, b: number, x: number) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
        return t * t * (3 - 2 * t)
    }
    const edge = ss(ENV_U0, ENV_U0 + 0.1, u) * (1 - ss(ENV_U1 - 0.1, ENV_U1, u))
    return (e * e * ENV_MAX * edge) / (1 + (1.5 * d * d) / (d + 0.15))
}
/** The poster's light energy at a world point: solve its lane u as the field shader does. */
function lightAt(env: Uint8Array, sh: Shape, wx: number, wy: number): number {
    hitRowAt(sh, wy)
    const xf = wx / PW
    const xl = hitLaneX(sh, ENV_U0 - 0.02)[0]
    const xr = hitLaneX(sh, ENV_U1 + 0.02)[0]
    if (xf < Math.min(xl, xr) || xf > Math.max(xl, xr)) return 0
    const x0 = hitLaneX(sh, 0)[0]
    const x1 = hitLaneX(sh, 1)[0]
    let u = (xf - x0) / Math.max(x1 - x0, 1e-3)
    for (let i = 0; i < 2; i++) {
        const [fx, fd] = hitLaneX(sh, u)
        u -= (fx - xf) / fd
    }
    return Math.max(hitEnvAt(env, u - LANE_REACH, wy), hitEnvAt(env, u, wy), hitEnvAt(env, u + LANE_REACH, wy))
}

// ── Component ───────────────────────────────────────────────────────────────
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
function __OriginkitBase_LumenCinch(props: LumenCinchProps) {
    props = withMovedControls(props)
    // Defaults sit in the signature; the loop reads live values through propsRef.
    const {
        background = DEFAULTS.background,
        baseColor = DEFAULTS.baseColor,
        accentColor = DEFAULTS.accentColor,
        speed = DEFAULTS.speed,
        scale = DEFAULTS.scale,
        density = DEFAULTS.density,
        pinch = DEFAULTS.pinch,
        fringe = DEFAULTS.fringe,
        style,
    } = props
    void [baseColor, accentColor, speed, scale, density, pinch, fringe]
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props
    const wakeRef = useRef<() => void>(() => {})
    // The GPU draws the ground itself; CSS shows it until the first frame lands and
    // whenever WebGL is unavailable or its context is lost.
    const [gpu, setGpu] = useState(false)

    useEffect(() => {
        wakeRef.current()
    })

    useEffect(() => {
        const rootEl = rootRef.current
        const canvasEl = canvasRef.current
        if (!rootEl || !canvasEl) return
        const root: HTMLDivElement = rootEl
        const canvas: HTMLCanvasElement = canvasEl
        const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        let reduced = !!(mq && mq.matches)
        const onMq = () => {
            reduced = !!(mq && mq.matches)
            wake()
        }
        mq?.addEventListener?.("change", onMq)

        let gl: WebGL2RenderingContext | null = null
        let glintProg: WebGLProgram | null = null
        let dustProg: WebGLProgram | null = null
        let downProg: WebGLProgram | null = null
        let blurProg: WebGLProgram | null = null
        let compProg: WebGLProgram | null = null
        let fieldProg: WebGLProgram | null = null
        let uGlint: Uniforms | null = null
        let uDust: Uniforms | null = null
        let uDown: Uniforms | null = null
        let uBlur: Uniforms | null = null
        let uComp: Uniforms | null = null
        let uField: Uniforms | null = null
        let quadVao: WebGLVertexArrayObject | null = null
        let emptyVao: WebGLVertexArrayObject | null = null
        let envTex: WebGLTexture | null = null
        let fibTex: WebGLTexture | null = null
        let bedTex: WebGLTexture | null = null
        let fibKey = ""
        let scene: Target | null = null
        const q4: (Target | null)[] = [null, null]
        const q8: (Target | null)[] = [null, null]
        let floatOK = false
        let lost = false
        let timerExt: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null = null
        const queries: { q: WebGLQuery; level: number }[] = []

        // Light buffers are R11G11B10F where it renders (half the bandwidth of RGBA16F,
        // and the light needs no alpha), RGBA16F otherwise, RGBA8 at a quarter scale last.
        let packedOK = true
        const makeTarget = (w: number, h: number, float: boolean): Target | null => {
            if (!gl) return null
            const tex = gl.createTexture()
            const fbo = gl.createFramebuffer()
            if (!tex || !fbo) return null
            gl.bindTexture(gl.TEXTURE_2D, tex)
            if (float && packedOK) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, w, h, 0, gl.RGB, gl.HALF_FLOAT, null)
            else gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
            const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            if (!ok) {
                gl.deleteTexture(tex)
                gl.deleteFramebuffer(fbo)
                if (float && packedOK) {
                    packedOK = false
                    return makeTarget(w, h, float)
                }
                return null
            }
            return { tex, fbo, w, h }
        }
        const dropTarget = (t: Target | null) => {
            if (!t || !gl) return
            gl.deleteTexture(t.tex)
            gl.deleteFramebuffer(t.fbo)
        }

        const initGL = (): boolean => {
            gl = canvas.getContext("webgl2", {
                alpha: true,
                antialias: false,
                depth: false,
                stencil: false,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                powerPreference: "low-power",
            })
            if (!gl) return false
            try {
                glintProg = compile(gl, GLINT_VS, GLINT_FS)
                dustProg = compile(gl, DUST_VS, DUST_FS)
                downProg = compile(gl, QUAD_VS, DOWN_FS)
                blurProg = compile(gl, QUAD_VS, BLUR_FS)
                compProg = compile(gl, QUAD_VS, COMP_FS)
                fieldProg = compile(gl, QUAD_VS, FIELD_FS)
            } catch (e) {
                if (!gl.isContextLost()) console.error("LumenCinch:", e)
                gl = null
                return false
            }
            uGlint = new Uniforms(gl, glintProg)
            uDust = new Uniforms(gl, dustProg)
            uDown = new Uniforms(gl, downProg)
            uBlur = new Uniforms(gl, blurProg)
            uComp = new Uniforms(gl, compProg)
            uField = new Uniforms(gl, fieldProg)
            floatOK = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float")
            gl.getExtension("OES_texture_float_linear")
            timerExt = gl.getExtension("EXT_disjoint_timer_query_webgl2") as typeof timerExt
            const quad = gl.createBuffer()
            quadVao = gl.createVertexArray()
            gl.bindVertexArray(quadVao)
            gl.bindBuffer(gl.ARRAY_BUFFER, quad)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(0)
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
            emptyVao = gl.createVertexArray()
            gl.bindVertexArray(null)

            // The poster's envelope: one byte per cell, sqrt-encoded.
            envTex = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, envTex)
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, ENV_U, ENV_Y, 0, gl.RED, gl.UNSIGNED_BYTE, envData())
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            fibTex = gl.createTexture()
            bedTex = gl.createTexture()
            for (const t of [fibTex, bedTex]) {
                gl.bindTexture(gl.TEXTURE_2D, t)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
            }
            fibKey = ""
            packedOK = true
            scene = null
            q4[0] = q4[1] = q8[0] = q8[1] = null
            queries.length = 0
            for (const [u, prog] of [
                [uGlint, glintProg],
                [uDust, dustProg],
                [uField, fieldProg],
            ] as [Uniforms, WebGLProgram][]) {
                gl.useProgram(prog)
                u.v4("uFc", FLOW_COEF)
            }
            return true
        }

        // ── Size & resolution ──
        let W = 0
        let H = 0
        let shown = 1
        let quality = 0
        let bufW = 0
        let bufH = 0
        let pxPerCss = 1
        const measureShown = (): boolean => {
            if (W <= 0) return false
            const r = root.getBoundingClientRect()
            const s = Math.min(2, Math.max(1, r.width / W))
            if (Math.abs(s - shown) / shown > 0.05) {
                shown = s
                return true
            }
            return false
        }
        // Resizing wipes the canvas; draw() applies a pending resize right before it
        // paints, so a wiped buffer is never shown.
        let resizePending = true
        const applyResize = () => {
            resizePending = false
            if (!gl || W <= 0 || H <= 0) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            let k = dpr * shown * QUALITY_LEVELS[quality]
            const px = W * H * k * k
            if (px > MAX_PIXELS) k *= Math.sqrt(MAX_PIXELS / px)
            const bw = Math.max(1, Math.round(W * k))
            const bh = Math.max(1, Math.round(H * k))
            pxPerCss = bw / W
            if (bw === bufW && bh === bufH && scene) return
            bufW = bw
            bufH = bh
            canvas.width = bw
            canvas.height = bh
            for (const t of [scene, q4[0], q4[1], q8[0], q8[1]]) dropTarget(t)
            scene = makeTarget(bw, bh, floatOK)
            if (!scene && floatOK) {
                floatOK = false
                scene = makeTarget(bw, bh, false)
            }
            const w4 = Math.max(1, Math.ceil(bw / 4))
            const h4 = Math.max(1, Math.ceil(bh / 4))
            const w8 = Math.max(1, Math.ceil(bw / 8))
            const h8 = Math.max(1, Math.ceil(bh / 8))
            q4[0] = makeTarget(w4, h4, floatOK)
            q4[1] = makeTarget(w4, h4, floatOK)
            q8[0] = makeTarget(w8, h8, floatOK)
            q8[1] = makeTarget(w8, h8, floatOK)
        }

        // ── Pointer: the rush follows it onto the light ──
        // A host can swallow the root's pointerleave (a preview in an iframe, an overlay,
        // pointer capture), and then the rush never ended. So leaving is caught three
        // ways: the root's own leave, the pointer leaving the window, and, on any
        // pointer move in the page, the cursor tested against the frame's rect.
        let ptrInside = false
        let ptrClientX = 0
        let ptrClientY = 0
        let ptrMoved = false
        let ptrU = 0.5
        let ptrV = 0.5
        let onLight = false
        let hover = 0
        let hoverVel = 0
        let hoverTarget = 0
        const onEnter = (e: PointerEvent) => {
            ptrClientX = e.clientX
            ptrClientY = e.clientY
            ptrMoved = true
            ptrInside = true
            start()
        }
        const onLeave = () => {
            if (!ptrInside) return
            ptrInside = false
            start()
        }
        // Touch has no hover: a press rushes it and lifting the finger lets it go.
        const onUp = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") onLeave()
        }
        const onPageMove = (e: PointerEvent) => {
            if (!ptrInside) return
            ptrClientX = e.clientX
            ptrClientY = e.clientY
            ptrMoved = true
            start()
        }
        const onPageOut = (e: MouseEvent) => {
            if (!e.relatedTarget) onLeave()
        }
        root.addEventListener("pointermove", onEnter)
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointerdown", onEnter)
        root.addEventListener("pointerup", onUp)
        root.addEventListener("pointercancel", onLeave)
        window.addEventListener("pointermove", onPageMove, { passive: true, capture: true })
        document.addEventListener("mouseout", onPageOut)
        window.addEventListener("blur", onLeave)

        // ── Frame map ──
        const map: FrameMap = { unit: 1, cx: 0, cy: 0, ca: 1, sa: 0, tilt: 0, persp: 1 }
        const updateMap = (p: LumenCinchProps) => {
            const pl = { ...DEFAULT_PLACEMENT, ...p.placement }
            // Contain the 1200×800 composition: S is its height, the poster's height at 100%.
            const S = Math.min(H, W / REF_ASPECT)
            map.unit = S * (num(p.scale, DEFAULTS.scale, 10, 300) / 100)
            map.cx = W / 2 + (num(pl.x, 0, -50, 50) / 100) * W
            map.cy = H / 2 + (num(pl.y, 0, -50, 50) / 100) * H
            const ang = (num(pl.angle, 0, -180, 180) * Math.PI) / 180
            map.ca = Math.cos(ang)
            map.sa = Math.sin(ang)
            map.tilt = (num(pl.tilt, 0, -80, 80) * Math.PI) / 180
            map.persp = TILT_PERSPECTIVE * Math.max(W, H, 1)
        }
        const shapeTmp: Shape = [0, 0, 0, 0]
        const setFlowUniforms = (u: Uniforms, p: LumenCinchProps, adv: Advanced, ph: number) => {
            const sh = shapeOf(p, adv, ph, shapeTmp)
            u.f4("uShape", sh[0], sh[1], sh[2], sh[3])
            u.f4("uMap", map.ca, map.sa, map.tilt, map.persp)
            u.f4("uMap2", map.unit, map.cx, map.cy, pxPerCss)
            u.f2("uFrame", W, H)
            u.f4("uDof", 0.475, 0.17, 0.011 * (num(adv.defocus, DEFAULT_ADVANCED.defocus, 0, 300) / 100), 0.45 * num(adv.streakWidth, DEFAULT_ADVANCED.streakWidth, 1, 20))
            u.i1("uEnv", 7)
        }

        // ── Loop state ──
        let raf = 0
        let running = false
        let visible = true
        let clock = 0
        let flowPos = 0
        let lastTick = -1
        let due = 0
        let lastDrawAt = 0
        let lastRate = 0
        let dirty = true
        let lastProps: LumenCinchProps | null = null
        let lateEma = 1
        let gpuEma = 0
        let goodFor = 0
        let slowFor = 0
        let banUntil = 0
        let drawn = 0
        let painted = false
        let measuredAt = 0
        let warm = 0

        const pass = (t: Target | null, prog: WebGLProgram) => {
            if (!gl || !t) return
            gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
            gl.viewport(0, 0, t.w, t.h)
            gl.useProgram(prog)
            gl.bindVertexArray(quadVao)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const draw = () => {
            if (resizePending) applyResize()
            if (!gl || lost || !glintProg || !dustProg || !downProg || !blurProg || !compProg || !fieldProg) return
            if (!uGlint || !uDust || !uDown || !uBlur || !uComp || !uField || !scene) return
            if (W <= 0 || H <= 0) return
            const p = propsRef.current
            const adv: Advanced = { ...DEFAULT_ADVANCED, ...p.advanced }
            updateMap(p)
            const seed = Math.round(num(adv.seed, DEFAULT_ADVANCED.seed, 0, 99))
            const dens = num(p.density, DEFAULTS.density, 10, 200) / 100
            const lanesBase = num(adv.lanes, DEFAULT_ADVANCED.lanes, 10, 200)
            const NL = Math.max(2, Math.round(lanesBase * dens))

            // Fibres: rebuilt only when their count or seed changes.
            const nFib = Math.max(6, Math.round(lanesBase * FIBRES_PER_LANE * dens))
            const nBed = Math.max(8, Math.round(lanesBase * BED_PER_LANE * dens))
            const fk = `${nFib}|${nBed}|${seed}`
            if (fk !== fibKey) {
                fibKey = fk
                const fib = buildFibres(nFib, nBed, seed)
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
                gl.bindTexture(gl.TEXTURE_2D, fibTex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, FIB_W, FIB_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, fib.bright)
                gl.generateMipmap(gl.TEXTURE_2D)
                gl.bindTexture(gl.TEXTURE_2D, bedTex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FIB_W, FIB_H, 0, gl.RED, gl.UNSIGNED_BYTE, fib.bed)
                gl.generateMipmap(gl.TEXTURE_2D)
            }

            let q: WebGLQuery | null = null
            if (timerExt && queries.length < 4) {
                q = gl.createQuery()
                if (q) gl.beginQuery(timerExt.TIME_ELAPSED_EXT, q)
            }

            const period = num(adv.breathePeriod, DEFAULT_ADVANCED.breathePeriod, 500, 30000) / 1000
            const ph = (2 * Math.PI * clock) / period
            const outScale = floatOK ? 1 : 0.25
            const fringeK = num(p.fringe, DEFAULTS.fringe, 0, 100) / 100
            const coreE = asLight(parseColor(adv.coreColor, [1, 0.91, 0.82]))
            const baseE = asLight(parseColor(p.baseColor, [1, 0.54, 0.23]))
            const accE = asLight(parseColor(p.accentColor, [0.37, 0.88, 0.88]))
            const vioE = asLight(parseColor(adv.violetColor, [0.54, 0.42, 1]))
            const midE = asLight(parseColor(adv.midColor, [0.55, 0.42, 0.38]))
            const hazeE = asLight(parseColor(adv.hazeColor, [0.43, 0.25, 0.2]))
            const dustE = asLight(parseColor(adv.dustColor, [0.85, 0.82, 0.78]))

            gl.activeTexture(gl.TEXTURE7)
            gl.bindTexture(gl.TEXTURE_2D, envTex)

            // ── Light buffer: fibres and haze, then glints and glitter added on top ──
            gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo)
            gl.viewport(0, 0, scene.w, scene.h)
            gl.useProgram(fieldProg)
            setFlowUniforms(uField, p, adv, ph)
            gl.activeTexture(gl.TEXTURE3)
            gl.bindTexture(gl.TEXTURE_2D, fibTex)
            gl.activeTexture(gl.TEXTURE4)
            gl.bindTexture(gl.TEXTURE_2D, bedTex)
            uField.i1("uFib", 3)
            uField.i1("uBed", 4)
            uField.f2("uBuf", bufW, bufH)
            const fibK = num(adv.fibres, DEFAULT_ADVANCED.fibres, 0, 300) / 100
            const fibGain = fibK * 34 * Math.pow(110 / nFib, 0.5)
            const bedGain = fibK * 18 * Math.pow(184 / nBed, 0.5)
            uField.f4("uFibP", flowPos * 0.6, bedGain, fibGain, 1.6 * fringeK)
            uField.f3("uMidE", midE[0], midE[1], midE[2])
            // Bright fibre kinds: white core, warm halo, cyan, violet.
            // Warm and cool kinds carry the core's red energy, so the hue picks the colour
            // and not how hard a fully saturated channel pushes the soft clip.
            const atCore = (c: RGB, k: number): RGB => {
                const m = (k * coreE[0]) / Math.max(c[0], c[1], c[2], 1e-3)
                return [c[0] * m, c[1] * m, c[2] * m]
            }
            const kinds: RGB[] = [coreE, atCore(baseE, 0.8), atCore(accE, 1), atCore(vioE, 1)]
            uField.f3("uK0", kinds[0][0], kinds[0][1], kinds[0][2])
            uField.f3("uK1", kinds[1][0], kinds[1][1], kinds[1][2])
            uField.f3("uK2", kinds[2][0], kinds[2][1], kinds[2][2])
            uField.f3("uK3", kinds[3][0], kinds[3][1], kinds[3][2])
            // In focus the cool fibres are mostly white: the poster's waist has no blue in it.
            const cool = (k: RGB): RGB => [k[0] * 0.25 + coreE[0] * 0.75, k[1] * 0.25 + coreE[1] * 0.75, k[2] * 0.25 + coreE[2] * 0.75]
            const k2s = cool(kinds[2])
            const k3s = cool(kinds[3])
            uField.f3("uK2s", k2s[0], k2s[1], k2s[2])
            uField.f3("uK3s", k3s[0], k3s[1], k3s[2])
            const hazeAmt = (num(adv.haze, DEFAULT_ADVANCED.haze, 0, 200) / 100) * 1.35
            // Per unit of the strongest channel, so any hue (not only warm ones) normalises safely.
            const nrm = (c: RGB): RGB => {
                const m = Math.max(c[0], c[1], c[2], 1e-3)
                return [c[0] / m, c[1] / m, c[2] / m]
            }
            const hazeN = nrm(hazeE)
            uField.f4("uHazeN", hazeN[0], hazeN[1], hazeN[2], Math.max(hazeE[0], hazeE[1], hazeE[2]) * hazeAmt)
            const coreN = nrm(coreE)
            const baseN = nrm(baseE)
            uField.f3("uCoreN", coreN[0], coreN[1], coreN[2])
            uField.f3("uBaseN", baseN[0], baseN[1], baseN[2])
            uField.f2("uField", 0.94 + 0.06 * Math.sin(ph), outScale)
            gl.bindVertexArray(quadVao)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE)
            gl.bindVertexArray(emptyVao)

            const cell = Math.max(0.03, num(adv.streakLength, DEFAULT_ADVANCED.streakLength, 5, 60) / 100) * 1.4
            const NS = Math.max(1, Math.min(64, Math.ceil(RANGE_LEN / cell)))
            gl.useProgram(glintProg)
            setFlowUniforms(uGlint, p, adv, ph)
            uGlint.f4("uGl", NL, NS, RANGE_LEN / NS, RANGE_Y0)
            uGlint.f4("uGl2", RANGE_LEN, flowPos, num(adv.occupancy, DEFAULT_ADVANCED.occupancy, 5, 100) / 100, seed)
            uGlint.f4(
                "uGl3",
                0.45 * num(adv.streakWidth, DEFAULT_ADVANCED.streakWidth, 1, 20),
                3.2 * Math.pow(46 / NL, 0.5),
                num(adv.cyanShare, DEFAULT_ADVANCED.cyanShare, 0, 100) / 100,
                num(adv.violetShare, DEFAULT_ADVANCED.violetShare, 0, 100) / 100
            )
            uGlint.f4("uGl4", num(adv.flicker, DEFAULT_ADVANCED.flicker, 0, 100) / 100, clock, 0.45 * fringeK, 0.6 * fringeK)
            const toCore = (c: RGB, k: number): RGB => {
                const m = (k * coreE[0]) / Math.max(c[0], c[1], c[2], 1e-3)
                return [c[0] * m, c[1] * m, c[2] * m]
            }
            const gBase = toCore(baseE, 0.8)
            const gAcc = toCore(accE, 1)
            const gVio = toCore(vioE, 1)
            uGlint.f3("uCoreE", coreE[0], coreE[1], coreE[2])
            uGlint.f3("uBaseE", gBase[0], gBase[1], gBase[2])
            uGlint.f3("uAccE", gAcc[0], gAcc[1], gAcc[2])
            uGlint.f3("uVioE", gVio[0], gVio[1], gVio[2])
            uGlint.f1("uOut", outScale)
            gl.drawArraysInstanced(gl.TRIANGLES, 0, GLINT_SEG * 6, NL * NS)

            const dustAmt = num(adv.dust, DEFAULT_ADVANCED.dust, 0, 200) / 50
            if (dustAmt > 0) {
                // Glitter is fine detail: its dots keep their CSS size, so its count follows the
                // on-screen size of the flow to keep the poster's density per pixel at any Scale.
                const zoom = Math.min(3, Math.max(0.03, (map.unit / REF_H) ** 2))
                const nDust = Math.round(DUST_PER_UNIT * RANGE_LEN * Math.min(2, dustAmt) * zoom)
                gl.useProgram(dustProg)
                setFlowUniforms(uDust, p, adv, ph)
                uDust.f4("uDu", RANGE_LEN, flowPos, Math.max(1, 0.75 * pxPerCss), 1.1 * Math.max(1, dustAmt / 2))
                uDust.f4("uDu2", seed, clock, RANGE_Y0, 0.06)
                uDust.f3("uDustE", dustE[0], dustE[1], dustE[2])
                uDust.f1("uOut", outScale)
                gl.drawArrays(gl.POINTS, 0, nDust)
            }
            gl.disable(gl.BLEND)

            // ── Bloom: ¼ and ⅛ size ──
            const bloomAmt = num(adv.bloom, DEFAULT_ADVANCED.bloom, 0, 200) / 100
            if (bloomAmt > 0 && q4[0] && q4[1] && q8[0] && q8[1]) {
                gl.activeTexture(gl.TEXTURE0)
                gl.useProgram(downProg)
                uDown.i1("uSrc", 0)
                gl.bindTexture(gl.TEXTURE_2D, scene.tex)
                uDown.f2("uSrcPx", 1 / scene.w, 1 / scene.h)
                uDown.f2("uDstRes", q4[0].w, q4[0].h)
                pass(q4[0], downProg)
                gl.bindTexture(gl.TEXTURE_2D, q4[0].tex)
                uDown.f2("uSrcPx", 1 / q4[0].w, 1 / q4[0].h)
                uDown.f2("uDstRes", q8[0].w, q8[0].h)
                pass(q8[0], downProg)
                gl.useProgram(blurProg)
                uBlur.i1("uSrc", 0)
                for (const [pair, sx, sy] of [
                    [q4, 1 / q4[0].w, 1 / q4[0].h],
                    [q8, 1 / q8[0].w, 1 / q8[0].h],
                ] as [(Target | null)[], number, number][]) {
                    const a = pair[0]
                    const b = pair[1]
                    if (!a || !b) continue
                    uBlur.f2("uDstRes", a.w, a.h)
                    gl.bindTexture(gl.TEXTURE_2D, a.tex)
                    uBlur.f2("uStep", sx, 0)
                    pass(b, blurProg)
                    gl.bindTexture(gl.TEXTURE_2D, b.tex)
                    uBlur.f2("uStep", 0, sy)
                    pass(a, blurProg)
                }
            }

            // ── Composite ──
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, bufW, bufH)
            gl.useProgram(compProg)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, scene.tex)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, q4[0] ? q4[0].tex : scene.tex)
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, q8[0] ? q8[0].tex : scene.tex)
            uComp.i1("uScene", 0)
            uComp.i1("uBloomA", 1)
            uComp.i1("uBloomB", 2)
            uComp.f2("uBuf", bufW, bufH)
            uComp.f4("uLook", num(adv.exposure, DEFAULT_ADVANCED.exposure, 20, 400) / 140, Math.min(0.9, 0.6 * bloomAmt), 1 / outScale, pxPerCss)
            const bg = parseColorA(p.background, [0.075, 0.07, 0.07])
            uComp.f4("uBg", bg.c[0], bg.c[1], bg.c[2], bg.a)
            uComp.f4(
                "uFx",
                (num(adv.grain, DEFAULT_ADVANCED.grain, 0, 100) / 100) * 0.12,
                num(adv.vignette, DEFAULT_ADVANCED.vignette, 0, 100) / 100,
                0.06 * (num(adv.stars, DEFAULT_ADVANCED.stars, 0, 200) / 50),
                clock
            )
            uComp.f3("uDustE", dustE[0], dustE[1], dustE[2])
            uComp.f1("uSeed", seed)
            gl.bindVertexArray(quadVao)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            gl.bindVertexArray(null)

            if (q && timerExt) {
                gl.endQuery(timerExt.TIME_ELAPSED_EXT)
                queries.push({ q, level: quality })
            }
            drawn++
            // Hand the ground to the GPU only once a frame is actually on the canvas.
            if (!painted) {
                painted = true
                setGpu(true)
            }
        }

        const pollQueries = () => {
            if (!gl || !timerExt) return
            const disjoint = gl.getParameter(timerExt.GPU_DISJOINT_EXT)
            while (queries.length) {
                const { q, level } = queries[0]
                if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break
                const ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6
                gl.deleteQuery(q)
                queries.shift()
                if (!disjoint && level === quality && warm > 30) gpuEma = gpuEma ? gpuEma * 0.9 + ms * 0.1 : ms
            }
        }

        /** Overall pace at Speed, before the rush. */
        const paceOf = (p: LumenCinchProps): number => num(p.speed, DEFAULTS.speed, 0, 100) / 50
        /** Extra flow pace from the hover rush, as a multiple of the pace (0 at rest). */
        const rushOf = (adv: Advanced): number => HOVER_RUSH * (num(adv.hover, DEFAULT_ADVANCED.hover, 0, 100) / 100) * hover

        /** How often to draw: 60 while the rush changes pace or streaks cross fast, 30 for slow drift, 0 when still. */
        const wantRate = (p: LumenCinchProps): number => {
            const adv = { ...DEFAULT_ADVANCED, ...p.advanced }
            const spd = paceOf(p) * (1 + rushOf(adv))
            if (reduced || spd <= 0) return 0
            if (hover !== hoverTarget) return 60
            const flowPx = FLOW_RATE * (num(adv.flowSpeed, DEFAULT_ADVANCED.flowSpeed, 0, 200) / 100) * spd * map.unit
            return flowPx > SMOOTH_FLOW_PX ? 60 : 30
        }

        const tick = (now: number) => {
            raf = 0
            if (!running) return
            // A restarted loop steps one frame at once, so the first frame after the
            // pointer arrives already moves on rather than repeating the last frame.
            const dt = lastTick < 0 ? 1 / 60 : Math.min(0.1, (now - lastTick) / 1000)
            lastTick = now
            const p = propsRef.current
            const adv = { ...DEFAULT_ADVANCED, ...p.advanced }
            const spd = paceOf(p)
            const rush = rushOf(adv)
            if (!reduced) {
                clock = (clock + dt * spd * (1 + CLOCK_RUSH * rush)) % 36000
                flowPos = (flowPos + dt * spd * (1 + rush) * FLOW_RATE * (num(adv.flowSpeed, DEFAULT_ADVANCED.flowSpeed, 0, 200) / 100)) % 3600
            }

            // One rect read per frame, only when the pointer moved. Off the frame by its rect
            // though no leave arrived means the host swallowed it.
            if (ptrMoved) {
                ptrMoved = false
                const r = root.getBoundingClientRect()
                if (r.width <= 0 || r.height <= 0 || ptrClientX < r.left || ptrClientX >= r.right || ptrClientY < r.top || ptrClientY >= r.bottom) ptrInside = false
                else {
                    ptrU = (ptrClientX - r.left) / r.width
                    ptrV = (ptrClientY - r.top) / r.height
                }
            }
            updateMap(p)
            // On the light? Tested every frame while the pointer is in, since the light
            // breathes and sways under a still cursor.
            onLight = false
            if (ptrInside && !reduced && W > 0 && H > 0) {
                const sh = shapeOf(p, adv, (2 * Math.PI * clock) / (num(adv.breathePeriod, DEFAULT_ADVANCED.breathePeriod, 500, 30000) / 1000), shapeTmp)
                const [wx, wy] = frameToWorld(map, ptrU * W, ptrV * H)
                const env = envData()
                const R = LIGHT_REACH
                const e = Math.max(
                    lightAt(env, sh, wx, wy),
                    lightAt(env, sh, wx - R, wy),
                    lightAt(env, sh, wx + R, wy),
                    lightAt(env, sh, wx, wy - R),
                    lightAt(env, sh, wx, wy + R)
                )
                onLight = e > (hoverTarget > 0 ? LIGHT_OFF : LIGHT_ON)
            }
            hoverTarget = onLight ? 1 : 0
            // The rush on a critically damped spring, in fixed ~4 ms substeps so it runs the
            // same at any refresh rate: it leaves and arrives at rest, and a reversal half-way
            // keeps its speed, so the pace never lurches.
            const wh = 4.74 / (hoverTarget > hover ? HOVER_IN : HOVER_OUT)
            const steps = Math.ceil(dt * 240)
            const h = steps > 0 ? dt / steps : 0
            for (let i = 0; i < steps; i++) {
                hoverVel += (wh * wh * (hoverTarget - hover) - 2 * wh * hoverVel) * h
                hover += hoverVel * h
            }
            if (hover > 1) {
                hover = 1
                hoverVel = Math.min(hoverVel, 0)
            } else if (hover < 0) {
                hover = 0
                hoverVel = Math.max(hoverVel, 0)
            }
            if (Math.abs(hoverTarget - hover) < 0.001 && Math.abs(hoverVel) < 0.01) {
                hover = hoverTarget
                hoverVel = 0
            }

            if (!sameProps(p, lastProps)) {
                lastProps = p
                dirty = true
            }
            const rate = wantRate(p)
            const period = rate > 0 ? 1000 / rate : 0
            // Stepping up from 30 to 60 (the pointer arriving) must not wait out the slow slot.
            if (rate > 0 && due > now + period) due = now + period
            let doDraw = dirty
            if (!doDraw && rate > 0 && now >= due - 3) doDraw = true
            // The tick that settles (the swell snapping to rest) also stops the loop, so draw
            // it: otherwise the last frame on screen keeps a trace of the hover.
            if (rate === 0 && lastRate > 0) doDraw = true
            lastRate = rate
            if (doDraw) {
                if (rate > 0) {
                    due += period
                    if (due < now - period) due = now + period
                }
                pollQueries()
                adaptQuality(now, period, lastDrawAt > 0 ? (now - lastDrawAt) / 1000 : 0)
                lastDrawAt = now
                draw()
                dirty = false
                warm++
            }
            if (drawn - measuredAt >= 30) {
                measuredAt = drawn
                if (measureShown()) resizePending = true
            }
            if (rate > 0 || dirty) raf = requestAnimationFrame(tick)
            else {
                running = false
                lastTick = -1 // a still scene does not bank time
                lastDrawAt = 0
            }
        }

        /**
         * Step resolution down when frames run late and the GPU is the cause; win it back later.
         * Lateness is the gap between draws against the draw period. Judged on the rAF tick
         * instead, a 30 fps cadence on a 60 Hz screen read as twice early and never stepped.
         * Winning resolution back waits until the rush has settled, so it never pops mid-change.
         */
        const adaptQuality = (now: number, period: number, dt: number) => {
            if (period <= 0 || warm < 30 || dt <= 0 || dt > 0.25) return
            const late = (dt * 1000) / period
            lateEma = lateEma * 0.9 + late * 0.1
            const gpuShare = timerExt ? gpuEma / period : late
            if (lateEma > 1.3 && gpuShare > 0.6) {
                slowFor += dt
                goodFor = 0
            } else {
                slowFor = 0
                goodFor += dt
            }
            if (slowFor > 0.5 && quality < QUALITY_LEVELS.length - 1) {
                quality++
                slowFor = goodFor = 0
                banUntil = now + 4000
                gpuEma = 0
                resizePending = true
            } else if (goodFor > 4 && quality > 0 && now > banUntil && hover === hoverTarget && (!timerExt || gpuEma < period * 0.45)) {
                quality--
                goodFor = 0
                gpuEma = 0
                banUntil = now + 8000
                resizePending = true
            }
        }

        /**
         * Run the loop without forcing a draw. The pointer only needs the loop running:
         * the rush asks for 60 fps through wantRate while it changes pace. Marking every pointer
         * event dirty drew on every rAF tick instead, off cadence, which halved the
         * frame rate on an iGPU and made the hover judder.
         */
        const start = () => {
            if (running || !visible || lost || !gl) return
            running = true
            lastTick = -1
            due = 0
            raf = requestAnimationFrame(tick)
        }
        const wake = () => {
            dirty = true
            if (running || !visible || lost || !gl) return
            running = true
            lastTick = -1
            due = 0
            raf = requestAnimationFrame(tick)
        }
        wakeRef.current = () => {
            if (!sameProps(propsRef.current, lastProps)) wake()
        }

        // ── Observers ──
        const ro = new ResizeObserver((entries) => {
            const cr = entries[entries.length - 1].contentRect
            W = cr.width
            H = cr.height
            measureShown()
            resizePending = true
            // Resize and repaint together, before the browser shows a wiped buffer.
            draw()
            wake()
        })
        ro.observe(root)
        const io =
            typeof IntersectionObserver === "function"
                ? new IntersectionObserver((entries) => {
                      visible = entries[entries.length - 1].isIntersecting && document.visibilityState !== "hidden"
                      if (visible) wake()
                  })
                : null
        io?.observe(root)
        const onVis = () => {
            visible = document.visibilityState !== "hidden"
            if (visible) wake()
        }
        document.addEventListener("visibilitychange", onVis)

        const onLost = (e: Event) => {
            e.preventDefault()
            lost = true
            // Leave the Background showing while the GPU is away.
            painted = false
            setGpu(false)
            running = false
            if (raf) cancelAnimationFrame(raf)
            raf = 0
        }
        const onRestored = () => {
            lost = false
            if (initGL()) {
                bufW = bufH = 0
                resizePending = true
                wake()
            }
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)

        if (initGL()) {
            const r = root.getBoundingClientRect()
            W = root.clientWidth || r.width
            H = root.clientHeight || r.height
            measureShown()
            resizePending = true
            wake()
        }

        return () => {
            running = false
            if (raf) cancelAnimationFrame(raf)
            wakeRef.current = () => {}
            ro.disconnect()
            io?.disconnect()
            mq?.removeEventListener?.("change", onMq)
            document.removeEventListener("visibilitychange", onVis)
            root.removeEventListener("pointermove", onEnter)
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onEnter)
            root.removeEventListener("pointerup", onUp)
            root.removeEventListener("pointercancel", onLeave)
            window.removeEventListener("pointermove", onPageMove, { capture: true })
            document.removeEventListener("mouseout", onPageOut)
            window.removeEventListener("blur", onLeave)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            if (gl) {
                for (const t of [scene, q4[0], q4[1], q8[0], q8[1]]) dropTarget(t)
                for (const pr of [glintProg, dustProg, downProg, blurProg, compProg, fieldProg]) if (pr) gl.deleteProgram(pr)
                if (envTex) gl.deleteTexture(envTex)
                if (fibTex) gl.deleteTexture(fibTex)
                if (bedTex) gl.deleteTexture(bedTex)
            }
        }
    }, [])

    // No minWidth/minHeight: the root fills any frame and the hourglass is contained in it.
    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                aspectRatio: `${REF_W} / ${REF_H}`,
                ...style,
                overflow: "hidden",
                background: gpu ? undefined : background,
                touchAction: "pan-y",
            }}
        >
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
        </div>
    )
}

// Control order arranged in the builder.

const __originkitPresetProps = {
  "placement": {
    "x": 0,
    "y": 0,
    "tilt": 0,
    "angle": -180
  },
  "advanced": {
    "dust": 88,
    "haze": 4,
    "lean": 100,
    "push": 4,
    "seed": 22,
    "bloom": 65,
    "grain": 12,
    "lanes": 41,
    "stars": 50,
    "twist": 2,
    "fibres": 175,
    "waistY": 50,
    "breathe": 6,
    "defocus": 100,
    "flicker": 30,
    "exposure": 140,
    "midColor": "#8D6A61",
    "vignette": 10,
    "coreColor": "#D8CCC3",
    "cyanShare": 58,
    "dustColor": "#D8D0C8",
    "flowSpeed": 40,
    "hazeColor": "#6F5449",
    "occupancy": 54,
    "pushRadius": 20,
    "streakWidth": 1,
    "violetColor": "#8A6CFF",
    "violetShare": 85,
    "streakLength": 27,
    "breathePeriod": 6000
  }
};

export { __originkitPresetProps as LumenCinchPreset };

export default function LumenCinch(props: Record<string, unknown>) {
  return <__OriginkitBase_LumenCinch {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
