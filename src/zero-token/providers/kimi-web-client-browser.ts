import { chromium } from "playwright-core";
import type { BrowserContext, Page } from "playwright-core";
import { getHeadersWithAuth } from "./browser-cdp.js";
import {
  launchOpenClawChrome,
  stopOpenClawChrome,
  getChromeWebSocketUrl,
  type RunningChrome,
} from "./browser-chrome.js";
import { resolveZeroTokenBrowserRuntime } from "./browser-runtime.js";
import { getSharedBrowser, releaseSharedBrowser } from "./shared-browser.js";
import type { ModelDefinitionConfig } from "../types.js";

export interface KimiWebClientOptions {
  cookie: string;
  userAgent?: string;
}

/**
 * Kimi Web Client using CDP attach
 * 使用 Connect RPC 纯 API（/apiv2/kimi.gateway.chat.v1.ChatService/Chat），kimi-auth 从 Cookie 提取
 */
export class KimiWebClientBrowser {
  private cookie: string;
  private userAgent: string;
  private baseUrl = "https://www.kimi.com";
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private running: RunningChrome | null = null;

  constructor(options: KimiWebClientOptions | string) {
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options) as KimiWebClientOptions;
        this.cookie = parsed.cookie;
        this.userAgent = parsed.userAgent || "Mozilla/5.0";
      } catch {
        this.cookie = options;
        this.userAgent = "Mozilla/5.0";
      }
    } else {
      this.cookie = options.cookie;
      this.userAgent = options.userAgent || "Mozilla/5.0";
    }
  }

  private async ensureBrowser() {
    if (this.browser && this.page) {
      return { browser: this.browser, page: this.page };
    }

    const { context, page } = await getSharedBrowser("Kimi Web Browser", "https://www.kimi.com/");
    this.browser = context;
    this.page = page;

    if (this.cookie.trim()) {
      const pageUrl = this.page?.url() ?? this.baseUrl;
      const domain = pageUrl.includes("moonshot.cn") ? ".moonshot.cn" : ".kimi.com";

      const rawCookies = this.cookie.split(";").map((c) => {
        const [name, ...valueParts] = c.trim().split("=");
        const nameStr = name?.trim() ?? "";
        const valueStr = valueParts.join("=").trim();
        if (!nameStr) {
          return null;
        }
        const cookie: {
          name: string;
          value: string;
          domain: string;
          path: string;
          secure?: boolean;
        } = {
          name: nameStr,
          value: valueStr,
          domain,
          path: "/",
        };
        if (nameStr.startsWith("__Secure-") || nameStr.startsWith("__Host-")) {
          cookie.secure = true;
        }
        return cookie;
      });
      const cookies = rawCookies.filter((c): c is NonNullable<typeof c> => c !== null);
      if (cookies.length > 0) {
        try {
          await this.browser.addCookies(cookies);
        } catch (err) {
          console.warn(
            `[Kimi Web] addCookies failed (page may already have session): ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    return { browser: this.browser, page: this.page };
  }

  async init() {
    await this.ensureBrowser();
  }

  async chatCompletions(params: {
    conversationId?: string;
    message: string;
    model: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<Uint8Array>> {
    const { browser, page } = await this.ensureBrowser();

    const cookies = await browser.cookies([this.baseUrl]);
    const kimiAuth = cookies.find((c) => c.name === "kimi-auth")?.value;
    if (!kimiAuth) {
      throw new Error("Kimi: 未找到 kimi-auth Cookie，请在 Chrome 中登录 www.kimi.com 后再试");
    }

    const scenario = params.model.includes("search")
      ? "SCENARIO_SEARCH"
      : params.model.includes("research")
        ? "SCENARIO_RESEARCH"
        : params.model.includes("k1")
          ? "SCENARIO_K1"
          : "SCENARIO_K2";

    const result = await page.evaluate(
      async ({
        baseUrl,
        message,
        kimiAuthToken,
        scenario,
        conversationId,
      }: {
        baseUrl: string;
        message: string;
        kimiAuthToken: string;
        scenario: string;
        conversationId?: string;
      }) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "*/*",
          Origin: baseUrl,
          Referer: `${baseUrl}/`,
          "X-Language": "zh-CN",
          "X-Msh-Platform": "web",
          Authorization: `Bearer ${kimiAuthToken}`,
        };

        // Step 1: Create a new conversation if needed
        let convId = conversationId || "";
        if (!convId) {
          try {
            const createRes = await fetch(`${baseUrl}/api/chat`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                name: "New Chat",
                is_example: false,
                born_from: "",
                kimiplus_id: "",
              }),
            });
            if (createRes.ok) {
              const convData = await createRes.json();
              convId = convData.id || "";
            }
            if (!convId) {
              return { ok: false as const, error: "Failed to create Kimi conversation" };
            }
          } catch (e: unknown) {
            return { ok: false as const, error: `Create conversation failed: ${e instanceof Error ? e.message : String(e)}` };
          }
        }

        // Step 2: Send message to the conversation using SSE streaming
        try {
          const chatRes = await fetch(`${baseUrl}/api/chat/${convId}/completion/stream`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              messages: [{ role: "user", content: message }],
              refs: [],
              use_search: false,
              kimiplus_id: "",
            }),
          });

          if (!chatRes.ok) {
            const errText = await chatRes.text();
            return { ok: false as const, error: `HTTP ${chatRes.status}: ${errText.slice(0, 400)}` };
          }

          const text = await chatRes.text();
          const lines = text.split("\n");
          const texts: string[] = [];

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const obj = JSON.parse(data);
              if (obj.error) {
                return { ok: false as const, error: obj.error.message || JSON.stringify(obj.error).slice(0, 200) };
              }
              // Kimi SSE: event text has content field
              if (obj.event === "cmpl" && obj.text) {
                texts.push(obj.text);
              }
            } catch {
              // skip non-JSON lines
            }
          }

          return { ok: true as const, text: texts.join(""), convId };
        } catch (e: unknown) {
          return { ok: false as const, error: `Chat request failed: ${e instanceof Error ? e.message : String(e)}` };
        }
      },
      {
        baseUrl: this.baseUrl,
        message: params.message,
        kimiAuthToken: kimiAuth,
        scenario,
        conversationId: params.conversationId,
      },
    );

    if (!result.ok) {
      throw new Error(`Kimi API 错误: ${result.error}`);
    }

    console.log(`[Kimi Web] API response: textLen=${result.text.length}, convId=${(result as { convId?: string }).convId}`);

    const escaped = JSON.stringify(result.text);
    const convId = (result as { convId?: string }).convId || "";
    // Include conversation ID in SSE so stream can track it
    const sse = `data: {"text":${escaped},"conversation_id":"${convId}"}\n\ndata: [DONE]\n\n`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sse));
        controller.close();
      },
    });
  }

  async close() {
    await releaseSharedBrowser();
    this.browser = null;
    this.page = null;
  }

  async discoverModels(): Promise<ModelDefinitionConfig[]> {
    return [
      {
        id: "moonshot-v1-32k",
        name: "Moonshot v1 32K",
        api: "kimi-web",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32000,
        maxTokens: 4096,
      },
    ] as ModelDefinitionConfig[];
  }
}
