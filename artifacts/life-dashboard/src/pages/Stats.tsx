import { useRef, useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 122;
const MIN_R = 44;
const GAP_DEG = 4;
const SECTORS = sphereKeys.length;
const SECTOR_DEG = 360 / SECTORS;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number
) {
  const s1 = polarToXY(cx, cy, outerR, startDeg);
  const e1 = polarToXY(cx, cy, outerR, endDeg);
  const s2 = polarToXY(cx, cy, innerR, endDeg);
  const e2 = polarToXY(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
    "Z",
  ].join(" ");
}

function useAnimatedLevels(levels: Record<SphereKey, number>) {
  const [animated, setAnimated] = useState<Record<SphereKey, number>>({ ...levels });
  const prev = useRef<Record<SphereKey, number>>({ ...levels });
  const raf = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const from = useRef<Record<SphereKey, number>>({ ...levels });

  useEffect(() => {
    const changed = sphereKeys.some((k) => levels[k] !== prev.current[k]);
    if (!changed) return;
    from.current = { ...animated };
    startTime.current = null;
    prev.current = { ...levels };
    if (raf.current) cancelAnimationFrame(raf.current);
    const DURATION = 600;
    function ease(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function step(ts: number) {
      if (!startTime.current) startTime.current = ts;
      const t = Math.min((ts - startTime.current) / DURATION, 1);
      const e = ease(t);
      const next = Object.fromEntries(
        sphereKeys.map((k) => [k, from.current[k] + (levels[k] - from.current[k]) * e])
      ) as Record<SphereKey, number>;
      setAnimated(next);
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [levels]);

  return animated;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const XP_LEVELS = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) level = i + 1;
  }
  return level;
}

type Period = "day" | "week" | "month" | "year";
const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: "day",   label: "День"   },
  { key: "week",  label: "Неделя" },
  { key: "month", label: "Месяц"  },
  { key: "year",  label: "Год"    },
];

function GlowDonut({ levels, hovered, setHovered }: {
  levels: Record<SphereKey, number>;
  hovered: SphereKey | null;
  setHovered: (k: SphereKey | null) => void;
}) {
  const animated = useAnimatedLevels(levels);
  const total = sphereKeys.reduce((sum, k) => sum + animated[k], 0);
  const avg = total / SECTORS;

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: "visible" }}>
        <defs>
          {sphereKeys.map((key) => {
            const col = sphereColors[key].color;
            return (
              <filter key={`glow-f-${key}`} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feFlood floodColor={col} floodOpacity="0.6" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            );
          })}
          <filter id="center-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {sphereKeys.map((key, i) => {
          const col = sphereColors[key].color;
          const start = i * SECTOR_DEG + GAP_DEG / 2;
          const end = (i + 1) * SECTOR_DEG - GAP_DEG / 2;
          const path = describeArc(CX, CY, MAX_R, MIN_R, start, end);
          return (
            <path key={`bg-${key}`} d={path}
              fill={`rgba(${hexToRgb(col)},0.06)`}
              stroke={`rgba(${hexToRgb(col)},0.15)`}
              strokeWidth="0.5" />
          );
        })}

        {sphereKeys.map((key, i) => {
          const level = animated[key];
          const ratio = level / 10;
          const outerR = MIN_R + (MAX_R - MIN_R) * ratio;
          const start = i * SECTOR_DEG + GAP_DEG / 2;
          const end = (i + 1) * SECTOR_DEG - GAP_DEG / 2;
          const isHov = hovered === key;
          const col = sphereColors[key].color;
          if (ratio < 0.02) return null;
          const path = describeArc(CX, CY, outerR, MIN_R, start, end);
          return (
            <g key={key}>
              <path d={path} fill={`rgba(${hexToRgb(col)},0.25)`}
                filter={`url(#glow-${key})`} opacity={isHov ? 1 : 0.7}
                style={{ transition: "opacity 0.3s" }} />
              <path d={path} fill={`rgba(${hexToRgb(col)},0.75)`}
                opacity={hovered && !isHov ? 0.3 : 1}
                style={{ transition: "opacity 0.25s", cursor: "pointer" }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)} />
            </g>
          );
        })}

        {sphereKeys.map((key, i) => {
          const midDeg = i * SECTOR_DEG + SECTOR_DEG / 2;
          const labelR = MAX_R + 20;
          const pos = polarToXY(CX, CY, labelR, midDeg);
          const isHov = hovered === key;
          return (
            <text key={`icon-${key}`} x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="middle" fontSize="14"
              className="pointer-events-none"
              style={{
                filter: isHov ? `drop-shadow(0 0 8px ${sphereColors[key].color})` : "none",
                opacity: hovered && !isHov ? 0.4 : 1,
                transition: "opacity 0.25s",
              }}
            >
              {sphereColors[key].icon}
            </text>
          );
        })}

        <circle cx={CX} cy={CY} r={MIN_R - 5}
          fill="rgba(16,12,38,0.95)" style={{ filter: "url(#center-glow)" }} />
        <circle cx={CX} cy={CY} r={MIN_R - 5}
          fill="rgba(16,12,38,0.98)"
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {hovered ? (
          <>
            <text x={CX} y={CY - 10} textAnchor="middle" fontSize="24" fontWeight="300"
              fill={sphereColors[hovered].color}
              style={{ filter: `drop-shadow(0 0 12px ${sphereColors[hovered].color})` }}>
              {levels[hovered]}
            </text>
            <text x={CX} y={CY + 9} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">/10</text>
            <text x={CX} y={CY + 25} textAnchor="middle" fontSize="9" fill={sphereColors[hovered].color + "90"}>
              {sphereColors[hovered].label}
            </text>
          </>
        ) : (
          <>
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize="26" fontWeight="200"
              fill="white" opacity="0.8">
              {avg.toFixed(1)}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9"
              fill="rgba(255,255,255,0.25)" letterSpacing="2">
              СРЕДНЕЕ
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export function Stats() {
  const {
    sphereLevels, setSphereLevel, tasks,
    isArchiveMode, totalXP,
    prioritySpheres,
  } = useStore();

  const [hovered, setHovered] = useState<SphereKey | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [expandedPriority, setExpandedPriority] = useState<number | null>(null);

  const displayLevels = sphereLevels;

  // ── current month prefix for "always month" context
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ── Period date bounds
  const periodFilter = useMemo((): ((completedAt: string | undefined) => boolean) => {
    const todayStr = now.toISOString().slice(0, 10);
    if (period === "day") {
      return (ca) => ca === todayStr;
    }
    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStr = weekAgo.toISOString().slice(0, 10);
      return (ca) => !!ca && ca >= weekStr && ca <= todayStr;
    }
    if (period === "month") {
      return (ca) => !!ca && ca.startsWith(thisMonthPrefix);
    }
    const prefix = todayStr.slice(0, 4);
    return (ca) => !!ca && ca.startsWith(prefix);
  }, [period]);

  const doneTasks = useMemo(
    () => tasks.filter((t) => t.done && periodFilter(t.completedAt)),
    [tasks, periodFilter]
  );

  // tasks completed this month (for priority sphere stats)
  const monthDoneTasks = useMemo(
    () => tasks.filter((t) => t.done && t.completedAt?.startsWith(thisMonthPrefix)),
    [tasks]
  );

  // all tasks this month by sphere (done + pending)
  const monthTasksBySphere = useMemo(() => {
    const m: Record<string, { done: typeof tasks; all: typeof tasks }> = {};
    tasks.forEach(t => {
      if (!m[t.sphere]) m[t.sphere] = { done: [], all: [] };
      if (t.dueDate?.startsWith(thisMonthPrefix) || t.completedAt?.startsWith(thisMonthPrefix)) {
        m[t.sphere].all.push(t);
        if (t.done) m[t.sphere].done.push(t);
      }
    });
    return m;
  }, [tasks]);

  const periodXP = useMemo(
    () => doneTasks.reduce((s, t) => s + t.xp, 0),
    [doneTasks]
  );

  const currentLevel = getLevelFromXP(totalXP);
  const levelAtPeriodStart = getLevelFromXP(Math.max(0, totalXP - periodXP));
  const levelsGained = currentLevel - levelAtPeriodStart;

  const monthName = now.toLocaleString("ru-RU", { month: "long" });

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
        >
          Статистика
        </h1>
        {isArchiveMode && (
          <span
            className="text-[8px] px-2.5 py-1 rounded-full tracking-widest uppercase"
            style={{
              background: "rgba(167,139,250,0.12)",
              color: "#c4b5fd",
              border: "1px solid rgba(167,139,250,0.25)",
            }}
          >
            📖 Архив
          </span>
        )}
      </div>

      {/* ── Period filter tabs */}
      <div
        className="flex gap-1 p-1 rounded-[1.2rem]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {PERIOD_LABELS.map(({ key, label }) => {
          const active = period === key;
          return (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="flex-1 py-2 rounded-[0.9rem] text-xs font-light tracking-[0.12em] transition-all duration-250"
              style={{
                background: active ? "rgba(167,139,250,0.18)" : "transparent",
                color: active ? "#e2d9ff" : "rgba(255,255,255,0.28)",
                border: active ? "1px solid rgba(167,139,250,0.30)" : "1px solid transparent",
                boxShadow: active ? "0 0 18px rgba(167,139,250,0.18)" : "none",
                textShadow: active ? "0 0 12px rgba(167,139,250,0.6)" : "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Summary stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Задач выполнено", value: doneTasks.length, unit: "шт",  color: "#86efac", icon: "✓" },
          { label: "XP заработано",   value: periodXP,         unit: "XP",  color: "#a78bfa", icon: "✦" },
          { label: "Уровней получено",value: levelsGained,     unit: "ур",  color: "#fde047", icon: "⭐" },
        ].map(({ label, value, unit, color, icon }) => (
          <div
            key={label}
            className="rounded-[1.5rem] p-4 flex flex-col gap-2 relative overflow-hidden"
            style={{
              background: `rgba(${hexToRgb(color)},0.06)`,
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(${hexToRgb(color)},0.14)`,
            }}
          >
            <div
              className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle,rgba(${hexToRgb(color)},0.20) 0%,transparent 70%)`,
                filter: "blur(12px)",
                transform: "translate(30%,-30%)",
              }}
            />
            <span className="text-base" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>{icon}</span>
            <p className="text-2xl font-light tabular-nums" style={{ color, textShadow: `0 0 18px ${color}60` }}>
              {value}
              <span className="text-xs ml-1" style={{ color: "rgba(255,255,255,0.25)" }}>{unit}</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] font-medium leading-tight"
              style={{ color: "rgba(255,255,255,0.28)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ── Priority Spheres — центральный акцент
          ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] uppercase tracking-[0.25em] font-medium"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            Приоритеты месяца
          </p>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.14)" }}>
            {monthName} {now.getFullYear()}
          </p>
        </div>

        {prioritySpheres[0] === null && prioritySpheres[1] === null ? (
          <div
            className="rounded-[1.75rem] p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.2)" }}>
              Приоритеты не заданы
            </p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.1)" }}>
              Зайди на Главную и выбери две сферы-приоритета
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {([0, 1] as const).map(slotIdx => {
              const key = prioritySpheres[slotIdx];
              if (!key) return null;
              const s = sphereColors[key];
              const rgb = hexToRgb(s.color);
              const level = displayLevels[key];
              const pct = (level / 10) * 100;
              const sphereData = monthTasksBySphere[key] || { done: [], all: [] };
              const doneCount = sphereData.done.length;
              const totalCount = sphereData.all.length;
              const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
              const isExpanded = expandedPriority === slotIdx;

              return (
                <div
                  key={key}
                  className="rounded-[1.75rem] overflow-hidden transition-all duration-400"
                  style={{
                    background: `rgba(${rgb},0.05)`,
                    backdropFilter: "blur(24px)",
                    border: `1px solid rgba(${rgb},0.18)`,
                    boxShadow: `0 0 50px rgba(${rgb},0.07)`,
                  }}
                >
                  {/* Card header */}
                  <div className="p-5 flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `rgba(${rgb},0.12)`,
                        border: `1px solid rgba(${rgb},0.22)`,
                        boxShadow: `0 0 24px rgba(${rgb},0.18)`,
                      }}
                    >
                      <span className="text-2xl"
                        style={{ filter: `drop-shadow(0 0 12px ${s.color}) drop-shadow(0 0 24px ${s.color}50)` }}>
                        {s.icon}
                      </span>
                    </div>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-base font-light"
                          style={{ color: s.color, textShadow: `0 0 18px ${s.color}60` }}>
                          {s.label}
                        </p>
                        <span className="text-xs tabular-nums ml-3 flex-shrink-0"
                          style={{ color: "rgba(255,255,255,0.28)" }}>
                          Ур. {level}<span style={{ color: "rgba(255,255,255,0.15)" }}>/10</span>
                        </span>
                      </div>

                      {/* Level progress bar */}
                      <div className="h-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, rgba(${rgb},0.4), ${s.color})`,
                            boxShadow: `0 0 10px ${s.color}60`,
                          }}
                        />
                      </div>

                      {/* Task completion row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-[3px] rounded-full flex-1 min-w-[80px]"
                            style={{ background: "rgba(255,255,255,0.05)", width: 80 }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${completionPct}%`,
                                background: `linear-gradient(90deg, rgba(${rgb},0.5), ${s.color}cc)`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums"
                            style={{ color: `rgba(${rgb},0.75)` }}>
                            {doneCount}/{totalCount} задач
                          </span>
                        </div>
                        {totalCount > 0 && (
                          <span className="text-[10px] font-medium"
                            style={{ color: completionPct >= 80 ? "#86efac" : `rgba(${rgb},.60)` }}>
                            {completionPct}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    {doneCount > 0 && (
                      <button
                        onClick={() => setExpandedPriority(isExpanded ? null : slotIdx)}
                        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: isExpanded ? `rgba(${rgb},0.18)` : "rgba(255,255,255,0.04)",
                          border: `1px solid rgba(${rgb},${isExpanded ? "0.35" : "0.12"})`,
                          color: isExpanded ? s.color : "rgba(255,255,255,0.3)",
                          fontSize: 12,
                          transform: isExpanded ? "rotate(180deg)" : "none",
                          transition: "all 0.25s",
                        }}
                        title="Развернуть задачи"
                      >
                        ▾
                      </button>
                    )}
                  </div>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div
                      className="px-5 pb-5 flex flex-col gap-1.5"
                      style={{ borderTop: `1px solid rgba(${rgb},0.10)` }}
                    >
                      <p className="text-[8px] uppercase tracking-[0.18em] pt-3 pb-1"
                        style={{ color: `rgba(${rgb},0.45)` }}>
                        Выполнено за {monthName}
                      </p>
                      {sphereData.done.map(t => (
                        <div key={t.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl"
                          style={{
                            background: `rgba(${rgb},0.04)`,
                            border: `1px solid rgba(${rgb},0.09)`,
                          }}
                        >
                          <span style={{ color: s.color, fontSize: 10, flexShrink: 0 }}>✓</span>
                          <span className="flex-1 text-xs font-light truncate"
                            style={{ color: "rgba(255,255,255,0.55)" }}>
                            {t.text}
                          </span>
                          {t.completedAt && (
                            <span className="text-[9px] flex-shrink-0"
                              style={{ color: "rgba(255,255,255,0.18)" }}>
                              {t.completedAt.slice(5).replace("-", ".")}
                            </span>
                          )}
                          <span className="text-[9px] flex-shrink-0"
                            style={{ color: `rgba(${rgb},0.50)` }}>
                            +{t.xp}XP
                          </span>
                        </div>
                      ))}
                      {sphereData.all.filter(t => !t.done).length > 0 && (
                        <>
                          <p className="text-[8px] uppercase tracking-[0.18em] pt-2 pb-1"
                            style={{ color: "rgba(255,255,255,0.12)" }}>
                            В процессе
                          </p>
                          {sphereData.all.filter(t => !t.done).slice(0, 5).map(t => (
                            <div key={t.id}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, flexShrink: 0 }}>○</span>
                              <span className="flex-1 text-xs font-light truncate"
                                style={{ color: "rgba(255,255,255,0.30)" }}>
                                {t.text}
                              </span>
                              <span className="text-[9px] flex-shrink-0"
                                style={{ color: "rgba(255,255,255,0.12)" }}>
                                +{t.xp}XP
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Glow donut chart */}
      <section
        className="flex flex-col items-center rounded-[2rem] py-7"
        style={{
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <p className="text-[9px] uppercase tracking-[0.25em] mb-5 font-medium"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          Карта жизненного баланса
        </p>
        <GlowDonut levels={displayLevels} hovered={hovered} setHovered={setHovered} />
      </section>

      {/* ── Level controls */}
      <section>
        <p className="text-[9px] uppercase tracking-[0.25em] mb-4 font-medium"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          Уровни удовлетворённости
          {isArchiveMode && (
            <span className="ml-2 normal-case tracking-normal text-[8px]"
              style={{ color: "rgba(167,139,250,0.5)" }}>
              (архив)
            </span>
          )}
        </p>
        <div className="flex flex-col gap-2">
          {sphereKeys.map((key) => {
            const s = sphereColors[key];
            const level = displayLevels[key];
            const pct = (level / 10) * 100;
            const rgb = hexToRgb(s.color);
            const isHov = hovered === key;
            return (
              <div
                key={key}
                className="rounded-[1.5rem] px-5 py-4 flex items-center gap-4 transition-all duration-300"
                style={{
                  background: isHov ? `rgba(${rgb},0.08)` : "rgba(255,255,255,0.025)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid rgba(${rgb},${isHov ? "0.22" : "0.07"})`,
                  boxShadow: isHov ? `0 0 30px rgba(${rgb},0.10)` : "none",
                }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className="text-2xl flex-shrink-0 w-8 text-center transition-all duration-300"
                  style={{
                    filter: isHov
                      ? `drop-shadow(0 0 12px ${s.color}) drop-shadow(0 0 24px ${s.color}60)`
                      : `drop-shadow(0 0 4px ${s.color}40)`,
                  }}
                >
                  {s.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-light"
                      style={{ color: isHov ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }}>
                      {s.label}
                    </span>
                    <span className="text-xs font-bold tabular-nums transition-all duration-300"
                      style={{ color: s.color, textShadow: isHov ? `0 0 12px ${s.color}` : "none" }}>
                      {level}<span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>/10</span>
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-visible" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, rgba(${rgb},0.4), ${s.color})`,
                        boxShadow: isHov ? `0 0 12px ${s.color}70, 0 0 24px ${s.color}30` : `0 0 6px ${s.color}40`,
                        transition: "width 0.55s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s",
                      }}
                    />
                  </div>
                </div>

                {!isArchiveMode && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSphereLevel(key, level - 1)}
                      disabled={level === 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base font-light transition-all disabled:opacity-20"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: s.color,
                        border: `1px solid rgba(${rgb},0.20)`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 12px ${s.color}40`)}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >−</button>
                    <span className="text-base font-light tabular-nums w-5 text-center"
                      style={{ color: s.color, textShadow: isHov ? `0 0 10px ${s.color}` : "none" }}>
                      {level}
                    </span>
                    <button
                      onClick={() => setSphereLevel(key, level + 1)}
                      disabled={level === 10}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base font-light transition-all disabled:opacity-20"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: s.color,
                        border: `1px solid rgba(${rgb},0.20)`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 12px ${s.color}40`)}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >+</button>
                  </div>
                )}

                {isArchiveMode && (
                  <span
                    className="text-sm font-light tabular-nums flex-shrink-0 w-10 text-right"
                    style={{ color: s.color, textShadow: `0 0 10px ${s.color}60` }}
                  >
                    {level}<span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>/10</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
