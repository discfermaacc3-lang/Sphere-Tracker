import { useStore } from "@/lib/store";

const navItems = [
  { key: "home",       label: "Главная",    icon: "⊹" },
  { key: "tasks",      label: "Задачи",     icon: "✓" },
  { key: "goals",      label: "Цели",       icon: "◎" },
  { key: "stats",      label: "Статистика", icon: "▦" },
  { key: "focus",      label: "Фокус",      icon: "◉" },
  { key: "ideas",      label: "Идеи",       icon: "⚡" },
  { key: "notes",      label: "Заметки",    icon: "✎" },
  { key: "calendar",   label: "Календарь",  icon: "▦" },
];

export function Sidebar() {
  const { currentPage, setCurrentPage } = useStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-8 gap-2 z-40 border-r border-white/5"
      style={{ background: "rgba(10,10,18,0.97)", backdropFilter: "blur(20px)" }}>
      {/* Logo */}
      <div className="mb-6 w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
        <span className="text-white text-sm">L</span>
      </div>

      {navItems.map((item) => {
        const active = currentPage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setCurrentPage(item.key)}
            title={item.label}
            className={`group relative flex flex-col items-center gap-1 w-16 py-3 rounded-xl transition-all duration-200 cursor-pointer
              ${active
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white/70 hover:bg-white/5"}`}
          >
            <span className={`text-xl transition-all duration-200 ${active ? "scale-110" : "group-hover:scale-105"}`}>
              {item.icon}
            </span>
            <span className="text-[9px] font-medium tracking-wide leading-tight">
              {item.label}
            </span>
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full"
                style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" }} />
            )}
          </button>
        );
      })}
    </aside>
  );
}
