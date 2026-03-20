import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

/* ─── constants ──────────────────────────────────────────── */
const TIMER_MODES = [
  { label: "Помодоро", minutes: 25, color: "#a78bfa", rgb: "167,139,250", type: "pomodoro" as const, givesXP: true  },
  { label: "Короткий", minutes: 5,  color: "#22d3ee", rgb: "34,211,238",  type: "short"    as const, givesXP: false },
  { label: "Длинный",  minutes: 15, color: "#86efac", rgb: "134,239,172", type: "long"     as const, givesXP: false },
];

/* Breathing: только Вдох (4с) и Выдох (6с) — без задержки */
const BREATH_PHASES = [
  { key: "inhale" as const, label: "Вдох",  ms: 4000, scale: 1.17, glowOp: 0.30 },
  { key: "exhale" as const, label: "Выдох", ms: 6000, scale: 0.80, glowOp: 0.06 },
];

const FOCUS_XP = 15;
const LAV_RGB  = "167,139,250";
const MINT_RGB = "34,211,238";
const RING_R   = 96;
const CIRCUMF  = 2 * Math.PI * RING_R;

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

  /* custom time */
  const [customMin, setCustomMin]         = useState(25);

  /* breath */
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase]     = useState<"inhale"|"exhale">("inhale");
  const breathTimerRef                    = useRef<ReturnType<typeof setTimeout>|null>(null);
  const breathStartRef                    = useRef<string|null>(null);
  const breathStartTimeRef                = useRef<number>(0);

  /* derived */
  const totalSecs  = minutes * 60 + seconds;
  const progress   = Math.max(0, 1 - totalSecs / (sessionDurRef.current * 60));
  const strokeDash = CIRCUMF * progress;
  const done       = totalSecs === 0 && !running;

  /* ── inject CSS once ── */
  useEffect(() => {
    const id = "focus-kf";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes xp-float {
        0%   { opacity:0; transform:translate(-50%,0) scale(.7); }
        18%  { opacity:1; transform:translate(-50%,-12px) scale(1.1); }
        70%  { opacity:1; transform:translate(-50%,-40px) scale(1); }
        100% { opacity:0; transform:translate(-50%,-64px) scale(.9); }
      }
      @keyframes focus-aura {
        0%,100% { transform:scale(.88); opacity:.48; }
        50%     { transform:scale(1.24); opacity:1; }
      }
      @keyframes focus-disc-glow {
        0%,100% { box-shadow:0 0 36px 5px rgba(${LAV_RGB},.11),0 0 72px 16px rgba(${LAV_RGB},.04),inset 0 1px 0 rgba(255,255,255,.06); }
        50%     { box-shadow:0 0 66px 22px rgba(${LAV_RGB},.27),0 0 120px 46px rgba(${MINT_RGB},.08),inset 0 1px 0 rgba(255,255,255,.07); }
      }
      /* скрыть стрелки браузера в числовом поле */
      .focus-numinput::-webkit-inner-spin-button,
      .focus-numinput::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
      .focus-numinput { -moz-appearance:textfield; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  /* ── breath phase machine ── */
  useEffect(() => {
    if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    if (!isBreath) return;

    if (breathRunning) {
      /* record start */
      breathStartRef.current     = getTimeStr();
      breathStartTimeRef.current = Date.now();

      function advance(phase: "inhale"|"exhale") {
        setBreathPhase(phase);
        const p = BREATH_PHASES.find(x => x.key === phase)!;
        const next: "inhale"|"exhale" = phase === "inhale" ? "exhale" : "inhale";
        breathTimerRef.current = setTimeout(() => advance(next), p.ms);
      }
      setBreathPhase("inhale");
      breathTimerRef.current = setTimeout(() => advance("exhale"), BREATH_PHASES[0].ms);
    } else if (breathStartRef.current) {
      /* stopped — save breath session if at least 30s elapsed */
      const elapsedMs  = Date.now() - breathStartTimeRef.current;
      const elapsedMin = Math.round(elapsedMs / 60000);
      if (elapsedMin >= 1) {
        addFocusSession({
          date:            getTodayStr(),
          startTime:       breathStartRef.current,
          endTime:         getTimeStr(),
          durationMinutes: elapsedMin,
          xp:              0,
          type:            "breath",
        });
      }
      breathStartRef.current = null;
    }
    return () => { if (breathTimerRef.current) clearTimeout(breathTimerRef.current); };
  }, [isBreath, breathRunning]);

  /* ── session start ── */
  useEffect(() => {
    if (running && !prevRunningRef.current) {
      sessionStartRef.current = getTimeStr();
      completedRef.current    = false;
    }
    prevRunningRef.current = running;
  }, [running]);

  /* ── completion ── */
  useEffect(() => {
    if (totalSecs === 0 && running && !completedRef.current) {
      completedRef.current = true;
      if (timerMode.givesXP) {
        addXP(FOCUS_XP);
        setShowXPFloat(true);
        setTimeout(() => setShowXPFloat(false), 2200);
      }
      addFocusSession({
        date:            getTodayStr(),
        startTime:       sessionStartRef.current ?? getTimeStr(),
        endTime:         getTimeStr(),
        durationMinutes: sessionDurRef.current,
        xp:              timerMode.givesXP ? FOCUS_XP : 0,
        type:            timerMode.type,
      });
    }
  }, [totalSecs, running]);

  /* ── countdown ── */
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

  /* ── mode select ── */
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
    const base = TIMER_MODES[modeIdx]?.minutes ?? 25;
    setMinutes(base);
    setSeconds(0);
    completedRef.current = false;
  }

  function applyCustomTime() {
    const v = Math.max(1, Math.min(180, customMin));
    setRunning(false);
    setMinutes(v);
    setSeconds(0);
    sessionDurRef.current = v;
    completedRef.current  = false;
  }

  /* ── stats ── */
  const todayStr      = getTodayStr();
  const todaySessions = focusHistory.filter(s => s.date === todayStr);
  const pomodoros     = todaySessions.filter(s => s.type === "pomodoro" || (!s.type && s.xp > 0));
  const totalFocusMin = pomodoros.reduce((a, s) => a + s.durationMinutes, 0);
  const totalXPToday  = pomodoros.reduce((a, s) => a + s.xp, 0);

  /* ── breath visuals ── */
  const bPhase = BREATH_PHASES.find(p => p.key === breathPhase)!;
  const bScale = breathRunning ? bPhase.scale : 1.0;
  const bGlow  = breathRunning ? bPhase.glowOp : 0.06;
  /* разные длительности перехода для вдоха (4s) и выдоха (6s) */
  const bTransDur = breathPhase === "inhale" ? "4s" : "6s";
  const bTrans    = `transform ${bTransDur} ease-in-out, box-shadow ${bTransDur} ease-in-out`;

  /* ─────────────────────────────────────────────────────── */
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
            {totalXPToday > 0 && (
              <>&nbsp;·&nbsp;
                <span style={{ color:"#a78bfa", textShadow:`0 0 8px rgba(${LAV_RGB},0.5)` }}>
                  +{totalXPToday} XP
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {/* ── centered content ── */}
      <div className="flex flex-col items-center gap-7">

        {/* tabs */}
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
                  letterSpacing:"0.06em",
                }}
              >Дыхание</button>
            );
          })()}
        </div>

        {/* ── circle ── */}
        <div className="relative flex items-center justify-center" style={{ width:240, height:240 }}>

          {/* aura */}
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            width:310, height:310, marginTop:-155, marginLeft:-155,
            borderRadius:"50%",
            background:`radial-gradient(circle, rgba(${LAV_RGB},0.19) 0%, rgba(${MINT_RGB},0.07) 48%, transparent 70%)`,
            animation: (!isBreath && running) ? "focus-aura 5s ease-in-out infinite" : "none",
            opacity:   (!isBreath && running) ? 1 : 0.30,
            transform: isBreath ? `scale(${bScale})` : "none",
            transition: isBreath ? bTrans : "none",
            pointerEvents:"none",
          }}/>

          {/* glass disc */}
          <div className="relative flex items-center justify-center rounded-full"
            style={{
              width:240, height:240,
              background:    "rgba(255,255,255,.025)",
              backdropFilter:"blur(20px)",
              border:        "1px solid rgba(255,255,255,.06)",
              transform: isBreath ? `scale(${bScale})` : "none",
              transition: isBreath ? bTrans : "none",
              animation: (!isBreath && running) ? "focus-disc-glow 5s ease-in-out infinite" : "none",
              boxShadow: isBreath
                ? `0 0 ${45 + bGlow * 180}px ${18 + bGlow * 70}px rgba(${LAV_RGB},${bGlow}), inset 0 1px 0 rgba(255,255,255,.06)`
                : running
                  ? undefined
                  : `0 0 36px 5px rgba(${LAV_RGB},.09), inset 0 1px 0 rgba(255,255,255,.06)`,
            }}
          >
            {/* SVG ring */}
            {!isBreath && (
              <svg width="240" height="240" style={{ position:"absolute", top:0, left:0 }}>
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity=".5"/>
                    <stop offset="100%" stopColor={color}/>
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

            {/* center */}
            <div className="relative text-center z-10 select-none">
              {isBreath ? (
                /* ── Дыхание: только сияющая звёздочка, никакого текста ── */
                <div style={{
                  fontSize: 36,
                  lineHeight: 1,
                  color:"#a78bfa",
                  transform: breathRunning
                    ? breathPhase === "inhale" ? "scale(1.5)" : "scale(0.12)"
                    : "scale(0.55)",
                  opacity: breathRunning
                    ? breathPhase === "inhale" ? 1 : 0.35
                    : 0.28,
                  transition: breathRunning
                    ? `transform ${bTransDur} ease-in-out, opacity ${bTransDur} ease-in-out`
                    : "transform 1s ease, opacity 1s ease",
                  textShadow: breathRunning && breathPhase === "inhale"
                    ? `0 0 28px rgba(${LAV_RGB},1), 0 0 56px rgba(${LAV_RGB},.55), 0 0 90px rgba(${LAV_RGB},.25)`
                    : `0 0 10px rgba(${LAV_RGB},.30)`,
                }}>
                  ✦
                </div>
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

            {/* XP float — lavender */}
            {showXPFloat && (
              <div style={{
                position:"absolute", bottom:"26px", left:"50%",
                animation:"xp-float 2.2s ease-out forwards",
                pointerEvents:"none",
                fontSize:18, fontWeight:600,
                color:"#a78bfa",
                textShadow:`0 0 18px rgba(${LAV_RGB},.90), 0 0 36px rgba(${LAV_RGB},.40)`,
                letterSpacing:"0.06em",
                zIndex:20, whiteSpace:"nowrap",
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
              <button onClick={() => setBreathRunning(v => !v)}
                className="px-12 py-3 rounded-2xl text-sm font-light tracking-[0.1em] transition-all duration-300"
                style={{
                  background:`rgba(${LAV_RGB},.18)`, color:"#a78bfa",
                  border:`1px solid rgba(${LAV_RGB},.30)`,
                  boxShadow:`0 0 28px rgba(${LAV_RGB},.14)`,
                  textShadow:`0 0 10px #a78bfa`,
                }}
              >{breathRunning ? "Пауза" : "Начать"}</button>
              <button
                onClick={() => {
                  setBreathRunning(false);
                  setBreathPhase("inhale");
                  if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
                }}
                className="px-6 py-3 rounded-2xl text-sm font-light transition-all"
                style={{ background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.25)", border:"1px solid rgba(255,255,255,.07)" }}
              >↺</button>
            </>
          ) : (
            <>
              <button onClick={() => setRunning(v => !v)}
                className="px-12 py-3 rounded-2xl text-sm font-light tracking-[0.1em] transition-all duration-300"
                style={{
                  background:`rgba(${rgb},.18)`, color,
                  border:`1px solid rgba(${rgb},.30)`,
                  boxShadow:`0 0 28px rgba(${rgb},.14)`,
                  textShadow:`0 0 10px ${color}`,
                }}
              >{running ? "Пауза" : "Старт"}</button>
              <button onClick={resetTimer}
                className="px-6 py-3 rounded-2xl text-sm font-light transition-all"
                style={{ background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.25)", border:"1px solid rgba(255,255,255,.07)" }}
              >↺</button>
            </>
          )}
        </div>

        {/* ── custom time (timer modes only) ── */}
        {!isBreath && (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">

            {/* divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,.05)" }}/>
              <span className="text-[9px] uppercase tracking-[0.18em]" style={{ color:"rgba(255,255,255,.18)" }}>
                Своё время
              </span>
              <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,.05)" }}/>
            </div>

            {/* [−] input [+] */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCustomMin(v => Math.max(1, v - 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-light transition-all active:scale-90"
                style={{
                  background:"rgba(167,139,250,.10)", color:"#a78bfa",
                  border:"1px solid rgba(167,139,250,.25)",
                  boxShadow:"0 0 10px rgba(167,139,250,.08)",
                }}
              >−</button>

              <div className="relative">
                <input
                  type="number"
                  min={1} max={180}
                  value={customMin}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) setCustomMin(Math.max(1, Math.min(180, v)));
                  }}
                  className="focus-numinput text-center text-xl font-light tabular-nums outline-none rounded-xl py-1.5 pl-3"
                  style={{
                    width: "100px",
                    paddingRight: "36px",
                    background:"rgba(255,255,255,.04)",
                    border:"1px solid rgba(167,139,250,.20)",
                    color:"rgba(255,255,255,.78)",
                    textShadow:`0 0 14px rgba(${LAV_RGB},.25)`,
                    letterSpacing:"0.04em",
                  }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 text-[8px] pointer-events-none select-none"
                  style={{ right:"10px", color:"rgba(255,255,255,.22)" }}>
                  мин
                </span>
              </div>

              <button
                onClick={() => setCustomMin(v => Math.min(180, v + 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-light transition-all active:scale-90"
                style={{
                  background:"rgba(167,139,250,.10)", color:"#a78bfa",
                  border:"1px solid rgba(167,139,250,.25)",
                  boxShadow:"0 0 10px rgba(167,139,250,.08)",
                }}
              >+</button>
            </div>

            {/* apply */}
            <button onClick={applyCustomTime}
              className="px-8 py-1.5 rounded-2xl text-xs tracking-[0.12em] transition-all"
              style={{ background:"rgba(167,139,250,.11)", color:"#a78bfa", border:"1px solid rgba(167,139,250,.22)" }}
            >
              Задать
            </button>
          </div>
        )}

        {/* breathing hint — only when idle, no text labels */}
        {isBreath && !breathRunning && (
          <p className="text-[9px] uppercase tracking-[0.18em] text-center" style={{ color:`rgba(${LAV_RGB},.28)` }}>
            вдох 4с · выдох 6с
          </p>
        )}

      </div>{/* /centered */}

      {/* ═══ ИСТОРИЯ СЕССИЙ — всегда видима ═══ */}
      <div
        className="rounded-2xl border p-5 mt-2 w-full"
        style={{
          background:"rgba(255,255,255,.02)",
          backdropFilter:"blur(20px)",
          borderColor:"rgba(255,255,255,.06)",
        }}
      >
        {/* header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] uppercase tracking-[0.28em] font-medium"
            style={{ color:"rgba(255,255,255,.25)" }}>
            История сессий
          </p>
          {todaySessions.length > 0 && (
            <p className="text-[9px]" style={{ color:"rgba(255,255,255,.14)" }}>
              {todaySessions.length}&nbsp;
              {todaySessions.length === 1 ? "сессия" : todaySessions.length < 5 ? "сессии" : "сессий"}
              {totalFocusMin > 0 && ` · ${totalFocusMin} мин фокуса`}
            </p>
          )}
        </div>

        {/* пусто */}
        {todaySessions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-4">
            <span style={{ fontSize:24, opacity:0.18 }}>✦</span>
            <p className="text-[11px] text-center" style={{ color:"rgba(255,255,255,.18)", lineHeight:1.7 }}>
              Сессий ещё нет<br/>
              <span style={{ color:`rgba(${LAV_RGB},.30)` }}>Запусти таймер — здесь появится история</span>
            </p>
          </div>
        )}

        {/* session list */}
        {todaySessions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {[...todaySessions].reverse().map((s, idx) => {
              const typeLabel =
                s.type === "pomodoro" ? "Помодоро" :
                s.type === "short"    ? "Перерыв кор." :
                s.type === "long"     ? "Перерыв дл." :
                s.type === "breath"   ? "Дыхание" : "Сессия";
              const icon =
                s.type === "pomodoro" ? "🍅" :
                s.type === "short"    ? "☕" :
                s.type === "long"     ? "🌿" :
                s.type === "breath"   ? "✦" : "·";
              const c =
                s.type === "pomodoro" ? "#a78bfa" :
                s.type === "short"    ? "#22d3ee" :
                s.type === "long"     ? "#86efac" :
                s.type === "breath"   ? "#c4b5fd" : "#a78bfa";

              return (
                <div key={s.id}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{
                    background:"rgba(255,255,255,.022)",
                    border:"1px solid rgba(255,255,255,.045)",
                    opacity: Math.max(0.44, 1 - idx * 0.08),
                  }}
                >
                  <span style={{ fontSize:s.type === "breath" ? 14 : 13, lineHeight:1, color: s.type === "breath" ? c : undefined }}>
                    {icon}
                  </span>

                  <span className="text-xs font-light flex-shrink-0"
                    style={{ color: c, textShadow:`0 0 10px ${c}55`, minWidth:100 }}>
                    {typeLabel}
                  </span>

                  <span className="text-xs font-light flex-1"
                    style={{ color:"rgba(255,255,255,.38)" }}>
                    {s.durationMinutes} мин
                  </span>

                  <span className="text-[10px] flex-shrink-0"
                    style={{ color:"rgba(255,255,255,.22)" }}>
                    {s.endTime ? s.endTime : s.startTime}
                  </span>

                  {s.xp > 0 && (
                    <span className="text-[10px] font-semibold flex-shrink-0 ml-1"
                      style={{ color:"#a78bfa", textShadow:`0 0 8px rgba(${LAV_RGB},.55)` }}>
                      +{s.xp}&nbsp;XP
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[8px] text-center mt-3 uppercase tracking-[0.14em]"
          style={{ color:"rgba(255,255,255,.08)" }}>
          очищается каждую полночь
        </p>
      </div>

    </div>
  );
}
