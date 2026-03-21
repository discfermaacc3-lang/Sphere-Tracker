import { useState, useEffect, useCallback, useRef } from "react";
import { useStore, CalendarEvent, EventCategory, EVENT_META, computeGoalEarnedXP, Task } from "@/lib/store";
import { TaskModal } from "@/components/TaskModal";
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
const LEVEL_LABEL: Record<string, string> = { year: "Годовая", month: "Месячная", week: "Недельная" };
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
function getEventsForDate(events: CalendarEvent[], ds: string): CalendarEvent[] {
  return events.filter((e) => {
    if (e.repeatYearly) return e.date.slice(5) === ds.slice(5);
    return e.date === ds;
  });
}

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function shiftWeek(mondayStr: string, delta: number): string {
  const d = new Date(mondayStr + "T12:00:00");
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}
function getWeekDaysFrom(mondayStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayStr + "T12:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function AddEventModal({
  defaultDate, onSave, onClose,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 flex flex-col overflow-hidden" style={{ background: "rgba(14,14,26,0.98)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/80">Новое событие</h2>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Название</p>
            <input autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors" placeholder="Название события..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Дата</p>
            <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-indigo-500/40 transition-colors cursor-pointer" style={{ colorScheme: "dark" }} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-medium">Тип</p>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const meta = EVENT_META[cat];
                const active = category === cat;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left transition-all" style={{ background: active ? meta.color + "20" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? meta.color + "50" : "transparent"}`, color: active ? meta.color : "rgba(255,255,255,0.45)" }}>
                    <span>{meta.emoji}</span><span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setRepeatYearly(!repeatYearly)} className="w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0" style={{ borderColor: repeatYearly ? "#6366f1" : "rgba(255,255,255,0.2)", background: repeatYearly ? "#6366f130" : "transparent" }}>
              {repeatYearly && <span className="text-xs text-indigo-400">✓</span>}
            </div>
            <div>
              <p className="text-sm text-white/70">Повторять каждый год</p>
              <p className="text-[10px] text-white/25">Событие будет отображаться ежегодно</p>
            </div>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors border border-white/8">Отмена</button>
          <button onClick={handleSave} disabled={!title.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}>Добавить</button>
        </div>
      </div>
    </div>
  );
}

/* Return the month that has the majority of days in the given week (≥4 of 7) */
function getPrimaryMonthOf(weekStart: string): { year: number; month: number } {
  const days = getWeekDaysFrom(weekStart);
  const counts = new Map<string, number>();
  days.forEach((d) => {
    const key = d.slice(0, 7);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  let dominant = days[0].slice(0, 7);
  let max = 0;
  counts.forEach((v, k) => { if (v > max) { max = v; dominant = k; } });
  const [y, m] = dominant.split("-").map(Number);
  return { year: y, month: m - 1 };
}

/* Monday of the first week that contains (or starts in) a given month */
function getFirstWeekOfMonth(year: number, month: number): string {
  return getMondayOf(new Date(year, month, 1).toISOString().slice(0, 10));
}

export function Calendar() {
  const {
    currentMonth, prevMonth, nextMonth, goToMonth,
    tasks, goals, calendarEvents, addCalendarEvent, deleteCalendarEvent,
    toggleTask, addTask, deleteTask, deleteRecurringFromDate, editRecurringFromDate, deleteRecurringFromTemplate,
    calendarDrafts, addCalendarDraft, removeCalendarDraft,
  } = useStore();

  const todayStr = new Date().toISOString().slice(0, 10);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // View mode & week navigation
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [viewedWeekStart, setViewedWeekStart] = useState(() => getMondayOf(todayStr));

  // Selection & modals
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [draftForModal, setDraftForModal] = useState<{ id: string; text: string } | null>(null);

  // Recurring bulk-action dialog
  const [recurringDialog, setRecurringDialog] = useState<{ task: Task; action: "delete" | "edit"; newText?: string } | null>(null);

  // Magic highlight (for task cross-reference)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);
  const activeHighlight = pinnedDate ?? hoveredDate;

  // Cell hover (for border glow on calendar cells)
  const [hoveredCellDs, setHoveredCellDs] = useState<string | null>(null);

  // ── Derived display month (week mode → primary month of viewed week) ──
  const dispM = viewMode === "week" ? getPrimaryMonthOf(viewedWeekStart) : { year, month };
  const dispYear  = dispM.year;
  const dispMonth = dispM.month;

  // Check if viewed week is cross-month (spans two calendar months)
  const weekMonths = viewMode === "week"
    ? [...new Set(getWeekDaysFrom(viewedWeekStart).map((d) => d.slice(0, 7)))]
    : [];
  const isCrossMonth = weekMonths.length > 1;
  const crossMonthLabel = isCrossMonth
    ? weekMonths.map((k) => MONTH_NAMES[parseInt(k.split("-")[1]) - 1].slice(0, 3)).join(" → ")
    : "";

  // ── Fade animation for header month label ──
  const displayTitle = `${MONTH_NAMES[dispMonth]} ${dispYear}`;
  const [shownTitle, setShownTitle] = useState(displayTitle);
  const [titleVisible, setTitleVisible] = useState(true);
  useEffect(() => {
    if (displayTitle === shownTitle) return;
    setTitleVisible(false);
    const t = setTimeout(() => { setShownTitle(displayTitle); setTitleVisible(true); }, 160);
    return () => clearTimeout(t);
  }, [displayTitle, shownTitle]);

  // ── Bidirectional navigation helpers ──
  function navigateWeek(delta: number) {
    const newStart = shiftWeek(viewedWeekStart, delta);
    setViewedWeekStart(newStart);
    const { year: ny, month: nm } = getPrimaryMonthOf(newStart);
    if (ny !== year || nm !== month) goToMonth(ny, nm);
  }

  function handlePrevMonth() {
    prevMonth();
    if (viewMode === "week") {
      const ny = month === 0 ? year - 1 : year;
      const nm = month === 0 ? 11 : month - 1;
      setViewedWeekStart(getFirstWeekOfMonth(ny, nm));
    }
  }

  function handleNextMonth() {
    nextMonth();
    if (viewMode === "week") {
      const ny = month === 11 ? year + 1 : year;
      const nm = month === 11 ? 0 : month + 1;
      setViewedWeekStart(getFirstWeekOfMonth(ny, nm));
    }
  }

  // Draft input
  const [draftInput, setDraftInput] = useState("");
  const draftInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const weekDays = getWeekDaysFrom(viewedWeekStart);
  const weekNum = getISOWeek(viewedWeekStart);
  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selectedDateStr = selectedDay ? toDateStr(year, month, selectedDay) : null;
  // Exclude auto-routine tasks from day panel (but keep user recurring tasks)
  const isVisibleTask = (t: Task) =>
    t.type !== "routine" || !!t.recurringTemplateId || !!t.checklistItemId;
  const dayTasks = selectedDateStr
    ? tasks.filter((t) => t.dueDate === selectedDateStr && isVisibleTask(t))
    : [];
  const dayEvents = selectedDay ? getEventsForDate(calendarEvents, toDateStr(year, month, selectedDay)) : [];
  const defaultEventDate = toDateStr(year, month, selectedDay ?? new Date().getDate());
  const hasDayData = dayTasks.length > 0 || dayEvents.length > 0;

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const overviewTasks = viewMode === "week"
    ? tasks.filter((t) => isVisibleTask(t) && t.dueDate && weekDays.includes(t.dueDate))
    : tasks.filter((t) => isVisibleTask(t) && t.dueDate?.startsWith(monthPrefix));
  const overviewGoals = viewMode === "week"
    ? goals.filter((g) => g.level === "week" && g.year === year && g.month === month)
    : goals.filter((g) => (g.level === "week" || g.level === "month") && g.year === year && g.month === month);

  const handleTaskEnter = useCallback((date?: string) => { if (date) setHoveredDate(date); }, []);
  const handleTaskLeave = useCallback(() => setHoveredDate(null), []);
  const handleTaskPin = useCallback((date?: string) => {
    if (!date) return;
    setPinnedDate((prev) => (prev === date ? null : date));
  }, []);

  function getCellGlow(ds: string): React.CSSProperties {
    if (ds !== activeHighlight) return {};
    const task = overviewTasks.find((t) => t.dueDate === ds);
    const color = task ? sphereColors[task.sphere].color : "#a78bfa";
    const isPinned = pinnedDate === ds;
    return isPinned
      ? { background: `${color}18`, border: `2px solid ${color}cc`, boxShadow: `0 0 0 3px ${color}40, 0 0 20px ${color}70, 0 0 40px ${color}35` }
      : { background: `${color}0f`, border: `1px solid ${color}80`, boxShadow: `0 0 14px ${color}55, 0 0 28px ${color}25` };
  }

  function renderDayCell(ds: string, label: string | number, tall = false) {
    const isToday = ds === todayStr;
    const isPast = ds < todayStr;
    const isSelectedDay = selectedDateStr === ds;
    const dayEvList = getEventsForDate(calendarEvents, ds);
    const dayTkList = tasks.filter((t) => t.dueDate === ds && isVisibleTask(t));
    const totalItems = dayEvList.length + dayTkList.length;
    const glowStyle = getCellGlow(ds);
    const hasGlow = ds === activeHighlight;
    const dayNum = parseInt(String(label));

    /* In week view: flag days that belong to a month other than the primary displayed month */
    const primaryKey = `${dispYear}-${String(dispMonth + 1).padStart(2, "0")}`;
    const isOtherMonth = tall && ds.slice(0, 7) !== primaryKey;

    const tooltipLines = [
      ...dayEvList.map((e) => `${EVENT_META[e.category].emoji} ${e.title}`),
      ...dayTkList.map((t) => `${t.category === "Mission" ? "💎" : "·"} ${t.text}`),
    ];

    const isCellHovered = hoveredCellDs === ds;

    /* resolve border / background for this cell */
    let cellBorder: string;
    let cellBackground: string;
    let cellBoxShadow: string | undefined;
    let cellBackdropFilter: string | undefined;

    if (hasGlow) {
      cellBorder = glowStyle.border as string;
      cellBackground = glowStyle.background as string;
      cellBoxShadow = glowStyle.boxShadow as string;
    } else if (isSelectedDay) {
      cellBorder = "1px solid rgba(167,139,250,0.55)";
      cellBackground = "rgba(167,139,250,0.18)";
    } else if (isToday) {
      cellBorder = "1px solid rgba(167,139,250,0.52)";
      cellBackground = "linear-gradient(135deg,rgba(167,139,250,0.17),rgba(139,92,246,0.10))";
      cellBoxShadow = "0 0 20px rgba(167,139,250,0.24), inset 0 1px 0 rgba(255,255,255,0.07)";
      cellBackdropFilter = "blur(10px)";
    } else if (isCellHovered) {
      cellBorder = "1px solid rgba(167,139,250,0.32)";
      cellBackground = isPast ? "rgba(255,255,255,0.03)" : "rgba(167,139,250,0.05)";
      cellBoxShadow = "0 0 12px rgba(167,139,250,0.12)";
    } else {
      /* default: visible glassmorphism base for all cells */
      cellBorder = isPast
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(255,255,255,0.09)";
      cellBackground = isPast
        ? "rgba(255,255,255,0.012)"
        : "rgba(255,255,255,0.028)";
    }

    /* Determine center emoji icon */
    const hasBirthday    = dayEvList.some((e) => e.category === "birthday");
    const hasHoliday     = dayEvList.some((e) => e.category === "holiday");
    const hasMeeting     = dayEvList.some((e) => e.category === "meeting");
    const hasDeadline    = dayEvList.some((e) => e.category === "deadline");
    const deadlineCount  = dayEvList.filter((e) => e.category === "deadline").length;
    const taskDeadlines  = dayTkList.filter((t) => !t.recurringTemplateId && !t.checklistItemId && !t.noDeadline);
    const taskDeadlineCount = taskDeadlines.length;
    const hasTaskDeadline   = taskDeadlineCount > 0;
    let cellIcon: string | null = null;
    let cellIconColor = "rgba(255,255,255,0.5)";
    let cellIconCount = 0; // badge number when >1
    if (hasBirthday)      { cellIcon = "🎂"; cellIconColor = EVENT_META.birthday.color; }
    else if (hasHoliday)  { cellIcon = "⭐"; cellIconColor = EVENT_META.holiday.color; }
    else if (hasMeeting)  { cellIcon = "📅"; cellIconColor = EVENT_META.meeting.color; }
    else if (hasDeadline) { cellIcon = "⏰"; cellIconColor = EVENT_META.deadline.color; cellIconCount = deadlineCount; }
    else if (hasTaskDeadline) { cellIcon = "⏰"; cellIconColor = "#ef4444"; cellIconCount = taskDeadlineCount; }

    return (
      <div
        key={ds}
        onClick={() => setSelectedDay(isSelectedDay ? null : dayNum)}
        onMouseEnter={() => setHoveredCellDs(ds)}
        onMouseLeave={() => setHoveredCellDs(null)}
        className="relative group/cell rounded-xl flex flex-col"
        style={{
          aspectRatio: "1",
          minHeight: 0,
          overflow: "hidden",
          padding: tall ? "10px 8px 6px" : "7px 6px 5px",
          border: cellBorder,
          background: cellBackground,
          boxShadow: cellBoxShadow,
          backdropFilter: cellBackdropFilter,
          transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.22s ease",
          cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23a78bfa' d='M4 0l16 12-7 2-4 8z'/%3E%3C/svg%3E\") 4 0, pointer",
        }}
      >
        {/* Center emoji icon for event type */}
        {cellIcon && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 1, lineHeight: 1 }}>
              <span
                style={{
                  fontSize: tall ? 22 : 15,
                  filter: `drop-shadow(0 0 7px ${cellIconColor}cc)`,
                  opacity: isPast ? 0.28 : 0.60,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {cellIcon}
              </span>
              {cellIconCount > 1 && (
                <span
                  style={{
                    fontSize: tall ? 9 : 7,
                    fontWeight: 700,
                    color: cellIconColor,
                    opacity: isPast ? 0.28 : 0.75,
                    lineHeight: 1,
                    marginTop: 1,
                    textShadow: `0 0 6px ${cellIconColor}99`,
                  }}
                >
                  {cellIconCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Day number */}
        <span
          className="font-semibold leading-none relative z-10"
          style={{
            fontSize: tall ? 20 : 15,
            color: isToday
              ? "#a78bfa"
              : isSelectedDay
              ? "rgba(255,255,255,0.95)"
              : isOtherMonth
              ? isPast ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.32)"
              : isPast
              ? "rgba(255,255,255,0.20)"
              : "rgba(255,255,255,0.62)",
            textShadow: isToday ? "0 0 18px rgba(167,139,250,0.70)" : "none",
          }}
        >
          {label}
        </span>

        {/* Weekday label in week view */}
        {tall && (
          <span className="text-[10px] font-medium mt-1" style={{ color: isToday ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.20)", letterSpacing: "0.06em" }}>
            {WEEKDAYS[new Date(ds + "T12:00:00").getDay() === 0 ? 6 : new Date(ds + "T12:00:00").getDay() - 1]}
          </span>
        )}

        {/* Dot indicators — pushed to bottom, max 4 dots then "+N" */}
        <div className="mt-auto flex gap-[3px] flex-wrap pt-1 relative z-10" style={{ overflow: "hidden", maxHeight: tall ? 14 : 10, alignContent: "flex-start" }}>
          {dayEvList.slice(0, 3).map((e) => (
            <div
              key={e.id}
              style={{ width: tall ? 6 : 4, height: tall ? 6 : 4, borderRadius: "50%", flexShrink: 0, background: EVENT_META[e.category].color, boxShadow: `0 0 4px ${EVENT_META[e.category].color}` }}
            />
          ))}
          {dayTkList.slice(0, Math.max(0, 3 - dayEvList.length)).map((t) => {
            const isFutureRecurring = ds > todayStr && (!!t.checklistItemId || !!t.recurringTemplateId);
            const dotColor = t.category === "Mission" ? "#fbbf24" : sphereColors[t.sphere].color;
            return isFutureRecurring ? (
              <div
                key={t.id}
                style={{
                  width: tall ? 5 : 4, height: tall ? 5 : 4,
                  borderRadius: "50%", flexShrink: 0,
                  background: "transparent",
                  border: `1.5px dashed ${dotColor}`,
                  opacity: 0.50,
                }}
              />
            ) : (
              <div
                key={t.id}
                style={{ width: tall ? 5 : 4, height: tall ? 5 : 4, borderRadius: "50%", flexShrink: 0, opacity: 0.50, background: dotColor }}
              />
            );
          })}
          {totalItems > 3 && (
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.30)", lineHeight: tall ? "6px" : "4px", fontWeight: 600 }}>+{totalItems - 3}</span>
          )}
        </div>

        {/* Week view: compact task name chips — max 2, then "+N" */}
        {tall && dayTkList.length > 0 && (
          <div className="flex flex-col gap-[2px] mt-1 relative z-10" style={{ minWidth: 0, overflow: "hidden" }}>
            {dayTkList.slice(0, 2).map((t) => {
              const isFutureRecurring = ds > todayStr && (!!t.checklistItemId || !!t.recurringTemplateId);
              const chipColor = t.category === "Mission" ? "#fbbf24" : sphereColors[t.sphere].color;
              return (
                <div
                  key={t.id}
                  style={{
                    background: isFutureRecurring ? "transparent" : chipColor + "15",
                    border: `1px ${isFutureRecurring ? "dashed" : "solid"} ${chipColor}${isFutureRecurring ? "50" : "28"}`,
                    borderRadius: 4,
                    padding: "1px 4px",
                    fontSize: 8,
                    color: t.done ? "rgba(255,255,255,0.20)" : isFutureRecurring ? chipColor + "bb" : "rgba(255,255,255,0.58)",
                    textDecoration: t.done ? "line-through" : "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    opacity: isFutureRecurring ? 0.70 : 1,
                    lineHeight: "1.4",
                  }}
                >
                  {isFutureRecurring ? "◌ " : ""}{t.text}
                </div>
              );
            })}
            {dayTkList.length > 2 && (
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", paddingLeft: 2, lineHeight: "1.3" }}>+{dayTkList.length - 2} ещё</span>
            )}
          </div>
        )}

        {/* Hover tooltip */}
        {tooltipLines.length > 0 && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover/cell:flex flex-col gap-0.5 pointer-events-none"
            style={{
              minWidth: 140,
              maxWidth: 220,
              padding: "8px 12px",
              borderRadius: 12,
              background: "rgba(8,8,20,0.98)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 10px 36px rgba(0,0,0,0.65)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-[9px] uppercase tracking-[0.14em] font-medium mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>
              {label} {MONTH_NAMES_GEN[month]}
            </p>
            {tooltipLines.map((line, i) => (
              <p key={i} className="text-[11px] leading-relaxed truncate" style={{ color: "rgba(255,255,255,0.80)" }}>{line}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  function handleAddDraft() {
    const text = draftInput.trim();
    if (!text) return;
    addCalendarDraft(text);
    setDraftInput("");
    draftInputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full" style={{ overflow: "visible" }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-light tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}>
            Календарь
          </h1>
          {/* Dynamic month + fade */}
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-extralight tracking-[0.18em] uppercase"
              style={{
                color: "rgba(255,255,255,0.88)",
                textShadow: "0 0 40px rgba(167,139,250,0.55)",
                opacity: titleVisible ? 1 : 0,
                transition: "opacity 0.16s ease",
              }}
            >
              {shownTitle}
            </span>
            {/* Cross-month badge */}
            {isCrossMonth && (
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-medium tracking-[0.08em]"
                style={{
                  background: "rgba(167,139,250,0.12)",
                  color: "rgba(167,139,250,0.75)",
                  border: "1px solid rgba(167,139,250,0.22)",
                }}
              >
                {crossMonthLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month navigation — syncs week start in week mode */}
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-base">‹</button>
            <span className="text-xs text-white/35 font-medium min-w-[90px] text-center tracking-wide">{MONTH_NAMES[month]} {year}</span>
            <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-base">›</button>
          </div>

          {/* Week navigation — syncs month */}
          {viewMode === "week" && (
            <div className="flex items-center gap-1 pl-1 border-l border-white/8">
              <button onClick={() => navigateWeek(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-base">‹</button>
              <span className="text-xs text-indigo-300/80 font-medium min-w-[78px] text-center">Неделя {weekNum}</span>
              <button onClick={() => navigateWeek(+1)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-base">›</button>
            </div>
          )}

          <button onClick={() => setShowAddEvent(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}>
            <span>+</span> Событие
          </button>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl self-start" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["month", "week"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: viewMode === mode ? "rgba(99,102,241,0.22)" : "transparent",
              color: viewMode === mode ? "#818cf8" : "rgba(255,255,255,0.35)",
              border: viewMode === mode ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
              boxShadow: viewMode === mode ? "0 0 12px rgba(99,102,241,0.20)" : "none",
            }}
          >
            {mode === "month" ? "Обзор месяца" : "Обзор недели"}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      {(() => {
        const isMonth = viewMode === "month";
        /* Both views: 15% side padding — creates a single vertical content corridor.
           Square cells via aspectRatio on each cell. */
        const innerPad = "15%";
        const cellGap  = 4;

        return (
          <div
            className="rounded-2xl border border-white/5 p-4"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            {/* Inner padded wrapper: headers + cells share the same column widths */}
            <div style={{ paddingInline: innerPad }}>

              {/* Weekday headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: cellGap, marginBottom: 8 }}>
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.28)",
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      paddingBottom: 2,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells — height auto via aspectRatio on each cell */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: cellGap }}>
                {isMonth
                  ? monthCells.map((day, idx) => {
                      if (day === null) return <div key={idx} style={{ aspectRatio: "1" }} />;
                      return renderDayCell(toDateStr(year, month, day), day, false);
                    })
                  : weekDays.map((ds) => renderDayCell(ds, parseInt(ds.slice(8)), true))
                }
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-white/5">
              {(["birthday", "holiday", "deadline", "meeting"] as EventCategory[]).map((cat) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span style={{ fontSize: 13, filter: `drop-shadow(0 0 4px ${EVENT_META[cat].color}aa)` }}>{EVENT_META[cat].emoji}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>{EVENT_META[cat].label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 13, filter: "drop-shadow(0 0 4px #ef4444aa)", opacity: 0.70 }}>⏰</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>Дедлайн задачи</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>· Задача</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "transparent", border: "1.5px dashed rgba(167,139,250,0.60)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>◌ Запланировано</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Day detail panel */}
      {selectedDay && (
        <div className="rounded-2xl border border-white/6 p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-white/35">{selectedDay} {MONTH_NAMES_GEN[month]} {year}</p>
            <button onClick={() => setSelectedDay(null)} className="text-white/20 hover:text-white/50 transition-colors text-sm">✕</button>
          </div>
          {dayEvents.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">События</p>
              {dayEvents.map((e) => {
                const meta = EVENT_META[e.category];
                return (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: meta.color + "0e", border: `1px solid ${meta.color}25` }}>
                    <span className="text-base flex-shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 truncate">{e.title}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: meta.color }}>{meta.label}{e.repeatYearly ? " · Ежегодно 🔁" : ""}</p>
                    </div>
                    <button onClick={() => deleteCalendarEvent(e.id)} className="text-white/15 hover:text-white/50 transition-colors flex-shrink-0 text-xs ml-2">✕</button>
                  </div>
                );
              })}
            </div>
          )}
          {dayTasks.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Задачи</p>
              {dayTasks.map((t) => {
                const s = t.category === "Mission" ? null : sphereColors[t.sphere];
                const dotColor = t.category === "Mission" ? "#fbbf24" : s!.color;
                const isRecurring = !!t.checklistItemId || !!t.recurringTemplateId;
                const isFuturePlanned = selectedDateStr! > todayStr && isRecurring;
                return (
                  <div
                    key={t.id}
                    className="group flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/2 transition-all"
                    style={{
                      border: isFuturePlanned ? `1px dashed ${dotColor}30` : "1px solid transparent",
                      background: isFuturePlanned ? `${dotColor}06` : "transparent",
                      opacity: isFuturePlanned ? 0.85 : 1,
                    }}
                  >
                    {/* Toggle dot */}
                    <div
                      className="flex-shrink-0 cursor-pointer"
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: isFuturePlanned ? "transparent" : dotColor,
                        border: isFuturePlanned ? `1.5px dashed ${dotColor}` : "none",
                        boxShadow: !isFuturePlanned ? `0 0 4px ${dotColor}60` : "none",
                      }}
                      onClick={() => !isFuturePlanned && toggleTask(t.id)}
                    />
                    {/* Task text */}
                    <span
                      className="flex-1 text-sm min-w-0 truncate cursor-pointer"
                      style={{ color: t.done ? "rgba(255,255,255,0.25)" : isFuturePlanned ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.65)", textDecoration: t.done ? "line-through" : "none" }}
                      onClick={() => !isFuturePlanned && toggleTask(t.id)}
                    >
                      {t.category === "Mission" && <span className="mr-1 text-xs">💎</span>}
                      {t.text}
                    </span>
                    {/* Badges */}
                    {isFuturePlanned && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${dotColor}15`, color: dotColor, border: `1px dashed ${dotColor}50` }}>
                        🔁 план
                      </span>
                    )}
                    {isRecurring && !isFuturePlanned && (
                      <span className="text-[8px] text-white/20 flex-shrink-0">🔁</span>
                    )}
                    {t.done && !isFuturePlanned && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/12 text-green-400 flex-shrink-0">✓</span>
                    )}
                    <span className="text-[9px] text-white/20 flex-shrink-0">{t.xp} XP</span>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isRecurring) {
                          setRecurringDialog({ task: t, action: "delete" });
                        } else {
                          deleteTask(t.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {!hasDayData && <p className="text-xs text-white/20 text-center py-2">Нет задач и событий на этот день</p>}
        </div>
      )}

      {/* Overview panel */}
      {(overviewGoals.length > 0 || overviewTasks.length > 0) && (
        <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-white/25 mb-4">
            {viewMode === "week" ? `Неделя ${weekNum}` : `Обзор · ${MONTH_NAMES[month]}`}
          </p>
          <div className="grid grid-cols-2 gap-6">
            {/* Goals */}
            <div className="flex flex-col gap-3">
              <p className="text-[8px] uppercase tracking-[0.3em] text-white/20 font-medium flex items-center gap-1.5">
                <span>🎯</span> Цели
              </p>
              {overviewGoals.length === 0 && <p className="text-[10px] text-white/15">Нет целей на этот период</p>}
              {overviewGoals.map((g) => {
                const earned = computeGoalEarnedXP(g, goals, tasks);
                const pct = g.targetXP > 0 ? Math.min(100, Math.round((earned / g.targetXP) * 100)) : 0;
                const s = sphereColors[g.sphere];
                return (
                  <div key={g.id} className="rounded-xl px-3 py-2.5 flex flex-col gap-2" style={{ background: s.color + "0a", border: `1px solid ${s.color}20` }}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm flex-shrink-0 mt-0.5" style={{ filter: `drop-shadow(0 0 4px ${s.color}60)` }}>{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/70 leading-tight line-clamp-2">{g.title}</p>
                        <p className="text-[8px] mt-0.5" style={{ color: s.color }}>{LEVEL_LABEL[g.level]}</p>
                      </div>
                      {g.done && <span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "#22c55e18", color: "#4ade80", border: "1px solid #22c55e30" }}>✓</span>}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] text-white/25">{earned} / {g.targetXP} XP</span>
                        <span className="text-[8px] font-semibold" style={{ color: s.color }}>{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}70, ${s.color})`, boxShadow: `0 0 6px ${s.color}50` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2">
              <p className="text-[8px] uppercase tracking-[0.3em] text-white/20 font-medium flex items-center gap-1.5">
                <span>⚡</span> Задачи
                {pinnedDate && (
                  <span className="ml-auto text-[7px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
                    📍 {pinnedDate.slice(8)}
                  </span>
                )}
              </p>
              {overviewTasks.length === 0 && <p className="text-[10px] text-white/15">Нет задач на этот период</p>}
              {overviewTasks.map((t) => {
                const isMission = t.category === "Mission";
                const s = isMission ? null : sphereColors[t.sphere];
                const dotColor = isMission ? "#fbbf24" : s!.color;
                const isHighlighted = t.dueDate === activeHighlight;
                const isPinned = t.dueDate === pinnedDate;
                const dayNum = t.dueDate ? parseInt(t.dueDate.slice(8)) : null;
                const dayMon = t.dueDate ? new Date(t.dueDate + "T12:00:00").getMonth() : null;
                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => handleTaskEnter(t.dueDate)}
                    onMouseLeave={handleTaskLeave}
                    onClick={() => handleTaskPin(t.dueDate)}
                    className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isHighlighted ? dotColor + "12" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isHighlighted ? dotColor + "45" : "transparent"}`,
                      boxShadow: isPinned ? `0 0 12px ${dotColor}25` : "none",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }}
                      className="w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: t.done ? dotColor : "rgba(255,255,255,0.2)", background: t.done ? dotColor + "30" : "transparent", boxShadow: t.done ? `0 0 6px ${dotColor}40` : "none" }}
                    >
                      {t.done && <span className="text-[9px]" style={{ color: dotColor }}>✓</span>}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor, boxShadow: isHighlighted ? `0 0 5px ${dotColor}` : "none" }} />
                    <span className="flex-1 text-[11px] min-w-0 truncate" style={{ color: t.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)", textDecoration: t.done ? "line-through" : "none" }}>
                      {isMission && <span className="mr-0.5">💎</span>}
                      {t.text}
                    </span>
                    {dayNum !== null && dayMon !== null && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: isHighlighted ? dotColor + "25" : "rgba(255,255,255,0.06)", color: isHighlighted ? dotColor : "rgba(255,255,255,0.25)", border: `1px solid ${isHighlighted ? dotColor + "45" : "transparent"}` }}>
                        {dayNum} {MONTH_NAMES_GEN[dayMon].slice(0, 3)}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}
                      className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {overviewTasks.length > 0 && (
                <p className="text-[8px] text-white/12 mt-0.5 text-center">Наведи — подсветит · Клик — закрепить</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draft inbox */}
      <div className="rounded-2xl border border-white/5 p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-white/25">
            Планы в черновиках
          </p>
          {calendarDrafts.length > 0 && (
            <span className="text-[8px] px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa99", border: "1px solid rgba(167,139,250,0.18)" }}>
              {calendarDrafts.length}
            </span>
          )}
        </div>

        {/* Quick input */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-white/20 text-sm flex-shrink-0">+</span>
            <input
              ref={draftInputRef}
              className="flex-1 bg-transparent text-sm text-white/65 placeholder-white/18 outline-none"
              placeholder="Быстрая заметка или идея для задачи..."
              value={draftInput}
              onChange={(e) => setDraftInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDraft()}
            />
          </div>
          <button
            onClick={handleAddDraft}
            disabled={!draftInput.trim()}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-25"
            style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.28)" }}
          >
            Enter
          </button>
        </div>

        {/* Draft list */}
        {calendarDrafts.length === 0 && (
          <p className="text-[10px] text-white/15 text-center py-1">
            Черновики пусты — сюда можно кидать идеи, пока не решил когда и как
          </p>
        )}
        <div className="flex flex-col gap-2">
          {calendarDrafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40" style={{ background: "#a78bfa" }} />
              <span className="flex-1 text-sm text-white/55 min-w-0 truncate">{draft.text}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setDraftForModal(draft)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all opacity-0 group-hover:opacity-100"
                  style={{ background: "rgba(99,102,241,0.20)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.30)" }}
                  title="Превратить в задачу"
                >
                  <span>✏</span> В задачи
                </button>
                <button
                  onClick={() => removeCalendarDraft(draft.id)}
                  className="text-white/15 hover:text-white/50 transition-colors text-xs opacity-0 group-hover:opacity-100"
                  title="Удалить черновик"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring bulk-action dialog */}
      {recurringDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(14px)" }}
          onClick={e => e.target === e.currentTarget && setRecurringDialog(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(10,9,22,0.98)",
              border: "1px solid rgba(167,139,250,0.22)",
              boxShadow: "0 0 60px rgba(167,139,250,0.10)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(167,139,250,0.10)", background: "rgba(167,139,250,0.03)" }}
            >
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: "#a78bfa", textShadow: "0 0 10px rgba(167,139,250,0.55)" }}>
                  🔁 Повторяющаяся задача
                </p>
                <p className="text-[10px] text-white/35 mt-0.5 truncate max-w-[220px]">{recurringDialog.task.text}</p>
              </div>
              <button onClick={() => setRecurringDialog(null)} className="text-white/25 hover:text-white/60 transition-colors text-lg">✕</button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 flex flex-col gap-3">
              <p className="text-xs text-white/45 leading-relaxed">
                {recurringDialog.action === "delete"
                  ? "Что именно удалить?"
                  : "Какие задачи изменить?"}
              </p>

              {/* Only this */}
              <button
                onClick={() => {
                  if (recurringDialog.action === "delete") {
                    deleteTask(recurringDialog.task.id);
                  }
                  setRecurringDialog(null);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <span className="text-base mt-0.5">✦</span>
                <div>
                  <p className="text-sm font-medium text-white/80">Только эту задачу</p>
                  <p className="text-[10px] text-white/35 mt-0.5">
                    {recurringDialog.task.dueDate
                      ? `${recurringDialog.task.dueDate.slice(8)}.${recurringDialog.task.dueDate.slice(5, 7)}.${recurringDialog.task.dueDate.slice(0, 4)}`
                      : ""}
                  </p>
                </div>
              </button>

              {/* This and all following */}
              <button
                onClick={() => {
                  if (!recurringDialog.task.dueDate) return;
                  if (recurringDialog.action === "delete") {
                    if (recurringDialog.task.checklistItemId) {
                      deleteRecurringFromDate(recurringDialog.task.checklistItemId, recurringDialog.task.dueDate);
                    } else if (recurringDialog.task.recurringTemplateId) {
                      deleteRecurringFromTemplate(recurringDialog.task.recurringTemplateId, recurringDialog.task.dueDate);
                    }
                  }
                  setRecurringDialog(null);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.30)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.15)"; }}
              >
                <span className="text-base mt-0.5 text-red-400">⚠</span>
                <div>
                  <p className="text-sm font-medium text-red-300">Эту и все последующие</p>
                  <p className="text-[10px] text-red-400/50 mt-0.5">
                    Все повторы начиная с {recurringDialog.task.dueDate
                      ? `${recurringDialog.task.dueDate.slice(8)}.${recurringDialog.task.dueDate.slice(5, 7)}`
                      : ""} будут удалены
                  </p>
                </div>
              </button>

              <button
                onClick={() => setRecurringDialog(null)}
                className="w-full py-2 rounded-xl text-sm text-white/30 hover:text-white/55 transition-colors border border-white/6 mt-1"
              >
                Отмена
              </button>
            </div>
          </div>
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

      {/* TaskModal from draft */}
      {draftForModal && (
        <TaskModal
          mode="task"
          initial={{ text: draftForModal.text }}
          onSave={(fields) => {
            addTask({ ...fields, done: false });
            removeCalendarDraft(draftForModal.id);
            setDraftForModal(null);
          }}
          onClose={() => setDraftForModal(null)}
        />
      )}
    </div>
  );
}
