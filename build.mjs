import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function buildWithImportedEsbuild() {
  const { build } = await import("esbuild");
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    packages: "external",
    outfile: "dist/index.js",
    external: ["openclaw/plugin-sdk/core"],
  });
}

function buildWithPnpmStoreFallback() {
  const pnpmStoreDir = path.join(process.cwd(), "node_modules", ".pnpm");
  const entry = fs
    .readdirSync(pnpmStoreDir)
    .find((name) => name.startsWith("esbuild@") && fs.existsSync(path.join(pnpmStoreDir, name)));
  if (!entry) {
    throw new Error("Could not find esbuild. Run npm install or pnpm install first.");
  }

  const esbuildBin = path.join(pnpmStoreDir, entry, "node_modules", "esbuild", "bin", "esbuild");
  const result = spawnSync(
    esbuildBin,
    [
      "src/index.ts",
      "--bundle",
      "--platform=node",
      "--format=esm",
      "--target=node22",
      "--packages=external",
      "--outfile=dist/index.js",
      "--external:openclaw/plugin-sdk/core",
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (typeof result.status === "number") {
    process.exit(result.status);
  }
  process.exit(1);
}

try {
  require.resolve("esbuild");
  await buildWithImportedEsbuild();
} catch {
  buildWithPnpmStoreFallback();
}
