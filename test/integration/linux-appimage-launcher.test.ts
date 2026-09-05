import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { prepareLinuxLauncher } from "../../scripts/prepare-linux-launcher.mjs";
import { inspectLinuxAppRun } from "../../scripts/verify-linux-sandbox.mjs";

await prepareLinuxLauncher();
const { generateAppRunScript } =
  await import("app-builder-lib/out/targets/appimage/appImageUtil.js");
const launcher = generateAppRunScript({
  ExecutableName: "omxterm",
  DesktopFileName: "omxterm.desktop",
  ProductFilename: "OMXTerm",
  ProductName: "OMXTerm",
  ResourceName: "appimagekit-omxterm",
});

// Real generated launcher, isolated fake OS probe and application executable.
// The executable models Electron refusing unavailable sandbox prerequisites.
describe.skipIf(process.platform === "win32")("generated Linux AppRun", () => {
  it.each(["denied", "missing"])(
    "preserves sandbox initialization failure with a %s namespace probe",
    (probe) => {
      const root = mkdtempSync(path.join(tmpdir(), "omxterm-launcher-"));
      try {
        writeFileSync(path.join(root, "AppRun"), launcher);
        if (probe === "denied")
          writeFileSync(path.join(root, "unshare"), "#!/bin/sh\nexit 1\n", {
            mode: 0o755,
          });
        writeFileSync(
          path.join(root, "omxterm"),
          `#!/bin/sh
for arg do
  if [ "$arg" = --no-sandbox ]; then exit 0; fi
done
printf '%s\\n' 'No usable sandbox!' >&2
exit 78
`,
          { mode: 0o755 },
        );
        const result = spawnSync("/bin/bash", [path.join(root, "AppRun")], {
          env: { PATH: root, APPDIR: root },
          encoding: "utf8",
        });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(78);
        expect(result.stderr).toContain("No usable sandbox");
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
  it("requires exact reviewed launcher bytes before packaged startup", () => {
    expect(() => inspectLinuxAppRun(launcher)).not.toThrow();
    expect(() =>
      inspectLinuxAppRun(launcher + "\nexec omxterm --no-sandbox\n"),
    ).toThrow("reviewed");
  });
  it("preserves literal command arguments without needing an unshare executable", () => {
    const root = mkdtempSync(path.join(tmpdir(), "omxterm-launcher-"));
    try {
      writeFileSync(path.join(root, "AppRun"), launcher);
      writeFileSync(
        path.join(root, "omxterm"),
        '#!/bin/sh\nprintf "%s\\n" "$@"\n',
        { mode: 0o755 },
      );
      const args = [
        "-e",
        "/bin/program with spaces",
        "",
        "--literal",
        "$(not-executed)",
        "--no-sandbox",
      ];
      const result = spawnSync(
        "/bin/bash",
        [path.join(root, "AppRun"), ...args],
        {
          env: { PATH: root, APPDIR: root },
          encoding: "utf8",
        },
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toBe(args.join("\n") + "\n");
      expect(result.stderr).toBe("");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
