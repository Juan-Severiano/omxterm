import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  copyFile,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  rmdir,
  unlink,
} from "node:fs/promises";
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
// PowerShell treats U+2018–U+201B as single-quote delimiters too.
const unsafeNsisPath = /[\u0000-\u001f'"\u2018-\u201b]/u;

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

async function inspectOwnedInstallerCache(directory, installerDigest) {
  const installer = path.join(directory, "installer.exe");
  const [folder, file] = await Promise.all([
    lstat(directory),
    lstat(installer),
  ]);
  if (
    !folder.isDirectory() ||
    folder.isSymbolicLink() ||
    !file.isFile() ||
    file.isSymbolicLink() ||
    (await digest(installer)) !== installerDigest
  )
    throw new Error(
      "NSIS installer cache ownership or bytes differ; retain cache and transaction evidence",
    );
  return installer;
}

export function assertOwnedRegistration(state, root, cacheDirectory) {
  const registrations = state.registrations;
  if (
    state.processes ||
    !path.win32.isAbsolute(root) ||
    unsafeNsisPath.test(root) ||
    !registrations.length ||
    registrations.some((entry) => entry.hive !== "CurrentUser")
  )
    throw new Error(
      "Installer transaction ownership is not established; retain VM evidence without executing cleanup",
    );
  const expectedExecutable = path.win32.join(root, "OMXTerm.exe");
  if (
    (state.paths ?? []).some(
      (entry) =>
        entry.scope !== "user" ||
        (entry.kind === "cache"
          ? !cacheDirectory ||
            entry.path.toLowerCase() !== cacheDirectory.toLowerCase()
          : entry.kind === "install"
            ? entry.path.toLowerCase() !== root.toLowerCase()
            : entry.target.toLowerCase() !== expectedExecutable.toLowerCase()),
    )
  )
    throw new Error(
      "Unowned Windows installation path or shortcut; retain VM evidence without executing installer or cleanup",
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
  execute = execFile,
  temporaryDirectory = tmpdir(),
  localAppData = process.env.LOCALAPPDATA,
}) {
  inspectWindowsInstallerInputs(
    await readFile(path.join(projectRoot, "electron-builder.yml"), "utf8"),
    require("app-builder-lib/package.json").version,
    JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"))
      .name,
  );
  const installerDigest = await digest(installer);
  let installRoot;
  let cacheDirectory;
  let entered = false;
  const result = await verifyWindowsInstaller({
    disposableVm,
    io: {
      inspect: () => inspectWindowsInstallation(execute),
      async install() {
        // Recheck immediately at the side-effect boundary, not before a long build.
        const current = await inspectWindowsInstallation(execute);
        if (current.processes)
          throw new Error(
            "Conflicting OMXTerm processes; installer not launched",
          );
        if (!localAppData || !path.win32.isAbsolute(localAppData))
          throw new Error("Unknown local application data directory");
        cacheDirectory = path.join(localAppData, "omxterm-updater");
        if (current.paths.some((entry) => entry.kind === "cache"))
          throw new Error(
            "Unowned pre-existing NSIS installer cache; preserve it and use a clean disposable VM",
          );
        if (current.paths.length && !current.registrations.length)
          throw new Error(
            "Unowned Windows installation path; use a clean disposable VM",
          );
        if (current.registrations.length) {
          // Deliberate replacement supports the known per-user installation only;
          // orphan/machine/unknown registration is not permission to execute its commands.
          const previousRoot = path.win32.join(
            localAppData,
            "Programs",
            "omxterm",
          );
          assertOwnedRegistration(current, previousRoot);
        }
        if ((await digest(installer)) !== installerDigest)
          throw new Error("Installer identity changed before launch");
        // The pinned NSIS process check embeds INSTDIR in a PowerShell literal.
        // Reject paths that cannot survive that dependency's quoting boundary.
        if (unsafeNsisPath.test(temporaryDirectory))
          throw new Error(
            "Unsafe NSIS temporary path; use a clean disposable VM",
          );
        installRoot = await mkdtemp(
          path.join(temporaryDirectory, "omxterm-installed-"),
        );
        const beforeLaunch = await inspectWindowsInstallation(
          execute,
          installRoot,
        );
        if (beforeLaunch.processes)
          throw new Error(
            "Conflicting NSIS path-prefix processes; installer not launched, temporary evidence retained",
          );
        if (beforeLaunch.paths.some((entry) => entry.kind === "cache"))
          throw new Error(
            "Unowned pre-existing NSIS installer cache; installer not launched, temporary evidence retained",
          );
        console.warn(
          "WARNING: authorized disposable VM exact NSIS test may remove existing OMXTerm and replace its registration/shortcuts. /D is NOT isolation. User data is not deleted.",
        );
        entered = true;
        await execute(installer, ["/S", `/D=${installRoot}`], {
          timeout: 120_000,
        });
      },
      async verify() {
        assertOwnedRegistration(
          await inspectWindowsInstallation(execute, installRoot),
          installRoot,
          cacheDirectory,
        );
        await inspectOwnedInstallerCache(cacheDirectory, installerDigest);
        await comparePayload(unpackedRoot, installRoot);
        await verifyInstalled(installRoot);
        if ((await digest(installer)) !== installerDigest)
          throw new Error("Installer identity changed during verification");
      },
      async uninstall() {
        if (!entered) return;
        assertOwnedRegistration(
          await inspectWindowsInstallation(execute, installRoot),
          installRoot,
          cacheDirectory,
        );
        await inspectOwnedInstallerCache(cacheDirectory, installerDigest);
        const uninstaller = path.join(installRoot, "Uninstall OMXTerm.exe");
        const uninstallerDigest = await digest(uninstaller);
        // NSIS's PowerShell process check would terminate an in-place uninstaller
        // itself. Relocate identical bytes outside INSTDIR's termination prefix.
        // _?= then keeps this relocated process synchronous and selects only our root.
        const cleanupRoot = await mkdtemp(
          path.join(temporaryDirectory, "omxterm-uninstaller-"),
        );
        const relocatedUninstaller = path.join(
          cleanupRoot,
          "Uninstall OMXTerm.exe",
        );
        await copyFile(
          uninstaller,
          relocatedUninstaller,
          constants.COPYFILE_EXCL,
        );
        if ((await digest(relocatedUninstaller)) !== uninstallerDigest)
          throw new Error(
            "Owned uninstaller copy differs; retain transaction evidence",
          );
        assertOwnedRegistration(
          await inspectWindowsInstallation(execute, installRoot),
          installRoot,
          cacheDirectory,
        );
        await execute(
          relocatedUninstaller,
          ["/S", "/currentuser", `_?=${installRoot}`],
          { timeout: 120_000 },
        );
        // Pre-existing caches were refused. Remove only our unchanged exact copy;
        // never recursively delete cache contents or discard newly arrived files.
        await unlink(
          await inspectOwnedInstallerCache(cacheDirectory, installerDigest),
        );
        await rmdir(cacheDirectory);
        const deadline = Date.now() + 20_000;
        for (;;) {
          const after = await inspectWindowsInstallation(execute, installRoot);
          if (!after.existing && !after.processes) break;
          if (Date.now() >= deadline)
            throw new Error(
              "NSIS cleanup incomplete: registration, shortcuts, default installation or processes remain; retain VM evidence",
            );
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        for (const directory of [installRoot, cleanupRoot])
          await rm(directory, {
            recursive: true,
            force: true,
            maxRetries: 10,
            retryDelay: 200,
          });
      },
    },
  });
  return { ...result, sha256: installerDigest, installerCacheRemoved: true };
}
