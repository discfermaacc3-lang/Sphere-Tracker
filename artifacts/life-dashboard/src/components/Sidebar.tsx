import { useState } from "react";
import { useStore } from "@/lib/store";
import logoSrc from "@assets/image_1774123650282.png";

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
        className="hidden md:flex fixed left-0 top-0 h-screen w-[68px] flex-col items-center py-7 gap-1 z-40 sidebar-scroll"

        style={{
          background: "rgba(16,12,38,0.75)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRight: "1px solid rgba(167,139,250,0.08)",
        }}
      >
        {/* Logo — approved neon PNG */}
        <div
          className="mb-7 flex-shrink-0 overflow-hidden"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "rgb(18,12,34)",
            boxShadow: "0 0 18px rgba(167,139,250,0.5), 0 0 36px rgba(167,139,250,0.18)",
            border: "1px solid rgba(167,139,250,0.28)",
            position: "relative",
          }}
        >
          <img
            src={logoSrc}
            alt="logo"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              mixBlendMode: "screen",
            }}
          />
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
      
      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto px-1 py-1.5 gap-0.5"
        style={{
          background: "rgba(16,12,38,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(167,139,250,0.08)",
        }}
      >
        {navItems.map((item) => {
          const active = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className="flex flex-col items-center gap-0.5 flex-1 min-w-0 py-1.5 px-1 rounded-xl transition-all"
              style={{ background: active ? "rgba(167,139,250,0.12)" : "transparent" }}
            >
              <span
                style={{
                  fontSize: 17,
                  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.28)",
                  filter: active ? "drop-shadow(0 0 6px rgba(167,139,250,0.9))" : "none",
                  lineHeight: 1,
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: 7,
                  color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

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
