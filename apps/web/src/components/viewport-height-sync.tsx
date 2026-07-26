"use client";

import { useEffect } from "react";

// Debounced: reacting to every intermediate resize/scroll event during the
// keyboard animation causes visible flicker and drift (each correction can
// itself provoke another event).
const SETTLE_DEBOUNCE_MS = 100;

export function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    function settle() {
      document.documentElement.style.setProperty("--app-vh", `${vv!.height}px`);
      if (document.documentElement.scrollTop !== 0 || vv!.offsetTop !== 0) {
        window.scrollTo(0, 0);
      }
    }

    function onViewportChange() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, SETTLE_DEBOUNCE_MS);
    }

    settle();
    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);

    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
