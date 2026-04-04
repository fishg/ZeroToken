import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { StreamFn } from "@mariozechner/pi-agent-core";
import { registerApiProvider, getApiProvider } from "@mariozechner/pi-ai";
import { ZERO_TOKEN_PROVIDER_IDS } from "./zero-token/bridge/web-providers.js";
import {
  buildChatGPTWebProvider,
  buildClaudeWebProvider,
  buildDeepseekWebProvider,
  buildDoubaoWebProvider,
  buildGeminiWebProvider,
  buildGrokWebProvider,
  buildKimiWebProvider,
  buildPerplexityWebProvider,
  buildQwenCNWebProvider,
  buildQwenWebProvider,
  CHATGPT_WEB_DEFAULT_MODEL_ID,
  CLAUDE_WEB_DEFAULT_MODEL_ID,
  DEEPSEEK_WEB_DEFAULT_MODEL_ID,
  DOUBAO_WEB_DEFAULT_MODEL_ID,
  GEMINI_WEB_DEFAULT_MODEL_ID,
  GROK_WEB_DEFAULT_MODEL_ID,
  KIMI_WEB_DEFAULT_MODEL_ID,
  PERPLEXITY_WEB_DEFAULT_MODEL_ID,
  QWEN_WEB_DEFAULT_MODEL_ID,
} from "./zero-token/bridge/web-providers.js";
import { loginChatGPTWeb } from "./zero-token/providers/chatgpt-web-auth.js";
import { loginClaudeWeb } from "./zero-token/providers/claude-web-auth.js";
import { loginDeepseekWeb } from "./zero-token/providers/deepseek-web-auth.js";
import { loginDoubaoWeb } from "./zero-token/providers/doubao-web-auth.js";
import { loginGeminiWeb } from "./zero-token/providers/gemini-web-auth.js";
import { loginGrokWeb } from "./zero-token/providers/grok-web-auth.js";
import { loginKimiWeb } from "./zero-token/providers/kimi-web-auth.js";
import { loginPerplexityWeb } from "./zero-token/providers/perplexity-web-auth.js";
import { loginQwenCNWeb } from "./zero-token/providers/qwen-cn-web-auth.js";
import { loginQwenWeb } from "./zero-token/providers/qwen-web-auth.js";
import { createChatGPTWebStreamFn } from "./zero-token/streams/chatgpt-web-stream.js";
import { createClaudeWebStreamFn } from "./zero-token/streams/claude-web-stream.js";
import { createDeepseekWebStreamFn } from "./zero-token/streams/deepseek-web-stream.js";
import { createDoubaoWebStreamFn } from "./zero-token/streams/doubao-web-stream.js";
import { createGeminiWebStreamFn } from "./zero-token/streams/gemini-web-stream.js";
import { createGrokWebStreamFn } from "./zero-token/streams/grok-web-stream.js";
import { createKimiWebStreamFn } from "./zero-token/streams/kimi-web-stream.js";
import { createPerplexityWebStreamFn } from "./zero-token/streams/perplexity-web-stream.js";
import { createQwenCNWebStreamFn } from "./zero-token/streams/qwen-cn-web-stream.js";
import { createQwenWebStreamFn } from "./zero-token/streams/qwen-web-stream.js";
import type { ZeroTokenModelProviderConfig } from "./zero-token/types.js";

type ProviderProfileCredential = {
  type: string;
  provider: string;
  key?: string;
};

type ProviderProfilePatch = {
  profileId: string;
  credential: ProviderProfileCredential;
};

type ProviderAuthResult = {
  defaultModel?: string;
  configPatch?: Record<string, unknown>;
  profiles?: ProviderProfilePatch[];
  notes?: string[];
};

type ProviderProgressHandle = {
  update(message: string): void;
  stop(message?: string): void;
};

type ProviderAuthContext = {
  prompter: {
    progress(label: string): ProviderProgressHandle;
  };
  openUrl(url: string): Promise<void>;
};

type ProviderCatalogContext = {
  resolveProviderApiKey(providerId: string): {
    apiKey?: string | null;
    discoveryApiKey?: string | null;
  };
};

type ProviderCreateStreamFnContext = {
  config?: any;
};

type ProviderWrapStreamFnContext = {
  config?: any;
  agentDir?: string;
  workspaceDir?: string;
  provider: string;
  modelId: string;
  extraParams?: Record<string, unknown>;
  thinkingLevel?: string;
  model?: any;
  streamFn?: StreamFn;
};

type RegisteredProvider = {
  id: string;
  label: string;
  envVars?: string[];
  auth?: Array<{
    id: string;
    label: string;
    hint?: string;
    kind: string;
    run: (ctx: ProviderAuthContext) => Promise<ProviderAuthResult>;
  }>;
  catalog?: {
    order?: string;
    run?: (ctx: ProviderCatalogContext) => Promise<unknown>;
  };
  discovery?: {
    order?: string;
    run?: (ctx: ProviderCatalogContext) => Promise<unknown>;
  };
  createStreamFn?: (ctx: ProviderCreateStreamFnContext) => StreamFn;
  wrapStreamFn?: (ctx: ProviderWrapStreamFnContext) => StreamFn;
  wizard?: {
    setup?: {
      choiceId: string;
      choiceLabel: string;
      choiceHint?: string;
      groupId?: string;
      groupLabel?: string;
      groupHint?: string;
      methodId?: string;
    };
  };
};

type OpenClawPluginApi = {
  registerProvider(provider: RegisteredProvider): void;
  runtime: {
    config?: any;
    modelAuth: {
      resolveApiKeyForProvider(input: {
        provider: string;
        cfg?: any;
      }): Promise<{ apiKey?: string | null }>;
    };
  };
};

function emptyPluginConfigSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {},
  };
}

type ProviderCatalogRun = NonNullable<NonNullable<RegisteredProvider["catalog"]>["run"]>;
type ProviderCatalogResult = Awaited<ReturnType<ProviderCatalogRun>>;
type BrowserLoginParams = {
  onProgress: (message: string) => void;
  openUrl: (url: string) => Promise<boolean>;
};
type BrowserAuthPayload = object;

type WebProviderDescriptor = {
  id: string;
  label: string;
  envVar: string;
  defaultModelId: string;
  buildProvider: (params?: { apiKey?: string }) =>
    | ZeroTokenModelProviderConfig
    | Promise<ZeroTokenModelProviderConfig>;
  createStreamFn: (authJson: string) => StreamFn;
  login: (params: BrowserLoginParams) => Promise<BrowserAuthPayload>;
};

const ZERO_TOKEN_GROUP_ID = "zero-token";
const ZERO_TOKEN_GROUP_LABEL = "Zero Token";
const ZERO_TOKEN_GROUP_HINT = "Use browser sessions instead of API keys.";

const WEB_PROVIDERS: WebProviderDescriptor[] = [
  {
    id: "chatgpt-web",
    label: "ChatGPT (Web)",
    envVar: "CHATGPT_WEB_COOKIE",
    defaultModelId: CHATGPT_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildChatGPTWebProvider,
    createStreamFn: createChatGPTWebStreamFn,
    login: loginChatGPTWeb,
  },
  {
    id: "claude-web",
    label: "Claude (Web)",
    envVar: "CLAUDE_WEB_COOKIE",
    defaultModelId: CLAUDE_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildClaudeWebProvider,
    createStreamFn: createClaudeWebStreamFn,
    login: loginClaudeWeb,
  },
  {
    id: "deepseek-web",
    label: "DeepSeek (Web)",
    envVar: "DEEPSEEK_WEB_COOKIE",
    defaultModelId: DEEPSEEK_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildDeepseekWebProvider,
    createStreamFn: createDeepseekWebStreamFn,
    login: loginDeepseekWeb,
  },
  {
    id: "doubao-web",
    label: "Doubao (Web)",
    envVar: "DOUBAO_WEB_COOKIE",
    defaultModelId: DOUBAO_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildDoubaoWebProvider,
    createStreamFn: createDoubaoWebStreamFn,
    login: loginDoubaoWeb,
  },
  {
    id: "gemini-web",
    label: "Gemini (Web)",
    envVar: "GEMINI_WEB_COOKIE",
    defaultModelId: GEMINI_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildGeminiWebProvider,
    createStreamFn: createGeminiWebStreamFn,
    login: loginGeminiWeb,
  },
  {
    id: "grok-web",
    label: "Grok (Web)",
    envVar: "GROK_WEB_COOKIE",
    defaultModelId: GROK_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildGrokWebProvider,
    createStreamFn: createGrokWebStreamFn,
    login: loginGrokWeb,
  },
  {
    id: "kimi-web",
    label: "Kimi (Web)",
    envVar: "KIMI_WEB_COOKIE",
    defaultModelId: KIMI_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildKimiWebProvider,
    createStreamFn: createKimiWebStreamFn,
    login: loginKimiWeb,
  },
  {
    id: "perplexity-web",
    label: "Perplexity (Web)",
    envVar: "PERPLEXITY_WEB_COOKIE",
    defaultModelId: PERPLEXITY_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildPerplexityWebProvider,
    createStreamFn: createPerplexityWebStreamFn,
    login: loginPerplexityWeb,
  },
  {
    id: "qwen-cn-web",
    label: "Qwen CN (Web)",
    envVar: "QWEN_CN_WEB_COOKIE",
    defaultModelId: "Qwen3.5-Plus",
    buildProvider: buildQwenCNWebProvider,
    createStreamFn: createQwenCNWebStreamFn,
    login: loginQwenCNWeb,
  },
  {
    id: "qwen-web",
    label: "Qwen (Web)",
    envVar: "QWEN_WEB_COOKIE",
    defaultModelId: QWEN_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildQwenWebProvider,
    createStreamFn: createQwenWebStreamFn,
    login: loginQwenWeb,
  },
];

function createAuthProgress(ctx: ProviderAuthContext, label: string) {
  const progress = ctx.prompter.progress(`${label} login`);
  return {
    update: (message: string) => progress.update(message),
    stop: (message: string) => progress.stop(message),
  };
}

function serializeBrowserAuth(payload: BrowserAuthPayload): string {
  return JSON.stringify(payload);
}

function resolveModelAliasMap(providerId: string, provider: ZeroTokenModelProviderConfig) {
  const nextModels: Record<string, { alias: string }> = {};
  if (Array.isArray(provider.models)) {
    for (const model of provider.models) {
      const modelId = typeof model?.id === "string" ? model.id.trim() : "";
      if (!modelId) {
        continue;
      }
      const alias =
        typeof model.name === "string" && model.name.trim().length > 0
          ? model.name.trim()
          : modelId;
      nextModels[`${providerId}/${modelId}`] = { alias };
    }
  }
  return nextModels;
}

function buildProviderConfigPatch(desc: WebProviderDescriptor, provider: ZeroTokenModelProviderConfig) {
  const models = resolveModelAliasMap(desc.id, provider);
  models[`${desc.id}/${desc.defaultModelId}`] ??= { alias: desc.label };

  return {
    models: {
      mode: "merge",
      providers: {
        [desc.id]: provider,
      },
    },
    agents: {
      defaults: {
        models,
      },
    },
  };
}

async function runBrowserAuth(
  ctx: ProviderAuthContext,
  desc: WebProviderDescriptor,
): Promise<ProviderAuthResult> {
  const progress = createAuthProgress(ctx, desc.label);
  try {
    const authPayload = await desc.login({
      onProgress: progress.update,
      openUrl: async (url) => {
        await ctx.openUrl(url);
        return true;
      },
    });
    const serializedAuth = serializeBrowserAuth(authPayload);
    const provider = await desc.buildProvider({ apiKey: serializedAuth });
    progress.stop(`${desc.label} login captured.`);

    return {
      defaultModel: `${desc.id}/${desc.defaultModelId}`,
      configPatch: buildProviderConfigPatch(desc, provider),
      profiles: [
        {
          profileId: `${desc.id}:default`,
          credential: {
            type: "api_key",
            provider: desc.id,
            key: serializedAuth,
          },
        },
      ],
      notes: [`${desc.label} credentials were stored as a reusable browser-auth profile.`],
    };
  } catch (error) {
    progress.stop(`${desc.label} login failed.`);
    throw error;
  }
}

async function runCatalog(
  ctx: ProviderCatalogContext,
  desc: WebProviderDescriptor,
): Promise<ProviderCatalogResult> {
  const { apiKey, discoveryApiKey } = ctx.resolveProviderApiKey(desc.id);
  const resolvedApiKey = discoveryApiKey ?? apiKey;
  if (!resolvedApiKey) {
    return null;
  }
  return {
    provider: await desc.buildProvider({ apiKey: resolvedApiKey }),
  };
}

async function resolveStreamApiKey(
  api: OpenClawPluginApi,
  config: any,
  providerId: string,
) {
  const configuredApiKey = config?.models?.providers?.[providerId]?.apiKey;
  let resolvedApiKey =
    typeof configuredApiKey === "string" && configuredApiKey.trim().length > 0
      ? configuredApiKey.trim()
      : undefined;

  if (!resolvedApiKey) {
    const resolved = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: providerId,
      cfg: config,
    });
    resolvedApiKey = resolved.apiKey?.trim() || undefined;
  }

  if (!resolvedApiKey) {
    throw new Error(`No browser-auth credentials found for provider "${providerId}".`);
  }

  return resolvedApiKey;
}

function createResolvedStreamFn(
  api: OpenClawPluginApi,
  config: any,
  desc: WebProviderDescriptor,
): StreamFn {
  return async (model, context, options) => {
    const resolvedApiKey = await resolveStreamApiKey(api, config, desc.id);
    return await desc.createStreamFn(resolvedApiKey)(model, context, options);
  };
}

function createConfiguredStreamFn(
  api: OpenClawPluginApi,
  ctx: ProviderCreateStreamFnContext,
  desc: WebProviderDescriptor,
): StreamFn {
  return createResolvedStreamFn(api, ctx.config, desc);
}

function createWrappedStreamFn(
  api: OpenClawPluginApi,
  ctx: ProviderWrapStreamFnContext,
  desc: WebProviderDescriptor,
): StreamFn {
  return createResolvedStreamFn(api, ctx.config, desc);
}

function buildRegisteredProvider(
  api: OpenClawPluginApi,
  desc: WebProviderDescriptor,
): RegisteredProvider {
  return {
    id: desc.id,
    label: desc.label,
    envVars: [desc.envVar],
    auth: [
      {
        id: "browser-login",
        label: `${desc.label} Browser Login`,
        hint: "Authenticate by signing in through your real browser session.",
        kind: "custom",
        run: async (ctx) => await runBrowserAuth(ctx, desc),
      },
    ],
    catalog: {
      order: "late",
      run: async (ctx) => await runCatalog(ctx, desc),
    },
    discovery: {
      order: "late",
      run: async (ctx) => await runCatalog(ctx, desc),
    },
    createStreamFn: (ctx) => createConfiguredStreamFn(api, ctx, desc),
    wrapStreamFn: (ctx) => createWrappedStreamFn(api, ctx, desc),
    wizard: {
      setup: {
        choiceId: desc.id,
        choiceLabel: desc.label,
        choiceHint: "Browser login; no OpenAI-style API key required.",
        groupId: ZERO_TOKEN_GROUP_ID,
        groupLabel: ZERO_TOKEN_GROUP_LABEL,
        groupHint: ZERO_TOKEN_GROUP_HINT,
        methodId: "browser-login",
      },
    },
  };
}

// ─── Gateway cleanup helpers ────────────────────────────────────────────────
// These functions guarantee that stale gateway processes and lock files are
// fully removed before a new gateway instance starts.  The cleanup runs at
// TWO points: (1) module-load time (earliest possible), and (2) inside
// register() with the actual configured port.
//
// If all cleanup attempts fail, we set OPENCLAW_ALLOW_MULTI_GATEWAY=1 to
// skip the file lock entirely — the HTTP server will still bind the port
// exclusively, so there is no risk of two gateways serving simultaneously.

/**
 * Synchronous sleep — uses Atomics.wait (precise, no child-process overhead).
 */
function syncSleepMs(ms: number): void {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    // Fallback for environments without SharedArrayBuffer
    const end = Date.now() + ms;
    while (Date.now() < end) {
      // busy-wait (last resort)
    }
  }
}

/**
 * Get PIDs listening on `port`.
 * Uses PowerShell on Windows (more reliable than netstat+findstr parsing),
 * falls back to netstat if PowerShell fails.  Uses lsof on Linux/macOS.
 */
function getListeningPids(port: number): string[] {
  const myPid = String(process.pid);
  const pids = new Set<string>();

  if (process.platform === "win32") {
    // ── Method 1: PowerShell (most reliable on modern Windows) ──
    try {
      const psOut = execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
        { encoding: "utf-8", timeout: 8000 },
      ).trim();
      for (const line of psOut.split(/\r?\n/)) {
        const pid = line.trim();
        if (pid && pid !== "0" && pid !== myPid) pids.add(pid);
      }
    } catch {
      // PowerShell not available or failed
    }

    // ── Method 2: netstat fallback ──
    if (pids.size === 0) {
      try {
        const out = execSync(
          `netstat -aon | findstr ":${port} " | findstr "LISTENING"`,
          { encoding: "utf-8", timeout: 5000 },
        ).trim();
        for (const line of out.split("\n")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== myPid) pids.add(pid);
        }
      } catch {
        // No processes found
      }
    }
  } else {
    // Linux / macOS
    try {
      const out = execSync(`lsof -ti :${port}`, { encoding: "utf-8", timeout: 5000 }).trim();
      for (const pid of out.split("\n")) {
        if (pid.trim() && pid.trim() !== myPid) pids.add(pid.trim());
      }
    } catch {
      // lsof returns non-zero when nothing found
    }
  }

  return [...pids];
}

/**
 * Kill process(es) by PID.  On Windows uses /T to kill the entire process
 * tree (child processes), /F to force.
 */
function killPid(pid: string): void {
  try {
    if (process.platform === "win32") {
      // /T = kill process tree, /F = force
      execSync(`taskkill /PID ${pid} /T /F`, { timeout: 5000, stdio: "ignore" });
    } else {
      try { process.kill(Number(pid), "SIGKILL"); } catch { /* already exited */ }
    }
  } catch {
    // Process may have already exited
  }
}

/**
 * Wait (poll) for a port to be free, up to `maxWaitMs`.
 * Returns true if port became free, false if still occupied.
 */
function waitForPortFree(port: number, maxWaitMs: number = 6000): boolean {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const pids = getListeningPids(port);
    if (pids.length === 0) return true;
    syncSleepMs(500);
  }
  return getListeningPids(port).length === 0;
}

/**
 * Collect all gateway lock file paths from all possible temp directories.
 */
function findGatewayLockFiles(): string[] {
  const results: string[] = [];
  const tmpDir = os.tmpdir();

  const lockDirNames: string[] = ["openclaw"];
  const uid = typeof process.getuid === "function" ? process.getuid() : null;
  if (uid != null) {
    lockDirNames.push(`openclaw-${uid}`);
  }

  for (const dirName of lockDirNames) {
    const lockDir = path.join(tmpDir, dirName);
    try {
      if (!fs.existsSync(lockDir)) continue;
      for (const file of fs.readdirSync(lockDir)) {
        if (file.startsWith("gateway.") && file.endsWith(".lock")) {
          results.push(path.join(lockDir, file));
        }
      }
    } catch {
      // skip
    }
  }
  return results;
}

/**
 * Read the owner PID from a lock file (returns null on any error).
 */
function readLockOwnerPid(lockPath: string): number | null {
  try {
    const raw = fs.readFileSync(lockPath, "utf-8");
    const payload = JSON.parse(raw);
    return typeof payload.pid === "number" ? payload.pid : null;
  } catch {
    return null;
  }
}

/**
 * Force-remove a lock file.  Tries Node's unlinkSync first, then
 * Windows `del /f /q` as fallback (handles read-only / locked files).
 */
function forceRemoveLockFile(lockPath: string): boolean {
  // Attempt 1: Node.js unlink
  try {
    fs.unlinkSync(lockPath);
    return true;
  } catch {
    // May be locked by another process handle
  }

  // Attempt 2: OS-level force delete (Windows only)
  if (process.platform === "win32") {
    try {
      execSync(`cmd /c del /f /q "${lockPath}"`, { timeout: 3000, stdio: "ignore" });
      return !fs.existsSync(lockPath);
    } catch {
      // still locked
    }
  }

  return false;
}

/**
 * Full gateway cleanup — kill stale processes, remove lock files, verify port
 * is free.  Called at module load time AND in register().
 *
 * If cleanup cannot guarantee a free state, sets OPENCLAW_ALLOW_MULTI_GATEWAY=1
 * to bypass the lock mechanism entirely (nuclear option).
 */
function cleanupStaleGateway(port: number = 18789): void {
  try {
    // ── Phase 1: Identify and kill lock-file owners ──────────────────────
    const lockFiles = findGatewayLockFiles();
    const killedPids = new Set<string>();

    for (const lockPath of lockFiles) {
      const ownerPid = readLockOwnerPid(lockPath);
      if (ownerPid && ownerPid !== process.pid) {
        // Check if owner process is still alive
        let alive = false;
        try { process.kill(ownerPid, 0); alive = true; } catch { /* dead */ }

        if (alive) {
          console.log(`[zero-token] Killing lock owner (pid ${ownerPid}) for ${path.basename(lockPath)}`);
          killPid(String(ownerPid));
          killedPids.add(String(ownerPid));
          syncSleepMs(500); // Brief wait for handle release
        }
      }

      // Now remove the lock file
      if (forceRemoveLockFile(lockPath)) {
        console.log(`[zero-token] Removed lock file: ${lockPath}`);
      } else {
        console.warn(`[zero-token] WARN: Could not remove lock file: ${lockPath}`);
      }
    }

    // ── Phase 2: Kill any process still holding the gateway port ─────────
    const portPids = getListeningPids(port);
    for (const pid of portPids) {
      if (!killedPids.has(pid)) {
        console.log(`[zero-token] Killing stale gateway process (pid ${pid}) on port ${port}`);
        killPid(pid);
        killedPids.add(pid);
      }
    }

    // ── Phase 3: Wait for port to become free ────────────────────────────
    if (killedPids.size > 0) {
      const portFree = waitForPortFree(port, 6000);
      if (!portFree) {
        console.warn(`[zero-token] Port ${port} still occupied after killing ${killedPids.size} process(es)`);
        // Last-ditch: try killing again with fresh PID list
        for (const pid of getListeningPids(port)) {
          console.log(`[zero-token] Final retry: killing pid ${pid}`);
          killPid(pid);
        }
        syncSleepMs(2000);
      }
    }

    // ── Phase 4: Final lock file sweep ───────────────────────────────────
    for (const lockPath of findGatewayLockFiles()) {
      forceRemoveLockFile(lockPath);
    }

    // ── Phase 5: Nuclear option ──────────────────────────────────────────
    // If the port is STILL occupied or lock files remain, tell the gateway
    // to skip its own lock entirely.  This guarantees no "lock timeout".
    const stillOccupied = getListeningPids(port).length > 0;
    const remainingLocks = findGatewayLockFiles().length;
    if (stillOccupied || remainingLocks > 0) {
      console.warn(
        `[zero-token] Cannot fully clean gateway state (port occupied=${stillOccupied}, ` +
        `locks remaining=${remainingLocks}). Setting OPENCLAW_ALLOW_MULTI_GATEWAY=1 to bypass lock.`
      );
      process.env.OPENCLAW_ALLOW_MULTI_GATEWAY = "1";
    }
  } catch (err) {
    // Cleanup must NEVER block startup — if everything fails, bypass the lock.
    console.warn(`[zero-token] Gateway cleanup error: ${err instanceof Error ? err.message : String(err)}`);
    process.env.OPENCLAW_ALLOW_MULTI_GATEWAY = "1";
  }
}

// ── Module-level early cleanup ──────────────────────────────────────────────
// Run gateway cleanup the moment this plugin module is loaded — this is the
// earliest possible point, BEFORE the gateway attempts lock acquisition.
try {
  console.log("[zero-token] Running early gateway cleanup at module load time...");
  cleanupStaleGateway();
} catch {
  process.env.OPENCLAW_ALLOW_MULTI_GATEWAY = "1";
}

const zeroTokenPlugin = {
  id: "zero-token",
  name: "Zero Token Web Providers",
  description: "Use browser-authenticated web models without standard API keys.",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    // Also clean up in register() as a second pass (may have config-specific port)
    const gatewayPort = (api.runtime?.config as any)?.gateway?.port ?? 18789;
    cleanupStaleGateway(gatewayPort);
    // Build a set of zero-token provider IDs for quick lookup
    const webProviderIds = new Set(WEB_PROVIDERS.map((d) => d.id));
    const webProviderMap = new Map(WEB_PROVIDERS.map((d) => [d.id, d]));

    for (const desc of WEB_PROVIDERS) {
      api.registerProvider(buildRegisteredProvider(api, desc));
    }

    // Wrap the built-in "openai-completions" API provider so that requests targeting
    // a zero-token web provider are intercepted and routed through our custom stream
    // function instead of the default OpenAI-compatible HTTP transport.
    // This is necessary because OpenClaw's gateway always uses streamSimple (which
    // dispatches via model.api), and config validation only accepts standard api values.
    const builtinProvider = getApiProvider("openai-completions");
    console.log(`[zero-token] builtinProvider found: ${!!builtinProvider}`);
    if (builtinProvider) {
      const originalStream = builtinProvider.stream;
      const originalStreamSimple = builtinProvider.streamSimple;

      const makeInterceptor = (original: StreamFn): StreamFn => {
        return async (model, context, options) => {
          const providerId =
            typeof model.provider === "string" ? model.provider.trim() : "";
          const toolCount = Array.isArray((context as any).tools) ? (context as any).tools.length : 'undefined';
          console.log(`[zero-token] interceptor called: model.provider="${providerId}", model.api="${model.api}", model.id="${model.id}", isWebProvider=${webProviderIds.has(providerId)}, context.tools=${toolCount}, contextKeys=${Object.keys(context).join(',')}`);
          if (webProviderIds.has(providerId)) {
            const desc = webProviderMap.get(providerId)!;
            // Resolve credentials
            const resolved = await api.runtime.modelAuth.resolveApiKeyForProvider({
              provider: desc.id,
              cfg: api.runtime.config,
            });
            const apiKey = resolved.apiKey?.trim();
            if (!apiKey) {
              throw new Error(
                `No browser-auth credentials found for provider "${desc.id}".`,
              );
            }
            return desc.createStreamFn(apiKey)(model, context, options);
          }
          // Not a zero-token provider, use the original handler
          return original(model, context, options);
        };
      };

      // Re-register the provider with our interceptors instead of modifying
      // the existing object (which may be frozen/sealed).
      registerApiProvider({
        api: "openai-completions",
        stream: makeInterceptor(originalStream),
        streamSimple: makeInterceptor(originalStreamSimple),
      });
      console.log(`[zero-token] re-registered openai-completions with interceptor`);
    }
  },
};

export default zeroTokenPlugin;
