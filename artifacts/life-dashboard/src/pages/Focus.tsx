import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

/* ─── constants ──────────────────────────────────────────── */
const TIMER_MODES = [
  { label: "Помодоро", minutes: 25, color: "#a78bfa", rgb: "167,139,250", type: "pomodoro" as const, givesXP: true  },
  { label: "Короткий", minutes: 5,  color: "#22d3ee", rgb: "34,211,238",  type: "short"    as const, givesXP: false },
  { label: "Длинный",  minutes: 15, color: "#86efac", rgb: "134,239,172", type: "long"     as const, givesXP: false },
];

const BREATH_PHASES = [
  { key: "inhale" as const, label: "Вдох",     ms: 4000, scale: 1.18, glowOp: 0.32 },
  { key: "hold"   as const, label: "Задержка", ms: 2000, scale: 1.18, glowOp: 0.32 },
  { key: "exhale" as const, label: "Выдох",    ms: 4000, scale: 0.78, glowOp: 0.07 },
];

const FOCUS_XP   = 15;
const LAV_RGB    = "167,139,250";
const MINT_RGB   = "34,211,238";
const RING_R     = 96;
const CIRCUMF    = 2 * Math.PI * RING_R;

/* ─── helpers ────────────────────────────────────────────── */
function getTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}
function getTodayStr() { return new Date().toISOString().slice(0,10); }

/* ─── component ──────────────────────────────────────────── */
export function Focus() {
  const { addXP, focusHistory, addFocusSession } = useStore();

  /* mode: 0-2 = timer, 3 = breath */
  const [modeIdx, setModeIdx]             = useState(0);
  const isBreath                          = modeIdx === 3;
  const timerMode                         = TIMER_MODES[Math.min(modeIdx, 2)];
  const color                             = isBreath ? "#a78bfa" : timerMode.color;
  const rgb                               = isBreath ? LAV_RGB   : timerMode.rgb;

  /* timer */
  const [minutes, setMinutes]             = useState(25);
  const [seconds, setSeconds]             = useState(0);
  const [running, setRunning]             = useState(false);
  const [showXPFloat, setShowXPFloat]     = useState(false);
  const intervalRef                       = useRef<ReturnType<typeof setInterval>|null>(null);
  const sessionStartRef                   = useRef<string|null>(null);
  const sessionDurRef                     = useRef(25);
  const prevRunningRef                    = useRef(false);
  const completedRef                      = useRef(false);

  /* custom time stepper */
  const [customMin, setCustomMin]         = useState(25);
  const holdRef                           = useRef<ReturnType<typeof setInterval>|null>(null);

  /* breath */
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase]     = useState<"inhale"|"hold"|"exhale">("inhale");
  const breathTimerRef                    = useRef<ReturnType<typeof setTimeout>|null>(null);

  /* progress ring */
  const totalSecs  = minutes * 60 + seconds;
  const progress   = Math.max(0, 1 - totalSecs / (sessionDurRef.current * 60));
  const strokeDash = CIRCUMF * progress;
  const done       = totalSecs === 0 && !running;

  /* ── inject CSS once ── */
  useEffect(() => {
    const id = "focus-keyframes";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes xp-float {
        0%   { opacity:0; transform:translate(-50%,0)    scale(.7); }
        15%  { opacity:1; transform:translate(-50%,-14px) scale(1.1); }
        70%  { opacity:1; transform:translate(-50%,-44px) scale(1); }
        100% { opacity:0; transform:translate(-50%,-68px) scale(.9); }
      }
      @keyframes focus-aura {
        0%,100% { transform:scale(.88); opacity:.5; }
        50%     { transform:scale(1.22); opacity:1; }
      }
      @keyframes focus-disc-glow {
        0%,100% { box-shadow:0 0 40px 6px rgba(${LAV_RGB},.12),0 0 80px 18px rgba(${LAV_RGB},.05),inset 0 1px 0 rgba(255,255,255,.06); }
        50%     { box-shadow:0 0 70px 24px rgba(${LAV_RGB},.28),0 0 130px 50px rgba(${MINT_RGB},.09),inset 0 1px 0 rgba(255,255,255,.07); }
      }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  /* ── breath phase machine ── */
  useEffect(() => {
    if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    if (!isBreath || !breathRunning) return;

    function advance(phase: "inhale"|"hold"|"exhale") {
      setBreathPhase(phase);
      const p = BREATH_PHASES.find(x => x.key === phase)!;
      const next = phase === "inhale" ? "hold" : phase === "hold" ? "exhale" : "inhale";
      breathTimerRef.current = setTimeout(() => advance(next), p.ms);
    }
    setBreathPhase("inhale");
    breathTimerRef.current = setTimeout(() => advance("hold"), BREATH_PHASES[0].ms);
    return () => { if (breathTimerRef.current) clearTimeout(breathTimerRef.current); };
  }, [isBreath, breathRunning]);

  /* ── session start tracking ── */
  useEffect(() => {
    if (running && !prevRunningRef.current) {
      sessionStartRef.current = getTimeStr();
      completedRef.current    = false;
    }
    prevRunningRef.current = running;
  }, [running]);

  /* ── completion detection ── */
  useEffect(() => {
    if (totalSecs === 0 && running && !completedRef.current) {
      completedRef.current = true;
      if (timerMode.givesXP) {
        addXP(FOCUS_XP);
        setShowXPFloat(true);
        setTimeout(() => setShowXPFloat(false), 2000);
      }
      addFocusSession({
        date:            getTodayStr(),
        startTime:       sessionStartRef.current ?? getTimeStr(),
        durationMinutes: sessionDurRef.current,
        xp:              timerMode.givesXP ? FOCUS_XP : 0,
        type:            timerMode.type,
      });
    }
  }, [totalSecs, running]);

  /* ── countdown interval ── */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s === 0) {
            setMinutes(m => {
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

  /* ── helpers ── */
  function selectMode(idx: number) {
    setRunning(false);
    setBreathRunning(false);
    if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    setModeIdx(idx);
    if (idx < 3) {
      const m = TIMER_MODES[idx];
      setMinutes(m.minutes);
      setSeconds(0);
      sessionDurRef.current = m.minutes;
    }
    completedRef.current = false;
    setBreathPhase("inhale");
  }

  function resetTimer() {
    setRunning(false);
    const base = isBreath ? 0 : TIMER_MODES[modeIdx]?.minutes ?? 25;
    setMinutes(base);
    setSeconds(0);
    completedRef.current = false;
  }

  /* stepper with hold-to-repeat */
  function startHold(delta: number) {
    setCustomMin(v => Math.max(1, Math.min(180, v + delta)));
    holdRef.current = setInterval(() => {
      setCustomMin(v => Math.max(1, Math.min(180, v + delta)));
    }, 130);
  }
  function stopHold() {
    if (holdRef.current) clearInterval(holdRef.current);
  }

  function applyCustomTime() {
    setRunning(false);
    setMinutes(customMin);
    setSeconds(0);
    sessionDurRef.current = customMin;
    completedRef.current  = false;
  }

  /* ── today stats ── */
  const todayStr     = getTodayStr();
  const todaySessions = focusHistory.filter(s => s.date === todayStr);
  const pomodoros    = todaySessions.filter(s => s.type === "pomodoro" || (!s.type && s.xp > 0));
  const shortBreaks  = todaySessions.filter(s => s.type === "short");
  const longBreaks   = todaySessions.filter(s => s.type === "long");
  const totalFocusMin = pomodoros.reduce((a, s) => a + s.durationMinutes, 0);
  const totalXPToday  = pomodoros.reduce((a, s) => a + s.xp, 0);

  /* ── breath visuals ── */
  const bPhase  = BREATH_PHASES.find(p => p.key === breathPhase)!;
  const bScale  = breathRunning ? bPhase.scale : 1.0;
  const bGlow   = breathRunning ? bPhase.glowOp : 0.06;
  const bTrans  = breathPhase === "hold"
    ? "transform 0.4s ease, box-shadow 0.4s ease"
    : "transform 4s ease-in-out, box-shadow 4s ease-in-out";

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* ── header ── */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <h1
          className="text-2xl font-light tracking-[0.28em] uppercase text-center w-full"
          style={{ color:"rgba(255,255,255,0.65)", textShadow:`0 0 40px rgba(${LAV_RGB},0.40)` }}
        >
          Фокус
        </h1>
        {totalFocusMin > 0 && (
          <span className="text-xs font-light" style={{ color:"rgba(255,255,255,0.28)" }}>
            Сегодня:&nbsp;
            <span style={{ color:"#a78bfa" }}>{totalFocusMin} мин</span>
            {totalXPToday > 0 && <>
              &nbsp;·&nbsp;
              <span style={{ color:"#fbbf24", textShadow:"0 0 8px rgba(251,191,36,0.5)" }}>
                +{totalXPToday} XP
              </span>
            </>}
          </span>
        )}
      </div>

      {/* ── centered content ── */}
      <div className="flex flex-col items-center gap-8">

        {/* mode tabs */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {TIMER_MODES.map((m, i) => {
            const act = modeIdx === i;
            return (
              <button key={m.label} onClick={() => selectMode(i)}
                className="text-xs px-4 py-1.5 rounded-full transition-all duration-300"
                style={{
                  background: act ? `rgba(${m.rgb},.14)` : "rgba(255,255,255,.04)",
                  color:      act ? m.color : "rgba(255,255,255,.3)",
                  border:     `1px solid rgba(${m.rgb},${act ? ".35" : "0"})`,
                  boxShadow:  act ? `0 0 20px rgba(${m.rgb},.20)` : "none",
                  textShadow: act ? `0 0 10px ${m.color}` : "none",
                }}
              >{m.label}</button>
            );
          })}

          {/* breath tab */}
          {(() => {
            const act = modeIdx === 3;
            return (
              <button onClick={() => selectMode(3)}
                className="text-xs px-4 py-1.5 rounded-full transition-all duration-300"
                style={{
                  background: act ? `rgba(${LAV_RGB},.14)` : "rgba(255,255,255,.04)",
                  color:      act ? "#a78bfa" : "rgba(255,255,255,.3)",
                  border:     `1px solid rgba(${LAV_RGB},${act ? ".35" : "0"})`,
                  boxShadow:  act ? `0 0 20px rgba(${LAV_RGB},.20)` : "none",
                  textShadow: act ? `0 0 10px #a78bfa` : "none",
                  letterSpacing: "0.08em",
                }}
              >Дыхание</button>
            );
          })()}
        </div>

        {/* ── circle ── */}
        <div className="relative flex items-center justify-center" style={{ width:240, height:240 }}>

          {/* aura glow */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            width:310, height:310, marginTop:-155, marginLeft:-155,
            borderRadius:"50%",
            background:`radial-gradient(circle, rgba(${LAV_RGB},0.20) 0%, rgba(${MINT_RGB},0.08) 48%, transparent 70%)`,
            animation: (!isBreath && running)
              ? "focus-aura 5s ease-in-out infinite"
              : "none",
            opacity: (!isBreath && running) ? 1 : 0.32,
            transform: isBreath ? `scale(${bScale})` : "none",
            transition: isBreath ? bTrans : "none",
            pointerEvents:"none",
          }}/>

          {/* glass disc */}
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width:240, height:240,
              background:    "rgba(255,255,255,.025)",
              backdropFilter:"blur(20px)",
              border:        "1px solid rgba(255,255,255,.06)",
              transform: isBreath ? `scale(${bScale})` : "none",
              transition: isBreath ? bTrans : "none",
              animation: (!isBreath && running) ? "focus-disc-glow 5s ease-in-out infinite" : "none",
              boxShadow: isBreath
                ? `0 0 ${50 + bGlow * 200}px ${20 + bGlow * 80}px rgba(${LAV_RGB},${bGlow}), inset 0 1px 0 rgba(255,255,255,.06)`
                : running
                  ? undefined
                  : `0 0 40px 6px rgba(${LAV_RGB},.10), inset 0 1px 0 rgba(255,255,255,.06)`,
            }}
          >
            {/* SVG ring — only for timer modes */}
            {!isBreath && (
              <svg width="240" height="240" style={{ position:"absolute", top:0, left:0 }}>
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity=".5" />
                    <stop offset="100%" stopColor={color} />
                  </linearGradient>
                  <filter id="timer-glow">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <circle cx="120" cy="120" r={RING_R} fill="none" stroke={`rgba(${rgb},.08)`} strokeWidth="3"/>
                {progress > 0 && (
                  <circle cx="120" cy="120" r={RING_R} fill="none"
                    stroke="url(#timerGrad)" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={CIRCUMF} strokeDashoffset={CIRCUMF - strokeDash}
                    filter="url(#timer-glow)"
                    style={{ transform:"rotate(-90deg)", transformOrigin:"120px 120px", transition:"stroke-dashoffset .9s ease" }}
                  />
                )}
              </svg>
            )}

            {/* center text */}
            <div className="relative text-center z-10 select-none">
              {isBreath ? (
                <>
                  <div className="text-3xl font-light tracking-[0.12em]"
                    style={{
                      color: "#a78bfa",
                      textShadow:`0 0 30px rgba(${LAV_RGB},.7)`,
                      transition:"all .6s ease",
                      opacity: breathRunning ? 1 : 0.35,
                    }}
                  >
                    {breathRunning ? bPhase.label : "✦"}
                  </div>
                  {breathRunning && (
                    <div className="text-[9px] uppercase tracking-[0.22em] mt-2"
                      style={{ color:`rgba(${LAV_RGB},.45)` }}
                    >
                      {breathPhase === "inhale" ? "4 сек" : breathPhase === "hold" ? "2 сек" : "4 сек"}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-5xl font-light tabular-nums"
                    style={{
                      color:         done ? color : "rgba(255,255,255,.85)",
                      textShadow:    done ? `0 0 30px ${color}` : "0 0 20px rgba(255,255,255,.15)",
                      letterSpacing: "0.05em",
                      transition:    "all .5s",
                    }}
                  >
                    {String(minutes).padStart(2,"0")}:{String(seconds).padStart(2,"0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] mt-2 transition-all"
                    style={{ color:running ? color:"rgba(255,255,255,.2)", textShadow:running?`0 0 10px ${color}`:"none" }}
                  >
                    {done ? "✓ Готово" : running ? "В фокусе" : "Пауза"}
                  </div>
                </>
              )}
            </div>

            {/* XP float (pomodoro only) */}
            {showXPFloat && (
              <div style={{
                position:"absolute", bottom:"28px", left:"50%",
                animation:"xp-float 2s ease-out forwards",
                pointerEvents:"none", fontSize:22, fontWeight:700,
                color:"#fbbf24",
                textShadow:"0 0 24px rgba(251,191,36,.9),0 0 48px rgba(251,191,36,.4)",
                letterSpacing:"0.04em", zIndex:20, whiteSpace:"nowrap",
              }}>
                +{FOCUS_XP} XP
              </div>
            )}
          </div>
        </div>

        {/* ── controls ── */}
        <div className="flex gap-3">
          {isBreath ? (
            <>
              <button
                onClick={() => setBreathRunning(v => !v)}
                className="px-12 py-3 rounded-2xl text-sm font-light tracking-[0.1em] transition-all duration-300"
                style={{
                  background:`rgba(${LAV_RGB},.18)`, color:"#a78bfa",
                  border:`1px solid rgba(${LAV_RGB},.30)`,
                  boxShadow:`0 0 30px rgba(${LAV_RGB},.15)`,
                  textShadow:`0 0 10px #a78bfa`,
                }}
              >
                {breathRunning ? "Пауза" : "Начать"}
              </button>
              <button
                onClick={() => { setBreathRunning(false); setBreathPhase("inhale"); if(breathTimerRef.current) clearTimeout(breathTimerRef.current); }}
                className="px-6 py-3 rounded-2xl text-sm font-light transition-all"
                style={{ background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.25)", border:"1px solid rgba(255,255,255,.07)" }}
              >↺</button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRunning(v => !v)}
                className="px-12 py-3 rounded-2xl text-sm font-light tracking-[0.1em] transition-all duration-300"
                style={{
                  background:`rgba(${rgb},.18)`, color,
                  border:`1px solid rgba(${rgb},.30)`,
                  boxShadow:`0 0 30px rgba(${rgb},.15)`,
                  textShadow:`0 0 10px ${color}`,
                }}
              >
                {running ? "Пауза" : "Старт"}
              </button>
              <button
                onClick={resetTimer}
                className="px-6 py-3 rounded-2xl text-sm font-light transition-all"
                style={{ background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.25)", border:"1px solid rgba(255,255,255,.07)" }}
              >↺</button>
            </>
          )}
        </div>

        {/* ── custom time stepper (timer modes only) ── */}
        {!isBreath && (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">

            {/* divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,.05)" }}/>
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color:"rgba(255,255,255,.18)" }}>
                Своё время
              </span>
              <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,.05)" }}/>
            </div>

            {/* stepper row */}
            <div className="flex items-center gap-4">
              {/* minus */}
              <button
                onPointerDown={() => startHold(-1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                className="w-10 h-10 rounded-xl text-xl font-light flex items-center justify-center transition-all active:scale-90 select-none"
                style={{
                  background:"rgba(167,139,250,.10)",
                  color:"#a78bfa",
                  border:"1px solid rgba(167,139,250,.25)",
                  boxShadow:"0 0 12px rgba(167,139,250,.10)",
                }}
              >−</button>

              {/* display */}
              <div className="text-center min-w-[80px]">
                <span
                  className="text-4xl font-light tabular-nums"
                  style={{
                    color:"rgba(255,255,255,.82)",
                    textShadow:`0 0 20px rgba(${LAV_RGB},.30)`,
                    letterSpacing:"0.04em",
                  }}
                >
                  {String(customMin).padStart(2,"0")}
                </span>
                <div className="text-[9px] uppercase tracking-[0.18em] mt-0.5" style={{ color:"rgba(255,255,255,.22)" }}>
                  минут
                </div>
              </div>

              {/* plus */}
              <button
                onPointerDown={() => startHold(1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                className="w-10 h-10 rounded-xl text-xl font-light flex items-center justify-center transition-all active:scale-90 select-none"
                style={{
                  background:"rgba(167,139,250,.10)",
                  color:"#a78bfa",
                  border:"1px solid rgba(167,139,250,.25)",
                  boxShadow:"0 0 12px rgba(167,139,250,.10)",
                }}
              >+</button>
            </div>

            {/* apply */}
            <button
              onClick={applyCustomTime}
              className="px-8 py-2 rounded-2xl text-xs tracking-[0.12em] transition-all"
              style={{
                background:"rgba(167,139,250,.12)",
                color:"#a78bfa",
                border:"1px solid rgba(167,139,250,.22)",
              }}
            >
              Задать
            </button>
          </div>
        )}

        {/* breathing mode hint */}
        {isBreath && !breathRunning && (
          <p className="text-xs text-center" style={{ color:"rgba(255,255,255,.2)", maxWidth:200, lineHeight:1.7 }}>
            Следуй за кругом.<br/>
            <span style={{ color:"rgba(167,139,250,.5)" }}>Вдох · Задержка · Выдох</span>
          </p>
        )}

      </div>{/* end centered */}

      {/* ══════════════ ИСТОРИЯ ДНЯ ══════════════ */}
      {todaySessions.length > 0 && (
        <div
          className="rounded-2xl border p-5 mt-2 w-full max-w-xs mx-auto"
          style={{
            background:"rgba(255,255,255,.02)",
            backdropFilter:"blur(20px)",
            borderColor:"rgba(255,255,255,.06)",
          }}
        >
          {/* block header */}
          <p
            className="text-[9px] uppercase tracking-[0.28em] font-medium text-center mb-4"
            style={{ color:"rgba(255,255,255,.25)" }}
          >
            История дня
          </p>

          {/* summary stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon:"🍅", value:pomodoros.length,   label:"Помодоро",   color:"#a78bfa" },
              { icon:"☕", value:shortBreaks.length,  label:"Короткий",   color:"#22d3ee" },
              { icon:"🌿", value:longBreaks.length,   label:"Длинный",    color:"#86efac" },
            ].map(stat => (
              <div key={stat.label}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl"
                style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)" }}
              >
                <span style={{ fontSize:14 }}>{stat.icon}</span>
                <span className="text-xl font-light" style={{ color:stat.color, textShadow:`0 0 14px ${stat.color}60` }}>
                  {stat.value}
                </span>
                <span className="text-[8px] uppercase tracking-[0.12em]" style={{ color:"rgba(255,255,255,.2)" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* total focus time */}
          {totalFocusMin > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
              style={{ background:"rgba(167,139,250,.06)", border:"1px solid rgba(167,139,250,.12)" }}
            >
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color:"rgba(255,255,255,.3)" }}>
                Время фокуса
              </span>
              <span className="text-sm font-light" style={{ color:"#a78bfa", textShadow:`0 0 12px rgba(${LAV_RGB},.5)` }}>
                {totalFocusMin} мин
              </span>
            </div>
          )}

          {/* session rows */}
          <div className="flex flex-col gap-1.5">
            {[...todaySessions].reverse().map((s, idx) => {
              const icon = s.type === "pomodoro" ? "🍅" : s.type === "short" ? "☕" : s.type === "long" ? "🌿" : "🎯";
              const c    = s.type === "pomodoro" ? "#a78bfa" : s.type === "short" ? "#22d3ee" : s.type === "long" ? "#86efac" : "#a78bfa";
              return (
                <div key={s.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{
                    background:"rgba(255,255,255,.02)",
                    border:"1px solid rgba(255,255,255,.04)",
                    opacity: Math.max(0.45, 1 - idx * 0.10),
                  }}
                >
                  <span style={{ fontSize:12 }}>{icon}</span>
                  <span className="flex-1 text-xs font-light" style={{ color:"rgba(255,255,255,.5)" }}>
                    {s.durationMinutes} мин · {s.startTime}
                  </span>
                  {s.xp > 0 && (
                    <span className="text-[10px] font-bold" style={{ color:"#fbbf24", textShadow:"0 0 8px rgba(251,191,36,.5)" }}>
                      +{s.xp} XP
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[8px] text-center mt-3 uppercase tracking-[0.15em]"
            style={{ color:"rgba(255,255,255,.10)" }}>
            очищается каждую полночь
          </p>
        </div>
      )}

    </div>
  );
}
