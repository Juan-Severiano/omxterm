import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyLinuxRendererSandbox } from "../../scripts/verify-linux-sandbox.mjs";

const io = vi.hoisted(() => ({
  readFile: vi.fn<(file: string) => Promise<string>>(),
  readdir: vi.fn<(directory: string) => Promise<string[]>>(),
}));
vi.mock("node:fs/promises", () => io);

const status =
  "NoNewPrivs:\t1\nSeccomp:\t2\nCapEff:\t00000000\nNSpid:\t124\t2\n";
let files: Record<string, string>;

describe("native Linux packaged sandbox observation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    files = {
      "/proc/self/uid_map": "0 0 4294967295\n",
      "/proc/123/stat": "123 (omxterm) S 1 123 123 0 0",
      "/proc/123/cmdline": "omxterm\0",
      "/proc/124/stat": "124 (omxterm ) worker) S 123 123 123 0 0",
      "/proc/124/cmdline": "omxterm\0--type=renderer\0",
      "/proc/124/uid_map": "0 1000 1\n",
      "/proc/124/task/124/status": status,
      "/proc/124/task/125/status": status,
      "/proc/900/stat": "900 (unrelated) S 1 900 900 0 0",
    };
    io.readdir.mockImplementation(async (directory) => {
      if (directory === "/proc") return ["self", "123", "124", "900"];
      if (directory === "/proc/124/task") return ["124", "125"];
      throw new Error("Unexpected process directory");
    });
    io.readFile.mockImplementation(async (file) => {
      if (files[file] === undefined)
        throw Object.assign(new Error("process evidence disappeared"), {
          code: "ENOENT",
        });
      return files[file];
    });
  });
  it("observes only this startup's renderers and all their threads", async () => {
    await expect(verifyLinuxRendererSandbox(123)).resolves.toBe(1);
  });
  it("rejects a running but unsandboxed renderer", async () => {
    files["/proc/124/uid_map"] = files["/proc/self/uid_map"]!;
    await expect(verifyLinuxRendererSandbox(123)).rejects.toThrow(
      "OS sandbox evidence",
    );
  });
  it("rejects an unsandboxed worker thread", async () => {
    files["/proc/124/task/125/status"] = status.replace(
      "Seccomp:\t2",
      "Seccomp:\t0",
    );
    await expect(verifyLinuxRendererSandbox(123)).rejects.toThrow(
      "OS sandbox evidence",
    );
  });
  it("rejects startup with no observable renderer", async () => {
    files["/proc/124/cmdline"] = "omxterm\0--type=zygote\0";
    await expect(verifyLinuxRendererSandbox(123)).rejects.toThrow(
      "No Linux renderer",
    );
  });
  it("does not infer a pass from disappearing renderer evidence", async () => {
    delete files["/proc/124/task/125/status"];
    await expect(verifyLinuxRendererSandbox(123)).rejects.toThrow(
      "disappeared",
    );
  });
  it("requires an identified startup process group", async () => {
    await expect(verifyLinuxRendererSandbox(0)).rejects.toThrow(
      "Invalid packaged process group",
    );
  });
});
