"use client";

import { useEffect, useRef, useState } from "react";

type CliLine = { type: string; text: string };

/**
 * Drives the terminal autoplay animation in the CodeSection.
 * Cycles through `lines` with per-line delays, then restarts after `restartDelayMs`.
 */
export function useCliAutoplay(
  lines: ReadonlyArray<readonly [string, string]>,
  restartDelayMs = 2400,
): CliLine[] {
  const [termLines, setTermLines] = useState<CliLine[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let idx = 0;

    const play = () => {
      setTermLines([]);
      idx = 0;

      const append = () => {
        if (idx >= lines.length) {
          timerRef.current = window.setTimeout(play, restartDelayMs);
          return;
        }
        const [type, text] = lines[idx++];
        setTermLines((prev) => [...prev, { type, text }]);
        timerRef.current = window.setTimeout(append, type === "prompt" ? 900 : 350);
      };

      append();
    };

    play();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [lines, restartDelayMs]);

  return termLines;
}
