/**
 * 自动查找并修补 OpenClaw 的 api-registry.js
 * 让插件和 gateway 共享同一个 provider registry
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ORIGINAL = "const apiProviderRegistry = new Map();";
const PATCHED = "const apiProviderRegistry = globalThis.__piAiApiProviderRegistry ?? (globalThis.__piAiApiProviderRegistry = new Map());";

function findRegistryFile() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error("无法获取 LOCALAPPDATA 环境变量");
  }

  // 查找 .clawhub* 目录
  const entries = readdirSync(localAppData).filter(
    (name) => name.startsWith(".clawhub") && existsSync(join(localAppData, name, "bin"))
  );

  for (const clawDir of entries) {
    const base = join(localAppData, clawDir);
    // 查找 npm-global-* 目录
    const npmDirs = readdirSync(base).filter((name) => name.startsWith("npm-global-"));
    for (const npmDir of npmDirs) {
      const registryPath = join(
        base, npmDir,
        "node_modules", "openclaw", "node_modules",
        "@mariozechner", "pi-ai", "dist", "api-registry.js"
      );
      if (existsSync(registryPath)) {
        return registryPath;
      }
    }
  }

  throw new Error("找不到 api-registry.js，请确认 OpenClaw 已安装");
}

try {
  const filePath = findRegistryFile();
  const content = readFileSync(filePath, "utf-8");

  if (content.includes(PATCHED)) {
    console.log("  [√] 补丁已存在，无需重复打");
  } else if (content.includes(ORIGINAL)) {
    writeFileSync(filePath, content.replace(ORIGINAL, PATCHED), "utf-8");
    console.log("  [√] 补丁已成功应用");
  } else {
    console.log("  [!] api-registry.js 内容不匹配，可能已被修改");
    console.log("  文件路径: " + filePath);
    process.exit(1);
  }
} catch (err) {
  console.error("  [x] " + err.message);
  process.exit(1);
}
