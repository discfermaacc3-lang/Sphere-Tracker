import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Filter out browser extension errors from Vite's HMR overlay
// (MetaMask, crypto wallets inject errors that are not part of the app)
window.addEventListener("unhandledrejection", (e) => {
  const msg = e?.reason?.message ?? "";
  const stack = e?.reason?.stack ?? "";
  if (
    stack.includes("chrome-extension://") ||
    msg.includes("MetaMask") ||
    msg.includes("Receiving end does not exist") ||
    msg.includes("Could not establish connection")
  ) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
