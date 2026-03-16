import { useState } from "react";
import { sphereColors, SphereKey, sphereKeys } from "@/lib/sphereColors";

type Idea = { id: string; text: string; sphere: SphereKey; createdAt: string };

const initial: Idea[] = [
  { id: "1", text: "Создать систему утренних ритуалов", sphere: "health", createdAt: "2026-03-16" },
  { id: "2", text: "Инвестировать в индексный фонд", sphere: "finance", createdAt: "2026-03-15" },
  { id: "3", text: "Запустить side-project по автоматизации", sphere: "work", createdAt: "2026-03-14" },
];

export function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>(initial);
  const [text, setText] = useState("");
  const [sphere, setSphere] = useState<SphereKey>("work");

  function addIdea() {
    if (!text.trim()) return;
    setIdeas((prev) => [
      { id: Date.now().toString(), text: text.trim(), sphere, createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setText("");
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide pt-2">Идеи</h1>

      <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors mb-3"
          placeholder="Новая идея..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIdea()}
        />
        <div className="flex gap-2 flex-wrap mb-3">
          {sphereKeys.map((k) => {
            const s = sphereColors[k];
            return (
              <button key={k} onClick={() => setSphere(k)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: sphere === k ? s.color + "30" : "rgba(255,255,255,0.05)",
                  color: sphere === k ? s.color : "rgba(255,255,255,0.3)",
                  border: `1px solid ${sphere === k ? s.color + "60" : "transparent"}`,
                }}>
                {s.label}
              </button>
            );
          })}
        </div>
        <button onClick={addIdea}
          className="px-5 py-2 rounded-xl text-sm font-medium"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}>
          Добавить
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {ideas.map((idea) => {
          const s = sphereColors[idea.sphere];
          return (
            <div key={idea.id} className="rounded-2xl border p-4 flex items-start gap-3 transition-all"
              style={{ borderColor: s.color + "25", background: `${s.color}07` }}>
              <span className="text-xl mt-0.5" style={{ filter: `drop-shadow(0 0 6px ${s.color})` }}>{s.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-white/70">{idea.text}</p>
                <p className="text-[10px] text-white/25 mt-1">{idea.createdAt}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: s.color, background: s.color + "20" }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
