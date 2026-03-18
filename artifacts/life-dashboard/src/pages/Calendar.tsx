import { useState } from "react";
import { useStore, CalendarEvent, EventCategory, EVENT_META } from "@/lib/store";
import { sphereColors } from "@/lib/sphereColors";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const MONTH_NAMES_GEN = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];
const EVENT_CATEGORIES: EventCategory[] = ["birthday", "holiday", "deadline", "meeting"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}
function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function getEventsForDay(events: CalendarEvent[], year: number, month: number, day: number): CalendarEvent[] {
  const ds = toDateStr(year, month, day);
  return events.filter((e) => {
    if (e.repeatYearly) return e.date.slice(5) === ds.slice(5);
    return e.date === ds;
  });
}

function AddEventModal({
  defaultDate,
  onSave,
  onClose,
}: {
  defaultDate: string;
  onSave: (e: Omit<CalendarEvent, "id">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState<EventCategory>("birthday");
  const [repeatYearly, setRepeatYearly] = useState(false);

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, category, repeatYearly });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(14,14,26,0.98)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/80">Новое событие</h2>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">✕</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Название</p>
            <input
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors"
              placeholder="Название события..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Дата</p>
            <input
              type="date"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-indigo-500/40 transition-colors cursor-pointer"
              style={{ colorScheme: "dark" }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-medium">Тип</p>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const meta = EVENT_META[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left transition-all"
                    style={{
                      background: active ? meta.color + "20" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? meta.color + "50" : "transparent"}`,
                      color: active ? meta.color : "rgba(255,255,255,0.45)",
                    }}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setRepeatYearly(!repeatYearly)}
              className="w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0"
              style={{
                borderColor: repeatYearly ? "#6366f1" : "rgba(255,255,255,0.2)",
                background: repeatYearly ? "#6366f130" : "transparent",
              }}
            >
              {repeatYearly && <span className="text-xs text-indigo-400">✓</span>}
            </div>
            <div>
              <p className="text-sm text-white/70">Повторять каждый год</p>
              <p className="text-[10px] text-white/25">Событие будет отображаться ежегодно</p>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors border border-white/8"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

export function Calendar() {
  const { currentMonth, prevMonth, nextMonth, tasks, calendarEvents, addCalendarEvent, deleteCalendarEvent } = useStore();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selectedDateStr = selectedDay ? toDateStr(year, month, selectedDay) : null;
  const dayTasks = selectedDateStr ? tasks.filter((t) => t.dueDate === selectedDateStr) : [];
  const dayEvents = selectedDay ? getEventsForDay(calendarEvents, year, month, selectedDay) : [];
  const defaultEventDate = toDateStr(year, month, selectedDay ?? new Date().getDate());

  const hasDayData = dayTasks.length > 0 || dayEvents.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
        >
          Календарь
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-white/30 hover:text-white/70 transition-colors text-lg px-1">‹</button>
          <span className="text-sm text-white/60 font-medium min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="text-white/30 hover:text-white/70 transition-colors text-lg px-1">›</button>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ml-1"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <span>+</span> Событие
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-white/25 font-medium py-1 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const ds = toDateStr(year, month, day);
            const isToday = ds === todayStr;
            const isPast = ds < todayStr;
            const isSelected = selectedDay === day;
            const dayEvList = getEventsForDay(calendarEvents, year, month, day);
            const dayTkList = tasks.filter((t) => t.dueDate === ds);
            const totalDots = dayEvList.length + dayTkList.length;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className="aspect-square rounded-xl flex flex-col items-center justify-between py-1.5 cursor-pointer transition-all hover:bg-white/5"
                style={{
                  background: isSelected
                    ? "rgba(99,102,241,0.18)"
                    : isToday
                    ? "linear-gradient(135deg,#6366f125,#8b5cf625)"
                    : "transparent",
                  border: isSelected
                    ? "1px solid rgba(99,102,241,0.50)"
                    : isToday
                    ? "1px solid #6366f150"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="text-xs font-medium leading-none mt-1"
                  style={{
                    color: isToday
                      ? "#818cf8"
                      : isSelected
                      ? "rgba(255,255,255,0.85)"
                      : isPast
                      ? "rgba(255,255,255,0.28)"
                      : "rgba(255,255,255,0.55)",
                  }}
                >
                  {day}
                </span>

                {/* Event + task indicator dots */}
                {totalDots > 0 && (
                  <div className="flex gap-[3px] flex-wrap justify-center px-1 mb-0.5">
                    {dayEvList.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: EVENT_META[e.category].color, boxShadow: `0 0 4px ${EVENT_META[e.category].color}80` }}
                      />
                    ))}
                    {dayTkList.slice(0, Math.max(0, 3 - dayEvList.length)).map((t) => (
                      <div
                        key={t.id}
                        className="w-1 h-1 rounded-full flex-shrink-0 opacity-50"
                        style={{ background: sphereColors[t.sphere].color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5">
          {EVENT_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: EVENT_META[cat].color, boxShadow: `0 0 4px ${EVENT_META[cat].color}80` }}
              />
              <span className="text-[9px] text-white/30">{EVENT_META[cat].emoji} {EVENT_META[cat].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div
          className="rounded-2xl border border-white/6 p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-white/35">
              {selectedDay} {MONTH_NAMES_GEN[month]} {year}
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-white/20 hover:text-white/50 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Events for this day */}
          {dayEvents.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">События</p>
              {dayEvents.map((e) => {
                const meta = EVENT_META[e.category];
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: meta.color + "0e", border: `1px solid ${meta.color}25` }}
                  >
                    <span className="text-base flex-shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 truncate">{e.title}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: meta.color }}>
                        {meta.label}{e.repeatYearly ? " · Ежегодно 🔁" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCalendarEvent(e.id)}
                      className="text-white/15 hover:text-white/50 transition-colors flex-shrink-0 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tasks for this day */}
          {dayTasks.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Задачи</p>
              {dayTasks.map((t) => {
                const s = sphereColors[t.sphere];
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2 px-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.color, boxShadow: `0 0 4px ${s.color}60` }}
                    />
                    <span
                      className="flex-1 text-sm min-w-0 truncate"
                      style={{ color: t.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)", textDecoration: t.done ? "line-through" : "none" }}
                    >
                      {t.text}
                    </span>
                    {t.done && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/12 text-green-400 flex-shrink-0">
                        ✓ выполнено
                      </span>
                    )}
                    <span className="text-[9px] text-white/20 flex-shrink-0">{t.xp} XP</span>
                  </div>
                );
              })}
            </div>
          )}

          {!hasDayData && (
            <p className="text-xs text-white/20 text-center py-2">
              Нет задач и событий на этот день
            </p>
          )}
        </div>
      )}

      {/* Add event modal */}
      {showAddEvent && (
        <AddEventModal
          defaultDate={defaultEventDate}
          onSave={(e) => addCalendarEvent(e)}
          onClose={() => setShowAddEvent(false)}
        />
      )}
    </div>
  );
}
