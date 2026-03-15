import React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { MobileUnsupportedScreen } from "@/components/mobile/MobileUnsupportedScreen";
import { AppRouter } from "@/router/AppRouter";
import { useAuthStore } from "@/store/useAuthStore";
import "@/index.css";

registerSW({ immediate: true });

function isMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const touchCapable = navigator.maxTouchPoints > 0;
  const narrowViewport = window.matchMedia("(max-width: 1023px)").matches;
  const mobileUserAgent = /android|iphone|ipad|ipod|mobile/i.test(userAgent);

  return narrowViewport && (touchCapable || mobileUserAgent);
}

function AppBootstrap() {
  const initialize = useAuthStore((state) => state.initialize);
  const [mobileBlocked, setMobileBlocked] = React.useState(() => isMobileDevice());

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const update = () => {
      setMobileBlocked(isMobileDevice());
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (mobileBlocked) {
    return <MobileUnsupportedScreen />;
  }

  return <AppRouter />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppBootstrap />
    </BrowserRouter>
  </React.StrictMode>,
);
