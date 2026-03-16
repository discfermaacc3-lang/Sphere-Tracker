import { useState } from "react";
import { Goal, GoalLevel, GOAL_XP, TaskCategory } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

export const CATEGORIES: TaskCategory[] = [
  "Body", "Mindset", "Creativity", "Hobby",
  "Work", "Finance", "Mission", "Other",
];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  Body: "Тело", Mindset: "Мышление", Creativity: "Творчество",
  Hobby: "Хобби", Work: "Работа", Finance: "Финансы",
  Mission: "Миссия", Other: "Другое",
};

const LEVEL_META: Record<GoalLevel, { label: string; emoji: string; color: string }> = {
  year:  { label: "Годовая",   emoji: "🌟", color: "#f59e0b" },
  month: { label: "Месячная",  emoji: "🌙", color: "#6366f1" },
  week:  { label: "Недельная", emoji: "⚡", color: "#22c55e" },
};

type Props = {
  level: GoalLevel;
  parentGoals: Goal[];
  initial?: Partial<Goal>;
  onSave: (fields: Omit<Goal, "id">) => void;
  onClose: () => void;
};

function inputCls(extra = "") {
  return `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors ${extra}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">{label}</p>
      {children}
    </div>
  );
}

export function GoalModal({ level, parentGoals, initial, onSave, onClose }: Props) {
  const meta = LEVEL_META[level];
  const xp = GOAL_XP[level];

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sphere, setSphere] = useState<SphereKey>(initial?.sphere ?? "work");
  const [category, setCategory] = useState<TaskCategory>(initial?.category ?? "Other");
  const [parentId, setParentId] = useState<string | undefined>(initial?.parentId);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description,
      sphere,
      category,
      level,
      parentId: parentId || undefined,
      done: initial?.done ?? false,
      xp,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(14,14,26,0.98)", maxHeight: "88vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/5"
          style={{ background: `${meta.color}10` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <h2 className="text-sm font-semibold text-white/80">
                {initial ? "Редактировать цель" : "Новая цель"}
              </h2>
              <p className="text-[10px]" style={{ color: meta.color }}>
                {meta.label} · {xp} XP за выполнение
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors text-lg">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Title */}
          <Field label="Название цели">
            <input
              className={inputCls()}
              placeholder="Чего я хочу достичь?"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </Field>

          {/* Description */}
          <Field label="Описание (опционально)">
            <textarea
              className={inputCls("resize-none")}
              placeholder="Зачем эта цель важна для меня?"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
                    <span
                      className="text-lg"
                      style={{ filter: active ? `drop-shadow(0 0 6px ${s.color})` : "grayscale(1) opacity(0.35)" }}
                    >
                      {s.icon}
                    </span>
                    <span className="text-[9px]" style={{ color: active ? s.color : "rgba(255,255,255,0.3)" }}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Category */}
          <Field label="Категория">
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

          {/* Parent goal */}
          {parentGoals.length > 0 && (
            <Field label={level === "week" ? "Родительская цель (месячная)" : "Родительская цель (годовая)"}>
              <select
                className={inputCls("cursor-pointer")}
                value={parentId ?? ""}
                onChange={(e) => setParentId(e.target.value || undefined)}
                style={{ colorScheme: "dark" }}
              >
                <option value="">— Без привязки —</option>
                {parentGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {sphereColors[g.sphere].icon} {g.title}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* XP info */}
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}
          >
            <span className="text-xl">{meta.emoji}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: meta.color }}>
                +{xp} XP за выполнение
              </p>
              <p className="text-[10px] text-white/25">
                {level === "year" && "Годовые цели дают максимум XP"}
                {level === "month" && "Месячные цели — крупные шаги к годовой"}
                {level === "week" && "Недельные цели — конкретные шаги к месячной"}
              </p>
            </div>
          </div>
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
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ background: `linear-gradient(135deg, ${meta.color}cc, ${meta.color})`, color: "white" }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
