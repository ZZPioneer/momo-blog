import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSite } from "../store";
import { Dialog } from "./Common";
import type { HomeContent, Tag } from "../../../shared/model";

function toInt(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function TagEditor({ onClose }: { onClose: () => void }) {
  const { content, editing, beginEdit, change } = useSite();
  const [local, setLocal] = useState<Tag[]>(content?.tags ?? []);
  useEffect(() => {
    if (!editing) beginEdit();
  }, [editing, beginEdit]);
  useEffect(() => {
    setLocal(content?.tags ?? []);
  }, [content]);
  const apply = (next: Tag[]) =>
    change((c) => ({ ...c, tags: next }) as HomeContent);
  const update = (id: string, patch: Partial<Tag>) =>
    apply(local.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const add = () =>
    apply([
      ...local,
      { id: crypto.randomUUID(), name: "新标签", count: 0, color: "", url: "" },
    ]);
  const remove = (id: string) => apply(local.filter((t) => t.id !== id));
  const sorted = [...local].sort((a, b) => a.name.localeCompare(b.name, "zh"));
  return (
    <Dialog
      title="编辑标签"
      eyebrow="标签会在「作品与实验」页热力图下方滚动展示；保存后发布"
      onClose={onClose}
    >
      <p className="editor-hint">
        留空 <b>数量</b> 时只显示名称；<b>颜色</b> 留空则用主题色，可填 hex（如 #ff8800）；
        <b>链接</b> 留空则为纯展示，填 / 开头或 http(s) 会变为可点击标签。
      </p>
      <ul className="tag-editor-list">
        {sorted.map((t) => (
          <li key={t.id}>
            <label className="tag-editor-field">
              <span>名称</span>
              <input
                value={t.name}
                maxLength={40}
                onChange={(e) => update(t.id, { name: e.target.value })}
              />
            </label>
            <label className="tag-editor-field tag-editor-count">
              <span>数量</span>
              <input
                type="number"
                min={0}
                max={9999}
                value={t.count ?? ""}
                onChange={(e) => update(t.id, { count: toInt(e.target.value) })}
              />
            </label>
            <label className="tag-editor-field tag-editor-color">
              <span>颜色</span>
              <input
                type="text"
                value={t.color ?? ""}
                maxLength={32}
                placeholder="#ff8800"
                onChange={(e) => update(t.id, { color: e.target.value })}
              />
            </label>
            <label className="tag-editor-field tag-editor-url">
              <span>链接</span>
              <input
                value={t.url ?? ""}
                maxLength={2048}
                placeholder="可选"
                onChange={(e) => update(t.id, { url: e.target.value })}
              />
            </label>
            <button
              className="text-button tag-editor-remove"
              aria-label={`删除标签 ${t.name}`}
              onClick={() => remove(t.id)}
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {!sorted.length && (
          <li className="tag-editor-empty">还没有标签，添加几个试试。</li>
        )}
      </ul>
      <div className="editor-done">
        <button className="button" onClick={add}>
          <Plus size={16} />
          添加标签
        </button>
        <button className="button dark" onClick={onClose}>
          完成
        </button>
      </div>
    </Dialog>
  );
}
