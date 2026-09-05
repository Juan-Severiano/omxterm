import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { verifyExactWindowsInstaller } from "../../scripts/windows-installer-transaction.mjs";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

// Scoped filesystem integration. Every OS command is mocked: this never runs
// PowerShell, an installer, an uninstaller, or a packaged application.
async function refusedTransaction(
  observation: unknown,
  suffix = "safe",
  localAppData = "C:\\fixture\\Local",
  expected = /unowned/i,
  transactionRootConflict = false,
) {
  const root = await mkdtemp(path.join(tmpdir(), "omxterm-nsis-regression-"));
  const temporaryDirectory = path.join(root, suffix);
  const installer = path.join(root, "synthetic-installer.exe");
  const launches: string[] = [];
  const execute = vi.fn(async (file: string, args: string[]) => {
    if (args.includes("-Guid"))
      return {
        stdout: JSON.stringify(
          transactionRootConflict
            ? {
                registrations: [],
                paths: [],
                processes: args.includes("-TransactionRoot"),
              }
            : observation,
        ),
      };
    launches.push(file);
    throw new Error("Unexpected installer or uninstaller launch");
  });
  try {
    await mkdir(temporaryDirectory);
    await writeFile(installer, "synthetic bytes; never executable");
    const outcome = verifyExactWindowsInstaller({
      installer,
      unpackedRoot: root,
      projectRoot,
      disposableVm: true,
      verifyInstalled: vi.fn(),
      execute,
      temporaryDirectory,
      localAppData,
    });
    await expect(outcome).rejects.toThrow(expected);
    expect(launches).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("exact NSIS transaction side-effect refusal", () => {
  it("refuses the transaction destination's process footprint before installer or cleanup", async () => {
    await refusedTransaction(undefined, "safe", undefined, /process/i, true);
  });
  it.each(["\u2018", "\u2019", "\u201a", "\u201b"])(
    "refuses a PowerShell quote in the temporary path: %s",
    async (quote) => {
      await refusedTransaction(
        { registrations: [], paths: [], processes: false },
        `temp-${quote}`,
        undefined,
        /unsafe/i,
      );
    },
  );

  it.each(["\u2018", "\u2019", "\u201a", "\u201b"])(
    "refuses a PowerShell quote in the previous installation root: %s",
    async (quote) => {
      const localAppData = `C:\\fixture${quote}\\Local`;
      const location = `${localAppData}\\Programs\\omxterm`;
      await refusedTransaction(
        {
          processes: false,
          paths: [],
          registrations: [
            {
              hive: "CurrentUser",
              view: "Registry64",
              kind: "install",
              location,
              uninstall: null,
              shortcut: "OMXTerm",
              menu: null,
            },
            {
              hive: "CurrentUser",
              view: "Registry64",
              kind: "uninstall",
              location: null,
              uninstall: `"${location}\\Uninstall OMXTerm.exe" /currentuser`,
              shortcut: null,
              menu: null,
            },
          ],
        },
        "safe",
        localAppData,
        /ownership/i,
      );
    },
  );
  it.each([
    {
      path: "C:\\fixture\\Desktop\\OMXTerm.lnk",
      scope: "user",
      kind: "shortcut",
      target: "C:\\OtherApp\\app.exe",
    },
    {
      path: "C:\\Program Files\\OMXTerm",
      scope: "machine",
      kind: "install",
      target: null,
    },
  ])(
    "refuses unowned conflicts beside a valid per-user registration: %j",
    async (entry) => {
      const location = "C:\\fixture\\Local\\Programs\\omxterm";
      await refusedTransaction({
        processes: false,
        paths: [entry],
        registrations: [
          {
            hive: "CurrentUser",
            view: "Registry64",
            kind: "install",
            location,
            uninstall: null,
            shortcut: "OMXTerm",
            menu: null,
          },
          {
            hive: "CurrentUser",
            view: "Registry64",
            kind: "uninstall",
            location: null,
            uninstall: `"${location}\\Uninstall OMXTerm.exe" /currentuser`,
            shortcut: null,
            menu: null,
          },
        ],
      });
    },
  );
  it.each([
    "C:\\fixture\\Desktop\\OMXTerm.lnk",
    "C:\\fixture\\Local\\Programs\\omxterm",
  ])(
    "refuses an orphan path before installer and cleanup: %s",
    async (target) => {
      await refusedTransaction({
        registrations: [],
        paths: [{ path: target, scope: "user", kind: "install", target: null }],
        processes: false,
      });
    },
  );
});
