"use client";

import { useEffect } from "react";

// rAF-throttled, not debounced: during the keyboard open/close animation the
// visual viewport fires many resize/scroll events over ~250ms, and waiting
// for them to stop (a debounce) leaves --app-vh stale for that whole window.
// A stale (too-tall) height is exactly what lets iOS drag the entire page
// (header included) until the delayed correction snaps it back. Applying on
// every animation frame keeps the doc height live with the real keyboard
// animation instead of lagging behind it.
export function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let rafId: number | null = null;

    function apply() {
      rafId = null;
      document.documentElement.style.setProperty("--app-vh", `${vv!.height}px`);
      if (document.documentElement.scrollTop !== 0 || vv!.offsetTop !== 0) {
        window.scrollTo(0, 0);
      }
    }

    function onViewportChange() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(apply);
    }

    apply();
    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);

    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
