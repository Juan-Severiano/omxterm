import { describe, expect, it, vi } from "vitest";
import { applyChromiumSandboxPolicy } from "../../src/main/chromium-sandbox-policy";

describe("Chromium sandbox launch policy", () => {
  it("disables the Linux sandbox without probing host policy", () => {
    const commandLine = { appendSwitch: vi.fn() };
    applyChromiumSandboxPolicy(commandLine, "linux");
    expect(commandLine.appendSwitch).toHaveBeenCalledExactlyOnceWith(
      "no-sandbox",
    );
  });
  it.each(["darwin", "win32"] as const)("keeps %s unchanged", (platform) => {
    const commandLine = { appendSwitch: vi.fn() };
    applyChromiumSandboxPolicy(commandLine, platform);
    expect(commandLine.appendSwitch).not.toHaveBeenCalled();
  });
});
