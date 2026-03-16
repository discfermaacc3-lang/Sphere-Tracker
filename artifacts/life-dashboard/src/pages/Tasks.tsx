import { useState } from "react";
import { useStore, Task, RoutineTemplate } from "@/lib/store";
import { sphereColors, sphereKeys } from "@/lib/sphereColors";
import { TaskModal } from "@/components/TaskModal";

const XP_COLORS: Record<string, string> = {
  easy: "#22c55e", medium: "#eab308", hard: "#ef4444", custom: "#a855f7",
};

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onReschedule,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReschedule: (date: string) => void;
}) {
  const s = sphereColors[task.sphere];
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(task.dueDate ?? "");

  return (
    <div
      className="group rounded-2xl border px-4 py-4 flex flex-col gap-2.5 transition-all"
      style={{
        borderColor: task.done ? "rgba(255,255,255,0.05)" : s.color + "25",
        background: task.done ? "rgba(255,255,255,0.015)" : `${s.color}07`,
        opacity: task.done ? 0.65 : 1,
      }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            borderColor: task.done ? s.color : "rgba(255,255,255,0.18)",
            background: task.done ? s.color + "30" : "transparent",
          }}
        >
          {task.done && <span className="text-xs" style={{ color: s.color }}>✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.done ? "line-through text-white/30" : "text-white/75"}`}>
              {task.text}
            </span>
            {task.priority && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 flex-shrink-0">
                ★ Приоритет
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.color + "18" }}>
              {s.icon} {s.label}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ color: XP_COLORS[task.xpDifficulty], background: XP_COLORS[task.xpDifficulty] + "18" }}
            >
              +{task.xp} XP
            </span>
            {!task.noDeadline && task.dueDate && (
              <span className="text-[10px] text-white/25">
                📅 {task.dueDate}
                {task.timeFrom && ` · ${task.timeFrom}`}
                {task.timeTo && `–${task.timeTo}`}
              </span>
            )}
            {task.goalRef && (
              <span className="text-[10px] text-white/25">🎯 {task.goalRef}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setShowReschedule(!showReschedule)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title="Перенести"
          >
            📅
          </button>
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title="Редактировать"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Reschedule picker */}
      {showReschedule && (
        <div className="flex gap-2 items-center pl-8">
          <input
            type="date"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/60 outline-none focus:border-indigo-500/40 transition-colors"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <button
            onClick={() => { onReschedule(newDate); setShowReschedule(false); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            Перенести
          </button>
          <button
            onClick={() => setShowReschedule(false)}
            className="text-xs text-white/25 hover:text-white/50"
          >
            Отмена
          </button>
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
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function Tasks() {
  const {
    tasks, toggleTask, addTask, editTask, deleteTask, rescheduleTask,
    routineTemplates, addRoutineTemplate, editRoutineTemplate, deleteRoutineTemplate, refreshDay,
    totalXP, dayXP,
  } = useStore();

  const [tab, setTab] = useState<"tasks" | "templates">("tasks");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RoutineTemplate | null>(null);
  const [filterSphere, setFilterSphere] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = tasks.filter((t) => {
    if (filterSphere !== "all" && t.sphere !== filterSphere) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

  const routine = filtered.filter((t) => t.type === "routine");
  const special = filtered.filter((t) => t.type === "special");

  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-semibold text-white/80 tracking-wide">Задачи</h1>
        <div className="flex items-center gap-3">
          {/* XP badges */}
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: "#6366f115", color: "#818cf8", border: "1px solid #6366f125" }}>
              ✦ {totalXP} XP всего
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: "#a855f715", color: "#c084fc", border: "1px solid #a855f725" }}>
              ⚡ {dayXP} XP сегодня
            </span>
          </div>
          <button
            onClick={() => { setEditingTask(null); setShowModal(true); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            + Задача
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
        {([["tasks", "Задачи"], ["templates", "Шаблоны рутины"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === key ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === key ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tasks" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterType("all")}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: filterType === "all" ? "#6366f120" : "rgba(255,255,255,0.04)",
                  color: filterType === "all" ? "#818cf8" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${filterType === "all" ? "#6366f140" : "transparent"}`,
                }}
              >
                Все
              </button>
              {(["routine", "special"] as const).map((t) => (
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
                  {t === "routine" ? "Рутина" : "Специальные"}
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

          {/* Stats bar */}
          <div className="rounded-2xl border border-white/5 px-5 py-3 flex items-center gap-4"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%`,
                  background: "linear-gradient(90deg,#6366f1,#a855f7)",
                  boxShadow: "0 0 10px #6366f160",
                }}
              />
            </div>
            <span className="text-xs text-white/40 flex-shrink-0">{doneTasks}/{tasks.length} выполнено</span>
          </div>

          {/* Routine group */}
          {(filterType === "all" || filterType === "routine") && (
            <section>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">Рутина</p>
              <div className="flex flex-col gap-2">
                {routine.length === 0 && (
                  <p className="text-white/20 text-sm py-3 text-center">Нет задач рутины</p>
                )}
                {routine.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
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
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">Специальные задачи</p>
              <div className="flex flex-col gap-2">
                {special.length === 0 && (
                  <p className="text-white/20 text-sm py-3 text-center">Нет специальных задач</p>
                )}
                {special.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
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

      {tab === "templates" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white/70">Шаблоны рутины</p>
              <p className="text-xs text-white/25 mt-0.5">
                Каждое утро или по кнопке — автоматически копируются в раздел рутины на сегодня
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
              <div className="rounded-2xl border border-white/5 p-6 text-center"
                style={{ background: "rgba(255,255,255,0.015)" }}>
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
      {showModal && tab === "tasks" && (
        <TaskModal
          mode="task"
          initial={editingTask ?? undefined}
          onSave={(fields) => {
            if (editingTask) {
              editTask(editingTask.id, fields);
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
