import { useState } from "react";
import { useStore, Goal, GoalLevel, GOAL_XP, computeGoalEarnedXP } from "@/lib/store";
import { sphereColors } from "@/lib/sphereColors";
import { GoalModal } from "@/components/GoalModal";

const LEVEL_META: Record<GoalLevel, { label: string; emoji: string; color: string; desc: string }> = {
  year:  { label: "Год",    emoji: "✨", color: "#fde047", desc: "Большие жизненные ориентиры" },
  month: { label: "Месяц",  emoji: "🌙", color: "#a78bfa", desc: "Конкретные результаты месяца" },
  week:  { label: "Неделя", emoji: "⭐", color: "#86efac", desc: "Фокус и шаги прямо сейчас" },
};

const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

const LEVELS: GoalLevel[] = ["year", "month", "week"];

const NOW = new Date();
const CUR_MONTH = NOW.getMonth();
const CUR_YEAR = NOW.getFullYear();

function isOverdue(goal: Goal): boolean {
  if (goal.done) return false;
  if (goal.level === "month" && goal.year !== undefined && goal.month !== undefined) {
    if (goal.year < CUR_YEAR) return true;
    if (goal.year === CUR_YEAR && goal.month < CUR_MONTH) return true;
  }
  return false;
}

function GoalCard({
  goal,
  goals,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: {
  goal: Goal;
  goals: Goal[];
  tasks: ReturnType<typeof useStore>["tasks"];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  const s = sphereColors[goal.sphere];
  const meta = LEVEL_META[goal.level];
  const overdue = isOverdue(goal);

  const earnedXP = computeGoalEarnedXP(goal, goals, tasks);
  const pct = Math.min(100, Math.round((earnedXP / goal.targetXP) * 100));

  const parent = goal.parentId ? goals.find((g) => g.id === goal.parentId) : null;
  const linkedTasks = tasks.filter((t) => t.goalId === goal.id);
  const childGoals = goals.filter((g) => g.parentId === goal.id);

  const [expanded, setExpanded] = useState(false);

  // Border color: overdue → red, done → faded, normal → sphere color
  const borderColor = overdue
    ? "rgba(239,68,68,0.40)"
    : goal.done
    ? "rgba(255,255,255,0.07)"
    : s.color + "30";

  const bgColor = overdue
    ? "rgba(239,68,68,0.05)"
    : goal.done
    ? "rgba(255,255,255,0.015)"
    : `${s.color}08`;

  const barColor = goal.done
    ? "#22c55e"
    : overdue
    ? "#ef4444"
    : s.color;

  return (
    <div
      className="rounded-[1.5rem] border transition-all duration-300"
      style={{
        borderColor,
        background: bgColor,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: goal.done ? "none" : `0 0 30px rgba(${s.color.slice(1).match(/../g)!.map(h=>parseInt(h,16)).join(",")},0.04)`,
        opacity: goal.done ? 0.7 : 1,
      }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          {/* Manual toggle checkbox */}
          <button
            onClick={onToggle}
            className="mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              borderColor: goal.done ? "#22c55e" : overdue ? "#ef4444" : "rgba(255,255,255,0.18)",
              background: goal.done ? "#22c55e30" : "transparent",
            }}
            title={goal.done ? "Отменить выполнение" : "Отметить вручную"}
          >
            {goal.done && <span className="text-xs text-green-400">✓</span>}
          </button>

          <div className="flex-1 min-w-0">
            {/* Parent breadcrumb */}
            {parent && (
              <p className="text-[9px] text-white/25 mb-1 flex items-center gap-1">
                <span>{sphereColors[parent.sphere].icon}</span>
                <span className="truncate">{parent.title}</span>
                <span>›</span>
              </p>
            )}

            {/* Title row */}
            <div className="flex items-start gap-2 flex-wrap">
              <span
                className={`text-sm font-medium leading-snug ${
                  goal.done ? "line-through text-white/30" : "text-white/80"
                }`}
              >
                {goal.title}
              </span>
              {goal.done && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 flex-shrink-0">
                  Достигнута ✓
                </span>
              )}
              {overdue && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 flex-shrink-0">
                  Просрочена
                </span>
              )}
            </div>

            {/* Description */}
            {goal.description && (
              <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{goal.description}</p>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ color: s.color, background: s.color + "18" }}
              >
                {s.icon} {s.label}
              </span>
              {goal.month !== undefined && !goal.done && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ color: overdue ? "#ef4444" : "rgba(255,255,255,0.3)", background: overdue ? "#ef444415" : "rgba(255,255,255,0.05)" }}>
                  📅 {MONTH_NAMES[goal.month]} {goal.year}
                </span>
              )}
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ color: meta.color, background: meta.color + "18" }}
              >
                {meta.emoji} бонус {goal.xp} XP
              </span>
              {(childGoals.length > 0 || linkedTasks.length > 0) && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                >
                  {expanded
                    ? "▲ скрыть"
                    : linkedTasks.length > 0
                    ? `▼ ${linkedTasks.length} задач`
                    : `▼ ${childGoals.length} подцелей`}
                </button>
              )}
            </div>

            {/* XP Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-white/25">
                  {goal.done
                    ? "Выполнено"
                    : `В процессе · ${earnedXP} / ${goal.targetXP} XP`}
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: goal.done ? "#22c55e" : overdue ? "#ef4444" : s.color }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: goal.done
                      ? "linear-gradient(90deg,#16a34a,#22c55e)"
                      : overdue
                      ? "linear-gradient(90deg,#dc2626,#ef4444)"
                      : `linear-gradient(90deg, ${barColor}70, ${barColor})`,
                    boxShadow: `0 0 8px ${barColor}50`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 flex-shrink-0">
            {onAddChild && (
              <button
                onClick={onAddChild}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
                title="Добавить подцель"
              >
                +
              </button>
            )}
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
            >
              ✎
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/25 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Expanded child list */}
      {expanded && (linkedTasks.length > 0 || childGoals.length > 0) && (
        <div className="px-5 pb-4 border-t border-white/5 pt-3 flex flex-col gap-2">
          {linkedTasks.map((t) => {
            const ts = sphereColors[t.sphere];
            return (
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: t.done ? ts.color : "rgba(255,255,255,0.15)",
                    background: t.done ? ts.color + "25" : "transparent",
                  }}
                >
                  {t.done && <span style={{ color: ts.color, fontSize: 9 }}>✓</span>}
                </div>
                <span className={`flex-1 ${t.done ? "line-through text-white/25" : "text-white/55"}`}>
                  {t.text}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: ts.color }}>
                  +{t.xp} XP
                </span>
              </div>
            );
          })}
          {childGoals.map((child) => {
            const cs = sphereColors[child.sphere];
            const childEarned = computeGoalEarnedXP(child, goals, tasks);
            const childPct = Math.min(100, Math.round((childEarned / child.targetXP) * 100));
            return (
              <div key={child.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: child.done ? cs.color : "rgba(255,255,255,0.15)",
                    background: child.done ? cs.color + "25" : "transparent",
                  }}
                >
                  {child.done && <span style={{ color: cs.color, fontSize: 9 }}>✓</span>}
                </div>
                <span
                  className={`text-xs flex-1 truncate ${
                    child.done ? "line-through text-white/25" : "text-white/55"
                  }`}
                >
                  {child.title}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: cs.color }}>
                  {childEarned}/{child.targetXP} XP · {childPct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Goals() {
  const { goals, addGoal, editGoal, deleteGoal, toggleGoal, tasks } = useStore();
  const [activeLevel, setActiveLevel] = useState<GoalLevel>("week");
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addChildFor, setAddChildFor] = useState<GoalLevel | null>(null);

  // Month filter for month-level goals
  const [filterMonth, setFilterMonth] = useState<number>(CUR_MONTH);
  const [filterYear, setFilterYear] = useState<number>(CUR_YEAR);

  const currentLevel = addChildFor ?? activeLevel;
  const meta = LEVEL_META[activeLevel];

  // Filter visible goals
  let visibleGoals = goals.filter((g) => g.level === activeLevel);
  if (activeLevel === "month") {
    visibleGoals = visibleGoals.filter(
      (g) => g.month === filterMonth && (g.year ?? CUR_YEAR) === filterYear
    );
  }

  const parentGoals =
    currentLevel === "month"
      ? goals.filter((g) => g.level === "year")
      : currentLevel === "week"
      ? goals.filter((g) => g.level === "month")
      : [];

  const doneCount = visibleGoals.filter((g) => g.done).length;
  const totalEarnedXP = visibleGoals.reduce(
    (sum, g) => sum + computeGoalEarnedXP(g, goals, tasks),
    0
  );

  // Available months (with goals)
  const monthsWithGoals = Array.from(
    new Set(
      goals
        .filter((g) => g.level === "month" && (g.year ?? CUR_YEAR) === filterYear)
        .map((g) => g.month ?? 0)
    )
  ).sort((a, b) => a - b);

  function openAdd() {
    setEditingGoal(null);
    setAddChildFor(null);
    setShowModal(true);
  }

  function openAddChild(_parentId: string, childLevel: GoalLevel) {
    setEditingGoal(null);
    setAddChildFor(childLevel);
    setShowModal(true);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-semibold text-white/80 tracking-wide">Цели</h1>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: `linear-gradient(135deg, ${meta.color}cc, ${meta.color})`, color: "white" }}
        >
          + Цель
        </button>
      </div>

      {/* Level tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
        {LEVELS.map((lvl) => {
          const m = LEVEL_META[lvl];
          const active = activeLevel === lvl;
          const count = goals.filter((g) => g.level === lvl).length;
          return (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all"
              style={{
                background: active ? `${m.color}18` : "transparent",
                border: active ? `1px solid ${m.color}30` : "1px solid transparent",
              }}
            >
              <span className="text-xl mb-0.5">{m.emoji}</span>
              <span className="text-xs font-medium" style={{ color: active ? m.color : "rgba(255,255,255,0.3)" }}>
                {m.label}
              </span>
              <span className="text-[9px] text-white/20">{count} целей</span>
            </button>
          );
        })}
      </div>

      {/* Month filter (only for month-level) */}
      {activeLevel === "month" && (
        <div className="flex flex-col gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterYear((y) => y - 1)}
              className="text-white/30 hover:text-white/70 px-2 py-1 transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-white/60">{filterYear}</span>
            <button
              onClick={() => setFilterYear((y) => y + 1)}
              className="text-white/30 hover:text-white/70 px-2 py-1 transition-colors"
            >
              ›
            </button>
            <div className="flex-1" />
            <span className="text-[10px] text-white/25">Выберите месяц:</span>
          </div>
          {/* Month tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {MONTH_NAMES.map((name, i) => {
              const hasGoals = monthsWithGoals.includes(i);
              const active = filterMonth === i;
              return (
                <button
                  key={i}
                  onClick={() => setFilterMonth(i)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: active
                      ? "#6366f122"
                      : hasGoals
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.02)",
                    color: active
                      ? "#818cf8"
                      : hasGoals
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(255,255,255,0.15)",
                    border: active
                      ? "1px solid #6366f140"
                      : i === CUR_MONTH && filterYear === CUR_YEAR
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid transparent",
                  }}
                >
                  {name.slice(0, 3)}
                  {hasGoals && !active && (
                    <span className="ml-1 inline-block w-1 h-1 rounded-full bg-indigo-400 align-middle" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div
        className="rounded-2xl border px-5 py-4 flex items-center gap-4"
        style={{ borderColor: meta.color + "25", background: `${meta.color}08` }}
      >
        <div className="text-3xl">{meta.emoji}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white/70">{meta.desc}</p>
          <p className="text-xs text-white/30 mt-0.5">
            {doneCount} из {visibleGoals.length} достигнуто
            {activeLevel === "month" && ` · ${MONTH_NAMES[filterMonth]} ${filterYear}`}
            {totalEarnedXP > 0 && ` · ${totalEarnedXP} XP накоплено`}
          </p>
        </div>
        {visibleGoals.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: meta.color }}>
              {Math.round((doneCount / visibleGoals.length) * 100)}%
            </p>
            <p className="text-[10px] text-white/25">выполнено</p>
          </div>
        )}
      </div>

      {/* Goals list */}
      <div className="flex flex-col gap-3">
        {visibleGoals.length === 0 && (
          <div
            className="rounded-2xl border border-white/5 p-8 text-center"
            style={{ background: "rgba(255,255,255,0.015)" }}
          >
            <p className="text-4xl mb-3">{meta.emoji}</p>
            <p className="text-white/30 text-sm">Нет целей на этот период</p>
            <p className="text-white/15 text-xs mt-1">Нажми «+ Цель» чтобы добавить</p>
          </div>
        )}
        {visibleGoals.map((goal) => {
          const childLevel: GoalLevel | null =
            goal.level === "year" ? "month" : goal.level === "month" ? "week" : null;
          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              goals={goals}
              tasks={tasks}
              onToggle={() => toggleGoal(goal.id)}
              onEdit={() => { setEditingGoal(goal); setAddChildFor(null); setShowModal(true); }}
              onDelete={() => deleteGoal(goal.id)}
              onAddChild={childLevel ? () => openAddChild(goal.id, childLevel) : undefined}
            />
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <GoalModal
          level={currentLevel}
          parentGoals={parentGoals}
          initial={editingGoal ?? undefined}
          onSave={(fields) => {
            if (editingGoal) {
              editGoal(editingGoal.id, fields);
            } else {
              addGoal(fields);
            }
          }}
          onClose={() => { setShowModal(false); setEditingGoal(null); setAddChildFor(null); }}
        />
      )}
    </div>
  );
}
