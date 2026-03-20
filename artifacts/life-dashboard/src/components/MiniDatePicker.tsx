import { useState } from "react";

const LAV = "167,139,250";
const MONTH_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WDAY_RU  = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

export function MiniDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const initD = value ? new Date(value) : new Date();
  const [viewYear, setViewYear]   = useState(initD.getFullYear());
  const [viewMonth, setViewMonth] = useState(initD.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWday = (() => {
    const w = new Date(viewYear, viewMonth, 1).getDay();
    return w === 0 ? 6 : w - 1;
  })();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function prevYear() { setViewYear(y => y - 1); }
  function nextYear() { setViewYear(y => y + 1); }

  const navBtn = (onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all"
      style={{ color: `rgba(${LAV},0.60)`, background: `rgba(${LAV},0.08)` }}
    >{label}</button>
  );

  return (
    <div
      className="rounded-2xl overflow-hidden select-none w-full"
      style={{
        background: "rgba(14,12,32,0.97)",
        border: `1px solid rgba(${LAV},0.22)`,
        boxShadow: `0 0 30px rgba(${LAV},0.12)`,
      }}
    >
      {/* Month + Year nav */}
      <div
        className="flex flex-col gap-1 px-4 pt-3 pb-2"
        style={{ borderBottom: `1px solid rgba(${LAV},0.10)` }}
      >
        <div className="flex items-center justify-between">
          {navBtn(prevMonth, "‹")}
          <span className="text-xs font-medium tracking-[0.12em]" style={{ color: `rgba(${LAV},0.88)` }}>
            {MONTH_RU[viewMonth]}
          </span>
          {navBtn(nextMonth, "›")}
        </div>
        <div className="flex items-center justify-between">
          {navBtn(prevYear, "«")}
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: `rgba(${LAV},0.65)`, textShadow: `0 0 10px rgba(${LAV},0.35)` }}
          >
            {viewYear}
          </span>
          {navBtn(nextYear, "»")}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1">
        {WDAY_RU.map(d => (
          <div key={d} className="text-center text-[9px] py-0.5" style={{ color: `rgba(${LAV},0.30)` }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
        {Array.from({ length: firstWday }).map((_, i) => <div key={`e${i}`} />)}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = iso === value;
          const isToday = iso === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              className="flex items-center justify-center rounded-lg text-xs font-medium transition-all aspect-square"
              style={{
                background: isSelected
                  ? `rgba(${LAV},0.28)`
                  : isToday
                  ? `rgba(${LAV},0.08)`
                  : "transparent",
                color: isSelected
                  ? `rgba(${LAV},1)`
                  : isToday
                  ? `rgba(${LAV},0.70)`
                  : "rgba(255,255,255,0.50)",
                border: isSelected
                  ? `1px solid rgba(${LAV},0.50)`
                  : isToday
                  ? `1px solid rgba(${LAV},0.22)`
                  : "1px solid transparent",
                boxShadow: isSelected ? `0 0 10px rgba(${LAV},0.25)` : "none",
                textShadow: isSelected ? `0 0 8px rgba(${LAV},0.60)` : "none",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
