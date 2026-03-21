import { useState } from "react";
import { useStore } from "@/lib/store";

const navItems = [
  { key: "home",     label: "Главная",    icon: "✦"  },
  { key: "tasks",    label: "Задачи",     icon: "◈"  },
  { key: "goals",    label: "Цели",       icon: "◎"  },
  { key: "stats",    label: "Статистика", icon: "◉"  },
  { key: "focus",    label: "Фокус",      icon: "⊛"  },
  { key: "ideas",    label: "Идеи",       icon: "⋆"  },
  { key: "notes",    label: "Заметки",    icon: "✎"  },
  { key: "calendar", label: "Календарь",  icon: "◫"  },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, focusIsRunning } = useStore();
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  function handleNav(key: string) {
    if (key === currentPage) return;
    if (currentPage === "focus" && focusIsRunning) {
      setPendingNav(key);
      return;
    }
    setCurrentPage(key);
  }

  function confirmAbort() {
    if (pendingNav) setCurrentPage(pendingNav);
    setPendingNav(null);
  }

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen w-[68px] flex flex-col items-center py-7 gap-1 z-40 sidebar-scroll"
        style={{
          background: "rgba(16,12,38,0.75)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRight: "1px solid rgba(167,139,250,0.08)",
        }}
      >
        {/* Logo — neon hand + sprout icon */}
        <div
          className="mb-7 w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,rgba(167,139,250,0.18),rgba(109,40,217,0.14))",
            boxShadow: "0 0 20px rgba(167,139,250,0.4), 0 0 40px rgba(167,139,250,0.14), inset 0 1px 0 rgba(255,255,255,0.07)",
            border: "1px solid rgba(167,139,250,0.32)",
          }}
        >
          {/* SVG traced from approved reference — one continuous neon line */}
          <svg viewBox="0 0 100 108" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="34">
            <defs>
              <filter id="neon" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur1" />
                <feGaussianBlur stdDeviation="1.5" result="blur2" in="SourceGraphic" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Outer arc sweeping from left-wrist over top to right ── */}
            {/* Starts at wrist area (18,75), sweeps CCW over top (50,14), ends at (82,62) */}
            <path
              d="M 20,72 C 16,60 12,42 18,28 C 26,12 44,6 62,10 C 78,14 88,30 86,52 C 85,62 80,68 76,72"
              stroke="#ddd6fe"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Palm base (left side, connecting wrist to fingers) ── */}
            <path
              d="M 20,72 C 18,78 22,86 30,88 C 44,92 62,90 74,84 C 80,80 80,74 76,72"
              stroke="#ddd6fe"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Finger 1 (index — leftmost, tallest) ── */}
            <path
              d="M 20,72 C 16,68 12,60 14,52"
              stroke="#ddd6fe"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Finger 2 (middle) ── */}
            <path
              d="M 24,74 C 19,70 17,63 20,56"
              stroke="#ddd6fe"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Finger 3 (ring) ── */}
            <path
              d="M 29,76 C 25,73 24,67 27,61"
              stroke="#ddd6fe"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Plant stem ── */}
            <path
              d="M 50,82 C 50,72 50,58 50,36"
              stroke="#ddd6fe"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Left leaf (large) ── */}
            <path
              d="M 50,58 C 44,52 30,46 28,36 C 32,28 44,34 50,48"
              stroke="#ddd6fe"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Right leaf (large) ── */}
            <path
              d="M 50,54 C 56,48 70,42 72,32 C 68,24 56,30 50,44"
              stroke="#ddd6fe"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#neon)"
            />

            {/* ── Top bud / small center leaf ── */}
            <path
              d="M 50,38 C 46,30 46,20 50,14 C 54,20 54,30 50,38"
              stroke="#ddd6fe"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#neon)"
            />
          </svg>
        </div>

        {navItems.map((item) => {
          const active = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              title={item.label}
              className="relative flex flex-col items-center gap-1 w-[54px] py-3 rounded-2xl transition-all duration-300 cursor-pointer group"
              style={{
                background: active ? "rgba(167,139,250,0.12)" : "transparent",
              }}
            >
              {active && (
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "rgba(167,139,250,0.08)",
                    boxShadow: "0 0 20px rgba(167,139,250,0.2)",
                  }}
                />
              )}

              <span
                className="relative text-lg transition-all duration-300"
                style={{
                  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.22)",
                  filter: active
                    ? "drop-shadow(0 0 8px rgba(167,139,250,0.9)) drop-shadow(0 0 16px rgba(167,139,250,0.5))"
                    : "none",
                  transform: active ? "scale(1.1)" : "scale(1)",
                }}
              >
                {item.icon}
              </span>

              <span
                className="relative text-[8px] font-medium tracking-wide leading-tight transition-all duration-300"
                style={{
                  color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.18)",
                  textShadow: active ? "0 0 8px rgba(167,139,250,0.6)" : "none",
                }}
              >
                {item.label}
              </span>

              {active && (
                <div
                  className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                  style={{
                    background: "linear-gradient(to bottom, rgba(167,139,250,0.8), rgba(139,92,246,0.4))",
                    boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                  }}
                />
              )}
            </button>
          );
        })}
      </aside>

      {/* ── Guard Modal ── */}
      {pendingNav && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(4,3,12,0.72)", backdropFilter: "blur(10px)" }}
        >
          <div
            className="flex flex-col gap-7 max-w-sm w-full mx-6 rounded-3xl p-8"
            style={{
              background: "rgba(14,10,30,0.92)",
              border: "1px solid rgba(167,139,250,0.22)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 0 80px rgba(167,139,250,0.12), 0 40px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <span style={{ fontSize: 30, lineHeight: 1, filter: "drop-shadow(0 0 12px rgba(167,139,250,0.7))" }}>⚡</span>
              <h3
                className="text-base font-light tracking-[0.10em]"
                style={{ color: "rgba(255,255,255,0.90)", textShadow: "0 0 20px rgba(167,139,250,0.35)" }}
              >
                Прервать фокус?
              </h3>
              <p className="text-xs leading-relaxed max-w-[240px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                Если вы уйдёте сейчас, прогресс текущей сессии будет потерян.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setPendingNav(null)}
                className="w-full py-3 rounded-2xl text-sm font-light tracking-[0.10em] transition-all"
                style={{
                  background: "rgba(167,139,250,0.18)",
                  color: "#a78bfa",
                  border: "1px solid rgba(167,139,250,0.35)",
                  boxShadow: "0 0 28px rgba(167,139,250,0.12)",
                  textShadow: "0 0 10px #a78bfa",
                }}
              >
                Продолжить фокус
              </button>
              <button
                onClick={confirmAbort}
                className="w-full py-3 rounded-2xl text-sm font-light tracking-[0.10em] transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Да, прервать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
