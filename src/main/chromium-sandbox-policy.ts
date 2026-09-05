import type { CommandLine } from "electron";

// Apply before app readiness, including unpacked launches and X11 relaunches.
// Context isolation and the preload bridge remain separate controls (ADR 0024).
export function applyChromiumSandboxPolicy(
  commandLine: Pick<CommandLine, "appendSwitch">,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform === "linux") commandLine.appendSwitch("no-sandbox");
}
