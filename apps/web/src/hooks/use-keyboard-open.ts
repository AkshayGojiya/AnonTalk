"use client";

import { useEffect, useState } from "react";

// Height difference beyond which we consider the on-screen keyboard open --
// comfortably above normal browser-chrome (address bar) show/hide jitter
// (usually well under 100px) but below the smallest real software keyboard
// (200px+). Deliberately not driven by input focus/blur: dismissing the
// keyboard via its own dismiss button doesn't reliably blur the input on
// every mobile browser, so focus state alone can't be trusted here.
const KEYBOARD_HEIGHT_THRESHOLD_PX = 150;

// The keyboard's own open animation isn't always a single smooth resize --
// e.g. a predictive-text bar can appear first, before the full keyboard
// slides up -- so an early event can report a height delta still under the
// threshold. Settling briefly after the last event judges the keyboard's
// actual final height instead of a mid-animation snapshot, which is what let
// the End Chat/Next row show up while the keyboard was, in fact, open.
const SETTLE_DELAY_MS = 60;

export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    function check() {
      setOpen(window.innerHeight - vv!.height > KEYBOARD_HEIGHT_THRESHOLD_PX);
    }

    function onViewportChange() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(check, SETTLE_DELAY_MS);
    }

    check();
    vv.addEventListener("resize", onViewportChange);
    return () => {
      vv.removeEventListener("resize", onViewportChange);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return open;
}
