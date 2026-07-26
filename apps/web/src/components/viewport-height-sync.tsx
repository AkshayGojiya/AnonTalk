"use client";

import { useEffect } from "react";

// iOS/Safari never shrink the *layout* viewport when the keyboard opens --
// only the *visual* viewport shrinks, and it can also pan independently of
// the layout viewport (visualViewport.offsetTop), e.g. to scroll a focused
// input above the keyboard. Reactively correcting after the fact (the old
// approach: detect drift, then window.scrollTo(0, 0)) fights that native pan
// and lags behind its animation -- that's what caused the page/header to
// visibly drag away and then snap back.
//
// Instead we track the visual viewport continuously and cooperate with it:
// --app-vh mirrors its height every frame, and #viewport-shell is translated
// by its current offsetTop every frame, so the app's on-screen position stays
// glued to whatever's actually visible throughout the keyboard animation --
// the header (a non-scrolling flex item at the top of the shell) never
// visually detaches, because the whole shell moves in lockstep with the pan
// instead of the pan happening to it first and being corrected afterward.
export function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    const shell = document.getElementById("viewport-shell");
    if (!vv || !shell) return;

    let rafId: number | null = null;

    function apply() {
      rafId = null;
      document.documentElement.style.setProperty("--app-vh", `${vv!.height}px`);
      shell!.style.transform = vv!.offsetTop ? `translateY(${vv!.offsetTop}px)` : "";
      // Distinct from visualViewport.offsetTop (handled above via transform)
      // -- this only guards against the html/body scroll position itself
      // ever drifting off zero, which the transform doesn't touch.
      if (document.documentElement.scrollTop !== 0) window.scrollTo(0, 0);
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
      shell.style.transform = "";
    };
  }, []);

  return null;
}
