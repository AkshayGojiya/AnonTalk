"use client";

import { useEffect, useState } from "react";

// Height difference beyond which we consider the on-screen keyboard open --
// comfortably above normal browser-chrome (address bar) show/hide jitter
// (usually well under 100px) but below the smallest real software keyboard
// (200px+). Deliberately not driven by input focus/blur: dismissing the
// keyboard via its own dismiss button doesn't reliably blur the input on
// every mobile browser, so focus state alone can't be trusted here.
const KEYBOARD_HEIGHT_THRESHOLD_PX = 150;

export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function check() {
      setOpen(window.innerHeight - vv!.height > KEYBOARD_HEIGHT_THRESHOLD_PX);
    }

    check();
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  return open;
}
