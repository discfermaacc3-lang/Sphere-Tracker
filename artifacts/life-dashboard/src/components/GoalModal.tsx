import { useState } from "react";
import { Goal, GoalLevel, GOAL_XP, GOAL_TARGET_XP_DEFAULT } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";
import { DreamSelect } from "./DreamSelect";

const LAV = "#a78bfa";

const LEVEL_OPTS: { key: GoalLevel | "custom" | "draft"; label: string; emoji: string; color: string }[] = [
  { key: "year",   label: "ГОД",        emoji: "✨", color: "#fde047" },
  { key: "month",  label: "МЕСЯЦ",      emoji: "🌙", color: "#a78bfa" },
  { key: "week",   label: "НЕДЕЛЯ",     emoji: "⭐", color: "#86efac" },
  { key: "custom", label: "СВОЙ СРОК",  emoji: "⏳", color: "#67e8f9" },
  { key: "draft",  label: "БЕЗ СРОКА",  emoji: "💡", color: "rgba(255,255,255,0.30)" },
];

const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR  = new Date().getFullYear();
const TODAY_ISO     = new Date().toISOString().slice(0, 10);

type LevelKey = GoalLevel | "custom" | "draft";

type Props = {
  defaultLevel?: GoalLevel | "custom" | "draft";
  parentGoals: Goal[];
  initial?: Partial<Goal>;
  onSave: (fields: Omit<Goal, "id">) => void;
  onClose: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-white/30 uppercase tracking-[0.22em] mb-1.5 font-medium">{label}</p>
      {children}
    </div>
  );
}

function inputCls(extra = "") {
  return `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-purple-500/40 transition-colors ${extra}`;
}

function detectInitialLevelKey(initial?: Partial<Goal>): LevelKey {
  if (!initial) return "month";
  if (initial.durationMonths || initial.durationWeeks) return "custom";
  if (!initial.level) return "draft";
  return initial.level;
}

export function GoalModal({ defaultLevel = "month", parentGoals, initial, onSave, onClose }: Props) {
  const initLevelKey = initial ? detectInitialLevelKey(initial) : defaultLevel;

  const [isMission, setIsMission] = useState(initial?.isMission ?? false);
  const [levelKey, setLevelKey] = useState<LevelKey>(initLevelKey);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [successCriteria, setSuccessCriteria] = useState(initial?.successCriteria ?? "");
  const [sphere, setSphere] = useState<SphereKey>(initial?.sphere ?? "work");
  const [parentId, setParentId] = useState<string | undefined>(initial?.parentId);

  const goalLevel = (levelKey === "custom" || levelKey === "draft") ? undefined : levelKey as GoalLevel;
  const isDraft = levelKey === "draft";
  const isCustom = levelKey === "custom";

  const defaultTargetXP = goalLevel ? GOAL_TARGET_XP_DEFAULT[goalLevel] : 100;
  const [targetXP, setTargetXP] = useState(String(initial?.targetXP ?? defaultTargetXP));

  const [month, setMonth] = useState<number>(initial?.month ?? CURRENT_MONTH);
  const [year, setYear] = useState<number>(initial?.year ?? CURRENT_YEAR);

  const [durationUnit, setDurationUnit] = useState<"months" | "weeks">(
    initial?.durationWeeks ? "weeks" : "months"
  );
  const [durationCount, setDurationCount] = useState(
    String(initial?.durationMonths ?? initial?.durationWeeks ?? 3)
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? TODAY_ISO);

  const bonusXP = goalLevel ? GOAL_XP[goalLevel] : 0;

  const targetXPPresets =
    goalLevel === "week"  ? [50, 100, 150, 200] :
    goalLevel === "month" ? [250, 500, 750, 1000] :
    goalLevel === "year"  ? [1000, 2000, 3000, 5000] :
                            [100, 250, 500];

  const levelMeta = LEVEL_OPTS.find(o => o.key === levelKey) ?? LEVEL_OPTS[1];

  const parentGoalsList =
    goalLevel === "month" ? parentGoals.filter(g => g.level === "year") :
    goalLevel === "week"  ? parentGoals.filter(g => g.level === "month") : [];

  function handleSave() {
    if (!title.trim()) return;

    const durationM = isCustom && durationUnit === "months" ? Math.max(1, parseInt(durationCount) || 1) : undefined;
    const durationW = isCustom && durationUnit === "weeks"  ? Math.max(1, parseInt(durationCount) || 1) : undefined;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      successCriteria: successCriteria.trim() || undefined,
      sphere: isMission ? undefined : sphere,
      category: undefined,
      level: goalLevel,
      isMission,
      durationMonths: durationM,
      durationWeeks: durationW,
      startDate: isCustom ? startDate : undefined,
      parentId: parentId || undefined,
      done: initial?.done ?? false,
      xp: isDraft ? 0 : bonusXP,
      targetXP: isDraft ? 0 : Math.max(1, parseInt(targetXP) || defaultTargetXP),
      month: goalLevel === "month" ? month : goalLevel === "week" ? month : undefined,
      year: goalLevel !== undefined ? year : undefined,
      checklistItems: initial?.checklistItems,
      isIdea: initial?.isIdea,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(12,12,22,0.98)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/5"
          style={{ background: `rgba(167,139,250,0.06)` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{levelMeta.emoji}</span>
            <div>
              <h2 className="text-sm font-medium text-white/80">
                {initial?.id ? "Редактировать цель" : "Новая цель"}
              </h2>
              <p className="text-[10px]" style={{ color: levelMeta.color }}>
                {levelMeta.label}
                {!isDraft && bonusXP > 0 && ` · +${bonusXP} XP при завершении`}
                {isDraft && " · черновик без срока"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* ── MISSION checkbox ── */}
          <button
            onClick={() => setIsMission(m => !m)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
            style={{
              background: isMission ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isMission ? "rgba(251,191,36,0.30)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: isMission ? "#fbbf24" : "rgba(255,255,255,0.20)",
                background: isMission ? "rgba(251,191,36,0.20)" : "transparent",
              }}
            >
              {isMission && <span className="text-[10px] text-amber-400">✓</span>}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: isMission ? "#fbbf24" : "rgba(255,255,255,0.55)" }}>
                🌟 МИССИЯ
              </p>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Цель, влияющая на будущее — выходит за рамки одной сферы
              </p>
            </div>
          </button>

          {/* ── Level selector ── */}
          <Field label="Горизонт планирования">
            <div className="grid grid-cols-5 gap-1">
              {LEVEL_OPTS.map(opt => {
                const active = levelKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setLevelKey(opt.key)}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all"
                    style={{
                      background: active ? `${opt.color}15` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? `${opt.color}40` : "rgba(255,255,255,0.06)"}`,
                      boxShadow: active ? `0 0 12px ${opt.color}15` : "none",
                    }}
                  >
                    <span className="text-base leading-none">{opt.emoji}</span>
                    <span
                      className="text-[8px] font-medium text-center leading-tight"
                      style={{ color: active ? opt.color : "rgba(255,255,255,0.25)" }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* ── Title ── */}
          <Field label="Название цели">
            <input
              className={inputCls()}
              placeholder={isDraft ? "Идея или заметка для будущего..." : "Чего я хочу достичь?"}
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
          </Field>

          {/* ── Description ── */}
          <Field label="Описание">
            <textarea
              className={inputCls("resize-none")}
              placeholder={isDraft ? "Контекст, мысли, зачем это важно..." : "Зачем эта цель важна?"}
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Field>

          {/* ── Success criteria (non-draft only) ── */}
          {!isDraft && (
            <Field label="Критерий достижения">
              <input
                className={inputCls()}
                placeholder="Как я пойму, что цель достигнута?"
                value={successCriteria}
                onChange={e => setSuccessCriteria(e.target.value)}
              />
            </Field>
          )}

          {/* ── Custom duration ── */}
          {isCustom && (
            <Field label="Длительность и начало">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={36}
                    className={inputCls("w-20 flex-shrink-0")}
                    value={durationCount}
                    onChange={e => setDurationCount(e.target.value)}
                  />
                  <div className="flex gap-1">
                    {(["months", "weeks"] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => setDurationUnit(u)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: durationUnit === u ? "rgba(103,232,249,0.15)" : "rgba(255,255,255,0.05)",
                          color: durationUnit === u ? "#67e8f9" : "rgba(255,255,255,0.30)",
                          border: `1px solid ${durationUnit === u ? "rgba(103,232,249,0.30)" : "transparent"}`,
                        }}
                      >
                        {u === "months" ? "месяцев" : "недель"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/30 flex-shrink-0">Начало:</span>
                  <input
                    type="date"
                    className={inputCls("flex-1")}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <p className="text-[9px] text-white/20">
                  Цель будет отображаться в каждом месяце на протяжении {durationCount} {durationUnit === "months" ? "мес." : "нед."}
                </p>
              </div>
            </Field>
          )}

          {/* ── Month/Year deadline for month-level ── */}
          {goalLevel === "month" && (
            <Field label="Месяц планирования">
              <div className="flex gap-2">
                <DreamSelect
                  className="flex-1"
                  value={String(month)}
                  onChange={v => setMonth(Number(v))}
                  options={MONTH_NAMES.map((name, i) => ({ value: String(i), label: name }))}
                />
                <DreamSelect
                  className="w-28"
                  value={String(year)}
                  onChange={v => setYear(Number(v))}
                  options={[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => ({
                    value: String(y), label: String(y),
                  }))}
                />
              </div>
            </Field>
          )}

          {/* ── Year for week/year level ── */}
          {(goalLevel === "week" || goalLevel === "year") && (
            <Field label={goalLevel === "year" ? "Год" : "Год (недельная цель)"}>
              <DreamSelect
                value={String(year)}
                onChange={v => setYear(Number(v))}
                options={[CURRENT_YEAR, CURRENT_YEAR + 1].map(y => ({
                  value: String(y), label: String(y),
                }))}
              />
            </Field>
          )}

          {/* ── Sphere (hidden for Mission) ── */}
          {!isMission && (
            <Field label="Сфера жизни">
              <div className="grid grid-cols-4 gap-2">
                {sphereKeys.map(k => {
                  const sc = sphereColors[k];
                  const active = sphere === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setSphere(k)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                      style={{
                        background: active ? sc.color + "20" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? sc.color + "50" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <span
                        className="text-lg"
                        style={{ filter: active ? `drop-shadow(0 0 6px ${sc.color})` : "grayscale(1) opacity(0.35)" }}
                      >
                        {sc.icon}
                      </span>
                      <span className="text-[9px]" style={{ color: active ? sc.color : "rgba(255,255,255,0.30)" }}>
                        {sc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {/* ── XP target (hidden for drafts) ── */}
          {!isDraft && (
            <Field label="Целевое XP для выполнения">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 flex-wrap">
                  {targetXPPresets.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setTargetXP(String(preset))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: targetXP === String(preset) ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.05)",
                        color: targetXP === String(preset) ? LAV : "rgba(255,255,255,0.35)",
                        border: `1px solid ${targetXP === String(preset) ? "rgba(167,139,250,0.40)" : "transparent"}`,
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
                    placeholder="Своё значение..."
                    value={targetXP}
                    onChange={e => setTargetXP(e.target.value)}
                  />
                  <span className="text-xs text-white/30 flex-shrink-0">XP</span>
                </div>
                <p className="text-[9px] text-white/20">
                  Цель выполнится автоматически, когда XP задач достигнет этого значения
                </p>
              </div>
            </Field>
          )}

          {/* ── Parent goal ── */}
          {parentGoalsList.length > 0 && !isDraft && (
            <Field label={goalLevel === "week" ? "Родительская месячная цель" : "Родительская годовая цель"}>
              <DreamSelect
                value={parentId ?? ""}
                onChange={v => setParentId(v || undefined)}
                options={[
                  { value: "", label: "— Без привязки —" },
                  ...parentGoalsList.map(g => ({
                    value: g.id,
                    label: g.title,
                    icon: g.sphere ? sphereColors[g.sphere].icon : "🌟",
                    color: g.sphere ? sphereColors[g.sphere].color : LAV,
                  })),
                ]}
                placeholder="— Без привязки —"
              />
            </Field>
          )}

          {/* ── Reward info (non-draft) ── */}
          {!isDraft && bonusXP > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.20)" }}
            >
              <span className="text-xl">{levelMeta.emoji}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: LAV }}>
                  Награда при завершении: +{bonusXP} XP
                </p>
                <p className="text-[9px] text-white/25">
                  Начислится только когда цель будет полностью достигнута
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/35 hover:text-white/60 transition-colors border border-white/8"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{
              background: `linear-gradient(135deg, rgba(167,139,250,0.80), rgba(139,92,246,0.90))`,
              color: "white",
              boxShadow: "0 0 20px rgba(167,139,250,0.25)",
            }}
          >
            {isDraft ? "Сохранить черновик" : "Сохранить цель"}
          </button>
        </div>
      </div>
    </div>
  );
}
