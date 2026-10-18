import { useEffect, useMemo, useState } from "react";
import { useSite } from "../store";
import { request } from "../api";
import { zonedDay, type Contributions } from "../../../shared/model";
import { articleDateParts } from "../../../shared/articles";
import { articleLevel, buildYearGrid } from "../../../shared/heatmap";

const weekdayLabels = ["一", "", "三", "", "五", "", ""];

export function ContributionHeatmap() {
  const { content } = useSite();
  const timeZone = content!.location.timeZone;
  const year = Number(zonedDay(new Date(), timeZone).slice(0, 4));
  const grid = useMemo(() => buildYearGrid(year), [year]);
  const [github, setGithub] = useState<Contributions | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    request<Contributions>("/api/contributions")
      .then((value) => {
        if (active) setGithub(value);
      })
      .catch(() => {
        if (active) setGithub({ available: false });
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const clear = () => setTip(null);
    document.addEventListener("scroll", clear, true);
    return () => document.removeEventListener("scroll", clear, true);
  }, []);
  const articles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of content!.articles) {
      const { day } = articleDateParts(article.date, timeZone);
      if (day) counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return counts;
  }, [content, timeZone]);
  const githubDays = useMemo(() => {
    const days = new Map<string, { count: number; level: number }>();
    if (github?.available)
      for (const day of github.days ?? [])
        days.set(day.date, { count: day.count, level: day.level });
    return days;
  }, [github]);
  const tipText = (date: string) => {
    const written = articles.get(date) ?? 0;
    const pushed = githubDays.get(date)?.count ?? 0;
    const parts = [date];
    if (written) parts.push(`本站 ${written} 篇`);
    if (pushed) parts.push(`GitHub ${pushed} 次`);
    if (!written && !pushed) parts.push("暂无记录");
    return parts.join(" · ");
  };
  return (
    <section className="contribution-heatmap">
      <div className="heat-head">
        <div>
          <h2>{year} 年的创作足迹</h2>
          <p>
            {github?.available
              ? `本站文章（蓝）与 GitHub 贡献（绿）${github.stale ? " · 上次记录" : ""}`
              : "本站文章发布情况"}
          </p>
        </div>
        <div className="heat-legend" aria-hidden="true">
          <span>少</span>
          <i className="heat-cell lv-0" />
          <i className="heat-cell lv-1" />
          <i className="heat-cell lv-2" />
          <i className="heat-cell lv-3" />
          <i className="heat-cell lv-4" />
          <span>多</span>
        </div>
      </div>
      <div className="heat-body">
        <div className="heat-weekdays" aria-hidden="true">
          {weekdayLabels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
        <div className="heat-main">
          <div
            className="heat-months"
            style={{
              gridTemplateColumns: `repeat(${grid.weeks}, var(--heat-cell))`,
            }}
          >
            {grid.months.map((month) => (
              <span
                key={month.label}
                style={{
                  gridColumn: `${month.column + 1} / span ${month.span}`,
                }}
              >
                {month.label}
              </span>
            ))}
          </div>
          <div
            className="heat-grid"
            onMouseOver={(event) => {
              const cell = (
                event.target as HTMLElement
              ).closest<HTMLElement>(".heat-cell[data-date]");
              const date = cell?.dataset.date;
              if (!date) return;
              const box = cell!.getBoundingClientRect();
              setTip({
                text: tipText(date),
                x: box.left + box.width / 2,
                y: box.top,
              });
            }}
            onMouseOut={() => setTip(null)}
          >
            {grid.days.map((date, index) => {
              if (!date) return <i key={index} className="heat-cell blank" />;
              const written = articles.get(date) ?? 0;
              const pushed = githubDays.get(date);
              const color = pushed ? "is-github" : written ? "is-article" : "";
              const level = pushed ? pushed.level : articleLevel(written);
              return (
                <i
                  key={index}
                  className={`heat-cell lv-${level} ${color}`.trim()}
                  data-date={date}
                />
              );
            })}
          </div>
        </div>
      </div>
      {tip && (
        <span className="heat-tip" style={{ left: tip.x, top: tip.y }}>
          {tip.text}
        </span>
      )}
    </section>
  );
}
