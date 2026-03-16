import { sphereColors, sphereKeys } from "@/lib/sphereColors";

const mockGoals = [
  { id: "1", sphere: "health" as const,       label: "Здоровье",      goal: "Пробегать 5 км каждое утро",        progress: 60 },
  { id: "2", sphere: "finance" as const,      label: "Финансы",       goal: "Сформировать финансовую подушку",    progress: 35 },
  { id: "3", sphere: "work" as const,         label: "Работа",        goal: "Запустить новый проект",             progress: 75 },
  { id: "4", sphere: "spirituality" as const, label: "Духовность",    goal: "Медитировать ежедневно 30 дней",     progress: 50 },
  { id: "5", sphere: "relations" as const,    label: "Отношения",     goal: "Проводить больше времени с семьёй",  progress: 40 },
  { id: "6", sphere: "hobby" as const,        label: "Хобби",         goal: "Научиться играть на гитаре",         progress: 20 },
];

export function Goals() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide pt-2">Цели</h1>
      <div className="grid grid-cols-1 gap-4">
        {mockGoals.map((g) => {
          const s = sphereColors[g.sphere];
          return (
            <div key={g.id}
              className="rounded-2xl border p-5 transition-all"
              style={{ borderColor: s.color + "30", background: `${s.color}08` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${s.color})` }}>
                  {s.icon}
                </span>
                <div>
                  <p className="text-xs font-medium" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-sm text-white/70">{g.goal}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${g.progress}%`, background: s.color, boxShadow: `0 0 8px ${s.color}60` }}
                  />
                </div>
                <span className="text-xs font-semibold" style={{ color: s.color }}>{g.progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
