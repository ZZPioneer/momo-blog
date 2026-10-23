import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ListMusic,
  X,
  GripVertical,
  ListOrdered,
  Repeat,
  Repeat1,
  Shuffle,
} from "lucide-react";
import { useMusic } from "./Music";
import { MusicCover } from "./MusicCover";
import { playbackModes, type PlaybackMode } from "../playback";

const TOP_KEY = "momoblog:music-fab-top";

type LyricLine = { time: number; text: string };

function parseLyrics(raw?: string): LyricLine[] {
  if (!raw) return [];
  const out: LyricLine[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
    if (m) {
      const min = +m[1];
      const sec = +m[2];
      const cs = m[3] ? +m[3] / 100 : 0;
      out.push({ time: min * 60 + sec + cs, text: trimmed.slice(m[0].length).trim() });
    } else {
      out.push({ time: -1, text: trimmed });
    }
  }
  return out;
}

const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const playbackModeIcons: Record<PlaybackMode, typeof Play> = {
  sequential: ListOrdered,
  "repeat-all": Repeat,
  "repeat-one": Repeat1,
  shuffle: Shuffle,
};

export function FloatingMusic() {
  const p = useMusic();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [top, setTop] = useState<number>(() => {
    const saved = Number(localStorage.getItem(TOP_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 140;
  });
  const drag = useRef<{ startY: number; startTop: number } | null>(null);
  const lyricsRef = useRef<HTMLOListElement>(null);
  const activeLineRef = useRef<HTMLLIElement>(null);

  const lyrics = useMemo(() => parseLyrics(p.track?.lyrics), [p.track?.lyrics]);

  // 当前歌词行（基于播放进度）。放进 useMemo 并显式依赖 p.time，
  // 确保播放/拖动进度前进时高亮实时重算；依赖数组包含 p.time，
  // 避免误将该计算 memo 化时漏掉时间依赖。
  const activeIndex = useMemo(() => {
    if (!lyrics.length) return 0;
    const timed = lyrics.filter((l) => l.time >= 0);
    let idx = -1;
    for (let i = 0; i < timed.length; i++) {
      if (timed[i].time <= p.time + 0.25) idx = i;
      else break;
    }
    return idx < 0 ? 0 : lyrics.indexOf(timed[idx]);
  }, [lyrics, p.time]);

  useEffect(() => {
    if (drawerOpen && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [drawerOpen, activeIndex]);

  if (!p.track) return null;

  const clamp = (value: number) =>
    Math.max(76, Math.min(window.innerHeight - 110, value));

  const startDrag = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, startTop: top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const next = clamp(drag.current.startTop + (e.clientY - drag.current.startY));
    setTop(next);
    localStorage.setItem(TOP_KEY, String(next));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current) {
      drag.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const modeIndex = playbackModes.findIndex((m) => m.value === p.mode);
  const ModeIcon = playbackModeIcons[p.mode];

  return (
    <>
      <div
        className="music-fab"
        style={{ top } as CSSProperties}
        role="region"
        aria-label="悬浮音乐播放器"
      >
        <button
          className="music-fab__grip"
          aria-label="拖动以调整位置"
          title="拖动调整位置"
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <GripVertical size={14} />
        </button>

        <button
          className="music-fab__main"
          onClick={() => setDrawerOpen(true)}
          aria-label={`打开音乐详情：${p.track.title || "未命名"}`}
        >
          <MusicCover
            className="music-fab__cover"
            coverId={p.track.coverId}
            audioId={p.track.audioId}
            alt={`${p.track.title || "当前歌曲"} 封面`}
          />
          <span className="music-fab__meta">
            <span className="music-fab__title">{p.track.title || "未命名歌曲"}</span>
            <span className="music-fab__artist">{p.track.artist || "未知艺术家"}</span>
            <span
              className="music-fab__bar"
              style={{ "--progress": `${p.duration ? (p.time / p.duration) * 100 : 0}%` } as CSSProperties}
            />
          </span>
        </button>

        <div className="music-fab__controls">
          <button
            className="music-fab__btn"
            aria-label={p.playing ? "暂停" : "播放"}
            onClick={p.error ? p.retry : p.toggle}
          >
            {p.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button className="music-fab__btn" aria-label="下一首" onClick={() => p.step(1)}>
            <SkipForward size={15} />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="music-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside
            className="music-drawer"
            role="dialog"
            aria-label="音乐详情"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="music-drawer__head">
              <span className="eyebrow">ON REPEAT</span>
              <button
                className="music-drawer__close"
                aria-label="关闭"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </header>

            <div className="music-drawer__cover-wrap">
              <MusicCover
                className="music-drawer__cover"
                coverId={p.track.coverId}
                audioId={p.track.audioId}
                alt={`${p.track.title || "当前歌曲"} 封面`}
              />
            </div>

            <div className="music-drawer__info">
              <strong>{p.track.title || "未命名歌曲"}</strong>
              <small>{p.track.artist || "未知艺术家"}</small>
            </div>

            <input
              className="progress music-drawer__progress"
              aria-label="播放进度"
              type="range"
              min="0"
              max={p.duration || 1}
              step=".1"
              value={p.time}
              disabled={!p.duration}
              onChange={(e) => p.seek(Number(e.target.value))}
              style={{ "--progress": `${p.duration ? (p.time / p.duration) * 100 : 0}%` } as CSSProperties}
            />
            <div className="time-label music-drawer__time">
              <span>{timeLabel(p.time)}</span>
              <span>{timeLabel(p.duration)}</span>
            </div>

            <div className="music-drawer__controls">
              <button aria-label="上一首" disabled={p.tracks.length < 2} onClick={() => p.step(-1)}>
                <SkipBack size={20} />
              </button>
              <button className="play-button" aria-label={p.playing ? "暂停" : "播放"} onClick={p.toggle}>
                {p.playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>
              <button aria-label="下一首" disabled={p.tracks.length < 2} onClick={() => p.step(1)}>
                <SkipForward size={20} />
              </button>
            </div>

            <div className="music-drawer__row">
              <button
                className="playback-mode playback-mode-compact"
                title={`${playbackModes[modeIndex].label} · 点击切换`}
                aria-label={`播放模式：${playbackModes[modeIndex].label}`}
                onClick={() => p.setMode(playbackModes[(modeIndex + 1) % playbackModes.length].value)}
              >
                <ModeIcon size={17} />
                <span>{playbackModes[modeIndex].label}</span>
              </button>
              <label className="music-drawer__volume" aria-label="音量">
                <Volume2 size={17} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={p.volume}
                  onChange={(e) => p.setVolume(Number(e.target.value))}
                />
              </label>
            </div>

            {p.error && (
              <div className="audio-error" role="alert">
                {p.error}
                <button onClick={p.retry}>重试</button>
              </div>
            )}

            <div className="music-drawer__section">
              <h3>
                <ListMusic size={15} /> 播放列表
              </h3>
              <ol className="music-drawer__playlist">
                {p.tracks.map((track, i) => (
                  <li key={track.id}>
                    <button
                      className={`music-drawer__track ${p.track?.id === track.id ? "is-current" : ""}`}
                      aria-pressed={p.track?.id === track.id}
                      onClick={() => p.select(track.id)}
                    >
                      <span className="music-drawer__index">{String(i + 1).padStart(2, "0")}</span>
                      <MusicCover
                        className="music-drawer__track-cover"
                        coverId={track.coverId}
                        audioId={track.audioId}
                        alt=""
                      />
                      <span className="music-drawer__track-info">
                        <strong>{track.title || "未命名歌曲"}</strong>
                        {track.artist && <small>{track.artist}</small>}
                      </span>
                      {p.track?.id === track.id && (
                        <span className="music-drawer__track-status">
                          {p.playing ? "播放中" : "已选"}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="music-drawer__section">
              <h3>歌词</h3>
              {lyrics.length ? (
                <ol className="music-drawer__lyrics" ref={lyricsRef}>
                  {lyrics.map((line, i) => (
                    <li
                      key={i}
                      ref={i === activeIndex ? activeLineRef : undefined}
                      className={i === activeIndex ? "is-active" : ""}
                    >
                      {line.text}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="music-drawer__no-lyrics">暂无歌词</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
