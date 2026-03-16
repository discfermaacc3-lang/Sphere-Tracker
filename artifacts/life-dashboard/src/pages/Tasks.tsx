import { useState } from "react";
import { useStore } from "@/lib/store";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

export function Tasks() {
  const { tasks, toggleTask, addTask } = useStore();
  const [text, setText] = useState("");
  const [sphere, setSphere] = useState<SphereKey>("work");
  const [type, setType] = useState<"routine" | "special">("routine");

  const routine = tasks.filter((t) => t.type === "routine");
  const special = tasks.filter((t) => t.type === "special");

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide pt-2">Задачи</h1>

      {/* Add task form */}
      <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3 font-medium">Новая задача</p>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors mb-3"
          placeholder="Описание задачи..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap mb-3">
          {sphereKeys.map((k) => {
            const s = sphereColors[k];
            return (
              <button
                key={k}
                onClick={() => setSphere(k)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: sphere === k ? s.color + "30" : "rgba(255,255,255,0.05)",
                  color: sphere === k ? s.color : "rgba(255,255,255,0.3)",
                  border: `1px solid ${sphere === k ? s.color + "60" : "transparent"}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {(["routine", "special"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="text-xs px-3 py-1 rounded-full transition-all"
              style={{
                background: type === t ? "#6366f130" : "rgba(255,255,255,0.05)",
                color: type === t ? "#6366f1" : "rgba(255,255,255,0.3)",
                border: `1px solid ${type === t ? "#6366f160" : "transparent"}`,
              }}
            >
              {t === "routine" ? "Рутина" : "Специальная"}
            </button>
          ))}
          <button
            className="ml-auto px-5 py-1 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
            onClick={() => {
              if (text.trim()) {
                addTask({ text: text.trim(), sphere, type, done: false });
                setText("");
              }
            }}
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Routine tasks */}
      <TaskGroup title="Рутина" tasks={routine} onToggle={toggleTask} />
      {/* Special tasks */}
      <TaskGroup title="Специальные задачи" tasks={special} onToggle={toggleTask} />
    </div>
  );
}

function TaskGroup({ title, tasks, onToggle }: {
  title: string;
  tasks: ReturnType<typeof useStore>["tasks"];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-sm font-semibold text-white/70 mb-4">{title}</p>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 && <p className="text-white/20 text-sm">Нет задач</p>}
        {tasks.map((task) => {
          const s = sphereColors[task.sphere];
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-white/3"
              onClick={() => onToggle(task.id)}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              <span className={`flex-1 text-sm ${task.done ? "line-through opacity-30" : "text-white/70"}`}>
                {task.text}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.color + "18" }}>
                {s.label}
              </span>
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
  );
}
