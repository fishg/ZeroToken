import { type ChildProcessWithoutNullStreams, execSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";
import { resolveStateDir } from "./config-paths.js";
import { appendCdpPath, getHeadersWithAuth, normalizeCdpWsUrl } from "./browser-cdp.js";
import {
  type BrowserExecutable,
  resolveBrowserExecutableForPlatform,
} from "./chrome.executables.js";
import {
  decorateOpenClawProfile,
  ensureProfileCleanExit,
  isProfileDecorated,
} from "./chrome.profile-decoration.js";
import type { ResolvedBrowserConfig, ResolvedBrowserProfile } from "./browser-config.js";
import {
  DEFAULT_OPENCLAW_BROWSER_COLOR,
  DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME,
} from "./browser-constants.js";

function exists(filePath: string) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

async function ensurePortAvailable(port: number, host = "127.0.0.1"): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (error) => {
      server.close();
      reject(error);
    });
    server.listen(port, host, () => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
}

function resolveBrowserExecutable(resolved: ResolvedBrowserConfig): BrowserExecutable | null {
  return resolveBrowserExecutableForPlatform(resolved, process.platform);
}

export type RunningChrome = {
  pid: number;
  exe: BrowserExecutable;
  userDataDir: string;
  cdpPort: number;
  startedAt: number;
  proc: ChildProcessWithoutNullStreams;
};

export function resolveOpenClawUserDataDir(profileName = DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME) {
  return path.join(resolveStateDir(), "browser", profileName, "user-data");
}

/**
 * Detect the user's real browser user-data directory based on the executable path.
 * Returns null if the browser type can't be determined.
 */
function detectUserBrowserDataDir(exePath: string): string | null {
  if (process.platform !== "win32") return null;

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;

  const exeLower = exePath.toLowerCase();
  if (exeLower.includes("msedge")) {
    return path.join(localAppData, "Microsoft", "Edge", "User Data");
  }
  if (exeLower.includes("chrome")) {
    return path.join(localAppData, "Google", "Chrome", "User Data");
  }
  if (exeLower.includes("brave")) {
    return path.join(localAppData, "BraveSoftware", "Brave-Browser", "User Data");
  }
  return null;
}

/**
 * Copy password database and encryption key from the user's main browser
 * profile to the auth browser profile.  This gives the auth browser access
 * to saved passwords so the user doesn't have to retype them.
 *
 * Files copied:
 *   - Login Data   (SQLite database with encrypted passwords)
 *   - Local State  (JSON with os_crypt.encrypted_key for decryption)
 */
function copyUserPasswords(exePath: string, targetUserDataDir: string): void {
  try {
    const sourceDir = detectUserBrowserDataDir(exePath);
    if (!sourceDir || !exists(sourceDir)) return;

    const sourceDefault = path.join(sourceDir, "Default");
    const targetDefault = path.join(targetUserDataDir, "Default");

    // Ensure target dirs exist
    fs.mkdirSync(targetDefault, { recursive: true });

    // Files to copy from user's browser profile
    // Cookies = Google login state + all site sessions
    // Login Data = saved passwords
    // Web Data = autofill (addresses, cards)
    const filesToCopy = [
      "Cookies",              // ALL logged-in sessions (Google account etc.)
      "Login Data",           // Saved passwords (SQLite)
      "Login Data For Account", // Account-specific passwords
      "Web Data",             // Autofill data (addresses, cards)
    ];

    for (const fileName of filesToCopy) {
      const src = path.join(sourceDefault, fileName);
      const dst = path.join(targetDefault, fileName);
      if (!exists(src)) continue;
      // Always overwrite — user may have added new passwords since last copy
      if (exists(dst)) {
        try {
          // Only overwrite if source is newer
          const srcStat = fs.statSync(src);
          const dstStat = fs.statSync(dst);
          if (srcStat.mtimeMs <= dstStat.mtimeMs) continue;
        } catch { /* stat failed, overwrite anyway */ }
      }
      try {
        // Use read+write instead of copyFile — reads with shared access,
        // works even while Chrome/Edge is running (shared read lock)
        const data = fs.readFileSync(src);
        fs.writeFileSync(dst, data);
        console.log(`[zero-token] Copied ${fileName} from user browser`);
      } catch {
        // Fallback: PowerShell can read files with shared locks
        try {
          execSync(
            `powershell -NoProfile -Command "[System.IO.File]::Copy('${src.replace(/'/g, "''")}', '${dst.replace(/'/g, "''")}', $true)"`,
            { stdio: "ignore", timeout: 8000 },
          );
          console.log(`[zero-token] Copied ${fileName} via PowerShell`);
        } catch {
          console.log(`[zero-token] Could not copy ${fileName} (non-fatal)`);
        }
      }
    }

    // Copy encryption key from Local State (needed to decrypt passwords)
    const sourceLocalState = path.join(sourceDir, "Local State");
    const targetLocalState = path.join(targetUserDataDir, "Local State");
    if (exists(sourceLocalState)) {
      try {
        const sourceRaw = fs.readFileSync(sourceLocalState, "utf-8");
        const sourceState = JSON.parse(sourceRaw);

        // Merge: preserve existing Local State but ensure os_crypt key is present
        let targetState: Record<string, unknown> = {};
        if (exists(targetLocalState)) {
          try {
            targetState = JSON.parse(fs.readFileSync(targetLocalState, "utf-8"));
          } catch { /* corrupt file, will be overwritten */ }
        }

        if (sourceState.os_crypt) {
          // Always force-overwrite the encryption key — bootstrap creates a new
          // key that can't decrypt the user's passwords. We need the user's key.
          targetState.os_crypt = sourceState.os_crypt;
          fs.writeFileSync(targetLocalState, JSON.stringify(targetState, null, 2));
          console.log("[zero-token] Synced encryption key for passwords");
        }
      } catch {
        // Non-fatal
      }
    }
  } catch {
    // Password copy is best-effort, never block auth flow
  }
}

function cdpUrlForPort(cdpPort: number) {
  return `http://127.0.0.1:${cdpPort}`;
}

type ChromeVersion = {
  webSocketDebuggerUrl?: string;
};

async function fetchChromeVersion(cdpUrl: string, timeoutMs = 500): Promise<ChromeVersion | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const versionUrl = appendCdpPath(cdpUrl, "/json/version");
    const response = await fetch(versionUrl, {
      signal: ctrl.signal,
      headers: getHeadersWithAuth(versionUrl),
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as ChromeVersion;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function isChromeReachable(cdpUrl: string, timeoutMs = 500): Promise<boolean> {
  const version = await fetchChromeVersion(cdpUrl, timeoutMs);
  return Boolean(version);
}

export async function getChromeWebSocketUrl(
  cdpUrl: string,
  timeoutMs = 500,
): Promise<string | null> {
  const version = await fetchChromeVersion(cdpUrl, timeoutMs);
  const wsUrl = String(version?.webSocketDebuggerUrl ?? "").trim();
  if (!wsUrl) {
    return null;
  }
  return normalizeCdpWsUrl(wsUrl, cdpUrl);
}

async function canOpenWebSocket(wsUrl: string, timeoutMs = 800): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const headers = getHeadersWithAuth(wsUrl);
    const ws = new WebSocket(wsUrl, {
      handshakeTimeout: timeoutMs,
      ...(Object.keys(headers).length ? { headers } : {}),
    });
    const timer = setTimeout(() => {
      try {
        ws.terminate();
      } catch {
        // ignore
      }
      resolve(false);
    }, Math.max(50, timeoutMs + 25));

    ws.once("open", () => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve(true);
    });
    ws.once("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

export async function launchOpenClawChrome(
  resolved: ResolvedBrowserConfig,
  profile: ResolvedBrowserProfile,
): Promise<RunningChrome> {
  if (!profile.cdpIsLoopback) {
    throw new Error(`Profile "${profile.name}" is remote; cannot launch local Chrome.`);
  }
  await ensurePortAvailable(profile.cdpPort);

  const exe = resolveBrowserExecutable(resolved);
  if (!exe) {
    throw new Error(
      "No supported browser found (Chrome/Brave/Edge/Chromium on macOS, Linux, or Windows).",
    );
  }

  const userDataDir = resolveOpenClawUserDataDir(profile.name);
  fs.mkdirSync(userDataDir, { recursive: true });

  const needsDecorate = !isProfileDecorated(
    userDataDir,
    profile.name,
    (profile.color ?? DEFAULT_OPENCLAW_BROWSER_COLOR).toUpperCase(),
  );

  const spawnOnce = () => {
    const args: string[] = [
      `--remote-debugging-port=${profile.cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-features=Translate,MediaRouter",
      "--disable-session-crashed-bubble",
      "--hide-crash-restore-bubble",
    ];

    if (resolved.headless) {
      args.push("--headless=new", "--disable-gpu");
    }
    if (resolved.noSandbox) {
      args.push("--no-sandbox", "--disable-setuid-sandbox");
    }
    if (process.platform === "linux") {
      args.push("--disable-dev-shm-usage");
    }
    args.push("--disable-features=AutomationControlled");
    if (resolved.extraArgs.length > 0) {
      args.push(...resolved.extraArgs);
    }
    args.push("about:blank");

    return spawn(exe.path, args, {
      stdio: "pipe",
      env: {
        ...process.env,
        HOME: os.homedir(),
      },
    });
  };

  const startedAt = Date.now();
  const localStatePath = path.join(userDataDir, "Local State");
  const preferencesPath = path.join(userDataDir, "Default", "Preferences");
  const needsBootstrap = !exists(localStatePath) || !exists(preferencesPath);

  if (needsBootstrap) {
    const bootstrap = spawnOnce();
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (exists(localStatePath) && exists(preferencesPath)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    try {
      bootstrap.kill("SIGTERM");
    } catch {
      // ignore
    }
    const exitDeadline = Date.now() + 5_000;
    while (Date.now() < exitDeadline) {
      if (bootstrap.exitCode != null) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  if (needsDecorate) {
    try {
      decorateOpenClawProfile(userDataDir, {
        name: profile.name,
        color: profile.color,
      });
    } catch (error) {
      console.warn(`openclaw browser profile decoration failed: ${String(error)}`);
    }
  }

  try {
    ensureProfileCleanExit(userDataDir);
  } catch (error) {
    console.warn(`openclaw browser clean-exit prefs failed: ${String(error)}`);
  }

  // Copy saved passwords AFTER bootstrap (so Chrome's generated Local State
  // doesn't overwrite our encryption key). Force-overwrite the os_crypt key.
  copyUserPasswords(exe.path, userDataDir);

  const proc = spawnOnce();
  const readyDeadline = Date.now() + 15_000;
  while (Date.now() < readyDeadline) {
    if (await isChromeReachable(profile.cdpUrl, 500)) {
      const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 500);
      if (!wsUrl || (await canOpenWebSocket(wsUrl, 800))) {
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (!(await isChromeReachable(profile.cdpUrl, 500))) {
    try {
      proc.kill("SIGKILL");
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to start Chrome CDP on port ${profile.cdpPort} for profile "${profile.name}".`,
    );
  }

  return {
    pid: proc.pid ?? -1,
    exe,
    userDataDir,
    cdpPort: profile.cdpPort,
    startedAt,
    proc,
  };
}

export async function stopOpenClawChrome(running: RunningChrome, timeoutMs = 2500) {
  const proc = running.proc;
  if (proc.killed) {
    return;
  }
  try {
    proc.kill("SIGTERM");
  } catch {
    // ignore
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!proc.exitCode && proc.killed) {
      break;
    }
    if (!(await isChromeReachable(cdpUrlForPort(running.cdpPort), 200))) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  try {
    proc.kill("SIGKILL");
  } catch {
    // ignore
  }
}

export async function killExistingChromeOnPort(
  cdpPort: number,
  onProgress?: (message: string) => void,
): Promise<boolean> {
  if (process.platform === "win32") {
    return false;
  }
  const cdpUrl = cdpUrlForPort(cdpPort);
  if (!(await isChromeReachable(cdpUrl, 300))) {
    return false;
  }
  const progress = onProgress ?? (() => {});
  progress("Detected existing browser, closing it first...");
  try {
    execSync(`pkill -f "remote-debugging-port=${cdpPort}" 2>/dev/null || true`, {
      stdio: "ignore",
    });
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    execSync(`pkill -9 -f "remote-debugging-port=${cdpPort}" 2>/dev/null || true`, {
      stdio: "ignore",
    });
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    return !(await isChromeReachable(cdpUrl, 300));
  } catch {
    return false;
  }
}
