"use client";

import { useState } from "react";

/**
 * Returns a [copied, copy] tuple.
 * `copy(text)` writes to clipboard and sets `copied = true` for `resetMs` milliseconds.
 */
export function useCopyToClipboard(resetMs = 2000): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), resetMs);
  };

  return [copied, copy];
}
