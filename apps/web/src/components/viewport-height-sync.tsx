"use client";

import { useEffect } from "react";

/**
 * Keeps a `--app-vh` CSS var on <html> in sync with the *visual* viewport
 * height, not the layout viewport. The `interactiveWidget: "resizes-content"`
 * viewport meta (see layout.tsx) asks browsers to shrink the layout viewport
 * for the keyboard directly, but support for that directive is inconsistent
 * -- on browsers that ignore it, the layout viewport stays full-height and
 * the browser instead pans the visual viewport to reveal the focused input,
 * dragging our fixed header along with it. Sizing the app shell off
 * `visualViewport.height` (broadly supported since iOS 13) instead of `100%`
 * makes the shell itself shrink to whatever's actually visible above the
 * keyboard, so nothing needs to pan.
 */
export function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;

    function apply() {
      const height = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${height}px`);
      // iOS can pan the page to keep a focused input above the keyboard as a
      // compositor-level visual-viewport offset, independent of any DOM
      // scroll -- overflow-hidden doesn't stop it. Snapping the window scroll
      // position back to 0 on every viewport change cancels that pan so the
      // shell (now correctly sized to `height`) stays put instead of sliding
      // up with the header disappearing off the top.
      window.scrollTo(0, 0);
    }

    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);

    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  return null;
}
