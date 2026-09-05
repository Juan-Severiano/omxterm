export const disposableVmFlag = "--disposable-vm-allow-omxterm-replacement";

export function windowsVerificationOptions(args, platform = process.platform) {
  const options = { windowsUnpackedOnly: false, disposableVm: false };
  for (const argument of args) {
    if (platform !== "win32")
      throw new Error("Windows verification options require Windows");
    if (argument === disposableVmFlag && !options.disposableVm)
      options.disposableVm = true;
    else if (
      argument === "--windows-unpacked-only" &&
      !options.windowsUnpackedOnly
    )
      options.windowsUnpackedOnly = true;
    else throw new Error("Unknown or duplicate package verification option");
  }
  if (options.windowsUnpackedOnly && options.disposableVm)
    throw new Error(
      "Unpacked diagnostics cannot authorize installer replacement",
    );
  return options;
}
