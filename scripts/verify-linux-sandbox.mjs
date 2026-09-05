import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

export function inspectLinuxAppRun(source) {
  // Exact generated launcher for this package, independently pinned after review.
  // A permissive substring blacklist would miss a rewritten fallback.
  if (
    createHash("sha256").update(source).digest("hex") !==
    "b2a918ad18d99c37af854798ede7d62305d8444207cbb36d2ee57093acb7368d"
  )
    throw new Error(
      "Packaged AppRun does not match the reviewed sandbox-preserving launcher",
    );
}

function field(status, name) {
  return status.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1].trim();
}

export function inspectLinuxRendererSandbox(renderers, hostUidMap) {
  if (renderers.length === 0)
    throw new Error("No Linux renderer sandbox evidence was found");
  for (const renderer of renderers) {
    const uidMap = renderer.uidMap.trim().split(/\s+/u);
    if (
      renderer.arguments.some((arg) =>
        /^--(?:no-sandbox|disable-.*sandbox)(?:=|$)/u.test(arg),
      ) ||
      renderer.uidMap.trim() === hostUidMap.trim() ||
      uidMap.length !== 3 ||
      uidMap[0] !== "0" ||
      uidMap[2] !== "1" ||
      renderer.statuses.length === 0 ||
      renderer.statuses.some(
        (status) =>
          field(status, "NoNewPrivs") !== "1" ||
          field(status, "Seccomp") !== "2" ||
          !/^0+$/u.test(field(status, "CapEff") ?? "") ||
          (field(status, "NSpid")?.split(/\s+/u).length ?? 0) < 2,
      )
    )
      throw new Error("Linux renderer lacks required OS sandbox evidence");
  }
  return renderers.length;
}

// Observe the exact startup's process group without a debug port or production
// IPC. Read every renderer thread: seccomp/no-new-privileges are per-thread.
// Missing, inaccessible or raced evidence fails verification, never passes it.
export async function verifyLinuxRendererSandbox(processGroupId) {
  if (!Number.isSafeInteger(processGroupId) || processGroupId <= 0)
    throw new Error("Invalid packaged process group for sandbox verification");
  const renderers = [];
  for (const pid of await readdir("/proc")) {
    if (!/^[0-9]+$/u.test(pid)) continue;
    let processStat;
    try {
      processStat = await readFile(`/proc/${pid}/stat`, "utf8");
    } catch (cause) {
      if (cause.code === "ENOENT") continue;
      throw cause;
    }
    const fields = processStat
      .slice(processStat.lastIndexOf(")") + 2)
      .split(" ");
    if (Number(fields[2]) !== processGroupId) continue;
    const args = (await readFile(`/proc/${pid}/cmdline`, "utf8")).split("\0");
    if (!args.includes("--type=renderer")) continue;
    const statuses = await Promise.all(
      (await readdir(`/proc/${pid}/task`)).map((tid) =>
        readFile(`/proc/${pid}/task/${tid}/status`, "utf8"),
      ),
    );
    renderers.push({
      arguments: args,
      uidMap: await readFile(`/proc/${pid}/uid_map`, "utf8"),
      statuses,
    });
  }
  return inspectLinuxRendererSandbox(
    renderers,
    await readFile("/proc/self/uid_map", "utf8"),
  );
}
