import { sphereColors, sphereKeys } from "@/lib/sphereColors";

const mockStats = sphereKeys.map((key) => ({
  key,
  value: Math.floor(Math.random() * 60) + 20,
  tasks: Math.floor(Math.random() * 8) + 1,
  done: Math.floor(Math.random() * 6),
}));

export function Stats() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide pt-2">Статистика</h1>
      <div className="grid grid-cols-2 gap-4">
        {mockStats.map(({ key, value, tasks, done }) => {
          const s = sphereColors[key];
          return (
            <div key={key} className="rounded-2xl border p-5 transition-all"
              style={{ borderColor: s.color + "25", background: `${s.color}06` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-medium" style={{ color: s.color }}>{s.label}</span>
              </div>
              <div className="text-3xl font-bold text-white/80 mb-2">{value}%</div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${value}%`, background: s.color, boxShadow: `0 0 8px ${s.color}50` }}
                />
              </div>
              <p className="text-xs text-white/30">{done}/{tasks} задач</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
