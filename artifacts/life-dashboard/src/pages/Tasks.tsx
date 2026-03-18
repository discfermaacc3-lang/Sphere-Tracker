import { useState } from "react";
import { useStore, Task, RoutineTemplate } from "@/lib/store";
import { sphereColors, sphereKeys } from "@/lib/sphereColors";
import { TaskModal } from "@/components/TaskModal";
import { CustomDatePicker } from "@/components/CustomDatePicker";

const XP_COLORS: Record<string, string> = {
  easy: "#22c55e", medium: "#eab308", hard: "#ef4444", custom: "#a855f7",
};

const TODAY = new Date().toISOString().slice(0, 10);

function TaskCard({
  task,
  goalTitle,
  onToggle,
  onEdit,
  onDelete,
  onReschedule,
}: {
  task: Task;
  goalTitle?: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReschedule: (date: string) => void;
}) {
  const isMission = task.category === "Mission";
  const s = isMission ? null : sphereColors[task.sphere];
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(task.dueDate ?? "");

  const borderColor = task.done
    ? "rgba(255,255,255,0.05)"
    : task.priority
    ? "rgba(239,68,68,0.45)"
    : isMission
    ? "rgba(251,191,36,0.35)"
    : (s!.color + "25");

  const bgColor = task.done
    ? "rgba(255,255,255,0.015)"
    : task.priority
    ? "rgba(239,68,68,0.06)"
    : isMission
    ? "rgba(251,191,36,0.06)"
    : `${s!.color}07`;

  const glowStyle = task.priority && !task.done
    ? { boxShadow: "0 0 0 1px rgba(239,68,68,0.20), 0 0 16px rgba(239,68,68,0.12)" }
    : isMission && !task.done
    ? { boxShadow: "0 0 0 1px rgba(251,191,36,0.15), 0 0 16px rgba(251,191,36,0.10)" }
    : {};

  return (
    <div
      className="group rounded-2xl border px-4 py-4 flex flex-col gap-2.5 transition-all relative overflow-hidden"
      style={{ borderColor, background: bgColor, opacity: task.done ? 0.65 : 1, ...glowStyle }}
    >
      {/* Priority left bar */}
      {task.priority && !task.done && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: "linear-gradient(180deg,#ef4444,#f97316)", boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
        />
      )}
      {/* Mission left bar */}
      {isMission && !task.done && !task.priority && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: "linear-gradient(180deg,#fbbf24,#f59e0b)", boxShadow: "0 0 8px rgba(251,191,36,0.6)" }}
        />
      )}

      {/* Main row */}
      <div className="flex items-start gap-3 pl-1">
        <button
          onClick={onToggle}
          className="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            borderColor: task.done
              ? (s?.color ?? "#fbbf24")
              : isMission
              ? "rgba(251,191,36,0.5)"
              : "rgba(255,255,255,0.18)",
            background: task.done
              ? (s?.color ?? "#fbbf24") + "30"
              : "transparent",
          }}
        >
          {task.done && (
            <span className="text-xs" style={{ color: s?.color ?? "#fbbf24" }}>✓</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isMission && (
              <span
                className="text-base flex-shrink-0"
                style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.8))" }}
              >💎</span>
            )}
            <span className={`text-sm font-medium ${task.done ? "line-through text-white/30" : "text-white/75"}`}>
              {task.text}
            </span>
            {task.priority && !task.done && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold"
                style={{
                  background: "rgba(239,68,68,0.18)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.35)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                !! №1
              </span>
            )}
            {isMission && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.30)" }}
              >
                💎 Миссия
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {!isMission && s && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.color + "18" }}>
                {s.icon} {s.label}
              </span>
            )}
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ color: XP_COLORS[task.xpDifficulty], background: XP_COLORS[task.xpDifficulty] + "18" }}
            >
              +{task.xp} XP
            </span>
            {!task.noDeadline && task.dueDate && task.dueDate !== TODAY && (
              <span className="text-[10px] text-white/25">
                📅 {task.dueDate}
                {task.timeFrom && ` · ${task.timeFrom}`}
                {task.timeTo && `–${task.timeTo}`}
              </span>
            )}
            {task.timeFrom && task.dueDate === TODAY && (
              <span className="text-[10px] text-white/25">
                🕐 {task.timeFrom}{task.timeTo && `–${task.timeTo}`}
              </span>
            )}
            {goalTitle && (
              <span className="text-[10px] text-white/25">🎯 {goalTitle}</span>
            )}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => setShowReschedule(!showReschedule)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all" title="Перенести">📅</button>
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">✎</button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all">✕</button>
        </div>
      </div>

      {showReschedule && (
        <div className="pl-8">
          <CustomDatePicker value={newDate} onChange={setNewDate} accentColor="#6366f1" placeholder="Выбрать новую дату" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { if (newDate) { onReschedule(newDate); setShowReschedule(false); } }} className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}>Перенести</button>
            <button onClick={() => setShowReschedule(false)} className="px-3 py-1.5 rounded-xl text-xs text-white/30 hover:text-white/60 border border-white/10">Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  tmpl,
  onEdit,
  onDelete,
}: {
  tmpl: RoutineTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = sphereColors[tmpl.sphere];
  return (
    <div
      className="group rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all"
      style={{ borderColor: s.color + "20", background: `${s.color}06` }}
    >
      <span className="text-xl flex-shrink-0" style={{ filter: `drop-shadow(0 0 6px ${s.color}60)` }}>
        {s.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/70">{tmpl.text}</p>
        {tmpl.description && <p className="text-xs text-white/30">{tmpl.description}</p>}
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ color: XP_COLORS[tmpl.xpDifficulty], background: XP_COLORS[tmpl.xpDifficulty] + "18" }}
        >
          +{tmpl.xp} XP
        </span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >✎</button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >✕</button>
      </div>
    </div>
  );
}

export function Tasks() {
  const {
    tasks, toggleTask, addTask, editTask, deleteTask, rescheduleTask,
    routineTemplates, addRoutineTemplate, editRoutineTemplate, deleteRoutineTemplate, refreshDay,
    recurringTaskTemplates, addRecurringTaskTemplate,
    totalXP, dayXP, goals,
  } = useStore();

  const goalTitleById = (id?: string) => {
    if (!id) return undefined;
    return goals.find((g) => g.id === id)?.title;
  };

  const [tab, setTab] = useState<"tasks" | "upcoming" | "templates">("tasks");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RoutineTemplate | null>(null);
  const [filterSphere, setFilterSphere] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Today's tasks = dueDate === TODAY, or noDeadline
  const todayTasks = tasks.filter((t) => {
    if (t.noDeadline) return true;
    return t.dueDate === TODAY;
  });

  // Upcoming tasks = future date (not today or no deadline)
  const upcomingTasks = tasks.filter((t) => {
    if (t.noDeadline) return false;
    return t.dueDate && t.dueDate > TODAY;
  }).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  // Apply filters to today's tasks
  const filtered = todayTasks.filter((t) => {
    if (filterSphere !== "all" && t.sphere !== filterSphere) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

  const routine = filtered.filter((t) => t.type === "routine");
  const special = filtered
    .filter((t) => t.type === "special")
    .sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return 0;
    });

  const doneTodayCount = todayTasks.filter((t) => t.done).length;
  const totalTodayCount = todayTasks.length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1
            className="text-xl font-light tracking-[0.15em] uppercase"
            style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
          >
            Задачи
          </h1>
          <p className="text-[10px] text-white/25 mt-0.5 tracking-widest uppercase font-light">
            {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: "#6366f115", color: "#818cf8", border: "1px solid #6366f125" }}>
              ✦ {totalXP} XP
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: "#a855f715", color: "#c084fc", border: "1px solid #a855f725" }}>
              ⚡ {dayXP} сегодня
            </span>
          </div>
          <button
            onClick={() => { setEditingTask(null); setShowModal(true); setTab("tasks"); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            + Задача
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
        {([
          ["tasks", "Сегодня", doneTodayCount + "/" + totalTodayCount],
          ["upcoming", "Предстоящие", upcomingTasks.length > 0 ? String(upcomingTasks.length) : ""],
          ["templates", "Шаблоны рутины", ""],
        ] as const).map(([key, label, badge]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            style={{
              background: tab === key ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === key ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
            }}
          >
            {label}
            {badge && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                  color: tab === key ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TODAY ─── */}
      {tab === "tasks" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "routine", "special"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="text-xs px-3 py-1 rounded-full transition-all"
                  style={{
                    background: filterType === t ? "#6366f120" : "rgba(255,255,255,0.04)",
                    color: filterType === t ? "#818cf8" : "rgba(255,255,255,0.3)",
                    border: `1px solid ${filterType === t ? "#6366f140" : "transparent"}`,
                  }}
                >
                  {t === "all" ? "Все" : t === "routine" ? "Рутина" : "Специальные"}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterSphere("all")}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: filterSphere === "all" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  color: filterSphere === "all" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                  border: `1px solid ${filterSphere === "all" ? "rgba(255,255,255,0.15)" : "transparent"}`,
                }}
              >
                Все сферы
              </button>
              {sphereKeys.map((k) => {
                const s = sphereColors[k];
                const active = filterSphere === k;
                return (
                  <button
                    key={k}
                    onClick={() => setFilterSphere(k)}
                    className="text-[10px] px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: active ? s.color + "25" : "rgba(255,255,255,0.03)",
                      color: active ? s.color : "rgba(255,255,255,0.25)",
                      border: `1px solid ${active ? s.color + "50" : "transparent"}`,
                    }}
                  >
                    {s.icon} {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="rounded-2xl border border-white/5 px-5 py-3 flex items-center gap-4"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${totalTodayCount ? (doneTodayCount / totalTodayCount) * 100 : 0}%`,
                  background: "linear-gradient(90deg,#6366f1,#a855f7)",
                  boxShadow: "0 0 10px #6366f160",
                }}
              />
            </div>
            <span className="text-xs text-white/40 flex-shrink-0">
              {doneTodayCount}/{totalTodayCount} выполнено сегодня
            </span>
          </div>

          {/* Routine group */}
          {(filterType === "all" || filterType === "routine") && (
            <section>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">Рутина</p>
              <div className="flex flex-col gap-2">
                {routine.length === 0 && (
                  <div
                    className="rounded-2xl border border-white/5 p-5 text-center"
                    style={{ background: "rgba(255,255,255,0.01)" }}
                  >
                    <p className="text-white/20 text-sm">Нет рутины на сегодня</p>
                    <p className="text-white/10 text-xs mt-1">Нажми «Обновить день» на вкладке Шаблоны</p>
                  </div>
                )}
                {routine.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    goalTitle={goalTitleById(task.goalId)}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => { setEditingTask(task); setShowModal(true); }}
                    onDelete={() => deleteTask(task.id)}
                    onReschedule={(d) => rescheduleTask(task.id, d)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Special group */}
          {(filterType === "all" || filterType === "special") && (
            <section>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">
                План на день
              </p>
              <div className="flex flex-col gap-2">
                {special.length === 0 && (
                  <div
                    className="rounded-2xl border border-dashed border-white/8 p-8 text-center"
                    style={{ background: "rgba(255,255,255,0.01)" }}
                  >
                    <p className="text-white/20 text-sm">Чистый лист ✨</p>
                    <p className="text-white/10 text-xs mt-1">Добавь задачи на сегодня через кнопку «+ Задача»</p>
                  </div>
                )}
                {special.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    goalTitle={goalTitleById(task.goalId)}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => { setEditingTask(task); setShowModal(true); }}
                    onDelete={() => deleteTask(task.id)}
                    onReschedule={(d) => rescheduleTask(task.id, d)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ─── UPCOMING ─── */}
      {tab === "upcoming" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-white/60">Предстоящие задачи</p>
            <span className="text-xs text-white/25">{upcomingTasks.length} задач</span>
          </div>
          {upcomingTasks.length === 0 ? (
            <div
              className="rounded-2xl border border-white/5 p-8 text-center"
              style={{ background: "rgba(255,255,255,0.015)" }}
            >
              <p className="text-3xl mb-3">📅</p>
              <p className="text-white/30 text-sm">Нет предстоящих задач</p>
              <p className="text-white/15 text-xs mt-1">Задачи с будущей датой появятся здесь</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  goalTitle={goalTitleById(task.goalId)}
                  onToggle={() => toggleTask(task.id)}
                  onEdit={() => { setEditingTask(task); setShowModal(true); }}
                  onDelete={() => deleteTask(task.id)}
                  onReschedule={(d) => rescheduleTask(task.id, d)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── TEMPLATES ─── */}
      {tab === "templates" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white/70">Шаблоны рутины</p>
              <p className="text-xs text-white/25 mt-0.5">
                Каждое утро или по кнопке — автоматически копируются в Сегодня
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshDay}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-all"
              >
                ↻ Обновить день
              </button>
              <button
                onClick={() => { setEditingTemplate(null); setShowModal(true); }}
                className="px-4 py-2 rounded-xl text-xs font-medium"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
              >
                + Шаблон
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {routineTemplates.length === 0 && (
              <div
                className="rounded-2xl border border-white/5 p-6 text-center"
                style={{ background: "rgba(255,255,255,0.015)" }}
              >
                <p className="text-white/25 text-sm">Нет шаблонов рутины</p>
                <p className="text-white/15 text-xs mt-1">Создай шаблон — он будет появляться каждый день</p>
              </div>
            )}
            {routineTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                tmpl={tmpl}
                onEdit={() => { setEditingTemplate(tmpl); setShowModal(true); }}
                onDelete={() => deleteRoutineTemplate(tmpl.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {showModal && tab !== "templates" && (
        <TaskModal
          mode="task"
          initial={editingTask ?? undefined}
          onSave={(fields) => {
            if (editingTask) {
              editTask(editingTask.id, fields);
            } else if (fields.recurringDays && fields.recurringDays.length > 0) {
              addRecurringTaskTemplate({
                text: fields.text,
                description: fields.description,
                category: fields.category,
                sphere: fields.sphere,
                xp: fields.xp,
                xpDifficulty: fields.xpDifficulty,
                days: fields.recurringDays,
              });
              refreshDay();
            } else {
              addTask({ ...fields, done: false });
            }
          }}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
      {showModal && tab === "templates" && (
        <TaskModal
          mode="template"
          initial={editingTemplate ?? undefined}
          onSave={(fields) => {
            if (editingTemplate) {
              editRoutineTemplate(editingTemplate.id, fields);
            } else {
              addRoutineTemplate(fields);
            }
          }}
          onClose={() => { setShowModal(false); setEditingTemplate(null); }}
        />
      )}
    </div>
  );
}
