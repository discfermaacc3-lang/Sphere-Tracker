import { useState, useCallback, useMemo } from "react";
import { useStore, Task } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

const XP_LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
const DAY_XP_GOAL = 100;

function getLevel(xp: number) {
  let level = 1;
  for (let i = 0; i < XP_LEVEL_THRESHOLDS.length; i++) {
    if (xp >= XP_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const curr = XP_LEVEL_THRESHOLDS[Math.min(level - 1, XP_LEVEL_THRESHOLDS.length - 1)];
  const next = XP_LEVEL_THRESHOLDS[Math.min(level, XP_LEVEL_THRESHOLDS.length - 1)];
  const pct = next === curr ? 100 : Math.round(((xp - curr) / (next - curr)) * 100);
  return { level, pct, curr, next };
}

type XpFloat = { id: number; xp: number; color: string; x: number; y: number };

function PrioritySphereSlot({
  sphereKey,
  onClear,
}: {
  sphereKey: SphereKey | null;
  onClear: () => void;
}) {
  const s = sphereKey ? sphereColors[sphereKey] : null;
  return (
    <div className="flex-1 relative min-h-[150px] flex items-center justify-center">
      {/* Outer aura glow */}
      {s && (
        <div
          className="aura-pulse absolute inset-0 rounded-[2rem]"
          style={{
            background: `radial-gradient(ellipse at 50% 60%, ${s.color}30 0%, ${s.color}10 50%, transparent 75%)`,
            filter: "blur(12px)",
          }}
        />
      )}
      {/* Glass card */}
      <div
        className="relative w-full h-full rounded-[2rem] flex flex-col items-center justify-center gap-3 overflow-hidden min-h-[150px]"
        style={{
          background: s
            ? `rgba(${hexToRgb(s.color)}, 0.06)`
            : "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: s
            ? `1px solid rgba(${hexToRgb(s.color)}, 0.20)`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: s ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px rgba(${hexToRgb(s.color)},0.08)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {s ? (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, rgba(${hexToRgb(s.color)},0.10) 0%, transparent 60%)`,
              }}
            />
            <span
              className="icon-float text-5xl relative z-10"
              style={{ filter: `drop-shadow(0 0 20px ${s.color}) drop-shadow(0 0 40px ${s.color}50)` }}
            >
              {s.icon}
            </span>
            <span
              className="relative z-10 font-light text-base tracking-[0.12em] uppercase"
              style={{
                color: s.color,
                textShadow: `0 0 16px ${s.color}80`,
                letterSpacing: "0.15em",
              }}
            >
              {s.label}
            </span>
            <button
              onClick={onClear}
              className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              ✕
            </button>
          </>
        ) : (
          <div className="text-center relative z-10">
            <div
              className="w-10 h-10 rounded-full border flex items-center justify-center mx-auto mb-2"
              style={{ borderColor: "rgba(255,255,255,0.08)", borderStyle: "dashed" }}
            >
              <span className="text-white/15 text-lg">+</span>
            </div>
            <p className="text-white/15 text-xs tracking-widest uppercase">Выбери сферу</p>
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (e: React.MouseEvent) => void }) {
  const s = sphereColors[task.sphere];
  const [showXp, setShowXp] = useState(false);

  return (
    <div
      className="flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer group"
      style={{
        opacity: task.done ? 0.55 : 1,
        background: task.done ? "transparent" : "rgba(255,255,255,0.01)",
      }}
      onClick={onToggle}
      onMouseEnter={() => setShowXp(true)}
      onMouseLeave={() => setShowXp(false)}
    >
      {/* Soft circle toggle */}
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          border: task.done ? "none" : `1.5px solid rgba(${hexToRgb(s.color)},0.45)`,
          background: task.done
            ? `radial-gradient(circle, ${s.color}50 0%, ${s.color}20 100%)`
            : "rgba(255,255,255,0.03)",
          boxShadow: task.done ? `0 0 12px ${s.color}40` : "none",
        }}
      >
        {task.done && (
          <span className="text-[10px]" style={{ color: s.color }}>✓</span>
        )}
        {!task.done && (
          <span
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: s.color,
              boxShadow: `0 0 6px ${s.color}`,
              opacity: 0.7,
            }}
          />
        )}
      </div>

      {/* Text */}
      <span
        className="flex-1 text-sm leading-snug transition-all duration-300"
        style={{
          color: task.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.72)",
          textDecoration: task.done ? "line-through" : "none",
          textShadow: task.done ? "none" : "0 0 20px rgba(255,255,255,0.08)",
        }}
      >
        {task.text}
      </span>

      {/* XP badge — appears on hover/done */}
      <span
        className="flex-shrink-0 text-[10px] font-bold transition-all duration-200"
        style={{
          color: task.done ? s.color : s.color,
          opacity: showXp || task.done ? 1 : 0,
          textShadow: `0 0 10px ${s.color}`,
          transform: showXp ? "translateX(0)" : "translateX(4px)",
        }}
      >
        {task.done ? "✓" : "+"}{task.xp} XP
      </span>
    </div>
  );
}

export function Home() {
  const {
    currentMonth, prevMonth, nextMonth,
    isArchiveMode, isFutureMonth, monthSnapshots,
    prioritySpheres, setPrioritySphere,
    tasks, toggleTask,
    notes, addNote, deleteNote,
    totalXP, dayXP,
  } = useStore();

  // Use archived priorities when viewing a past month
  const archiveKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const archiveSnap = isArchiveMode ? monthSnapshots[archiveKey] : null;
  const viewPriorities: [SphereKey | null, SphereKey | null] = archiveSnap
    ? archiveSnap.prioritySpheres
    : prioritySpheres;

  const [newNote, setNewNote] = useState("");
  const [xpFloats, setXpFloats] = useState<XpFloat[]>([]);

  const TODAY = new Date().toISOString().slice(0, 10);

  const todayTasks = tasks.filter((t) => t.noDeadline || t.dueDate === TODAY);
  const routine = todayTasks.filter((t) => t.type === "routine");
  const special = todayTasks.filter((t) => t.type === "special");

  const monthLabel = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  const { level, pct } = getLevel(totalXP);
  const dayPct = Math.min(100, Math.round((dayXP / DAY_XP_GOAL) * 100));

  // Priority spheres from active priorities to build gradient colors for progress
  const p0 = viewPriorities[0] ? sphereColors[viewPriorities[0]].color : "#a78bfa";
  const p1 = viewPriorities[1] ? sphereColors[viewPriorities[1]].color : "#22d3ee";

  function handleTaskToggle(task: Task, e: React.MouseEvent) {
    if (!task.done) {
      const id = Date.now() + Math.random();
      const color = sphereColors[task.sphere].color;
      setXpFloats((prev) => [...prev, { id, xp: task.xp, color, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setXpFloats((prev) => prev.filter((f) => f.id !== id)), 900);
    }
    toggleTask(task.id);
  }

  function handleSphereClick(key: SphereKey) {
    if (prioritySpheres[0] === key) { setPrioritySphere(0, null); return; }
    if (prioritySpheres[1] === key) { setPrioritySphere(1, null); return; }
    if (prioritySpheres[0] === null) { setPrioritySphere(0, key); return; }
    if (prioritySpheres[1] === null) { setPrioritySphere(1, key); return; }
    setPrioritySphere(0, key);
  }

  const todayNotes = notes.filter((n) => n.createdAt === TODAY);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">

      {/* XP Floats */}
      {xpFloats.map((f) => (
        <div
          key={f.id}
          className="xp-float"
          style={{ left: f.x - 20, top: f.y - 20, color: f.color }}
        >
          +{f.xp} XP
        </div>
      ))}

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <h1
            className="text-xl font-light tracking-[0.15em] uppercase"
            style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 0 30px rgba(167,139,250,0.4)" }}
          >
            Дашборд
          </h1>
          <p className="text-[10px] text-white/25 mt-0.5 tracking-widest uppercase">
            {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric" })}
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.3)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >‹</button>
          <div className="flex flex-col items-center gap-1 min-w-[140px]">
            <span
              className="text-sm font-light tracking-[0.12em] text-center"
              style={{ color: "rgba(255,255,255,0.55)", textShadow: "0 0 16px rgba(167,139,250,0.3)" }}
            >
              {monthLabel}
            </span>
            {isArchiveMode && (
              <span
                className="text-[8px] px-2 py-0.5 rounded-full tracking-widest uppercase"
                style={{
                  background: "rgba(167,139,250,0.12)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                📖 Архив
              </span>
            )}
            {isFutureMonth && (
              <span
                className="text-[8px] px-2 py-0.5 rounded-full tracking-widest uppercase"
                style={{
                  background: "rgba(134,239,172,0.10)",
                  color: "#86efac",
                  border: "1px solid rgba(134,239,172,0.22)",
                }}
              >
                ✦ Новый месяц
              </span>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.3)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >›</button>
        </div>
      </div>

      {/* ── Priority Spheres ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-[9px] uppercase tracking-[0.25em] font-medium"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Приоритеты
          </p>
          {isArchiveMode && (
            <p className="text-[9px]" style={{ color: "rgba(167,139,250,0.5)" }}>
              только просмотр
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <PrioritySphereSlot
            sphereKey={viewPriorities[0]}
            onClear={() => !isArchiveMode && setPrioritySphere(0, null)}
          />
          <PrioritySphereSlot
            sphereKey={viewPriorities[1]}
            onClear={() => !isArchiveMode && setPrioritySphere(1, null)}
          />
        </div>
      </section>

      {/* ── Sphere picker — compact single row ─────────────────── */}
      <div
        className="rounded-[1.5rem] px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          className="text-[8px] uppercase tracking-[0.22em] mb-3 font-medium"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Все сферы
        </p>
        <div className="flex gap-1 justify-between">
          {sphereKeys.map((key) => {
            const s = sphereColors[key];
            const active = viewPriorities.includes(key);
            return (
              <button
                key={key}
                onClick={() => !isArchiveMode && handleSphereClick(key)}
                disabled={isArchiveMode}
                className="flex flex-col items-center gap-1.5 flex-1 py-1 transition-all duration-300"
                title={s.label}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all duration-300"
                  style={{
                    background: active
                      ? `rgba(${hexToRgb(s.color)},0.18)`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid rgba(${hexToRgb(s.color)},${active ? "0.40" : "0.10"})`,
                    boxShadow: active ? `0 0 16px rgba(${hexToRgb(s.color)},0.30)` : "none",
                    transform: active ? "scale(1.12)" : "scale(1)",
                    filter: active
                      ? `drop-shadow(0 0 6px ${s.color})`
                      : "grayscale(0.5) opacity(0.5)",
                  }}
                >
                  {s.icon}
                </div>
                <span
                  className="text-[7.5px] font-medium tracking-wide leading-tight text-center"
                  style={{
                    color: active ? s.color : "rgba(255,255,255,0.22)",
                    textShadow: active ? `0 0 8px ${s.color}60` : "none",
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── XP & Level ───────────────────────────────────────── */}
      <div
        className="rounded-[1.5rem] p-5 flex flex-col gap-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Level */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="text-[9px] uppercase tracking-[0.25em] font-medium"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Общий уровень
              </span>
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.14)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.25)",
                  textShadow: "0 0 10px rgba(167,139,250,0.5)",
                }}
              >
                Ур. {level}
              </span>
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: "#a78bfa", textShadow: "0 0 12px rgba(167,139,250,0.6)" }}
            >
              ✦ {totalXP} XP
            </span>
          </div>
          {/* Shimmer progress bar */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                backgroundImage: `linear-gradient(90deg, ${p0}80, ${p1}80, ${p0}80)`,
                backgroundSize: "200% auto",
                animation: "shimmer 3s linear infinite",
                boxShadow: `0 0 14px ${p0}50, 0 0 28px ${p0}20`,
                transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
          <p
            className="text-[9px] mt-1.5"
            style={{ color: "rgba(255,255,255,0.17)" }}
          >
            До {XP_LEVEL_THRESHOLDS[Math.min(level, XP_LEVEL_THRESHOLDS.length - 1)]} XP —{" "}
            {XP_LEVEL_THRESHOLDS[Math.min(level, XP_LEVEL_THRESHOLDS.length - 1)] - totalXP} XP до след. уровня
          </p>
        </div>

        {/* Day progress */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span
              className="text-[9px] uppercase tracking-[0.25em] font-medium"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              Прогресс дня
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: "#f472b6", textShadow: "0 0 12px rgba(244,114,182,0.5)" }}
            >
              ⚡ {dayXP} / {DAY_XP_GOAL}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${dayPct}%`,
                background: "linear-gradient(90deg,#a78bfa,#f472b6)",
                boxShadow: "0 0 10px rgba(244,114,182,0.4)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Tasks ─────────────────────────────────────────────── */}
      <div
        className="rounded-[1.5rem] p-5"
        style={{
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <p
          className="text-xs font-light tracking-[0.2em] uppercase mb-5"
          style={{ color: "rgba(255,255,255,0.4)", textShadow: "0 0 16px rgba(255,255,255,0.1)" }}
        >
          Задачи на сегодня
        </p>

        {/* Routine */}
        <div className="mb-5">
          <p className="text-[9px] uppercase tracking-[0.22em] mb-3 font-medium" style={{ color: "rgba(255,255,255,0.18)" }}>
            Рутина
          </p>
          <div className="flex flex-col gap-1">
            {routine.length === 0 && (
              <p className="text-[11px] text-center py-3" style={{ color: "rgba(255,255,255,0.14)" }}>
                Нет рутины на сегодня
              </p>
            )}
            {routine.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={(e) => handleTaskToggle(task, e)} />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="my-4 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* Special */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] mb-3 font-medium" style={{ color: "rgba(255,255,255,0.18)" }}>
            План на день
          </p>
          <div className="flex flex-col gap-1">
            {special.length === 0 && (
              <p className="text-[11px] text-center py-3" style={{ color: "rgba(255,255,255,0.14)" }}>
                Чистый лист ✨
              </p>
            )}
            {special.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={(e) => handleTaskToggle(task, e)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Notes ─────────────────────────────────────────────── */}
      <div
        className="rounded-[1.5rem] p-5"
        style={{
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <p
          className="text-xs font-light tracking-[0.2em] uppercase mb-4"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Заметки дня
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {todayNotes.length === 0 && (
            <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.14)" }}>
              Нет заметок за сегодня
            </p>
          )}
          {todayNotes.slice(0, 3).map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
              style={{
                background: "rgba(167,139,250,0.06)",
                border: "1px solid rgba(167,139,250,0.12)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{ color: "rgba(255,255,255,0.6)", textShadow: "0 0 10px rgba(255,255,255,0.1)" }}
                >
                  {note.title}
                </p>
                {note.text && (
                  <p className="text-[11px] leading-relaxed truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {note.text}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Quick add */}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none transition-all"
            placeholder="Быстрая заметка..."
            value={newNote}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.65)",
            }}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newNote.trim()) {
                addNote({ title: newNote.trim(), text: "", createdAt: TODAY });
                setNewNote("");
              }
            }}
          />
          <button
            onClick={() => {
              if (newNote.trim()) {
                addNote({ title: newNote.trim(), text: "", createdAt: TODAY });
                setNewNote("");
              }
            }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-light text-xl transition-all"
            style={{
              background: "linear-gradient(135deg,rgba(167,139,250,0.5),rgba(139,92,246,0.35))",
              border: "1px solid rgba(167,139,250,0.25)",
              boxShadow: "0 0 20px rgba(167,139,250,0.2)",
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
