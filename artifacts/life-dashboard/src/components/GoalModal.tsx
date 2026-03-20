import { useState } from "react";
import { Goal } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";
import { formatDuration } from "@/lib/formatDuration";

const LAV = "#a78bfa";
const LAV_RGB = "167,139,250";
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const MONTH_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WDAY_RU = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

const DURATION_PRESETS: { label: string; days: number; level: "week" | "month" | "year" }[] = [
  { label: "2 нед",  days: 14,  level: "week"  },
  { label: "1 мес",  days: 30,  level: "month" },
  { label: "3 мес",  days: 90,  level: "month" },
  { label: "6 мес",  days: 180, level: "month" },
  { label: "1 год",  days: 365, level: "year"  },
];
const XP_BONUS_PRESETS = [50, 100, 250, 500, 1000];

/* ── date helpers ── */
function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function formatDateRu(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_RU[d.getMonth()].slice(0, 3).toLowerCase()} ${d.getFullYear()}`;
}
function isoFromYMD(y: number, m: number, day: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/* ══════════════════════════════════════════
   DateRangePicker — лавандовый инлайн-календарь
   ══════════════════════════════════════════ */
function DateRangePicker({ startDate, endDate, onChange }: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  const initD = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initD.getFullYear());
  const [viewMonth, setViewMonth] = useState(initD.getMonth());
  const [phase, setPhase] = useState<"start" | "end">("start");
  const [hovered, setHovered] = useState<string | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWday = (() => {
    const w = new Date(viewYear, viewMonth, 1).getDay();
    return w === 0 ? 6 : w - 1; // Mon=0..Sun=6
  })();


  function handleDay(iso: string) {
    if (phase === "start") {
      onChange(iso, iso);
      setPhase("end");
    } else {
      if (iso < startDate) {
        onChange(iso, startDate);
      } else {
        onChange(startDate, iso);
      }
      setPhase("start");
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function prevYear() { setViewYear(y => y - 1); }
  function nextYear() { setViewYear(y => y + 1); }

  const effectiveEnd = hovered && phase === "end" ? hovered : endDate;

  const navBtn = (onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-purple-500/20"
      style={{ color: `rgba(${LAV_RGB},0.60)`, background: `rgba(${LAV_RGB},0.08)` }}
    >{label}</button>
  );

  return (
    <div
      className="rounded-2xl overflow-hidden select-none"
      style={{
        background: "rgba(14,12,32,0.96)",
        border: `1px solid rgba(${LAV_RGB},0.22)`,
        boxShadow: `0 0 30px rgba(${LAV_RGB},0.10)`,
      }}
    >
      {/* Month + Year nav — two rows */}
      <div
        className="flex flex-col gap-1 px-4 pt-3 pb-2"
        style={{ borderBottom: `1px solid rgba(${LAV_RGB},0.12)` }}
      >
        {/* Month row */}
        <div className="flex items-center justify-between">
          {navBtn(prevMonth, "‹")}
          <span className="text-xs font-medium tracking-[0.12em]" style={{ color: `rgba(${LAV_RGB},0.85)` }}>
            {MONTH_RU[viewMonth]}
          </span>
          {navBtn(nextMonth, "›")}
        </div>
        {/* Year row */}
        <div className="flex items-center justify-between">
          {navBtn(prevYear, "«")}
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: `rgba(${LAV_RGB},0.70)`, textShadow: `0 0 12px rgba(${LAV_RGB},0.40)` }}
          >
            {viewYear}
          </span>
          {navBtn(nextYear, "»")}
        </div>
      </div>

      {/* Phase hint */}
      <div className="px-4 pt-2 pb-1">
        <p className="text-[9px] text-center tracking-[0.18em]"
          style={{ color: `rgba(${LAV_RGB},0.40)` }}>
          {phase === "start" ? "ВЫБЕРИ ДАТУ НАЧАЛА" : "ВЫБЕРИ ДАТУ ЗАВЕРШЕНИЯ"}
        </p>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 pb-1">
        {WDAY_RU.map(d => (
          <div key={d} className="text-center text-[8px] py-1" style={{ color: `rgba(${LAV_RGB},0.35)` }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {/* Empty cells before first day */}
        {Array.from({ length: firstWday }).map((_, i) => <div key={`e${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = isoFromYMD(viewYear, viewMonth, day);
          const isStart = iso === startDate;
          const isEnd = iso === endDate;
          const inRange = startDate && effectiveEnd
            ? iso > (startDate < effectiveEnd ? startDate : effectiveEnd)
              && iso < (startDate < effectiveEnd ? effectiveEnd : startDate)
            : false;
          const isToday = iso === TODAY_ISO;
          const isHov = iso === hovered && phase === "end";

          let bg = "transparent";
          let color = "rgba(255,255,255,0.55)";
          let border = "transparent";
          let shadow = "";

          if (isStart || isEnd) {
            bg = LAV;
            color = "#fff";
            shadow = `0 0 12px rgba(${LAV_RGB},0.55)`;
          } else if (inRange) {
            bg = `rgba(${LAV_RGB},0.18)`;
            color = `rgba(${LAV_RGB},0.90)`;
          } else if (isHov) {
            bg = `rgba(${LAV_RGB},0.12)`;
            color = LAV;
          } else if (isToday) {
            border = `rgba(${LAV_RGB},0.40)`;
            color = LAV;
          }

          return (
            <button
              key={iso}
              onClick={() => handleDay(iso)}
              onMouseEnter={() => setHovered(iso)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center justify-center text-xs rounded-lg transition-all"
              style={{
                width: "100%",
                aspectRatio: "1",
                background: bg,
                color,
                border: `1px solid ${border}`,
                boxShadow: shadow,
                fontWeight: isStart || isEnd ? 700 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GoalModal
   ══════════════════════════════════════════ */
type Props = {
  defaultLevel?: string;
  parentGoals: Goal[];
  initial?: Partial<Goal>;
  onSave: (fields: Omit<Goal, "id">) => void;
  onClose: () => void;
};

function inputCls(extra = "") {
  return `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-purple-500/40 transition-colors ${extra}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-white/30 uppercase tracking-[0.22em] mb-2 font-semibold">{label}</p>
      {children}
    </div>
  );
}

function detectIsDraft(initial?: Partial<Goal>): boolean {
  if (!initial) return false;
  return !initial.startDate && !initial.endDate && !initial.level && !initial.durationMonths && !initial.durationWeeks;
}

export function GoalModal({ parentGoals, initial, onSave, onClose }: Props) {
  const [isMission, setIsMission] = useState(initial?.isMission ?? false);
  const [isDraft, setIsDraft] = useState(detectIsDraft(initial));

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [successCriteria, setSuccessCriteria] = useState(initial?.successCriteria ?? "");
  const [sphere, setSphere] = useState<SphereKey>(initial?.sphere ?? "work");

  // Date range
  const defaultStart = initial?.startDate ?? TODAY_ISO;
  const defaultEnd = initial?.endDate ?? addDays(TODAY_ISO, 30);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | "custom">(() => {
    if (detectIsDraft(initial)) return 30;
    if (initial?.startDate && initial?.endDate) {
      const d = diffDays(initial.startDate, initial.endDate);
      const found = DURATION_PRESETS.find(p => p.days === d);
      return found ? found.days : "custom";
    }
    // Legacy: restore from saved level
    if (initial?.level === "year") return 365;
    if (initial?.level === "week") return 14;
    return 30;
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // XP bonus
  const [xpBonus, setXpBonus] = useState(String(initial?.xp ?? 100));

  const days = isDraft ? 0 : diffDays(startDate, endDate);

  function selectPreset(preset: typeof DURATION_PRESETS[number]) {
    setSelectedPresetDays(preset.days);
    setStartDate(TODAY_ISO);
    setEndDate(addDays(TODAY_ISO, preset.days));
    setShowCalendar(false);
  }

  function computeLevel(): "week" | "month" | "year" {
    if (selectedPresetDays !== "custom") {
      const found = DURATION_PRESETS.find(p => p.days === selectedPresetDays);
      if (found) return found.level;
    }
    // Custom date range: auto-detect from duration
    const d = diffDays(startDate, endDate);
    if (d <= 21)  return "week";
    if (d <= 180) return "month";
    return "year";
  }

  function handleSave() {
    if (!title.trim()) return;

    const xp = Math.max(0, parseInt(xpBonus) || 0);

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      successCriteria: successCriteria.trim() || undefined,
      sphere: isMission ? undefined : sphere,
      category: undefined,
      level: isDraft ? undefined : computeLevel(),
      isMission,
      startDate: isDraft ? undefined : startDate,
      endDate: isDraft ? undefined : endDate,
      durationMonths: undefined,
      durationWeeks: undefined,
      parentId: undefined,
      done: initial?.done ?? false,
      xp,
      targetXP: 0,
      month: undefined,
      year: undefined,
      checklistItems: initial?.checklistItems,
      isIdea: isDraft,
    });
    onClose();
  }

  const totalDays = diffDays(startDate, endDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        style={{ background: "rgba(11,10,22,0.99)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/5"
          style={{ background: `rgba(${LAV_RGB},0.05)` }}
        >
          <div>
            <h2 className="text-base font-semibold text-white/85 tracking-wide">
              {initial?.title ? "Редактировать цель" : "Новая цель"}
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: `rgba(${LAV_RGB},0.55)` }}>
              {isDraft ? "Черновик без срока" : `${formatDateRu(startDate)} → ${formatDateRu(endDate)}${totalDays > 0 ? " · " + formatDuration(totalDays) : ""}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Mission checkbox */}
          <button
            onClick={() => setIsMission(m => !m)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
            style={{
              background: isMission ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${isMission ? "rgba(251,191,36,0.28)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{ borderColor: isMission ? "#fbbf24" : "rgba(255,255,255,0.18)", background: isMission ? "rgba(251,191,36,0.20)" : "transparent" }}
            >
              {isMission && <span className="text-[10px] font-bold text-amber-400">✓</span>}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide" style={{ color: isMission ? "#fbbf24" : "rgba(255,255,255,0.50)" }}>
                🌟 МИССИЯ
              </p>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                Цель, влияющая на будущее — выходит за рамки одной сферы
              </p>
            </div>
          </button>

          {/* Title */}
          <Field label="Название цели">
            <input
              className={inputCls()}
              placeholder={isDraft ? "Идея или мечта..." : "Чего я хочу достичь?"}
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
          </Field>

          {/* Description */}
          <Field label="Описание">
            <textarea
              className={inputCls("resize-none")}
              placeholder="Зачем эта цель важна?"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Field>

          {/* Success criteria */}
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

          {/* Sphere */}
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
                        background: active ? sc.color + "1E" : "rgba(255,255,255,0.025)",
                        border: `1px solid ${active ? sc.color + "45" : "rgba(255,255,255,0.06)"}`,
                        boxShadow: active ? `0 0 14px ${sc.color}20` : "none",
                      }}
                    >
                      <span className="text-xl" style={{ filter: active ? `drop-shadow(0 0 6px ${sc.color})` : "grayscale(1) opacity(0.30)" }}>
                        {sc.icon}
                      </span>
                      <span className="text-[9px]" style={{ color: active ? sc.color : "rgba(255,255,255,0.28)" }}>
                        {sc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Period / Draft toggle */}
          <Field label="Период цели">
            <div className="flex flex-col gap-3">
              {/* Draft checkbox */}
              <button
                onClick={() => { setIsDraft(d => !d); setShowCalendar(false); }}
                className="flex items-center gap-2.5 text-left"
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: isDraft ? LAV : "rgba(255,255,255,0.20)", background: isDraft ? `rgba(${LAV_RGB},0.20)` : "transparent" }}
                >
                  {isDraft && <span className="text-[9px]" style={{ color: LAV }}>✓</span>}
                </div>
                <span className="text-[10px]" style={{ color: isDraft ? LAV : "rgba(255,255,255,0.35)" }}>
                  💡 Без срока (черновик)
                </span>
              </button>

              {/* Duration presets grid + custom */}
              {!isDraft && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {DURATION_PRESETS.map(p => {
                      const active = selectedPresetDays === p.days;
                      return (
                        <button
                          key={p.days}
                          onClick={() => selectPreset(p)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: active ? `rgba(${LAV_RGB},0.20)` : "rgba(255,255,255,0.04)",
                            color: active ? LAV : "rgba(255,255,255,0.40)",
                            border: `1px solid ${active ? `rgba(${LAV_RGB},0.38)` : "rgba(255,255,255,0.08)"}`,
                            boxShadow: active ? `0 0 12px rgba(${LAV_RGB},0.20)` : "none",
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { setSelectedPresetDays("custom"); setShowCalendar(c => !c); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: selectedPresetDays === "custom" ? `rgba(${LAV_RGB},0.20)` : "rgba(255,255,255,0.04)",
                        color: selectedPresetDays === "custom" ? LAV : "rgba(255,255,255,0.40)",
                        border: `1px solid ${selectedPresetDays === "custom" ? `rgba(${LAV_RGB},0.38)` : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      ✦ Свой
                    </button>
                  </div>

                  {/* Date range display */}
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                    style={{ background: `rgba(${LAV_RGB},0.07)`, border: `1px solid rgba(${LAV_RGB},0.18)` }}
                  >
                    <span className="text-sm" style={{ color: `rgba(${LAV_RGB},0.70)` }}>📅</span>
                    <span className="text-xs font-medium flex-1" style={{ color: `rgba(${LAV_RGB},0.85)` }}>
                      {formatDateRu(startDate)} → {formatDateRu(endDate)}
                    </span>
                    <span className="text-[10px]" style={{ color: `rgba(${LAV_RGB},0.45)` }}>
                      {days} дн.
                    </span>
                  </div>

                  {/* Inline calendar (custom only) */}
                  {showCalendar && (
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(s, e) => {
                        setStartDate(s);
                        setEndDate(e);
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </Field>

          {/* XP Bonus */}
          {!isDraft && (
            <Field label="Бонус XP при завершении">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 flex-wrap">
                  {XP_BONUS_PRESETS.map(p => {
                    const active = xpBonus === String(p);
                    return (
                      <button
                        key={p}
                        onClick={() => setXpBonus(String(p))}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: active ? `rgba(${LAV_RGB},0.20)` : "rgba(255,255,255,0.04)",
                          color: active ? LAV : "rgba(255,255,255,0.40)",
                          border: `1px solid ${active ? `rgba(${LAV_RGB},0.38)` : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        {p} XP
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    className={inputCls("flex-1")}
                    placeholder="Своё значение..."
                    value={xpBonus}
                    onChange={e => setXpBonus(e.target.value)}
                  />
                  <span className="text-xs text-white/30 flex-shrink-0">XP</span>
                </div>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                  Начислится разово когда ты завершишь все шаги и нажмёшь «Завершить цель»
                </p>
              </div>
            </Field>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/35 hover:text-white/60 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{
              background: `linear-gradient(135deg, rgba(${LAV_RGB},0.80), rgba(139,92,246,0.90))`,
              color: "white",
              boxShadow: "0 0 24px rgba(167,139,250,0.28)",
            }}
          >
            {isDraft ? "Сохранить идею" : "Сохранить цель"}
          </button>
        </div>
      </div>
    </div>
  );
}
