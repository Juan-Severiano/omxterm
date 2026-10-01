import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { getConfig } from "app-builder-lib/out/util/config/config.js";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
// Exercise the pinned packager's real transform, not a copy of its cleanup.
// These internal exports lack declarations; an upgrade must requalify this seam.
const { createTransformer } =
  require("app-builder-lib/out/fileTransformer.js") as {
    createTransformer: (
      root: string,
      config: object,
      extraMetadata: object | undefined,
    ) => (file: string) => Promise<string | null>;
  };
const { readPackageJson } =
  require("app-builder-lib/out/util/packageMetadata.js") as {
    readPackageJson: (file: string) => Promise<Record<string, unknown>>;
  };
const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const metadata = JSON.parse(
  readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
) as Record<string, unknown>;

async function transformPair(change: Record<string, unknown>) {
  const root = await mkdtemp(path.join(tmpdir(), "omxterm-package-metadata-"));
  try {
    const config = await getConfig(
      repositoryRoot,
      "electron-builder.yml",
      null,
    );
    expect(config.extraMetadata).toBeUndefined();
    const transform = createTransformer(root, config, undefined);
    const file = path.join(root, "package.json");
    await writeFile(file, JSON.stringify(metadata));
    const before = {
      packaged: await transform(file),
      build: await readPackageJson(file),
    };
    await writeFile(file, JSON.stringify({ ...metadata, ...change }));
    const after = {
      packaged: await transform(file),
      build: await readPackageJson(file),
    };
    return { before, after };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("release packaged metadata provenance", () => {
  it("the pinned packager strips orchestration scripts from packaged bytes and build metadata", async () => {
    const builder = require("app-builder-lib/package.json") as {
      version: string;
    };
    expect(builder.version).toBe("26.15.3");
    const { before, after } = await transformPair({
      scripts: {
        build: "different orchestration",
        "check:portable": "different tests",
      },
    });
    expect(before.packaged).not.toBeNull();
    expect(before.packaged).not.toContain('"scripts"');
    expect(before.build).not.toHaveProperty("scripts");
    expect(after).toEqual(before);
  });

  it.each([
    { version: "999.0.0" },
    { dependencies: { "node-pty": "999.0.0" } },
    { main: "different-product-entry.js" },
  ])(
    "does not treat retained metadata as orchestration-only: %j",
    async (change) => {
      const { before, after } = await transformPair(change);
      expect(after.packaged).not.toBe(before.packaged);
      expect(after.build).not.toEqual(before.build);
    },
  );
});
