import { useState, useRef } from "react";
import { useStore, Goal, Task } from "@/lib/store";
import { sphereColors, SphereKey } from "@/lib/sphereColors";
import { GoalModal } from "@/components/GoalModal";
import { TaskModal } from "@/components/TaskModal";

const LAV     = "167,139,250";
const LAV_HEX = "#a78bfa";

const NOW       = new Date();
const TODAY_ISO = NOW.toISOString().slice(0, 10);

const MONTH_RU_SHORT = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

/* ── helpers ── */
function hexToRgb(hex: string): string {
  try {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
  } catch { return LAV; }
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
  const d = getEffectiveDays(g);
  if (g.level === "year") return "1 год";
  if (g.durationMonths) return `${g.durationMonths} мес.`;
  if (g.durationWeeks)  return `${g.durationWeeks} нед.`;
  if (g.startDate && g.endDate) {
    if (d <= 14)  return `${d} дн.`;
    if (d <= 60)  return `~${Math.round(d/7)} нед.`;
    if (d <= 400) return `~${Math.round(d/30)} мес.`;
    return `~${Math.round(d/365)} г.`;
  }
  return g.level === "week" ? "1 нед." : g.level === "month" ? "1 мес." : "";
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
  onAddToDay: (text: string) => void;
};

function GoalCard({ goal, goals, tasks, onToggle, onEdit, onDelete, onAddToDay }: GoalCardProps) {
  const { addGoalChecklistItem, toggleGoalChecklistItem, deleteGoalChecklistItem } = useStore();

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

  const borderColor = goal.done ? "rgba(34,197,94,0.22)" : overdue ? "rgba(239,68,68,0.28)" : `rgba(${rgb},0.20)`;
  const bgColor     = goal.done ? "rgba(34,197,94,0.04)" : overdue ? "rgba(239,68,68,0.04)" : isDraft ? "rgba(255,255,255,0.018)" : `rgba(${rgb},0.04)`;

  function handleAddItem() {
    const t = newItemText.trim();
    if (!t) return;
    addGoalChecklistItem(goal.id, t);
    setNewItemText("");
    inputRef.current?.focus();
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
              <p className="text-[10px] mt-1.5" style={{ color: overdue ? "rgba(239,68,68,0.60)" : "rgba(255,255,255,0.22)" }}>
                {goal.startDate ? formatDate(goal.startDate) : "?"} → {goal.endDate ? formatDate(goal.endDate) : "?"}
              </p>
            )}

            {/* ── Progress bar (steps) ── */}
            {!isDraft && items.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: goal.done || allDone
                          ? "linear-gradient(90deg,#16a34a,#22c55e)"
                          : `linear-gradient(90deg,rgba(${rgb},0.50),rgba(${rgb},1))`,
                        boxShadow: `0 0 10px rgba(${rgb},0.45)`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] flex-shrink-0 font-medium tabular-nums"
                    style={{ color: goal.done || allDone ? "#22c55e" : `rgba(${rgb},0.80)` }}>
                    {doneItems}/{items.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {goal.done || allDone ? "Все шаги выполнены" : `${doneItems} из ${items.length} шагов`}
                  </span>
                  <span className="text-[9px]" style={{ color: `rgba(${LAV},0.45)` }}>
                    Награда: +{goal.xp} XP
                  </span>
                </div>
              </div>
            )}

            {/* ── "No steps" XP info ── */}
            {!isDraft && items.length === 0 && !goal.done && (
              <p className="text-[9px] mt-2" style={{ color: `rgba(${LAV},0.40)` }}>
                Добавь шаги и получи +{goal.xp} XP при завершении
              </p>
            )}

            {/* ── COMPLETE GOAL button ── */}
            {!goal.done && (allDone || items.length === 0) && !isDraft && (
              <button
                onClick={onToggle}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg,rgba(34,197,94,0.20),rgba(16,185,129,0.25))",
                  border: "1px solid rgba(34,197,94,0.38)",
                  color: "#4ade80",
                  boxShadow: "0 0 18px rgba(34,197,94,0.20)",
                }}
              >
                <span>✓</span>
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
                color: expanded ? (sphereData?.color ?? LAV_HEX) : "rgba(255,255,255,0.26)",
                border: `1px solid rgba(${rgb},${expanded ? "0.30" : "0.09"})`,
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "all 0.22s",
              }}
              title={expanded ? "Свернуть" : "Открыть план"}
            >▾</button>
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white/22 hover:text-white/60 hover:bg-white/5 transition-all"
            >✎</button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white/22 hover:text-red-400 hover:bg-red-500/5 transition-all"
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
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl group transition-all"
              style={{
                background: item.done ? `rgba(${rgb},0.07)` : "rgba(255,255,255,0.025)",
                border: `1px solid rgba(${rgb},${item.done ? "0.14" : "0.08"})`,
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => toggleGoalChecklistItem(goal.id, item.id)}
                className="w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: item.done ? (sphereData?.color ?? LAV_HEX) : "rgba(255,255,255,0.20)",
                  background: item.done ? `rgba(${rgb},0.22)` : "transparent",
                }}
              >
                {item.done && <span style={{ color: sphereData?.color ?? LAV_HEX, fontSize: 9 }}>✓</span>}
              </button>

              <span
                className="flex-1 text-xs leading-relaxed"
                style={{
                  color: item.done ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.65)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.text}
              </span>

              {hoveredItem === item.id && !item.done && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onAddToDay(item.text)}
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
                  <button
                    onClick={() => deleteGoalChecklistItem(goal.id, item.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white/15 hover:text-red-400 transition-all"
                  >✕</button>
                </div>
              )}
            </div>
          ))}

          {/* Add step input */}
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
                background: "rgba(255,255,255,0.025)",
              }}
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="px-3 py-2 rounded-xl text-[10px] font-semibold transition-all disabled:opacity-30"
              style={{
                background: `rgba(${rgb},0.16)`,
                color: sphereData?.color ?? LAV_HEX,
                border: `1px solid rgba(${rgb},0.24)`,
              }}
            >+ Шаг</button>
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
   Goals page
   ══════════════════════════════════════════ */
export function Goals() {
  const { goals, addGoal, editGoal, deleteGoal, toggleGoal, tasks, addTask } = useStore();

  const [activeTab, setActiveTab] = useState<TabKey>("mid");
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [taskModalItem, setTaskModalItem] = useState<{
    text: string; sphere?: SphereKey; goalId: string;
  } | null>(null);

  const meta = TAB_META[activeTab];

  const tabGoals  = goals.filter(g => !isDraftGoal(g) && getEffectiveCategory(g) === activeTab);
  const draftGoals = goals.filter(isDraftGoal);

  const doneCount  = tabGoals.filter(g => g.done).length;
  const activeCount = tabGoals.filter(g => !g.done).length;

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
        <div>
          <h1
            className="text-3xl font-bold tracking-[0.12em] uppercase"
            style={{
              color: "rgba(255,255,255,0.90)",
              textShadow: `0 0 40px rgba(${LAV},0.50), 0 0 80px rgba(${LAV},0.20)`,
              letterSpacing: "0.14em",
            }}
          >
            ЦЕЛИ
          </h1>
          <p className="text-[10px] uppercase tracking-[0.22em] mt-0.5"
            style={{ color: `rgba(${LAV},0.40)` }}>
            Шаг за шагом к мечте
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
            style={{
              background: `rgba(${LAV},0.20)`,
              color: LAV_HEX,
              border: `1px solid rgba(${LAV},0.35)`,
              boxShadow: `0 0 20px rgba(${LAV},0.20)`,
              textShadow: `0 0 10px rgba(${LAV},0.60)`,
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

      {/* ══ Goals list ══ */}
      {tabGoals.length === 0 ? (
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
          {tabGoals.map(goal => (
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

      {/* ══ Drafts / Ideas section ══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[8px] uppercase tracking-[0.30em] font-bold"
              style={{ color: "rgba(255,255,255,0.16)" }}>
              ИДЕИ И ЧЕРНОВИКИ
            </p>
            <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.10)" }}>
              Без срока — мечты на будущее
            </p>
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.16)" }}>{draftGoals.length}</span>
        </div>

        {draftGoals.length === 0 ? (
          <div
            className="rounded-[1.5rem] px-5 py-4 text-center"
            style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.13)" }}>
              Добавь идею — цель без срока, которая ждёт своего времени
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
          }}
          onSave={fields => {
            addTask({ ...fields, done: false } as Parameters<typeof addTask>[0]);
            setTaskModalItem(null);
          }}
          onClose={() => setTaskModalItem(null)}
        />
      )}
    </div>
  );
}
