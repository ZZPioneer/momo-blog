import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Bookmark,
  FileText,
  FolderOpen,
  Images,
  Info,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { useSite } from "../store";
import { mediaUrl } from "../../../shared/model";
import { articleDateParts, articleExcerpt } from "../../../shared/articles";
import { ArrowLink, EditButton, SafeImage } from "./Common";
import { MusicCover } from "./MusicCover";
import { useMusic } from "./Music";
import type { CardActions } from "./HomeCards";
import { sectionNames } from "../navigation";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

// 归档行用「大号日 + 英文月份」的排版，接近杂志目录的读法。
function dateBits(value: string, timeZone: string) {
  const { day } = articleDateParts(value, timeZone);
  const [year = "", month = "", date = ""] = day.split("-");
  const valid =
    /^\d{4}$/.test(year) && /^\d{2}$/.test(month) && /^\d{2}$/.test(date);
  if (!valid)
    return {
      stamp: "",
      dayNum: "—",
      monthLabel: "",
      yearLabel: "",
      short: "待完善",
    };
  return {
    stamp: `${year}-${month}-${date}`,
    dayNum: date,
    monthLabel: MONTHS[Number(month) - 1] ?? "",
    yearLabel: year,
    short: `${year}.${month}`,
  };
}

const readingMinutes = (text: string) =>
  Math.max(1, Math.round(text.replace(/\s+/g, "").length / 320));

const numberLabel = (value: number) =>
  value >= 10000
    ? `${(value / 10000).toFixed(1)}w`
    : new Intl.NumberFormat("zh-CN").format(value);

export function ClassicHome({
  now,
  open,
  edit,
}: CardActions & { now: Date }) {
  const { content, stats, editing } = useSite();
  const player = useMusic();
  const [year, setYear] = useState("all");
  const timeZone = content?.location.timeZone || "Australia/Sydney";

  const articles = useMemo(() => {
    if (!content) return [];
    return content.articles
      .map((article) => ({
        ...article,
        bits: dateBits(article.date, timeZone),
      }))
      .sort((a, b) =>
        (b.bits.stamp || b.date).localeCompare(a.bits.stamp || a.date),
      );
  }, [content, timeZone]);

  const years = useMemo(
    () =>
      Array.from(
        new Set(articles.map((article) => article.bits.yearLabel).filter(Boolean)),
      ).sort((a, b) => b.localeCompare(a)),
    [articles],
  );

  const tags = useMemo<
    { id: string; name: string; count?: number; url?: string }[]
  >(() => {
    if (!content) return [];
    const curated = content.tags ?? [];
    if (curated.length)
      return curated.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag.count,
        url: tag.url,
      }));
    return [
      { id: "articles", name: "文字", count: content.articles.length },
      { id: "photos", name: "相册", count: content.photos.length },
      { id: "projects", name: "项目", count: content.projects.length },
      { id: "collections", name: "收集", count: content.collections.length },
      { id: "tracks", name: "音乐", count: content.tracks.length },
      { id: "friends", name: "友链", count: content.friends.length },
    ].filter((tag) => tag.count > 0);
  }, [content]);

  if (!content) return null;

  const [featured, ...rest] = articles;
  const listed =
    year === "all"
      ? rest
      : articles.filter((article) => article.bits.yearLabel === year);
  const banner = content.photos[0];
  const avatarId = content.profile.avatarId;
  const total =
    content.articles.length +
    content.photos.length +
    content.projects.length +
    content.collections.length;

  const clockTime = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const clockDate = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);

  const scrollTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  const nav = [
    {
      key: "all",
      label: "全部",
      count: total,
      icon: Sparkles,
      onSelect: () => scrollTo("classic-top"),
    },
    {
      key: "articles",
      label: sectionNames.articles,
      count: content.articles.length,
      icon: FileText,
      onSelect: () => open("articles"),
    },
    {
      key: "photos",
      label: sectionNames.photos,
      count: content.photos.length,
      icon: Images,
      onSelect: () => open("photos"),
    },
    {
      key: "projects",
      label: sectionNames.projects,
      count: content.projects.length,
      icon: FolderOpen,
      onSelect: () => open("projects"),
    },
    {
      key: "collections",
      label: sectionNames.collections,
      count: content.collections.length,
      icon: Bookmark,
      onSelect: () => open("collections"),
    },
    {
      key: "friends",
      label: sectionNames.friends,
      count: content.friends.length,
      icon: Users,
      onSelect: () => open("friends"),
    },
    {
      key: "about",
      label: "关于我",
      icon: Info,
      onSelect: () => open("about"),
    },
  ];

  return (
    <div className="classic-page" id="classic-top">
      <header className="classic-hero">
        <div
          className={`classic-hero__bg${banner ? "" : " is-plain"}`}
          style={
            banner
              ? ({
                  backgroundImage: `url(${JSON.stringify(mediaUrl(banner.mediaId))})`,
                } as CSSProperties)
              : undefined
          }
          aria-hidden="true"
        />
        <span className="classic-hero__veil" aria-hidden="true" />
        <div className="classic-hero__inner">
          <span className="classic-hero__eyebrow">
            {content.profile.eyebrow || "A PERSONAL SPACE"}
          </span>
          <h1>
            {content.profile.name}
            <span> 的 Blog</span>
          </h1>
          <p className="classic-hero__sub">
            {content.profile.introduction || content.profile.description}
          </p>
          <button
            className="classic-hero__cta"
            onClick={() => scrollTo("classic-archive")}
          >
            开始阅读
            <ArrowDown size={18} />
          </button>
        </div>
        <div className="classic-hero__foot">
          <span>
            {banner
              ? [banner.title, banner.location].filter(Boolean).join(" · ")
              : content.profile.motto}
          </span>
          <span>
            {content.articles.length} 篇文字 · {content.photos.length} 张照片
          </span>
        </div>
      </header>

      <div className="classic-body">
        <aside className="classic-side" aria-label="站点索引">
          <div className="classic-side__id">
            {avatarId ? (
              <SafeImage
                className="classic-side__avatar"
                src={mediaUrl(avatarId, true)}
                alt={`${content.profile.name} 的头像`}
              />
            ) : (
              <span className="classic-side__avatar is-empty" aria-hidden="true">
                {content.profile.name.slice(0, 1)}
              </span>
            )}
            <div className="classic-side__name">
              <strong>{content.profile.name}</strong>
              <span>{content.profile.motto || "PERSONAL SPACE"}</span>
            </div>
          </div>

          <nav className="classic-side__nav">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={item.key === "all" ? "is-active" : ""}
                  aria-current={item.key === "all" ? "page" : undefined}
                  onClick={item.onSelect}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {!!item.count && <i>{item.count}</i>}
                </button>
              );
            })}
          </nav>

          <div className="classic-side__now">
            <strong>{clockTime}</strong>
            <span>{clockDate}</span>
            <span className="classic-side__place">
              <MapPin size={14} />
              {[content.location.name, content.location.region]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>

          {player.track && (
            <div className="classic-player">
              <MusicCover
                coverId={player.track.coverId}
                audioId={player.track.audioId}
                alt="正在播放的封面"
                className="classic-player__cover"
              />
              <div className="classic-player__meta">
                <strong>{player.track.title}</strong>
                <span>{player.track.artist}</span>
              </div>
              <button
                className="classic-player__toggle"
                aria-label={player.playing ? "暂停播放" : "播放音乐"}
                onClick={player.toggle}
              >
                {player.playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          )}

          {stats && (
            <div className="classic-stats">
              <div>
                <strong>{numberLabel(stats.todayVisitors)}</strong>
                <span>今日来访</span>
              </div>
              <div>
                <strong>{numberLabel(stats.totalViews)}</strong>
                <span>总浏览</span>
              </div>
              <div>
                <strong>{stats.daysOnline}</strong>
                <span>天在线</span>
              </div>
            </div>
          )}
        </aside>

        <div className="classic-feed">
          <section className="classic-section" aria-labelledby="classic-latest">
            <div className="classic-section-head">
              <h2 id="classic-latest">
                最近更新 <small>LATEST</small>
              </h2>
              <div className="classic-section-tools">
                <EditButton
                  onClick={() => edit("articles")}
                  label="编辑文章"
                />
                <ArrowLink onClick={() => open("articles")}>全部文字</ArrowLink>
              </div>
            </div>
            {featured ? (
              <button
                className="classic-feature"
                onClick={() => open("articles", featured.id)}
              >
                <span className="classic-feature__media" aria-hidden="true">
                  {featured.coverId ? (
                    <SafeImage src={mediaUrl(featured.coverId, true)} alt="" />
                  ) : (
                    <span className="classic-feature__fallback" />
                  )}
                </span>
                <span className="classic-feature__veil" aria-hidden="true" />
                <span className="classic-feature__body">
                  <span className="classic-pin">置顶</span>
                  <strong className="classic-feature__title">
                    {featured.title || "未命名的文字"}
                  </strong>
                  <span className="classic-feature__excerpt">
                    {articleExcerpt(featured) || "这段文字还没有摘要。"}
                  </span>
                  <span className="classic-feature__meta">
                    <span>{featured.bits.short}</span>
                    <span>约 {readingMinutes(featured.body)} 分钟</span>
                  </span>
                </span>
                <span className="classic-feature__date">
                  <strong>{featured.bits.dayNum}</strong>
                  <span>
                    {featured.bits.monthLabel} {featured.bits.yearLabel}
                  </span>
                </span>
              </button>
            ) : (
              <p className="classic-empty">
                还没有文字。在编辑器里写下第一段，这里就会亮起来。
              </p>
            )}
          </section>

          <section
            className="classic-section"
            id="classic-archive"
            aria-labelledby="classic-archive-title"
          >
            <div className="classic-section-head">
              <h2 id="classic-archive-title">
                文章归档 <small>{articles.length} 篇</small>
              </h2>
              <div className="classic-year-filter" role="group" aria-label="按年份筛选">
                <button
                  aria-pressed={year === "all"}
                  onClick={() => setYear("all")}
                >
                  全部
                </button>
                {years.map((item) => (
                  <button
                    key={item}
                    aria-pressed={year === item}
                    onClick={() => setYear(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            {listed.length ? (
              <ol className="classic-archive">
                {listed.map((article) => (
                  <li key={article.id}>
                    <button onClick={() => open("articles", article.id)}>
                      <span className="classic-archive__date">
                        <strong>{article.bits.dayNum}</strong>
                        <span>
                          {article.bits.monthLabel} {article.bits.yearLabel}
                        </span>
                      </span>
                      <span className="classic-archive__body">
                        <strong>{article.title || "未命名的文字"}</strong>
                        <span className="classic-archive__excerpt">
                          {articleExcerpt(article) || "还没有写下摘要。"}
                        </span>
                        <span className="classic-archive__meta">
                          <span>文字</span>
                          <span>约 {readingMinutes(article.body)} 分钟</span>
                        </span>
                      </span>
                      <ArrowUpRight
                        size={20}
                        className="classic-archive__go"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="classic-empty">
                {year === "all" && rest.length === 0
                  ? "所有文字都在上面的置顶卡片里。"
                  : "这一年还没有写下什么。"}
              </p>
            )}
          </section>

          {content.projects.length > 0 && (
            <section className="classic-section" aria-labelledby="classic-works">
              <div className="classic-section-head">
                <h2 id="classic-works">
                  精选作品 <small>{content.projects.length}</small>
                </h2>
                <div className="classic-section-tools">
                  <EditButton onClick={() => edit("projects")} label="编辑项目" />
                  <ArrowLink onClick={() => open("projects")}>全部项目</ArrowLink>
                </div>
              </div>
              <div className="classic-projects">
                {content.projects.map((project) => (
                  <button
                    key={project.id}
                    className="classic-project"
                    onClick={() => open("projects", project.id)}
                  >
                    <span className="classic-project__thumb">
                      {project.coverId ? (
                        <SafeImage
                          src={mediaUrl(project.coverId, true)}
                          alt=""
                        />
                      ) : (
                        <FolderOpen size={28} aria-hidden="true" />
                      )}
                    </span>
                    <span className="classic-project__body">
                      <strong>{project.title || "未命名作品"}</strong>
                      <span>
                        {project.summary ||
                          project.description.slice(0, 120) ||
                          "还没有写下简介。"}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="classic-project__go"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {content.photos.length > 0 && (
            <section className="classic-section" aria-labelledby="classic-shots">
              <div className="classic-section-head">
                <h2 id="classic-shots">
                  最近相册 <small>{content.photos.length} 张</small>
                </h2>
                <div className="classic-section-tools">
                  <EditButton onClick={() => edit("photos")} label="编辑相册" />
                  <ArrowLink onClick={() => open("photos")}>全部照片</ArrowLink>
                </div>
              </div>
              <div className="classic-photos">
                {content.photos.slice(0, 4).map((photo) => (
                  <button
                    key={photo.id}
                    aria-label={`查看照片：${photo.title || "日常"}`}
                    onClick={() => open("photos", photo.id)}
                  >
                    <SafeImage
                      src={mediaUrl(photo.mediaId, true)}
                      alt={photo.title || "日常照片"}
                    />
                    <span className="classic-photos__label">
                      {photo.title || "日常"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {tags.length > 0 && (
            <section className="classic-section" aria-labelledby="classic-tags">
              <div className="classic-section-head">
                <h2 id="classic-tags">
                  热门标签 <small>TAGS</small>
                </h2>
              </div>
              <div className="classic-tags">
                {tags.map((tag) => {
                  const section = Object.hasOwn(sectionNames, tag.id)
                    ? (tag.id as keyof typeof sectionNames)
                    : null;
                  const label = (
                    <>
                      <i>#</i>
                      {tag.name}
                      {!!tag.count && <em>{tag.count}</em>}
                    </>
                  );
                  if (tag.url)
                    return (
                      <a
                        key={tag.id}
                        className="classic-tag"
                        href={tag.url}
                        target={tag.url.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                      >
                        {label}
                      </a>
                    );
                  if (section)
                    return (
                      <button
                        key={tag.id}
                        className="classic-tag"
                        onClick={() => open(section)}
                      >
                        {label}
                      </button>
                    );
                  return (
                    <span key={tag.id} className="classic-tag">
                      {label}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {editing && (
            <p className="classic-edit-hint">正在编辑：改动会实时出现在这里。</p>
          )}

          <section className="classic-outro">
            <p>{content.profile.motto || "Made with curiosity."}</p>
            <div>
              <button onClick={() => open("about")}>
                认识我
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => open("contact")}>
                聊聊
                <ArrowUpRight size={17} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
