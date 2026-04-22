import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const PROVIDERS = [
  { num: 1, id: "deepseek-web", label: "DeepSeek", site: "chat.deepseek.com" },
  { num: 2, id: "qwen-web", label: "Qwen", site: "chat.qwen.ai" },
  { num: 3, id: "qwen-cn-web", label: "Qwen CN", site: "chat2.qianwen.com" },
  { num: 4, id: "doubao-web", label: "Doubao", site: "www.doubao.com" },
  { num: 5, id: "kimi-web", label: "Kimi", site: "www.kimi.com" },
  { num: 6, id: "chatgpt-web", label: "ChatGPT", site: "chatgpt.com" },
  { num: 7, id: "claude-web", label: "Claude", site: "claude.ai" },
  { num: 8, id: "gemini-web", label: "Gemini", site: "gemini.google.com" },
  { num: 9, id: "grok-web", label: "Grok", site: "grok.com" },
  { num: 10, id: "perplexity-web", label: "Perplexity", site: "www.perplexity.ai" },
];

const PROJECT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(os.homedir(), ".openclaw");
const CONFIG_FILE = path.join(CONFIG_DIR, "openclaw.json");
const LOCAL_RUNTIME_DIR = path.join(PROJECT_DIR, ".zero-token-runtime");
const LOCAL_RUNTIME_PACKAGE = path.join(LOCAL_RUNTIME_DIR, "package.json");
const LOCAL_OPENCLAW_ROOT = path.join(LOCAL_RUNTIME_DIR, "node_modules", "openclaw");
const LOCAL_OPENCLAW_ENTRY = path.join(LOCAL_OPENCLAW_ROOT, "bin", "openclaw.js");
const LOCAL_EXTENSION_ENTRY = path.join(
  os.homedir(),
  ".openclaw",
  "extensions",
  "zero-token",
  "dist",
  "index.js",
);
const GATEWAY_URL = "http://127.0.0.1:18789/";
const GATEWAY_PORTS = [18789, 18800];
const BROWSER_INSTALLERS = [
  {
    num: 1,
    label: "Google Chrome",
    cask: "google-chrome",
    path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  },
  {
    num: 2,
    label: "Microsoft Edge",
    cask: "microsoft-edge",
    path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  },
  {
    num: 3,
    label: "Brave Browser",
    cask: "brave-browser",
    path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
  {
    num: 4,
    label: "Chromium",
    cask: "chromium",
    path: "/Applications/Chromium.app/Contents/MacOS/Chromium",
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function printBanner() {
  clearScreen();
  console.log("");
  console.log("  ==============================================");
  console.log("       Zero-Token (macOS)");
  console.log("       Browser login, no API key required");
  console.log("  ==============================================");
  console.log("");
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function writeJsonFile(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getNodeMajorVersion() {
  return Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
}

function ensurePlatform() {
  if (process.platform !== "darwin") {
    throw new Error("The macOS launcher can only be used on macOS.");
  }
}

function ensureNodeVersion() {
  const major = getNodeMajorVersion();
  if (!Number.isFinite(major) || major < 22) {
    throw new Error(
      `Node.js 22+ is required. Current version: ${process.version}. Install a newer Node.js and re-run.`,
    );
  }
}

function getPackageOpenClawVersion() {
  const pkg = readJsonFile(path.join(PROJECT_DIR, "package.json"));
  return pkg?.openclaw?.build?.openclawVersion || "latest";
}

function getInstalledLocalOpenClawVersion() {
  const pkgPath = path.join(LOCAL_OPENCLAW_ROOT, "package.json");
  if (!existsSync(pkgPath)) {
    return null;
  }
  const pkg = readJsonFile(pkgPath);
  return typeof pkg.version === "string" ? pkg.version : null;
}

function ensureLocalRuntimePackage() {
  if (existsSync(LOCAL_RUNTIME_PACKAGE)) {
    return;
  }

  writeJsonFile(LOCAL_RUNTIME_PACKAGE, {
    name: "zero-token-local-runtime",
    private: true,
  });
}

function detectBrowsers() {
  const candidates = [
    {
      label: "Google Chrome",
      path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
    {
      label: "Google Chrome",
      path: path.join(
        os.homedir(),
        "Applications",
        "Google Chrome.app",
        "Contents",
        "MacOS",
        "Google Chrome",
      ),
    },
    {
      label: "Brave Browser",
      path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    },
    {
      label: "Brave Browser",
      path: path.join(
        os.homedir(),
        "Applications",
        "Brave Browser.app",
        "Contents",
        "MacOS",
        "Brave Browser",
      ),
    },
    {
      label: "Microsoft Edge",
      path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    },
    {
      label: "Microsoft Edge",
      path: path.join(
        os.homedir(),
        "Applications",
        "Microsoft Edge.app",
        "Contents",
        "MacOS",
        "Microsoft Edge",
      ),
    },
    {
      label: "Chromium",
      path: "/Applications/Chromium.app/Contents/MacOS/Chromium",
    },
    {
      label: "Chromium",
      path: path.join(
        os.homedir(),
        "Applications",
        "Chromium.app",
        "Contents",
        "MacOS",
        "Chromium",
      ),
    },
    {
      label: "Google Chrome Canary",
      path: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    },
    {
      label: "Google Chrome Canary",
      path: path.join(
        os.homedir(),
        "Applications",
        "Google Chrome Canary.app",
        "Contents",
        "MacOS",
        "Google Chrome Canary",
      ),
    },
  ];

  const seen = new Set();
  const browsers = [];
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate.path);
    if (!existsSync(resolved) || seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);
    browsers.push({ label: candidate.label, path: resolved });
  }
  return browsers;
}

function findBrewExecutable() {
  const candidates = [
    "/opt/homebrew/bin/brew",
    "/usr/local/bin/brew",
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const captured = runCapture("which", ["brew"]);
  return captured.status === 0 && captured.stdout ? captured.stdout.split(/\r?\n/)[0]?.trim() || "" : "";
}

function readConfig() {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  return readJsonFile(CONFIG_FILE);
}

function writeConfig(config) {
  writeJsonFile(CONFIG_FILE, config);
}

function getConfiguredBrowserPath() {
  const config = readConfig();
  return typeof config?.browser?.executablePath === "string"
    ? config.browser.executablePath
    : "";
}

function setBrowserPath(browserPath) {
  const config = readConfig();
  config.browser ??= {};
  config.browser.executablePath = browserPath;
  writeConfig(config);
}

function getLoggedInProviders() {
  const config = readConfig();
  const profileKeys = Object.keys(config?.auth?.profiles ?? {});
  const labels = [];

  for (const key of profileKeys) {
    const providerId = key.split(":")[0];
    const match = PROVIDERS.find((provider) => provider.id === providerId);
    if (match) {
      labels.push(match.label);
    }
  }

  return labels;
}

function runCapture(command, args) {
  try {
    const result = spawnSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return {
      status: result.status ?? 0,
      stdout: String(result.stdout ?? "").trim(),
    };
  } catch {
    return { status: 1, stdout: "" };
  }
}

function findListeningPids(port) {
  const result = runCapture("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]);
  if (result.status !== 0 || !result.stdout) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isGatewayRunning() {
  return findListeningPids(18789).length > 0;
}

function killListeningPorts() {
  for (const port of GATEWAY_PORTS) {
    const pids = findListeningPids(port);
    for (const pid of pids) {
      spawnSync("kill", ["-9", pid], {
        stdio: "ignore",
      });
    }
  }
}

function openUrl(url) {
  const child = spawn("open", [url], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

async function spawnWithInheritedStdio(command, args, options = {}) {
  const {
    cwd = PROJECT_DIR,
    env = process.env,
    allowFailure = false,
  } = options;

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      const exitCode = code ?? 0;
      if (exitCode === 0 || allowFailure) {
        resolve(exitCode);
        return;
      }
      reject(new Error(`${command} exited with code ${exitCode}`));
    });
  });
}

async function installHomebrew() {
  printBanner();
  console.log("  Homebrew was not found. Installing Homebrew automatically...");
  console.log("");
  console.log("  macOS may ask for your password during the installation.");
  console.log("");

  await spawnWithInheritedStdio("/bin/bash", [
    "-c",
    "NONINTERACTIVE=1 /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
  ]);
}

async function ensureHomebrewInstalled() {
  let brew = findBrewExecutable();
  if (brew) {
    return brew;
  }

  await installHomebrew();
  brew = findBrewExecutable();
  if (!brew) {
    throw new Error("Homebrew installation completed, but brew could not be found.");
  }
  return brew;
}

async function installBrowserWithBrew(installer) {
  const brew = await ensureHomebrewInstalled();

  printBanner();
  console.log(`  Installing ${installer.label} with Homebrew...`);
  console.log("");

  await spawnWithInheritedStdio(brew, ["install", "--cask", installer.cask]);
}

async function offerBrowserAutoInstall() {
  clearScreen();
  console.log("");
  console.log("  ==============================================");
  console.log("       Install a Browser");
  console.log("       Zero-Token can install one for you");
  console.log("  ==============================================");
  console.log("");

  for (const installer of BROWSER_INSTALLERS) {
    const number = String(installer.num).padStart(2, " ");
    console.log(`    [${number}] Install ${installer.label}`);
  }

  console.log("");
  console.log("    [ 0] Cancel");
  console.log("");

  const answer = await prompt("  Choose a browser to install: ");
  if (answer === "0" || answer === "") {
    return null;
  }

  const installer = BROWSER_INSTALLERS.find(
    (candidate) => candidate.num === Number.parseInt(answer, 10),
  );
  if (!installer) {
    console.log("");
    console.log("  [x] Invalid choice.");
    await pause();
    return null;
  }

  await installBrowserWithBrew(installer);
  if (existsSync(installer.path)) {
    setBrowserPath(installer.path);
  }
  return installer;
}

async function ensureLocalOpenClawInstalled() {
  ensureLocalRuntimePackage();

  const desiredVersion = getPackageOpenClawVersion();
  const installedVersion = getInstalledLocalOpenClawVersion();
  const versionMatches =
    desiredVersion === "latest"
      ? Boolean(installedVersion)
      : installedVersion === desiredVersion;

  if (existsSync(LOCAL_OPENCLAW_ENTRY) && versionMatches) {
    return;
  }

  printBanner();
  const versionText = desiredVersion === "latest" ? "latest" : desiredVersion;
  if (installedVersion && installedVersion !== desiredVersion) {
    console.log(`  Refreshing local OpenClaw runtime (${installedVersion} -> ${versionText})...`);
  } else {
    console.log(`  Installing local OpenClaw runtime (${versionText})...`);
  }
  console.log("");

  const packageSpec = desiredVersion === "latest" ? "openclaw" : `openclaw@${desiredVersion}`;
  await spawnWithInheritedStdio("npm", ["install", "--no-save", "--package-lock=false", packageSpec], {
    cwd: LOCAL_RUNTIME_DIR,
  });

  if (!existsSync(LOCAL_OPENCLAW_ENTRY)) {
    throw new Error("Failed to install the local OpenClaw runtime.");
  }
}

async function runOpenClaw(args, options = {}) {
  await ensureLocalOpenClawInstalled();
  return await spawnWithInheritedStdio(process.execPath, [LOCAL_OPENCLAW_ENTRY, ...args], options);
}

async function patchLocalOpenClaw() {
  await ensureLocalOpenClawInstalled();
  await spawnWithInheritedStdio(process.execPath, ["patch-registry.js"], {
    cwd: PROJECT_DIR,
    env: {
      ...process.env,
      ZERO_TOKEN_OPENCLAW_ROOT: LOCAL_OPENCLAW_ROOT,
    },
  });
}

async function waitForGatewayAndOpenBrowser() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(GATEWAY_URL);
      if (response.status > 0) {
        openUrl(GATEWAY_URL);
        return;
      }
    } catch {
      // Keep polling until the gateway is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function prompt(question) {
  return (await rl.question(question)).trim();
}

async function pause(message = "  Press Enter to continue...") {
  await rl.question(message);
}

async function selectBrowser() {
  let browsers = detectBrowsers();
  if (browsers.length === 0) {
    console.log("  [x] No Chromium browser was detected.");
    console.log("  Zero-Token can install Chrome, Edge, Brave, or Chromium automatically.");
    console.log("");

    const shouldInstall = await prompt("  Install a supported browser now? (Y/n): ");
    if (!/^(|y|yes)$/i.test(shouldInstall)) {
      return null;
    }

    await offerBrowserAutoInstall();
    browsers = detectBrowsers();
    if (browsers.length === 0) {
      console.log("");
      console.log("  [x] No supported browser was found after installation.");
      return null;
    }
  }

  if (browsers.length === 1) {
    setBrowserPath(browsers[0].path);
    console.log(`  Browser set to: ${browsers[0].label}`);
    console.log(`  Path: ${browsers[0].path}`);
    return browsers[0];
  }

  clearScreen();
  console.log("");
  console.log("  ==============================================");
  console.log("       Select a Browser");
  console.log("       Login and API calls will use this browser");
  console.log("  ==============================================");
  console.log("");

  browsers.forEach((browser, index) => {
    const number = String(index + 1).padStart(2, " ");
    console.log(`    [${number}] ${browser.label.padEnd(20, " ")} ${browser.path}`);
  });

  console.log("");
  const answer = await prompt(`  Choose a browser (1-${browsers.length}, Enter for 1): `);
  const index = answer ? Number.parseInt(answer, 10) - 1 : 0;
  const selected = Number.isInteger(index) && index >= 0 && index < browsers.length
    ? browsers[index]
    : browsers[0];

  setBrowserPath(selected.path);
  console.log("");
  console.log(`  Browser set to: ${selected.label}`);
  console.log(`  Path: ${selected.path}`);
  return selected;
}

function getStatus() {
  const browserPath = getConfiguredBrowserPath();
  const browserName = browserPath
    ? existsSync(browserPath)
      ? path.basename(browserPath)
      : `${path.basename(browserPath)} (missing)`
    : "Not configured";

  const loggedIn = getLoggedInProviders();

  return {
    browserName,
    loggedIn,
    gatewayRunning: isGatewayRunning(),
  };
}

async function installOrUpdatePlugin({ firstRun = false } = {}) {
  if (firstRun) {
    printBanner();
    console.log("  First run setup");
    console.log("");
    await selectBrowser();
    console.log("");
  }

  printBanner();
  console.log("  Installing Zero-Token into the local OpenClaw runtime...");
  console.log("");
  await runOpenClaw(["plugins", "install", "."]);
  console.log("");
  console.log("  Patching the OpenClaw api registry...");
  console.log("");
  await patchLocalOpenClaw();
  console.log("");
  console.log("  [ok] Zero-Token is ready.");
}

async function startGateway() {
  printBanner();
  console.log("  Starting the Zero-Token gateway...");
  console.log("");

  await runOpenClaw(["gateway", "stop"], { allowFailure: true });
  killListeningPorts();

  console.log(`  URL: ${GATEWAY_URL}`);
  console.log("  Close this window to stop the service.");
  console.log("");

  const opener = waitForGatewayAndOpenBrowser();
  const exitCode = await runOpenClaw(["gateway", "run"], { allowFailure: true });
  await opener;

  console.log("");
  if (exitCode === 0) {
    console.log("  Gateway stopped.");
  } else {
    console.log(`  Gateway exited with code ${exitCode}.`);
  }
  await pause();
}

async function loginProviders() {
  let shouldStartGateway = false;

  while (true) {
    clearScreen();
    console.log("");
    console.log("  ==============================================");
    console.log("       Choose a Provider to Log In");
    console.log("       A browser window will open for login");
    console.log("  ==============================================");
    console.log("");

    for (const provider of PROVIDERS) {
      const number = String(provider.num).padStart(2, " ");
      console.log(`    [${number}] ${provider.label.padEnd(20, " ")} ${provider.site}`);
    }

    console.log("");
    console.log("    [ 0] Back");
    console.log("");

    const answer = await prompt("  Choose a provider: ");
    if (answer === "0") {
      break;
    }

    const selected = PROVIDERS.find((provider) => provider.num === Number.parseInt(answer, 10));
    if (!selected) {
      console.log("");
      console.log("  [x] Invalid choice.");
      await pause();
      continue;
    }

    printBanner();
    console.log(`  Logging in to ${selected.label} (${selected.site})...`);
    console.log("  Complete the browser login flow, then return here.");
    console.log("");

    await runOpenClaw([
      "models",
      "auth",
      "login",
      "--provider",
      selected.id,
      "--method",
      "browser-login",
    ]);

    console.log("");
    const startNow = await prompt("  Start the gateway now? (y/N): ");
    if (/^y(es)?$/i.test(startNow)) {
      shouldStartGateway = true;
      break;
    }

    const more = await prompt("  Log in to another provider? (y/N): ");
    if (!/^y(es)?$/i.test(more)) {
      break;
    }
  }

  if (shouldStartGateway) {
    await startGateway();
  }
}

async function main() {
  ensurePlatform();
  ensureNodeVersion();

  if (!existsSync(LOCAL_EXTENSION_ENTRY)) {
    await installOrUpdatePlugin({ firstRun: true });
    await pause();
  }

  while (true) {
    printBanner();
    const status = getStatus();

    console.log("  Current status");
    console.log(`    Browser: ${status.browserName}`);
    console.log(`    Logged in: ${status.loggedIn.length > 0 ? status.loggedIn.join(", ") : "none"}`);
    console.log(`    Gateway: ${status.gatewayRunning ? "running (port 18789)" : "stopped"}`);
    console.log("");
    console.log("    [1] Log in to a provider");
    console.log("    [2] Start gateway and open the web UI");
    console.log("    [3] Reinstall or update the plugin");
    console.log("    [4] Switch browser");
    console.log("    [5] Install a browser automatically");
    console.log("    [0] Exit");
    console.log("");

    const choice = await prompt("  Choose an option: ");

    if (choice === "0") {
      break;
    }

    try {
      if (choice === "1") {
        await loginProviders();
        continue;
      }

      if (choice === "2") {
        await startGateway();
        continue;
      }

      if (choice === "3") {
        await installOrUpdatePlugin();
        await pause();
        continue;
      }

      if (choice === "4") {
        await selectBrowser();
        await pause();
        continue;
      }

      if (choice === "5") {
        await offerBrowserAutoInstall();
        await pause();
        continue;
      }

      console.log("  [x] Invalid option.");
      await pause();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("");
      console.log(`  [x] ${message}`);
      await pause();
    }
  }
}

try {
  await main();
} finally {
  rl.close();
}
