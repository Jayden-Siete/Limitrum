"use client";

import { useEffect, useState } from "react";

type CliLine = { type: string; text: string };
type CliPresets = Record<string, ReadonlyArray<readonly [string, string]>>;

/**
 * Manages CLI sandbox state: selected command, input, animated output lines.
 * `animateCli` plays lines from `presets[command]` with staggered timeouts.
 */
export function useCliSandbox(presets: CliPresets, initialCommand = "limitrum simulate") {
  const [selectedCmd, setSelectedCmd] = useState(initialCommand);
  const [input, setInput] = useState(initialCommand);
  const [lines, setLines] = useState<CliLine[]>([]);

  const animateCli = (command: string) => {
    const rows: ReadonlyArray<readonly [string, string]> = presets[command] ?? [
      ["prompt", `$ ${command}`],
      ["err", `  command not found: ${command}`],
      ["dim", "  Run `limitrum --help` for usage."],
    ];
    setLines([]);
    rows.forEach(([type, text], idx) => {
      window.setTimeout(
        () => setLines((prev) => [...prev, { type, text }]),
        idx === 0 ? 40 : 120 + idx * 85,
      );
    });
  };

  // Play initial command on mount
  useEffect(() => {
    animateCli(initialCommand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCommand = (cmd: string) => {
    setSelectedCmd(cmd);
    setInput(cmd);
    animateCli(cmd);
  };

  const runCommand = () => {
    animateCli(input.trim() || "limitrum --help");
  };

  return {
    selectedCmd,
    input,
    lines,
    commands: Object.keys(presets),
    setInput,
    selectCommand,
    runCommand,
  };
}
