/**
 * Patch OpenClaw's api-registry so the plugin runtime and gateway runtime
 * share the same provider registry.
 *
 * This script supports:
 * - an explicit ZERO_TOKEN_OPENCLAW_ROOT override
 * - a repo-local runtime at .zero-token-runtime/node_modules/openclaw
 * - a repo-local runtime at node_modules/openclaw
 * - global npm installs discovered via "npm root -g"
 * - Windows OpenClaw app installs under LOCALAPPDATA/.clawhub*
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGINAL = "const apiProviderRegistry = new Map();";
const PATCHED =
  "const apiProviderRegistry = globalThis.__piAiApiProviderRegistry ?? (globalThis.__piAiApiProviderRegistry = new Map());";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_RELATIVE = path.join(
  "node_modules",
  "@mariozechner",
  "pi-ai",
  "dist",
  "api-registry.js",
);

function execText(command, args, timeoutMs = 1500) {
  try {
    return String(
      execFileSync(command, args, {
        encoding: "utf8",
        timeout: timeoutMs,
        stdio: ["ignore", "pipe", "ignore"],
      }),
    ).trim();
  } catch {
    return "";
  }
}

function addCandidateRoot(candidates, candidate) {
  if (!candidate) {
    return;
  }

  const resolved = path.resolve(candidate);
  if (existsSync(resolved)) {
    candidates.add(resolved);
  }
}

function collectEnvCandidates(candidates) {
  addCandidateRoot(candidates, process.env.ZERO_TOKEN_OPENCLAW_ROOT);
  addCandidateRoot(candidates, process.env.OPENCLAW_ROOT);
}

function collectProjectCandidates(candidates) {
  addCandidateRoot(candidates, path.join(SCRIPT_DIR, ".zero-token-runtime", "node_modules", "openclaw"));
  addCandidateRoot(candidates, path.join(SCRIPT_DIR, "node_modules", "openclaw"));
}

function collectGlobalNpmCandidates(candidates) {
  const npmRoot = execText("npm", ["root", "-g"], 4000);
  if (npmRoot) {
    addCandidateRoot(candidates, path.join(npmRoot, "openclaw"));
  }

  const npmPrefix = execText("npm", ["prefix", "-g"], 4000);
  if (npmPrefix) {
    addCandidateRoot(candidates, path.join(npmPrefix, "lib", "node_modules", "openclaw"));
    addCandidateRoot(candidates, path.join(npmPrefix, "node_modules", "openclaw"));
  }
}

function collectOpenClawBinaryCandidates(candidates) {
  const commandName = process.platform === "win32" ? "where" : "which";
  const openclawPathRaw = execText(commandName, ["openclaw"], 2000);
  if (!openclawPathRaw) {
    return;
  }

  const firstPath = openclawPathRaw.split(/\r?\n/).find(Boolean);
  if (!firstPath) {
    return;
  }

  let resolvedBinPath = path.resolve(firstPath);
  try {
    resolvedBinPath = realpathSync(resolvedBinPath);
  } catch {
    // Keep the original path if it cannot be resolved.
  }

  const binDir = path.dirname(resolvedBinPath);
  addCandidateRoot(candidates, path.join(binDir, "..", "lib", "node_modules", "openclaw"));
  addCandidateRoot(candidates, path.join(binDir, "..", "node_modules", "openclaw"));
  addCandidateRoot(candidates, path.join(binDir, "..", "..", "lib", "node_modules", "openclaw"));

  for (let current = path.dirname(resolvedBinPath), depth = 0; depth < 6; depth += 1) {
    const pkgPath = path.join(current, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const parsed = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (parsed?.name === "openclaw") {
          addCandidateRoot(candidates, current);
        }
      } catch {
        // Ignore unreadable package.json files.
      }
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
}

function collectWindowsAppCandidates(candidates) {
  if (process.platform !== "win32") {
    return;
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData || !existsSync(localAppData)) {
    return;
  }

  const entries = readdirSync(localAppData, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && entry.name.startsWith(".clawhub"),
  );

  for (const entry of entries) {
    const base = path.join(localAppData, entry.name);
    const npmDirs = readdirSync(base, { withFileTypes: true }).filter(
      (dirent) => dirent.isDirectory() && dirent.name.startsWith("npm-global-"),
    );

    for (const npmDir of npmDirs) {
      addCandidateRoot(
        candidates,
        path.join(base, npmDir.name, "node_modules", "openclaw"),
      );
    }
  }
}

function findRegistryFile() {
  if (process.env.ZERO_TOKEN_API_REGISTRY_FILE?.trim()) {
    const directPath = path.resolve(process.env.ZERO_TOKEN_API_REGISTRY_FILE.trim());
    if (existsSync(directPath)) {
      return directPath;
    }
  }

  const candidateRoots = new Set();
  collectEnvCandidates(candidateRoots);
  collectProjectCandidates(candidateRoots);
  collectGlobalNpmCandidates(candidateRoots);
  collectOpenClawBinaryCandidates(candidateRoots);
  collectWindowsAppCandidates(candidateRoots);

  for (const root of candidateRoots) {
    const registryPath = path.join(root, REGISTRY_RELATIVE);
    if (existsSync(registryPath)) {
      return registryPath;
    }
  }

  const searchedRoots = [...candidateRoots].join("\n  - ");
  throw new Error(
    searchedRoots
      ? `Could not find api-registry.js. Searched:\n  - ${searchedRoots}`
      : "Could not find api-registry.js. Install OpenClaw first.",
  );
}

try {
  const filePath = findRegistryFile();
  const content = readFileSync(filePath, "utf8");

  if (content.includes(PATCHED)) {
    console.log("  [ok] api-registry.js is already patched");
  } else if (content.includes(ORIGINAL)) {
    writeFileSync(filePath, content.replace(ORIGINAL, PATCHED), "utf8");
    console.log("  [ok] Patched api-registry.js");
  } else {
    console.log("  [warn] api-registry.js did not match the expected source");
    console.log("  file: " + filePath);
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("  [x] " + message);
  process.exit(1);
}
