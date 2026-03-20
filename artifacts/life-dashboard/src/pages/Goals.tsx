import { useState, useRef } from "react";
import {
  useStore, Goal, GoalLevel, GOAL_XP, computeGoalEarnedXP,
} from "@/lib/store";
import { sphereColors } from "@/lib/sphereColors";
import { GoalModal } from "@/components/GoalModal";

const LAV = "167,139,250";

const LEVEL_META: Record<GoalLevel, { label: string; emoji: string; color: string; rgb: string }> = {
  year:  { label: "ГОД",    emoji: "✨", color: "#fde047", rgb: "253,224,71"  },
  month: { label: "МЕСЯЦ",  emoji: "🌙", color: "#a78bfa", rgb: "167,139,250" },
  week:  { label: "НЕДЕЛЯ", emoji: "⭐", color: "#86efac", rgb: "134,239,172" },
};
const LEVELS: GoalLevel[] = ["year", "month", "week"];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const NOW = new Date();
const CUR_MONTH = NOW.getMonth();
const CUR_YEAR = NOW.getFullYear();
const TODAY = NOW.toISOString().slice(0, 10);

function isOverdue(goal: Goal): boolean {
  if (goal.done) return false;
  if (goal.level === "month" && goal.year !== undefined && goal.month !== undefined) {
    if (goal.year < CUR_YEAR) return true;
    if (goal.year === CUR_YEAR && goal.month < CUR_MONTH) return true;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════
   GoalCard
   ═══════════════════════════════════════════════════════════ */
function GoalCard({ goal, goals, tasks, onToggle, onEdit, onDelete }: {
  goal: Goal;
  goals: Goal[];
  tasks: ReturnType<typeof useStore>["tasks"];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    addGoalChecklistItem, toggleGoalChecklistItem, deleteGoalChecklistItem, addTask,
  } = useStore();

  const s = sphereColors[goal.sphere];
  const rgb = hexToRgb(s.color);
  const meta = LEVEL_META[goal.level];
  const overdue = isOverdue(goal);

  const earnedXP = computeGoalEarnedXP(goal, goals, tasks);
  const items = goal.checklistItems ?? [];
  const doneItems = items.filter(ci => ci.done).length;
  const checklistPct = items.length > 0 ? Math.round((doneItems / items.length) * 100) : 0;
  const xpPct = Math.min(100, Math.round((earnedXP / goal.targetXP) * 100));
  const pct = items.length > 0 ? checklistPct : xpPct;

  const [expanded, setExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const borderColor = overdue ? "rgba(239,68,68,0.35)" : goal.done ? "rgba(255,255,255,0.07)" : `rgba(${rgb},0.22)`;
  const bgColor    = overdue ? "rgba(239,68,68,0.04)"  : goal.done ? "rgba(255,255,255,0.015)" : `rgba(${rgb},0.05)`;

  function handleAddItem() {
    const t = newItemText.trim();
    if (!t) return;
    addGoalChecklistItem(goal.id, t);
    setNewItemText("");
    inputRef.current?.focus();
  }

  function handleAddToDay(text: string) {
    addTask({
      text,
      description: `Из цели: ${goal.title}`,
      category: goal.category,
      sphere: goal.sphere,
      type: "mission",
      priority: false,
      xp: 10,
      xpDifficulty: "easy",
      noDeadline: false,
      dueDate: TODAY,
      done: false,
      goalId: goal.id,
    });
  }

  return (
    <div
      className="rounded-[1.75rem] border transition-all duration-300 overflow-hidden"
      style={{
        borderColor,
        background: bgColor,
        backdropFilter: "blur(22px)",
        boxShadow: goal.done ? "none" : `0 0 40px rgba(${rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
        opacity: goal.done ? 0.72 : 1,
      }}
    >
      {/* ── Card header ── */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">

          {/* Done checkbox */}
          <button
            onClick={onToggle}
            className="mt-1 w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              borderColor: goal.done ? "#22c55e" : overdue ? "#ef4444" : `rgba(${rgb},0.35)`,
              background:  goal.done ? "#22c55e30" : "transparent",
            }}
          >
            {goal.done && <span className="text-[9px] text-green-400">✓</span>}
          </button>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Sphere + level breadcrumb */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wide"
                style={{ color: s.color, background: `rgba(${rgb},0.13)`, border: `1px solid rgba(${rgb},0.22)` }}
              >
                {s.icon} {s.label}
              </span>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full"
                style={{ color: meta.color, background: `rgba(${hexToRgb(meta.color)},0.10)`, border: `1px solid rgba(${hexToRgb(meta.color)},0.18)` }}
              >
                {meta.emoji} {meta.label}
              </span>
              {overdue && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Просрочена</span>
              )}
              {goal.done && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Достигнута ✓</span>
              )}
              {goal.isIdea && (
                <span className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: "rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.05)" }}>
                  💡 Идея
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className={`text-sm font-medium leading-snug ${goal.done ? "line-through text-white/30" : "text-white/85"}`}
              style={{ letterSpacing: "0.02em" }}
            >
              {goal.title}
            </h3>

            {/* Description */}
            {goal.description && (
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.30)" }}>
                {goal.description}
              </p>
            )}

            {/* Success criteria */}
            {goal.successCriteria && (
              <div className="flex items-start gap-1.5 mt-2">
                <span className="text-[9px] flex-shrink-0 mt-0.5" style={{ color: `rgba(${LAV},0.45)` }}>✦</span>
                <p className="text-[11px] italic leading-relaxed" style={{ color: `rgba(${LAV},0.55)` }}>
                  {goal.successCriteria}
                </p>
              </div>
            )}

            {/* Deadline */}
            {goal.month !== undefined && !goal.done && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px]" style={{ color: overdue ? "#ef4444" : "rgba(255,255,255,0.22)" }}>
                  📅 {new Date(goal.year ?? CUR_YEAR, goal.month).toLocaleString("ru-RU", { month: "long", year: "numeric" })}
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                  {items.length > 0
                    ? `${doneItems} / ${items.length} шагов`
                    : goal.done ? "Выполнено" : `${earnedXP} / ${goal.targetXP} XP`}
                </span>
                <span className="text-[9px] font-semibold"
                  style={{ color: goal.done ? "#22c55e" : overdue ? "#ef4444" : s.color }}>
                  {pct}%
                </span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: goal.done
                      ? "linear-gradient(90deg,#16a34a,#22c55e)"
                      : overdue
                      ? "linear-gradient(90deg,#dc2626,#ef4444)"
                      : `linear-gradient(90deg,rgba(${rgb},0.5),${s.color})`,
                    boxShadow: `0 0 8px rgba(${rgb},0.45)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1 flex-shrink-0 items-end">
            <div className="flex gap-1">
              <button
                onClick={() => setExpanded(e => !e)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all"
                style={{
                  background: expanded ? `rgba(${rgb},0.15)` : "rgba(255,255,255,0.04)",
                  color: expanded ? s.color : "rgba(255,255,255,0.25)",
                  border: `1px solid rgba(${rgb},${expanded ? "0.30" : "0.10"})`,
                  transform: expanded ? "rotate(180deg)" : "none",
                  transition: "all 0.25s",
                }}
                title={expanded ? "Свернуть" : "Развернуть план"}
              >
                ▾
              </button>
              <button
                onClick={onEdit}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
              >✎</button>
              <button
                onClick={onDelete}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/25 hover:text-red-400 hover:bg-red-500/5 transition-all"
              >✕</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded checklist ── */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-3 flex flex-col gap-2"
          style={{ borderTop: `1px solid rgba(${rgb},0.10)` }}
        >
          <p className="text-[8px] uppercase tracking-[0.22em] mb-1"
            style={{ color: `rgba(${rgb},0.40)` }}>
            ПЛАН · ШАГ ЗА ШАГОМ
          </p>

          {/* Checklist items */}
          {items.length === 0 && (
            <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.18)" }}>
              Добавь конкретные шаги для достижения цели
            </p>
          )}

          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group relative transition-all"
              style={{
                background: item.done ? `rgba(${rgb},0.06)` : "rgba(255,255,255,0.03)",
                border: `1px solid rgba(${rgb},${item.done ? "0.14" : "0.08"})`,
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleGoalChecklistItem(goal.id, item.id)}
                className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: item.done ? s.color : "rgba(255,255,255,0.20)",
                  background: item.done ? `rgba(${rgb},0.20)` : "transparent",
                }}
              >
                {item.done && <span style={{ color: s.color, fontSize: 8 }}>✓</span>}
              </button>

              {/* Text */}
              <span
                className="flex-1 text-xs leading-relaxed"
                style={{
                  color: item.done ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.62)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.text}
              </span>

              {/* Hover actions */}
              {hoveredItem === item.id && !item.done && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleAddToDay(item.text)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
                    style={{
                      background: `rgba(${LAV},0.16)`,
                      color: "#a78bfa",
                      border: `1px solid rgba(${LAV},0.28)`,
                      boxShadow: `0 0 10px rgba(${LAV},0.12)`,
                      whiteSpace: "nowrap",
                    }}
                    title="Сделать задачей дня"
                  >
                    + в задачи дня
                  </button>
                  <button
                    onClick={() => deleteGoalChecklistItem(goal.id, item.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] transition-all"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                  >✕</button>
                </div>
              )}
            </div>
          ))}

          {/* Add item input */}
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
                border: `1px solid rgba(${rgb},0.15)`,
                background: "rgba(255,255,255,0.025)",
              }}
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="px-3 py-2 rounded-xl text-[10px] font-medium transition-all disabled:opacity-30"
              style={{
                background: `rgba(${rgb},0.15)`,
                color: s.color,
                border: `1px solid rgba(${rgb},0.25)`,
              }}
            >
              + Добавить
            </button>
          </div>

          {/* Linked tasks from store */}
          {tasks.filter(t => t.goalId === goal.id).length > 0 && (
            <>
              <p className="text-[8px] uppercase tracking-[0.22em] mt-2 mb-1"
                style={{ color: "rgba(255,255,255,0.15)" }}>
                СВЯЗАННЫЕ ЗАДАЧИ
              </p>
              {tasks.filter(t => t.goalId === goal.id).map(t => (
                <div key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[9px]" style={{ color: t.done ? "#22c55e" : "rgba(255,255,255,0.2)" }}>
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
}

/* ═══════════════════════════════════════════════════════════
   Goals page
   ═══════════════════════════════════════════════════════════ */
export function Goals() {
  const { goals, addGoal, editGoal, deleteGoal, toggleGoal, tasks } = useStore();
  const [activeLevel, setActiveLevel] = useState<GoalLevel>("month");
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addAsIdea, setAddAsIdea] = useState(false);

  const meta = LEVEL_META[activeLevel];

  // Filter by active level
  let levelGoals = goals.filter(g => g.level === activeLevel);

  // Split into Active vs Ideas
  const activeGoals = levelGoals.filter(g => !g.isIdea);
  const ideaGoals   = levelGoals.filter(g => !!g.isIdea);

  const parentGoals =
    activeLevel === "month" ? goals.filter(g => g.level === "year")  :
    activeLevel === "week"  ? goals.filter(g => g.level === "month") : [];

  const doneActive = activeGoals.filter(g => g.done).length;
  const totalEarnedXP = activeGoals.reduce((s, g) => s + computeGoalEarnedXP(g, goals, tasks), 0);

  function openAdd(asIdea = false) {
    setEditingGoal(null);
    setAddAsIdea(asIdea);
    setShowModal(true);
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
            onClick={() => openAdd(true)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            + Идея
          </button>
          <button
            onClick={() => openAdd(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: `rgba(${hexToRgb(meta.color)},0.18)`,
              color: meta.color,
              border: `1px solid rgba(${hexToRgb(meta.color)},0.30)`,
              boxShadow: `0 0 18px rgba(${hexToRgb(meta.color)},0.15)`,
              textShadow: `0 0 10px ${meta.color}`,
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
          const cnt = goals.filter(g => g.level === lvl).length;
          return (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.9rem] transition-all duration-250"
              style={{
                background: active ? `rgba(${rgb},0.16)` : "transparent",
                border: active ? `1px solid rgba(${rgb},0.28)` : "1px solid transparent",
                boxShadow: active ? `0 0 20px rgba(${rgb},0.15)` : "none",
              }}
            >
              <span className="text-base leading-none">{m.emoji}</span>
              <div className="text-left">
                <p className="text-xs font-medium tracking-[0.12em]"
                  style={{ color: active ? m.color : "rgba(255,255,255,0.28)", textShadow: active ? `0 0 10px ${m.color}` : "none" }}>
                  {m.label}
                </p>
                {cnt > 0 && (
                  <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.18)" }}>{cnt} целей</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Summary strip ── */}
      {activeGoals.length > 0 && (
        <div
          className="rounded-2xl px-5 py-3 flex items-center gap-4"
          style={{
            background: `rgba(${hexToRgb(meta.color)},0.06)`,
            border: `1px solid rgba(${hexToRgb(meta.color)},0.16)`,
          }}
        >
          <div className="flex-1 flex items-center gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.22)" }}>Активных целей</p>
              <p className="text-lg font-light tabular-nums" style={{ color: meta.color }}>
                {doneActive}<span className="text-xs text-white/25">/{activeGoals.length}</span>
              </p>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }}/>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.22)" }}>Накоплено XP</p>
              <p className="text-lg font-light tabular-nums" style={{ color: meta.color }}>{totalEarnedXP}</p>
            </div>
            {activeGoals.length > 0 && (
              <>
                <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }}/>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.22)" }}>Прогресс</p>
                  <p className="text-lg font-light tabular-nums" style={{ color: meta.color }}>
                    {Math.round((doneActive / activeGoals.length) * 100)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          ACTIVE GOALS
          ════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] uppercase tracking-[0.28em] font-medium"
            style={{ color: "rgba(255,255,255,0.22)" }}>
            Активные · {activeGoals.length}
          </p>
        </div>

        {activeGoals.length === 0 ? (
          <div
            className="rounded-[1.75rem] p-8 text-center"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-3xl mb-3">{meta.emoji}</p>
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.25)" }}>
              Нет активных целей на {meta.label.toLowerCase()}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.12)" }}>
              Нажми «+ Цель» чтобы добавить
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                goals={goals}
                tasks={tasks}
                onToggle={() => toggleGoal(goal.id)}
                onEdit={() => { setEditingGoal(goal); setAddAsIdea(!!goal.isIdea); setShowModal(true); }}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════
          IDEAS / NOTES
          ════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] uppercase tracking-[0.28em] font-medium"
            style={{ color: "rgba(255,255,255,0.15)" }}>
            Идеи и заметки · {ideaGoals.length}
          </p>
          <button
            onClick={() => openAdd(true)}
            className="text-[9px] transition-all"
            style={{ color: "rgba(255,255,255,0.20)" }}
          >
            + добавить идею
          </button>
        </div>

        {ideaGoals.length === 0 ? (
          <div
            className="rounded-[1.5rem] px-5 py-4 text-center"
            style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              Идеи и мечты, которые ещё не в приоритете
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {ideaGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                goals={goals}
                tasks={tasks}
                onToggle={() => toggleGoal(goal.id)}
                onEdit={() => { setEditingGoal(goal); setAddAsIdea(true); setShowModal(true); }}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <GoalModal
          level={activeLevel}
          parentGoals={parentGoals}
          initial={editingGoal ?? (addAsIdea ? { isIdea: true } : undefined)}
          onSave={(fields) => {
            if (editingGoal) editGoal(editingGoal.id, { ...fields, isIdea: addAsIdea });
            else addGoal({ ...fields, isIdea: addAsIdea });
          }}
          onClose={() => { setShowModal(false); setEditingGoal(null); setAddAsIdea(false); }}
        />
      )}
    </div>
  );
}
