import { useState, useRef, useEffect, useCallback } from "react";

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
  color?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
};

export function DreamSelect({
  value,
  onChange,
  options,
  placeholder = "Выбрать...",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  function toggleOpen() {
    if (!open) calcPos();
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = triggerRef.current;
      const d = dropRef.current;
      if (
        t && !t.contains(e.target as Node) &&
        d && !d.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onScroll() { calcPos(); }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, calcPos]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className="w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 outline-none transition-all"
        style={{
          borderColor: open ? "rgba(167,139,250,0.40)" : "rgba(255,255,255,0.10)",
          color: selected ? (selected.color ?? "rgba(255,255,255,0.70)") : "rgba(255,255,255,0.25)",
          boxShadow: open ? "0 0 0 1px rgba(167,139,250,0.15)" : "none",
        }}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {selected?.icon && <span>{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <span
          className="text-white/30 text-[10px] flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {/* Portal-style fixed dropdown */}
      {open && dropPos && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
            background: "rgba(12,12,24,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(167,139,250,0.14)",
            borderRadius: "0.875rem",
            boxShadow: "0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(167,139,250,0.06)",
            maxHeight: "240px",
            overflowY: "auto",
            padding: "4px",
          }}
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full px-3 py-2.5 text-sm text-left rounded-lg flex items-center gap-2.5 transition-all"
                style={{
                  color: isActive ? (opt.color ?? "#a78bfa") : "rgba(255,255,255,0.58)",
                  background: isActive ? "rgba(167,139,250,0.12)" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget).style.background = "rgba(255,255,255,0.055)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.background = isActive ? "rgba(167,139,250,0.12)" : "transparent";
                }}
              >
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                <span className="flex-1 truncate">{opt.label}</span>
                {isActive && (
                  <span className="flex-shrink-0 text-[10px]" style={{ color: opt.color ?? "#a78bfa" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
