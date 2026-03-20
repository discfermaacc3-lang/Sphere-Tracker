import { useState } from "react";
import { Goal, GoalLevel, GOAL_XP, GOAL_TARGET_XP_DEFAULT, TaskCategory } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";
import { DreamSelect } from "./DreamSelect";

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

const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR = new Date().getFullYear();

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
  const bonusXP = GOAL_XP[level];

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [successCriteria, setSuccessCriteria] = useState(initial?.successCriteria ?? "");
  const [sphere, setSphere] = useState<SphereKey>(initial?.sphere ?? "work");
  const [category, setCategory] = useState<TaskCategory>(initial?.category ?? "Other");
  const [parentId, setParentId] = useState<string | undefined>(initial?.parentId);
  const [targetXP, setTargetXP] = useState(
    String(initial?.targetXP ?? GOAL_TARGET_XP_DEFAULT[level])
  );
  const [month, setMonth] = useState<number>(
    initial?.month ?? CURRENT_MONTH
  );
  const [year, setYear] = useState<number>(
    initial?.year ?? CURRENT_YEAR
  );

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description,
      successCriteria: successCriteria.trim() || undefined,
      sphere,
      category,
      level,
      parentId: parentId || undefined,
      done: initial?.done ?? false,
      xp: bonusXP,
      targetXP: Math.max(1, parseInt(targetXP) || GOAL_TARGET_XP_DEFAULT[level]),
      month: level !== "year" ? month : undefined,
      year,
      checklistItems: initial?.checklistItems,
    });
    onClose();
  }

  const targetXPPresets =
    level === "week"  ? [50, 100, 150, 200] :
    level === "month" ? [250, 500, 750, 1000] :
                        [1000, 2000, 3000, 5000];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(14,14,26,0.98)", maxHeight: "90vh" }}
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
                {meta.label} · бонус +{bonusXP} XP при выполнении
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

          {/* Success criteria */}
          <Field label="Критерий достижения">
            <input
              className={inputCls()}
              placeholder="Как я пойму, что цель достигнута?"
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
            />
          </Field>

          {/* Month / Year selector */}
          {level === "month" && (
            <Field label="Месяц планирования">
              <div className="flex gap-2">
                <DreamSelect
                  className="flex-1"
                  value={String(month)}
                  onChange={(v) => setMonth(Number(v))}
                  options={MONTH_NAMES.map((name, i) => ({ value: String(i), label: name }))}
                />
                <DreamSelect
                  className="w-28"
                  value={String(year)}
                  onChange={(v) => setYear(Number(v))}
                  options={[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({
                    value: String(y), label: String(y),
                  }))}
                />
              </div>
            </Field>
          )}

          {level === "week" && (
            <Field label="Год">
              <DreamSelect
                value={String(year)}
                onChange={(v) => setYear(Number(v))}
                options={[CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({
                  value: String(y), label: String(y),
                }))}
              />
            </Field>
          )}

          {/* Target XP */}
          <Field label="Целевое XP (нужно набрать)">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {targetXPPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setTargetXP(String(preset))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: targetXP === String(preset) ? meta.color + "25" : "rgba(255,255,255,0.05)",
                      color: targetXP === String(preset) ? meta.color : "rgba(255,255,255,0.35)",
                      border: `1px solid ${targetXP === String(preset) ? meta.color + "50" : "transparent"}`,
                    }}
                  >
                    {preset} XP
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className={inputCls("flex-1")}
                  placeholder="Или введи своё значение..."
                  value={targetXP}
                  onChange={(e) => setTargetXP(e.target.value)}
                />
                <span className="text-xs text-white/30 flex-shrink-0">XP</span>
              </div>
              <p className="text-[10px] text-white/25">
                Цель выполнится автоматически, когда сумма XP привязанных задач достигнет этого значения
              </p>
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
              <DreamSelect
                value={parentId ?? ""}
                onChange={(v) => setParentId(v || undefined)}
                options={[
                  { value: "", label: "— Без привязки —" },
                  ...parentGoals.map((g) => ({
                    value: g.id,
                    label: g.title,
                    icon: sphereColors[g.sphere].icon,
                    color: sphereColors[g.sphere].color,
                  })),
                ]}
                placeholder="— Без привязки —"
              />
            </Field>
          )}

          {/* Bonus XP info */}
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}
          >
            <span className="text-xl">{meta.emoji}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: meta.color }}>
                Бонус +{bonusXP} XP при достижении
              </p>
              <p className="text-[10px] text-white/25">
                {level === "year" && "Бонус зачтётся, когда набранный XP достигнет целевого"}
                {level === "month" && "Выполнение месячной цели добавляет XP в родительскую годовую"}
                {level === "week" && "Выполнение недельной цели добавляет XP в родительскую месячную"}
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
