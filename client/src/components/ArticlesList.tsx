import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { mediaUrl, type Article } from "../../../shared/model";
import { articleExcerpt } from "../../../shared/articles";
import { SafeImage } from "./Common";

function zhDate(value: string, timeZone: string) {
  const ok = /^\d{4}-\d{2}-\d{2}/.test(value);
  if (!ok) return value;
  const [day] = value.split("T");
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timeZone || "UTC",
    }).format(d);
  } catch {
    return day;
  }
}

function hostOf(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * /articles 列表（复刻 windndream.com/technology 的卡片栅格）。
 * 卡片结构严格对齐参考站：封面图 → 日期·作者 → 标题 → 摘要 → 阅读全文 + 标签。
 */
export function ArticlesList({
  articles,
  author,
  timeZone,
  onSelect,
}: {
  articles: Article[];
  author: string;
  timeZone: string;
  onSelect: (id: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current || !gridRef.current) {
      setRevealed(new Set(articles.map((a) => a.id)));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const next = new Set(revealed);
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.id;
          if (id && e.isIntersecting) {
            next.add(id);
            io.unobserve(e.target);
          }
        }
        setRevealed(next);
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    gridRef.current
      .querySelectorAll<HTMLElement>(".tech-card")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
    // 仅在列表内容变化时重新观察
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles]);

  if (!articles.length)
    return <p className="tech-empty">这里会慢慢长出新的文字。</p>;

  return (
    <div className="tech-list" ref={gridRef}>
      {articles.map((a, i) => {
        const tags = a.tags?.length
          ? a.tags.slice(0, 4)
          : a.url
            ? [hostOf(a.url)]
            : [];
        const inView = revealed.has(a.id);
        return (
          <article
            key={a.id}
            data-id={a.id}
            className={`tech-card${a.coverId ? "" : " tech-card--text"}${
              inView ? " is-in" : ""
            }`}
            style={{ ["--i" as string]: i } as React.CSSProperties}
          >
            <button
              type="button"
              className="tech-card__hit"
              onClick={() => onSelect(a.id)}
              aria-label={a.title || "阅读这篇文章"}
            >
              {a.coverId && (
                <span className="tech-card__media">
                  <SafeImage
                    src={mediaUrl(a.coverId, true)}
                    alt={a.title || ""}
                  />
                  <span className="tech-card__media-shade" aria-hidden="true" />
                </span>
              )}
              <span className="tech-card__body">
                <span className="tech-card__meta">
                  <time dateTime={a.date}>{zhDate(a.date, timeZone)}</time>
                  <span className="tech-card__by">{author}</span>
                </span>
                {a.title.trim() && (
                  <h2 className="tech-card__title">{a.title}</h2>
                )}
                {articleExcerpt(a) && (
                  <p className="tech-card__excerpt">{articleExcerpt(a)}</p>
                )}
                <span className="tech-card__foot">
                  <span className="tech-card__more">
                    阅读全文
                    <ArrowUpRight size={15} />
                  </span>
                  {tags.length > 0 && (
                    <span className="tech-card__tags">
                      {tags.map((t: string) => (
                        <span key={t} className="tech-card__tag">
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </article>
        );
      })}
    </div>
  );
}
