import { useMemo, type CSSProperties } from "react";
import { Tag as TagIcon } from "lucide-react";
import { useSite } from "../store";
import type { HomeContent, Tag } from "../../../shared/model";

interface MarqueeItem {
  key: string;
  name: string;
  count?: number;
  color?: string;
  url?: string;
}

// 当没有自定义标签时，用站点各栏目的实时数量拼成一个“标签云”，保证开箱即有内容。
function deriveItems(content: HomeContent): MarqueeItem[] {
  return [
    { key: "s-projects", name: "项目", count: content.projects.length },
    { key: "s-articles", name: "文字", count: content.articles.length },
    { key: "s-photos", name: "相册", count: content.photos.length },
    { key: "s-collections", name: "收集", count: content.collections.length },
    { key: "s-friends", name: "友链", count: content.friends.length },
    { key: "s-tracks", name: "音乐", count: content.tracks.length },
  ];
}

function resolveItems(content: HomeContent): MarqueeItem[] {
  const curated = content.tags ?? [];
  if (curated.length) {
    return curated.map((t: Tag) => ({
      key: t.id,
      name: t.name,
      count: t.count,
      color: t.color && t.color !== "none" ? t.color : undefined,
      url: t.url || undefined,
    }));
  }
  return deriveItems(content);
}

// 把列表复制若干份，保证一组的宽度足以覆盖视口，滚动才无缝。
function buildGroup(items: MarqueeItem[]): MarqueeItem[] {
  if (!items.length) return items;
  const copies = items.length < 14 ? Math.ceil(14 / items.length) : 1;
  return Array.from({ length: copies }).flatMap((_, i) =>
    items.map((it) => ({ ...it, key: `${it.key}-${i}` })),
  );
}

function MarqueeRow({
  items,
  reverse,
}: {
  items: MarqueeItem[];
  reverse?: boolean;
}) {
  const group = useMemo(() => buildGroup(items), [items]);
  return (
    <div className="tag-marquee__viewport">
      <div
        className={`tag-marquee__track${reverse ? " tag-marquee__track--reverse" : ""}`}
      >
        {[0, 1].map((g) => (
          <div
            className="tag-marquee__group"
            key={g}
            aria-hidden={g === 1 || undefined}
          >
            {group.map((it) => {
              const inner = (
                <>
                  <TagIcon size={15} className="tag-marquee__icon" aria-hidden />
                  <span className="tag-marquee__name">{it.name}</span>
                  {it.count !== undefined && (
                    <span className="tag-marquee__count">{it.count}</span>
                  )}
                </>
              );
              const style = it.color
                ? ({ "--tag-color": it.color } as CSSProperties)
                : undefined;
              if (it.url) {
                const external = /^https?:\/\//i.test(it.url);
                return (
                  <a
                    key={it.key}
                    className="tag-marquee__item"
                    href={it.url}
                    style={style}
                    {...(external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {inner}
                  </a>
                );
              }
              return (
                <span
                  key={it.key}
                  className="tag-marquee__item"
                  style={style}
                >
                  {inner}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TagMarquee() {
  const { content } = useSite();
  const items = useMemo(() => resolveItems(content!), [content]);
  if (!items.length) return null;
  return (
    <section className="tag-marquee" aria-label="标签滚动">
      <MarqueeRow items={items} />
      <MarqueeRow items={items} reverse />
    </section>
  );
}
