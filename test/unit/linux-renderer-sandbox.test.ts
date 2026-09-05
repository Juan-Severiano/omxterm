import { describe, expect, it } from "vitest";
import { inspectLinuxRendererSandbox } from "../../scripts/verify-linux-sandbox.mjs";

const hostUidMap = "0 0 4294967295\n";
const isolated = {
  arguments: ["omxterm", "--type=renderer"],
  uidMap: "0 1000 1\n",
  statuses: [
    "NoNewPrivs:\t1\nSeccomp:\t2\nCapEff:\t0000000000000000\nNSpid:\t1234\t7\n",
  ],
};

describe("Linux renderer OS sandbox evidence", () => {
  it("accepts isolated renderer threads rather than PTY readiness", () => {
    expect(inspectLinuxRendererSandbox([isolated], hostUidMap)).toBe(1);
    expect(() => inspectLinuxRendererSandbox([], hostUidMap)).toThrow(
      "No Linux renderer",
    );
  });
  it.each([
    { ...isolated, uidMap: hostUidMap },
    { ...isolated, uidMap: "" },
    { ...isolated, uidMap: "0 1000 65536" },
    { ...isolated, statuses: [] },
    { ...isolated, statuses: [""] },
    ...[
      "--no-sandbox",
      "--no-sandbox=true",
      "--disable-setuid-sandbox",
      "--disable-seccomp-filter-sandbox",
    ].map((flag) => ({
      ...isolated,
      arguments: [...isolated.arguments, flag],
    })),
    ...[
      ["NoNewPrivs:\t1", "NoNewPrivs:\t0"],
      ["Seccomp:\t2", "Seccomp:\t0"],
      ["CapEff:\t0000000000000000", "CapEff:\t0000000000000001"],
      ["NSpid:\t1234\t7", "NSpid:\t1234"],
    ].map(([before, after]) => ({
      ...isolated,
      statuses: [
        isolated.statuses[0]!,
        isolated.statuses[0]!.replace(before!, after!),
      ],
    })),
  ])(
    "rejects missing or unsandboxed evidence even for one thread",
    (evidence) => {
      expect(() => inspectLinuxRendererSandbox([evidence], hostUidMap)).toThrow(
        "lacks required OS sandbox evidence",
      );
    },
  );
  it("rejects one unsandboxed renderer among sandboxed renderers", () => {
    expect(() =>
      inspectLinuxRendererSandbox(
        [isolated, { ...isolated, uidMap: hostUidMap }],
        hostUidMap,
      ),
    ).toThrow();
  });
});
