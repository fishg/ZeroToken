import type { StreamFn } from "@mariozechner/pi-agent-core";
import {
  emptyPluginConfigSchema,
  type OpenClawPluginApi,
  type ProviderAuthContext,
  type ProviderAuthResult,
} from "openclaw/plugin-sdk/core";
import {
  buildChatGPTWebProvider,
  buildClaudeWebProvider,
  buildDeepseekWebProvider,
  buildDoubaoWebProvider,
  buildGeminiWebProvider,
  buildGlmIntlWebProvider,
  buildGrokWebProvider,
  buildKimiWebProvider,
  buildPerplexityWebProvider,
  buildQwenCNWebProvider,
  buildQwenWebProvider,
  buildXiaomiMimoWebProvider,
  buildZWebProvider,
  CHATGPT_WEB_DEFAULT_MODEL_ID,
  CLAUDE_WEB_DEFAULT_MODEL_ID,
  DEEPSEEK_WEB_DEFAULT_MODEL_ID,
  DOUBAO_WEB_DEFAULT_MODEL_ID,
  GEMINI_WEB_DEFAULT_MODEL_ID,
  GLM_INTL_WEB_DEFAULT_MODEL_ID,
  GROK_WEB_DEFAULT_MODEL_ID,
  KIMI_WEB_DEFAULT_MODEL_ID,
  PERPLEXITY_WEB_DEFAULT_MODEL_ID,
  QWEN_WEB_DEFAULT_MODEL_ID,
  Z_WEB_DEFAULT_MODEL_ID,
} from "./zero-token/bridge/web-providers.js";
import { loginChatGPTWeb } from "./zero-token/providers/chatgpt-web-auth.js";
import { loginClaudeWeb } from "./zero-token/providers/claude-web-auth.js";
import { loginDeepseekWeb } from "./zero-token/providers/deepseek-web-auth.js";
import { loginDoubaoWeb } from "./zero-token/providers/doubao-web-auth.js";
import { loginGeminiWeb } from "./zero-token/providers/gemini-web-auth.js";
import { loginGlmIntlWeb } from "./zero-token/providers/glm-intl-web-auth.js";
import { loginGrokWeb } from "./zero-token/providers/grok-web-auth.js";
import { loginKimiWeb } from "./zero-token/providers/kimi-web-auth.js";
import { loginPerplexityWeb } from "./zero-token/providers/perplexity-web-auth.js";
import { loginQwenCNWeb } from "./zero-token/providers/qwen-cn-web-auth.js";
import { loginQwenWeb } from "./zero-token/providers/qwen-web-auth.js";
import { loginXiaomiMimoWeb } from "./zero-token/providers/xiaomimo-web-auth.js";
import { loginZWeb } from "./zero-token/providers/glm-web-auth.js";
import { createChatGPTWebStreamFn } from "./zero-token/streams/chatgpt-web-stream.js";
import { createClaudeWebStreamFn } from "./zero-token/streams/claude-web-stream.js";
import { createDeepseekWebStreamFn } from "./zero-token/streams/deepseek-web-stream.js";
import { createDoubaoWebStreamFn } from "./zero-token/streams/doubao-web-stream.js";
import { createGeminiWebStreamFn } from "./zero-token/streams/gemini-web-stream.js";
import { createGlmIntlWebStreamFn } from "./zero-token/streams/glm-intl-web-stream.js";
import { createGlmWebStreamFn } from "./zero-token/streams/glm-web-stream.js";
import { createGrokWebStreamFn } from "./zero-token/streams/grok-web-stream.js";
import { createKimiWebStreamFn } from "./zero-token/streams/kimi-web-stream.js";
import { createPerplexityWebStreamFn } from "./zero-token/streams/perplexity-web-stream.js";
import { createQwenCNWebStreamFn } from "./zero-token/streams/qwen-cn-web-stream.js";
import { createQwenWebStreamFn } from "./zero-token/streams/qwen-web-stream.js";
import { createXiaomiMimoWebStreamFn } from "./zero-token/streams/xiaomimo-web-stream.js";
import type { ZeroTokenModelProviderConfig } from "./zero-token/types.js";

type RegisteredProvider = Parameters<OpenClawPluginApi["registerProvider"]>[0];
type ProviderCatalogRun = NonNullable<NonNullable<RegisteredProvider["catalog"]>["run"]>;
type ProviderCatalogContext = Parameters<ProviderCatalogRun>[0];
type ProviderCatalogResult = Awaited<ReturnType<ProviderCatalogRun>>;
type ProviderCreateStreamFn = NonNullable<RegisteredProvider["createStreamFn"]>;
type ProviderCreateStreamFnContext = Parameters<ProviderCreateStreamFn>[0];
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
    id: "glm-intl-web",
    label: "GLM International (Web)",
    envVar: "GLM_INTL_WEB_COOKIE",
    defaultModelId: GLM_INTL_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildGlmIntlWebProvider,
    createStreamFn: createGlmIntlWebStreamFn,
    login: loginGlmIntlWeb,
  },
  {
    id: "glm-web",
    label: "GLM (Web)",
    envVar: "GLM_WEB_COOKIE",
    defaultModelId: Z_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildZWebProvider,
    createStreamFn: createGlmWebStreamFn,
    login: loginZWeb,
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
  {
    id: "xiaomimo-web",
    label: "Xiaomi MiMo (Web)",
    envVar: "XIAOMIMO_WEB_COOKIE",
    defaultModelId: "xiaomimo-chat",
    buildProvider: buildXiaomiMimoWebProvider,
    createStreamFn: createXiaomiMimoWebStreamFn,
    login: loginXiaomiMimoWeb,
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

function createConfiguredStreamFn(
  api: OpenClawPluginApi,
  ctx: ProviderCreateStreamFnContext,
  desc: WebProviderDescriptor,
): StreamFn {
  return async (model, context, options) => {
    const configuredApiKey = ctx.config?.models?.providers?.[desc.id]?.apiKey;
    let resolvedApiKey =
      typeof configuredApiKey === "string" && configuredApiKey.trim().length > 0
        ? configuredApiKey.trim()
        : undefined;

    if (!resolvedApiKey) {
      const resolved = await api.runtime.modelAuth.resolveApiKeyForProvider({
        provider: desc.id,
        cfg: ctx.config,
      });
      resolvedApiKey = resolved.apiKey?.trim() || undefined;
    }

    if (!resolvedApiKey) {
      throw new Error(`No browser-auth credentials found for provider "${desc.id}".`);
    }

    return await desc.createStreamFn(resolvedApiKey)(model, context, options);
  };
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

const zeroTokenPlugin = {
  id: "zero-token",
  name: "Zero Token Web Providers",
  description: "Use browser-authenticated web models without standard API keys.",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    for (const desc of WEB_PROVIDERS) {
      api.registerProvider(buildRegisteredProvider(api, desc));
    }
  },
};

export default zeroTokenPlugin;
