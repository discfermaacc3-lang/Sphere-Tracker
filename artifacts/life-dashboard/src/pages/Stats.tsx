import { useRef, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

const SIZE = 340;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 130;
const MIN_R = 44;
const GAP_DEG = 3;
const SECTORS = sphereKeys.length;
const SECTOR_DEG = 360 / SECTORS;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number
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

    const DURATION = 450;
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

function DonutChart({ levels, hovered, setHovered }: {
  levels: Record<SphereKey, number>;
  hovered: SphereKey | null;
  setHovered: (k: SphereKey | null) => void;
}) {
  const animated = useAnimatedLevels(levels);
  const total = sphereKeys.reduce((sum, k) => sum + animated[k], 0);
  const avg = total / SECTORS;

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          {sphereKeys.map((key) => {
            const col = sphereColors[key].color;
            return (
              <radialGradient key={key} id={`grad-${key}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={col} stopOpacity="0.9" />
                <stop offset="100%" stopColor={col} stopOpacity="0.5" />
              </radialGradient>
            );
          })}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background track rings */}
        {sphereKeys.map((key, i) => {
          const start = i * SECTOR_DEG + GAP_DEG / 2;
          const end = (i + 1) * SECTOR_DEG - GAP_DEG / 2;
          const path = describeArc(CX, CY, MAX_R, MIN_R, start, end);
          return (
            <path
              key={`bg-${key}`}
              d={path}
              fill={sphereColors[key].color + "12"}
              stroke={sphereColors[key].color + "20"}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Filled sectors */}
        {sphereKeys.map((key, i) => {
          const level = animated[key];
          const ratio = level / 10;
          const outerR = MIN_R + (MAX_R - MIN_R) * ratio;
          const start = i * SECTOR_DEG + GAP_DEG / 2;
          const end = (i + 1) * SECTOR_DEG - GAP_DEG / 2;
          const path = describeArc(CX, CY, outerR, MIN_R, start, end);
          const isHov = hovered === key;
          return (
            <path
              key={key}
              d={path}
              fill={`url(#grad-${key})`}
              opacity={hovered && !isHov ? 0.35 : 1}
              filter={isHov ? "url(#glow)" : undefined}
              style={{ transition: "opacity 0.2s" }}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* Icon labels on outer edge */}
        {sphereKeys.map((key, i) => {
          const midDeg = i * SECTOR_DEG + SECTOR_DEG / 2;
          const labelR = MAX_R + 18;
          const pos = polarToXY(CX, CY, labelR, midDeg);
          return (
            <text
              key={`icon-${key}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              className="pointer-events-none"
              style={{ filter: hovered === key ? `drop-shadow(0 0 8px ${sphereColors[key].color})` : undefined }}
            >
              {sphereColors[key].icon}
            </text>
          );
        })}

        {/* Center: avg score */}
        <circle cx={CX} cy={CY} r={MIN_R - 4} fill="rgba(7,7,18,0.97)" />
        {hovered ? (
          <>
            <text x={CX} y={CY - 10} textAnchor="middle" fontSize="22" fontWeight="bold" fill={sphereColors[hovered].color}>
              {levels[hovered]}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">
              /10
            </text>
            <text x={CX} y={CY + 26} textAnchor="middle" fontSize="9" fill={sphereColors[hovered].color + "90"}>
              {sphereColors[hovered].label}
            </text>
          </>
        ) : (
          <>
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize="26" fontWeight="bold" fill="white" opacity="0.85">
              {avg.toFixed(1)}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">
              среднее
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export function Stats() {
  const { sphereLevels, setSphereLevel, tasks, prioritySpheres } = useStore();
  const [hovered, setHovered] = useState<SphereKey | null>(null);

  const sorted = [...sphereKeys].sort((a, b) => sphereLevels[b] - sphereLevels[a]);
  const leader = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const priorityKeys = prioritySpheres.filter(Boolean) as SphereKey[];
  const achievements = tasks.filter(
    (t) => t.done && (priorityKeys.length === 0 || priorityKeys.includes(t.sphere))
  );

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-10">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide pt-2">Статистика</h1>

      {/* Donut chart */}
      <section className="flex flex-col items-center">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-5 font-medium self-start">Карта жизненного баланса</p>
        <DonutChart levels={sphereLevels} hovered={hovered} setHovered={setHovered} />
      </section>

      {/* Level controls */}
      <section>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4 font-medium">Уровни удовлетворённости</p>
        <div className="flex flex-col gap-2">
          {sphereKeys.map((key) => {
            const s = sphereColors[key];
            const level = sphereLevels[key];
            const pct = (level / 10) * 100;
            return (
              <div
                key={key}
                className="rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all duration-200 cursor-default"
                style={{
                  borderColor: hovered === key ? s.color + "50" : s.color + "18",
                  background: hovered === key ? `${s.color}10` : "rgba(255,255,255,0.015)",
                }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Icon */}
                <span
                  className="text-2xl flex-shrink-0 w-8 text-center"
                  style={{ filter: `drop-shadow(0 0 6px ${s.color}80)` }}
                >
                  {s.icon}
                </span>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-white/70">{s.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>
                      {level}<span className="text-white/25">/10</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${s.color}80, ${s.color})`,
                        boxShadow: `0 0 8px ${s.color}50`,
                        transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSphereLevel(key, level - 1)}
                    disabled={level === 0}
                    className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: s.color,
                      border: `1px solid ${s.color}25`,
                    }}
                  >
                    −
                  </button>
                  <span
                    className="text-lg font-bold tabular-nums w-6 text-center"
                    style={{ color: s.color }}
                  >
                    {level}
                  </span>
                  <button
                    onClick={() => setSphereLevel(key, level + 1)}
                    disabled={level === 10}
                    className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: s.color,
                      border: `1px solid ${s.color}25`,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Month summary */}
      <section>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4 font-medium">Итоги месяца</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Leader */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{ borderColor: sphereColors[leader].color + "40", background: `${sphereColors[leader].color}0d` }}
          >
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Лидер месяца</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl" style={{ filter: `drop-shadow(0 0 10px ${sphereColors[leader].color})` }}>
                {sphereColors[leader].icon}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: sphereColors[leader].color }}>
                  {sphereColors[leader].label}
                </p>
                <p className="text-2xl font-bold text-white/80">{sphereLevels[leader]}<span className="text-sm text-white/30">/10</span></p>
              </div>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Отличный результат! Продолжай в том же духе.
            </p>
          </div>

          {/* Growth zone */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{ borderColor: sphereColors[weakest].color + "40", background: `${sphereColors[weakest].color}0d` }}
          >
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Зона роста</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl" style={{ filter: `drop-shadow(0 0 10px ${sphereColors[weakest].color})` }}>
                {sphereColors[weakest].icon}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: sphereColors[weakest].color }}>
                  {sphereColors[weakest].label}
                </p>
                <p className="text-2xl font-bold text-white/80">{sphereLevels[weakest]}<span className="text-sm text-white/30">/10</span></p>
              </div>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Уделить этой сфере больше внимания в следующем периоде.
            </p>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Мои достижения</p>
          {priorityKeys.length > 0 && (
            <div className="flex gap-1">
              {priorityKeys.map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ color: sphereColors[k].color, background: sphereColors[k].color + "20" }}>
                  {sphereColors[k].label}
                </span>
              ))}
            </div>
          )}
          {priorityKeys.length === 0 && (
            <span className="text-[10px] text-white/20">все выполненные задачи</span>
          )}
        </div>

        {achievements.length === 0 ? (
          <div
            className="rounded-2xl border border-white/5 p-6 text-center"
            style={{ background: "rgba(255,255,255,0.015)" }}
          >
            <p className="text-white/25 text-sm">Пока нет выполненных задач.</p>
            <p className="text-white/15 text-xs mt-1">
              {priorityKeys.length > 0
                ? "Выполни задачи из приоритетных сфер — они появятся здесь."
                : "Выполни любую задачу — она появится здесь."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {achievements.map((task) => {
              const s = sphereColors[task.sphere];
              return (
                <div
                  key={task.id}
                  className="rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{ borderColor: s.color + "25", background: `${s.color}07` }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: s.color + "30", border: `1px solid ${s.color}50` }}
                  >
                    <span className="text-xs" style={{ color: s.color }}>✓</span>
                  </div>
                  <span className="flex-1 text-sm text-white/65">{task.text}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: s.color, background: s.color + "18" }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
