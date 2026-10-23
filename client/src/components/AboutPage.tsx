import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  BookHeart,
  Code,
  FileText,
  FolderOpen,
  Images,
  Mail,
  Shuffle,
  Tv,
  Users,
} from "lucide-react";
import { useSite } from "../store";
import { DEFAULT_ABOUT_BODY, mediaUrl } from "../../../shared/model";
import { articleDateParts, articleExcerpt } from "../../../shared/articles";
import { EditButton, SafeImage } from "./Common";
import type { CardActions } from "./HomeCards";

/* 幕布只在一次页面访问里演一次，避免来回切页时反复播放。 */
let introPlayed = false;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ACCENTS = [
  "var(--abt-sun)",
  "var(--abt-mint)",
  "var(--abt-coral)",
  "var(--abt-violet)",
];

type Card = {
  id: string;
  no: string;
  label: string;
  en: string;
  heading: string;
  footer: string;
  accent: string;
  body: ReactNode;
};

const stripScheme = (value: string) =>
  value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

export function AboutPage({
  now,
  open,
  edit,
}: CardActions & { now: Date }) {
  const { content, stats, editing } = useSite();
  const [active, setActive] = useState(0);
  const [intro, setIntro] = useState(() => !introPlayed && !reducedMotion());
  const [leaving, setLeaving] = useState(false);
  const deck = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!intro) return;
    introPlayed = true;
    const out = window.setTimeout(() => setLeaving(true), 1480);
    const done = window.setTimeout(() => setIntro(false), 2540);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, [intro]);

  const timeZone = content?.location.timeZone || "Australia/Sydney";

  const cards = useMemo<Card[]>(() => {
    if (!content) return [];
    const p = content.profile;
    const nameEn = p.name.toUpperCase();
    const paragraphs = (p.aboutBody || DEFAULT_ABOUT_BODY)
      .split(/\n{2,}|\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const avatar = p.avatarId ? mediaUrl(p.avatarId, true) : null;
    const facts = [
      { value: content.articles.length, label: "篇文字" },
      { value: content.photos.length, label: "张照片" },
      { value: content.projects.length, label: "件作品" },
      { value: content.collections.length, label: "个收藏" },
      { value: stats?.daysOnline ?? 0, label: "天在线" },
    ].filter((fact) => fact.value > 0);

    return [
      {
        id: "about",
        no: "01",
        label: "关于",
        en: "ABOUT",
        heading: p.introduction || p.description,
        footer: `${p.motto || "走走停停"} W/ ABOUT — ${p.name}`,
        accent: ACCENTS[0],
        body: (
          <div className="abt-prose">
            {avatar && (
              <figure className="abt-figure">
                <SafeImage src={avatar} alt={`${p.name} 的头像`} />
                <figcaption>{p.eyebrow || "A PERSONAL SPACE"}</figcaption>
              </figure>
            )}
            {paragraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
            {facts.length > 0 && (
              <div
                className="abt-facts"
                style={{
                  gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))`,
                }}
              >
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <strong>{fact.value}</strong>
                    <span>{fact.label}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="abt-prose__sign">
              {p.eyebrow || "A PERSONAL SPACE"} · {nameEn}
            </p>
          </div>
        ),
      },
      {
        id: "writing",
        no: "02",
        label: "文字",
        en: "WRITING",
        heading: `${content.articles.length} 篇文字，按最近一次落笔排列。`,
        footer: `阅读记录 W/ WRITING — ${p.name}`,
        accent: ACCENTS[1],
        body: (
          <ol className="abt-index">
            {content.articles.slice(0, 4).map((article) => (
              <li key={article.id}>
                <button onClick={() => open("articles", article.id)}>
                  <span className="abt-index__date">
                    {articleDateParts(article.date, timeZone).day || "待完善"}
                  </span>
                  <span className="abt-index__body">
                    <strong>{article.title || "未命名的文字"}</strong>
                    <span>{articleExcerpt(article) || "还没有写下摘要。"}</span>
                  </span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
            {content.articles.length === 0 && (
              <li className="abt-index__empty">还没有文字，第一篇正在路上。</li>
            )}
          </ol>
        ),
      },
      {
        id: "works",
        no: "03",
        label: "作品",
        en: "WORKS",
        heading: `${content.projects.length} 个做出来的东西，从想法到上线。`,
        footer: `作品集 W/ WORKS — ${p.name}`,
        accent: ACCENTS[2],
        body: (
          <ul className="abt-works">
            {content.projects.map((project) => (
              <li key={project.id}>
                <button onClick={() => open("projects", project.id)}>
                  <span className="abt-works__thumb">
                    {project.coverId ? (
                      <SafeImage src={mediaUrl(project.coverId, true)} alt="" />
                    ) : (
                      <i>{project.title.slice(0, 1) || "·"}</i>
                    )}
                  </span>
                  <span className="abt-works__body">
                    <strong>{project.title || "未命名作品"}</strong>
                    <span>
                      {project.summary ||
                        project.description.slice(0, 140) ||
                        "还没有写下简介。"}
                    </span>
                  </span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
            {content.projects.length === 0 && (
              <li className="abt-index__empty">
                还没有作品，下一件正在构思。
              </li>
            )}
          </ul>
        ),
      },
      {
        id: "frames",
        no: "04",
        label: "相册",
        en: "FRAMES",
        heading: `${content.photos.length} 张照片，都是路上随手留下的。`,
        footer: `日常切片 W/ FRAMES — ${p.name}`,
        accent: ACCENTS[3],
        body: (
          <div className="abt-shots">
            {content.photos.slice(0, 4).map((photo) => (
              <button
                key={photo.id}
                onClick={() => open("photos", photo.id)}
                aria-label={`查看照片：${photo.title || "日常"}`}
              >
                <SafeImage
                  src={mediaUrl(photo.mediaId, true)}
                  alt={photo.title || "日常照片"}
                />
                <span>
                  {photo.title || "日常"}
                  {photo.location && <em>{photo.location}</em>}
                </span>
              </button>
            ))}
            {content.photos.length === 0 && (
              <p className="abt-index__empty">相册还是空的，风景正在路上。</p>
            )}
          </div>
        ),
      },
    ];
  }, [content, open, timeZone, stats]);

  /* 幕布上的巨型标记：优先用顶部标签的三段词，取不到就用站名。 */
  const markLines = useMemo(() => {
    if (!content) return ["MOMO"];
    const raw = content.profile.eyebrow?.trim() || "";
    const byDot = raw.split(/\s*[·/|•]\s*/).filter(Boolean);
    const bySpace = raw.split(/\s+/).filter(Boolean);
    const words = byDot.length >= 2 ? byDot : bySpace.length >= 2 ? bySpace : [];
    const lines = (words.length >= 2 ? words : [content.profile.name]).slice(0, 3);
    return lines.map((line) => line.toUpperCase());
  }, [content]);

  if (!content) return null;

  const card = cards[active] ?? cards[0];
  const initial = content.profile.name.trim().charAt(0).toUpperCase() || "M";
  const clock = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const socials = [
    {
      key: "github",
      label: "GITHUB",
      note: stripScheme(content.social.github),
      href: content.social.github,
      icon: Code,
    },
    {
      key: "bilibili",
      label: "BILIBILI",
      note: stripScheme(content.social.bilibili),
      href: content.social.bilibili,
      icon: Tv,
    },
    {
      key: "xiaohongshu",
      label: "小红书",
      note: stripScheme(content.social.xiaohongshu),
      href: content.social.xiaohongshu,
      icon: BookHeart,
    },
    {
      key: "email",
      label: "EMAIL",
      note: content.social.email,
      href: content.social.email ? `mailto:${content.social.email}` : "",
      icon: Mail,
    },
  ].filter((item) => item.href);

  /* 还没填社交链接时，左栏用站内栏目当导览，避免整列空白。 */
  const explore = [
    {
      key: "articles",
      label: "WRITING",
      note: `${content.articles.length} 篇文字`,
      onSelect: () => open("articles"),
      icon: FileText,
    },
    {
      key: "projects",
      label: "WORKS",
      note: `${content.projects.length} 件作品`,
      onSelect: () => open("projects"),
      icon: FolderOpen,
    },
    {
      key: "photos",
      label: "FRAMES",
      note: `${content.photos.length} 张照片`,
      onSelect: () => open("photos"),
      icon: Images,
    },
    {
      key: "friends",
      label: "LINKS",
      note: `${content.friends.length} 位朋友`,
      onSelect: () => open("friends"),
      icon: Users,
    },
  ];

  const mark = (
    <span className="abt-mark" aria-hidden="true">
      {markLines.map((line, lineIndex) => (
        <span
          className={`abt-mark__line abt-mark__line--${lineIndex + 1}`}
          key={lineIndex}
        >
          {[...line].map((char, charIndex) => (
            <span
              className="abt-mark__letter"
              key={charIndex}
              style={{
                animationDelay: `${(lineIndex * 0.13 + charIndex * 0.032).toFixed(3)}s`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );

  return (
    <div className={`abt-page${intro ? " is-intro" : ""}`}>
      <div className="abt-grid">
        <aside className="abt-side" aria-label="社交平台">
          <p className="abt-side__head">
            {socials.length ? "FIND ME / 社交平台" : "EXPLORE / 站内导览"}
          </p>
          <ul className="abt-side__list">
            {socials.map((item) => {
              const Icon = item.icon;
              const isMail = item.key === "email";
              return (
                <li key={item.key}>
                  <a
                    className="abt-side__row"
                    href={item.href}
                    target={isMail ? undefined : "_blank"}
                    rel="noreferrer"
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="abt-side__label">
                      <strong>{item.label}</strong>
                      <small>{item.note}</small>
                    </span>
                    <span className="abt-side__arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              );
            })}
            {socials.length === 0 &&
              explore.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <button
                      className="abt-side__row"
                      onClick={item.onSelect}
                      aria-label={`打开${item.label}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span className="abt-side__label">
                        <strong>{item.label}</strong>
                        <small>{item.note}</small>
                      </span>
                      <span className="abt-side__arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
          <p className="abt-side__note">
            {[content.location.name, content.location.region]
              .filter(Boolean)
              .join(", ")}{" "}
            · {clock}
          </p>
        </aside>

        <div className="abt-center">
          {editing && (
            <div className="abt-center__tools">
              <EditButton
                onClick={() => edit("profile")}
                label="编辑关于我"
              />
            </div>
          )}
          <article
            key={card.id}
            className="abt-profile"
            style={{ "--abt-accent": card.accent } as CSSProperties}
          >
            <header className="abt-profile__head">
              <p className="abt-eyebrow">PROFILE CARD NO. {card.no}</p>
              <h1 className="abt-title">
                <span className="abt-title__mark">{initial}/</span>
                {card.label}
              </h1>
              <p className="abt-english">
                {card.en} PROFILE · {content.profile.name.toUpperCase()}
              </p>
              {card.heading && <p className="abt-lead">{card.heading}</p>}
            </header>
            <div className="abt-body">{card.body}</div>
            <footer className="abt-profile__foot">
              <p>{card.footer}</p>
              <span>
                No. {card.no} / {card.en}
              </span>
            </footer>
          </article>
        </div>

        <aside className="abt-deck" aria-label="介绍牌组">
          <div className="abt-deck__sticky">
            <p className="abt-deck__head">
              <span>CHOOSE A PROFILE</span>
              <span>{cards.length} CARDS</span>
            </p>
            <div className="abt-deck__control">
              <button
                className="abt-deck__all"
                onClick={() => setActive(0)}
                aria-label="回到第一张牌"
              >
                <strong>所有</strong>
                <small>浏览全部牌组</small>
              </button>
              <button
                className="abt-deck__shuffle"
                aria-label="随机看一张"
                onClick={() => {
                  if (cards.length < 2) return;
                  let next = active;
                  while (next === active)
                    next = Math.floor(Math.random() * cards.length);
                  setActive(next);
                }}
              >
                <Shuffle size={15} />
              </button>
            </div>
            <div className="abt-deck__stack" ref={deck}>
              {cards.map((item, index) => (
                <button
                  key={item.id}
                  className={`abt-deck__card${index === active ? " is-active" : ""}`}
                  style={{ "--abt-accent": item.accent } as CSSProperties}
                  aria-pressed={index === active}
                  onClick={() => setActive(index)}
                >
                  <span className="abt-mini" aria-hidden="true">
                    <span className="abt-mini__title">
                      <i>{initial}/</i>
                      {item.label}
                    </span>
                    <span className="abt-mini__lines" />
                    <span className="abt-mini__lines" />
                    <span className="abt-mini__lines is-short" />
                    <span className="abt-mini__lines" />
                    <span className="abt-mini__lines is-mid" />
                  </span>
                  <span className="abt-deck__card-no">No. {item.no}</span>
                  <span className="abt-deck__card-en">{item.en}</span>
                  <span className="abt-deck__card-label">{item.label}</span>
                  <span className="abt-deck__card-view">查看 W/{item.label}</span>
                </button>
              ))}
            </div>
            {stats && (
              <p className="abt-deck__stats">
                <span>{stats.daysOnline} 天在线</span>
                <span>{stats.totalViews} 次浏览</span>
              </p>
            )}
          </div>
        </aside>
      </div>

      {intro && (
        <div
          className={`abt-curtain${leaving ? " is-out" : ""}`}
          aria-hidden="true"
        >
          {[0, 1, 2].map((slice) => (
            <span className="abt-curtain__slice" key={slice}>
              <span className="abt-curtain__surface" />
              {mark}
              <span className="abt-curtain__grain" />
            </span>
          ))}
          <span className="abt-curtain__base" />
        </div>
      )}
    </div>
  );
}
