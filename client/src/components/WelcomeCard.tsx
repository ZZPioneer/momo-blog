import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, FileText, User } from "lucide-react";
import { mediaUrl } from "../../../shared/model";
import { useSite } from "../store";
import { pageUrl, usePageNavigation, type Page } from "../navigation";

type Stat = { label: string; count: number; page: Page };

/* 描述区轮播文案（打字机输出）。首条为指定文案，其余随意更换，
   想增删只需改这个数组即可。 */
const WELCOME_LINES = [
  "山海自有归期，风雨自有相逢",
  "把作品、文字和日常，放在同一处",
  "慢慢来，反而比较快",
  "生活明朗，万物可爱",
  "保持热爱，奔赴山海",
  "日拱一卒，功不唐捐",
  "诗酒趁年华，且将新火试新茶",
  "热爱可抵岁月漫长",
];

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduce(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}

/* 逐字「码」出的打字机：打出 → 停留 → 擦除 → 下一条，循环。 */
function useTypewriter(lines: string[]) {
  const reduce = usePrefersReducedMotion();
  const [text, setText] = useState("");
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (reduce) {
      setText(lines[0]);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const full = lines[line % lines.length];
    let i = 0;

    const type = () => {
      if (cancelled) return;
      i += 1;
      setText(full.slice(0, i));
      if (i < full.length) timer = setTimeout(type, 75);
      else timer = setTimeout(erase, 2000);
    };
    const erase = () => {
      if (cancelled) return;
      i -= 1;
      setText(full.slice(0, i));
      if (i > 0) timer = setTimeout(erase, 38);
      else {
        setLine((p) => (p + 1) % lines.length);
        timer = setTimeout(type, 400);
      }
    };

    timer = setTimeout(type, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [line, reduce, lines]);

  return { text, reduce, typing: !reduce };
}

export function WelcomeCard({ onAbout }: { onAbout: () => void }) {
  const { content } = useSite();
  const { navigate, follow } = usePageNavigation();
  const profile = content!.profile;
  const stats: Stat[] = [
    { label: "文章", count: content!.articles.length, page: "articles" },
    { label: "相册", count: content!.photos.length, page: "photos" },
    { label: "项目", count: content!.projects.length, page: "projects" },
  ];
  const coverId = content!.photos.find((p) => p.mediaId)?.mediaId ?? null;
  const bg = coverId ? mediaUrl(coverId) : "";
  const eyebrow = profile.eyebrow?.trim() || `WELCOME · ${profile.name}的小站`;
  const avatar = profile.avatarId ? mediaUrl(profile.avatarId, true) : "";
  const { text, typing } = useTypewriter(WELCOME_LINES);

  return (
    <article className="welcome-card" aria-label="站点欢迎卡片">
      {bg && (
        <div
          className="welcome-card__bg"
          aria-hidden="true"
          style={{ backgroundImage: `url(${JSON.stringify(bg)})` } as CSSProperties}
        />
      )}
      <div className="welcome-card__shade" aria-hidden="true" />
      <div className="welcome-card__body">
        <div className="welcome-card__header">
          <div className="welcome-card__head">
            <p className="welcome-card__eyebrow">{eyebrow}</p>
            {avatar ? (
              <img
                className="welcome-card__avatar"
                src={avatar}
                alt={`${profile.name}的头像`}
              />
            ) : (
              <span
                className="welcome-card__avatar welcome-card__avatar--initial"
                aria-hidden="true"
              >
                {profile.name.slice(0, 1)}
              </span>
            )}
          </div>
        </div>
        <p className="welcome-card__desc" aria-label={WELCOME_LINES.join("，")}>
          <span aria-hidden="true">{text}</span>
          {typing && <span className="welcome-card__cursor" aria-hidden="true" />}
        </p>
        <div className="welcome-card__footer">
          <dl className="welcome-card__stats">
            {stats.map((s) => (
              <div key={s.page}>
                <dt>{s.label}</dt>
                <dd>
                  <a href={pageUrl(s.page)} onClick={(e) => follow(e, s.page)}>
                    {s.count}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <div className="welcome-card__actions">
            <button type="button" className="welcome-card__btn" onClick={onAbout}>
              <User size={16} aria-hidden="true" />
              <span>关于我</span>
            </button>
            <button
              type="button"
              className="welcome-card__btn"
              onClick={(e) => {
                e.preventDefault();
                navigate("articles");
              }}
            >
              <FileText size={16} aria-hidden="true" />
              <span>看文章</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
