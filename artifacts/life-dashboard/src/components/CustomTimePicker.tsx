import { useState, useRef, useEffect } from "react";

type Props = {
  value: string; // "HH:MM" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  accentColor?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function CustomTimePicker({
  value,
  onChange,
  placeholder = "Время",
  accentColor = "#6366f1",
}: Props) {
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const parts = value ? value.split(":") : [];
  const selH = parts[0] !== undefined ? parseInt(parts[0]) : -1;
  const selM = parts[1] !== undefined ? parseInt(parts[1]) : -1;

  function pick(h: number, m: number) {
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  function setH(h: number) {
    pick(h, selM >= 0 ? selM : 0);
  }
  function setM(m: number) {
    pick(selH >= 0 ? selH : 0, m);
    setOpen(false);
  }

  // Scroll to selected items when opened
  useEffect(() => {
    if (!open) return;
    if (selH >= 0 && hourRef.current) {
      const btn = hourRef.current.children[selH] as HTMLElement | undefined;
      btn?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const mIdx = MINUTES.indexOf(selM >= 0 ? selM : 0);
    if (mIdx >= 0 && minRef.current) {
      const btn = minRef.current.children[mIdx] as HTMLElement | undefined;
      btn?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [open]);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-left transition-colors"
        style={{
          borderColor: open ? accentColor + "60" : "rgba(255,255,255,0.10)",
          color: value ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)",
        }}
      >
        <span className="text-base opacity-60">🕐</span>
        <span className="flex-1 font-mono">{value || placeholder}</span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="text-white/20 hover:text-white/60 text-xs"
          >✕</button>
        )}
        <span className="text-white/20 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-2 z-20 rounded-2xl p-3 flex gap-2"
            style={{
              background: "#0e0e1e",
              border: "1px solid rgba(255,255,255,0.08)",
              minWidth: "200px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Hours column */}
            <div className="flex-1 flex flex-col">
              <p className="text-[9px] text-white/25 text-center mb-2 uppercase tracking-wider">Часы</p>
              <div
                ref={hourRef}
                className="flex flex-col gap-0.5 overflow-y-auto"
                style={{ maxHeight: "160px" }}
              >
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setH(h)}
                    className="text-center text-xs py-1.5 rounded-lg transition-all font-mono"
                    style={{
                      background: selH === h ? accentColor + "25" : "transparent",
                      color:
                        selH === h ? accentColor : "rgba(255,255,255,0.4)",
                      fontWeight: selH === h ? 700 : 400,
                    }}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px bg-white/5" />

            {/* Minutes column */}
            <div className="flex-1 flex flex-col">
              <p className="text-[9px] text-white/25 text-center mb-2 uppercase tracking-wider">Мин</p>
              <div
                ref={minRef}
                className="flex flex-col gap-0.5 overflow-y-auto"
                style={{ maxHeight: "160px" }}
              >
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setM(m)}
                    className="text-center text-xs py-1.5 rounded-lg transition-all font-mono"
                    style={{
                      background: selM === m ? accentColor + "25" : "transparent",
                      color: selM === m ? accentColor : "rgba(255,255,255,0.4)",
                      fontWeight: selM === m ? 700 : 400,
                    }}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
