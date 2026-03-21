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
        {/* Logo — Sphere Tracker icon */}
        <div
          className="mb-7 w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(167,139,250,0.06)",
            boxShadow: "0 0 18px rgba(167,139,250,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
            border: "1px solid rgba(167,139,250,0.18)",
          }}
        >
          <svg
            viewBox="0 0 40 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="33"
          >
            <defs>
              <filter id="glw" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="1.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#86efac" />
              </linearGradient>
            </defs>

            {/* ── Upper arc of the sphere ── */}
            {/* Goes from bottom-left (6,26) over the top (20,5) to bottom-right (34,26) */}
            <path
              d="M 6,26 C 6,10 34,10 34,26"
              stroke="#c4b5fd"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Branch stem growing from top-right of arc (~31, 15) ── */}
            <path
              d="M 29,14 C 31,11 33,8 32,5"
              stroke="#c4b5fd"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Leaf 1 — center, largest ── */}
            <path
              d="M 31,9 C 35,7 36,4 33,3 C 30,4 29,7 31,9 Z"
              stroke="url(#leafGrad)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Leaf 2 — left of stem ── */}
            <path
              d="M 30,12 C 26,10 25,7 27,6 C 29,7 30,10 30,12 Z"
              stroke="url(#leafGrad)"
              strokeWidth="0.95"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Leaf 3 — small tip ── */}
            <path
              d="M 32,6 C 34,4 36,2 35,1 C 33,1 31,4 32,6 Z"
              stroke="url(#leafGrad)"
              strokeWidth="0.85"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Lower arc (palm) — holds the sphere from below ── */}
            <path
              d="M 7,28 C 7,38 33,38 33,28"
              stroke="#c4b5fd"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Finger 1 (index) spreading from left end ── */}
            <path
              d="M 7,27 C 4,25 3,21 5,19"
              stroke="#c4b5fd"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Finger 2 (middle) ── */}
            <path
              d="M 7,28 C 3,27 2,24 4,22"
              stroke="#c4b5fd"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              filter="url(#glw)"
            />

            {/* ── Finger 3 (ring/pinky) ── */}
            <path
              d="M 7,29 C 3,30 2,33 4,35"
              stroke="#c4b5fd"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
              filter="url(#glw)"
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
