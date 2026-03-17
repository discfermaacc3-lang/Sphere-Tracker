import { useState } from "react";
import { useStore } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

const XP_COLORS: Record<string, string> = {
  easy: "#22c55e", medium: "#eab308", hard: "#ef4444", custom: "#a855f7",
};

const XP_LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000];

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

function PrioritySphereSlot({
  sphereKey,
  onClear,
}: {
  sphereKey: SphereKey | null;
  onClear: () => void;
}) {
  const sphere = sphereKey ? sphereColors[sphereKey] : null;
  return (
    <div
      className="flex-1 rounded-2xl border flex flex-col items-center justify-center gap-3 relative overflow-hidden min-h-[140px] transition-all duration-300"
      style={{
        borderColor: sphere ? sphere.color + "50" : "rgba(255,255,255,0.07)",
        background: sphere
          ? `linear-gradient(135deg, ${sphere.color}15, ${sphere.color}05)`
          : "rgba(255,255,255,0.02)",
      }}
    >
      {sphere ? (
        <>
          <div
            className="absolute inset-0 opacity-10 blur-2xl"
            style={{ background: `radial-gradient(circle at 50% 50%, ${sphere.color}, transparent 70%)` }}
          />
          <span
            className="text-5xl animate-bounce"
            style={{ filter: `drop-shadow(0 0 16px ${sphere.color})`, animationDuration: "2.5s" }}
          >
            {sphere.icon}
          </span>
          <span className="font-semibold text-base tracking-wide" style={{ color: sphere.color }}>
            {sphere.label}
          </span>
          <button
            onClick={onClear}
            className="absolute top-2 right-3 text-white/20 hover:text-white/60 text-xs transition-colors"
          >
            ✕
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="text-3xl text-white/10 mb-1">+</div>
          <p className="text-white/20 text-xs">Выбери сферу ниже</p>
        </div>
      )}
    </div>
  );
}

export function Home() {
  const {
    currentMonth, prevMonth, nextMonth,
    prioritySpheres, setPrioritySphere,
    spherePanelOpen, toggleSpherePanel,
    tasks, toggleTask,
    notes, addNote, deleteNote,
    totalXP, dayXP,
  } = useStore();

  const [newNote, setNewNote] = useState("");

  const TODAY = new Date().toISOString().slice(0, 10);

  const todayTasks = tasks.filter((t) => !t.noDeadline && t.dueDate === TODAY || t.noDeadline);
  const routine = todayTasks.filter((t) => t.type === "routine");
  const special = todayTasks.filter((t) => t.type === "special");

  const monthLabel = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const { level, pct } = getLevel(totalXP);

  const DAY_XP_GOAL = 100;
  const dayPct = Math.min(100, Math.round((dayXP / DAY_XP_GOAL) * 100));

  function handleSphereClick(key: SphereKey) {
    if (prioritySpheres[0] === key) { setPrioritySphere(0, null); return; }
    if (prioritySpheres[1] === key) { setPrioritySphere(1, null); return; }
    if (prioritySpheres[0] === null) { setPrioritySphere(0, key); return; }
    if (prioritySpheres[1] === null) { setPrioritySphere(1, key); return; }
    setPrioritySphere(0, key);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-2">
        <h1 className="text-xl font-semibold text-white/80 tracking-wide">Дашборд</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-white/30 hover:text-white/70 transition-colors text-lg px-1">‹</button>
          <span className="text-sm text-white/60 font-medium min-w-[130px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="text-white/30 hover:text-white/70 transition-colors text-lg px-1">›</button>
        </div>
      </div>

      {/* Priority spheres */}
      <section>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">Приоритеты</p>
        <div className="flex gap-4">
          <PrioritySphereSlot sphereKey={prioritySpheres[0]} onClear={() => setPrioritySphere(0, null)} />
          <PrioritySphereSlot sphereKey={prioritySpheres[1]} onClear={() => setPrioritySphere(1, null)} />
        </div>
      </section>

      {/* Sphere picker */}
      <section className="rounded-2xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <button
          onClick={toggleSpherePanel}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          <span className="font-medium">Все сферы</span>
          <span className="text-xs">{spherePanelOpen ? "▲" : "▼"}</span>
        </button>
        {spherePanelOpen && (
          <div className="grid grid-cols-4 gap-3 px-5 pb-5">
            {sphereKeys.map((key) => {
              const s = sphereColors[key];
              const active = prioritySpheres.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleSphereClick(key)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: active ? s.color + "20" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? s.color + "60" : "rgba(255,255,255,0.05)"}`,
                    transform: active ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <span
                    className="text-2xl transition-all duration-200"
                    style={{ filter: active ? `drop-shadow(0 0 10px ${s.color})` : "grayscale(1) opacity(0.4)" }}
                  >
                    {s.icon}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: active ? s.color : "rgba(255,255,255,0.3)" }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* XP & Progress */}
      <section className="rounded-2xl border border-white/5 p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        {/* Overall level */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 uppercase tracking-widest font-medium">Общий уровень</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#6366f120", color: "#818cf8" }}>
                Ур. {level}
              </span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#818cf8" }}>✦ {totalXP} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg,#6366f1,#a855f7)",
                boxShadow: "0 0 12px #6366f170",
              }}
            />
          </div>
          <p className="text-[10px] text-white/20 mt-1">До следующего уровня: {XP_LEVEL_THRESHOLDS[Math.min(level, XP_LEVEL_THRESHOLDS.length - 1)] - totalXP} XP</p>
        </div>

        {/* Day progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/30 uppercase tracking-widest font-medium">Прогресс дня</span>
            <span className="text-xs font-semibold" style={{ color: "#c084fc" }}>⚡ {dayXP} / {DAY_XP_GOAL} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${dayPct}%`,
                background: "linear-gradient(90deg,#a855f7,#ec4899)",
                boxShadow: "0 0 8px #a855f770",
              }}
            />
          </div>
        </div>
      </section>

      {/* Tasks section */}
      <section className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-sm font-semibold text-white/70 mb-4 tracking-wide">Задачи на сегодня</p>

        {/* Routine */}
        <div className="mb-5">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-medium">Рутина</p>
          <div className="flex flex-col gap-2">
            {routine.length === 0 && (
              <p className="text-white/20 text-xs py-2 text-center">Нет задач рутины на сегодня</p>
            )}
            {routine.map((task) => {
              const s = sphereColors[task.sphere];
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-white/3"
                  onClick={() => toggleTask(task.id)}
                  style={{ opacity: task.done ? 0.6 : 1 }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                  <span className={`flex-1 text-sm transition-all ${task.done ? "line-through opacity-40" : "text-white/70"}`}>
                    {task.text}
                  </span>
                  {!task.done && (
                    <span className="text-[10px] font-semibold" style={{ color: XP_COLORS[task.xpDifficulty] }}>
                      +{task.xp} XP
                    </span>
                  )}
                  {task.done && (
                    <span className="text-[10px] text-green-400/60 font-semibold">✓ {task.xp} XP</span>
                  )}
                  <div
                    className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: task.done ? s.color : "rgba(255,255,255,0.15)",
                      background: task.done ? s.color + "30" : "transparent",
                    }}
                  >
                    {task.done && <span className="text-xs" style={{ color: s.color }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-medium">План на день</p>
          <div className="flex flex-col gap-2">
            {special.length === 0 && (
              <p className="text-white/20 text-xs py-2 text-center">Нет специальных задач на сегодня</p>
            )}
            {special.map((task) => {
              const s = sphereColors[task.sphere];
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-white/3"
                  onClick={() => toggleTask(task.id)}
                  style={{ opacity: task.done ? 0.6 : 1 }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                  <span className={`flex-1 text-sm transition-all ${task.done ? "line-through opacity-40" : "text-white/70"}`}>
                    {task.text}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full mr-1 flex-shrink-0" style={{ color: s.color, background: s.color + "18" }}>
                    {s.label}
                  </span>
                  {task.priority && (
                    <span className="text-[9px] text-indigo-400 mr-1 flex-shrink-0">★</span>
                  )}
                  {!task.done && (
                    <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: XP_COLORS[task.xpDifficulty] }}>
                      +{task.xp} XP
                    </span>
                  )}
                  {task.done && (
                    <span className="text-[10px] text-green-400/60 font-semibold flex-shrink-0">✓ {task.xp} XP</span>
                  )}
                  <div
                    className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: task.done ? s.color : "rgba(255,255,255,0.15)",
                      background: task.done ? s.color + "30" : "transparent",
                    }}
                  >
                    {task.done && <span className="text-xs" style={{ color: s.color }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-sm font-semibold text-white/70 mb-4 tracking-wide">Заметки дня</p>
        {/* Show today's notes */}
        <div className="flex flex-col gap-2 mb-4">
          {notes
            .filter((n) => n.createdAt === TODAY)
            .slice(0, 3)
            .map((note) => (
              <div key={note.id} className="group flex items-start gap-3 p-3 rounded-xl border border-indigo-500/15 hover:border-indigo-500/25 transition-colors"
                style={{ background: "rgba(99,102,241,0.04)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/60 mb-0.5">{note.title}</p>
                  {note.text && <p className="text-xs text-white/35 leading-relaxed truncate">{note.text}</p>}
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 text-xs flex-shrink-0"
                >✕</button>
              </div>
            ))}
          {notes.filter((n) => n.createdAt === TODAY).length === 0 && (
            <p className="text-xs text-white/20 text-center py-2">Нет заметок за сегодня</p>
          )}
        </div>
        {/* Quick add */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
            placeholder="Быстрая заметка..."
            value={newNote}
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
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            +
          </button>
        </div>
      </section>
    </div>
  );
}
