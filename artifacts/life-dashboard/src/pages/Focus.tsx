import { useState, useEffect, useRef } from "react";

const PRESETS = [
  { label: "Помодоро", minutes: 25 },
  { label: "Короткий перерыв", minutes: 5 },
  { label: "Длинный перерыв", minutes: 15 },
];

export function Focus() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSecs = minutes * 60 + seconds;
  const maxSecs = 25 * 60;
  const progress = 1 - totalSecs / maxSecs;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s === 0) {
            setMinutes((m) => {
              if (m === 0) {
                setRunning(false);
                return 0;
              }
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

  function setPreset(m: number) {
    setRunning(false);
    setMinutes(m);
    setSeconds(0);
  }

  const r = 90;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-8 max-w-lg mx-auto pb-10 pt-4">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide self-start">Фокус</h1>

      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPreset(p.minutes)}
            className="text-xs px-4 py-1.5 rounded-full transition-all"
            style={{
              background: minutes === p.minutes ? "#6366f130" : "rgba(255,255,255,0.05)",
              color: minutes === p.minutes ? "#6366f1" : "rgba(255,255,255,0.4)",
              border: `1px solid ${minutes === p.minutes ? "#6366f160" : "transparent"}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220">
          <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="110" cy="110" r={r}
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{ transform: "rotate(-90deg)", transformOrigin: "110px 110px", transition: "stroke-dashoffset 0.9s ease" }}
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-center">
          <div className="text-5xl font-bold text-white tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-white/30 mt-1">{running ? "Фокус" : "Пауза"}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-10 py-3 rounded-2xl text-sm font-semibold transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
        >
          {running ? "Пауза" : "Старт"}
        </button>
        <button
          onClick={() => { setRunning(false); setMinutes(25); setSeconds(0); }}
          className="px-6 py-3 rounded-2xl text-sm font-medium text-white/40 hover:text-white/60 transition-colors border border-white/10"
        >
          Сброс
        </button>
      </div>
    </div>
  );
}
