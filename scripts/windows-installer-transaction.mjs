import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import {
  inspectWindowsInstallation,
  inspectWindowsInstallerInputs,
  verifyWindowsInstaller,
} from "./verify-windows-installer.mjs";

const execFile = promisify(execFileCallback);
const require = createRequire(import.meta.url);

async function digest(file) {
  return createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}

async function comparePayload(source, installed) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourceFile = path.join(source, entry.name);
    const installedFile = path.join(installed, entry.name);
    if (entry.isDirectory()) await comparePayload(sourceFile, installedFile);
    else if (
      !entry.isFile() ||
      (await digest(sourceFile)) !== (await digest(installedFile))
    )
      throw new Error(
        "Exact NSIS extracted payload differs from the bound unpacked application",
      );
  }
}

export function assertOwnedRegistration(state, root) {
  const registrations = state.registrations;
  if (
    state.processes ||
    !path.win32.isAbsolute(root) ||
    /[\u0000-\u001f'"\r\n]/u.test(root) ||
    !registrations.length ||
    registrations.some((entry) => entry.hive !== "CurrentUser")
  )
    throw new Error(
      "Installer transaction ownership is not established; retain VM evidence without executing cleanup",
    );
  for (const view of new Set(registrations.map((entry) => entry.view))) {
    const entries = registrations.filter((entry) => entry.view === view);
    const install = entries.find((entry) => entry.kind === "install");
    const uninstall = entries.find((entry) => entry.kind === "uninstall");
    const expectedUninstall = `"${path.win32.join(root, "Uninstall OMXTerm.exe")}" /currentuser`;
    if (
      entries.length !== 2 ||
      install?.location?.toLowerCase() !== root.toLowerCase() ||
      install?.shortcut !== "OMXTerm" ||
      install?.menu !== null ||
      uninstall?.uninstall?.trim().toLowerCase() !==
        expectedUninstall.toLowerCase()
    )
      throw new Error(
        "Installer transaction ownership is not established; retain VM evidence without executing cleanup",
      );
  }
}

export async function verifyExactWindowsInstaller({
  installer,
  unpackedRoot,
  projectRoot,
  disposableVm,
  verifyInstalled,
}) {
  inspectWindowsInstallerInputs(
    await readFile(path.join(projectRoot, "electron-builder.yml"), "utf8"),
    require("app-builder-lib/package.json").version,
  );
  const installerDigest = await digest(installer);
  let installRoot;
  let entered = false;
  const result = await verifyWindowsInstaller({
    disposableVm,
    io: {
      inspect: inspectWindowsInstallation,
      async install() {
        // Recheck immediately at the side-effect boundary, not before a long build.
        const current = await inspectWindowsInstallation();
        if (current.processes)
          throw new Error(
            "Conflicting OMXTerm processes; installer not launched",
          );
        if (current.registrations.length) {
          const localData = process.env.LOCALAPPDATA;
          if (!localData || !path.win32.isAbsolute(localData))
            throw new Error("Unknown per-user install location");
          // Deliberate replacement supports the known per-user installation only;
          // orphan/machine/unknown registration is not permission to execute its commands.
          assertOwnedRegistration(
            current,
            path.win32.join(localData, "Programs", "omxterm"),
          );
        }
        if ((await digest(installer)) !== installerDigest)
          throw new Error("Installer identity changed before launch");
        // The pinned NSIS process check embeds INSTDIR in a PowerShell literal.
        // Reject paths that cannot survive that dependency's quoting boundary.
        if (/[\u0000-\u001f'"\r\n]/u.test(tmpdir()))
          throw new Error(
            "Unsafe NSIS temporary path; use a clean disposable VM",
          );
        installRoot = await mkdtemp(path.join(tmpdir(), "omxterm-installed-"));
        console.warn(
          "WARNING: authorized disposable VM exact NSIS test may remove existing OMXTerm and replace its registration/shortcuts. /D is NOT isolation. User data is not deleted.",
        );
        entered = true;
        await execFile(installer, ["/S", `/D=${installRoot}`], {
          timeout: 120_000,
        });
      },
      async verify() {
        assertOwnedRegistration(
          await inspectWindowsInstallation(),
          installRoot,
        );
        await comparePayload(unpackedRoot, installRoot);
        await verifyInstalled(installRoot);
        if ((await digest(installer)) !== installerDigest)
          throw new Error("Installer identity changed during verification");
      },
      async uninstall() {
        if (!entered) return;
        assertOwnedRegistration(
          await inspectWindowsInstallation(),
          installRoot,
        );
        const uninstaller = path.join(installRoot, "Uninstall OMXTerm.exe");
        await stat(uninstaller);
        // _?= runs the owned uninstaller in-place, avoiding its detached copy.
        // NSIS leaves that running file for us to remove only after verified cleanup.
        await execFile(
          uninstaller,
          ["/S", "/currentuser", `_?=${installRoot}`],
          { timeout: 120_000 },
        );
        const deadline = Date.now() + 20_000;
        for (;;) {
          const after = await inspectWindowsInstallation();
          if (!after.existing && !after.processes) break;
          if (Date.now() >= deadline)
            throw new Error(
              "NSIS cleanup incomplete: registration, shortcuts, default installation or processes remain; retain VM evidence",
            );
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        await rm(installRoot, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 200,
        });
      },
    },
  });
  return { ...result, sha256: installerDigest };
}
