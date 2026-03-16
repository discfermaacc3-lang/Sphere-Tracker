import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
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
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark min-h-screen flex" style={{ background: "#070712" }}>
        <Sidebar />
        <main className="ml-20 flex-1 min-h-screen overflow-y-auto px-8 py-8">
          <PageContent />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
