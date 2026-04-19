import { useStore } from "./store";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let serverTs = 0;
let syncing = false;

async function pull(): Promise<void> {
  if (syncing) return;
  try {
    const res = await fetch("/api/state");
    if (!res.ok) return;
    const json = await res.json() as { state: unknown; updatedAt: number };
    if (!json.state || json.updatedAt <= serverTs) return;
    serverTs = json.updatedAt;
    syncing = true;
    localStorage.setItem(
      "life-dashboard-v2",
      JSON.stringify({ state: json.state, version: 0 }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useStore as any).persist.rehydrate();
    setTimeout(() => { syncing = false; }, 200);
  } catch { /* offline */ }
}

async function push(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partial = (useStore as any).persist.getOptions().partialize(useStore.getState());
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) return;
    const json = await res.json() as { updatedAt: number };
    serverTs = json.updatedAt;
  } catch { /* offline */ }
}

function schedulePush(): void {
  if (syncing) return;
  if (pushTimer !== null) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushTimer = null; void push(); }, 1500);
}

export function startSync(): () => void {
  void pull();

  const unsub = useStore.subscribe(schedulePush);
  const interval = setInterval(() => void pull(), 10_000);

  const onVisible = (): void => {
    if (document.visibilityState === "visible") void pull();
  };
  const onOnline = (): void => { void pull(); };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);

  const onUnload = (): void => {
    if (pushTimer !== null) { clearTimeout(pushTimer); pushTimer = null; void push(); }
  };
  window.addEventListener("pagehide", onUnload);

  return () => {
    unsub();
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("pagehide", onUnload);
  };
}
