import { useState } from "react";
import { Task, TaskCategory, XpDifficulty, RoutineTemplate, useStore, computeGoalEarnedXP } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";
import { CustomDatePicker } from "./CustomDatePicker";
import { CustomTimePicker } from "./CustomTimePicker";
import { DreamSelect } from "./DreamSelect";
import { MiniDatePicker } from "./MiniDatePicker";

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

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type TaskFields = BaseFields & {
  type: "routine" | "special";
  priority: boolean;
  noDeadline: boolean;
  dueDate?: string;
  timeFrom?: string;
  timeTo?: string;
  goalId?: string;
  recurringDays?: number[];
  recurringEndDate?: string;
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
  const { goals, tasks } = useStore();

  const weekGoals = goals.filter((g) => g.level === "week");

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
    props.mode === "task"
      ? (props.initial?.dueDate ?? new Date().toISOString().slice(0, 10))
      : ""
  );
  const [timeFrom, setTimeFrom] = useState(
    props.mode === "task" ? (props.initial?.timeFrom ?? "") : ""
  );
  const [timeTo, setTimeTo] = useState(
    props.mode === "task" ? (props.initial?.timeTo ?? "") : ""
  );
  const [goalId, setGoalId] = useState(
    props.mode === "task" ? (props.initial?.goalId ?? "") : ""
  );
  const [recurringDays, setRecurringDays] = useState<number[]>(
    props.mode === "task" ? (props.initial?.recurringDays ?? []) : []
  );
  const [recurringEndType, setRecurringEndType] = useState<"always" | "until">(
    props.mode === "task" && props.initial?.recurringEndDate ? "until" : "always"
  );
  const [recurringEndDate, setRecurringEndDate] = useState<string>(
    props.mode === "task" ? (props.initial?.recurringEndDate ?? "") : ""
  );

  function toggleDay(idx: number) {
    setRecurringDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  }

  const resolvedXp =
    xpPreset === "custom"
      ? (parseInt(customXp) || 0)
      : XP_PRESETS.find((p) => p.diff === xpPreset)!.value;

  // Selected goal info for mini-card
  const selectedGoal = weekGoals.find((g) => g.id === goalId) ?? null;
  const goalEarnedXP = selectedGoal ? computeGoalEarnedXP(selectedGoal, goals, tasks) : 0;
  const goalPct = selectedGoal
    ? Math.min(100, Math.round((goalEarnedXP / selectedGoal.targetXP) * 100))
    : 0;

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
        goalId: goalId || undefined,
        recurringDays: recurringDays.length > 0 ? recurringDays : undefined,
        recurringEndDate: recurringDays.length > 0 && recurringEndType === "until" && recurringEndDate ? recurringEndDate : undefined,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(14,14,26,0.98)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-base font-semibold text-white/80">
            {props.mode === "task"
              ? (props.initial ? "Редактировать задачу" : "Новая задача")
              : (props.initial ? "Редактировать шаблон" : "Новый шаблон рутины")}
          </h2>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors text-lg">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

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

          <Field label="Описание (опционально)">
            <textarea
              className={inputCls("resize-none")}
              placeholder="Детали, контекст..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {/* Mission toggle */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-medium">Тип задачи</p>
            <button
              onClick={() => setCategory(category === "Mission" ? "Other" : "Mission")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
              style={category === "Mission" ? {
                background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08))",
                border: "1px solid rgba(251,191,36,0.40)",
                boxShadow: "0 0 20px rgba(251,191,36,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
              } : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="text-2xl flex-shrink-0" style={{ filter: category === "Mission" ? "drop-shadow(0 0 8px rgba(251,191,36,0.8))" : "grayscale(1) opacity(0.3)" }}>💎</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: category === "Mission" ? "#fbbf24" : "rgba(255,255,255,0.35)" }}>МИССИЯ</p>
                <p className="text-[10px] mt-0.5" style={{ color: category === "Mission" ? "rgba(251,191,36,0.55)" : "rgba(255,255,255,0.20)" }}>Глобальное дело — не привязано к конкретной сфере жизни</p>
              </div>
              <div
                className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: category === "Mission" ? "#fbbf24" : "rgba(255,255,255,0.2)",
                  background: category === "Mission" ? "rgba(251,191,36,0.25)" : "transparent",
                }}
              >
                {category === "Mission" && <span className="text-[9px]" style={{ color: "#fbbf24" }}>✓</span>}
              </div>
            </button>
          </div>

          {/* Sphere selector — hidden when Mission is selected */}
          {category !== "Mission" && (
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
          )}

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

          {props.mode === "task" && (
            <label className="flex items-center gap-3 cursor-pointer">
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
                <p className="text-sm text-white/70">Сделать приоритетной</p>
                <p className="text-[10px] text-white/25">Попадёт в блок приоритетов на Главной</p>
              </div>
            </label>
          )}

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

          {/* Date / Time */}
          {props.mode === "task" && (
            <Field label="Срок">
              <div className="flex flex-col gap-3">
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
                    <CustomDatePicker
                      value={dueDate}
                      onChange={setDueDate}
                      accentColor="#6366f1"
                      placeholder="Выбрать дату"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CustomTimePicker
                          value={timeFrom}
                          onChange={setTimeFrom}
                          placeholder="Начало"
                          accentColor="#6366f1"
                        />
                      </div>
                      <div className="flex-1">
                        <CustomTimePicker
                          value={timeTo}
                          onChange={setTimeTo}
                          placeholder="Конец"
                          accentColor="#6366f1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Field>
          )}

          {/* Goal link with mini-card */}
          {props.mode === "task" && (
            <Field label="Привязать к цели недели">
              <div className="flex flex-col gap-2">
                <DreamSelect
                  value={goalId}
                  onChange={setGoalId}
                  options={[
                    { value: "", label: "— Без привязки к цели —" },
                    ...weekGoals.map((g) => ({
                      value: g.id,
                      label: g.title,
                      icon: sphereColors[g.sphere].icon,
                      color: sphereColors[g.sphere].color,
                    })),
                  ]}
                  placeholder="— Без привязки к цели —"
                />

                {/* Goal mini-card */}
                {selectedGoal && (() => {
                  const s = sphereColors[selectedGoal.sphere];
                  return (
                    <div
                      className="rounded-2xl px-4 py-3 flex flex-col gap-2"
                      style={{
                        background: s.color + "0c",
                        border: `1px solid ${s.color}30`,
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl"
                          style={{ filter: `drop-shadow(0 0 6px ${s.color})` }}
                        >
                          {s.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/75 truncate">
                            {selectedGoal.title}
                          </p>
                          <p className="text-[9px] text-white/35 mt-0.5">
                            {s.label} · 🎯 Цель недели
                          </p>
                        </div>
                        {selectedGoal.done && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 flex-shrink-0">
                            Выполнена
                          </span>
                        )}
                      </div>

                      {/* XP progress */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] text-white/30">
                            Прогресс · {goalEarnedXP} / {selectedGoal.targetXP} XP
                          </span>
                          <span
                            className="text-[9px] font-bold"
                            style={{ color: s.color }}
                          >
                            {goalPct}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.07)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${goalPct}%`,
                              background: `linear-gradient(90deg, ${s.color}70, ${s.color})`,
                              boxShadow: `0 0 6px ${s.color}50`,
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-white/20 mt-1.5">
                          ⚡ Твоя задача добавит {resolvedXp} XP к этой цели
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {weekGoals.length === 0 && (
                  <p className="text-[10px] text-white/20">
                    Сначала создай цели недели на странице «Цели»
                  </p>
                )}
              </div>
            </Field>
          )}

          {/* Recurring days */}
          {props.mode === "task" && (
            <Field label="Повтор (дни недели)">
              <div className="flex flex-col gap-2">
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, idx) => {
                    const active = recurringDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-medium transition-all"
                        style={{
                          background: active ? "#6366f125" : "rgba(255,255,255,0.04)",
                          color: active ? "#818cf8" : "rgba(255,255,255,0.30)",
                          border: `1px solid ${active ? "#6366f148" : "transparent"}`,
                          boxShadow: active ? "0 0 8px rgba(99,102,241,0.15)" : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {recurringDays.length > 0 && (
                  <p className="text-[10px] text-white/25">
                    🔁 Задача будет автоматически появляться в:{" "}
                    <span className="text-indigo-400">
                      {recurringDays.sort().map((d) => DAY_LABELS[d]).join(", ")}
                    </span>
                  </p>
                )}
                {recurringDays.length === 0 && (
                  <p className="text-[10px] text-white/18">
                    Выбери дни — задача будет создаваться автоматически
                  </p>
                )}

                {/* Recurring end condition */}
                {recurringDays.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
                    <p className="text-[9px] uppercase tracking-[0.20em]" style={{ color: "rgba(255,255,255,0.28)" }}>
                      Конец повтора
                    </p>
                    <div className="flex gap-2">
                      {(["always", "until"] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setRecurringEndType(opt)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: recurringEndType === opt ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.04)",
                            color: recurringEndType === opt ? "#a78bfa" : "rgba(255,255,255,0.35)",
                            border: recurringEndType === opt ? "1px solid rgba(167,139,250,0.35)" : "1px solid rgba(255,255,255,0.08)",
                            textShadow: recurringEndType === opt ? "0 0 8px rgba(167,139,250,0.50)" : "none",
                          }}
                        >
                          {opt === "always" ? "Всегда" : "До даты…"}
                        </button>
                      ))}
                    </div>
                    {recurringEndType === "until" && (
                      <MiniDatePicker
                        value={recurringEndDate}
                        onChange={setRecurringEndDate}
                      />
                    )}
                  </div>
                )}
              </div>
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
