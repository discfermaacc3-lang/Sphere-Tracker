import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { startSync } from "@/lib/sync";
import { Sidebar } from "@/components/Sidebar";
import { CustomCursor } from "@/components/CustomCursor";
import { useStore } from "@/lib/store";
import { Home } from "@/pages/Home";
import { Tasks } from "@/pages/Tasks";
import { Goals } from "@/pages/Goals";
import { Stats } from "@/pages/Stats";
import { Focus } from "@/pages/Focus";
import { Ideas } from "@/pages/Ideas";
import { Notes } from "@/pages/Notes";
import { Calendar } from "@/pages/Calendar";

const queryClient = new QueryClient();

type Star = { id: number; x: number; y: number; size: number; delay: number; duration: number; bright: boolean };

function Stars() {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2.5,
      bright: Math.random() > 0.75,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Milky way soft glow */}
      <div
        className="absolute"
        style={{
          left: "-25%", top: "5%", width: "150%", height: "80%",
          background: "radial-gradient(ellipse at 55% 40%, rgba(120,90,220,0.07) 0%, rgba(80,50,160,0.04) 40%, transparent 70%)",
          transform: "rotate(-15deg)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "20%", top: "50%", width: "80%", height: "50%",
          background: "radial-gradient(ellipse at 50% 50%, rgba(60,100,180,0.05) 0%, transparent 65%)",
        }}
      />
      {/* Stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          className={s.bright ? "star" : "star-slow"}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            background: s.bright ? "white" : "rgba(200,190,255,0.9)",
            boxShadow: s.bright ? `0 0 ${s.size * 3}px rgba(255,255,255,0.8)` : "none",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function PageContent() {
  const { currentPage } = useStore();
  switch (currentPage) {
    case "home":       return <Home />;
    case "tasks":      return <Tasks />;
    case "goals":      return <Goals />;
    case "stats":      return <Stats />;
    case "focus":      return <Focus />;
    case "ideas":      return <Ideas />;
    case "notes":      return <Notes />;
    case "calendar":   return <Calendar />;
    default:           return <Home />;
  }
}

function App() {
  useEffect(() => startSync(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="dark min-h-screen flex relative"
        style={{ background: "linear-gradient(160deg,#1f1b40 0%,#161230 45%,#101026 100%)" }}
      >
        <Stars />
        <div className="relative z-10 flex w-full">
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-y-auto px-4 py-5 pb-[88px] md:ml-[68px] md:px-8 md:py-8 md:pb-10">

            <PageContent />
          </main>
        </div>
      </div>
      <CustomCursor />
    </QueryClientProvider>
  );
}

export default App;
