import { useState, useEffect } from "react";
import { Task, TaskCategory, XpDifficulty, RoutineTemplate } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

const CATEGORIES: TaskCategory[] = [
  "Body", "Mindset", "Creativity", "Hobby",
  "Work", "Finance", "Mission", "Other",
];

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  Body: "Тело", Mindset: "Мышление", Creativity: "Творчество",
  Hobby: "Хобби", Work: "Работа", Finance: "Финансы",
  Mission: "Миссия", Other: "Другое",
};

const XP_PRESETS: { label: string; value: number; diff: XpDifficulty }[] = [
  { label: "Лёгкая · 10 XP",  value: 10, diff: "easy"   },
  { label: "Средняя · 25 XP", value: 25, diff: "medium" },
  { label: "Сложная · 50 XP", value: 50, diff: "hard"   },
  { label: "Своё",             value: 0,  diff: "custom" },
];

type BaseFields = {
  text: string;
  description?: string;
  category: TaskCategory;
  sphere: SphereKey;
  xp: number;
  xpDifficulty: XpDifficulty;
};

type TaskFields = BaseFields & {
  type: "routine" | "special";
  priority: boolean;
  noDeadline: boolean;
  dueDate?: string;
  timeFrom?: string;
  timeTo?: string;
  goalRef?: string;
};

type TemplateFields = BaseFields;

type Props =
  | {
      mode: "task";
      initial?: Partial<TaskFields>;
      onSave: (fields: Omit<Task, "id" | "done">) => void;
      onClose: () => void;
    }
  | {
      mode: "template";
      initial?: Partial<TemplateFields>;
      onSave: (fields: Omit<RoutineTemplate, "id">) => void;
      onClose: () => void;
    };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">{label}</p>
      {children}
    </div>
  );
}

function inputCls(extra = "") {
  return `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors ${extra}`;
}

export function TaskModal(props: Props) {
  const { onClose } = props;

  const [text, setText] = useState(props.initial?.text ?? "");
  const [description, setDescription] = useState(props.initial?.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(props.initial?.category ?? "Other");
  const [sphere, setSphere] = useState<SphereKey>(props.initial?.sphere ?? "work");
  const [xpPreset, setXpPreset] = useState<XpDifficulty>(props.initial?.xpDifficulty ?? "easy");
  const [customXp, setCustomXp] = useState(
    props.initial?.xp && ![10, 25, 50].includes(props.initial.xp)
      ? String(props.initial.xp)
      : "30"
  );

  const [taskType, setTaskType] = useState<"routine" | "special">(
    props.mode === "task" ? (props.initial?.type ?? "special") : "routine"
  );
  const [priority, setPriority] = useState(
    props.mode === "task" ? (props.initial?.priority ?? false) : false
  );
  const [noDeadline, setNoDeadline] = useState(
    props.mode === "task" ? (props.initial?.noDeadline ?? false) : true
  );
  const [dueDate, setDueDate] = useState(
    props.mode === "task" ? (props.initial?.dueDate ?? new Date().toISOString().slice(0, 10)) : ""
  );
  const [timeFrom, setTimeFrom] = useState(
    props.mode === "task" ? (props.initial?.timeFrom ?? "") : ""
  );
  const [timeTo, setTimeTo] = useState(
    props.mode === "task" ? (props.initial?.timeTo ?? "") : ""
  );
  const [goalRef, setGoalRef] = useState(
    props.mode === "task" ? (props.initial?.goalRef ?? "") : ""
  );

  const resolvedXp =
    xpPreset === "custom"
      ? (parseInt(customXp) || 0)
      : XP_PRESETS.find((p) => p.diff === xpPreset)!.value;

  function handleSave() {
    if (!text.trim()) return;
    if (props.mode === "task") {
      props.onSave({
        text: text.trim(),
        description,
        category,
        sphere,
        type: taskType,
        priority,
        xp: resolvedXp,
        xpDifficulty: xpPreset,
        noDeadline,
        dueDate: noDeadline ? undefined : dueDate,
        timeFrom: timeFrom || undefined,
        timeTo: timeTo || undefined,
        goalRef: goalRef || undefined,
      });
    } else {
      props.onSave({
        text: text.trim(),
        description,
        category,
        sphere,
        xp: resolvedXp,
        xpDifficulty: xpPreset,
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(14,14,26,0.98)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-base font-semibold text-white/80">
            {props.mode === "task" ? (props.initial ? "Редактировать задачу" : "Новая задача") : (props.initial ? "Редактировать шаблон" : "Новый шаблон рутины")}
          </h2>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors text-lg">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Title */}
          <Field label="Название">
            <input
              className={inputCls()}
              placeholder="Название задачи..."
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </Field>

          {/* Description */}
          <Field label="Описание (опционально)">
            <textarea
              className={inputCls("resize-none")}
              placeholder="Детали, контекст..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {/* Category */}
          <Field label="Категория жизни">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: category === c ? "#6366f130" : "rgba(255,255,255,0.05)",
                    color: category === c ? "#818cf8" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${category === c ? "#6366f150" : "transparent"}`,
                  }}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </Field>

          {/* Sphere */}
          <Field label="Сфера жизни">
            <div className="grid grid-cols-4 gap-2">
              {sphereKeys.map((k) => {
                const s = sphereColors[k];
                const active = sphere === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSphere(k)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                    style={{
                      background: active ? s.color + "20" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? s.color + "50" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <span className="text-lg" style={{ filter: active ? `drop-shadow(0 0 6px ${s.color})` : "grayscale(1) opacity(0.35)" }}>{s.icon}</span>
                    <span className="text-[9px]" style={{ color: active ? s.color : "rgba(255,255,255,0.3)" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Task-specific fields */}
          {props.mode === "task" && (
            <Field label="Тип задачи">
              <div className="flex gap-2">
                {(["routine", "special"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaskType(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: taskType === t ? "#6366f120" : "rgba(255,255,255,0.04)",
                      color: taskType === t ? "#818cf8" : "rgba(255,255,255,0.35)",
                      border: `1px solid ${taskType === t ? "#6366f145" : "transparent"}`,
                    }}
                  >
                    {t === "routine" ? "Рутина" : "Специальная"}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Priority */}
          {props.mode === "task" && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setPriority(!priority)}
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  borderColor: priority ? "#6366f1" : "rgba(255,255,255,0.2)",
                  background: priority ? "#6366f130" : "transparent",
                }}
              >
                {priority && <span className="text-xs text-indigo-400">✓</span>}
              </div>
              <div>
                <p className="text-sm text-white/70">Сделать приоритетной этого месяца</p>
                <p className="text-[10px] text-white/25">Задача попадёт в блок приоритетов на Главной</p>
              </div>
            </label>
          )}

          {/* XP */}
          <Field label="Сложность (XP)">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {XP_PRESETS.map((p) => (
                  <button
                    key={p.diff}
                    onClick={() => setXpPreset(p.diff)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: xpPreset === p.diff ? "#a855f720" : "rgba(255,255,255,0.04)",
                      color: xpPreset === p.diff ? "#c084fc" : "rgba(255,255,255,0.35)",
                      border: `1px solid ${xpPreset === p.diff ? "#a855f745" : "transparent"}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {xpPreset === "custom" && (
                <input
                  type="number"
                  min={1}
                  max={500}
                  className={inputCls()}
                  placeholder="Введи своё значение XP..."
                  value={customXp}
                  onChange={(e) => setCustomXp(e.target.value)}
                />
              )}
              <p className="text-[10px] text-white/25">
                Итого: <span className="text-purple-400 font-semibold">{resolvedXp} XP</span>
              </p>
            </div>
          </Field>

          {/* Deadline */}
          {props.mode === "task" && (
            <Field label="Срок">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setNoDeadline(!noDeadline)}
                    className="w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      borderColor: noDeadline ? "#6366f1" : "rgba(255,255,255,0.2)",
                      background: noDeadline ? "#6366f130" : "transparent",
                    }}
                  >
                    {noDeadline && <span className="text-[9px] text-indigo-400">✓</span>}
                  </div>
                  <span className="text-xs text-white/50">Без срока</span>
                </label>
                {!noDeadline && (
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      className={inputCls()}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        className={inputCls("flex-1")}
                        placeholder="С"
                        value={timeFrom}
                        onChange={(e) => setTimeFrom(e.target.value)}
                      />
                      <input
                        type="time"
                        className={inputCls("flex-1")}
                        placeholder="До"
                        value={timeTo}
                        onChange={(e) => setTimeTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Field>
          )}

          {/* Goal */}
          {props.mode === "task" && (
            <Field label="Цель (привязка)">
              <input
                className={inputCls()}
                placeholder="Цель недели или месяца..."
                value={goalRef}
                onChange={(e) => setGoalRef(e.target.value)}
              />
            </Field>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors border border-white/8"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
