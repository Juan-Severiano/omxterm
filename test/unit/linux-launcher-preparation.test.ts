import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import verifyLinuxLauncherPreparation, {
  prepareLinuxLauncher,
} from "../../scripts/prepare-linux-launcher.mjs";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn(), writeFile: vi.fn() }));

describe("Linux packaging launcher preparation", () => {
  afterEach(() => vi.resetAllMocks());
  it("refuses unknown dependency bytes without writing a best-effort correction", async () => {
    vi.mocked(readFile).mockResolvedValue("unknown generator");
    await expect(prepareLinuxLauncher()).rejects.toThrow("Unrecognized");
    expect(writeFile).not.toHaveBeenCalled();
  });
  it("blocks direct Linux packaging without prepared dependency bytes", async () => {
    vi.mocked(readFile).mockResolvedValue("unknown generator");
    await expect(
      verifyLinuxLauncherPreparation({ electronPlatformName: "linux" }),
    ).rejects.toThrow("npm run package:linux");
    expect(writeFile).not.toHaveBeenCalled();
  });
  it.each(["darwin", "win32"])(
    "leaves %s packaging unchanged",
    async (platform) => {
      await expect(
        verifyLinuxLauncherPreparation({ electronPlatformName: platform }),
      ).resolves.toBeUndefined();
      expect(readFile).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
    },
  );
});
