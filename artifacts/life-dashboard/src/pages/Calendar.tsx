import { useStore } from "@/lib/store";
import { sphereColors } from "@/lib/sphereColors";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function Calendar() {
  const { currentMonth, prevMonth, nextMonth, tasks } = useStore();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date(2026, 2, 16);

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const taskColors = tasks.slice(0, 6).map((t) => sphereColors[t.sphere].color);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
        >
          Календарь
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-white/30 hover:text-white/70 transition-colors text-lg px-1">‹</button>
          <span className="text-sm text-white/60 font-medium">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="text-white/30 hover:text-white/70 transition-colors text-lg px-1">›</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-white/25 font-medium py-1 uppercase tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
            const color = taskColors[(day - 1) % taskColors.length];
            const hasEvent = day % 3 === 0;
            return (
              <div
                key={idx}
                className="aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all hover:bg-white/5"
                style={isToday ? {
                  background: "linear-gradient(135deg,#6366f125,#8b5cf625)",
                  border: "1px solid #6366f150",
                } : {}}
              >
                <span className={`text-sm font-medium ${isToday ? "text-indigo-400" : "text-white/50"}`}>
                  {day}
                </span>
                {hasEvent && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    <div className="w-1 h-1 rounded-full" style={{ background: color }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">Задачи на март</p>
        <div className="flex flex-col gap-2">
          {tasks.slice(0, 5).map((t) => {
            const s = sphereColors[t.sphere];
            return (
              <div key={t.id} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-sm text-white/60">{t.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
