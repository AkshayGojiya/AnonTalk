"use client";

import { useEffect } from "react";

// iOS Safari has ignored the `user-scalable=no` / `maximum-scale=1` viewport
// meta tags since iOS 10 (an accessibility requirement) -- pinch-zoom can
// only actually be blocked from JS, by intercepting Safari's proprietary
// gesture events and any multi-touch touchmove (covers other mobile browsers).
export function PinchZoomGuard() {
  useEffect(() => {
    function preventGesture(e: Event) {
      e.preventDefault();
    }
    function preventMultiTouchMove(e: TouchEvent) {
      if (e.touches.length > 1) e.preventDefault();
    }

    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("touchmove", preventMultiTouchMove, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouchMove);
    };
  }, []);

  return null;
}
