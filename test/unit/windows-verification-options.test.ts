import { describe, expect, it } from "vitest";
import {
  windowsVerificationOptions,
  disposableVmFlag,
} from "../../scripts/windows-verification-options.mjs";
import { assertOwnedRegistration } from "../../scripts/windows-installer-transaction.mjs";

const root = "C:\\fixture\\installed";
function registration(hive = "CurrentUser", view = "Registry64") {
  return {
    processes: false,
    registrations: [
      {
        hive,
        view,
        kind: "install",
        location: root,
        uninstall: null,
        shortcut: "OMXTerm",
        menu: null,
      },
      {
        hive,
        view,
        kind: "uninstall",
        location: null,
        uninstall:
          '"C:\\fixture\\installed\\Uninstall OMXTerm.exe" /currentuser',
      },
    ],
  };
}

describe("Windows verification invocation", () => {
  it("defaults to full verification without replacement authorization", () => {
    expect(windowsVerificationOptions([], "win32")).toEqual({
      windowsUnpackedOnly: false,
      disposableVm: false,
    });
  });
  it("accepts only deliberate literal opt-in on Windows", () => {
    expect(windowsVerificationOptions([disposableVmFlag], "win32")).toEqual({
      windowsUnpackedOnly: false,
      disposableVm: true,
    });
    expect(() =>
      windowsVerificationOptions([disposableVmFlag], "darwin"),
    ).toThrow(/Windows/);
  });
  it("labels unpacked diagnostics separately from replacement authorization", () => {
    expect(
      windowsVerificationOptions(["--windows-unpacked-only"], "win32"),
    ).toEqual({ windowsUnpackedOnly: true, disposableVm: false });
    expect(() =>
      windowsVerificationOptions(
        ["--windows-unpacked-only", disposableVmFlag],
        "win32",
      ),
    ).toThrow(/cannot authorize/);
  });
  it.each([
    { args: ["--force"] },
    { args: [disposableVmFlag, disposableVmFlag] },
    { args: ["--windows-unpacked-only", "--windows-unpacked-only"] },
  ])("rejects unknown or duplicate options: %j", ({ args }) => {
    expect(() => windowsVerificationOptions(args, "win32")).toThrow(
      /Unknown or duplicate/,
    );
  });
});

describe("owned NSIS cleanup", () => {
  it.each(["Registry32", "Registry64"])(
    "accepts the transaction root's per-user registration in %s",
    (view) => {
      expect(() =>
        assertOwnedRegistration(registration("CurrentUser", view), root),
      ).not.toThrow();
    },
  );
  it("rejects a different registered root without following the registered command", () => {
    expect(() => assertOwnedRegistration(registration(), "C:\\other")).toThrow(
      /ownership/,
    );
  });
  it("rejects unrecognized shortcut ownership", () => {
    const state = registration();
    state.registrations[0]!.shortcut = "Other App";
    expect(() => assertOwnedRegistration(state, root)).toThrow(/ownership/);
  });
  it("rejects a registry-supplied executable other than the owned uninstaller", () => {
    const state = registration();
    state.registrations[1]!.uninstall = '"C:\\unrelated.exe" /currentuser';
    expect(() => assertOwnedRegistration(state, root)).toThrow(/ownership/);
  });
  it("rejects unknown ownership, missing keys, machine state and live processes", () => {
    for (const state of [
      { processes: false, registrations: [] },
      {
        ...registration(),
        registrations: registration().registrations.slice(1),
      },
      registration("LocalMachine"),
      { ...registration(), processes: true },
    ])
      expect(() => assertOwnedRegistration(state, root)).toThrow(/ownership/);
  });
});
