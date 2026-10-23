import { LayoutGrid, LayoutList } from "lucide-react";

export type HomeMode = "bento" | "classic";

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: HomeMode;
  onChange: (next: HomeMode) => void;
}) {
  const isBento = mode === "bento";
  const label = isBento ? "切换到经典模式" : "切换到平铺模式";
  return (
    <button
      type="button"
      className="mode-toggle"
      aria-label={label}
      title={label}
      aria-pressed={!isBento}
      onClick={() => onChange(isBento ? "classic" : "bento")}
    >
      <span className="mode-toggle__icon" key={mode}>
        {isBento ? <LayoutGrid size={18} /> : <LayoutList size={18} />}
      </span>
    </button>
  );
}
