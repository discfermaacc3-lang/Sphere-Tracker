import { useRef, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

const SIZE = 340;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 130;
const MIN_R = 46;
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

function describeRing(cx: number, cy: number, r: number, startDeg: number, endDeg: number, strokeWidth: number) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
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
            const rgb = hexToRgb(col);
            return (
              <linearGradient key={key} id={`ring-grad-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={col} stopOpacity="0.9" />
                <stop offset="100%" stopColor={col} stopOpacity="0.4" />
              </linearGradient>
            );
          })}
          {/* Glow filters per sphere */}
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

        {/* Track rings (background) */}
        {sphereKeys.map((key, i) => {
          const col = sphereColors[key].color;
          const start = i * SECTOR_DEG + GAP_DEG / 2;
          const end = (i + 1) * SECTOR_DEG - GAP_DEG / 2;
          const path = describeArc(CX, CY, MAX_R, MIN_R, start, end);
          return (
            <path
              key={`bg-${key}`}
              d={path}
              fill={`rgba(${hexToRgb(col)},0.06)`}
              stroke={`rgba(${hexToRgb(col)},0.15)`}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Neon ring segments */}
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
              {/* Glow layer (blurred, wider) */}
              <path
                d={path}
                fill={`rgba(${hexToRgb(col)},0.25)`}
                filter={`url(#glow-${key})`}
                opacity={isHov ? 1 : 0.7}
                style={{ transition: "opacity 0.3s" }}
              />
              {/* Solid ring */}
              <path
                d={path}
                fill={`rgba(${hexToRgb(col)},0.75)`}
                opacity={hovered && !isHov ? 0.3 : 1}
                style={{ transition: "opacity 0.25s", cursor: "pointer" }}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        {/* Icon labels on outer edge */}
        {sphereKeys.map((key, i) => {
          const midDeg = i * SECTOR_DEG + SECTOR_DEG / 2;
          const labelR = MAX_R + 20;
          const pos = polarToXY(CX, CY, labelR, midDeg);
          const isHov = hovered === key;
          return (
            <text
              key={`icon-${key}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
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

        {/* Center circle */}
        <circle cx={CX} cy={CY} r={MIN_R - 5}
          fill="rgba(16,12,38,0.95)"
          style={{ filter: "url(#center-glow)" }}
        />
        <circle cx={CX} cy={CY} r={MIN_R - 5}
          fill="rgba(16,12,38,0.98)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />

        {hovered ? (
          <>
            <text x={CX} y={CY - 10} textAnchor="middle" fontSize="24" fontWeight="300"
              fill={sphereColors[hovered].color}
              style={{ filter: `drop-shadow(0 0 12px ${sphereColors[hovered].color})` }}
            >
              {levels[hovered]}
            </text>
            <text x={CX} y={CY + 9} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">
              /10
            </text>
            <text x={CX} y={CY + 25} textAnchor="middle" fontSize="9" fill={sphereColors[hovered].color + "90"}>
              {sphereColors[hovered].label}
            </text>
          </>
        ) : (
          <>
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize="28" fontWeight="200"
              fill="white" opacity="0.8"
              style={{ textShadow: "0 0 30px rgba(255,255,255,0.5)" }}
            >
              {avg.toFixed(1)}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)"
              letterSpacing="2"
            >
              СРЕДНЕЕ
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

      {/* Header */}
      <h1
        className="text-xl font-light tracking-[0.15em] uppercase pt-2"
        style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
      >
        Статистика
      </h1>

      {/* Glow donut chart */}
      <section
        className="flex flex-col items-center rounded-[2rem] py-8"
        style={{
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <p className="text-[9px] uppercase tracking-[0.25em] mb-6 font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
          Карта жизненного баланса
        </p>
        <GlowDonut levels={sphereLevels} hovered={hovered} setHovered={setHovered} />
      </section>

      {/* Level controls — elegant */}
      <section>
        <p className="text-[9px] uppercase tracking-[0.25em] mb-4 font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
          Уровни удовлетворённости
        </p>
        <div className="flex flex-col gap-2">
          {sphereKeys.map((key) => {
            const s = sphereColors[key];
            const level = sphereLevels[key];
            const pct = (level / 10) * 100;
            const isHov = hovered === key;
            return (
              <div
                key={key}
                className="rounded-[1.5rem] px-5 py-4 flex items-center gap-4 transition-all duration-300 cursor-default"
                style={{
                  background: isHov
                    ? `rgba(${hexToRgb(s.color)},0.08)`
                    : "rgba(255,255,255,0.025)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid rgba(${hexToRgb(s.color)},${isHov ? "0.22" : "0.07"})`,
                  boxShadow: isHov ? `0 0 30px rgba(${hexToRgb(s.color)},0.10)` : "none",
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
                    <span
                      className="text-sm font-light"
                      style={{
                        color: isHov ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.5)",
                        textShadow: isHov ? "0 0 14px rgba(255,255,255,0.2)" : "none",
                        transition: "all 0.3s",
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums transition-all duration-300"
                      style={{
                        color: s.color,
                        textShadow: isHov ? `0 0 12px ${s.color}` : "none",
                      }}
                    >
                      {level}<span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 300 }}>/10</span>
                    </span>
                  </div>
                  {/* Neon progress bar */}
                  <div className="h-1 rounded-full overflow-visible" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full relative"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, rgba(${hexToRgb(s.color)},0.4), ${s.color})`,
                        boxShadow: isHov ? `0 0 12px ${s.color}70, 0 0 24px ${s.color}30` : `0 0 6px ${s.color}40`,
                        transition: "width 0.55s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s",
                      }}
                    />
                  </div>
                </div>

                {/* Elegant controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSphereLevel(key, level - 1)}
                    disabled={level === 0}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base font-light transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: s.color,
                      border: `1px solid rgba(${hexToRgb(s.color)},0.20)`,
                      boxShadow: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 12px ${s.color}40`)}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    −
                  </button>
                  <span
                    className="text-base font-light tabular-nums w-5 text-center transition-all"
                    style={{
                      color: s.color,
                      textShadow: isHov ? `0 0 10px ${s.color}` : "none",
                    }}
                  >
                    {level}
                  </span>
                  <button
                    onClick={() => setSphereLevel(key, level + 1)}
                    disabled={level === 10}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base font-light transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: s.color,
                      border: `1px solid rgba(${hexToRgb(s.color)},0.20)`,
                      boxShadow: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 12px ${s.color}40`)}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
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
        <p className="text-[9px] uppercase tracking-[0.25em] mb-4 font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
          Итоги месяца
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { sphere: leader, title: "Лидер месяца", note: "Отличный результат! Продолжай в том же духе." },
            { sphere: weakest, title: "Зона роста", note: "Уделить этой сфере больше внимания в следующем периоде." },
          ].map(({ sphere, title, note }) => {
            const s = sphereColors[sphere];
            return (
              <div
                key={sphere}
                className="rounded-[1.75rem] p-5 flex flex-col gap-3 relative overflow-hidden"
                style={{
                  background: `rgba(${hexToRgb(s.color)},0.06)`,
                  backdropFilter: "blur(20px)",
                  border: `1px solid rgba(${hexToRgb(s.color)},0.16)`,
                  boxShadow: `0 0 40px rgba(${hexToRgb(s.color)},0.06)`,
                }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full"
                  style={{
                    background: `radial-gradient(circle, rgba(${hexToRgb(s.color)},0.18) 0%, transparent 70%)`,
                    filter: "blur(16px)",
                    transform: "translate(30%,-30%)",
                  }}
                />
                <p className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{ color: "rgba(255,255,255,0.22)" }}>
                  {title}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className="text-3xl"
                    style={{ filter: `drop-shadow(0 0 14px ${s.color}) drop-shadow(0 0 28px ${s.color}50)` }}
                  >
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-sm font-light" style={{ color: s.color, textShadow: `0 0 14px ${s.color}60` }}>
                      {s.label}
                    </p>
                    <p className="text-2xl font-light" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {sphereLevels[sphere]}
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>/10</span>
                    </p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {note}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[9px] uppercase tracking-[0.25em] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
            Достижения
          </p>
          {priorityKeys.length > 0 && (
            <div className="flex gap-1.5">
              {priorityKeys.map((k) => (
                <span
                  key={k}
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{
                    color: sphereColors[k].color,
                    background: `rgba(${hexToRgb(sphereColors[k].color)},0.12)`,
                    border: `1px solid rgba(${hexToRgb(sphereColors[k].color)},0.25)`,
                    textShadow: `0 0 8px ${sphereColors[k].color}`,
                  }}
                >
                  {sphereColors[k].label}
                </span>
              ))}
            </div>
          )}
        </div>

        {achievements.length === 0 ? (
          <div
            className="rounded-[1.5rem] p-6 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.2)" }}>
              Пока нет выполненных задач
            </p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.1)" }}>
              Выполни задачу — она появится здесь
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {achievements.map((task) => {
              const s = sphereColors[task.sphere];
              return (
                <div
                  key={task.id}
                  className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
                  style={{
                    background: `rgba(${hexToRgb(s.color)},0.05)`,
                    border: `1px solid rgba(${hexToRgb(s.color)},0.14)`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `rgba(${hexToRgb(s.color)},0.2)`,
                      boxShadow: `0 0 10px rgba(${hexToRgb(s.color)},0.3)`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: s.color }}>✓</span>
                  </div>
                  <span className="flex-1 text-sm font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {task.text}
                  </span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      color: s.color,
                      background: `rgba(${hexToRgb(s.color)},0.12)`,
                      textShadow: `0 0 8px ${s.color}60`,
                    }}
                  >
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
