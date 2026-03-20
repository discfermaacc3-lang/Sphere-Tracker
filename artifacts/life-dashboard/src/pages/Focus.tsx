import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

const PRESETS = [
  { label: "Помодоро",         minutes: 25, color: "#a78bfa" },
  { label: "Короткий перерыв", minutes: 5,  color: "#22d3ee" },
  { label: "Длинный перерыв",  minutes: 15, color: "#86efac" },
];

const FOCUS_XP = 15;

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function getTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function Focus() {
  const { addXP, focusHistory, addFocusSession } = useStore();

  const [presetIdx, setPresetIdx]   = useState(0);
  const [minutes, setMinutes]       = useState(25);
  const [seconds, setSeconds]       = useState(0);
  const [running, setRunning]       = useState(false);
  const [customMin, setCustomMin]   = useState("");
  const [showXPFloat, setShowXPFloat] = useState(false);

  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef   = useRef<string | null>(null);
  const sessionDurRef     = useRef(25);
  const prevRunningRef    = useRef(false);
  const completedRef      = useRef(false);

  const activePreset  = PRESETS[presetIdx];
  const color         = activePreset.color;
  const totalSecs     = minutes * 60 + seconds;
  const progress      = Math.max(0, 1 - totalSecs / (sessionDurRef.current * 60));

  const r             = 96;
  const circumference = 2 * Math.PI * r;
  const strokeDash    = circumference * progress;
  const done          = totalSecs === 0 && !running;

  // Inject breathing CSS once
  useEffect(() => {
    const id = "focus-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes focus-aura {
        0%, 100% {
          transform: scale(0.88);
          opacity: 0.52;
        }
        50% {
          transform: scale(1.22);
          opacity: 1;
        }
      }
      @keyframes focus-disc-glow {
        0%, 100% {
          box-shadow:
            0 0 40px 6px  rgba(167,139,250,0.13),
            0 0 80px 18px rgba(167,139,250,0.06),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        50% {
          box-shadow:
            0 0 70px 24px rgba(167,139,250,0.30),
            0 0 130px 50px rgba(34,211,238,0.10),
            inset 0 1px 0 rgba(255,255,255,0.07);
        }
      }
      @keyframes xp-float {
        0%   { opacity: 0;   transform: translate(-50%, 0)    scale(0.7); }
        15%  { opacity: 1;   transform: translate(-50%, -16px) scale(1.1); }
        70%  { opacity: 1;   transform: translate(-50%, -48px) scale(1); }
        100% { opacity: 0;   transform: translate(-50%, -72px) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // Track session start
  useEffect(() => {
    if (running && !prevRunningRef.current) {
      sessionStartRef.current = getTimeStr();
      completedRef.current    = false;
    }
    prevRunningRef.current = running;
  }, [running]);

  // Detect completion (totalSecs hits 0 while still running)
  useEffect(() => {
    if (totalSecs === 0 && running && !completedRef.current) {
      completedRef.current = true;
      const dur   = sessionDurRef.current;
      const start = sessionStartRef.current ?? getTimeStr();
      addXP(FOCUS_XP);
      addFocusSession({ date: getTodayStr(), startTime: start, durationMinutes: dur, xp: FOCUS_XP });
      setShowXPFloat(true);
      setTimeout(() => setShowXPFloat(false), 2000);
    }
  }, [totalSecs, running]);

  // Countdown interval
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
    sessionDurRef.current = PRESETS[idx].minutes;
  }

  const todayHistory   = focusHistory.filter((s) => s.date === getTodayStr());
  const totalMinToday  = todayHistory.reduce((a, s) => a + s.durationMinutes, 0);
  const totalXPToday   = todayHistory.reduce((a, s) => a + s.xp, 0);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <h1
          className="text-2xl font-light tracking-[0.25em] uppercase text-center w-full"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 40px rgba(167,139,250,0.40)" }}
        >
          Фокус
        </h1>

        {todayHistory.length > 0 && (
          <span className="text-xs font-light" style={{ color: "rgba(255,255,255,0.28)" }}>
            Сегодня:&nbsp;
            <span style={{ color: "#a78bfa" }}>{totalMinToday} мин</span>
            &nbsp;·&nbsp;
            <span style={{ color: "#fbbf24", textShadow: "0 0 8px rgba(251,191,36,0.5)" }}>
              +{totalXPToday} XP
            </span>
          </span>
        )}
      </div>

      {/* ── Centered content ── */}
      <div className="flex flex-col items-center gap-8">

        {/* Preset pills */}
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
                  color:      active ? p.color : "rgba(255,255,255,0.3)",
                  border:     `1px solid rgba(${hexToRgb(p.color)},${active ? "0.35" : "0"})`,
                  boxShadow:  active ? `0 0 20px rgba(${hexToRgb(p.color)},0.20)` : "none",
                  textShadow: active ? `0 0 10px ${p.color}` : "none",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* ── Timer circle ── */}
        <div className="relative" style={{ width: 240, height: 240 }}>

          {/* Breathing aura — lavender + mint, expands like inhale/exhale */}
          <div
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 300, height: 300,
              marginTop: -150, marginLeft: -150,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(167,139,250,0.22) 0%, rgba(34,211,238,0.09) 48%, transparent 70%)",
              animation: running
                ? "focus-aura 5s ease-in-out infinite"
                : "focus-aura 5s ease-in-out infinite paused",
              opacity: running ? 1 : 0.38,
              pointerEvents: "none",
            }}
          />

          {/* Glass disc — static size, only glow breathes */}
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 240, height: 240,
              background:    "rgba(255,255,255,0.025)",
              backdropFilter:"blur(20px)",
              border:        "1px solid rgba(255,255,255,0.06)",
              animation: running ? "focus-disc-glow 5s ease-in-out infinite" : "none",
              boxShadow: running
                ? undefined
                : "0 0 40px 6px rgba(167,139,250,0.10), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* SVG ring */}
            <svg width="240" height="240" style={{ position: "absolute", top: 0, left: 0 }}>
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={color} />
                </linearGradient>
                <filter id="timer-glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle cx="120" cy="120" r={r}
                fill="none"
                stroke={`rgba(${hexToRgb(color)},0.08)`}
                strokeWidth="3"
              />
              {/* Progress arc */}
              {progress > 0 && (
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

            {/* Time display */}
            <div className="relative text-center z-10">
              <div
                className="text-5xl font-light tabular-nums"
                style={{
                  color:      done ? color : "rgba(255,255,255,0.85)",
                  textShadow: done ? `0 0 30px ${color}` : "0 0 20px rgba(255,255,255,0.15)",
                  letterSpacing: "0.05em",
                  transition: "all 0.5s",
                }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div
                className="text-[10px] uppercase tracking-[0.2em] mt-2 transition-all"
                style={{
                  color:      running ? color : "rgba(255,255,255,0.2)",
                  textShadow: running ? `0 0 10px ${color}` : "none",
                }}
              >
                {done ? "✓ Готово" : running ? "В фокусе" : "Пауза"}
              </div>
            </div>

            {/* XP float */}
            {showXPFloat && (
              <div
                style={{
                  position:  "absolute",
                  bottom:    "28px",
                  left:      "50%",
                  animation: "xp-float 2s ease-out forwards",
                  pointerEvents: "none",
                  fontSize:  22,
                  fontWeight: 700,
                  color:     "#fbbf24",
                  textShadow: "0 0 24px rgba(251,191,36,0.9), 0 0 48px rgba(251,191,36,0.4)",
                  letterSpacing: "0.04em",
                  zIndex:    20,
                  whiteSpace: "nowrap",
                }}
              >
                +{FOCUS_XP} XP
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setRunning((v) => !v)}
            className="px-12 py-3 rounded-2xl text-sm font-light tracking-[0.1em] transition-all duration-300"
            style={{
              background: `rgba(${hexToRgb(color)},0.18)`,
              color,
              border:    `1px solid rgba(${hexToRgb(color)},0.30)`,
              boxShadow: `0 0 30px rgba(${hexToRgb(color)},0.15)`,
              textShadow:`0 0 10px ${color}`,
            }}
          >
            {running ? "Пауза" : "Старт"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setMinutes(PRESETS[presetIdx].minutes);
              setSeconds(0);
              completedRef.current = false;
            }}
            className="px-6 py-3 rounded-2xl text-sm font-light transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color:      "rgba(255,255,255,0.25)",
              border:     "1px solid rgba(255,255,255,0.07)",
            }}
          >
            ↺
          </button>
        </div>

        {/* Custom time */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.18)" }}>
            Своё время
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>

        <div className="flex gap-2 w-full max-w-xs">
          <input
            type="number"
            min={1} max={180}
            placeholder="Минуты..."
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(255,255,255,0.08)",
              color:      "rgba(255,255,255,0.55)",
            }}
          />
          <button
            onClick={() => {
              const m = parseInt(customMin);
              if (m > 0) {
                setRunning(false);
                setMinutes(m);
                setSeconds(0);
                sessionDurRef.current = m;
                completedRef.current  = false;
                setCustomMin("");
              }
            }}
            className="px-5 py-2.5 rounded-2xl text-sm transition-all"
            style={{
              background: "rgba(167,139,250,0.14)",
              color:      "#a78bfa",
              border:     "1px solid rgba(167,139,250,0.25)",
            }}
          >
            Задать
          </button>
        </div>

      </div>{/* end centered wrapper */}

      {/* ── История фокуса ── */}
      {todayHistory.length > 0 && (
        <div
          className="rounded-2xl border p-5 mt-2"
          style={{
            background:    "rgba(255,255,255,0.02)",
            backdropFilter:"blur(20px)",
            borderColor:   "rgba(255,255,255,0.06)",
          }}
        >
          {/* Block header */}
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-[9px] uppercase tracking-[0.28em] font-medium"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              История фокуса
            </p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.14)" }}>
              {todayHistory.length} {todayHistory.length === 1 ? "сессия" : todayHistory.length < 5 ? "сессии" : "сессий"}
            </p>
          </div>

          {/* Session rows */}
          <div className="flex flex-col gap-2">
            {[...todayHistory].reverse().map((session, idx) => (
              <div
                key={session.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                style={{
                  background:  "rgba(255,255,255,0.025)",
                  border:      "1px solid rgba(255,255,255,0.05)",
                  opacity: idx === 0 ? 1 : Math.max(0.5, 1 - idx * 0.12),
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 15, opacity: 0.7 }}>🎯</span>

                {/* Time info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-light"
                    style={{ color: "rgba(255,255,255,0.65)", letterSpacing: "0.02em" }}
                  >
                    {session.durationMinutes} мин
                    <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 6px" }}>·</span>
                    начало в {session.startTime}
                  </p>
                </div>

                {/* XP badge */}
                <span
                  className="text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-lg"
                  style={{
                    color:      "#fbbf24",
                    background: "rgba(251,191,36,0.10)",
                    border:     "1px solid rgba(251,191,36,0.20)",
                    textShadow: "0 0 10px rgba(251,191,36,0.5)",
                  }}
                >
                  +{session.xp} XP
                </span>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p
            className="text-[9px] text-center mt-4 uppercase tracking-[0.15em]"
            style={{ color: "rgba(255,255,255,0.12)" }}
          >
            очищается каждую полночь
          </p>
        </div>
      )}

    </div>
  );
}
