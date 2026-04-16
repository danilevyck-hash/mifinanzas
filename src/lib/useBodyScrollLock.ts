"use client";

import { useEffect } from "react";

/**
 * Locks body scroll when `isOpen` is true.
 *
 * Does NOT use body.position=fixed (which creates a containing block
 * and breaks position:fixed on portal children). Instead uses
 * overflow:hidden on both html+body + touch-action:none to prevent
 * all scroll gestures including iOS keyboard auto-scroll.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const origHtmlOverflow = html.style.overflow;
    const origBodyOverflow = body.style.overflow;
    const origBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    html.style.setProperty("--scroll-lock-y", `-${scrollY}px`);
    body.style.marginTop = `${-scrollY}px`;
    body.style.height = `calc(100% + ${scrollY}px)`;

    return () => {
      html.style.overflow = origHtmlOverflow;
      body.style.overflow = origBodyOverflow;
      body.style.touchAction = origBodyTouchAction;
      body.style.marginTop = "";
      body.style.height = "";
      html.style.removeProperty("--scroll-lock-y");
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
}
