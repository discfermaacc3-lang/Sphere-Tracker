import { useState } from "react";

const MONTHS_RU = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const DAYS_RU = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

type Props = {
  value: string; // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  accentColor?: string;
  placeholder?: string;
};

export function CustomDatePicker({
  value,
  onChange,
  accentColor = "#f59e0b",
  placeholder = "Выбрать дату",
}: Props) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const initDate = value ? new Date(value + "T00:00:00") : today;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }

  function formatDisplay(v: string) {
    if (!v) return "";
    const d = new Date(v + "T00:00:00");
    return `${d.getDate()} ${MONTHS_RU[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  }

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
        <span className="text-base opacity-60">📅</span>
        <span className="flex-1">{value ? formatDisplay(value) : placeholder}</span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="text-white/20 hover:text-white/60 text-xs ml-1"
          >✕</button>
        )}
        <span className="text-white/20 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Inline calendar */}
      {open && (
        <div
          className="mt-2 rounded-2xl p-3"
          style={{ background: "#0e0e1e", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/5 transition-all text-lg"
            >‹</button>
            <span className="text-sm font-semibold text-white/70">
              {MONTHS_RU[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/5 transition-all text-lg"
            >›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1.5">
            {DAYS_RU.map((d) => (
              <div key={d} className="text-center text-[9px] font-semibold text-white/20 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const cellStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = cellStr === todayStr;
              const isSelected = value === cellStr;
              const isPast = cellStr < todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  className="h-7 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: isSelected
                      ? accentColor + "30"
                      : isToday
                      ? "rgba(255,255,255,0.07)"
                      : "transparent",
                    color: isSelected
                      ? accentColor
                      : isPast
                      ? "rgba(255,255,255,0.2)"
                      : isToday
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.55)",
                    border: isSelected
                      ? `1px solid ${accentColor}60`
                      : isToday
                      ? "1px solid rgba(255,255,255,0.14)"
                      : "1px solid transparent",
                    boxShadow: isSelected ? `0 0 8px ${accentColor}35` : "none",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick selects */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
            {[
              { label: "Сегодня", val: todayStr },
              {
                label: "Завтра",
                val: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(),
              },
              {
                label: "Через неделю",
                val: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })(),
              },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => { onChange(q.val); setOpen(false); }}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: value === q.val ? accentColor + "20" : "rgba(255,255,255,0.04)",
                  color: value === q.val ? accentColor : "rgba(255,255,255,0.4)",
                  border: `1px solid ${value === q.val ? accentColor + "40" : "transparent"}`,
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
