import { useState, useRef } from "react";
import {
  useStore, Goal, GoalLevel, Task,
  computeGoalEarnedXP,
} from "@/lib/store";
import { sphereColors, SphereKey } from "@/lib/sphereColors";
import { GoalModal } from "@/components/GoalModal";
import { TaskModal } from "@/components/TaskModal";

const LAV = "167,139,250";
const LAV_HEX = "#a78bfa";

const LEVEL_META: Record<GoalLevel, { label: string; emoji: string; color: string }> = {
  year:  { label: "ГОД",    emoji: "✨", color: "#fde047" },
  month: { label: "МЕСЯЦ",  emoji: "🌙", color: "#a78bfa" },
  week:  { label: "НЕДЕЛЯ", emoji: "⭐", color: "#86efac" },
};
const LEVELS: GoalLevel[] = ["year", "month", "week"];

const NOW = new Date();
const CUR_MONTH = NOW.getMonth();
const CUR_YEAR  = NOW.getFullYear();
const TODAY_ISO = NOW.toISOString().slice(0, 10);

function hexToRgb(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  } catch { return LAV; }
}

function goalSpansMonth(goal: Goal, year: number, month: number): boolean {
  if (!goal.startDate) return false;
  const start = new Date(goal.startDate);
  let endDate: Date;
  if (goal.durationMonths) {
    endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + goal.durationMonths);
  } else if (goal.durationWeeks) {
    endDate = new Date(start);
    endDate.setDate(endDate.getDate() + goal.durationWeeks * 7);
  } else {
    return false;
  }
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth  = new Date(year, month + 1, 0);
  return firstOfMonth < endDate && lastOfMonth >= start;
}

function isDraftGoal(goal: Goal): boolean {
  return !goal.level && !goal.durationMonths && !goal.durationWeeks;
}

/* ═══════════════════════════════════════════════════════════
   GoalCard
   ═══════════════════════════════════════════════════════════ */
type GoalCardProps = {
  goal: Goal;
  goals: Goal[];
  tasks: Task[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToDay: (text: string) => void;
};

function GoalCard({ goal, goals, tasks, onToggle, onEdit, onDelete, onAddToDay }: GoalCardProps) {
  const { addGoalChecklistItem, toggleGoalChecklistItem, deleteGoalChecklistItem } = useStore();

  const isDraft = isDraftGoal(goal);
  const sphereData = goal.sphere ? sphereColors[goal.sphere] : null;
  const rgb = sphereData ? hexToRgb(sphereData.color) : LAV;

  const earnedXP  = computeGoalEarnedXP(goal, goals, tasks);
  const items     = goal.checklistItems ?? [];
  const doneItems = items.filter(ci => ci.done).length;

  const checklistProgress = items.length > 0 ? Math.round((doneItems / items.length) * 100) : null;
  const xpProgress = !isDraft && goal.targetXP > 0
    ? Math.min(100, Math.round((earnedXP / goal.targetXP) * 100))
    : null;
  const progressPct = checklistProgress ?? xpProgress ?? 0;

  const [expanded, setExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOverdue = !goal.done && goal.level === "month" && goal.year !== undefined && goal.month !== undefined
    && (goal.year < CUR_YEAR || (goal.year === CUR_YEAR && goal.month < CUR_MONTH));

  const borderColor = goal.done ? "rgba(255,255,255,0.07)" : isOverdue ? "rgba(239,68,68,0.30)" : `rgba(${rgb},0.20)`;
  const bgColor     = goal.done ? "rgba(255,255,255,0.015)" : isOverdue ? "rgba(239,68,68,0.04)" : isDraft ? "rgba(255,255,255,0.02)" : `rgba(${rgb},0.04)`;

  function handleAddItem() {
    const t = newItemText.trim();
    if (!t) return;
    addGoalChecklistItem(goal.id, t);
    setNewItemText("");
    inputRef.current?.focus();
  }

  const linkedTasks = tasks.filter(t => t.goalId === goal.id);

  return (
    <div
      className="rounded-[1.75rem] border transition-all duration-300 overflow-hidden"
      style={{
        borderColor,
        background: bgColor,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow: goal.done ? "none" : `0 0 40px rgba(${rgb},0.05), inset 0 1px 0 rgba(255,255,255,0.035)`,
        opacity: goal.done ? 0.70 : 1,
      }}
    >
      {/* ── Card header ── */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">

          {/* Done checkbox */}
          {!isDraft && (
            <button
              onClick={onToggle}
              className="mt-1 w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: goal.done ? "#22c55e" : isOverdue ? "#ef4444" : `rgba(${rgb},0.35)`,
                background: goal.done ? "#22c55e30" : "transparent",
              }}
            >
              {goal.done && <span className="text-[9px] text-green-400">✓</span>}
            </button>
          )}

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {goal.isMission && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wide"
                  style={{ color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.22)" }}>
                  🌟 МИССИЯ
                </span>
              )}
              {sphereData && !goal.isMission && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: sphereData.color, background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.22)` }}>
                  {sphereData.icon} {sphereData.label}
                </span>
              )}
              {goal.level && (
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: LEVEL_META[goal.level].color, background: `rgba(${hexToRgb(LEVEL_META[goal.level].color)},0.10)`, border: `1px solid rgba(${hexToRgb(LEVEL_META[goal.level].color)},0.18)` }}>
                  {LEVEL_META[goal.level].emoji} {LEVEL_META[goal.level].label}
                </span>
              )}
              {(goal.durationMonths || goal.durationWeeks) && (
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: "#67e8f9", background: "rgba(103,232,249,0.10)", border: "1px solid rgba(103,232,249,0.18)" }}>
                  ⏳ {goal.durationMonths ? `${goal.durationMonths} мес.` : `${goal.durationWeeks} нед.`}
                </span>
              )}
              {isDraft && (
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  💡 Черновик
                </span>
              )}
              {isOverdue && <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/12 text-red-400">Просрочена</span>}
              {goal.done && <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/12 text-green-400">Достигнута ✓</span>}
            </div>

            {/* Title */}
            <h3
              className={`text-sm font-medium leading-snug ${goal.done ? "line-through text-white/28" : "text-white/85"}`}
              style={{ letterSpacing: "0.018em" }}
            >
              {goal.title}
            </h3>

            {goal.description && (
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
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

            {/* Deadline / start */}
            {goal.level === "month" && goal.month !== undefined && !goal.done && (
              <p className="text-[10px] mt-2" style={{ color: isOverdue ? "#ef4444" : "rgba(255,255,255,0.22)" }}>
                📅 {new Date(goal.year ?? CUR_YEAR, goal.month).toLocaleString("ru-RU", { month: "long", year: "numeric" })}
              </p>
            )}
            {goal.startDate && (goal.durationMonths || goal.durationWeeks) && !goal.done && (
              <p className="text-[10px] mt-2" style={{ color: "rgba(103,232,249,0.55)" }}>
                📅 С {new Date(goal.startDate).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
              </p>
            )}

            {/* Progress: checklist steps OR xp — two separate lines */}
            {!isDraft && (
              <div className="mt-3 flex flex-col gap-1.5">
                {/* Steps progress */}
                {items.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${checklistProgress}%`,
                          background: goal.done ? "linear-gradient(90deg,#16a34a,#22c55e)" : `linear-gradient(90deg,rgba(${rgb},0.5),rgba(${rgb},1))`,
                          boxShadow: `0 0 8px rgba(${rgb},0.40)`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.28)" }}>
                      {doneItems}/{items.length} шагов
                    </span>
                  </div>
                )}
                {/* XP progress (only if no checklist) */}
                {items.length === 0 && xpProgress !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${xpProgress}%`,
                          background: goal.done ? "linear-gradient(90deg,#16a34a,#22c55e)" : `linear-gradient(90deg,rgba(${rgb},0.5),rgba(${rgb},1))`,
                          boxShadow: `0 0 8px rgba(${rgb},0.40)`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.28)" }}>
                      {earnedXP}/{goal.targetXP} XP
                    </span>
                  </div>
                )}
                {/* Reward line */}
                <p className="text-[9px]" style={{ color: goal.done ? "#22c55e" : `rgba(${LAV},0.45)` }}>
                  {goal.done ? "✓ Завершено" : `Награда при завершении: +${goal.xp} XP`}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all"
              style={{
                background: expanded ? `rgba(${rgb},0.14)` : "rgba(255,255,255,0.04)",
                color: expanded ? (sphereData?.color ?? LAV_HEX) : "rgba(255,255,255,0.25)",
                border: `1px solid rgba(${rgb},${expanded ? "0.28" : "0.08"})`,
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "all 0.25s",
              }}
              title={expanded ? "Свернуть" : "Открыть план"}
            >▾</button>
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/22 hover:text-white/60 hover:bg-white/5 transition-all"
            >✎</button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/22 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >✕</button>
          </div>
        </div>
      </div>

      {/* ── Expanded plan panel ── */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-3 flex flex-col gap-2"
          style={{ borderTop: `1px solid rgba(${rgb},0.08)` }}
        >
          {items.length === 0 && linkedTasks.length === 0 && (
            <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.16)" }}>
              Добавь конкретные шаги к этой цели
            </p>
          )}

          {/* Checklist items */}
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all"
              style={{
                background: item.done ? `rgba(${rgb},0.06)` : "rgba(255,255,255,0.025)",
                border: `1px solid rgba(${rgb},${item.done ? "0.12" : "0.07"})`,
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => toggleGoalChecklistItem(goal.id, item.id)}
                className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: item.done ? (sphereData?.color ?? LAV_HEX) : "rgba(255,255,255,0.20)",
                  background: item.done ? `rgba(${rgb},0.22)` : "transparent",
                }}
              >
                {item.done && <span style={{ color: sphereData?.color ?? LAV_HEX, fontSize: 8 }}>✓</span>}
              </button>

              <span
                className="flex-1 text-xs leading-relaxed"
                style={{
                  color: item.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.62)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.text}
              </span>

              {hoveredItem === item.id && !item.done && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onAddToDay(item.text)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
                    style={{
                      background: `rgba(${LAV},0.16)`,
                      color: LAV_HEX,
                      border: `1px solid rgba(${LAV},0.30)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    + в задачи дня
                  </button>
                  <button
                    onClick={() => deleteGoalChecklistItem(goal.id, item.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white/18 hover:text-red-400 transition-all"
                  >✕</button>
                </div>
              )}
            </div>
          ))}

          {/* Add item */}
          <div className="flex items-center gap-2 mt-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Добавить шаг..."
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddItem()}
              className="flex-1 bg-transparent outline-none text-xs py-2 px-3 rounded-xl transition-all"
              style={{
                color: "rgba(255,255,255,0.55)",
                border: `1px solid rgba(${rgb},0.14)`,
                background: "rgba(255,255,255,0.02)",
              }}
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="px-3 py-2 rounded-xl text-[10px] font-medium transition-all disabled:opacity-30"
              style={{
                background: `rgba(${rgb},0.14)`,
                color: sphereData?.color ?? LAV_HEX,
                border: `1px solid rgba(${rgb},0.22)`,
              }}
            >
              + Добавить
            </button>
          </div>

          {/* Linked tasks from store */}
          {linkedTasks.length > 0 && (
            <>
              <p className="text-[8px] uppercase tracking-[0.22em] mt-2"
                style={{ color: "rgba(255,255,255,0.14)" }}>
                СВЯЗАННЫЕ ЗАДАЧИ
              </p>
              {linkedTasks.map(t => (
                <div key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[9px]" style={{ color: t.done ? "#22c55e" : "rgba(255,255,255,0.18)" }}>
                    {t.done ? "✓" : "○"}
                  </span>
                  <span className={`flex-1 text-xs ${t.done ? "line-through text-white/25" : "text-white/45"}`}>
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

/* ═══════════════════════════════════════════════════════════
   Goals page
   ═══════════════════════════════════════════════════════════ */
export function Goals() {
  const { goals, addGoal, editGoal, deleteGoal, toggleGoal, tasks, addTask } = useStore();

  const [activeLevel, setActiveLevel] = useState<GoalLevel>("month");
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [defaultModalLevel, setDefaultModalLevel] = useState<"year" | "month" | "week" | "custom" | "draft">("month");

  // Task modal for "add to day" from checklist
  const [taskModalItem, setTaskModalItem] = useState<{
    text: string;
    sphere?: SphereKey;
    goalId: string;
  } | null>(null);

  const meta = LEVEL_META[activeLevel];

  // ── Filter goals for the active level tab ──
  const levelGoals = goals.filter(g => {
    if (isDraftGoal(g)) return false;  // drafts go to bottom section
    if (g.level === activeLevel) return true;
    if (activeLevel === "month" && goalSpansMonth(g, CUR_YEAR, CUR_MONTH)) return true;
    return false;
  });

  // ── Draft goals ──
  const draftGoals = goals.filter(isDraftGoal);

  const parentGoals = goals.filter(g =>
    activeLevel === "month" ? g.level === "year" :
    activeLevel === "week"  ? g.level === "month" : false
  );

  const activeCount = levelGoals.filter(g => !g.done).length;
  const doneCount   = levelGoals.filter(g => g.done).length;
  const totalGoals  = levelGoals.length;

  function openAdd(levelKey: "year" | "month" | "week" | "custom" | "draft" = activeLevel) {
    setEditingGoal(null);
    setDefaultModalLevel(levelKey);
    setShowModal(true);
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    const lk = !goal.level && (goal.durationMonths || goal.durationWeeks) ? "custom"
      : !goal.level ? "draft"
      : goal.level;
    setDefaultModalLevel(lk);
    setShowModal(true);
  }

  function handleSave(fields: Omit<Goal, "id">) {
    if (editingGoal) editGoal(editingGoal.id, fields);
    else addGoal(fields);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.18em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
        >
          Цели
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => openAdd("draft")}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            + Черновик
          </button>
          <button
            onClick={() => openAdd()}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: `rgba(${hexToRgb(meta.color)},0.16)`,
              color: meta.color,
              border: `1px solid rgba(${hexToRgb(meta.color)},0.28)`,
              boxShadow: `0 0 16px rgba(${hexToRgb(meta.color)},0.12)`,
            }}
          >
            + Цель
          </button>
        </div>
      </div>

      {/* ── Level tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {LEVELS.map(lvl => {
          const m = LEVEL_META[lvl];
          const active = activeLevel === lvl;
          const rgb = hexToRgb(m.color);
          const cnt = goals.filter(g => !isDraftGoal(g) && (g.level === lvl || (lvl === "month" && goalSpansMonth(g, CUR_YEAR, CUR_MONTH) && !g.level))).length;
          return (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.9rem] transition-all duration-200"
              style={{
                background: active ? `rgba(${rgb},0.15)` : "transparent",
                border: active ? `1px solid rgba(${rgb},0.26)` : "1px solid transparent",
                boxShadow: active ? `0 0 18px rgba(${rgb},0.12)` : "none",
              }}
            >
              <span className="text-base leading-none">{m.emoji}</span>
              <div className="text-left">
                <p className="text-xs font-medium tracking-[0.12em]"
                  style={{ color: active ? m.color : "rgba(255,255,255,0.26)", textShadow: active ? `0 0 10px ${m.color}` : "none" }}>
                  {m.label}
                </p>
                {cnt > 0 && (
                  <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.16)" }}>{cnt}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Summary strip ── */}
      {totalGoals > 0 && (
        <div
          className="rounded-2xl px-5 py-3 flex items-center gap-5"
          style={{
            background: `rgba(${hexToRgb(meta.color)},0.05)`,
            border: `1px solid rgba(${hexToRgb(meta.color)},0.14)`,
          }}
        >
          {[
            { label: "Активных", value: activeCount },
            { label: "Выполнено", value: doneCount },
            { label: "Прогресс", value: `${totalGoals > 0 ? Math.round((doneCount / totalGoals) * 100) : 0}%` },
          ].map((stat, i, arr) => (
            <div key={stat.label} className="flex items-center gap-5">
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.20)" }}>
                  {stat.label}
                </p>
                <p className="text-lg font-light tabular-nums leading-tight" style={{ color: meta.color }}>
                  {stat.value}
                </p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.07)" }} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Goals list ── */}
      {levelGoals.length === 0 ? (
        <div
          className="rounded-[1.75rem] p-8 text-center"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-3xl mb-3">{meta.emoji}</p>
          <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.22)" }}>
            Нет целей на {meta.label.toLowerCase()}
          </p>
          <button
            onClick={() => openAdd()}
            className="mt-4 px-5 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: `rgba(${hexToRgb(meta.color)},0.14)`,
              color: meta.color,
              border: `1px solid rgba(${hexToRgb(meta.color)},0.24)`,
            }}
          >
            + Добавить цель
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {levelGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              goals={goals}
              tasks={tasks}
              onToggle={() => toggleGoal(goal.id)}
              onEdit={() => openEdit(goal)}
              onDelete={() => deleteGoal(goal.id)}
              onAddToDay={text => setTaskModalItem({ text, sphere: goal.sphere, goalId: goal.id })}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════
          DRAFT / IDEAS section
          ════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[8px] uppercase tracking-[0.30em] font-medium"
            style={{ color: "rgba(255,255,255,0.16)" }}>
            ИДЕИ И ЧЕРНОВИКИ · {draftGoals.length}
          </p>
          <button
            onClick={() => openAdd("draft")}
            className="text-[9px] transition-all"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            + добавить
          </button>
        </div>

        {draftGoals.length === 0 ? (
          <div
            className="rounded-[1.5rem] px-5 py-4 text-center"
            style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.14)" }}>
              Идеи без срока — мечты и планы на будущее, пока без дедлайна
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {draftGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                goals={goals}
                tasks={tasks}
                onToggle={() => toggleGoal(goal.id)}
                onEdit={() => openEdit(goal)}
                onDelete={() => deleteGoal(goal.id)}
                onAddToDay={text => setTaskModalItem({ text, sphere: goal.sphere, goalId: goal.id })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── GoalModal ── */}
      {showModal && (
        <GoalModal
          defaultLevel={defaultModalLevel}
          parentGoals={parentGoals}
          initial={editingGoal ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
        />
      )}

      {/* ── TaskModal (triggered by "Add to day") ── */}
      {taskModalItem && (
        <TaskModal
          mode="task"
          initial={{
            text: taskModalItem.text,
            description: undefined,
            sphere: taskModalItem.sphere ?? "work",
            category: "Other",
            type: "special",
            priority: false,
            noDeadline: false,
            dueDate: TODAY_ISO,
            xp: 10,
            xpDifficulty: "easy",
            goalId: taskModalItem.goalId,
          }}
          onSave={fields => {
            addTask({ ...fields, done: false } as Omit<Task, "id">);
            setTaskModalItem(null);
          }}
          onClose={() => setTaskModalItem(null)}
        />
      )}
    </div>
  );
}
