import { useState, useRef } from "react";
import { useStore, Goal, Task, GoalAchievement, computeGoalEarnedXP } from "@/lib/store";
import { sphereColors, SphereKey } from "@/lib/sphereColors";
import { GoalModal } from "@/components/GoalModal";
import { TaskModal } from "@/components/TaskModal";
import { formatDuration } from "@/lib/formatDuration";

const LAV     = "167,139,250";
const LAV_HEX = "#a78bfa";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function calcSessions(days: number[], endDate: string): number {
  if (!days.length || !endDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (end < today) return 0;
  let count = 0;
  const cur = new Date(today);
  while (cur <= end) {
    const dow = cur.getDay();
    const ourDow = dow === 0 ? 6 : dow - 1;
    if (days.includes(ourDow)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const NOW       = new Date();
const TODAY_ISO = NOW.toISOString().slice(0, 10);

const MONTH_RU_SHORT = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

/* ── helpers ── */
function hexToRgb(hex: string): string {
  try {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
  } catch { return LAV; }
}

function formatCompletedAt(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function isDraftGoal(g: Goal): boolean {
  return !g.startDate && !g.endDate && !g.level && !g.durationMonths && !g.durationWeeks;
}

function getGoalEndDate(g: Goal): Date | null {
  if (g.endDate) return new Date(g.endDate);
  if (g.startDate) {
    if (g.durationMonths) { const d = new Date(g.startDate); d.setMonth(d.getMonth() + g.durationMonths); return d; }
    if (g.durationWeeks)  { const d = new Date(g.startDate); d.setDate(d.getDate() + g.durationWeeks * 7); return d; }
    if (g.level === "month" && g.month !== undefined) return new Date(g.year ?? NOW.getFullYear(), g.month + 1, 0);
    if (g.level === "year")  return new Date((g.year ?? NOW.getFullYear()) + 1, 0, 0);
  }
  if (g.level === "month" && g.month !== undefined) return new Date(g.year ?? NOW.getFullYear(), g.month + 1, 0);
  if (g.level === "year")  return new Date((g.year ?? NOW.getFullYear()) + 1, 0, 0);
  return null;
}

function getEffectiveDays(g: Goal): number {
  const start = g.startDate ? new Date(g.startDate) : null;
  const end   = getGoalEndDate(g);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function getEffectiveCategory(g: Goal): "short" | "mid" | "long" {
  // Primary: use the explicitly saved level tag (set in GoalModal when saving)
  if (g.level === "week")  return "short";
  if (g.level === "month") return "mid";
  if (g.level === "year")  return "long";
  // Fallback for legacy goals without explicit level: compute from days
  const d = getEffectiveDays(g);
  if (d <= 21)  return "short";
  if (d <= 180) return "mid";
  return "long";
}

function formatPeriodBadge(g: Goal): string {
  if (g.durationMonths) return `${g.durationMonths} мес.`;
  if (g.durationWeeks)  return `${g.durationWeeks} нед.`;
  const d = getEffectiveDays(g);
  if (d > 0) return formatDuration(d);
  return g.level === "week" ? "1 нед." : g.level === "month" ? "1 мес." : g.level === "year" ? "1 год" : "";
}

function isOverdueGoal(g: Goal): boolean {
  if (g.done) return false;
  const end = getGoalEndDate(g);
  if (!end) return false;
  return end < NOW;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_RU_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

const TAB_META = {
  short: { label: "НЕДЕЛЯ",   emoji: "⭐", color: "#86efac", desc: "До 3 недель" },
  mid:   { label: "МЕСЯЦ",    emoji: "🌙", color: "#a78bfa", desc: "До 6 месяцев" },
  long:  { label: "ГОД+",     emoji: "✨", color: "#fde047", desc: "Долгосрочные" },
};
type TabKey = "short" | "mid" | "long";
const TABS: TabKey[] = ["short", "mid", "long"];

/* ══════════════════════════════════════════
   GoalCard
   ══════════════════════════════════════════ */
type GoalCardProps = {
  goal: Goal;
  goals: Goal[];
  tasks: Task[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToDay: (text: string, checklistItemId: string) => void;
};

function GoalCard({ goal, goals, tasks, onToggle, onEdit, onDelete, onAddToDay }: GoalCardProps) {
  const { addGoalChecklistItem, editGoalChecklistItem, toggleGoalChecklistItem, deleteGoalChecklistItem } = useStore();

  const isDraft    = isDraftGoal(goal);
  const sphereData = goal.sphere ? sphereColors[goal.sphere] : null;
  const rgb        = sphereData ? hexToRgb(sphereData.color) : LAV;
  const overdue    = isOverdueGoal(goal);

  const items     = goal.checklistItems ?? [];
  const doneItems = items.filter(ci => ci.done).length;
  const allDone   = items.length > 0 && doneItems === items.length;
  const pct       = items.length > 0 ? Math.round((doneItems / items.length) * 100) : 0;

  const [expanded, setExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recurring step form state
  const [recurringMode, setRecurringMode] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurEndDate, setRecurEndDate] = useState("");

  // Extend recurring item state
  const [extendingItemId, setExtendingItemId] = useState<string | null>(null);
  const [extendCount, setExtendCount] = useState("5");

  const borderColor = goal.done ? "rgba(34,197,94,0.22)" : overdue ? "rgba(239,68,68,0.28)" : `rgba(${rgb},0.20)`;
  const bgColor     = goal.done ? "rgba(34,197,94,0.04)" : overdue ? "rgba(239,68,68,0.04)" : isDraft ? "rgba(255,255,255,0.018)" : `rgba(${rgb},0.04)`;

  const projectedSessions = recurringMode ? calcSessions(recurDays, recurEndDate) : 0;

  function handleAddItem() {
    const t = newItemText.trim();
    if (!t) return;
    if (recurringMode && recurDays.length > 0 && recurEndDate) {
      const totalSessions = calcSessions(recurDays, recurEndDate);
      if (totalSessions > 0) {
        addGoalChecklistItem(goal.id, t, { days: recurDays, endDate: recurEndDate, totalSessions });
        setNewItemText("");
        setRecurringMode(false);
        setRecurDays([]);
        setRecurEndDate("");
        inputRef.current?.focus();
        return;
      }
    }
    addGoalChecklistItem(goal.id, t);
    setNewItemText("");
    inputRef.current?.focus();
  }

  function handleExtend(item: typeof items[0]) {
    const n = parseInt(extendCount) || 0;
    if (n <= 0 || !item.recurring) return;
    const newTotal = item.recurring.totalSessions + n;
    editGoalChecklistItem(goal.id, item.id, {
      recurring: { ...item.recurring, totalSessions: newTotal },
      done: item.recurring.completedSessions >= newTotal,
    });
    setExtendingItemId(null);
    setExtendCount("5");
  }

  const linkedTasks = tasks.filter(t => t.goalId === goal.id);
  const periodBadge = !isDraft ? formatPeriodBadge(goal) : null;

  return (
    <div
      className="rounded-[1.75rem] border transition-all duration-300 overflow-hidden"
      style={{
        borderColor,
        background: bgColor,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: goal.done ? "none" : `0 0 44px rgba(${rgb},0.05), inset 0 1px 0 rgba(255,255,255,0.04)`,
        opacity: goal.done ? 0.75 : 1,
      }}
    >
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">

            {/* ── Badge row ── */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {goal.isMission && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold tracking-wide"
                  style={{ color: "#fbbf24", background: "rgba(251,191,36,0.11)", border: "1px solid rgba(251,191,36,0.22)" }}>
                  🌟 МИССИЯ
                </span>
              )}
              {sphereData && !goal.isMission && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: sphereData.color, background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.22)` }}>
                  {sphereData.icon} {sphereData.label}
                </span>
              )}
              {periodBadge && (
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: "rgba(103,232,249,0.80)", background: "rgba(103,232,249,0.09)", border: "1px solid rgba(103,232,249,0.18)" }}>
                  ⏳ {periodBadge}
                </span>
              )}
              {isDraft && (
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: "rgba(255,255,255,0.26)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  💡 Черновик
                </span>
              )}
              {overdue && !goal.done && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/12 text-red-400 border border-red-400/20">
                  Просрочена
                </span>
              )}
              {goal.done && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/12 text-green-400 border border-green-400/20">
                  ✓ Достигнута
                </span>
              )}
            </div>

            {/* ── Title (КРУПНЫЙ) ── */}
            <h3
              className={`text-base font-semibold leading-snug ${goal.done ? "line-through text-white/28" : "text-white/88"}`}
              style={{ letterSpacing: "0.01em" }}
            >
              {goal.title}
            </h3>

            {goal.description && (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
                {goal.description}
              </p>
            )}

            {goal.successCriteria && (
              <div className="flex items-start gap-1.5 mt-2">
                <span className="text-[9px] flex-shrink-0 mt-0.5" style={{ color: `rgba(${LAV},0.45)` }}>✦</span>
                <p className="text-[11px] italic leading-relaxed" style={{ color: `rgba(${LAV},0.55)` }}>
                  {goal.successCriteria}
                </p>
              </div>
            )}

            {/* ── Period dates ── */}
            {!isDraft && (goal.startDate || goal.endDate) && (
              <p className="text-[9px] mt-1.5" style={{ color: overdue ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.16)" }}>
                {goal.startDate ? formatDate(goal.startDate) : "?"} → {goal.endDate ? formatDate(goal.endDate) : "?"}
              </p>
            )}

            {/* ── Progress bar (steps) ── */}
            {!isDraft && items.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: goal.done || allDone
                          ? "linear-gradient(90deg,rgba(34,197,94,0.65),rgba(52,211,153,0.80))"
                          : `linear-gradient(90deg,rgba(${rgb},0.38),rgba(${rgb},0.75))`,
                        boxShadow: allDone ? "0 0 6px rgba(52,211,153,0.28)" : `0 0 6px rgba(${rgb},0.22)`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] flex-shrink-0 tabular-nums"
                    style={{ color: goal.done || allDone ? "rgba(52,211,153,0.70)" : `rgba(${rgb},0.55)` }}>
                    {doneItems}/{items.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.16)" }}>
                    {goal.done || allDone ? "✓ Все шаги выполнены" : `${doneItems} из ${items.length} шагов`}
                  </span>
                  <span className="text-[8px]" style={{ color: `rgba(${LAV},0.30)` }}>
                    +{goal.xp} XP
                  </span>
                </div>
              </div>
            )}

            {/* ── "No steps" XP info ── */}
            {!isDraft && items.length === 0 && !goal.done && (
              <p className="text-[9px] mt-2" style={{ color: `rgba(${LAV},0.28)` }}>
                Добавь шаги и получи +{goal.xp} XP при завершении
              </p>
            )}

            {/* ── COMPLETE GOAL button (always visible when not done, glows only when ready) ── */}
            {!goal.done && !isDraft && (
              <button
                onClick={allDone || items.length === 0 ? onToggle : undefined}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-300 group/complete"
                style={{
                  background: allDone || items.length === 0
                    ? "rgba(167,139,250,0.09)"
                    : "rgba(255,255,255,0.02)",
                  border: allDone || items.length === 0
                    ? "1px solid rgba(167,139,250,0.32)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: allDone || items.length === 0
                    ? "rgba(167,139,250,0.80)"
                    : "rgba(255,255,255,0.18)",
                  boxShadow: allDone || items.length === 0
                    ? "0 0 14px rgba(167,139,250,0.12)"
                    : "none",
                  cursor: allDone || items.length === 0 ? "pointer" : "default",
                }}
                onMouseEnter={e => {
                  if (!(allDone || items.length === 0)) return;
                  const el = e.currentTarget;
                  el.style.background = "rgba(167,139,250,0.16)";
                  el.style.borderColor = "rgba(167,139,250,0.55)";
                  el.style.color = "rgba(167,139,250,1)";
                  el.style.boxShadow = "0 0 22px rgba(167,139,250,0.28)";
                }}
                onMouseLeave={e => {
                  if (!(allDone || items.length === 0)) return;
                  const el = e.currentTarget;
                  el.style.background = "rgba(167,139,250,0.09)";
                  el.style.borderColor = "rgba(167,139,250,0.32)";
                  el.style.color = "rgba(167,139,250,0.80)";
                  el.style.boxShadow = "0 0 14px rgba(167,139,250,0.12)";
                }}
              >
                <span style={{ opacity: allDone || items.length === 0 ? 1 : 0.5 }}>✦</span>
                <span>Завершить цель · +{goal.xp} XP</span>
              </button>
            )}

            {/* ── Undo done ── */}
            {goal.done && (
              <button
                onClick={onToggle}
                className="mt-2 text-[9px] transition-all"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                Отменить завершение
              </button>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="flex gap-1 flex-shrink-0 mt-0.5">
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] transition-all"
              style={{
                background: expanded ? `rgba(${rgb},0.16)` : "rgba(255,255,255,0.04)",
                color: expanded ? (sphereData?.color ?? LAV_HEX) : "rgba(255,255,255,0.18)",
                border: `1px solid rgba(${rgb},${expanded ? "0.30" : "0.09"})`,
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "all 0.22s",
              }}
              title={expanded ? "Свернуть" : "Открыть план"}
            >▾</button>
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white/[0.14] hover:text-white/50 hover:bg-white/5 transition-all"
            >✎</button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white/[0.12] hover:text-red-400/75 hover:bg-red-500/5 transition-all"
            >✕</button>
          </div>
        </div>
      </div>

      {/* ── Expanded plan panel ── */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-3 flex flex-col gap-2"
          style={{ borderTop: `1px solid rgba(${rgb},0.09)` }}
        >
          <p className="text-[8px] uppercase tracking-[0.25em] mb-1"
            style={{ color: `rgba(${rgb},0.38)` }}>
            ПЛАН · ШАГИ
          </p>

          {items.length === 0 && linkedTasks.length === 0 && (
            <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.15)" }}>
              Добавь конкретные шаги к цели
            </p>
          )}

          {/* Checklist */}
          {items.map(item => {
            const isRec = !!item.recurring;
            const recPct = isRec
              ? Math.min(100, Math.round((item.recurring!.completedSessions / item.recurring!.totalSessions) * 100))
              : 0;
            const accentColor = sphereData?.color ?? LAV_HEX;
            const isExtending = extendingItemId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col rounded-2xl group transition-all"
                style={{
                  background: item.done ? `rgba(${rgb},0.07)` : "rgba(255,255,255,0.025)",
                  border: `1px solid rgba(${rgb},${item.done ? "0.14" : "0.08"})`,
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-3.5 pt-3 pb-2">
                  {/* Checkbox / Session counter */}
                  {isRec ? (
                    <button
                      onClick={() => item.done && toggleGoalChecklistItem(goal.id, item.id)}
                      className="w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0 transition-all select-none"
                      style={{
                        background: item.done ? `rgba(${rgb},0.22)` : `rgba(${rgb},0.10)`,
                        border: `1.5px solid rgba(${rgb},${item.done ? "0.45" : "0.25"})`,
                        cursor: item.done ? "pointer" : "default",
                        minWidth: 26,
                      }}
                      title={item.done ? "Снять отметку" : `${item.recurring!.completedSessions} из ${item.recurring!.totalSessions}`}
                    >
                      {item.done ? (
                        <span style={{ color: accentColor, fontSize: 9 }}>✓</span>
                      ) : (
                        <span className="font-bold tabular-nums" style={{ color: accentColor, fontSize: 9, lineHeight: 1 }}>
                          {item.recurring!.completedSessions}
                        </span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleGoalChecklistItem(goal.id, item.id)}
                      className="w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: item.done ? accentColor : "rgba(255,255,255,0.20)",
                        background: item.done ? `rgba(${rgb},0.22)` : "transparent",
                      }}
                    >
                      {item.done && <span style={{ color: accentColor, fontSize: 9 }}>✓</span>}
                    </button>
                  )}

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs leading-relaxed"
                      style={{
                        color: item.done ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.65)",
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      {item.text}
                    </span>
                    {isRec && (
                      <span className="text-[9px] ml-2" style={{ color: `rgba(${rgb},0.45)` }}>
                        ⟳ {item.recurring!.completedSessions}/{item.recurring!.totalSessions} сессий
                      </span>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hoveredItem === item.id && !item.done && !isRec && (
                      <button
                        onClick={() => onAddToDay(item.text, item.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all"
                        style={{
                          background: `rgba(${LAV},0.18)`,
                          color: LAV_HEX,
                          border: `1px solid rgba(${LAV},0.32)`,
                          boxShadow: `0 0 10px rgba(${LAV},0.15)`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        + в план дня
                      </button>
                    )}
                    {hoveredItem === item.id && item.done && isRec && !isExtending && (
                      <button
                        onClick={() => { setExtendingItemId(item.id); setExtendCount("5"); }}
                        className="px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all"
                        style={{
                          background: `rgba(${rgb},0.14)`,
                          color: accentColor,
                          border: `1px solid rgba(${rgb},0.26)`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        + сессий
                      </button>
                    )}
                    {hoveredItem === item.id && (
                      <button
                        onClick={() => deleteGoalChecklistItem(goal.id, item.id)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white/15 hover:text-red-400 transition-all"
                      >✕</button>
                    )}
                  </div>
                </div>

                {/* Mini progress bar for recurring */}
                {isRec && (
                  <div className="px-3.5 pb-3">
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${recPct}%`,
                          background: item.done
                            ? "linear-gradient(90deg,#16a34a,#22c55e)"
                            : `linear-gradient(90deg,rgba(${rgb},0.55),${accentColor})`,
                          boxShadow: `0 0 6px rgba(${rgb},0.40)`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Extend inline form */}
                {isExtending && (
                  <div
                    className="flex items-center gap-2 px-3.5 pb-3"
                    style={{ borderTop: `1px solid rgba(${rgb},0.08)`, paddingTop: 8 }}
                  >
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                      Добавить ещё сессий:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={extendCount}
                      onChange={e => setExtendCount(e.target.value)}
                      className="w-14 bg-transparent outline-none text-xs text-center rounded-lg px-2 py-1"
                      style={{ border: `1px solid rgba(${rgb},0.22)`, color: "rgba(255,255,255,0.7)" }}
                    />
                    <button
                      onClick={() => handleExtend(item)}
                      className="px-3 py-1 rounded-lg text-[9px] font-semibold transition-all"
                      style={{ background: `rgba(${rgb},0.20)`, color: accentColor, border: `1px solid rgba(${rgb},0.30)` }}
                    >Продолжить</button>
                    <button
                      onClick={() => setExtendingItemId(null)}
                      className="text-[9px] text-white/20 hover:text-white/50 transition-all"
                    >Отмена</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add step input */}
          <div className="flex flex-col gap-2 mt-1">
            {/* Main input row */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={recurringMode ? "Название повторяющегося шага..." : "Добавить шаг..."}
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !recurringMode && handleAddItem()}
                className="flex-1 bg-transparent outline-none text-xs py-2 px-3 rounded-xl transition-all"
                style={{
                  color: "rgba(255,255,255,0.55)",
                  border: `1px solid rgba(${recurringMode ? LAV : rgb},${recurringMode ? "0.32" : "0.14"})`,
                  background: recurringMode ? `rgba(${LAV},0.05)` : "rgba(255,255,255,0.025)",
                }}
              />
              {/* Recurring toggle */}
              <button
                onClick={() => { setRecurringMode(m => !m); setRecurDays([]); setRecurEndDate(""); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] transition-all flex-shrink-0"
                title="Повторяющийся шаг"
                style={{
                  background: recurringMode ? `rgba(${LAV},0.22)` : "rgba(255,255,255,0.04)",
                  color: recurringMode ? LAV_HEX : "rgba(255,255,255,0.22)",
                  border: `1px solid rgba(${LAV},${recurringMode ? "0.38" : "0.10"})`,
                }}
              >⟳</button>
              {!recurringMode && (
                <button
                  onClick={handleAddItem}
                  disabled={!newItemText.trim()}
                  className="px-3 py-2 rounded-xl text-[10px] font-semibold transition-all disabled:opacity-30 flex-shrink-0"
                  style={{
                    background: `rgba(${rgb},0.16)`,
                    color: sphereData?.color ?? LAV_HEX,
                    border: `1px solid rgba(${rgb},0.24)`,
                  }}
                >+ Шаг</button>
              )}
            </div>

            {/* Recurring config panel */}
            {recurringMode && (
              <div
                className="flex flex-col gap-2.5 px-3 py-3 rounded-2xl"
                style={{ background: `rgba(${LAV},0.06)`, border: `1px solid rgba(${LAV},0.15)` }}
              >
                {/* Days of week */}
                <div>
                  <p className="text-[8px] uppercase tracking-[0.22em] mb-1.5" style={{ color: `rgba(${LAV},0.40)` }}>Дни недели</p>
                  <div className="flex gap-1">
                    {DAY_LABELS.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRecurDays(d => d.includes(idx) ? d.filter(x => x !== idx) : [...d, idx])}
                        className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-all"
                        style={{
                          background: recurDays.includes(idx) ? `rgba(${LAV},0.28)` : "rgba(255,255,255,0.04)",
                          color: recurDays.includes(idx) ? LAV_HEX : "rgba(255,255,255,0.28)",
                          border: `1px solid rgba(${LAV},${recurDays.includes(idx) ? "0.40" : "0.10"})`,
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* End date */}
                <div>
                  <p className="text-[8px] uppercase tracking-[0.22em] mb-1.5" style={{ color: `rgba(${LAV},0.40)` }}>Дата окончания</p>
                  <input
                    type="date"
                    value={recurEndDate}
                    min={TODAY_ISO}
                    onChange={e => setRecurEndDate(e.target.value)}
                    className="bg-transparent outline-none text-xs rounded-xl px-3 py-2 w-full"
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      border: `1px solid rgba(${LAV},0.20)`,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  />
                </div>

                {/* Session preview + submit */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: projectedSessions > 0 ? LAV_HEX : "rgba(255,255,255,0.22)" }}>
                    {projectedSessions > 0
                      ? `⚡ ${projectedSessions} сессий до ${recurEndDate}`
                      : "Выбери дни и дату окончания"}
                  </span>
                  <button
                    onClick={handleAddItem}
                    disabled={!newItemText.trim() || recurDays.length === 0 || !recurEndDate || projectedSessions === 0}
                    className="px-4 py-1.5 rounded-xl text-[9px] font-semibold transition-all disabled:opacity-30"
                    style={{
                      background: `rgba(${LAV},0.24)`,
                      color: LAV_HEX,
                      border: `1px solid rgba(${LAV},0.36)`,
                    }}
                  >Создать шаг + задачи</button>
                </div>
              </div>
            )}
          </div>

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <>
              <p className="text-[8px] uppercase tracking-[0.22em] mt-2"
                style={{ color: "rgba(255,255,255,0.13)" }}>
                ЗАДАЧИ ДНЯ
              </p>
              {linkedTasks.map(t => (
                <div key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[9px]" style={{ color: t.done ? "#22c55e" : "rgba(255,255,255,0.18)" }}>
                    {t.done ? "✓" : "○"}
                  </span>
                  <span className={`flex-1 text-xs ${t.done ? "line-through text-white/22" : "text-white/45"}`}>
                    {t.text}
                  </span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>+{t.xp}XP</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );

  function handleAddItem() {
    const t = newItemText.trim();
    if (!t) return;
    addGoalChecklistItem(goal.id, t);
    setNewItemText("");
    inputRef.current?.focus();
  }
}

/* ══════════════════════════════════════════
   ArchiveCard — выполненная цель
   ══════════════════════════════════════════ */
function ArchiveCard({
  goal,
  goals,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onToggleMapVisibility,
}: {
  goal: Goal;
  goals: Goal[];
  tasks: Task[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMapVisibility: () => void;
}) {
  const sphere = goal.sphere ? sphereColors[goal.sphere] : null;
  const rgb    = sphere ? hexToRgb(sphere.color) : "160,174,210";

  const SILVER = "160,174,210";
  const earned = computeGoalEarnedXP(goal, goals, tasks);
  const pct    = goal.targetXP > 0 ? Math.min(100, Math.round(earned / goal.targetXP * 100)) : 100;

  return (
    <div
      className="relative rounded-[1.4rem] overflow-hidden transition-all duration-300"
      style={{
        background: "rgba(12,11,28,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid rgba(${SILVER},0.22)`,
        boxShadow: `0 0 28px rgba(${SILVER},0.06), inset 0 0 0 1px rgba(255,255,255,0.025)`,
        opacity: 0.88,
      }}
    >
      {/* COMPLETED badge — top-right ribbon */}
      <div
        className="absolute top-3.5 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
        style={{
          background: "rgba(34,197,94,0.10)",
          border: "1px solid rgba(34,197,94,0.22)",
          boxShadow: "0 0 12px rgba(34,197,94,0.12)",
        }}
      >
        <span className="text-green-400 font-bold text-[10px] leading-none">✓</span>
        <span
          className="text-[8px] font-bold tracking-[0.20em] uppercase"
          style={{ color: "rgba(34,197,94,0.85)" }}
        >
          COMPLETED
        </span>
      </div>

      {/* Main content */}
      <div className="px-5 pt-4 pb-3">
        {/* Top row */}
        <div className="flex items-start gap-3 pr-24">
          {/* Sphere icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `rgba(${rgb},0.10)`, border: `1px solid rgba(${rgb},0.18)` }}
          >
            <span className="text-base leading-none" style={{ filter: "grayscale(40%)", opacity: 0.70 }}>
              {sphere?.emoji ?? "🎯"}
            </span>
          </div>

          {/* Title + date */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug"
              style={{
                color: "rgba(255,255,255,0.55)",
                textDecoration: "line-through",
                textDecorationColor: "rgba(255,255,255,0.18)",
              }}
            >
              {goal.title}
            </p>
            {goal.description && (
              <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "rgba(255,255,255,0.22)" }}>
                {goal.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {goal.completedAt && (
                <span className="text-[9px] flex items-center gap-1" style={{ color: "rgba(34,197,94,0.55)" }}>
                  <span>📅</span>
                  Дата завершения: {formatCompletedAt(goal.completedAt)}
                </span>
              )}
              {sphere && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-md"
                  style={{ background: `rgba(${rgb},0.08)`, color: `rgba(${rgb},0.45)` }}
                >
                  {sphere.label}
                </span>
              )}
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.20)" }}>
                +{goal.xp} XP
              </span>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="mt-3">
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: `rgba(${SILVER},0.08)` }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg,rgba(34,197,94,0.45),rgba(52,211,153,0.60))",
                boxShadow: "0 0 6px rgba(34,197,94,0.22)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.14)" }}>{pct}% выполнено</span>
            <span className="text-[8px]" style={{ color: "rgba(34,197,94,0.40)" }}>{earned}/{goal.targetXP} XP</span>
          </div>
        </div>

        {/* Checklist items (all strikethrough) */}
        {goal.checklistItems && goal.checklistItems.length > 0 && (
          <div
            className="mt-3 rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            {goal.checklistItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 px-3 py-2 border-b last:border-b-0"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(34,197,94,0.50)" }}>✓</span>
                <span
                  className="text-[11px] flex-1"
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    textDecoration: "line-through",
                    textDecorationColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  {item.text}
                  {item.recurring && (
                    <span className="ml-1.5 text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                      ⟳ {item.recurring.completedSessions}/{item.recurring.totalSessions}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3">
          {/* Eye toggle — map visibility */}
          <button
            onClick={onToggleMapVisibility}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
            style={{
              background: goal.hiddenFromMap ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
              color: goal.hiddenFromMap ? "rgba(239,68,68,0.50)" : "rgba(34,197,94,0.50)",
              border: goal.hiddenFromMap ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(34,197,94,0.15)",
            }}
            title={goal.hiddenFromMap ? "Показать в карте целей" : "Скрыть из карты целей"}
          >
            <span>{goal.hiddenFromMap ? "🙈" : "👁"}</span>
            <span>{goal.hiddenFromMap ? "Скрыто из карты" : "В карте целей"}</span>
          </button>

          <div className="flex-1" />

          {/* Un-complete */}
          <button
            onClick={onToggle}
            className="px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.20)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            title="Вернуть в активные"
          >
            ↩ Вернуть
          </button>
          <button
            onClick={onEdit}
            className="px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all hover:opacity-80"
            style={{
              background: `rgba(${SILVER},0.06)`,
              color: `rgba(${SILVER},0.35)`,
              border: `1px solid rgba(${SILVER},0.10)`,
            }}
            title="Редактировать"
          >
            ✏
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] transition-all hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.06)" }}
            title="Удалить"
          >✕</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Goals page
   ══════════════════════════════════════════ */
export function Goals() {
  const { goals, addGoal, editGoal, deleteGoal, toggleGoal, tasks, addTask, addRecurringTaskBatch, goalAchievements, removeGoalAchievement } = useStore();

  const [activeTab, setActiveTab] = useState<TabKey>("mid");
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showArchive, setShowArchive] = useState(true);

  const [taskModalItem, setTaskModalItem] = useState<{
    text: string; sphere?: SphereKey; goalId: string; checklistItemId?: string;
  } | null>(null);

  const meta = TAB_META[activeTab];

  const tabGoals       = goals.filter(g => !isDraftGoal(g) && getEffectiveCategory(g) === activeTab);
  const activeTabGoals = tabGoals.filter(g => !g.done);
  const archiveTabGoals = tabGoals.filter(g => g.done);
  const draftGoals = goals.filter(isDraftGoal);

  const doneCount  = archiveTabGoals.length;
  const activeCount = activeTabGoals.length;

  function openAdd() { setEditingGoal(null); setShowModal(true); }
  function openEdit(g: Goal) { setEditingGoal(g); setShowModal(true); }

  function handleSave(fields: Omit<Goal, "id">) {
    if (editingGoal) editGoal(editingGoal.id, fields);
    else addGoal(fields);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* ══ Header ══ */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: `0 0 30px rgba(${LAV},0.35)` }}
        >
          Цели
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOverviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] uppercase tracking-[0.13em] transition-all hover:opacity-90"
            style={{
              color: `rgba(${LAV},0.40)`,
              border: `1px solid rgba(${LAV},0.13)`,
              background: "transparent",
            }}
          >
            <span style={{ fontSize: "12px", lineHeight: 1 }}>◎</span>
            карта
          </button>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
            style={{
              background: `rgba(${LAV},0.18)`,
              color: LAV_HEX,
              border: `1px solid rgba(${LAV},0.32)`,
              boxShadow: `0 0 18px rgba(${LAV},0.18)`,
              textShadow: `0 0 10px rgba(${LAV},0.55)`,
            }}
          >
            + Новая цель
          </button>
        </div>
      </div>

      {/* ══ Tabs: НЕДЕЛЯ / МЕСЯЦ / ГОД+ ══ */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {TABS.map(tab => {
          const m   = TAB_META[tab];
          const rgb = hexToRgb(m.color);
          const cnt = goals.filter(g => !isDraftGoal(g) && getEffectiveCategory(g) === tab).length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[0.85rem] transition-all duration-200"
              style={{
                background: active ? `rgba(${rgb},0.16)` : "transparent",
                border: active ? `1px solid rgba(${rgb},0.28)` : "1px solid transparent",
                boxShadow: active ? `0 0 22px rgba(${rgb},0.14)` : "none",
              }}
            >
              <span className="text-lg leading-none">{m.emoji}</span>
              <div className="text-left">
                <p
                  className="text-xs font-bold tracking-[0.14em]"
                  style={{
                    color: active ? m.color : "rgba(255,255,255,0.25)",
                    textShadow: active ? `0 0 12px ${m.color}` : "none",
                  }}
                >
                  {m.label}
                </p>
                <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                  {m.desc}{cnt > 0 ? ` · ${cnt}` : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ══ Summary strip ══ */}
      {tabGoals.length > 0 && (
        <div
          className="rounded-2xl px-5 py-3 flex items-center gap-6"
          style={{
            background: `rgba(${hexToRgb(meta.color)},0.05)`,
            border: `1px solid rgba(${hexToRgb(meta.color)},0.14)`,
          }}
        >
          {[
            { lbl: "АКТИВНЫХ",  val: activeCount },
            { lbl: "ВЫПОЛНЕНО", val: doneCount },
            { lbl: "ПРОГРЕСС",  val: tabGoals.length > 0 ? `${Math.round((doneCount/tabGoals.length)*100)}%` : "0%" },
          ].map((s, i, arr) => (
            <div key={s.lbl} className="flex items-center gap-6">
              <div>
                <p className="text-[8px] uppercase tracking-[0.20em]" style={{ color: "rgba(255,255,255,0.20)" }}>{s.lbl}</p>
                <p className="text-2xl font-light tabular-nums leading-tight" style={{ color: meta.color }}>{s.val}</p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-9 self-center" style={{ background: "rgba(255,255,255,0.07)" }}/>}
            </div>
          ))}
        </div>
      )}

      {/* ══ Goals list (active only) ══ */}
      {activeTabGoals.length === 0 && archiveTabGoals.length === 0 ? (
        <div
          className="rounded-[1.75rem] p-10 text-center"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-4xl mb-3">{meta.emoji}</p>
          <p className="text-base font-light" style={{ color: "rgba(255,255,255,0.22)" }}>
            Нет целей в категории «{meta.label}»
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: `rgba(${hexToRgb(meta.color)},0.15)`,
              color: meta.color,
              border: `1px solid rgba(${hexToRgb(meta.color)},0.26)`,
            }}
          >
            + Добавить цель
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeTabGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              goals={goals}
              tasks={tasks}
              onToggle={() => toggleGoal(goal.id)}
              onEdit={() => openEdit(goal)}
              onDelete={() => deleteGoal(goal.id)}
              onAddToDay={(text, checklistItemId) => setTaskModalItem({ text, sphere: goal.sphere, goalId: goal.id, checklistItemId })}
            />
          ))}
        </div>
      )}

      {/* ══ Archive section (done goals) ══ */}
      {archiveTabGoals.length > 0 && (
        <div className="flex flex-col gap-3 mt-5">
          {/* Archive header */}
          <button
            onClick={() => setShowArchive(v => !v)}
            className="flex items-center gap-3 px-1 group transition-all"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-px flex-1" style={{ background: "rgba(180,200,255,0.12)" }} />
              <span
                className="text-[9px] font-bold tracking-[0.28em] flex items-center gap-2"
                style={{ color: "rgba(180,200,255,0.40)" }}
              >
                <span style={{ fontSize: 12 }}>🏆</span>
                АРХИВ · ВЫПОЛНЕННЫЕ ЦЕЛИ
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-md"
                  style={{ background: "rgba(180,200,255,0.08)", color: "rgba(180,200,255,0.45)" }}
                >
                  {archiveTabGoals.length}
                </span>
              </span>
              <div className="h-px flex-1" style={{ background: "rgba(180,200,255,0.12)" }} />
            </div>
            <span
              className="text-[10px] transition-transform duration-200"
              style={{ color: "rgba(180,200,255,0.30)", transform: showArchive ? "rotate(0deg)" : "rotate(-90deg)" }}
            >
              ▾
            </span>
          </button>

          {/* Archive cards */}
          {showArchive && (
            <div className="flex flex-col gap-3">
              {archiveTabGoals.map(goal => (
                <ArchiveCard
                  key={goal.id}
                  goal={goal}
                  goals={goals}
                  tasks={tasks}
                  onToggle={() => toggleGoal(goal.id)}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => deleteGoal(goal.id)}
                  onToggleMapVisibility={() => editGoal(goal.id, { hiddenFromMap: !goal.hiddenFromMap })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Drafts section ══ */}
      <div className="flex flex-col gap-3 pt-2">
        {/* Section header */}
        <div className="flex items-center justify-between px-1">
          <p
            className="text-[9px] uppercase tracking-[0.22em] font-semibold flex items-center gap-1.5"
            style={{ color: "rgba(255,255,255,0.20)" }}
          >
            <span>💡</span>
            <span>Идеи и черновики{draftGoals.length > 0 ? ` · ${draftGoals.length}` : ""}</span>
          </p>
          <button
            onClick={openAdd}
            className="text-[9px] uppercase tracking-[0.12em] transition-all hover:opacity-80"
            style={{ color: `rgba(${LAV},0.35)` }}
          >
            + идея
          </button>
        </div>

        {/* Cards */}
        {draftGoals.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 py-7 rounded-2xl"
            style={{ border: "1px dashed rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.008)" }}
          >
            <span className="text-2xl" style={{ opacity: 0.25 }}>💡</span>
            <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.18)" }}>
              Добавь идею — мечту без срока
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {draftGoals.map(g => {
              const sd = g.sphere ? sphereColors[g.sphere] : null;
              const rgb = sd ? hexToRgb(sd.color) : LAV;
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.016)",
                    border: "1px dashed rgba(255,255,255,0.075)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
                  {/* Icon */}
                  <span className="text-xl flex-shrink-0" style={{ opacity: 0.45 }}>
                    {sd?.icon ?? "💡"}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "rgba(255,255,255,0.52)" }}
                    >
                      {g.title}
                    </p>
                    {g.description && (
                      <p
                        className="text-[11px] mt-0.5 line-clamp-2"
                        style={{ color: "rgba(255,255,255,0.22)" }}
                      >
                        {g.description}
                      </p>
                    )}
                    {sd && (
                      <span
                        className="text-[9px] mt-1.5 inline-block px-1.5 py-0.5 rounded-md"
                        style={{ color: `rgba(${rgb},0.60)`, background: `rgba(${rgb},0.09)` }}
                      >
                        {sd.label}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(g)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] tracking-wide transition-all hover:opacity-90"
                      style={{
                        color: `rgba(${LAV},0.60)`,
                        border: `1px solid rgba(${LAV},0.18)`,
                        background: `rgba(${LAV},0.05)`,
                      }}
                    >
                      ✏ Изменить
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:opacity-80"
                      style={{
                        color: "rgba(255,255,255,0.20)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GoalModal ── */}
      {showModal && (
        <GoalModal
          parentGoals={goals}
          initial={editingGoal ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
        />
      )}

      {/* ── TaskModal for "add to day plan" ── */}
      {taskModalItem && (
        <TaskModal
          mode="task"
          initial={{
            text: taskModalItem.text,
            sphere: taskModalItem.sphere ?? "work",
            category: "Other",
            type: "special",
            priority: false,
            noDeadline: false,
            dueDate: TODAY_ISO,
            xp: 10,
            xpDifficulty: "easy",
            goalId: taskModalItem.goalId,
            checklistItemId: taskModalItem.checklistItemId,
          }}
          onSave={fields => {
            if (fields.recurringDays && fields.recurringDays.length > 0) {
              addRecurringTaskBatch(
                {
                  text: fields.text,
                  description: fields.description,
                  category: fields.category,
                  sphere: fields.sphere,
                  xp: fields.xp,
                  xpDifficulty: fields.xpDifficulty,
                  type: fields.type ?? "special",
                  priority: fields.priority ?? false,
                  noDeadline: false,
                  goalId: fields.goalId,
                  checklistItemId: taskModalItem?.checklistItemId,
                  timeFrom: fields.timeFrom,
                  timeTo: fields.timeTo,
                  recurringDays: fields.recurringDays,
                  recurringEndDate: fields.recurringEndDate,
                },
                fields.recurringDays,
                fields.recurringEndDate ?? null
              );
            } else {
              addTask({ ...fields, done: false } as Parameters<typeof addTask>[0]);
            }
            setTaskModalItem(null);
          }}
          onClose={() => setTaskModalItem(null)}
        />
      )}

      {/* ══ Overview modal ══ */}
      {showOverviewModal && (
        <OverviewModal
          goals={goals}
          tasks={tasks}
          goalAchievements={goalAchievements}
          onClose={() => setShowOverviewModal(false)}
          onEdit={g => { setShowOverviewModal(false); openEdit(g); }}
          onToggleMapVisibility={g => editGoal(g.id, { hiddenFromMap: !g.hiddenFromMap })}
          onToggleGoal={g => toggleGoal(g.id)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Overview Modal — Все цели · Черновики · Дорожная карта · Архив
───────────────────────────────────────────────────────────────── */
const OVERVIEW_TABS = ["Активные", "Дорожная карта", "Архив", "Черновики"] as const;
type OverviewTab = typeof OVERVIEW_TABS[number];

function OverviewModal({
  goals,
  tasks,
  goalAchievements,
  onClose,
  onEdit,
  onToggleMapVisibility,
  onToggleGoal,
}: {
  goals: Goal[];
  tasks: Task[];
  goalAchievements: GoalAchievement[];
  onClose: () => void;
  onEdit: (g: Goal) => void;
  onToggleMapVisibility: (g: Goal) => void;
  onToggleGoal: (g: Goal) => void;
}) {
  const [tab, setTab] = useState<OverviewTab>("Активные");

  const activeGoals = goals.filter(g => !isDraftGoal(g) && !g.done);
  const doneGoals   = goals.filter(g => !isDraftGoal(g) && g.done);
  const drafts      = goals.filter(isDraftGoal);
  const visibleActiveGoals = activeGoals.filter(g => !g.hiddenFromMap);

  const byLevel = {
    week:  activeGoals.filter(g => getEffectiveCategory(g) === "short"),
    month: activeGoals.filter(g => getEffectiveCategory(g) === "mid"),
    year:  activeGoals.filter(g => getEffectiveCategory(g) === "long"),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-4xl flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: "rgba(10,9,22,0.98)",
          border: `1px solid rgba(${LAV},0.20)`,
          boxShadow: `0 0 80px rgba(${LAV},0.12), 0 0 200px rgba(${LAV},0.04)`,
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: `1px solid rgba(${LAV},0.10)`, background: `rgba(${LAV},0.03)` }}
        >
          <div>
            <h2
              className="text-xl font-light tracking-[0.15em] uppercase"
              style={{ color: "rgba(255,255,255,0.80)", textShadow: `0 0 30px rgba(${LAV},0.50)` }}
            >
              ✦ Обзор всех целей
            </h2>
            <p className="text-[10px] mt-1 tracking-widest uppercase" style={{ color: `rgba(${LAV},0.35)` }}>
              {activeGoals.length} активных · {drafts.length} черновиков · {doneGoals.length} завершено
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/5 transition-all text-xl"
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-7 py-3" style={{ borderBottom: `1px solid rgba(${LAV},0.07)` }}>
          {OVERVIEW_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all"
              style={{
                background: tab === t ? `rgba(${LAV},0.18)` : "transparent",
                color: tab === t ? LAV_HEX : "rgba(255,255,255,0.35)",
                border: tab === t ? `1px solid rgba(${LAV},0.30)` : "1px solid transparent",
                textShadow: tab === t ? `0 0 8px rgba(${LAV},0.50)` : "none",
              }}
            >{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-7 py-5 flex-1">

          {/* ── Активные ── */}
          {tab === "Активные" && (
            <div className="flex flex-col gap-6">
              {(["week","month","year"] as const).map(lvl => {
                const gs = byLevel[lvl];
                const label = lvl === "week" ? "НЕДЕЛЯ" : lvl === "month" ? "МЕСЯЦ" : "ГОД+";
                const color = lvl === "week" ? "100,200,255" : lvl === "month" ? LAV : "255,170,90";
                return (
                  <div key={lvl}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1" style={{ background: `rgba(${color},0.18)` }} />
                      <span className="text-[9px] font-bold tracking-[0.28em]" style={{ color: `rgba(${color},0.55)` }}>
                        {label}
                      </span>
                      <div className="h-px flex-1" style={{ background: `rgba(${color},0.18)` }} />
                      <span className="text-[9px]" style={{ color: `rgba(${color},0.35)` }}>{gs.length}</span>
                    </div>
                    {gs.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.12)" }}>
                        Нет активных целей
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {gs.map(g => <OverviewGoalRow key={g.id} goal={g} allGoals={goals} tasks={tasks} onEdit={onEdit} color={color} />)}
                      </div>
                    )}
                  </div>
                );
              })}
              {activeGoals.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🌙</p>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.22)" }}>Нет активных целей</p>
                </div>
              )}
            </div>
          )}

          {/* ── Архив ── */}
          {tab === "Архив" && (
            <div className="flex flex-col gap-4">
              {/* Achievement log */}
              {goalAchievements.length > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.10)" }}
                >
                  <p className="text-[8px] font-bold tracking-[0.24em] uppercase mb-3" style={{ color: "rgba(34,197,94,0.50)" }}>
                    🏆 ИСТОРИЯ ДОСТИЖЕНИЙ
                  </p>
                  <div className="flex flex-col gap-2">
                    {[...goalAchievements].reverse().map(a => {
                      const sp = a.goalSphere ? sphereColors[a.goalSphere] : null;
                      return (
                        <div key={a.id} className="flex items-center gap-3">
                          <span className="text-sm">{sp?.emoji ?? "🎯"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
                              Триумф! Завершена цель: <span style={{ color: "rgba(34,197,94,0.80)" }}>{a.goalTitle}</span>
                            </p>
                          </div>
                          <span
                            className="text-[9px] flex-shrink-0 font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: "rgba(34,197,94,0.10)", color: "rgba(34,197,94,0.65)" }}
                          >
                            +{a.goalXp} XP
                          </span>
                          <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.20)" }}>
                            {formatCompletedAt(a.completedAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Done goals list */}
              {doneGoals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🏆</p>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.22)" }}>Пока нет выполненных целей</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.12)" }}>
                    Завершённые цели будут появляться здесь
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {doneGoals.map(g => {
                    const sphere = g.sphere ? sphereColors[g.sphere] : null;
                    const rgb = sphere ? hexToRgb(sphere.color) : "160,174,210";
                    const SILVER = "160,174,210";
                    return (
                      <div
                        key={g.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-2xl"
                        style={{
                          background: "rgba(12,11,28,0.70)",
                          border: `1px solid rgba(${SILVER},0.16)`,
                          opacity: 0.90,
                        }}
                      >
                        <span className="text-xl flex-shrink-0" style={{ filter: "grayscale(40%)", opacity: 0.65 }}>
                          {sphere?.emoji ?? "🎯"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate"
                              style={{ color: "rgba(255,255,255,0.50)", textDecoration: "line-through", textDecorationColor: "rgba(255,255,255,0.14)" }}>
                              {g.title}
                            </p>
                            <span
                              className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-bold"
                              style={{ background: "rgba(34,197,94,0.10)", color: "rgba(34,197,94,0.75)" }}
                            >
                              ✓ COMPLETED
                            </span>
                          </div>
                          {g.completedAt && (
                            <p className="text-[9px] mt-0.5" style={{ color: "rgba(34,197,94,0.45)" }}>
                              📅 Дата завершения: {formatCompletedAt(g.completedAt)}
                            </p>
                          )}
                        </div>
                        {/* Eye toggle */}
                        <button
                          onClick={() => onToggleMapVisibility(g)}
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm"
                          style={{
                            background: g.hiddenFromMap ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.06)",
                            border: g.hiddenFromMap ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(34,197,94,0.12)",
                          }}
                          title={g.hiddenFromMap ? "Показать в карте" : "Скрыть из карты"}
                        >
                          {g.hiddenFromMap ? "🙈" : "👁"}
                        </button>
                        <button
                          onClick={() => onEdit(g)}
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[9px] transition-all"
                          style={{ color: `rgba(${SILVER},0.30)`, border: `1px solid rgba(${SILVER},0.10)` }}
                        >✏</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Черновики ── */}
          {tab === "Черновики" && (
            <div className="flex flex-col gap-3">
              {drafts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">💡</p>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.22)" }}>Нет черновиков</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.12)" }}>
                    Черновики — это цели без срока, идеи на будущее
                  </p>
                </div>
              ) : drafts.map(g => (
                <OverviewGoalRow key={g.id} goal={g} allGoals={goals} tasks={tasks} onEdit={onEdit} color={LAV} />
              ))}
            </div>
          )}

          {/* ── Дорожная карта ── */}
          {tab === "Дорожная карта" && (
            <div className="flex flex-col gap-6">
              <p className="text-[10px] uppercase tracking-[0.20em] text-center" style={{ color: `rgba(${LAV},0.30)` }}>
                Твой жизненный план — цели по горизонту
              </p>

              {/* Three columns */}
              <div className="grid grid-cols-3 gap-4">
                {([
                  { lvl: "short" as const, label: "НЕДЕЛЯ",  color: "100,200,255", emoji: "⚡" },
                  { lvl: "mid"   as const, label: "МЕСЯЦ",   color: LAV,           emoji: "🌙" },
                  { lvl: "long"  as const, label: "ГОД+",    color: "255,170,90",  emoji: "⭐" },
                ] as const).map(({ lvl, label, color, emoji }) => {
                  const gs = visibleActiveGoals.filter(g => getEffectiveCategory(g) === lvl);
                  return (
                    <div
                      key={lvl}
                      className="rounded-2xl flex flex-col gap-2 p-4"
                      style={{
                        background: `rgba(${color},0.04)`,
                        border: `1px solid rgba(${color},0.14)`,
                      }}
                    >
                      <div className="text-center mb-2">
                        <p className="text-xl mb-1">{emoji}</p>
                        <p className="text-[9px] font-bold tracking-[0.28em]" style={{ color: `rgba(${color},0.70)` }}>
                          {label}
                        </p>
                        <p className="text-[8px] mt-0.5" style={{ color: `rgba(${color},0.35)` }}>
                          {gs.length} {gs.length === 1 ? "цель" : gs.length < 5 ? "цели" : "целей"}
                        </p>
                      </div>

                      {gs.length === 0 ? (
                        <div
                          className="rounded-xl p-3 text-center"
                          style={{ background: `rgba(${color},0.04)`, border: `1px dashed rgba(${color},0.14)` }}
                        >
                          <p className="text-[9px]" style={{ color: `rgba(${color},0.25)` }}>Нет целей</p>
                        </div>
                      ) : gs.map(g => {
                        const sphere = g.sphere ? sphereColors[g.sphere] : null;
                        const rgb = sphere ? hexToRgb(sphere.color) : LAV;
                        const earned = computeGoalEarnedXP(g, visibleActiveGoals, tasks);
                        const pct = g.targetXP > 0 ? Math.min(100, Math.round(earned / g.targetXP * 100)) : 0;
                        return (
                          <button
                            key={g.id}
                            onClick={() => onEdit(g)}
                            className="rounded-xl p-3 text-left transition-all"
                            style={{
                              background: `rgba(${rgb},0.07)`,
                              border: `1px solid rgba(${rgb},0.16)`,
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-sm">{sphere?.emoji ?? "🎯"}</span>
                              <p className="text-[11px] font-medium text-white/75 leading-tight line-clamp-2">{g.title}</p>
                            </div>
                            {g.targetXP > 0 && (
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: `rgba(${rgb},0.15)` }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: `rgba(${rgb},0.70)` }}
                                />
                              </div>
                            )}
                            {g.endDate && (
                              <p className="text-[9px] mt-1.5" style={{ color: `rgba(${rgb},0.45)` }}>
                                до {g.endDate.slice(5).replace("-", ".")}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Drafts preview */}
              {drafts.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.24em] text-center mb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
                    Идеи без срока · {drafts.length}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {drafts.map(g => (
                      <button
                        key={g.id}
                        onClick={() => onEdit(g)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.40)",
                        }}
                      >
                        <span>{g.sphere ? (sphereColors[g.sphere]?.emoji ?? "💡") : "💡"}</span>
                        <span>{g.title.length > 25 ? g.title.slice(0, 25) + "…" : g.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewGoalRow({
  goal,
  allGoals,
  tasks,
  onEdit,
  color,
  done = false,
}: {
  goal: Goal;
  allGoals: Goal[];
  tasks: Task[];
  onEdit: (g: Goal) => void;
  color: string;
  done?: boolean;
}) {
  const sphere = goal.sphere ? sphereColors[goal.sphere] : null;
  const rgb = sphere ? hexToRgb(sphere.color) : LAV;
  const earned = computeGoalEarnedXP(goal, allGoals, tasks);
  const pct = goal.targetXP > 0 ? Math.min(100, Math.round(earned / goal.targetXP * 100)) : 0;
  const endDate = goal.endDate;

  return (
    <button
      onClick={() => onEdit(goal)}
      className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-all"
      style={{
        background: done ? "rgba(100,200,130,0.04)" : `rgba(${color},0.04)`,
        border: done ? "1px solid rgba(100,200,130,0.12)" : `1px solid rgba(${color},0.10)`,
        opacity: done ? 0.65 : 1,
      }}
    >
      <span className="text-xl flex-shrink-0">{sphere?.emoji ?? "🎯"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white/75 truncate" style={{ textDecoration: done ? "line-through" : "none" }}>
            {goal.title}
          </p>
          {done && <span className="text-[9px] text-green-400">✓</span>}
        </div>
        {goal.targetXP > 0 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `rgba(${rgb},0.15)` }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `rgba(${rgb},0.65)` }} />
            </div>
            <span className="text-[9px] flex-shrink-0" style={{ color: `rgba(${rgb},0.55)` }}>{pct}%</span>
          </div>
        )}
      </div>
      {endDate && (
        <span className="text-[9px] flex-shrink-0 px-2 py-0.5 rounded-lg" style={{ background: `rgba(${color},0.10)`, color: `rgba(${color},0.60)` }}>
          {endDate.slice(5).replace("-", ".")}
        </span>
      )}
    </button>
  );
}
