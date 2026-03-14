import React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { AppRouter } from "@/router/AppRouter";
import { useAuthStore } from "@/store/useAuthStore";
import "@/index.css";

registerSW({ immediate: true });

function AppBootstrap() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return <AppRouter />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppBootstrap />
    </BrowserRouter>
  </React.StrictMode>,
);
