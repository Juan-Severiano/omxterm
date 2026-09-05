export const disposableVmFlag: string;
export function windowsVerificationOptions(
  args: readonly string[],
  platform?: string,
): {
  windowsUnpackedOnly: boolean;
  disposableVm: boolean;
};
