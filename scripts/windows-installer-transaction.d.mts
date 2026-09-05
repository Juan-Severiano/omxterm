export function assertOwnedRegistration(
  state: {
    readonly processes: boolean;
    readonly registrations: readonly {
      readonly hive: string;
      readonly view: string;
      readonly kind: string;
      readonly location: string | null;
      readonly uninstall: string | null;
      readonly shortcut?: string | null;
      readonly menu?: string | null;
    }[];
  },
  root: string,
): void;
export function verifyExactWindowsInstaller(options: {
  readonly installer: string;
  readonly unpackedRoot: string;
  readonly projectRoot: string;
  readonly disposableVm: boolean;
  readonly verifyInstalled: (root: string) => Promise<unknown>;
}): Promise<{ replacedExisting: boolean; sha256: string }>;
