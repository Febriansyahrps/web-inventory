"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Count-up length in milliseconds. */
  duration?: number;
}

/**
 * Counts up to `value` whenever it changes, rendering an id-ID grouped integer.
 * Each run starts from the currently displayed number, so a value arriving
 * mid-animation continues from where it is instead of jumping.
 */
const AnimatedNumber = ({ value, duration = 800 }: AnimatedNumberProps) => {
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (from === value) return;

    // Reduced-motion users land on the final value on the first frame.
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = instant ? 1 : Math.min(1, (now - startedAt) / duration);
      // easeOutCubic — quick off the mark, settles onto the final value.
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (value - from) * eased;
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{Math.round(display).toLocaleString("id-ID")}</>;
};

export default AnimatedNumber;
