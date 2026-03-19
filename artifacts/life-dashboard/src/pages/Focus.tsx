import { useState, useEffect, useRef } from "react";

const PRESETS = [
  { label: "Помодоро",        minutes: 25, color: "#a78bfa" },
  { label: "Короткий перерыв", minutes: 5,  color: "#22d3ee" },
  { label: "Длинный перерыв", minutes: 15, color: "#86efac" },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

export function Focus() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activePreset = PRESETS[presetIdx];
  const color = activePreset.color;
  const totalSecs = minutes * 60 + seconds;
  const maxSecs = (PRESETS[presetIdx]?.minutes ?? 25) * 60;
  const progress = Math.max(0, 1 - totalSecs / maxSecs);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s === 0) {
            setMinutes((m) => {
              if (m === 0) { setRunning(false); return 0; }
              return m - 1;
            });
            return 59;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function selectPreset(idx: number) {
    setRunning(false);
    setPresetIdx(idx);
    setMinutes(PRESETS[idx].minutes);
    setSeconds(0);
  }

  const r = 96;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * progress;

  const done = totalSecs === 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.6)", textShadow: "0 0 30px rgba(167,139,250,0.3)" }}
        >
          Фокус
        </h1>
      </div>

      {/* Centered content wrapper */}
      <div className="flex flex-col items-center gap-8">

      {/* Presets */}
      <div className="flex gap-2">
        {PRESETS.map((p, i) => {
          const active = presetIdx === i;
          return (
            <button
              key={p.label}
              onClick={() => selectPreset(i)}
              className="text-xs px-4 py-1.5 rounded-full transition-all duration-300"
              style={{
                background: active ? `rgba(${hexToRgb(p.color)},0.14)` : "rgba(255,255,255,0.04)",
                color: active ? p.color : "rgba(255,255,255,0.3)",
                border: `1px solid rgba(${hexToRgb(p.color)},${active ? "0.35" : "0"})`,
                boxShadow: active ? `0 0 20px rgba(${hexToRgb(p.color)},0.20)` : "none",
                textShadow: active ? `0 0 10px ${p.color}` : "none",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Timer circle */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 240, height: 240,
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: `0 0 60px rgba(${hexToRgb(color)},0.10), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <svg width="240" height="240" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <filter id="timer-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="120" cy="120" r={r}
            fill="none"
            stroke={`rgba(${hexToRgb(color)},0.08)`}
            strokeWidth="3"
          />
          {/* Progress arc */}
          {!done && (
            <circle
              cx="120" cy="120" r={r}
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              filter="url(#timer-glow)"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "120px 120px",
                transition: "stroke-dashoffset 0.9s ease",
              }}
            />
          )}
        </svg>
        <div className="relative text-center z-10">
          <div
            className="text-5xl font-light tabular-nums"
            style={{
              color: done ? color : "rgba(255,255,255,0.85)",
              textShadow: done ? `0 0 30px ${color}` : "0 0 20px rgba(255,255,255,0.15)",
              letterSpacing: "0.05em",
              transition: "all 0.5s",
            }}
          >
            {String(minutes).padStart(2,"0")}:{String(seconds).padStart(2,"0")}
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.2em] mt-2 transition-all"
            style={{ color: running ? color : "rgba(255,255,255,0.2)", textShadow: running ? `0 0 10px ${color}` : "none" }}
          >
            {done ? "✓ Готово" : running ? "В фокусе" : "Пауза"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-12 py-3 rounded-2xl text-sm font-light tracking-[0.1em] transition-all"
          style={{
            background: `rgba(${hexToRgb(color)},0.18)`,
            color: color,
            border: `1px solid rgba(${hexToRgb(color)},0.30)`,
            boxShadow: `0 0 30px rgba(${hexToRgb(color)},0.15)`,
            textShadow: `0 0 10px ${color}`,
          }}
        >
          {running ? "Пауза" : "Старт"}
        </button>
        <button
          onClick={() => { setRunning(false); setMinutes(PRESETS[presetIdx].minutes); setSeconds(0); }}
          className="px-6 py-3 rounded-2xl text-sm font-light transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.25)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          ↺
        </button>
      </div>

      {/* Custom time */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
        <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.18)" }}>
          Своё время
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>

      <div className="flex gap-2 w-full">
        <input
          type="number"
          min={1}
          max={180}
          placeholder="Минуты..."
          value={customMin}
          onChange={(e) => setCustomMin(e.target.value)}
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.55)",
          }}
        />
        <button
          onClick={() => {
            const m = parseInt(customMin);
            if (m > 0) {
              setRunning(false);
              setMinutes(m);
              setSeconds(0);
              setCustomMin("");
            }
          }}
          className="px-5 py-2.5 rounded-2xl text-sm transition-all"
          style={{
            background: "rgba(167,139,250,0.14)",
            color: "#a78bfa",
            border: "1px solid rgba(167,139,250,0.25)",
          }}
        >
          Задать
        </button>
      </div>
      </div>{/* end centered content wrapper */}
    </div>
  );
}
