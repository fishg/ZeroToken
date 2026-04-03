var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/zero-token/providers/doubao-web-client.ts
var doubao_web_client_exports = {};
__export(doubao_web_client_exports, {
  DoubaoWebClient: () => DoubaoWebClient
});
import crypto from "node:crypto";
var DOUBAO_API_BASE, USE_SAMANTHA_API, DoubaoWebClient;
var init_doubao_web_client = __esm({
  "src/zero-token/providers/doubao-web-client.ts"() {
    DOUBAO_API_BASE = "https://www.doubao.com";
    USE_SAMANTHA_API = true;
    DoubaoWebClient = class {
      auth;
      config;
      constructor(auth, config = {}) {
        if (typeof auth === "string") {
          try {
            this.auth = JSON.parse(auth);
          } catch {
            this.auth = { sessionid: auth };
          }
        } else {
          this.auth = auth;
        }
        const dynamicConfig = {};
        if (this.auth.msToken) {
          dynamicConfig.msToken = this.auth.msToken;
        }
        if (this.auth.a_bogus) {
          dynamicConfig.a_bogus = this.auth.a_bogus;
        }
        if (this.auth.fp) {
          dynamicConfig.fp = this.auth.fp;
        }
        if (this.auth.tea_uuid) {
          dynamicConfig.tea_uuid = this.auth.tea_uuid;
        }
        if (this.auth.device_id) {
          dynamicConfig.device_id = this.auth.device_id;
        }
        if (this.auth.web_tab_id) {
          dynamicConfig.web_tab_id = this.auth.web_tab_id;
        }
        if (this.auth.aid) {
          dynamicConfig.aid = this.auth.aid;
        }
        if (this.auth.version_code) {
          dynamicConfig.version_code = this.auth.version_code;
        }
        if (this.auth.pc_version) {
          dynamicConfig.pc_version = this.auth.pc_version;
        }
        if (this.auth.region) {
          dynamicConfig.region = this.auth.region;
        }
        if (this.auth.language) {
          dynamicConfig.language = this.auth.language;
        }
        this.config = {
          aid: "497858",
          device_platform: "web",
          language: "zh",
          pkg_type: "release_version",
          real_aid: "497858",
          region: "CN",
          samantha_web: "1",
          sys_region: "CN",
          use_olympus_account: "1",
          version_code: "20800",
          ...dynamicConfig,
          ...config
        };
        console.log(`[DoubaoWebClient] Config keys: ${Object.keys(this.config).join(", ")}`);
        console.log(`[DoubaoWebClient] fp in config: ${this.config.fp}`);
        console.log(`[DoubaoWebClient] tea_uuid in config: ${this.config.tea_uuid}`);
        console.log(`[DoubaoWebClient] device_id in config: ${this.config.device_id}`);
        console.log(`[DoubaoWebClient] web_tab_id in config: ${this.config.web_tab_id}`);
      }
      getHeaders() {
        const headers = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "User-Agent": this.auth.userAgent || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.doubao.com/chat/",
          Origin: "https://www.doubao.com",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin"
        };
        const sessionId = this.auth.sessionid;
        const ttwid = this.auth.ttwid ? decodeURIComponent(this.auth.ttwid) : void 0;
        if (ttwid) {
          headers["Cookie"] = `sessionid=${sessionId}; ttwid=${ttwid}`;
        } else {
          headers["Cookie"] = `sessionid=${sessionId}`;
        }
        return headers;
      }
      buildQueryParams() {
        const params = new URLSearchParams();
        Object.entries(this.config).forEach(([key, value]) => {
          if (value !== void 0 && value !== null && key !== "msToken" && key !== "a_bogus") {
            params.append(key, value.toString());
          }
        });
        if (this.config.msToken) {
          params.append("msToken", this.config.msToken);
        }
        if (this.config.a_bogus) {
          params.append("a_bogus", this.config.a_bogus);
        }
        return params.toString();
      }
      async discoverModels() {
        return [
          {
            id: "doubao-seed-2.0",
            name: "Doubao-Seed 2.0 (Web)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 64e3,
            maxTokens: 8192
          },
          {
            id: "doubao-pro",
            name: "Doubao Pro (Web)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 64e3,
            maxTokens: 8192
          },
          {
            id: "doubao-lite",
            name: "Doubao Lite (Web)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 64e3,
            maxTokens: 8192
          }
        ];
      }
      /** 将多轮消息合并为 samantha 接口需要的单条 content（纯文本） */
      mergeMessagesForSamantha(messages) {
        return messages.map((m) => {
          const role = m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system";
          return `<|im_start|>${role}
${m.content}
`;
        }).join("") + "<|im_end|>\n";
      }
      async chatCompletions(request, onChunk) {
        const queryParams = this.buildQueryParams();
        let url;
        let body;
        if (USE_SAMANTHA_API) {
          url = `${DOUBAO_API_BASE}/samantha/chat/completion?${queryParams}`;
          const text = this.mergeMessagesForSamantha(request.messages);
          body = JSON.stringify({
            messages: [
              {
                content: JSON.stringify({ text }),
                content_type: 2001,
                attachments: [],
                references: []
              }
            ],
            completion_option: {
              is_regen: false,
              with_suggest: true,
              need_create_conversation: true,
              launch_stage: 1,
              is_replace: false,
              is_delete: false,
              message_from: 0,
              event_id: "0"
            },
            conversation_id: "0",
            local_conversation_id: `local_16${Date.now().toString().slice(-14)}`,
            local_message_id: crypto.randomUUID()
          });
        } else {
          url = `${DOUBAO_API_BASE}/chat/completion?${queryParams}`;
          body = JSON.stringify({
            client_meta: {
              local_conversation_id: `local_${Date.now()}`,
              conversation_id: request.conversation_id || "",
              bot_id: "7338286299411103781"
            },
            ext: { use_deep_think: "0", fp: this.config.fp || "" },
            messages: request.messages.map((msg) => ({ role: msg.role, content: msg.content })),
            option: {
              send_message_scene: "",
              create_time_ms: Date.now(),
              collect_id: "",
              is_audio: false
            }
          });
        }
        const headers = this.getHeaders();
        if (USE_SAMANTHA_API) {
          headers["Referer"] = "https://www.doubao.com/chat/";
          headers["Agw-js-conv"] = "str";
        }
        console.log(`\u{1F310} \u53D1\u9001\u8BF7\u6C42\u5230: ${url}`);
        const response = await fetch(url, {
          method: "POST",
          headers,
          body
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`\u274C \u8C46\u5305 API \u9519\u8BEF: ${response.status} - ${errorText}`);
          throw new Error(`Doubao API error: ${response.status} - ${errorText}`);
        }
        console.log(`\u2705 \u8BF7\u6C42\u6210\u529F\uFF0C\u72B6\u6001\u7801: ${response.status}`);
        if (request.stream && onChunk) {
          return this.handleStreamResponse(response, onChunk);
        }
        if (request.stream) {
          return this.streamGenerator(response);
        }
        return this.parseNonStreamResponse(response);
      }
      async handleStreamResponse(response, onChunk) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body for streaming");
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let currentEvent = {};
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "") {
              if (currentEvent.event && currentEvent.data) {
                await this.processSSEEvent(currentEvent, onChunk, (chunk) => {
                  fullContent += chunk;
                });
              }
              currentEvent = {};
              continue;
            }
            const single = this.parseSingleLineSSE(trimmed);
            if (single) {
              await this.processSSEEvent(
                { event: single.event, data: single.data },
                onChunk,
                (chunk) => {
                  fullContent += chunk;
                }
              );
              currentEvent = {};
              continue;
            }
            if (trimmed.startsWith("id: ")) {
              currentEvent.id = trimmed.substring(4).trim();
            } else if (trimmed.startsWith("event: ")) {
              currentEvent.event = trimmed.substring(7).trim();
            } else if (trimmed.startsWith("data: ")) {
              currentEvent.data = trimmed.substring(6).trim();
            }
          }
        }
        if (currentEvent.event && currentEvent.data) {
          await this.processSSEEvent(currentEvent, onChunk, (chunk) => {
            fullContent += chunk;
          });
        }
        return {
          id: `chatcmpl-${Date.now()}`,
          model: "doubao-seed-2.0",
          object: "chat.completion",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: fullContent
              },
              delta: { content: fullContent },
              finish_reason: "stop"
            }
          ],
          created: Math.floor(Date.now() / 1e3)
        };
      }
      async processSSEEvent(event, onChunk, onContent) {
        if (!event.event || !event.data) {
          return;
        }
        try {
          const data = JSON.parse(event.data);
          switch (event.event) {
            case "CHUNK_DELTA":
              if (data.text) {
                onChunk(data.text);
                onContent(data.text);
              }
              break;
            case "STREAM_CHUNK":
              if (data.patch_op) {
                for (const patch of data.patch_op) {
                  if (patch.patch_value?.tts_content) {
                    onChunk(patch.patch_value.tts_content);
                    onContent(patch.patch_value.tts_content);
                  }
                }
              }
              break;
            case "SSE_REPLY_END":
              console.log(`\u2705 \u6D41\u5F0F\u56DE\u590D\u7ED3\u675F`);
              break;
            case "SSE_HEARTBEAT":
              break;
            case "SSE_ACK":
              break;
            case "STREAM_MSG_NOTIFY":
              if (data.content?.content_block) {
                for (const block of data.content.content_block) {
                  if (block.content?.text_block?.text) {
                    onChunk(block.content.text_block.text);
                    onContent(block.content.text_block.text);
                  }
                }
              }
              break;
            case "STREAM_ERROR":
              console.error(`\u274C \u8C46\u5305\u6D41\u5F0F\u9519\u8BEF:`, data);
              if (data.error_code === 710022004) {
                throw new Error(`\u8C46\u5305\u901F\u7387\u9650\u5236: ${data.error_msg} (\u9519\u8BEF\u7801: ${data.error_code})`);
              } else {
                throw new Error(`\u8C46\u5305API\u9519\u8BEF: ${data.error_msg} (\u9519\u8BEF\u7801: ${data.error_code})`);
              }
              break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(
            `\u26A0\uFE0F \u89E3\u6790 SSE \u6570\u636E\u5931\u8D25: ${errorMessage}, \u4E8B\u4EF6: ${event.event}, \u6570\u636E: ${event.data?.substring(0, 100)}`
          );
        }
      }
      /** 豆包可能使用单行 SSE：id: 123 event: CHUNK_DELTA data: {"text":"..."} */
      parseSingleLineSSE(line) {
        const m = line.match(/id:\s*\d+\s+event:\s*(\S+)\s+data:\s*(.+)/);
        if (!m) {
          return null;
        }
        return { event: m[1].trim(), data: m[2].trim() };
      }
      /**
       * 豆包 samantha API 响应格式：每行 JSON 含 event_type、event_data。
       * event_type 2001=数据块，event_data 为 JSON 字符串，内有 message.content（再解析得 {text}）；2003=结束。
       */
      extractTextFromSamanthaLine(line) {
        const chunks = [];
        try {
          const raw = JSON.parse(line);
          if (raw.code != null && raw.code !== 0) {
            return chunks;
          }
          if (raw.event_type === 2003) {
            return chunks;
          }
          if (raw.event_type !== 2001 || !raw.event_data) {
            return chunks;
          }
          const result = JSON.parse(raw.event_data);
          if (result.is_finish) {
            return chunks;
          }
          const message = result.message;
          const contentType = message?.content_type;
          if (!message || contentType === void 0 || ![2001, 2008].includes(contentType) || !message.content) {
            return chunks;
          }
          const content = JSON.parse(message.content);
          if (content.text) {
            chunks.push(content.text);
          }
        } catch {
        }
        return chunks;
      }
      async *streamGenerator(response) {
        const reader = response.body?.getReader();
        if (!reader) {
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = {};
        let eventCount = 0;
        let textEventCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "") {
              if (currentEvent.event && currentEvent.data) {
                eventCount++;
                const chunks = await this.extractTextFromEvent(currentEvent);
                if (chunks.length > 0) {
                  textEventCount++;
                }
                for (const chunk of chunks) {
                  yield chunk;
                }
              }
              currentEvent = {};
              continue;
            }
            const single = this.parseSingleLineSSE(trimmed);
            if (single) {
              eventCount++;
              const chunks = await this.extractTextFromEvent({
                event: single.event,
                data: single.data
              });
              if (chunks.length > 0) {
                textEventCount++;
              }
              for (const chunk of chunks) {
                yield chunk;
              }
              currentEvent = {};
              continue;
            }
            const dataLine = trimmed.startsWith("data: ") ? trimmed.slice(6).trim() : trimmed;
            const samanthaChunks = this.extractTextFromSamanthaLine(dataLine);
            if (samanthaChunks.length > 0) {
              eventCount++;
              textEventCount++;
              for (const chunk of samanthaChunks) {
                yield chunk;
              }
              currentEvent = {};
              continue;
            }
            if (trimmed.startsWith("id: ")) {
              currentEvent.id = trimmed.substring(4).trim();
            } else if (trimmed.startsWith("event: ")) {
              currentEvent.event = trimmed.substring(7).trim();
            } else if (trimmed.startsWith("data: ")) {
              currentEvent.data = trimmed.substring(6).trim();
            }
          }
        }
        if (currentEvent.event && currentEvent.data) {
          eventCount++;
          const chunks = await this.extractTextFromEvent(currentEvent);
          if (chunks.length > 0) {
            textEventCount++;
          }
          for (const chunk of chunks) {
            yield chunk;
          }
        }
        if (eventCount > 0 && textEventCount === 0) {
          const msg = `[DoubaoWebClient] \u6536\u5230 ${eventCount} \u4E2A SSE \u4E8B\u4EF6\u4F46\u672A\u89E3\u6790\u51FA\u6587\u672C\uFF0C\u8C46\u5305 API \u683C\u5F0F\u53EF\u80FD\u5DF2\u53D8\u66F4\u3002\u8BF7\u68C0\u67E5\u8BA4\u8BC1 (sessionid/cookie) \u662F\u5426\u6709\u6548\uFF0C\u6216\u67E5\u770B\u63A7\u5236\u53F0\u8C03\u8BD5\u8F93\u51FA\u3002`;
          console.warn(msg);
          throw new Error(msg);
        }
      }
      async extractTextFromEvent(event) {
        const chunks = [];
        if (!event.event || !event.data) {
          return chunks;
        }
        try {
          const data = JSON.parse(event.data);
          switch (event.event) {
            case "CHUNK_DELTA":
              if (data.text) {
                chunks.push(data.text);
              }
              break;
            case "STREAM_CHUNK":
              if (data.patch_op) {
                for (const patch of data.patch_op) {
                  if (patch.patch_value?.tts_content) {
                    chunks.push(patch.patch_value.tts_content);
                  }
                }
              }
              break;
            case "STREAM_MSG_NOTIFY":
              if (data.content?.content_block) {
                for (const block of data.content.content_block) {
                  if (block.content?.text_block?.text) {
                    chunks.push(block.content.text_block.text);
                  }
                }
              }
              break;
            default:
              if (event.event !== "SSE_HEARTBEAT" && event.event !== "SSE_ACK" && event.event !== "SSE_REPLY_END") {
                console.warn(
                  `[DoubaoWebClient] \u672A\u5904\u7406\u7684 SSE event: ${event.event}, data \u524D 120 \u5B57\u7B26: ${event.data.substring(0, 120)}`
                );
              }
          }
        } catch (error) {
        }
        return chunks;
      }
      async parseNonStreamResponse(response) {
        const text = await response.text();
        const lines = text.split("\n");
        let fullContent = "";
        for (const line of lines) {
          if (line.trim() === "") {
            continue;
          }
          if (line.startsWith("id: ")) {
            const match = line.match(/id: (\d+) event: (\w+) data: (.+)/);
            if (match) {
              const [, , event, dataStr] = match;
              try {
                const data = JSON.parse(dataStr);
                if (event === "CHUNK_DELTA" && data.text) {
                  fullContent += data.text;
                } else if (event === "STREAM_CHUNK" && data.patch_op) {
                  data.patch_op.forEach((patch) => {
                    if (patch.patch_value?.tts_content) {
                      fullContent += patch.patch_value.tts_content;
                    }
                  });
                }
              } catch (error) {
              }
            }
          }
        }
        return {
          id: `chatcmpl-${Date.now()}`,
          model: "doubao-seed-2.0",
          object: "chat.completion",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: fullContent
              },
              delta: { content: fullContent },
              finish_reason: "stop"
            }
          ],
          created: Math.floor(Date.now() / 1e3)
        };
      }
      async checkSession() {
        try {
          const url = `${DOUBAO_API_BASE}/im/conversation/info?${this.buildQueryParams()}`;
          const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders()
          });
          return response.ok;
        } catch {
          return false;
        }
      }
      // 更新配置方法
      updateConfig(config) {
        this.config = { ...this.config, ...config };
      }
      // 获取当前配置
      getConfig() {
        return { ...this.config };
      }
    };
  }
});

// src/zero-token/providers/config-paths.ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function resolveHomeDir() {
  return os.homedir();
}
function expandHome(input) {
  if (!input.startsWith("~")) {
    return path.resolve(input);
  }
  return path.resolve(path.join(resolveHomeDir(), input.slice(1)));
}
function resolveStateDir(env = process.env) {
  const override = env.OPENCLAW_STATE_DIR?.trim() || env.CLAWDBOT_STATE_DIR?.trim();
  if (override) {
    return expandHome(override);
  }
  return path.join(resolveHomeDir(), ".openclaw");
}
function resolveConfigPathCandidate(env = process.env) {
  const explicit = env.OPENCLAW_CONFIG_PATH?.trim() || env.CLAWDBOT_CONFIG_PATH?.trim();
  if (explicit) {
    return expandHome(explicit);
  }
  const home = resolveHomeDir();
  const stateDir = resolveStateDir(env);
  const candidates = [
    path.join(stateDir, "openclaw.json"),
    path.join(home, ".openclaw", "openclaw.json"),
    path.join(home, ".clawdbot", "clawdbot.json"),
    path.join(home, ".moldbot", "moldbot.json"),
    path.join(home, ".moltbot", "moltbot.json")
  ];
  const existing = candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch {
      return false;
    }
  });
  return existing ?? candidates[0] ?? path.join(stateDir, "openclaw.json");
}
var init_config_paths = __esm({
  "src/zero-token/providers/config-paths.ts"() {
  }
});

// src/zero-token/providers/port-defaults.ts
function isValidPort(port) {
  return Number.isFinite(port) && port > 0 && port <= 65535;
}
function clampPort(port, fallback) {
  return isValidPort(port) ? port : fallback;
}
function derivePort(base, offset, fallback) {
  return clampPort(base + offset, fallback);
}
function deriveDefaultBrowserControlPort(gatewayPort) {
  return derivePort(gatewayPort, 2, DEFAULT_BROWSER_CONTROL_PORT);
}
function deriveDefaultBrowserCdpPortRange(browserControlPort) {
  const start = derivePort(browserControlPort, 9, DEFAULT_BROWSER_CDP_PORT_RANGE_START);
  const end = clampPort(
    start + (DEFAULT_BROWSER_CDP_PORT_RANGE_END - DEFAULT_BROWSER_CDP_PORT_RANGE_START),
    DEFAULT_BROWSER_CDP_PORT_RANGE_END
  );
  if (end < start) {
    return { start, end: start };
  }
  return { start, end };
}
var DEFAULT_BROWSER_CONTROL_PORT, DEFAULT_BROWSER_CDP_PORT_RANGE_START, DEFAULT_BROWSER_CDP_PORT_RANGE_END;
var init_port_defaults = __esm({
  "src/zero-token/providers/port-defaults.ts"() {
    DEFAULT_BROWSER_CONTROL_PORT = 18791;
    DEFAULT_BROWSER_CDP_PORT_RANGE_START = 18800;
    DEFAULT_BROWSER_CDP_PORT_RANGE_END = 18899;
  }
});

// src/zero-token/providers/browser-constants.ts
var DEFAULT_OPENCLAW_BROWSER_ENABLED, DEFAULT_BROWSER_EVALUATE_ENABLED, DEFAULT_OPENCLAW_BROWSER_COLOR, DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME, DEFAULT_BROWSER_DEFAULT_PROFILE_NAME;
var init_browser_constants = __esm({
  "src/zero-token/providers/browser-constants.ts"() {
    DEFAULT_OPENCLAW_BROWSER_ENABLED = true;
    DEFAULT_BROWSER_EVALUATE_ENABLED = true;
    DEFAULT_OPENCLAW_BROWSER_COLOR = "#FF4500";
    DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME = "openclaw";
    DEFAULT_BROWSER_DEFAULT_PROFILE_NAME = "openclaw";
  }
});

// src/zero-token/providers/browser-profiles.ts
function getUsedPorts(profiles) {
  if (!profiles) {
    return /* @__PURE__ */ new Set();
  }
  const used = /* @__PURE__ */ new Set();
  for (const profile of Object.values(profiles)) {
    if (typeof profile.cdpPort === "number") {
      used.add(profile.cdpPort);
      continue;
    }
    const rawUrl = profile.cdpUrl?.trim();
    if (!rawUrl) {
      continue;
    }
    try {
      const parsed = new URL(rawUrl);
      const port = parsed.port && Number.parseInt(parsed.port, 10) > 0 ? Number.parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
      if (!Number.isNaN(port) && port > 0 && port <= 65535) {
        used.add(port);
      }
    } catch {
    }
  }
  return used;
}
var CDP_PORT_RANGE_START;
var init_browser_profiles = __esm({
  "src/zero-token/providers/browser-profiles.ts"() {
    CDP_PORT_RANGE_START = 18800;
  }
});

// src/zero-token/providers/browser-cdp.ts
function isLoopbackHost(host) {
  const normalized = host.trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized === "[::1]";
}
function getHeadersWithAuth(url, headers = {}) {
  try {
    const parsed = new URL(url);
    const hasAuthHeader = Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
    if (hasAuthHeader) {
      return headers;
    }
    if (parsed.username || parsed.password) {
      const auth = Buffer.from(`${parsed.username}:${parsed.password}`).toString("base64");
      return { ...headers, Authorization: `Basic ${auth}` };
    }
  } catch {
  }
  return headers;
}
function appendCdpPath(cdpUrl, extraPath) {
  const url = new URL(cdpUrl);
  const basePath = url.pathname.replace(/\/$/, "");
  const suffix = extraPath.startsWith("/") ? extraPath : `/${extraPath}`;
  url.pathname = `${basePath}${suffix}`;
  return url.toString();
}
function normalizeCdpWsUrl(wsUrl, cdpUrl) {
  const ws = new URL(wsUrl);
  const cdp = new URL(cdpUrl);
  const isWildcardBind = ws.hostname === "0.0.0.0" || ws.hostname === "[::]";
  if ((isLoopbackHost(ws.hostname) || isWildcardBind) && !isLoopbackHost(cdp.hostname)) {
    ws.hostname = cdp.hostname;
    const cdpPort = cdp.port || (cdp.protocol === "https:" ? "443" : "80");
    if (cdpPort) {
      ws.port = cdpPort;
    }
    ws.protocol = cdp.protocol === "https:" ? "wss:" : "ws:";
  }
  if (cdp.protocol === "https:" && ws.protocol === "ws:") {
    ws.protocol = "wss:";
  }
  if (!ws.username && !ws.password && (cdp.username || cdp.password)) {
    ws.username = cdp.username;
    ws.password = cdp.password;
  }
  for (const [key, value] of cdp.searchParams.entries()) {
    if (!ws.searchParams.has(key)) {
      ws.searchParams.append(key, value);
    }
  }
  return ws.toString();
}
var init_browser_cdp = __esm({
  "src/zero-token/providers/browser-cdp.ts"() {
  }
});

// src/zero-token/providers/browser-config.ts
function resolveGatewayPort(cfg, env = process.env) {
  const envRaw = env.OPENCLAW_GATEWAY_PORT?.trim() || env.CLAWDBOT_GATEWAY_PORT?.trim();
  if (envRaw) {
    const parsed = Number.parseInt(envRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const configPort = cfg?.gateway?.port;
  if (typeof configPort === "number" && Number.isFinite(configPort) && configPort > 0) {
    return configPort;
  }
  return DEFAULT_GATEWAY_PORT;
}
function normalizeHexColor(raw) {
  const value = (raw ?? "").trim();
  if (!value) {
    return DEFAULT_OPENCLAW_BROWSER_COLOR;
  }
  const normalized = value.startsWith("#") ? value : `#${value}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return DEFAULT_OPENCLAW_BROWSER_COLOR;
  }
  return normalized.toUpperCase();
}
function normalizeTimeoutMs(raw, fallback) {
  const value = typeof raw === "number" && Number.isFinite(raw) ? Math.floor(raw) : fallback;
  return value < 0 ? fallback : value;
}
function resolveCdpPortRangeStart(rawStart, fallbackStart, rangeSpan) {
  const start = typeof rawStart === "number" && Number.isFinite(rawStart) ? Math.floor(rawStart) : fallbackStart;
  if (start < 1 || start > 65535) {
    throw new Error(`browser.cdpPortRangeStart must be between 1 and 65535, got: ${start}`);
  }
  const maxStart = 65535 - rangeSpan;
  if (start > maxStart) {
    throw new Error(
      `browser.cdpPortRangeStart (${start}) is too high for a ${rangeSpan + 1}-port range; max is ${maxStart}.`
    );
  }
  return start;
}
function normalizeStringList(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return void 0;
  }
  const values = raw.map((value) => value.trim()).filter((value) => value.length > 0);
  return values.length > 0 ? values : void 0;
}
function resolveBrowserSsrFPolicy(cfg) {
  const allowPrivateNetwork = cfg?.ssrfPolicy?.allowPrivateNetwork;
  const dangerouslyAllowPrivateNetwork = cfg?.ssrfPolicy?.dangerouslyAllowPrivateNetwork;
  const allowedHostnames = normalizeStringList(cfg?.ssrfPolicy?.allowedHostnames);
  const hostnameAllowlist = normalizeStringList(cfg?.ssrfPolicy?.hostnameAllowlist);
  const hasExplicitPrivateSetting = allowPrivateNetwork !== void 0 || dangerouslyAllowPrivateNetwork !== void 0;
  const resolvedAllowPrivateNetwork = dangerouslyAllowPrivateNetwork === true || allowPrivateNetwork === true || !hasExplicitPrivateSetting;
  if (!resolvedAllowPrivateNetwork && !hasExplicitPrivateSetting && !allowedHostnames && !hostnameAllowlist) {
    return void 0;
  }
  return {
    ...resolvedAllowPrivateNetwork ? { dangerouslyAllowPrivateNetwork: true } : {},
    ...allowedHostnames ? { allowedHostnames } : {},
    ...hostnameAllowlist ? { hostnameAllowlist } : {}
  };
}
function parseHttpUrl(raw, label) {
  const trimmed = raw.trim();
  const parsed = new URL(trimmed);
  const allowed = ["http:", "https:", "ws:", "wss:"];
  if (!allowed.includes(parsed.protocol)) {
    throw new Error(`${label} must be http(s) or ws(s), got: ${parsed.protocol.replace(":", "")}`);
  }
  const isSecure = parsed.protocol === "https:" || parsed.protocol === "wss:";
  const port = parsed.port && Number.parseInt(parsed.port, 10) > 0 ? Number.parseInt(parsed.port, 10) : isSecure ? 443 : 80;
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`${label} has invalid port: ${parsed.port}`);
  }
  return {
    parsed,
    port,
    normalized: parsed.toString().replace(/\/$/, "")
  };
}
function ensureDefaultProfile(profiles, defaultColor, legacyCdpPort, derivedDefaultCdpPort, legacyCdpUrl) {
  const result = { ...profiles };
  if (!result[DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME]) {
    result[DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME] = {
      cdpPort: legacyCdpPort ?? derivedDefaultCdpPort ?? CDP_PORT_RANGE_START,
      color: defaultColor,
      ...legacyCdpUrl ? { cdpUrl: legacyCdpUrl } : {}
    };
  }
  return result;
}
function ensureDefaultChromeExtensionProfile(profiles, controlPort) {
  const result = { ...profiles };
  if (result.chrome) {
    return result;
  }
  const relayPort = controlPort + 1;
  if (!Number.isFinite(relayPort) || relayPort <= 0 || relayPort > 65535) {
    return result;
  }
  if (getUsedPorts(result).has(relayPort)) {
    return result;
  }
  result.chrome = {
    driver: "extension",
    cdpUrl: `http://127.0.0.1:${relayPort}`,
    color: "#00AA00"
  };
  return result;
}
function resolveBrowserConfig(cfg, rootConfig) {
  const enabled = cfg?.enabled ?? DEFAULT_OPENCLAW_BROWSER_ENABLED;
  const evaluateEnabled = cfg?.evaluateEnabled ?? DEFAULT_BROWSER_EVALUATE_ENABLED;
  const gatewayPort = resolveGatewayPort(rootConfig);
  const controlPort = deriveDefaultBrowserControlPort(gatewayPort ?? DEFAULT_BROWSER_CONTROL_PORT);
  const defaultColor = normalizeHexColor(cfg?.color);
  const remoteCdpTimeoutMs = normalizeTimeoutMs(cfg?.remoteCdpTimeoutMs, 1500);
  const remoteCdpHandshakeTimeoutMs = normalizeTimeoutMs(
    cfg?.remoteCdpHandshakeTimeoutMs,
    Math.max(2e3, remoteCdpTimeoutMs * 2)
  );
  const derivedCdpRange = deriveDefaultBrowserCdpPortRange(controlPort);
  const cdpRangeSpan = derivedCdpRange.end - derivedCdpRange.start;
  const cdpPortRangeStart = resolveCdpPortRangeStart(
    cfg?.cdpPortRangeStart,
    derivedCdpRange.start,
    cdpRangeSpan
  );
  const cdpPortRangeEnd = cdpPortRangeStart + cdpRangeSpan;
  const rawCdpUrl = (cfg?.cdpUrl ?? "").trim();
  let cdpInfo;
  if (rawCdpUrl) {
    cdpInfo = parseHttpUrl(rawCdpUrl, "browser.cdpUrl");
  } else {
    const derivedPort = controlPort + 1;
    if (derivedPort > 65535) {
      throw new Error(
        `Derived CDP port (${derivedPort}) is too high; check gateway port configuration.`
      );
    }
    const derived = new URL(`http://127.0.0.1:${derivedPort}`);
    cdpInfo = {
      parsed: derived,
      port: derivedPort,
      normalized: derived.toString().replace(/\/$/, "")
    };
  }
  const headless = cfg?.headless === true;
  const noSandbox = cfg?.noSandbox === true;
  const attachOnly = cfg?.attachOnly === true;
  const executablePath = cfg?.executablePath?.trim() || void 0;
  const defaultProfileFromConfig = cfg?.defaultProfile?.trim() || void 0;
  const legacyCdpPort = rawCdpUrl ? cdpInfo.port : void 0;
  const isWsUrl = cdpInfo.parsed.protocol === "ws:" || cdpInfo.parsed.protocol === "wss:";
  const legacyCdpUrl = rawCdpUrl && isWsUrl ? cdpInfo.normalized : void 0;
  const profiles = ensureDefaultChromeExtensionProfile(
    ensureDefaultProfile(
      cfg?.profiles,
      defaultColor,
      legacyCdpPort,
      cdpPortRangeStart,
      legacyCdpUrl
    ),
    controlPort
  );
  const cdpProtocol = cdpInfo.parsed.protocol === "https:" ? "https" : "http";
  const defaultProfile = defaultProfileFromConfig ?? (profiles[DEFAULT_BROWSER_DEFAULT_PROFILE_NAME] ? DEFAULT_BROWSER_DEFAULT_PROFILE_NAME : profiles[DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME] ? DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME : "chrome");
  const extraArgs = Array.isArray(cfg?.extraArgs) ? cfg.extraArgs.filter((arg) => typeof arg === "string" && arg.trim().length > 0) : [];
  return {
    enabled,
    evaluateEnabled,
    controlPort,
    cdpPortRangeStart,
    cdpPortRangeEnd,
    cdpProtocol,
    cdpHost: cdpInfo.parsed.hostname,
    cdpIsLoopback: isLoopbackHost(cdpInfo.parsed.hostname),
    remoteCdpTimeoutMs,
    remoteCdpHandshakeTimeoutMs,
    color: defaultColor,
    executablePath,
    headless,
    noSandbox,
    attachOnly,
    defaultProfile,
    profiles,
    ssrfPolicy: resolveBrowserSsrFPolicy(cfg),
    extraArgs,
    relayBindHost: cfg?.relayBindHost?.trim() || void 0
  };
}
function resolveProfile(resolved, profileName) {
  const profile = resolved.profiles[profileName];
  if (!profile) {
    return null;
  }
  const rawProfileUrl = profile.cdpUrl?.trim() ?? "";
  let cdpHost = resolved.cdpHost;
  let cdpPort = profile.cdpPort ?? 0;
  let cdpUrl = "";
  const driver = profile.driver === "extension" ? "extension" : "openclaw";
  if (rawProfileUrl) {
    const parsed = parseHttpUrl(rawProfileUrl, `browser.profiles.${profileName}.cdpUrl`);
    cdpHost = parsed.parsed.hostname;
    cdpPort = parsed.port;
    cdpUrl = parsed.normalized;
  } else if (cdpPort) {
    cdpUrl = `${resolved.cdpProtocol}://${resolved.cdpHost}:${cdpPort}`;
  } else {
    throw new Error(`Profile "${profileName}" must define cdpPort or cdpUrl.`);
  }
  return {
    name: profileName,
    cdpPort,
    cdpUrl,
    cdpHost,
    cdpIsLoopback: isLoopbackHost(cdpHost),
    color: profile.color,
    driver,
    attachOnly: profile.attachOnly ?? resolved.attachOnly
  };
}
var DEFAULT_GATEWAY_PORT;
var init_browser_config = __esm({
  "src/zero-token/providers/browser-config.ts"() {
    init_port_defaults();
    init_browser_constants();
    init_browser_profiles();
    init_browser_cdp();
    DEFAULT_GATEWAY_PORT = 18789;
  }
});

// src/zero-token/providers/browser-runtime.ts
import fs2 from "node:fs";
import JSON5 from "json5";
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function formatRuntimeError(error) {
  return error instanceof Error ? error.message : String(error);
}
function loadZeroTokenBrowserRootConfig() {
  const configPath = resolveConfigPathCandidate();
  try {
    const raw = fs2.readFileSync(configPath, "utf8");
    const parsed = JSON5.parse(raw);
    if (!isRecord(parsed)) {
      throw new Error("Config file must contain an object.");
    }
    return parsed;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }
    throw new Error(
      `Failed to read OpenClaw browser config from ${configPath}: ${formatRuntimeError(error)}`
    );
  }
}
function resolveZeroTokenBrowserRuntime() {
  const rootConfig = loadZeroTokenBrowserRootConfig();
  const browserConfig = resolveBrowserConfig(
    rootConfig.browser,
    rootConfig
  );
  const profile = resolveProfile(browserConfig, browserConfig.defaultProfile);
  if (!profile) {
    throw new Error(`Could not resolve browser profile '${browserConfig.defaultProfile}'`);
  }
  return { rootConfig, browserConfig, profile };
}
var init_browser_runtime = __esm({
  "src/zero-token/providers/browser-runtime.ts"() {
    init_config_paths();
    init_browser_config();
  }
});

// src/zero-token/providers/shared-browser.ts
import { chromium } from "playwright-core";
async function getSharedBrowser(providerLabel, targetUrl) {
  if (sharedBrowser && !sharedBrowser.isConnected()) {
    console.log(`[${providerLabel}] API Chrome connection lost, resetting...`);
    sharedBrowser = null;
    sharedContext = null;
  }
  if (!sharedBrowser) {
    const { browserConfig } = resolveZeroTokenBrowserRuntime();
    const executablePath = browserConfig.executablePath;
    console.log(`[${providerLabel}] Launching hidden API Chrome...`);
    const launchArgs = [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--mute-audio",
      "--window-position=-32000,-32000",
      "--window-size=1,1"
    ];
    sharedBrowser = await chromium.launch({
      executablePath: executablePath || void 0,
      headless: false,
      args: launchArgs
    });
    sharedBrowser.on("disconnected", () => {
      console.log(`[SharedBrowser] API Chrome disconnected, resetting`);
      sharedBrowser = null;
      sharedContext = null;
      sharedRefCount = 0;
    });
    sharedContext = sharedBrowser.contexts()[0] ?? await sharedBrowser.newContext();
    console.log(`[${providerLabel}] Hidden API Chrome launched`);
  } else {
    console.log(`[${providerLabel}] Reusing hidden API Chrome`);
  }
  if (!sharedContext) {
    sharedContext = await sharedBrowser.newContext();
  }
  sharedRefCount++;
  const targetDomain = new URL(targetUrl).hostname;
  const existingPage = sharedContext.pages().find((p) => {
    try {
      return new URL(p.url()).hostname.includes(targetDomain);
    } catch {
      return false;
    }
  });
  if (existingPage) {
    console.log(`[${providerLabel}] Reusing existing page for ${targetDomain}`);
    return { context: sharedContext, page: existingPage, isNew: false };
  }
  const page = sharedContext.pages().find((p) => p.url() === "about:blank") || await sharedContext.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  return { context: sharedContext, page, isNew: true };
}
async function releaseSharedBrowser() {
  sharedRefCount = Math.max(0, sharedRefCount - 1);
  if (sharedRefCount === 0 && sharedBrowser) {
    console.log(`[SharedBrowser] All providers released, closing API Chrome`);
    try {
      await sharedBrowser.close();
    } catch {
    }
    sharedBrowser = null;
    sharedContext = null;
  }
}
var sharedBrowser, sharedContext, sharedRefCount;
var init_shared_browser = __esm({
  "src/zero-token/providers/shared-browser.ts"() {
    init_browser_runtime();
    sharedBrowser = null;
    sharedContext = null;
    sharedRefCount = 0;
  }
});

// src/zero-token/providers/claude-web-client-browser.ts
var claude_web_client_browser_exports = {};
__export(claude_web_client_browser_exports, {
  ClaudeWebClientBrowser: () => ClaudeWebClientBrowser
});
import crypto2 from "node:crypto";
var ClaudeWebClientBrowser;
var init_claude_web_client_browser = __esm({
  "src/zero-token/providers/claude-web-client-browser.ts"() {
    init_shared_browser();
    ClaudeWebClientBrowser = class {
      sessionKey;
      cookie;
      userAgent;
      organizationId;
      deviceId;
      baseUrl = "https://claude.ai/api";
      browser = null;
      page = null;
      running = null;
      constructor(options) {
        if (typeof options === "string") {
          const parsed = JSON.parse(options);
          this.sessionKey = parsed.sessionKey;
          this.cookie = parsed.cookie || `sessionKey=${parsed.sessionKey}`;
          this.userAgent = parsed.userAgent || "Mozilla/5.0";
          this.organizationId = parsed.organizationId;
          this.deviceId = parsed.deviceId || this.extractDeviceId(this.cookie) || crypto2.randomUUID();
        } else {
          this.sessionKey = options.sessionKey;
          this.cookie = options.cookie || `sessionKey=${options.sessionKey}`;
          this.userAgent = options.userAgent || "Mozilla/5.0";
          this.organizationId = options.organizationId;
          this.deviceId = options.deviceId || this.extractDeviceId(this.cookie) || crypto2.randomUUID();
        }
      }
      extractDeviceId(cookie) {
        const match = cookie.match(/anthropic-device-id=([^;]+)/);
        return match ? match[1] : void 0;
      }
      async ensureBrowser() {
        if (this.browser && this.page) {
          return { browser: this.browser, page: this.page };
        }
        const { context, page } = await getSharedBrowser("Claude Web Browser", "https://claude.ai/new");
        this.browser = context;
        this.page = page;
        const cookies = this.cookie.split(";").map((c) => {
          const [name, ...valueParts] = c.trim().split("=");
          return {
            name: name.trim(),
            value: valueParts.join("=").trim(),
            domain: ".claude.ai",
            path: "/"
          };
        });
        await this.browser.addCookies(cookies);
        return { browser: this.browser, page: this.page };
      }
      async init() {
        if (this.organizationId) {
          return;
        }
        try {
          const { page } = await this.ensureBrowser();
          const response = await page.evaluate(
            async ({ baseUrl, deviceId }) => {
              const res = await fetch(`${baseUrl}/organizations`, {
                headers: {
                  Accept: "application/json",
                  "anthropic-client-platform": "web_claude_ai",
                  "anthropic-device-id": deviceId
                },
                credentials: "include"
              });
              if (!res.ok) {
                return { ok: false, status: res.status };
              }
              const data = await res.json();
              return { ok: true, data };
            },
            { baseUrl: this.baseUrl, deviceId: this.deviceId }
          );
          if (response.ok && Array.isArray(response.data) && response.data.length > 0) {
            this.organizationId = response.data[0].uuid;
            console.log(`[Claude Web Browser] Discovered organization ID: ${this.organizationId}`);
          } else {
            console.warn(`[Claude Web Browser] Failed to fetch organizations: ${response.status}`);
          }
        } catch (e) {
          console.warn(`[Claude Web Browser] Failed to discover organization: ${String(e)}`);
        }
      }
      async createConversation() {
        const { page } = await this.ensureBrowser();
        const url = this.organizationId ? `${this.baseUrl}/organizations/${this.organizationId}/chat_conversations` : `${this.baseUrl}/chat_conversations`;
        console.log(`[Claude Web Browser] Creating conversation at: ${url}`);
        const convUuid = crypto2.randomUUID();
        const response = await page.evaluate(
          async ({ url: url2, deviceId, convUuid: convUuid2 }) => {
            const res = await fetch(url2, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "anthropic-client-platform": "web_claude_ai",
                "anthropic-device-id": deviceId
              },
              body: JSON.stringify({
                name: `Conversation ${(/* @__PURE__ */ new Date()).toISOString()}`,
                uuid: convUuid2
              }),
              credentials: "include"
            });
            if (!res.ok) {
              const errorText = await res.text();
              return { ok: false, status: res.status, error: errorText };
            }
            const data = await res.json();
            return { ok: true, data };
          },
          { url, deviceId: this.deviceId, convUuid }
        );
        console.log(`[Claude Web Browser] Create conversation response: ${response.status}`);
        if (!response.ok) {
          console.error(
            `[Claude Web Browser] Create conversation failed: ${response.status} - ${response.error}`
          );
          throw new Error(`Failed to create conversation: ${response.status}`);
        }
        return response.data;
      }
      async chatCompletions(params) {
        let conversationId = params.conversationId;
        if (!conversationId) {
          const conversation = await this.createConversation();
          conversationId = conversation.uuid;
        }
        const { page } = await this.ensureBrowser();
        const url = this.organizationId ? `${this.baseUrl}/organizations/${this.organizationId}/chat_conversations/${conversationId}/completion` : `${this.baseUrl}/chat_conversations/${conversationId}/completion`;
        console.log(`[Claude Web Browser] Sending message to: ${url}`);
        console.log(`[Claude Web Browser] Conversation ID: ${conversationId}`);
        console.log(`[Claude Web Browser] Model: ${params.model || "claude-sonnet-4-6"}`);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let modelId = params.model || "claude-sonnet-4-6";
        if (modelId.includes("claude-3-5-sonnet")) {
          modelId = "claude-sonnet-4-6";
        } else if (modelId.includes("claude-3-opus")) {
          modelId = "claude-opus-4-6";
        } else if (modelId.includes("claude-3-haiku")) {
          modelId = "claude-haiku-4-6";
        }
        const body = {
          prompt: params.message,
          parent_message_uuid: "00000000-0000-4000-8000-000000000000",
          model: modelId,
          timezone,
          rendering_mode: "messages",
          attachments: params.attachments || [],
          files: [],
          locale: "en-US",
          personalized_styles: [],
          sync_sources: [],
          tools: []
        };
        const responseData = await page.evaluate(
          async ({ url: url2, body: body2, deviceId }) => {
            const res = await fetch(url2, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
                "anthropic-client-platform": "web_claude_ai",
                "anthropic-device-id": deviceId
              },
              body: JSON.stringify(body2),
              credentials: "include"
            });
            if (!res.ok) {
              const errorText = await res.text();
              return { ok: false, status: res.status, error: errorText };
            }
            const reader = res.body?.getReader();
            if (!reader) {
              return { ok: false, status: 500, error: "No response body" };
            }
            const decoder = new TextDecoder();
            let fullText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              fullText += decoder.decode(value, { stream: true });
            }
            return { ok: true, data: fullText };
          },
          { url, body, deviceId: this.deviceId }
        );
        console.log(
          `[Claude Web Browser] Message response: ${responseData.ok ? 200 : responseData.status}`
        );
        if (!responseData.ok) {
          console.error(
            `[Claude Web Browser] Message failed: ${responseData.status} - ${responseData.error}`
          );
          if (responseData.status === 401) {
            throw new Error(
              "Authentication failed. Please re-run onboarding to refresh your Claude session."
            );
          }
          throw new Error(`Claude API error: ${responseData.status}`);
        }
        console.log(
          `[Claude Web Browser] Response data length: ${responseData.data?.length || 0} bytes`
        );
        console.log(
          `[Claude Web Browser] Response preview: ${responseData.data?.substring(0, 200) || "empty"}`
        );
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(responseData.data));
            controller.close();
          }
        });
        return stream;
      }
      async close() {
        await releaseSharedBrowser();
        this.browser = null;
        this.page = null;
      }
      async discoverModels() {
        return [
          {
            id: "claude-sonnet-4-6",
            name: "Claude Sonnet 4.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 2e5,
            maxTokens: 8192
          },
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 2e5,
            maxTokens: 16384
          },
          {
            id: "claude-haiku-4-6",
            name: "Claude Haiku 4.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 2e5,
            maxTokens: 8192
          }
        ];
      }
    };
  }
});

// src/index.ts
import { execSync as execSync2 } from "node:child_process";
import * as fs6 from "node:fs";
import * as os5 from "node:os";
import * as path6 from "node:path";
import { registerApiProvider, getApiProvider } from "@mariozechner/pi-ai";

// src/zero-token/bridge/web-providers.ts
var DEEPSEEK_WEB_BASE_URL = "https://chat.deepseek.com";
var DEEPSEEK_WEB_DEFAULT_MODEL_ID = "deepseek-chat";
var DEEPSEEK_WEB_DEFAULT_CONTEXT_WINDOW = 64e3;
var DEEPSEEK_WEB_DEFAULT_MAX_TOKENS = 8192;
var DEEPSEEK_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var DOUBAO_WEB_BASE_URL = "https://www.doubao.com";
var DOUBAO_WEB_DEFAULT_MODEL_ID = "doubao-seed-2.0";
var CLAUDE_WEB_BASE_URL = "https://claude.ai";
var CLAUDE_WEB_DEFAULT_MODEL_ID = "claude-sonnet-4-6";
var CLAUDE_WEB_DEFAULT_CONTEXT_WINDOW = 2e5;
var CLAUDE_WEB_DEFAULT_MAX_TOKENS = 8192;
var CLAUDE_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var CHATGPT_WEB_BASE_URL = "https://chatgpt.com";
var CHATGPT_WEB_DEFAULT_MODEL_ID = "gpt-4";
var CHATGPT_WEB_DEFAULT_CONTEXT_WINDOW = 128e3;
var CHATGPT_WEB_DEFAULT_MAX_TOKENS = 4096;
var CHATGPT_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var QWEN_WEB_BASE_URL = "https://chat.qwen.ai";
var QWEN_WEB_DEFAULT_MODEL_ID = "qwen-max";
var QWEN_WEB_DEFAULT_CONTEXT_WINDOW = 32e3;
var QWEN_WEB_DEFAULT_MAX_TOKENS = 8192;
var QWEN_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var KIMI_WEB_BASE_URL = "https://www.kimi.com";
var KIMI_WEB_DEFAULT_MODEL_ID = "moonshot-v1-128k";
var KIMI_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var GEMINI_WEB_BASE_URL = "https://gemini.google.com";
var GEMINI_WEB_DEFAULT_MODEL_ID = "gemini-pro";
var GEMINI_WEB_DEFAULT_CONTEXT_WINDOW = 32e3;
var GEMINI_WEB_DEFAULT_MAX_TOKENS = 8192;
var GEMINI_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var GROK_WEB_BASE_URL = "https://grok.com";
var GROK_WEB_DEFAULT_MODEL_ID = "grok-2";
var GROK_WEB_DEFAULT_CONTEXT_WINDOW = 32e3;
var GROK_WEB_DEFAULT_MAX_TOKENS = 4096;
var GROK_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var Z_WEB_BASE_URL = "https://chatglm.cn";
var Z_WEB_DEFAULT_MODEL_ID = "glm-4-plus";
var Z_WEB_DEFAULT_CONTEXT_WINDOW = 128e3;
var Z_WEB_DEFAULT_MAX_TOKENS = 4096;
var Z_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var GLM_INTL_WEB_BASE_URL = "https://chat.z.ai";
var GLM_INTL_WEB_DEFAULT_MODEL_ID = "glm-4-plus";
var GLM_INTL_WEB_DEFAULT_CONTEXT_WINDOW = 128e3;
var GLM_INTL_WEB_DEFAULT_MAX_TOKENS = 4096;
var GLM_INTL_WEB_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var PERPLEXITY_WEB_BASE_URL = "https://www.perplexity.ai";
var PERPLEXITY_WEB_DEFAULT_MODEL_ID = "perplexity-web";
var PERPLEXITY_WEB_DEFAULT_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
var PERPLEXITY_WEB_DEFAULT_CONTEXT_WINDOW = 128e3;
var QWEN_CN_WEB_BASE_URL = "https://chat2.qianwen.com";
var QWEN_CN_WEB_DEFAULT_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
var QWEN_CN_WEB_DEFAULT_CONTEXT_WINDOW = 128e3;
var QWEN_CN_WEB_DEFAULT_MAX_TOKENS = 4096;
async function discoverDeepseekWebModels(_params) {
  return [
    {
      id: "deepseek-chat",
      name: "DeepSeek V3",
      reasoning: false,
      input: ["text"],
      cost: DEEPSEEK_WEB_DEFAULT_COST,
      contextWindow: DEEPSEEK_WEB_DEFAULT_CONTEXT_WINDOW,
      maxTokens: DEEPSEEK_WEB_DEFAULT_MAX_TOKENS
    }
  ];
}
async function buildDeepseekWebProvider(params) {
  const models = await discoverDeepseekWebModels(params);
  return {
    baseUrl: DEEPSEEK_WEB_BASE_URL,
    api: "openai-completions",
    models
  };
}
async function discoverDoubaoWebModels(params) {
  if (params?.apiKey) {
    try {
      const auth = JSON.parse(params.apiKey);
      const { DoubaoWebClient: DoubaoWebClient2 } = await Promise.resolve().then(() => (init_doubao_web_client(), doubao_web_client_exports));
      const client = new DoubaoWebClient2(auth);
      return await client.discoverModels();
    } catch (e) {
      console.warn("[DoubaoWeb] Dynamic discovery failed, falling back to built-in list:", e);
    }
  }
  return [];
}
async function buildDoubaoWebProvider(params) {
  const models = await discoverDoubaoWebModels(params);
  return {
    baseUrl: DOUBAO_WEB_BASE_URL,
    api: "openai-completions",
    models
  };
}
async function discoverClaudeWebModels(params) {
  if (params?.apiKey) {
    try {
      const auth = JSON.parse(params.apiKey);
      const { ClaudeWebClientBrowser: ClaudeWebClientBrowser2 } = await Promise.resolve().then(() => (init_claude_web_client_browser(), claude_web_client_browser_exports));
      const client = new ClaudeWebClientBrowser2(auth);
      const models = await client.discoverModels();
      await client.close();
      return models;
    } catch (e) {
      console.warn("[ClaudeWeb] Dynamic discovery failed, falling back to built-in list:", e);
    }
  }
  return [
    {
      id: "claude-sonnet-4-6",
      name: "Claude Sonnet 4.6 (Web)",
      reasoning: false,
      input: ["text", "image"],
      cost: CLAUDE_WEB_DEFAULT_COST,
      contextWindow: CLAUDE_WEB_DEFAULT_CONTEXT_WINDOW,
      maxTokens: CLAUDE_WEB_DEFAULT_MAX_TOKENS
    },
    {
      id: "claude-opus-4-6",
      name: "Claude Opus 4.6 (Web)",
      reasoning: false,
      input: ["text", "image"],
      cost: CLAUDE_WEB_DEFAULT_COST,
      contextWindow: CLAUDE_WEB_DEFAULT_CONTEXT_WINDOW,
      maxTokens: 16384
    },
    {
      id: "claude-haiku-4-6",
      name: "Claude Haiku 4.6 (Web)",
      reasoning: false,
      input: ["text", "image"],
      cost: CLAUDE_WEB_DEFAULT_COST,
      contextWindow: CLAUDE_WEB_DEFAULT_CONTEXT_WINDOW,
      maxTokens: CLAUDE_WEB_DEFAULT_MAX_TOKENS
    }
  ];
}
async function buildClaudeWebProvider(params) {
  const models = await discoverClaudeWebModels(params);
  return {
    baseUrl: CLAUDE_WEB_BASE_URL,
    api: "openai-completions",
    models
  };
}
async function buildChatGPTWebProvider(_params) {
  return {
    baseUrl: CHATGPT_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "gpt-4",
        name: "GPT-4 (Web)",
        reasoning: false,
        input: ["text", "image"],
        cost: CHATGPT_WEB_DEFAULT_COST,
        contextWindow: CHATGPT_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: CHATGPT_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo (Web)",
        reasoning: false,
        input: ["text", "image"],
        cost: CHATGPT_WEB_DEFAULT_COST,
        contextWindow: CHATGPT_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: CHATGPT_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo (Web)",
        reasoning: false,
        input: ["text"],
        cost: CHATGPT_WEB_DEFAULT_COST,
        contextWindow: 16e3,
        maxTokens: 4096
      }
    ]
  };
}
async function buildQwenWebProvider(_params) {
  return {
    baseUrl: QWEN_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "qwen3.6-plus",
        name: "Qwen 3.6 Plus",
        reasoning: false,
        input: ["text"],
        cost: QWEN_WEB_DEFAULT_COST,
        contextWindow: QWEN_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: QWEN_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "qwen3.5-plus",
        name: "Qwen 3.5 Plus",
        reasoning: false,
        input: ["text"],
        cost: QWEN_WEB_DEFAULT_COST,
        contextWindow: QWEN_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: QWEN_WEB_DEFAULT_MAX_TOKENS
      }
    ]
  };
}
async function buildQwenCNWebProvider(_params) {
  return {
    baseUrl: QWEN_CN_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "Qwen3.5-Plus",
        name: "Qwen 3.5 Plus (\u56FD\u5185\u7248)",
        reasoning: false,
        input: ["text"],
        cost: QWEN_CN_WEB_DEFAULT_COST,
        contextWindow: QWEN_CN_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: QWEN_CN_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "Qwen3.5-Turbo",
        name: "Qwen 3.5 Turbo (\u56FD\u5185\u7248)",
        reasoning: false,
        input: ["text"],
        cost: QWEN_CN_WEB_DEFAULT_COST,
        contextWindow: QWEN_CN_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: QWEN_CN_WEB_DEFAULT_MAX_TOKENS
      }
    ]
  };
}
async function buildKimiWebProvider(_params) {
  return {
    baseUrl: KIMI_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "moonshot-v1-128k",
        name: "Kimi (128K)",
        reasoning: false,
        input: ["text"],
        cost: KIMI_WEB_DEFAULT_COST,
        contextWindow: 128e3,
        maxTokens: 4096
      }
    ]
  };
}
async function buildGeminiWebProvider(_params) {
  return {
    baseUrl: GEMINI_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "gemini-pro",
        name: "Gemini Pro (Web)",
        reasoning: false,
        input: ["text", "image"],
        cost: GEMINI_WEB_DEFAULT_COST,
        contextWindow: GEMINI_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: GEMINI_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "gemini-ultra",
        name: "Gemini Ultra (Web)",
        reasoning: false,
        input: ["text", "image"],
        cost: GEMINI_WEB_DEFAULT_COST,
        contextWindow: GEMINI_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: GEMINI_WEB_DEFAULT_MAX_TOKENS
      }
    ]
  };
}
async function buildGrokWebProvider(_params) {
  return {
    baseUrl: GROK_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "grok-1",
        name: "Grok 1 (Web)",
        reasoning: false,
        input: ["text"],
        cost: GROK_WEB_DEFAULT_COST,
        contextWindow: GROK_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: GROK_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "grok-2",
        name: "Grok 2 (Web)",
        reasoning: false,
        input: ["text"],
        cost: GROK_WEB_DEFAULT_COST,
        contextWindow: GROK_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: GROK_WEB_DEFAULT_MAX_TOKENS
      }
    ]
  };
}
async function buildZWebProvider(_params) {
  return {
    baseUrl: Z_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "glm-4-plus",
        name: "glm-4 Plus (Web)",
        reasoning: false,
        input: ["text"],
        cost: Z_WEB_DEFAULT_COST,
        contextWindow: Z_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: Z_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "glm-4-think",
        name: "glm-4 Think (Web)",
        reasoning: true,
        input: ["text"],
        cost: Z_WEB_DEFAULT_COST,
        contextWindow: Z_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: Z_WEB_DEFAULT_MAX_TOKENS
      }
    ]
  };
}
async function buildGlmIntlWebProvider(_params) {
  return {
    baseUrl: GLM_INTL_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "glm-4-plus",
        name: "GLM-4 Plus (International)",
        reasoning: false,
        input: ["text"],
        cost: GLM_INTL_WEB_DEFAULT_COST,
        contextWindow: GLM_INTL_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: GLM_INTL_WEB_DEFAULT_MAX_TOKENS
      },
      {
        id: "glm-4-think",
        name: "GLM-4 Think (International)",
        reasoning: true,
        input: ["text"],
        cost: GLM_INTL_WEB_DEFAULT_COST,
        contextWindow: GLM_INTL_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: GLM_INTL_WEB_DEFAULT_MAX_TOKENS
      }
    ]
  };
}
async function buildPerplexityWebProvider(_params) {
  return {
    baseUrl: PERPLEXITY_WEB_BASE_URL,
    api: "openai-completions",
    models: [
      {
        id: "perplexity-web",
        name: "Perplexity (Sonar)",
        reasoning: false,
        input: ["text"],
        cost: PERPLEXITY_WEB_DEFAULT_COST,
        contextWindow: PERPLEXITY_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: 4096
      },
      {
        id: "perplexity-pro",
        name: "Perplexity Pro",
        reasoning: false,
        input: ["text"],
        cost: PERPLEXITY_WEB_DEFAULT_COST,
        contextWindow: PERPLEXITY_WEB_DEFAULT_CONTEXT_WINDOW,
        maxTokens: 8192
      }
    ]
  };
}

// src/zero-token/providers/chatgpt-web-auth.ts
init_browser_cdp();
import { chromium as chromium2 } from "playwright-core";

// src/zero-token/providers/browser-chrome.ts
init_config_paths();
init_browser_cdp();
import { execSync, spawn } from "node:child_process";
import fs5 from "node:fs";
import net from "node:net";
import os3 from "node:os";
import path4 from "node:path";
import WebSocket from "ws";

// src/zero-token/providers/chrome.executables.ts
import { execFileSync } from "node:child_process";
import fs3 from "node:fs";
import os2 from "node:os";
import path2 from "node:path";
var CHROMIUM_BUNDLE_IDS = /* @__PURE__ */ new Set([
  "com.google.Chrome",
  "com.google.Chrome.beta",
  "com.google.Chrome.canary",
  "com.google.Chrome.dev",
  "com.brave.Browser",
  "com.brave.Browser.beta",
  "com.brave.Browser.nightly",
  "com.microsoft.Edge",
  "com.microsoft.EdgeBeta",
  "com.microsoft.EdgeDev",
  "com.microsoft.EdgeCanary",
  "org.chromium.Chromium",
  "com.vivaldi.Vivaldi",
  "com.operasoftware.Opera",
  "com.operasoftware.OperaGX",
  "com.yandex.desktop.yandex-browser",
  "company.thebrowser.Browser"
  // Arc
]);
var CHROMIUM_DESKTOP_IDS = /* @__PURE__ */ new Set([
  "google-chrome.desktop",
  "google-chrome-beta.desktop",
  "google-chrome-unstable.desktop",
  "brave-browser.desktop",
  "microsoft-edge.desktop",
  "microsoft-edge-beta.desktop",
  "microsoft-edge-dev.desktop",
  "microsoft-edge-canary.desktop",
  "chromium.desktop",
  "chromium-browser.desktop",
  "vivaldi.desktop",
  "vivaldi-stable.desktop",
  "opera.desktop",
  "opera-gx.desktop",
  "yandex-browser.desktop",
  "org.chromium.Chromium.desktop"
]);
var CHROMIUM_EXE_NAMES = /* @__PURE__ */ new Set([
  "chrome.exe",
  "msedge.exe",
  "brave.exe",
  "brave-browser.exe",
  "chromium.exe",
  "vivaldi.exe",
  "opera.exe",
  "launcher.exe",
  "yandex.exe",
  "yandexbrowser.exe",
  // mac/linux names
  "google chrome",
  "google chrome canary",
  "brave browser",
  "microsoft edge",
  "chromium",
  "chrome",
  "brave",
  "msedge",
  "brave-browser",
  "google-chrome",
  "google-chrome-stable",
  "google-chrome-beta",
  "google-chrome-unstable",
  "microsoft-edge",
  "microsoft-edge-beta",
  "microsoft-edge-dev",
  "microsoft-edge-canary",
  "chromium-browser",
  "vivaldi",
  "vivaldi-stable",
  "opera",
  "opera-stable",
  "opera-gx",
  "yandex-browser"
]);
function exists(filePath) {
  try {
    return fs3.existsSync(filePath);
  } catch {
    return false;
  }
}
function execText(command, args, timeoutMs = 1200, maxBuffer = 1024 * 1024) {
  try {
    const output = execFileSync(command, args, {
      timeout: timeoutMs,
      encoding: "utf8",
      maxBuffer
    });
    return String(output ?? "").trim() || null;
  } catch {
    return null;
  }
}
function inferKindFromIdentifier(identifier) {
  const id = identifier.toLowerCase();
  if (id.includes("brave")) {
    return "brave";
  }
  if (id.includes("edge")) {
    return "edge";
  }
  if (id.includes("chromium")) {
    return "chromium";
  }
  if (id.includes("canary")) {
    return "canary";
  }
  if (id.includes("opera") || id.includes("vivaldi") || id.includes("yandex") || id.includes("thebrowser")) {
    return "chromium";
  }
  return "chrome";
}
function inferKindFromExecutableName(name) {
  const lower = name.toLowerCase();
  if (lower.includes("brave")) {
    return "brave";
  }
  if (lower.includes("edge") || lower.includes("msedge")) {
    return "edge";
  }
  if (lower.includes("chromium")) {
    return "chromium";
  }
  if (lower.includes("canary") || lower.includes("sxs")) {
    return "canary";
  }
  if (lower.includes("opera") || lower.includes("vivaldi") || lower.includes("yandex")) {
    return "chromium";
  }
  return "chrome";
}
function detectDefaultChromiumExecutable(platform) {
  if (platform === "darwin") {
    return detectDefaultChromiumExecutableMac();
  }
  if (platform === "linux") {
    return detectDefaultChromiumExecutableLinux();
  }
  if (platform === "win32") {
    return detectDefaultChromiumExecutableWindows();
  }
  return null;
}
function detectDefaultChromiumExecutableMac() {
  const bundleId = detectDefaultBrowserBundleIdMac();
  if (!bundleId || !CHROMIUM_BUNDLE_IDS.has(bundleId)) {
    return null;
  }
  const appPathRaw = execText("/usr/bin/osascript", [
    "-e",
    `POSIX path of (path to application id "${bundleId}")`
  ]);
  if (!appPathRaw) {
    return null;
  }
  const appPath = appPathRaw.trim().replace(/\/$/, "");
  const exeName = execText("/usr/bin/defaults", [
    "read",
    path2.join(appPath, "Contents", "Info"),
    "CFBundleExecutable"
  ]);
  if (!exeName) {
    return null;
  }
  const exePath = path2.join(appPath, "Contents", "MacOS", exeName.trim());
  if (!exists(exePath)) {
    return null;
  }
  return { kind: inferKindFromIdentifier(bundleId), path: exePath };
}
function detectDefaultBrowserBundleIdMac() {
  const plistPath = path2.join(
    os2.homedir(),
    "Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist"
  );
  if (!exists(plistPath)) {
    return null;
  }
  const handlersRaw = execText(
    "/usr/bin/plutil",
    ["-extract", "LSHandlers", "json", "-o", "-", "--", plistPath],
    2e3,
    5 * 1024 * 1024
  );
  if (!handlersRaw) {
    return null;
  }
  let handlers;
  try {
    handlers = JSON.parse(handlersRaw);
  } catch {
    return null;
  }
  if (!Array.isArray(handlers)) {
    return null;
  }
  const resolveScheme = (scheme) => {
    let candidate = null;
    for (const entry of handlers) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const record = entry;
      if (record.LSHandlerURLScheme !== scheme) {
        continue;
      }
      const role = typeof record.LSHandlerRoleAll === "string" && record.LSHandlerRoleAll || typeof record.LSHandlerRoleViewer === "string" && record.LSHandlerRoleViewer || null;
      if (role) {
        candidate = role;
      }
    }
    return candidate;
  };
  return resolveScheme("http") ?? resolveScheme("https");
}
function detectDefaultChromiumExecutableLinux() {
  const desktopId = execText("xdg-settings", ["get", "default-web-browser"]) || execText("xdg-mime", ["query", "default", "x-scheme-handler/http"]);
  if (!desktopId) {
    return null;
  }
  const trimmed = desktopId.trim();
  if (!CHROMIUM_DESKTOP_IDS.has(trimmed)) {
    return null;
  }
  const desktopPath = findDesktopFilePath(trimmed);
  if (!desktopPath) {
    return null;
  }
  const execLine = readDesktopExecLine(desktopPath);
  if (!execLine) {
    return null;
  }
  const command = extractExecutableFromExecLine(execLine);
  if (!command) {
    return null;
  }
  const resolved = resolveLinuxExecutablePath(command);
  if (!resolved) {
    return null;
  }
  const exeName = path2.posix.basename(resolved).toLowerCase();
  if (!CHROMIUM_EXE_NAMES.has(exeName)) {
    return null;
  }
  return { kind: inferKindFromExecutableName(exeName), path: resolved };
}
function detectDefaultChromiumExecutableWindows() {
  const progId = readWindowsProgId();
  const command = (progId ? readWindowsCommandForProgId(progId) : null) || readWindowsCommandForProgId("http");
  if (!command) {
    return null;
  }
  const expanded = expandWindowsEnvVars(command);
  const exePath = extractWindowsExecutablePath(expanded);
  if (!exePath) {
    return null;
  }
  if (!exists(exePath)) {
    return null;
  }
  const exeName = path2.win32.basename(exePath).toLowerCase();
  if (!CHROMIUM_EXE_NAMES.has(exeName)) {
    return null;
  }
  return { kind: inferKindFromExecutableName(exeName), path: exePath };
}
function findDesktopFilePath(desktopId) {
  const candidates = [
    path2.join(os2.homedir(), ".local", "share", "applications", desktopId),
    path2.join("/usr/local/share/applications", desktopId),
    path2.join("/usr/share/applications", desktopId),
    path2.join("/var/lib/snapd/desktop/applications", desktopId)
  ];
  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }
  return null;
}
function readDesktopExecLine(desktopPath) {
  try {
    const raw = fs3.readFileSync(desktopPath, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("Exec=")) {
        return line.slice("Exec=".length).trim();
      }
    }
  } catch {
  }
  return null;
}
function extractExecutableFromExecLine(execLine) {
  const tokens = splitExecLine(execLine);
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    if (token === "env") {
      continue;
    }
    if (token.includes("=") && !token.startsWith("/") && !token.includes("\\")) {
      continue;
    }
    return token.replace(/^["']|["']$/g, "");
  }
  return null;
}
function splitExecLine(line) {
  const tokens = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if ((ch === '"' || ch === "'") && (!inQuotes || ch === quoteChar)) {
      if (inQuotes) {
        inQuotes = false;
        quoteChar = "";
      } else {
        inQuotes = true;
        quoteChar = ch;
      }
      continue;
    }
    if (!inQuotes && /\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
}
function resolveLinuxExecutablePath(command) {
  const cleaned = command.trim().replace(/%[a-zA-Z]/g, "");
  if (!cleaned) {
    return null;
  }
  if (cleaned.startsWith("/")) {
    return cleaned;
  }
  const resolved = execText("which", [cleaned], 800);
  return resolved ? resolved.trim() : null;
}
function readWindowsProgId() {
  const output = execText("reg", [
    "query",
    "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice",
    "/v",
    "ProgId"
  ]);
  if (!output) {
    return null;
  }
  const match = output.match(/ProgId\s+REG_\w+\s+(.+)$/im);
  return match?.[1]?.trim() || null;
}
function readWindowsCommandForProgId(progId) {
  const key = progId === "http" ? "HKCR\\http\\shell\\open\\command" : `HKCR\\${progId}\\shell\\open\\command`;
  const output = execText("reg", ["query", key, "/ve"]);
  if (!output) {
    return null;
  }
  const match = output.match(/REG_\w+\s+(.+)$/im);
  return match?.[1]?.trim() || null;
}
function expandWindowsEnvVars(value) {
  return value.replace(/%([^%]+)%/g, (_match, name) => {
    const key = String(name ?? "").trim();
    return key ? process.env[key] ?? `%${key}%` : _match;
  });
}
function extractWindowsExecutablePath(command) {
  const quoted = command.match(/"([^"]+\\.exe)"/i);
  if (quoted?.[1]) {
    return quoted[1];
  }
  const unquoted = command.match(/([^\\s]+\\.exe)/i);
  if (unquoted?.[1]) {
    return unquoted[1];
  }
  return null;
}
function findFirstExecutable(candidates) {
  for (const candidate of candidates) {
    if (exists(candidate.path)) {
      return candidate;
    }
  }
  return null;
}
function findChromeExecutableMac() {
  const candidates = [
    {
      kind: "chrome",
      path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    },
    {
      kind: "chrome",
      path: path2.join(os2.homedir(), "Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    },
    {
      kind: "brave",
      path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    },
    {
      kind: "brave",
      path: path2.join(os2.homedir(), "Applications/Brave Browser.app/Contents/MacOS/Brave Browser")
    },
    {
      kind: "edge",
      path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    },
    {
      kind: "edge",
      path: path2.join(
        os2.homedir(),
        "Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
      )
    },
    {
      kind: "chromium",
      path: "/Applications/Chromium.app/Contents/MacOS/Chromium"
    },
    {
      kind: "chromium",
      path: path2.join(os2.homedir(), "Applications/Chromium.app/Contents/MacOS/Chromium")
    },
    {
      kind: "canary",
      path: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
    },
    {
      kind: "canary",
      path: path2.join(
        os2.homedir(),
        "Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
      )
    }
  ];
  return findFirstExecutable(candidates);
}
function findChromeExecutableLinux() {
  const candidates = [
    { kind: "chrome", path: "/usr/bin/google-chrome" },
    { kind: "chrome", path: "/usr/bin/google-chrome-stable" },
    { kind: "chrome", path: "/usr/bin/chrome" },
    { kind: "brave", path: "/usr/bin/brave-browser" },
    { kind: "brave", path: "/usr/bin/brave-browser-stable" },
    { kind: "brave", path: "/usr/bin/brave" },
    { kind: "brave", path: "/snap/bin/brave" },
    { kind: "edge", path: "/usr/bin/microsoft-edge" },
    { kind: "edge", path: "/usr/bin/microsoft-edge-stable" },
    { kind: "chromium", path: "/usr/bin/chromium" },
    { kind: "chromium", path: "/usr/bin/chromium-browser" },
    { kind: "chromium", path: "/snap/bin/chromium" }
  ];
  return findFirstExecutable(candidates);
}
function findChromeExecutableWindows() {
  const localAppData = process.env.LOCALAPPDATA ?? "";
  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const joinWin = path2.win32.join;
  const candidates = [];
  if (localAppData) {
    candidates.push({
      kind: "chrome",
      path: joinWin(localAppData, "Google", "Chrome", "Application", "chrome.exe")
    });
    candidates.push({
      kind: "brave",
      path: joinWin(localAppData, "BraveSoftware", "Brave-Browser", "Application", "brave.exe")
    });
    candidates.push({
      kind: "edge",
      path: joinWin(localAppData, "Microsoft", "Edge", "Application", "msedge.exe")
    });
    candidates.push({
      kind: "chromium",
      path: joinWin(localAppData, "Chromium", "Application", "chrome.exe")
    });
    candidates.push({
      kind: "canary",
      path: joinWin(localAppData, "Google", "Chrome SxS", "Application", "chrome.exe")
    });
  }
  candidates.push({
    kind: "chrome",
    path: joinWin(programFiles, "Google", "Chrome", "Application", "chrome.exe")
  });
  candidates.push({
    kind: "chrome",
    path: joinWin(programFilesX86, "Google", "Chrome", "Application", "chrome.exe")
  });
  candidates.push({
    kind: "brave",
    path: joinWin(programFiles, "BraveSoftware", "Brave-Browser", "Application", "brave.exe")
  });
  candidates.push({
    kind: "brave",
    path: joinWin(programFilesX86, "BraveSoftware", "Brave-Browser", "Application", "brave.exe")
  });
  candidates.push({
    kind: "edge",
    path: joinWin(programFiles, "Microsoft", "Edge", "Application", "msedge.exe")
  });
  candidates.push({
    kind: "edge",
    path: joinWin(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe")
  });
  return findFirstExecutable(candidates);
}
function resolveBrowserExecutableForPlatform(resolved, platform) {
  if (resolved.executablePath) {
    if (!exists(resolved.executablePath)) {
      throw new Error(`browser.executablePath not found: ${resolved.executablePath}`);
    }
    return { kind: "custom", path: resolved.executablePath };
  }
  const detected = detectDefaultChromiumExecutable(platform);
  if (detected) {
    return detected;
  }
  if (platform === "darwin") {
    return findChromeExecutableMac();
  }
  if (platform === "linux") {
    return findChromeExecutableLinux();
  }
  if (platform === "win32") {
    return findChromeExecutableWindows();
  }
  return null;
}

// src/zero-token/providers/chrome.profile-decoration.ts
init_browser_constants();
import fs4 from "node:fs";
import path3 from "node:path";
function decoratedMarkerPath(userDataDir) {
  return path3.join(userDataDir, ".openclaw-profile-decorated");
}
function safeReadJson(filePath) {
  try {
    if (!fs4.existsSync(filePath)) {
      return null;
    }
    const raw = fs4.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
function safeWriteJson(filePath, data) {
  fs4.mkdirSync(path3.dirname(filePath), { recursive: true });
  fs4.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
function setDeep(obj, keys, value) {
  let node = obj;
  for (const key of keys.slice(0, -1)) {
    const next = node[key];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      node[key] = {};
    }
    node = node[key];
  }
  node[keys[keys.length - 1] ?? ""] = value;
}
function parseHexRgbToSignedArgbInt(hex) {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }
  const rgb = Number.parseInt(cleaned, 16);
  const argbUnsigned = 255 << 24 | rgb;
  return argbUnsigned > 2147483647 ? argbUnsigned - 4294967296 : argbUnsigned;
}
function isProfileDecorated(userDataDir, desiredName, desiredColorHex) {
  const desiredColorInt = parseHexRgbToSignedArgbInt(desiredColorHex);
  const localStatePath = path3.join(userDataDir, "Local State");
  const preferencesPath = path3.join(userDataDir, "Default", "Preferences");
  const localState = safeReadJson(localStatePath);
  const profile = localState?.profile;
  const infoCache = typeof profile === "object" && profile !== null && !Array.isArray(profile) ? profile.info_cache : null;
  const info = typeof infoCache === "object" && infoCache !== null && !Array.isArray(infoCache) && typeof infoCache.Default === "object" && infoCache.Default !== null && !Array.isArray(infoCache.Default) ? infoCache.Default : null;
  const prefs = safeReadJson(preferencesPath);
  const browserTheme = (() => {
    const browser = prefs?.browser;
    const theme = typeof browser === "object" && browser !== null && !Array.isArray(browser) ? browser.theme : null;
    return typeof theme === "object" && theme !== null && !Array.isArray(theme) ? theme : null;
  })();
  const autogeneratedTheme = (() => {
    const autogenerated = prefs?.autogenerated;
    const theme = typeof autogenerated === "object" && autogenerated !== null && !Array.isArray(autogenerated) ? autogenerated.theme : null;
    return typeof theme === "object" && theme !== null && !Array.isArray(theme) ? theme : null;
  })();
  const nameOk = typeof info?.name === "string" ? info.name === desiredName : true;
  if (desiredColorInt == null) {
    return nameOk;
  }
  const localSeedOk = typeof info?.profile_color_seed === "number" ? info.profile_color_seed === desiredColorInt : false;
  const prefOk = typeof browserTheme?.user_color2 === "number" && browserTheme.user_color2 === desiredColorInt || typeof autogeneratedTheme?.color === "number" && autogeneratedTheme.color === desiredColorInt;
  return nameOk && localSeedOk && prefOk;
}
function decorateOpenClawProfile(userDataDir, opts) {
  const desiredName = opts?.name ?? DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME;
  const desiredColor = (opts?.color ?? DEFAULT_OPENCLAW_BROWSER_COLOR).toUpperCase();
  const desiredColorInt = parseHexRgbToSignedArgbInt(desiredColor);
  const localStatePath = path3.join(userDataDir, "Local State");
  const preferencesPath = path3.join(userDataDir, "Default", "Preferences");
  const localState = safeReadJson(localStatePath) ?? {};
  setDeep(localState, ["profile", "info_cache", "Default", "name"], desiredName);
  setDeep(localState, ["profile", "info_cache", "Default", "shortcut_name"], desiredName);
  setDeep(localState, ["profile", "info_cache", "Default", "user_name"], desiredName);
  setDeep(localState, ["profile", "info_cache", "Default", "profile_color"], desiredColor);
  setDeep(localState, ["profile", "info_cache", "Default", "user_color"], desiredColor);
  if (desiredColorInt != null) {
    setDeep(
      localState,
      ["profile", "info_cache", "Default", "profile_color_seed"],
      desiredColorInt
    );
    setDeep(
      localState,
      ["profile", "info_cache", "Default", "profile_highlight_color"],
      desiredColorInt
    );
    setDeep(
      localState,
      ["profile", "info_cache", "Default", "default_avatar_fill_color"],
      desiredColorInt
    );
    setDeep(
      localState,
      ["profile", "info_cache", "Default", "default_avatar_stroke_color"],
      desiredColorInt
    );
  }
  safeWriteJson(localStatePath, localState);
  const prefs = safeReadJson(preferencesPath) ?? {};
  setDeep(prefs, ["profile", "name"], desiredName);
  setDeep(prefs, ["profile", "profile_color"], desiredColor);
  setDeep(prefs, ["profile", "user_color"], desiredColor);
  if (desiredColorInt != null) {
    setDeep(prefs, ["autogenerated", "theme", "color"], desiredColorInt);
    setDeep(prefs, ["browser", "theme", "user_color2"], desiredColorInt);
  }
  safeWriteJson(preferencesPath, prefs);
  try {
    fs4.writeFileSync(decoratedMarkerPath(userDataDir), `${Date.now()}
`, "utf-8");
  } catch {
  }
}
function ensureProfileCleanExit(userDataDir) {
  const preferencesPath = path3.join(userDataDir, "Default", "Preferences");
  const prefs = safeReadJson(preferencesPath) ?? {};
  setDeep(prefs, ["exit_type"], "Normal");
  setDeep(prefs, ["exited_cleanly"], true);
  safeWriteJson(preferencesPath, prefs);
}

// src/zero-token/providers/browser-chrome.ts
init_browser_constants();
function exists2(filePath) {
  try {
    return fs5.existsSync(filePath);
  } catch {
    return false;
  }
}
async function ensurePortAvailable(port, host = "127.0.0.1") {
  await new Promise((resolve, reject) => {
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
function resolveBrowserExecutable(resolved) {
  return resolveBrowserExecutableForPlatform(resolved, process.platform);
}
function resolveOpenClawUserDataDir(profileName = DEFAULT_OPENCLAW_BROWSER_PROFILE_NAME) {
  return path4.join(resolveStateDir(), "browser", profileName, "user-data");
}
function cdpUrlForPort(cdpPort) {
  return `http://127.0.0.1:${cdpPort}`;
}
async function fetchChromeVersion(cdpUrl, timeoutMs = 500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const versionUrl = appendCdpPath(cdpUrl, "/json/version");
    const response = await fetch(versionUrl, {
      signal: ctrl.signal,
      headers: getHeadersWithAuth(versionUrl)
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
async function isChromeReachable(cdpUrl, timeoutMs = 500) {
  const version = await fetchChromeVersion(cdpUrl, timeoutMs);
  return Boolean(version);
}
async function getChromeWebSocketUrl(cdpUrl, timeoutMs = 500) {
  const version = await fetchChromeVersion(cdpUrl, timeoutMs);
  const wsUrl = String(version?.webSocketDebuggerUrl ?? "").trim();
  if (!wsUrl) {
    return null;
  }
  return normalizeCdpWsUrl(wsUrl, cdpUrl);
}
async function canOpenWebSocket(wsUrl, timeoutMs = 800) {
  return await new Promise((resolve) => {
    const headers = getHeadersWithAuth(wsUrl);
    const ws = new WebSocket(wsUrl, {
      handshakeTimeout: timeoutMs,
      ...Object.keys(headers).length ? { headers } : {}
    });
    const timer = setTimeout(() => {
      try {
        ws.terminate();
      } catch {
      }
      resolve(false);
    }, Math.max(50, timeoutMs + 25));
    ws.once("open", () => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
      }
      resolve(true);
    });
    ws.once("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}
async function launchOpenClawChrome(resolved, profile) {
  if (!profile.cdpIsLoopback) {
    throw new Error(`Profile "${profile.name}" is remote; cannot launch local Chrome.`);
  }
  await ensurePortAvailable(profile.cdpPort);
  const exe = resolveBrowserExecutable(resolved);
  if (!exe) {
    throw new Error(
      "No supported browser found (Chrome/Brave/Edge/Chromium on macOS, Linux, or Windows)."
    );
  }
  const userDataDir = resolveOpenClawUserDataDir(profile.name);
  fs5.mkdirSync(userDataDir, { recursive: true });
  const needsDecorate = !isProfileDecorated(
    userDataDir,
    profile.name,
    (profile.color ?? DEFAULT_OPENCLAW_BROWSER_COLOR).toUpperCase()
  );
  const spawnOnce = () => {
    const args = [
      `--remote-debugging-port=${profile.cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-sync",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-features=Translate,MediaRouter",
      "--disable-session-crashed-bubble",
      "--hide-crash-restore-bubble",
      "--password-store=basic"
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
        HOME: os3.homedir()
      }
    });
  };
  const startedAt = Date.now();
  const localStatePath = path4.join(userDataDir, "Local State");
  const preferencesPath = path4.join(userDataDir, "Default", "Preferences");
  const needsBootstrap = !exists2(localStatePath) || !exists2(preferencesPath);
  if (needsBootstrap) {
    const bootstrap = spawnOnce();
    const deadline = Date.now() + 1e4;
    while (Date.now() < deadline) {
      if (exists2(localStatePath) && exists2(preferencesPath)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    try {
      bootstrap.kill("SIGTERM");
    } catch {
    }
    const exitDeadline = Date.now() + 5e3;
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
        color: profile.color
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
  const proc = spawnOnce();
  const readyDeadline = Date.now() + 15e3;
  while (Date.now() < readyDeadline) {
    if (await isChromeReachable(profile.cdpUrl, 500)) {
      const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 500);
      if (!wsUrl || await canOpenWebSocket(wsUrl, 800)) {
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!await isChromeReachable(profile.cdpUrl, 500)) {
    try {
      proc.kill("SIGKILL");
    } catch {
    }
    throw new Error(
      `Failed to start Chrome CDP on port ${profile.cdpPort} for profile "${profile.name}".`
    );
  }
  return {
    pid: proc.pid ?? -1,
    exe,
    userDataDir,
    cdpPort: profile.cdpPort,
    startedAt,
    proc
  };
}
async function stopOpenClawChrome(running, timeoutMs = 2500) {
  const proc = running.proc;
  if (proc.killed) {
    return;
  }
  try {
    proc.kill("SIGTERM");
  } catch {
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!proc.exitCode && proc.killed) {
      break;
    }
    if (!await isChromeReachable(cdpUrlForPort(running.cdpPort), 200)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  try {
    proc.kill("SIGKILL");
  } catch {
  }
}

// src/zero-token/providers/chatgpt-web-auth.ts
init_browser_runtime();
async function loginChatGPTWeb(params) {
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    params.onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    params.onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    params.onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    params.onProgress("Connecting to browser...");
    const browser = await chromium2.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://chatgpt.com/");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    params.onProgress("Please login to ChatGPT in the opened browser window...");
    return await new Promise((resolve, reject) => {
      let capturedAccessToken;
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error("Login timed out (5 minutes)."));
        }
      }, 3e5);
      const tryResolve = async () => {
        if (resolved) {
          return;
        }
        try {
          const cookies = await context.cookies(["https://chatgpt.com", "https://chat.openai.com"]);
          if (cookies.length === 0) {
            console.log(`[ChatGPT] No cookies found in context yet.`);
            return;
          }
          const cookieNames = cookies.map((c) => c.name);
          console.log(`[ChatGPT] Found cookies: ${cookieNames.join(", ")}`);
          const sessionCookie = cookies.find((c) => c.name === "__Secure-next-auth.session-token");
          let splitToken = "";
          if (!sessionCookie) {
            const token0 = cookies.find((c) => c.name === "__Secure-next-auth.session-token.0");
            const token1 = cookies.find((c) => c.name === "__Secure-next-auth.session-token.1");
            if (token0 && token1) {
              splitToken = token0.value + token1.value;
              console.log(`[ChatGPT] Found split session token (.0 + .1)`);
            }
          }
          if (sessionCookie || capturedAccessToken || splitToken) {
            const finalToken = capturedAccessToken || sessionCookie?.value || splitToken || "";
            if (finalToken) {
              resolved = true;
              clearTimeout(timeout);
              console.log(`[ChatGPT] Access token captured!`);
              const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
              resolve({
                accessToken: finalToken,
                cookie: cookieString,
                userAgent
              });
            } else {
              console.log(`[ChatGPT] Waiting for valid session token...`);
            }
          } else {
            console.log(`[ChatGPT] Waiting for session token cookie...`);
          }
        } catch (e) {
          console.error(`[ChatGPT] Failed to fetch cookies: ${String(e)}`);
        }
      };
      page.on("request", async (request) => {
        const url = request.url();
        if (url.includes("chatgpt.com") || url.includes("openai.com")) {
          const headers = request.headers();
          const cookie = headers["cookie"];
          if (cookie) {
            const tokenMatch = cookie.match(/__Secure-next-auth\.session-token=([^;]+)/);
            if (tokenMatch) {
              if (!capturedAccessToken) {
                console.log(`[ChatGPT] Captured session token from request.`);
                capturedAccessToken = tokenMatch[1];
              }
              await tryResolve();
            }
          }
        }
      });
      page.on("response", async (response) => {
        const url = response.url();
        if ((url.includes("chatgpt.com") || url.includes("openai.com")) && response.ok()) {
          await tryResolve();
        }
      });
      page.on("close", () => {
        reject(new Error("Browser window closed before login was captured."));
      });
      const checkInterval = setInterval(async () => {
        await tryResolve();
        if (resolved) {
          clearInterval(checkInterval);
        }
      }, 2e3);
    });
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/claude-web-auth.ts
init_browser_cdp();
import { chromium as chromium3 } from "playwright-core";
init_browser_runtime();
async function loginClaudeWeb(params) {
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    params.onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    params.onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    params.onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    params.onProgress("Connecting to browser...");
    const browser = await chromium3.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://claude.ai/");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    params.onProgress("Please login to Claude in the opened browser window...");
    return await new Promise((resolve, reject) => {
      let capturedSessionKey;
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error("Login timed out (5 minutes)."));
        }
      }, 3e5);
      const tryResolve = async () => {
        if (resolved) {
          return;
        }
        try {
          const cookies = await context.cookies(["https://claude.ai", "https://www.claude.ai"]);
          if (cookies.length === 0) {
            console.log(`[Claude] No cookies found in context yet.`);
            return;
          }
          const cookieNames = cookies.map((c) => c.name);
          console.log(`[Claude] Found cookies: ${cookieNames.join(", ")}`);
          const sessionKeyCookie = cookies.find(
            (c) => c.name === "sessionKey" || c.value.startsWith("sk-ant-sid01-") || c.value.startsWith("sk-ant-sid02-")
          );
          if (sessionKeyCookie || capturedSessionKey) {
            const finalSessionKey = capturedSessionKey || sessionKeyCookie?.value || "";
            if (finalSessionKey.startsWith("sk-ant-sid01-") || finalSessionKey.startsWith("sk-ant-sid02-")) {
              resolved = true;
              clearTimeout(timeout);
              console.log(`[Claude] sessionKey captured!`);
              const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
              resolve({
                sessionKey: finalSessionKey,
                cookie: cookieString,
                userAgent
              });
            } else {
              console.log(
                `[Claude] Waiting for valid sessionKey (sk-ant-sid01-xxx or sk-ant-sid02-xxx format)...`
              );
            }
          } else {
            console.log(`[Claude] Waiting for sessionKey cookie...`);
          }
        } catch (e) {
          console.error(`[Claude] Failed to fetch cookies: ${String(e)}`);
        }
      };
      page.on(
        "request",
        async (request) => {
          const url = request.url();
          if (url.includes("claude.ai")) {
            const headers = request.headers();
            const cookie = headers["cookie"];
            if (cookie) {
              const sessionKeyMatch = cookie.match(/sessionKey=([^;]+)/);
              if (sessionKeyMatch && (sessionKeyMatch[1].startsWith("sk-ant-sid01-") || sessionKeyMatch[1].startsWith("sk-ant-sid02-"))) {
                if (!capturedSessionKey) {
                  console.log(`[Claude] Captured sessionKey from request.`);
                  capturedSessionKey = sessionKeyMatch[1];
                }
                await tryResolve();
              }
            }
          }
        }
      );
      page.on("response", async (response) => {
        const url = response.url();
        if (url.includes("claude.ai") && response.ok()) {
          await tryResolve();
        }
      });
      page.on("close", () => {
        reject(new Error("Browser window closed before login was captured."));
      });
      const checkInterval = setInterval(async () => {
        await tryResolve();
        if (resolved) {
          clearInterval(checkInterval);
        }
      }, 2e3);
    });
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/deepseek-web-auth.ts
init_browser_cdp();
import { chromium as chromium4 } from "playwright-core";
init_browser_runtime();
async function loginDeepseekWeb(params) {
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running = null;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    params.onProgress("Connecting to existing Chrome (attach mode)...");
    running = { cdpPort: profile.cdpPort };
  } else {
    params.onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    params.onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    params.onProgress("Connecting to browser...");
    const browser = await chromium4.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0] || await browser.newContext();
    const existingPages = context.pages();
    let page = existingPages.find(
      (p) => p.url().includes("deepseek.com") || p.url().includes("chat.deepseek.com")
    );
    if (!page) {
      page = await context.newPage();
      params.onProgress("Opening DeepSeek page...");
    } else {
      params.onProgress("Found existing DeepSeek page, switching to it...");
      await page.bringToFront();
    }
    params.onProgress("Checking for existing DeepSeek session...");
    const existingCookies = await context.cookies([
      "https://chat.deepseek.com",
      "https://deepseek.com"
    ]);
    const cookieString = existingCookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const hasDeviceId = cookieString.includes("d_id=");
    const hasSessionId = cookieString.includes("ds_session_id=");
    const hasSessionInfo = cookieString.includes("HWSID=") || cookieString.includes("uuid=");
    let hasValidSession = (hasDeviceId || hasSessionId || hasSessionInfo || existingCookies.length > 3) && cookieString.length > 10;
    let bearer = "";
    let userAgent = await page.evaluate(() => navigator.userAgent);
    if (hasValidSession) {
      params.onProgress("Found existing session, attempting to capture credentials...");
      try {
        const response = await page.request.get("https://chat.deepseek.com/api/v0/users/current");
        if (response.ok()) {
          const data = await response.json();
          bearer = data?.data?.biz_data?.token || "";
          if (bearer) {
            params.onProgress("Successfully captured credentials!");
            return {
              cookie: cookieString,
              bearer,
              userAgent
            };
          }
        }
      } catch (e) {
        console.log(`[DeepSeek] Could not auto-capture token: ${e}`);
      }
      params.onProgress("Session detected but token expired. Redirecting to login page...");
      hasValidSession = false;
    }
    await page.goto("https://chat.deepseek.com");
    userAgent = await page.evaluate(() => navigator.userAgent);
    if (hasValidSession) {
      params.onProgress(
        "Session detected but token expired. Please re-login in the browser window."
      );
    } else {
      params.onProgress(
        "Please login to DeepSeek in the opened browser window. The session token will be captured automatically once you are logged in."
      );
    }
    return await new Promise(
      (resolve, reject) => {
        let capturedBearer;
        let resolved = false;
        let checkInterval;
        const timeout = setTimeout(() => {
          if (!resolved) {
            if (checkInterval) {
              clearInterval(checkInterval);
            }
            reject(new Error("Login timed out (5 minutes)."));
          }
        }, 3e5);
        const tryResolve = async () => {
          if (!capturedBearer || resolved) {
            return;
          }
          try {
            const cookies = await context.cookies([
              "https://chat.deepseek.com",
              "https://deepseek.com"
            ]);
            if (cookies.length === 0) {
              return;
            }
            const cookieString2 = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
            const hasDeviceId2 = cookieString2.includes("d_id=");
            const hasSessionId2 = cookieString2.includes("ds_session_id=");
            const hasSessionInfo2 = cookieString2.includes("HWSID=") || cookieString2.includes("uuid=");
            if (hasDeviceId2 || hasSessionId2 || hasSessionInfo2 || cookies.length > 3) {
              resolved = true;
              clearTimeout(timeout);
              if (checkInterval) {
                clearInterval(checkInterval);
              }
              console.log(
                `[DeepSeek] Credentials captured (d_id: ${hasDeviceId2}, ds_session_id: ${hasSessionId2})`
              );
              resolve({
                cookie: cookieString2,
                bearer: capturedBearer,
                userAgent
              });
            }
          } catch (e) {
            console.error(`[DeepSeek] Failed to fetch cookies: ${String(e)}`);
          }
        };
        page.on("request", async (request) => {
          const url = request.url();
          if (url.includes("/api/v0/")) {
            const headers = request.headers();
            const auth = headers["authorization"];
            if (auth?.startsWith("Bearer ")) {
              if (!capturedBearer) {
                console.log(`[DeepSeek Research] Captured Bearer Token.`);
                capturedBearer = auth.slice(7);
              }
              await tryResolve();
            }
            if (url.includes("/api/v0/chat/completion")) {
              console.log(`[DeepSeek Research] Completion Request Headers Check:`, {
                hasAuth: !!auth
              });
            }
          }
        });
        page.on("response", async (response) => {
          const url = response.url();
          if (url.includes("/api/v0/users/current") && response.ok()) {
            try {
              const body = await response.json();
              const bizData = body?.data;
              const tokenFromResponse = bizData?.biz_data?.token;
              if (typeof tokenFromResponse === "string" && tokenFromResponse.length > 0) {
                if (!capturedBearer) {
                  console.log(`[DeepSeek] Captured token from users/current response`);
                  capturedBearer = tokenFromResponse;
                }
                await tryResolve();
              }
            } catch {
            }
          }
        });
        page.on("close", () => {
          if (checkInterval) {
            clearInterval(checkInterval);
          }
          reject(new Error("Browser window closed before login was captured."));
        });
        checkInterval = setInterval(tryResolve, 2e3);
      }
    );
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/doubao-web-auth.ts
init_browser_cdp();
import os4 from "node:os";
import path5 from "node:path";
import { chromium as chromium5 } from "playwright-core";
init_browser_runtime();
var DEFAULT_CDP_PORT = 9222;
async function loginDoubaoWeb(params) {
  const {
    useExistingChrome = false,
    existingCdpPort = DEFAULT_CDP_PORT,
    useExistingChromeData = false
  } = params;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  const useAttach = browserConfig.attachOnly || useExistingChrome;
  let running;
  let didLaunch = false;
  if (useAttach) {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${existingCdpPort}`;
    params.onProgress(`Connecting to existing Chrome at ${cdpUrl}...`);
    const isReachable = await isChromeReachable(cdpUrl, 1e3);
    if (!isReachable) {
      throw new Error(
        `Cannot connect to Chrome at ${cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: browserConfig.attachOnly ? profile.cdpPort : existingCdpPort };
  } else if (useExistingChromeData) {
    params.onProgress("Launching Chrome with existing user data...");
    const existingUserDataDir = path5.join(
      os4.homedir(),
      "Library/Application Support/Google/Chrome"
    );
    const modifiedConfig = {
      ...browserConfig,
      userDataDir: existingUserDataDir
    };
    running = await launchOpenClawChrome(modifiedConfig, profile);
    didLaunch = true;
  } else {
    params.onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = useAttach ? browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${existingCdpPort}` : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    params.onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    params.onProgress("Connecting to browser...");
    const browser = await chromium5.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://www.doubao.com/chat/");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    params.onProgress("Please login to Doubao in the opened browser window...");
    return await new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error("Login timed out (5 minutes)."));
        }
      }, 3e5);
      const tryResolve = async () => {
        if (resolved) {
          return;
        }
        try {
          const cookies = await context.cookies(["https://www.doubao.com", "https://doubao.com"]);
          if (cookies.length === 0) {
            console.log(`[Doubao] No cookies found in context yet.`);
            return;
          }
          const cookieNames = cookies.map((c) => c.name);
          console.log(`[Doubao] Found cookies: ${cookieNames.join(", ")}`);
          const sessionidCookie = cookies.find((c) => c.name === "sessionid");
          const ttwidCookie = cookies.find((c) => c.name === "ttwid");
          const fpCookie = cookies.find((c) => c.name === "s_v_web_id");
          if (sessionidCookie) {
            resolved = true;
            clearTimeout(timeout);
            console.log(`[Doubao] sessionid captured!`);
            const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
            resolve({
              sessionid: sessionidCookie.value,
              ttwid: ttwidCookie?.value,
              userAgent,
              cookie: cookieString
            });
          } else {
            console.log(`[Doubao] Waiting for sessionid cookie...`);
          }
        } catch (e) {
          console.error(`[Doubao] Failed to fetch cookies: ${String(e)}`);
        }
      };
      page.on("request", async (request) => {
        const url = request.url();
        if (url.includes("doubao.com")) {
          const headers = request.headers();
          if (headers["cookie"]?.includes("sessionid")) {
            console.log(`[Doubao] Found sessionid in request cookie.`);
            await tryResolve();
          }
        }
      });
      page.on("response", async (response) => {
        const url = response.url();
        if (url.includes("doubao.com") && response.ok()) {
          await tryResolve();
        }
      });
      page.on("close", () => {
        reject(new Error("Browser window closed before login was captured."));
      });
      const checkInterval = setInterval(async () => {
        await tryResolve();
        if (resolved) {
          clearInterval(checkInterval);
        }
      }, 2e3);
    });
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/gemini-web-auth.ts
init_browser_cdp();
import { chromium as chromium6 } from "playwright-core";
init_browser_runtime();
async function loginGeminiWeb(options = {}) {
  const { onProgress = console.log, headless = false } = options;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile, { headless });
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    onProgress("Connecting to browser...");
    const browser = await chromium6.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    onProgress("Navigating to Gemini...");
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded" });
    onProgress("Please login in the browser window...");
    onProgress("Waiting for authentication...");
    await page.waitForFunction(
      () => {
        return document.cookie.includes("SID=") || document.cookie.includes("__Secure-1PSID=");
      },
      { timeout: 3e5 }
      // 5 minutes
    );
    onProgress("Login detected, capturing cookies...");
    const cookies = await context.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    onProgress("Authentication captured successfully!");
    return {
      cookie: cookieString,
      userAgent
    };
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/glm-intl-web-auth.ts
init_browser_cdp();
import { chromium as chromium7 } from "playwright-core";
init_browser_runtime();
async function loginGlmIntlWeb(options = {}) {
  const { onProgress = console.log } = options;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    onProgress("Connecting to browser...");
    const browser = await chromium7.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    onProgress("Navigating to GLM International (chat.z.ai)...");
    await page.goto("https://chat.z.ai/", { waitUntil: "domcontentloaded", timeout: 12e4 });
    const userAgent = await page.evaluate(() => navigator.userAgent);
    onProgress("Please login to GLM International (chat.z.ai) in the opened browser window...");
    onProgress("Waiting for authentication (checking for login cookies or page change)...");
    try {
      await page.waitForFunction(
        () => {
          const cookieStr = document.cookie;
          const currentUrl = window.location.href;
          const hasAuthCookie = cookieStr.includes("chatglm_refresh_token") || cookieStr.includes("refresh_token") || cookieStr.includes("auth_token") || cookieStr.includes("access_token") || cookieStr.includes("session") || cookieStr.includes("token");
          const isLoggedInUrl = currentUrl.includes("chat") || currentUrl.includes("conversation") || currentUrl.includes("dashboard") || !currentUrl.includes("login") && !currentUrl.includes("auth");
          const hasChatElements = document.querySelector(
            'textarea, [contenteditable="true"], .chat-input, .message-input'
          ) !== null;
          return hasAuthCookie || isLoggedInUrl && hasChatElements;
        },
        { timeout: 6e5, polling: 1e3 }
        // 10 minutes, check every second
      );
      onProgress("Login detected via cookies or page state...");
    } catch (error) {
      onProgress(
        `Login detection timed out or failed: ${error instanceof Error ? error.message : String(error)}`
      );
      onProgress("Checking if we're already on a logged-in page...");
      const currentUrl = await page.evaluate(() => window.location.href);
      const cookies2 = await context.cookies("https://chat.z.ai");
      const cookieNames = cookies2.map((c) => c.name).join(", ");
      onProgress(`Current URL: ${currentUrl}`);
      onProgress(`Available cookies: ${cookieNames}`);
      if (cookies2.length > 0) {
        onProgress("Proceeding with available cookies...");
      } else {
        throw new Error(
          `Login timeout. Please ensure you've logged in to chat.z.ai in the browser window. Available cookies: ${cookieNames || "none"}`,
          { cause: error }
        );
      }
    }
    onProgress("Capturing cookies...");
    const cookies = await context.cookies("https://chat.z.ai");
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    onProgress("Authentication captured successfully!");
    return { cookie: cookieString, userAgent };
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/grok-web-auth.ts
init_browser_cdp();
import { chromium as chromium8 } from "playwright-core";
init_browser_runtime();
async function loginGrokWeb(options = {}) {
  const { onProgress = console.log, headless = false } = options;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    onProgress("Connecting to browser...");
    const browser = await chromium8.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    onProgress("Navigating to Grok...");
    await page.goto("https://grok.com", { waitUntil: "domcontentloaded" });
    const userAgent = await page.evaluate(() => navigator.userAgent);
    onProgress("Please login to Grok in the opened browser window...");
    onProgress("Waiting for authentication...");
    await page.waitForFunction(
      () => {
        return document.cookie.includes("sso") || document.cookie.includes("_ga");
      },
      { timeout: 3e5 }
    );
    onProgress("Login detected, capturing cookies...");
    const cookies = await context.cookies("https://grok.com");
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    onProgress("Authentication captured successfully!");
    return { cookie: cookieString, userAgent };
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/kimi-web-auth.ts
init_browser_cdp();
import { chromium as chromium9 } from "playwright-core";
init_browser_runtime();
async function loginKimiWeb(options = {}) {
  const { onProgress = console.log } = options;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    onProgress("Connecting to browser...");
    const browser = await chromium9.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    onProgress("Navigating to Kimi...");
    await page.goto("https://www.kimi.com/", { waitUntil: "domcontentloaded" });
    onProgress("Please login in the browser window...");
    onProgress("Waiting for authentication...");
    await page.waitForFunction(
      () => {
        return document.cookie.includes("access_token") || !!localStorage.getItem("access_token");
      },
      { timeout: 3e5 }
      // 5 minutes
    );
    onProgress("Login detected, capturing credentials...");
    const cookies = await context.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const localStorageData = await page.evaluate(() => {
      const at = localStorage.getItem("access_token");
      const rt = localStorage.getItem("refresh_token");
      const kimiAuth = document.cookie.includes("kimi-auth") ? document.cookie.split(";").find((c) => c.trim().startsWith("kimi-auth="))?.split("=")[1] ?? "" : "";
      return { access_token: at, refresh_token: rt, kimiAuthCookie: kimiAuth };
    });
    const userAgent = await page.evaluate(() => navigator.userAgent);
    onProgress("Authentication captured successfully!");
    return {
      cookie: cookieString || `kimi-auth=${localStorageData.kimiAuthCookie}`,
      accessToken: localStorageData.access_token || void 0,
      refreshToken: localStorageData.refresh_token || void 0,
      userAgent
    };
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/perplexity-web-auth.ts
init_browser_cdp();
import { chromium as chromium10 } from "playwright-core";
init_browser_runtime();
async function loginPerplexityWeb(options = {}) {
  const { onProgress = console.log, headless = false } = options;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    onProgress("Connecting to browser...");
    const browser = await chromium10.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    onProgress("Navigating to Perplexity...");
    await page.goto("https://www.perplexity.ai", { waitUntil: "domcontentloaded" });
    onProgress("Please login in the browser window...");
    onProgress("Waiting for authentication...");
    await page.waitForFunction(
      () => {
        return document.cookie.includes("__Secure-next-auth.session-token") || document.cookie.includes("intercom_session") || document.cookie.includes("perplexity_") || document.cookie.includes("next-auth.session-token") || window.location.pathname === "/" && !document.querySelector('button[data-testid="login-button"]');
      },
      { timeout: 3e5 }
    );
    onProgress("Login detected, capturing cookies...");
    const cookies = await context.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    onProgress("Authentication captured successfully!");
    return {
      cookie: cookieString,
      userAgent
    };
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/qwen-cn-web-auth.ts
import { chromium as chromium11 } from "playwright-core";
async function loginQwenCNWeb(params) {
  const { onProgress } = params;
  onProgress("Connecting to Chrome debug port...");
  const cdpUrl = "http://127.0.0.1:9222";
  let browser;
  try {
    const response = await fetch(`${cdpUrl}/json/version`);
    const versionInfo = await response.json();
    const wsUrl = versionInfo.webSocketDebuggerUrl;
    browser = await chromium11.connectOverCDP(wsUrl);
    const context = browser.contexts()[0];
    onProgress("Opening Qwen CN (qianwen.com)...");
    let page = context.pages().find((p) => p.url().includes("qianwen.com"));
    if (!page) {
      page = await context.newPage();
      await page.goto("https://www.qianwen.com/", { waitUntil: "domcontentloaded" });
    }
    onProgress("Waiting for login... Please login in the browser");
    let cookie = "";
    let xsrfToken = "";
    let ut = "";
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1e3));
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(
        (c) => c.name === "tongyi_sso_ticket" || c.name === "login_aliyunid_ticket"
      );
      if (sessionCookie) {
        cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
        try {
          const tokenFromPage = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="x-xsrf-token"]');
            return meta?.getAttribute("content") || "";
          });
          xsrfToken = tokenFromPage;
        } catch {
          const xsrfCookie = cookies.find((c) => c.name === "XSRF-TOKEN");
          if (xsrfCookie) {
            xsrfToken = xsrfCookie.value;
          }
        }
        const utCookie = cookies.find((c) => c.name === "b-user-id");
        if (utCookie) {
          ut = utCookie.value;
        }
        onProgress("Login detected! Capturing credentials...");
        break;
      }
      if (i % 10 === 0) {
        onProgress(`Waiting for login... (${i}s)`);
      }
    }
    if (!cookie) {
      throw new Error("Login timeout. Please login within 2 minutes.");
    }
    const userAgent = await page.evaluate(() => navigator.userAgent);
    await browser.close();
    onProgress("Credentials captured successfully!");
    return {
      cookie,
      xsrfToken,
      userAgent,
      ut
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// src/zero-token/providers/qwen-web-auth.ts
init_browser_cdp();
import { chromium as chromium12 } from "playwright-core";
init_browser_runtime();
async function loginQwenWeb(params) {
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    params.onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    params.onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    params.onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    params.onProgress("Connecting to browser...");
    const browser = await chromium12.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl),
      timeout: 6e4
      // 60s，Chrome 多标签或复杂页面时 CDP 握手可能较慢
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://chat.qwen.ai/");
    const userAgent = await page.evaluate(() => navigator.userAgent);
    params.onProgress("Please login to Qwen in the opened browser window...");
    return await new Promise((resolve, reject) => {
      let capturedToken;
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error("Login timed out (5 minutes)."));
        }
      }, 3e5);
      const tryResolve = async () => {
        if (resolved) {
          return;
        }
        try {
          const cookies = await context.cookies(["https://chat.qwen.ai", "https://qwen.ai"]);
          if (cookies.length === 0) {
            console.log(`[Qwen] No cookies found in context yet.`);
            return;
          }
          const cookieNames = cookies.map((c) => c.name);
          console.log(`[Qwen] Found cookies: ${cookieNames.join(", ")}`);
          const sessionCookie = cookies.find(
            (c) => c.name.includes("session") || c.name.includes("token") || c.name.includes("auth")
          );
          if (sessionCookie || capturedToken) {
            const finalToken = capturedToken || sessionCookie?.value || "";
            if (finalToken && cookies.length > 2) {
              resolved = true;
              clearTimeout(timeout);
              console.log(`[Qwen] Session token captured!`);
              const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
              resolve({
                sessionToken: finalToken,
                cookie: cookieString,
                userAgent
              });
            } else {
              console.log(`[Qwen] Waiting for valid session...`);
            }
          } else {
            console.log(`[Qwen] Waiting for session cookie...`);
          }
        } catch (e) {
          console.error(`[Qwen] Failed to fetch cookies: ${String(e)}`);
        }
      };
      page.on("request", async (request) => {
        const url = request.url();
        if (url.includes("qwen.ai")) {
          const headers = request.headers();
          const auth = headers["authorization"];
          const cookie = headers["cookie"];
          if (auth) {
            if (!capturedToken) {
              console.log(`[Qwen] Captured authorization token from request.`);
              capturedToken = auth.replace("Bearer ", "");
            }
            await tryResolve();
          } else if (cookie) {
            const tokenMatch = cookie.match(/(?:session|token|auth)[^=]*=([^;]+)/i);
            if (tokenMatch) {
              if (!capturedToken) {
                console.log(`[Qwen] Captured session from cookie.`);
                capturedToken = tokenMatch[1];
              }
              await tryResolve();
            }
          }
        }
      });
      page.on("response", async (response) => {
        const url = response.url();
        if (url.includes("qwen.ai") && response.ok()) {
          await tryResolve();
        }
      });
      page.on("close", () => {
        reject(new Error("Browser window closed before login was captured."));
      });
      const checkInterval = setInterval(async () => {
        await tryResolve();
        if (resolved) {
          clearInterval(checkInterval);
        }
      }, 2e3);
    });
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/providers/glm-web-auth.ts
init_browser_cdp();
import { chromium as chromium13 } from "playwright-core";
init_browser_runtime();
async function loginZWeb(options = {}) {
  const { onProgress = console.log } = options;
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();
  let running;
  let didLaunch = false;
  if (browserConfig.attachOnly) {
    onProgress("Connecting to existing Chrome (attach mode)...");
    const wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 5e3);
    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode (./start-chrome-debug.sh)`
      );
    }
    running = { cdpPort: profile.cdpPort };
  } else {
    onProgress("Launching browser...");
    running = await launchOpenClawChrome(browserConfig, profile);
    didLaunch = true;
  }
  try {
    const cdpUrl = browserConfig.attachOnly ? profile.cdpUrl : `http://127.0.0.1:${running.cdpPort}`;
    let wsUrl = null;
    onProgress("Waiting for browser debugger...");
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2e3);
      if (wsUrl) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl} after retries.`);
    }
    onProgress("Connecting to browser...");
    const browser = await chromium13.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl)
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    onProgress("Navigating to ChatGLM...");
    await page.goto("https://chatglm.cn", { waitUntil: "domcontentloaded" });
    const userAgent = await page.evaluate(() => navigator.userAgent);
    onProgress("Please login to ChatGLM (\u667A\u8C31\u6E05\u8A00) in the opened browser window...");
    onProgress("Waiting for authentication (chatglm_refresh_token cookie)...");
    await page.waitForFunction(
      () => {
        return document.cookie.includes("chatglm_refresh_token");
      },
      { timeout: 3e5 }
      // 5 minutes
    );
    onProgress("Login detected, capturing cookies...");
    const cookies = await context.cookies("https://chatglm.cn");
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    onProgress("Authentication captured successfully!");
    return { cookie: cookieString, userAgent };
  } finally {
    if (didLaunch && running && "proc" in running) {
      await stopOpenClawChrome(running);
    }
  }
}

// src/zero-token/streams/chatgpt-web-stream.ts
import {
  createAssistantMessageEventStream
} from "@mariozechner/pi-ai";

// src/zero-token/providers/chatgpt-web-client-browser.ts
init_shared_browser();
import { randomUUID } from "node:crypto";
var ChatGPTWebClientBrowser = class {
  accessToken;
  cookie;
  userAgent;
  baseUrl = "https://chatgpt.com";
  browser = null;
  page = null;
  running = null;
  constructor(options) {
    if (typeof options === "string") {
      const parsed = JSON.parse(options);
      this.accessToken = parsed.accessToken;
      this.cookie = parsed.cookie || `__Secure-next-auth.session-token=${parsed.accessToken}`;
      this.userAgent = parsed.userAgent || "Mozilla/5.0";
    } else {
      this.accessToken = options.accessToken;
      this.cookie = options.cookie || `__Secure-next-auth.session-token=${options.accessToken}`;
      this.userAgent = options.userAgent || "Mozilla/5.0";
    }
  }
  async ensureBrowser() {
    if (this.browser && this.page) {
      return { browser: this.browser, page: this.page };
    }
    const { context, page } = await getSharedBrowser("ChatGPT Web Browser", "https://chatgpt.com/");
    this.browser = context;
    this.page = page;
    await this.ensureChatGptPageReady();
    const cookieStr = typeof this.cookie === "string" ? this.cookie.trim() : "";
    if (cookieStr && !cookieStr.startsWith("{")) {
      const rawCookies = cookieStr.split(";").map((c) => {
        const [name, ...valueParts] = c.trim().split("=");
        return {
          name: name?.trim() ?? "",
          value: valueParts.join("=").trim(),
          domain: ".chatgpt.com",
          path: "/"
        };
      });
      const cookies = rawCookies.filter((c) => c.name.length > 0);
      if (cookies.length > 0) {
        try {
          await this.browser.addCookies(cookies);
        } catch (err) {
          console.warn(
            `[ChatGPT Web Browser] addCookies failed (page may already have session): ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
    return { browser: this.browser, page: this.page };
  }
  /** 确保 chatgpt.com 页面已加载且 oaistatic Sentinel 脚本已就绪 */
  async ensureChatGptPageReady() {
    if (!this.page) {
      return;
    }
    if (!this.page.url().includes("chatgpt.com")) {
      await this.page.goto("https://chatgpt.com/", { waitUntil: "load" });
    }
    try {
      await this.page.waitForFunction(
        () => {
          const scripts = Array.from(document.scripts);
          return scripts.some((s) => s.src?.includes("oaistatic.com") && s.src?.endsWith(".js"));
        },
        { timeout: 15e3 }
      );
    } catch {
      console.warn("[ChatGPT Web Browser] oaistatic script not found in 15s, continuing anyway");
    }
    await new Promise((r) => setTimeout(r, 2e3));
  }
  /**
   * DOM 模拟：通过真实浏览器交互发送消息，绕过 403 风控
   * 参考：zsodur/chatgpt-api-by-browser-script 等 DOM 模拟实现
   */
  async chatCompletionsViaDOM(params) {
    const { page } = await this.ensureBrowser();
    const sent = await page.evaluate((msg) => {
      const inputSelectors = [
        "#prompt-textarea",
        "textarea[placeholder]",
        "textarea",
        '[contenteditable="true"][data-placeholder]',
        "[contenteditable='true']"
      ];
      let inputEl = null;
      for (const sel of inputSelectors) {
        inputEl = document.querySelector(sel);
        if (inputEl && inputEl.offsetParent !== null) {
          break;
        }
      }
      if (!inputEl) {
        return { ok: false, error: "\u627E\u4E0D\u5230\u8F93\u5165\u6846" };
      }
      inputEl.focus();
      if (inputEl.tagName === "TEXTAREA" || inputEl.tagName === "INPUT") {
        inputEl.value = msg;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        inputEl.textContent = msg;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const sendSelectors = [
        "#composer-submit-button",
        'button[data-testid="send-button"]',
        "button.btn.relative.btn-primary",
        "button.mb-1.mr-1.flex.h-8.w-8.items-center.justify-center.rounded-full.bg-black",
        'button[aria-label*="Send"]',
        'button[type="submit"]',
        "form button[type=submit]"
      ];
      let sendBtn = null;
      for (const sel of sendSelectors) {
        sendBtn = document.querySelector(sel);
        if (sendBtn && !sendBtn.disabled) {
          break;
        }
      }
      if (!sendBtn) {
        return { ok: false, error: "\u627E\u4E0D\u5230\u53D1\u9001\u6309\u94AE" };
      }
      sendBtn.click();
      return { ok: true };
    }, params.message);
    if (!sent.ok) {
      throw new Error(`ChatGPT DOM \u6A21\u62DF\u5931\u8D25: ${sent.error}`);
    }
    const maxWaitMs = 9e4;
    const pollIntervalMs = 2e3;
    let lastText = "";
    let stableCount = 0;
    const signal = params.signal;
    for (let elapsed = 0; elapsed < maxWaitMs; elapsed += pollIntervalMs) {
      if (signal?.aborted) {
        throw new Error("ChatGPT \u8BF7\u6C42\u5DF2\u53D6\u6D88");
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      const result = await page.evaluate(() => {
        const clean = (t) => t.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        const els = document.querySelectorAll(
          'div[data-message-author-role="assistant"], .agent-turn [data-message-author-role="assistant"], [class*="markdown"], [class*="assistant"]'
        );
        const last = els.length > 0 ? els[els.length - 1] : null;
        const text = last ? clean(last.textContent ?? "") : "";
        const stopBtn = document.querySelector('button.bg-black .icon-lg, [aria-label*="Stop"]');
        const isStreaming = !!stopBtn;
        return { text, isStreaming };
      });
      if (result.text && result.text !== lastText) {
        lastText = result.text;
        stableCount = 0;
      } else if (result.text) {
        stableCount++;
        if (!result.isStreaming && stableCount >= 2) {
          break;
        }
      }
    }
    if (!lastText) {
      throw new Error(
        "ChatGPT DOM \u6A21\u62DF\uFF1A\u672A\u68C0\u6D4B\u5230\u56DE\u590D\u3002\u8BF7\u786E\u4FDD chatgpt.com \u9875\u9762\u5DF2\u6253\u5F00\u5E76\u767B\u5F55\uFF0C\u4E14\u8F93\u5165\u6846\u53EF\u89C1\u3002"
      );
    }
    const fakeSse = `data: ${JSON.stringify({
      message: { id: "dom-fallback", content: { parts: [lastText] } }
    })}

data: [DONE]

`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(fakeSse));
        controller.close();
      }
    });
  }
  async init() {
    await this.ensureBrowser();
  }
  async chatCompletions(params) {
    const { page } = await this.ensureBrowser();
    const conversationId = params.conversationId || randomUUID();
    const parentMessageId = params.parentMessageId || randomUUID();
    const messageId = randomUUID();
    console.log(`[ChatGPT Web Browser] Sending message`);
    console.log(`[ChatGPT Web Browser] Conversation ID: ${conversationId}`);
    console.log(`[ChatGPT Web Browser] Model: ${params.model || "gpt-4"}`);
    const body = {
      action: "next",
      messages: [
        {
          id: messageId,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: [params.message]
          }
        }
      ],
      parent_message_id: parentMessageId,
      model: params.model || "gpt-4",
      timezone_offset_min: (/* @__PURE__ */ new Date()).getTimezoneOffset(),
      conversation_id: conversationId === "new" ? void 0 : conversationId,
      history_and_training_disabled: false,
      conversation_mode: { kind: "primary_assistant", plugin_ids: null },
      force_paragen: false,
      force_paragen_model_slug: "",
      force_rate_limit: false,
      reset_rate_limits: false,
      force_use_sse: true
    };
    const pageUrl = page.url();
    const responseData = await page.evaluate(
      async ({ body: body2, pageUrl: pageUrl2 }) => {
        const baseHeaders = (accessToken2, deviceId2) => ({
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "oai-device-id": deviceId2,
          "oai-language": "en-US",
          Referer: pageUrl2 || "https://chatgpt.com/",
          "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          ...accessToken2 ? { Authorization: `Bearer ${accessToken2}` } : {}
        });
        async function warmupSentinel(accessToken2, deviceId2) {
          const h = baseHeaders(accessToken2, deviceId2);
          await fetch("https://chatgpt.com/backend-api/conversation/init", {
            method: "POST",
            headers: h,
            body: "{}",
            credentials: "include"
          }).catch(() => {
          });
          await fetch("https://chatgpt.com/backend-api/sentinel/chat-requirements/prepare", {
            method: "POST",
            headers: h,
            body: "{}",
            credentials: "include"
          }).catch(() => {
          });
          await fetch("https://chatgpt.com/backend-api/sentinel/chat-requirements/finalize", {
            method: "POST",
            headers: h,
            body: "{}",
            credentials: "include"
          }).catch(() => {
          });
        }
        async function getSession() {
          const r = await fetch("https://chatgpt.com/api/auth/session", { credentials: "include" });
          return r.ok ? r.json() : null;
        }
        async function tryFetchWithSentinel(accessToken2, deviceId2) {
          const scripts = Array.from(document.scripts);
          const assetSrc = scripts.map((s) => s.src).find((s) => s?.includes("oaistatic.com") && s.endsWith(".js"));
          const assetUrl = assetSrc || "https://cdn.oaistatic.com/assets/i5bamk05qmvsi6c3.js";
          try {
            const g = await import(
              /* @vite-ignore */
              assetUrl
            );
            if (typeof g.bk !== "function" || typeof g.fX !== "function") {
              return { error: `Sentinel asset missing bk/fX (asset: ${assetUrl})` };
            }
            const z = await g.bk();
            const turnstileKey = z?.turnstile?.bx ?? z?.turnstile?.dx;
            if (!turnstileKey) {
              return { error: "Sentinel chat-requirements missing turnstile" };
            }
            const r = await g.bi(turnstileKey);
            let arkose = null;
            try {
              arkose = await g.bl?.getEnforcementToken?.(z);
            } catch {
            }
            let p = null;
            try {
              p = await g.bm?.getEnforcementToken?.(z);
            } catch {
            }
            const extraHeaders = await g.fX(z, arkose, r, p, null);
            const headers = {
              ...baseHeaders(accessToken2, deviceId2),
              ...typeof extraHeaders === "object" ? extraHeaders : {}
            };
            const res2 = await fetch("https://chatgpt.com/backend-api/conversation", {
              method: "POST",
              headers,
              body: JSON.stringify(body2),
              credentials: "include"
            });
            return { res: res2 };
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { error: `Sentinel token failed: ${msg}` };
          }
        }
        const session = await getSession();
        const accessToken = session?.accessToken;
        const deviceId = session?.oaiDeviceId ?? globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
        const sentinelResult = await tryFetchWithSentinel(accessToken, deviceId);
        const res = sentinelResult.res ?? await fetch("https://chatgpt.com/backend-api/conversation", {
          method: "POST",
          headers: baseHeaders(accessToken, deviceId),
          body: JSON.stringify(body2),
          credentials: "include"
        });
        const sentinelError = "error" in sentinelResult ? sentinelResult.error : void 0;
        if (!res.ok) {
          const errorText = await res.text();
          return { ok: false, status: res.status, error: errorText, sentinelError };
        }
        const reader = res.body?.getReader();
        if (!reader) {
          return { ok: false, status: 500, error: "No response body", sentinelError };
        }
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          fullText += decoder.decode(value, { stream: true });
        }
        return { ok: true, data: fullText };
      },
      { body, pageUrl }
    );
    if (!responseData.ok) {
      if (responseData.status === 403) {
        console.log(
          "[ChatGPT Web Browser] 403 \u98CE\u63A7\uFF0C\u5C1D\u8BD5 DOM \u6A21\u62DF fallback\uFF08\u8BF7\u6C42\u7531\u771F\u5B9E\u6D4F\u89C8\u5668\u53D1\u8D77\uFF0C\u4E0D\u6613\u89E6\u53D1\u98CE\u63A7\uFF09"
        );
        return this.chatCompletionsViaDOM({
          message: params.message,
          signal: params.signal
        });
      }
      const sentinelHint = responseData.sentinelError ? ` Sentinel: ${responseData.sentinelError}` : " \u82E5\u6301\u7EED 403\uFF0C\u9700\u5728 chatgpt.com \u63A7\u5236\u53F0\u68C0\u67E5 oaistatic \u811A\u672C\u5BFC\u51FA\u540D\u662F\u5426\u53D8\u66F4\u3002";
      if (responseData.status === 401) {
        throw new Error("ChatGPT \u8BA4\u8BC1\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u8FD0\u884C ./onboard.sh \u5237\u65B0 session\u3002");
      }
      throw new Error(
        `ChatGPT API \u9519\u8BEF ${responseData.status}: ${responseData.error?.slice(0, 200) || ""}`
      );
    }
    console.log(`[ChatGPT Web Browser] Response length: ${responseData.data?.length || 0} bytes`);
    const sample = responseData.data?.slice(0, 1800) ?? "";
    console.log(
      `[ChatGPT Web Browser] SSE sample:
${sample}${(responseData.data?.length ?? 0) > 1800 ? "\n...(truncated)" : ""}`
    );
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseData.data));
        controller.close();
      }
    });
    return stream;
  }
  async close() {
    await releaseSharedBrowser();
    this.browser = null;
    this.page = null;
  }
  async discoverModels() {
    return [
      {
        id: "gpt-4",
        name: "GPT-4",
        api: "chatgpt-web",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 8192,
        maxTokens: 4096
      }
    ];
  }
};

// src/zero-token/streams/chatgpt-web-stream.ts
function stripForWebProvider(prompt) {
  return prompt;
}
function buildXmlToolPromptSection(tools) {
  if (!tools || tools.length === 0) {
    return "";
  }
  return "\n## Tool Use Instructions\n";
}
function getXmlToolReminder() {
  return "\nRemember to use tools when needed.";
}
var conversationMap = /* @__PURE__ */ new Map();
var parentMessageMap = /* @__PURE__ */ new Map();
function createChatGPTWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    if (typeof parsed === "string") {
      options = { accessToken: parsed };
    } else {
      options = parsed;
    }
  } catch {
    options = { accessToken: cookieOrJson };
  }
  const client = new ChatGPTWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let conversationId = conversationMap.get(sessionKey);
        let parentMessageId = parentMessageMap.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        const toolPrompt = buildXmlToolPromptSection(tools);
        let prompt = "";
        if (tools.length > 0) {
          if (!conversationId) {
            const historyParts = [];
            let systemPromptContent = systemPrompt;
            if (toolPrompt) {
              systemPromptContent += toolPrompt;
            }
            if (systemPromptContent && !messages.some((m) => m.role === "system")) {
              historyParts.push(`System: ${systemPromptContent}`);
            }
            for (const m of messages) {
              const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
              let content = "";
              if (m.role === "toolResult") {
                const tr = m;
                let resultText = "";
                if (Array.isArray(tr.content)) {
                  for (const part of tr.content) {
                    if (part.type === "text") {
                      resultText += part.text;
                    }
                  }
                }
                content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
              } else if (Array.isArray(m.content)) {
                for (const part of m.content) {
                  if (part.type === "text") {
                    content += part.text;
                  } else if (part.type === "toolCall") {
                    const tc = part;
                    content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                  }
                }
              } else {
                content = String(m.content);
              }
              if (m.role === "user" && content) {
                content = stripForWebProvider(content) || content;
              }
              historyParts.push(`${role}: ${content}`);
            }
            prompt = historyParts.join("\n\n");
          } else {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role === "toolResult") {
              const tr = lastMsg;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
            } else {
              const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
              if (lastUserMessage) {
                if (typeof lastUserMessage.content === "string") {
                  prompt = lastUserMessage.content;
                } else if (Array.isArray(lastUserMessage.content)) {
                  prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
                }
                prompt = stripForWebProvider(prompt) || prompt;
              }
            }
            if (toolPrompt) {
              prompt += getXmlToolReminder();
            }
          }
        } else {
          const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
          if (lastUserMessage) {
            if (typeof lastUserMessage.content === "string") {
              prompt = lastUserMessage.content;
            } else if (Array.isArray(lastUserMessage.content)) {
              prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
            }
          }
        }
        if (!prompt) {
          throw new Error("No message found to send to ChatGPT API");
        }
        const cleanPrompt = stripForWebProvider(prompt);
        if (!cleanPrompt) {
          throw new Error("No message content to send after stripping metadata");
        }
        console.log(`[ChatGPTWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[ChatGPTWebStream] Conversation ID: ${conversationId || "new"}`);
        console.log(
          `[ChatGPTWebStream] Tools: ${tools.length}, prompt length: ${cleanPrompt.length}`
        );
        const responseStream = await client.chatCompletions({
          conversationId: conversationId || "new",
          parentMessageId,
          message: cleanPrompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("ChatGPT API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let buffer = "";
        const contentParts = [];
        const accumulatedToolCalls = [];
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        let sseEventCount = 0;
        const sseSamples = [];
        const createPartial = () => ({
          role: "assistant",
          content: [...contentParts],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          timestamp: Date.now()
        });
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta) => {
          if (!delta) {
            return;
          }
          if (tools.length === 0) {
            if (contentParts.length === 0) {
              contentParts[0] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: 0, partial: createPartial() });
            }
            contentParts[0].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: 0,
              delta,
              partial: createPartial()
            });
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "toolcall") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "tool_start") {
                currentMode = "toolcall";
                currentToolName = first.name ?? "";
                emitDelta("toolcall", "", first.id ?? void 0);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  let argStr = accumulatedToolCalls[currentToolIndex]?.arguments ?? "{}";
                  let cleaned = argStr.trim();
                  if (cleaned.startsWith("```json")) {
                    cleaned = cleaned.slice(7);
                  } else if (cleaned.startsWith("```")) {
                    cleaned = cleaned.slice(3);
                  }
                  if (cleaned.endsWith("```")) {
                    cleaned = cleaned.slice(0, -3);
                  }
                  cleaned = cleaned.trim();
                  try {
                    part.arguments = JSON.parse(cleaned);
                  } catch {
                    part.arguments = { raw: argStr };
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
                currentToolName = "";
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                emitDelta(currentMode === "toolcall" ? "toolcall" : "text", tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                emitDelta(currentMode === "toolcall" ? "toolcall" : "text", safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data: ")) {
            return;
          }
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") {
            return;
          }
          if (!dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.conversation_id) {
              conversationMap.set(sessionKey, data.conversation_id);
            }
            if (data.message?.id) {
              parentMessageMap.set(sessionKey, data.message.id);
            }
            const role = data.message?.author?.role ?? data.message?.role;
            if (role && role !== "assistant") {
              if (sseEventCount < 8) {
                console.log(`[ChatGPTWebStream] Skip event (role=${role})`);
              }
              return;
            }
            if (data.message && sseEventCount < 8) {
              sseEventCount++;
              const rawPart2 = data.message?.content?.parts?.[0];
              const preview = typeof rawPart2 === "string" ? rawPart2.slice(0, 100) : typeof rawPart2 === "object" && rawPart2 !== null && "text" in rawPart2 ? String(rawPart2.text).slice(0, 100) : void 0;
              sseSamples.push({
                role: role ?? void 0,
                hasParts: !!data.message?.content?.parts?.length,
                contentPreview: preview
              });
            }
            const rawPart = data.message?.content?.parts?.[0];
            const content = typeof rawPart === "string" ? rawPart : typeof rawPart === "object" && rawPart !== null && "text" in rawPart ? rawPart.text : void 0;
            if (typeof content === "string" && content) {
              const delta = content.slice(accumulatedContent.length);
              if (delta) {
                accumulatedContent = content;
                pushDelta(delta);
              }
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tools.length > 0 && tagBuffer) {
          const mode = currentMode;
          if (mode === "toolcall") {
            emitDelta("toolcall", tagBuffer);
          } else {
            emitDelta("text", tagBuffer);
          }
        }
        const stopReason = accumulatedToolCalls.length > 0 ? "toolUse" : "stop";
        console.log(
          `[ChatGPTWebStream] Stream completed. Content length: ${accumulatedContent.length}, tools: ${accumulatedToolCalls.length}`
        );
        if (sseSamples.length > 0) {
          console.log(
            `[ChatGPTWebStream] SSE samples:`,
            JSON.stringify(sseSamples, null, 2).slice(0, 800)
          );
        }
        const assistantMessage = {
          role: "assistant",
          content: contentParts.length > 0 ? contentParts : [{ type: "text", text: accumulatedContent }],
          stopReason,
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          timestamp: Date.now()
        };
        stream.push({
          type: "done",
          reason: "stop",
          message: assistantMessage
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/claude-web-stream.ts
init_claude_web_client_browser();
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream2
} from "@mariozechner/pi-ai";
var sessionMap = /* @__PURE__ */ new Map();
function createClaudeWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, sessionKey: "" };
  }
  const client = new ClaudeWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream2();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let sessionId = sessionMap.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = "\n## Available Tools\n";
          for (const tool of tools) {
            toolPrompt += `- ${tool.name}: ${tool.description}
`;
          }
        }
        let prompt = "";
        if (!sessionId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        if (toolPrompt && sessionId) {
          prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>. Using plain text to describe your action will FAIL to execute the tool.';
        }
        if (!prompt) {
          throw new Error("No message found to send to ClaudeWeb API");
        }
        console.log(`[ClaudeWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[ClaudeWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[ClaudeWebStream] Tools available: ${tools.length}`);
        console.log(`[ClaudeWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          conversationId: sessionId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("ClaudeWeb API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[Qwen Stream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.sessionId) {
              sessionMap.set(sessionKey, data.sessionId);
            }
            let delta = data.choices?.[0]?.delta?.content ?? data.text ?? data.content ?? data.delta;
            if ((!delta || typeof delta !== "string") && data.type === "content_block_delta" && data.delta && typeof data.delta.text === "string") {
              delta = data.delta.text;
            }
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[ClaudeWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/deepseek-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream3
} from "@mariozechner/pi-ai";

// src/zero-token/providers/deepseek-web-client.ts
import crypto3 from "node:crypto";
var SHA3_WASM_B64 = "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ADYCAEGEocAAQfigwAA2AgBBgKHAAEH4oMAANgIAQYyhwABBgKHAADYCAEGIocAAQYChwAA2AgBBlKHAAEGIocAANgIAQZChwABBiKHAADYCAEGcocAAQZChwAA2AgBBpKHAAEGYocAANgIAQZihwABBkKHAADYCAEGsocAAQaChwAA2AgBBoKHAAEGYocAANgIAQbShwABBqKHAADYCAEGoocAAQaChwAA2AgBBvKHAAEGwocAANgIAQbChwABBqKHAADYCAEHEocAAQbihwAA2AgBBuKHAAEGwocAANgIAQcyhwABBwKHAADYCAEHAocAAQbihwAA2AgBB1KHAAEHIocAANgIAQcihwABBwKHAADYCAEHcocAAQdChwAA2AgBB0KHAAEHIocAANgIAQeShwABB2KHAADYCAEHYocAAQdChwAA2AgBB7KHAAEHgocAANgIAQeChwABB2KHAADYCAEH0ocAAQeihwAA2AgBB6KHAAEHgocAANgIAQfyhwABB8KHAADYCAEHwocAAQeihwAA2AgBBhKLAAEH4ocAANgIAQfihwABB8KHAADYCAEGMosAAQYCiwAA2AgBBgKLAAEH4ocAANgIAQZSiwABBiKLAADYCAEGIosAAQYCiwAA2AgBBrKLAACABNgIAQZCiwABBiKLAADYCAEGkosAAIANBKGsiADYCACABIABBAXI2AgQgACABakEoNgIEQbiiwABBgICAATYCAAwHCyACIARJIAEgAk1yDQAgACgCDEUNAwtBvKLAAEG8osAAKAIAIgAgASAAIAFJGzYCACABIANqIQRBgKDAACEAAkACQANAIAQgACgCACIGRwRAIAAoAggiAA0BDAILCyAAKAIMRQ0BC0GAoMAAIQADQAJAIAIgACgCACIETwRAIAIgBCAAKAIEaiIGSQ0BCyAAKAIIIQAMAQsLQayiwAAgATYCAEGkosAAIANBKGsiADYCACABIABBAXI2AgQgACABakEoNgIEQbiiwABBgICAATYCACACIAZBIGtBeHFBCGsiACAAIAJBEGpJGyIEQRs2AgRBgKDAACkCACEJIARBEGpBiKDAACkCADcCACAEIAk3AghBhKDAACADNgIAQYCgwAAgATYCAEGIoMAAIARBCGo2AgBBjKDAAEEANgIAIARBHGohAANAIABBBzYCACAAQQRqIgAg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QZyiwABBnKLAACgCACADcjYCAA8LAkACQCABIAQoAgAiAygCBEF4cUYEQCADIQIMAQsgAUEZIAJBAXZrQQAgAkEfRxt0IQUDQCADIAVBHXZBBHFqQRBqIgQoAgAiAkUNAiAFQQF0IQUgAiEDIAIoAgRBeHEgAUcNAAsLIAIoAggiASAANgIMIAIgADYCCCAAQQA2AhggACACNgIMIAAgATYCCA8LIAQgADYCACAAIAM2AhggACAANgIMIAAgADYCCAuBAgEFfyMAQYABayIEJAACfwJAAkAgASgCHCICQRBxRQRAIAJBIHENASAAIAEQDwwDC0H/ACECA0AgBCACIgNqIgUgAEEPcSICQTByIAJB1wBqIAJBCkkbOgAAIANBAWshAiAAQRBJIABBBHYhAEUNAAsMAQtB/wAhAgNAIAQgAiIDaiIFIABBD3EiAkEwciACQTdqIAJBCkkbOgAAIANBAWshAiAAQRBJIABBBHYhAEUNAAsgA0GBAU8EQCADEBgACyABQYCEwABBAiAFQYABIANrEAkMAQsgA0GBAU8EQCADEBgACyABQYCEwABBAiAFQYABIANrEAkLIARBgAFqJAALuQIAIAIEQCABIAJBiAFsaiECA0AgACAAKQMAIAEpAACFNwMAIAAgACkDCCABKQAIhTcDCCAAIAApAxAgASkAEIU3AxAgACAAKQMYIAEpABiFNwMYIAAgACkDICABKQAghTcDICAAIAApAyggASkAKIU3AyggACAAKQMwIAEpADCFNwMwIAAgACkDOCABKQA4hTcDOCAAIAApA0AgASkAQIU3A0AgACAAKQNIIAEpAEiFNwNIIAAgACkDUCABKQBQhTcDUCAAIAApA1ggASkAWIU3A1ggACAAKQNgIAEpAGCFNwNgIAAgACkDaCABKQBohTcDaCAAIAApA3AgASkAcIU3A3AgACAAKQN4IAEpAHiFNwN4IAAgACkDgAEgASkAgAGFNwOAASAAEAQgAUGIAWoiASACRw0ACwsLsAEBAn8jAEEgayIDJAAgASABIAJqIgJLBEBBAEEAECgAC0EIIAAoAgAiAUEBdCIEIAIgAiAESRsiAiACQQhNGyIEQQBIBEBBAEEAECgACyADIAEEfyADIAE2AhwgAyAAKAIENgIUQQEFQQALNgIYIANBCGogBCADQRRqEB0gAygCCEEBRgRAIAMoAgwgAygCEBAoAAsgAygCDCEBIAAgBDYCACAAIAE2AgQgA0EgaiQAC7ABAQR/IwBBIGsiASQAIAAoAgAiAkF/RgRAQQBBABAoAAtBCCACQQF0IgMgAkEBaiIEIAMgBEsbIgMgA0EITRsiA0EASARAQQBBABAoAAsgASACBH8gASACNgIcIAEgACgCBDYCFEEBBUEACzYCGCABQQhqIAMgAUEUahAdIAEoAghBAUYEQCABKAIMIAEoAhAQKAALIAEoAgwhAiAAIAM2AgAgACACNgIEIAFBIGokAAuOAQECfyABQRBPBEAgAEEAIABrQQNxIgNqIQIgAwRAA0AgAEEAOgAAIABBAWoiACACSQ0ACwsgAiABIANrIgFBfHEiA2ohACADQQBKBEADQCACQQA2AgAgAkEEaiICIABJDQALCyABQQNxIQELIAEEQCAAIAFqIQEDQCAAQQA6AAAgAEEBaiIAIAFJDQALCwtsAQN/AkACQCAAKAIAIgIEQCAAKAIEIgBBBGsoAgAiAUF4cSIDQQRBCCABQQNxIgEbIAJqSQ0BIAFBACADIAJBJ2pLGw0CIAAQBQsPC0H5ncAAQS5BqJ7AABAgAAtBuJ7AAEEuQeiewAAQIAALewEBfyMAQRBrIgMkAEH8nsAAQfyewAAoAgAiBEEBajYCAAJAIARBAEgNAAJAQciiwAAtAABFBEBBxKLAAEHEosAAKAIAQQFqNgIAQfiewAAoAgBBAE4NAQwCCyADQQhqIAAgARECAAALQciiwABBADoAACACRQ0AAAsAC2wCAX8BfiMAQTBrIgEkACABIAA2AgAgAUGAATYCBCABQQI2AgwgAUGAhsAANgIIIAFCAjcCFCABQoCAgIAwIgIgAUEEaq2ENwMoIAEgAiABrYQ3AyAgASABQSBqNgIQIAFBCGpB8IPAABAkAAtoAgF/AX4jAEEwayIDJAAgAyABNgIEIAMgADYCACADQQI2AgwgA0G4g8AANgIIIANCAjcCFCADQoCAgIAwIgQgA62ENwMoIAMgBCADQQRqrYQ3AyAgAyADQSBqNgIQIANBCGogAhAkAAtoAgF/AX4jAEEwayIDJAAgAyAANgIAIAMgATYCBCADQQI2AgwgA0HUhsAANgIIIANCAjcCFCADQoCAgIAwIgQgA0EEaq2ENwMoIAMgBCADrYQ3AyAgAyADQSBqNgIQIANBCGogAhAkAAtiAQF/AkACQCABBEAgAEEEaygCACICQXhxIgNBBEEIIAJBA3EiAhsgAWpJDQEgAkEAIAMgAUEnaksbDQIgABAFCw8LQfmdwABBLkGonsAAECAAC0G4nsAAQS5B6J7AABAgAAtbAQJ/AkAgAEEEaygCACICQXhxIgNBBEEIIAJBA3EiAhsgAWpPBEAgAkEAIAMgAUEnaksbDQEgABAFDwtB+Z3AAEEuQaiewAAQIAALQbiewABBLkHonsAAECAAC1gBAX8CfyACKAIEBEACQCACKAIIIgNFBEAMAQsgAigCACADQQEgARAHDAILC0HJosAALQAAGiABEAALIQIgACABNgIIIAAgAkEBIAIbNgIEIAAgAkU2AgALSAACQCABaUEBR0GAgICAeCABayAASXINACAABEBByaLAAC0AABoCfyABQQlPBEAgASAAEAoMAQsgABAACyIBRQ0BCyABDwsAC0EBAX8gAiAAKAIAIAAoAggiA2tLBEAgACADIAIQEyAAKAIIIQMLIAAoAgQgA2ogASACEA0aIAAgAiADajYCCEEAC0EBAX8jAEEgayIDJAAgA0EANgIQIANBATYCBCADQgQ3AgggAyABNgIcIAMgADYCGCADIANBGGo2AgAgAyACECQACzgAAkAgAkGAgMQARg0AIAAgAiABKAIQEQAARQ0AQQEPCyADRQRAQQAPCyAAIAMgBCABKAIMEQEACzwBAX9BASECAkAgACgCACABEBENACABKAIUQciCwABBAiABKAIYKAIMEQEADQAgACgCBCABEBEhAgsgAgstAAJAIANpQQFHQYCAgIB4IANrIAFJckUEQCAAIAEgAyACEAciAA0BCwALIAAL6gECAn8BfiMAQRBrIgIkACACQQE7AQwgAiABNgIIIAIgADYCBCMAQRBrIgEkACACQQRqIgApAgAhBCABIAA2AgwgASAENwIEIwBBEGsiACQAIAFBBGoiASgCACICKAIMIQMCQAJAAkACQCACKAIEDgIAAQILIAMNAUEBIQJBACEDDAILIAMNACACKAIAIgIoAgQhAyACKAIAIQIMAQsgAEGAgICAeDYCACAAIAE2AgwgAEEGIAEoAggiAC0ACCAALQAJEBcACyAAIAM2AgQgACACNgIAIABBByABKAIIIgAtAAggAC0A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AgAgBkEDdGoiACgCACAAKAIEIAIoAiQoAgwRAQBFDQELQQEMAQtBAAsgAkEwaiQACwsAIAAoAgAgARAPCwwAIAAgASkCADcDAAsJACAAQQA2AgALC/weAgBBgIDAAAtBRXJyb3IAAAAIAAAADAAAAAQAAAAJAAAACgAAAAsAAABzaGEzLXdhc20vc3JjL2xpYi5ycyAAEAAUAAAASQAAADMAQcyAwAALqR4BAAAADAAAAGEgRGlzcGxheSBpbXBsZW1lbnRhdGlvbiByZXR1cm5lZCBhbiBlcnJvciB1bmV4cGVjdGVkbHkvVXNlcnMvcnoucGFuLy5ydXN0dXAvdG9vbGNoYWlucy9zdGFibGUtYWFyY2g2NC1hcHBsZS1kYXJ3aW4vbGliL3J1c3RsaWIvc3JjL3J1c3QvbGlicmFyeS9hbGxvYy9zcmMvc3RyaW5nLnJziwAQAG0AAAB7CgAADgAAAGNhcGFjaXR5IG92ZXJmbG93AAAACAEQABEAAABhbGxvYy9zcmMvcmF3X3ZlYy5ycyQBEAAUAAAAGAAAAAUAAAAuLjAxMjM0NTY3ODlhYmNkZWZjYWxsZWQgYE9wdGlvbjo6dW53cmFwKClgIG9uIGEgYE5vbmVgIHZhbHVlaW5kZXggb3V0IG9mIGJvdW5kczogdGhlIGxlbiBpcyAgYnV0IHRoZSBpbmRleCBpcyAAhQEQACAAAAClARAAEgAAADogAAABAAAAAAAAAMgBEAACAAAAY29yZS9zcmMvZm10L251bS5ycwDcARAAEwAAAGYAAAAXAAAAMHgwMDAxMDIwMzA0MDUwNjA3MDgwOTEwMTExMjEzMTQxNTE2MTcxODE5MjAyMTIyMjMyNDI1MjYyNzI4MjkzMDMxMzIzMzM0MzUzNjM3MzgzOTQwNDE0MjQzNDQ0NTQ2NDc0ODQ5NTA1MTUyNTM1NDU1NTY1NzU4NTk2MDYxNjI2MzY0NjU2NjY3Njg2OTcwNzE3MjczNzQ3NTc2Nzc3ODc5ODA4MTgyODM4NDg1ODY4Nzg4ODk5MDkxOTI5Mzk0OTU5Njk3OTg5OXJhbmdlIHN0YXJ0IGluZGV4ICBvdXQgb2YgcmFuZ2UgZm9yIHNsaWNlIG9mIGxlbmd0aCAAAMoCEAASAAAA3AIQACIAAAByYW5nZSBlbmQgaW5kZXggEAMQABAA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";
var DeepSeekWebClient = class {
  cookie;
  bearer;
  userAgent;
  deviceId = "";
  constructor(options) {
    let finalOptions;
    if (typeof options === "string") {
      try {
        finalOptions = JSON.parse(options);
        if (typeof finalOptions === "string") {
          finalOptions = { cookie: finalOptions };
        }
      } catch {
        finalOptions = { cookie: options };
      }
    } else {
      finalOptions = options;
    }
    this.cookie = finalOptions.cookie || "";
    this.bearer = finalOptions.bearer || "";
    this.userAgent = finalOptions.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }
  async fetchHeaders() {
    return {
      Cookie: this.cookie,
      "User-Agent": this.userAgent,
      "Content-Type": "application/json",
      Accept: "*/*",
      ...this.bearer ? { Authorization: `Bearer ${this.bearer}` } : {},
      Referer: "https://chat.deepseek.com/",
      Origin: "https://chat.deepseek.com",
      "x-client-platform": "web",
      "x-client-version": "1.7.0",
      "x-app-version": "20241129.1",
      "x-client-locale": "zh_CN",
      "x-client-timezone-offset": "28800"
    };
  }
  async init() {
    if (!this.deviceId) {
      try {
        const res = await fetch(
          "https://chat.deepseek.com/api/v0/client/settings?did=&scope=banner",
          {
            headers: await this.fetchHeaders()
          }
        );
        if (res.ok) {
        }
      } catch (error) {
        console.warn("[DeepSeekWebClient] Failed to fetch settings:", error);
      }
    }
  }
  async createPowChallenge(targetPath) {
    console.log(`[DeepSeekWebClient] Creating PoW challenge for ${targetPath}...`);
    const res = await fetch("https://chat.deepseek.com/api/v0/chat/create_pow_challenge", {
      method: "POST",
      headers: await this.fetchHeaders(),
      body: JSON.stringify({
        target_path: targetPath
      })
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[DeepSeekWebClient] Failed to create PoW challenge: ${res.status}`, errorText);
      throw new Error(`Failed to create PoW challenge: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    console.log(`[DeepSeekWebClient] PoW data full-log:`, JSON.stringify(data));
    const challenge = data.data?.biz_data?.challenge || data.data?.challenge || data.challenge;
    if (!challenge) {
      console.error(
        `[DeepSeekWebClient] Critical Error: PoW challenge missing in response! Keys present:`,
        Object.keys(data)
      );
      throw new Error(`PoW challenge missing in response`);
    }
    console.log(`[DeepSeekWebClient] Challenge extracted successfully:`, challenge);
    return challenge;
  }
  wasmModule = null;
  async getWasmInstance() {
    if (this.wasmModule) {
      return this.wasmModule;
    }
    const wasmBuffer = Buffer.from(SHA3_WASM_B64, "base64");
    const { instance } = await WebAssembly.instantiate(wasmBuffer, { wbg: {} });
    this.wasmModule = instance;
    return instance;
  }
  async solvePow(challenge) {
    const { algorithm, challenge: target, salt, difficulty, expire_at } = challenge;
    console.log(`[DeepSeekWebClient] Solving PoW (${algorithm}, difficulty: ${difficulty})...`);
    if (algorithm === "sha256") {
      const start = Date.now();
      let nonce = 0;
      while (true) {
        const input = salt + target + nonce;
        const hash = crypto3.createHash("sha256").update(input).digest("hex");
        let zeroBits = 0;
        for (const char of hash) {
          const val = parseInt(char, 16);
          if (val === 0) {
            zeroBits += 4;
          } else {
            zeroBits += Math.clz32(val) - 28;
            break;
          }
        }
        const targetDifficulty = difficulty > 1e3 ? Math.floor(Math.log2(difficulty)) : difficulty;
        if (zeroBits >= targetDifficulty) {
          console.log(
            `[DeepSeekWebClient] SHA256 PoW solved in ${Date.now() - start}ms, nonce: ${nonce}`
          );
          return nonce;
        }
        nonce++;
        if (nonce > 1e6) {
          throw new Error("SHA256 PoW timeout");
        }
      }
    }
    if (algorithm === "DeepSeekHashV1") {
      const instance = await this.getWasmInstance();
      const exports = instance.exports;
      const memory = exports.memory;
      const alloc = exports.__wbindgen_export_0;
      const add_to_stack = exports.__wbindgen_add_to_stack_pointer;
      const wasm_solve = exports.wasm_solve;
      const prefix = `${salt}_${expire_at}_`;
      const challengeStr = target;
      const encodeString = (str) => {
        const buf = Buffer.from(str, "utf8");
        const ptr = alloc(buf.length, 1);
        new Uint8Array(memory.buffer).set(buf, ptr);
        return [ptr, buf.length];
      };
      const [ptrC, lenC] = encodeString(challengeStr);
      const [ptrP, lenP] = encodeString(prefix);
      const retptr = add_to_stack(-16);
      const start = Date.now();
      wasm_solve(retptr, ptrC, lenC, ptrP, lenP, difficulty);
      const end = Date.now();
      const view = new DataView(memory.buffer);
      const status = view.getInt32(retptr, true);
      const answer = view.getFloat64(retptr + 8, true);
      add_to_stack(16);
      if (status === 0) {
        throw new Error("DeepSeekHashV1 failed to find solution");
      }
      console.log(
        `[DeepSeekWebClient] DeepSeekHashV1 solved in ${end - start}ms, answer: ${answer}`
      );
      return answer;
    }
    throw new Error(`Unsupported PoW algorithm: ${algorithm}`);
  }
  async createChatSession() {
    const targetPath = "/api/v0/chat_session/create";
    const res = await fetch(`https://chat.deepseek.com${targetPath}`, {
      method: "POST",
      headers: await this.fetchHeaders(),
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[DeepSeekWebClient] Failed to create chat session: ${res.status}`, errorText);
      throw new Error(`Failed to create chat session: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    const sessionId = data.data?.biz_data?.id || data.data?.biz_data?.chat_session_id || "";
    console.log(`[DeepSeekWebClient] Chat session created: ${sessionId}`);
    return {
      biz_id: data.data?.biz_data?.biz_id || "",
      title: data.data?.biz_data?.title || "",
      ...data.data?.biz_data,
      chat_session_id: sessionId
    };
  }
  async chatCompletions(params) {
    const targetPath = "/api/v0/chat/completion";
    const challenge = await this.createPowChallenge(targetPath);
    const answer = await this.solvePow(challenge);
    const powResponse = Buffer.from(
      JSON.stringify({
        ...challenge,
        answer,
        target_path: targetPath
      })
    ).toString("base64");
    console.log(
      `[DeepSeekWebClient] Sending chat completion request (session: ${params.sessionId})...`
    );
    const res = await fetch(`https://chat.deepseek.com${targetPath}`, {
      method: "POST",
      headers: {
        ...await this.fetchHeaders(),
        "x-ds-pow-response": powResponse
      },
      body: JSON.stringify({
        chat_session_id: params.sessionId,
        parent_message_id: params.parentMessageId ?? null,
        prompt: params.message,
        ref_file_ids: params.fileIds || [],
        thinking_enabled: !(params.model === "deepseek-chat" && !params.model?.includes("reasoning")),
        // Default to true unless specifically chat-only
        search_enabled: params.searchEnabled ?? true,
        preempt: params.preempt ?? false
      }),
      signal: params.signal
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[DeepSeekWebClient] Chat completion request failed: ${res.status}`, errorText);
      if (res.status === 401 || res.status === 403) {
        throw new Error(`DeepSeek \u767B\u5F55\u5DF2\u8FC7\u671F\uFF08HTTP ${res.status}\uFF09\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55 chat.deepseek.com`);
      }
      throw new Error(`Chat completion failed: ${res.status} ${errorText}`);
    }
    console.log(
      `[DeepSeekWebClient] Chat completion response OK (status: ${res.status}). Content-Type: ${res.headers.get("content-type")}`
    );
    return res.body;
  }
  async uploadFile(fileData, fileName) {
    const targetPath = "/api/v0/file/upload_file";
    const challenge = await this.createPowChallenge(targetPath);
    const answer = await this.solvePow(challenge);
    const powResponse = Buffer.from(
      JSON.stringify({
        ...challenge,
        answer,
        target_path: targetPath
      })
    ).toString("base64");
    const formData = new globalThis.FormData();
    formData.append(
      "file",
      new globalThis.Blob([fileData]),
      fileName
    );
    const res = await fetch(`https://chat.deepseek.com${targetPath}`, {
      method: "POST",
      headers: {
        ...await this.fetchHeaders(),
        "x-ds-pow-response": powResponse,
        "x-file-size": fileData.length.toString()
      },
      body: formData
    });
    if (!res.ok) {
      throw new Error(`File upload failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const fileId = data.data.biz_data.id;
    let attempts = 0;
    while (attempts < 30) {
      const pollRes = await fetch(
        `https://chat.deepseek.com/api/v0/file/fetch_files?file_ids=${fileId}`,
        {
          headers: await this.fetchHeaders()
        }
      );
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        const file = pollData.data.biz_data.files[0];
        if (file?.status === "SUCCESS") {
          return fileId;
        }
        if (file?.status === "FAILED") {
          throw new Error(`File parsing failed for ${fileId}`);
        }
      }
      await new Promise((r) => setTimeout(r, 2e3));
      attempts++;
    }
    return fileId;
  }
  async discoverModels() {
    const baseModels = [
      {
        id: "deepseek-chat",
        name: "DeepSeek V3",
        reasoning: false,
        input: ["text"],
        cost: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0
        },
        contextWindow: 64e3,
        maxTokens: 4096
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek R1",
        reasoning: true,
        input: ["text"],
        maxTokens: 4096,
        cost: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0
        },
        contextWindow: 64e3
      }
    ];
    const models = [...baseModels];
    for (const m of baseModels) {
      models.push({
        ...m,
        id: `${m.id}-search`,
        name: `${m.name} (Search)`
      });
    }
    return models;
  }
};

// src/zero-token/streams/deepseek-web-stream.ts
function stripForWebProvider2(prompt) {
  return prompt;
}
var sessionMap2 = /* @__PURE__ */ new Map();
var parentMessageMap2 = /* @__PURE__ */ new Map();
function createDeepseekWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    if (typeof parsed === "string") {
      options = { cookie: parsed };
    } else {
      options = parsed;
    }
  } catch {
    options = { cookie: cookieOrJson };
  }
  const client = new DeepSeekWebClient(options);
  return (model, context, options2) => {
    const stream = createAssistantMessageEventStream3();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let dsSessionId = sessionMap2.get(sessionKey);
        let parentId = parentMessageMap2.get(sessionKey);
        if (!dsSessionId) {
          const session = await client.createChatSession();
          dsSessionId = session.chat_session_id || "";
          sessionMap2.set(sessionKey, dsSessionId);
          parentId = void 0;
        }
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const contextKeys = Object.keys(context).join(",");
        const toolsRaw = context.tools;
        const toolCount = Array.isArray(toolsRaw) ? toolsRaw.length : typeof toolsRaw;
        console.log(
          `[DeepseekWebStream] Context messages count: ${messages.length}, hasSystemPrompt: ${!!systemPrompt}, context.tools=${toolCount}, contextKeys=${contextKeys}`
        );
        let prompt = "";
        let toolPrompt = "";
        const forceFirstTurn = (context.tools || []).length > 0;
        if (!parentId || forceFirstTurn) {
          const historyParts = [];
          const tools = context.tools || [];
          let systemPromptContent = systemPrompt;
          if (tools.length > 0) {
            toolPrompt = '\n\n[CRITICAL TOOL CALLING INSTRUCTION]\nYou have tools available. To call ANY tool, you MUST output this EXACT XML format:\n<tool_call id="unique_id" name="tool_name">{"param1": "value1", "param2": "value2"}</tool_call>\n\nExamples:\n<tool_call id="call_1" name="read">{"file_path": "D:\\\\Users\\\\111\\\\Desktop\\\\\u6587\u4EF6\u5939\\\\111.txt"}</tool_call>\n<tool_call id="call_2" name="write">{"file_path": "D:\\\\Users\\\\111\\\\Desktop\\\\\u6587\u4EF6\u5939\\\\111.txt", "content": "Hello World"}</tool_call>\n<tool_call id="call_3" name="exec">{"command": "echo hello"}</tool_call>\n<tool_call id="call_4" name="exec">{"command": "python D:\\\\Users\\\\111\\\\Desktop\\\\hello.py"}</tool_call>\n\nRULES:\n1. Only use tools when the user EXPLICITLY requests file/system operations (create file, read file, run command, edit file, etc.). For questions, code writing, explanations, etc., reply directly in text WITHOUT calling any tool.\n2. ABSOLUTELY NO self-talk, reasoning, or planning. NEVER output "The user wants...", "Let me try...", etc.\n3. When calling a tool, output ONLY the <tool_call> XML tag. NOTHING else.\n4. After receiving a tool result, respond with a brief confirmation ONLY.\n5. For creating files with content, use the write tool. For creating empty files on Windows, use exec with New-Item.\n6. ALWAYS reply in the SAME language the user used. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u4F60\u5FC5\u987B\u5168\u7A0B\u7528\u4E2D\u6587\u56DE\u590D\u3002\n7. If a tool call fails, try a different approach silently.\n8. When user asks to run/execute a file or program, use the exec tool (e.g. exec with "python file.py", "node file.js", "code file.py"). NEVER tell the user to run it manually.';
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            console.log(
              `[DeepseekWebStream] Prepending separate systemPrompt (length=${systemPromptContent.length})`
            );
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            if (m.role === "user" && content) {
              content = stripForWebProvider2(content) || content;
            }
            console.log(
              `[DeepseekWebStream] Message[${messages.indexOf(m)}] role=${m.role} length=${content.length} preview=${content.slice(0, 50).replace(/\n/g, " ")}`
            );
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = stripForWebProvider2(lastUserMessage.content) || lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                const raw = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
                prompt = stripForWebProvider2(raw) || raw;
              }
            }
          }
        }
        const toolsAvailable = (context.tools || []).length > 0;
        if (toolsAvailable) {
          if (parentId) {
            prompt += `

[CRITICAL TOOL CALLING INSTRUCTION]
To call ANY tool, you MUST output this EXACT XML format:
<tool_call id="unique_id" name="tool_name">{"param1": "value1"}</tool_call>

Examples:
<tool_call id="call_1" name="exec">{"command": "python hello.py"}</tool_call>
<tool_call id="call_2" name="write">{"file_path": "path", "content": "text"}</tool_call>

RULES: Only use tools for explicit file/system operations. When user asks to run a file, use exec. No self-talk. Reply in user's language. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u7528\u4E2D\u6587\u56DE\u590D\u3002`;
          } else {
            prompt += `

[IMPORTANT REMINDER] Tool format: <tool_call id="call_1" name="tool_name">{"param": "value"}</tool_call>
Only use tools for explicit file/system operations. When user asks to run/execute a file, use exec tool.
No self-talk. Reply in user's language. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u7528\u4E2D\u6587\u56DE\u590D\u3002`;
          }
        }
        console.log(
          `[DeepseekWebStream] Starting run for session: ${sessionKey}. DS session: ${dsSessionId}. Parent: ${parentId}. Prompt length: ${prompt.length}. isContinuing: ${!!parentId}`
        );
        if (!prompt) {
          console.error(`[DeepseekWebStream] No prompt to send:`, JSON.stringify(messages));
          throw new Error("No message found to send to DeepSeek web API");
        }
        const searchEnabled = options2?.searchEnabled ?? true;
        const preempt = options2?.preempt ?? false;
        const fileIds = options2?.fileIds || [];
        if (forceFirstTurn && parentId) {
          console.log(`[DeepseekWebStream] Force first-turn mode: creating new session for tool-enabled request`);
          const newSession = await client.createChatSession();
          dsSessionId = newSession.chat_session_id || "";
          sessionMap2.set(sessionKey, dsSessionId);
          parentId = void 0;
        }
        const responseStream = await client.chatCompletions({
          sessionId: dsSessionId,
          parentMessageId: parentId,
          message: prompt,
          model: model.id,
          searchEnabled,
          preempt,
          fileIds,
          signal: options2?.signal
        });
        if (!responseStream) {
          throw new Error("DeepSeek Web API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let accumulatedReasoning = "";
        const accumulatedToolCalls = [];
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = !!accumulatedReasoning;
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                type: "tool_call",
                name: currentToolName,
                arguments: "",
                index: currentToolIndex,
                id: toolId
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            accumulatedContent += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            accumulatedReasoning += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (delta.includes("tool_call") || delta.includes("<tool") || delta.includes("</tool")) {
            console.log(`[DeepseekWebStream] TOOL TAG in delta: "${delta.slice(0, 200)}", mode=${currentMode}, tagBufferLen=${tagBuffer.length}`);
          }
          const JUNK_TOKENS = ["<\uFF5Cend\u2581of\u2581thinking\uFF5C>", "<|endoftext|>"];
          if (JUNK_TOKENS.includes(delta)) {
            console.log(`[DeepseekWebStream] Filtering junk token: ${delta}`);
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStartMatch = tagBuffer.match(/<(?:think(?:ing)?|thought)\b[^<>]*>/i);
            const thinkEndMatch = tagBuffer.match(/<\/(?:think(?:ing)?|thought)\b[^<>]*>/i);
            const finalStartMatch = tagBuffer.match(/<final\b[^<>]*>/i);
            const finalEndMatch = tagBuffer.match(/<\/final\b[^<>]*>/i);
            const toolCallStartMatch = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEndMatch = tagBuffer.match(/<\/tool_call\b[^<>]*>/i);
            const replyMatch = tagBuffer.match(/\[\[reply_to_current\]\]/i);
            const malformedThinkMatch = tagBuffer.match(/\n?think\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStartMatch ? thinkStartMatch.index : -1,
                len: thinkStartMatch ? thinkStartMatch[0].length : 0
              },
              {
                type: "think_end",
                idx: thinkEndMatch ? thinkEndMatch.index : -1,
                len: thinkEndMatch ? thinkEndMatch[0].length : 0
              },
              {
                type: "final_start",
                idx: finalStartMatch ? finalStartMatch.index : -1,
                len: finalStartMatch ? finalStartMatch[0].length : 0
              },
              {
                type: "final_end",
                idx: finalEndMatch ? finalEndMatch.index : -1,
                len: finalEndMatch ? finalEndMatch[0].length : 0
              },
              {
                type: "tool_call_start",
                idx: toolCallStartMatch ? toolCallStartMatch.index : -1,
                len: toolCallStartMatch ? toolCallStartMatch[0].length : 0,
                id: toolCallStartMatch ? toolCallStartMatch[1] || toolCallStartMatch[3] : null,
                name: toolCallStartMatch ? toolCallStartMatch[2] : ""
              },
              {
                type: "tool_call_end",
                idx: toolCallEndMatch ? toolCallEndMatch.index : -1,
                len: toolCallEndMatch ? toolCallEndMatch[0].length : 0
              },
              {
                type: "reply_marker",
                idx: replyMatch ? replyMatch.index : -1,
                len: replyMatch ? replyMatch[0].length : 0
              },
              {
                type: "think_start",
                // Treat malformed think> as start
                idx: malformedThinkMatch ? malformedThinkMatch.index : -1,
                len: malformedThinkMatch ? malformedThinkMatch[0].length : 0
              }
            ].filter((tag) => tag.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              console.log(`[DeepseekWebStream] Tag detected: ${first.type} at ${first.idx}`);
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "final_start") {
                currentMode = "text";
              } else if (first.type === "final_end") {
                currentMode = "text";
              } else if (first.type === "reply_marker") {
                currentMode = "text";
              } else if (first.type === "tool_call_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                const toolId = first.id || `call_${Date.now()}_${currentToolIndex}`;
                emitDelta("toolcall", "", toolId);
              } else if (first.type === "tool_call_end") {
                const key = `tool_${currentToolIndex}`;
                const index = indexMap.get(key);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  try {
                    part.arguments = JSON.parse(argStr);
                  } catch {
                    part.arguments = { raw: argStr };
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
                currentToolName = "";
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", tagBuffer);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", tagBuffer);
                } else {
                  emitDelta("text", tagBuffer);
                }
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                if (currentMode === "thinking") {
                  emitDelta("thinking", safe);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", safe);
                } else {
                  emitDelta("text", safe);
                }
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line) {
            return;
          }
          if (line.startsWith("event: ")) {
            return;
          }
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              return;
            }
            if (!dataStr) {
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (parentId) {
                console.log(`[DeepseekWebStream] CONTINUING SSE: ${dataStr.slice(0, 300)}`);
              }
              if (data.response_message_id) {
                if (data.response_message_id !== parentMessageMap2.get(sessionKey)) {
                  console.log(
                    `[DeepseekWebStream] New parentMessageId: ${data.response_message_id}`
                  );
                  parentMessageMap2.set(sessionKey, data.response_message_id);
                }
              }
              if ((data.p?.includes("reasoning") || data.type === "thinking") && typeof data.v === "string") {
                pushDelta(data.v, "thinking");
                return;
              }
              if (data.type === "thinking" && typeof data.content === "string") {
                pushDelta(data.content, "thinking");
                return;
              }
              if (typeof data.v === "string" && (!data.p || data.p.includes("content") || data.p.includes("choices"))) {
                pushDelta(data.v);
                return;
              }
              if (data.type === "text" && typeof data.content === "string") {
                pushDelta(data.content);
                return;
              }
              if (data.type === "search_result" || data.p?.includes("search_results")) {
                const searchData = data.v || data.content;
                const query = typeof searchData === "string" ? searchData : searchData?.query;
                if (query) {
                  const searchMsg = `
> [Researching: ${query}...]
`;
                  if (currentMode === "thinking") {
                    emitDelta("thinking", searchMsg);
                  } else {
                    emitDelta("text", searchMsg);
                  }
                }
                return;
              }
              const fragments = data.v?.response?.fragments;
              if (Array.isArray(fragments)) {
                for (const frag of fragments) {
                  if (frag.type === "THINKING" || frag.type === "reasoning") {
                    pushDelta(frag.content || "", "thinking");
                  } else if (frag.content) {
                    pushDelta(frag.content);
                  }
                }
                return;
              }
              const choice = data.choices?.[0];
              if (choice) {
                if (choice.delta?.reasoning_content) {
                  pushDelta(choice.delta.reasoning_content, "thinking");
                }
                if (choice.delta?.content) {
                  pushDelta(choice.delta.content);
                }
              }
            } catch {
            }
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            if (tagBuffer) {
              const mode = currentMode;
              if (mode === "thinking") {
                emitDelta("thinking", tagBuffer);
              } else if (mode === "tool_call") {
                emitDelta("toolcall", tagBuffer);
              } else {
                emitDelta("text", tagBuffer);
              }
              tagBuffer = "";
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        console.log(
          `[DeepseekWebStream] Stream completed. Content: ${accumulatedContent.length}, reasoning: ${accumulatedReasoning.length}, toolCalls: ${accumulatedToolCalls.length}`
        );
        const INTERNAL_TOOLS = /* @__PURE__ */ new Set(["web_search"]);
        const finalContent = contentParts.filter((part) => {
          if (part.type === "toolCall") {
            return !INTERNAL_TOOLS.has(part.name);
          }
          if (part.type === "thinking" && !part.thinking) {
            return false;
          }
          if (part.type === "text" && !part.text) {
            return false;
          }
          return true;
        });
        const assistantMessage = {
          role: "assistant",
          content: finalContent,
          stopReason: finalContent.some((p) => p.type === "toolCall") ? "toolUse" : "stop",
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          timestamp: Date.now()
        };
        assistantMessage.thinking_enabled = !!accumulatedReasoning;
        stream.push({
          type: "done",
          reason: assistantMessage.stopReason,
          message: assistantMessage
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/doubao-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream4
} from "@mariozechner/pi-ai";

// src/zero-token/providers/doubao-web-client-browser.ts
init_shared_browser();
import crypto4 from "node:crypto";
var DoubaoWebClientBrowser = class {
  sessionid;
  ttwid;
  cookie;
  userAgent;
  baseUrl = "https://www.doubao.com";
  browser = null;
  page = null;
  running = null;
  conversationId = null;
  // 复用对话 ID
  constructor(options) {
    if (typeof options === "string") {
      const parsed = JSON.parse(options);
      this.sessionid = parsed.sessionid;
      this.ttwid = parsed.ttwid;
      this.cookie = parsed.cookie || this.buildCookieString(parsed.sessionid, parsed.ttwid);
      this.userAgent = parsed.userAgent || "Mozilla/5.0";
    } else {
      this.sessionid = options.sessionid;
      this.ttwid = options.ttwid;
      this.cookie = options.cookie || this.buildCookieString(options.sessionid, options.ttwid);
      this.userAgent = options.userAgent || "Mozilla/5.0";
    }
    if (!this.sessionid) {
      throw new Error("Doubao sessionid is required");
    }
    if (!this.cookie) {
      throw new Error("Doubao cookie could not be built");
    }
  }
  buildCookieString(sessionid, ttwid) {
    if (!sessionid) {
      return "";
    }
    if (ttwid) {
      return `sessionid=${sessionid}; ttwid=${ttwid}`;
    }
    return `sessionid=${sessionid}`;
  }
  async ensureBrowser() {
    if (this.browser && this.page) {
      return { browser: this.browser, page: this.page };
    }
    const { context, page } = await getSharedBrowser("Doubao Web Browser", "https://www.doubao.com/chat/");
    this.browser = context;
    this.page = page;
    const cookies = this.cookie.split(";").map((c) => {
      const [name, ...valueParts] = c.trim().split("=");
      return {
        name: name.trim(),
        value: valueParts.join("=").trim(),
        domain: ".doubao.com",
        path: "/"
      };
    });
    await this.browser.addCookies(cookies);
    return { browser: this.browser, page: this.page };
  }
  async init() {
    await this.ensureBrowser();
  }
  /** 将多轮消息合并为 samantha 接口需要的单条 content（纯文本） */
  mergeMessagesForSamantha(messages) {
    return messages.map((m) => {
      const role = m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system";
      return `<|im_start|>${role}
${m.content}
`;
    }).join("") + "<|im_end|>\n";
  }
  async chatCompletions(params) {
    const { page } = await this.ensureBrowser();
    const modelId = params.model || "doubao-seed-2.0";
    const text = this.mergeMessagesForSamantha(params.messages);
    console.log(`[Doubao Web Browser] Sending message`);
    console.log(`[Doubao Web Browser] Model: ${modelId}`);
    console.log(`[Doubao Web Browser] Messages count: ${params.messages.length}`);
    const requestBody = {
      messages: [
        {
          content: JSON.stringify({ text }),
          content_type: 2001,
          attachments: [],
          references: []
        }
      ],
      completion_option: {
        is_regen: false,
        with_suggest: true,
        need_create_conversation: !this.conversationId,
        // 如果已有 conversation_id 则不复创建
        launch_stage: 1,
        is_replace: false,
        is_delete: false,
        message_from: 0,
        event_id: "0"
      },
      conversation_id: this.conversationId || "0",
      // 复用已有的 conversation_id
      local_conversation_id: `local_16${Date.now().toString().slice(-14)}`,
      local_message_id: crypto4.randomUUID()
    };
    const responseData = await page.evaluate(
      async ({ baseUrl, body }) => {
        const params2 = new URLSearchParams({
          aid: "497858",
          device_platform: "web",
          language: "zh",
          pkg_type: "release_version",
          real_aid: "497858",
          region: "CN",
          samantha_web: "1",
          sys_region: "CN",
          use_olympus_account: "1",
          version_code: "20800"
        });
        const url = `${baseUrl}/samantha/chat/completion?${params2.toString()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Referer: "https://www.doubao.com/chat/",
            Origin: "https://www.doubao.com",
            "Agw-js-conv": "str"
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const errorText = await res.text();
          return { ok: false, status: res.status, error: errorText };
        }
        const reader = res.body?.getReader();
        if (!reader) {
          return { ok: false, status: 500, error: "No response body" };
        }
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          fullText += decoder.decode(value, { stream: true });
        }
        return { ok: true, data: fullText };
      },
      { baseUrl: this.baseUrl, body: requestBody }
    );
    console.log(
      `[Doubao Web Browser] Message response: ${responseData.ok ? 200 : responseData.status}`
    );
    if (!responseData.ok) {
      console.error(
        `[Doubao Web Browser] Message failed: ${responseData.status} - ${responseData.error}`
      );
      if (responseData.status === 401) {
        throw new Error(
          "Authentication failed. Please re-run onboarding to refresh your Doubao session."
        );
      }
      throw new Error(`Doubao API error: ${responseData.status}`);
    }
    console.log(
      `[Doubao Web Browser] Response data length: ${responseData.data?.length || 0} bytes`
    );
    console.log(`[Doubao Web Browser] Response data preview: ${responseData.data?.slice(0, 500)}`);
    if (!this.conversationId && responseData.data) {
      try {
        const lines = responseData.data.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:") && line.includes("conversation_id")) {
            const match = line.match(/"conversation_id"\s*:\s*"([^"]+)"/);
            if (match && match[1] && match[1] !== "0") {
              this.conversationId = match[1];
              console.log(`[Doubao Web Browser] Captured conversation_id: ${this.conversationId}`);
              break;
            }
          }
        }
      } catch (e) {
        console.log(`[Doubao Web Browser] Could not extract conversation_id: ${e}`);
      }
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseData.data));
        controller.close();
      }
    });
    return stream;
  }
  async close() {
    await releaseSharedBrowser();
    this.browser = null;
    this.page = null;
  }
  async discoverModels() {
    return [
      {
        id: "doubao-seed-2.0",
        name: "Doubao-Seed 2.0",
        api: "doubao-web",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 64e3,
        maxTokens: 8192
      }
    ];
  }
};

// src/zero-token/streams/doubao-web-stream.ts
var sessionMap3 = /* @__PURE__ */ new Map();
function createDoubaoWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, sessionid: "" };
  }
  const client = new DoubaoWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream4();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let sessionId = sessionMap3.get(sessionKey);
        const messages = context.messages || [];
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = '\n\n[CRITICAL TOOL CALLING INSTRUCTION]\nYou have tools available. To call ANY tool, you MUST output this EXACT XML format:\n<tool_call id="unique_id" name="tool_name">{"param1": "value1", "param2": "value2"}</tool_call>\n\nExamples:\n<tool_call id="call_1" name="read">{"file_path": "D:\\\\Users\\\\111\\\\Desktop\\\\\u6587\u4EF6\u5939\\\\111.txt"}</tool_call>\n<tool_call id="call_2" name="exec">{"command": "echo hello > test.txt"}</tool_call>\n<tool_call id="call_3" name="write">{"file_path": "D:\\\\Users\\\\111\\\\Desktop\\\\\u6587\u4EF6\u5939\\\\111.txt", "content": "Hello World"}</tool_call>\n\nIMPORTANT: You CAN and SHOULD use tools to perform actions. Do NOT say you cannot do something - use the tools! Plain text descriptions will NOT execute. You MUST use the XML format above.';
        }
        let prompt = "";
        if (!sessionId) {
          const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
          if (lastUserMessage) {
            if (typeof lastUserMessage.content === "string") {
              prompt = lastUserMessage.content;
            } else if (Array.isArray(lastUserMessage.content)) {
              prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
            }
          }
          if (toolPrompt && prompt) {
            prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>.';
          }
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        if (toolPrompt && sessionId) {
          prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>. Using plain text to describe your action will FAIL to execute the tool.';
        }
        if (!prompt) {
          throw new Error("No message found to send to DoubaoWeb API");
        }
        console.log(`[DoubaoWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[DoubaoWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[DoubaoWebStream] Tools available: ${tools.length}`);
        console.log(`[DoubaoWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          messages: [{ role: "user", content: prompt }],
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("DoubaoWeb API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        let textBuffer = "";
        const textFlushThreshold = 20;
        const flushTextBuffer = () => {
          if (!textBuffer) {
            return;
          }
          const text = textBuffer;
          textBuffer = "";
          emitDelta("text", text);
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          tagBuffer += delta;
          if (forceType === "thinking" || currentMode === "thinking") {
            flushTextBuffer();
            emitDelta("thinking", delta);
            if (forceType === "thinking") {
              tagBuffer = "";
              return;
            }
          }
          if (currentMode === "tool_call") {
            flushTextBuffer();
            emitDelta("toolcall", delta);
          } else {
            textBuffer += delta;
            if (textBuffer.length >= textFlushThreshold) {
              flushTextBuffer();
            }
          }
          let prevTagLen = tagBuffer.length - delta.length;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                flushTextBuffer();
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[Doubao Stream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              prevTagLen = 0;
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                textBuffer += tagBuffer.slice(prevTagLen);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                textBuffer += safe;
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const extractDeltaFromJson = (data) => {
          if (data.sessionId) {
            sessionMap3.set(sessionKey, data.sessionId);
          }
          if (data.conversation_id && data.conversation_id !== "0") {
            sessionMap3.set(sessionKey, data.conversation_id);
          }
          let delta = "";
          if (data.event_type === 2003 && data.event_data) {
            try {
              const eventData = JSON.parse(data.event_data);
              delta = eventData.text || eventData.content || eventData.delta || "";
            } catch {
              delta = data.event_data;
            }
          } else if (data.event_data) {
            try {
              const eventData = typeof data.event_data === "string" ? JSON.parse(data.event_data) : data.event_data;
              delta = eventData.text || eventData.content || eventData.delta || eventData.message?.content || "";
            } catch {
            }
          }
          if (!delta) {
            delta = data.choices?.[0]?.delta?.content ?? data.text ?? data.content ?? data.delta ?? "";
          }
          return typeof delta === "string" ? delta : "";
        };
        const parseJsonObjects = (str) => {
          const results = [];
          let i = 0;
          while (i < str.length) {
            while (i < str.length && /\s/.test(str[i])) {
              i++;
            }
            if (i >= str.length) {
              break;
            }
            if (str[i] !== "{") {
              i++;
              continue;
            }
            let depth = 0;
            let start = i;
            let inString = false;
            let escape = false;
            for (; i < str.length; i++) {
              const c = str[i];
              if (escape) {
                escape = false;
                continue;
              }
              if (c === "\\") {
                escape = true;
                continue;
              }
              if (c === '"') {
                inString = !inString;
                continue;
              }
              if (inString) {
                continue;
              }
              if (c === "{") {
                depth++;
              }
              if (c === "}") {
                depth--;
                if (depth === 0) {
                  i++;
                  break;
                }
              }
            }
            if (depth === 0) {
              const jsonStr = str.slice(start, i);
              try {
                const obj = JSON.parse(jsonStr);
                if (obj && typeof obj === "object") {
                  results.push(obj);
                }
              } catch {
              }
            }
          }
          return results;
        };
        const processLine = (line) => {
          if (!line) {
            return;
          }
          let dataStr;
          if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          } else {
            dataStr = line.trim();
          }
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          if (dataStr.includes('"suggest"') || dataStr === "{}") {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            const delta = extractDeltaFromJson(data);
            if (delta) {
              pushDelta(delta);
            }
            return;
          } catch {
          }
          const objects = parseJsonObjects(dataStr);
          const seen = /* @__PURE__ */ new Set();
          for (const obj of objects) {
            if ("suggest" in obj || Object.keys(obj).length === 0) {
              continue;
            }
            const delta = extractDeltaFromJson(obj);
            if (delta && !seen.has(delta)) {
              seen.add(delta);
              pushDelta(delta);
            }
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          if (mode === "text") {
            textBuffer += tagBuffer;
          } else {
            flushTextBuffer();
            emitDelta(mode, tagBuffer);
          }
        }
        flushTextBuffer();
        console.log(
          `[DoubaoWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/gemini-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream5
} from "@mariozechner/pi-ai";

// src/zero-token/providers/gemini-web-client-browser.ts
init_shared_browser();
var GeminiWebClientBrowser = class {
  options;
  browser = null;
  context = null;
  page = null;
  initialized = false;
  constructor(options) {
    this.options = options;
  }
  parseCookies() {
    return this.options.cookie.split(";").filter((c) => c.trim().includes("=")).map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return {
        name: name?.trim() ?? "",
        value: valueParts.join("=").trim(),
        domain: ".google.com",
        path: "/"
      };
    }).filter((c) => c.name.length > 0);
  }
  async init() {
    if (this.initialized) {
      return;
    }
    const { context, page } = await getSharedBrowser("Gemini Web Browser", "https://gemini.google.com/app");
    this.context = context;
    this.page = page;
    const cookies = this.parseCookies();
    if (cookies.length > 0) {
      try {
        await this.context.addCookies(cookies);
      } catch (e) {
        console.warn("[Gemini Web Browser] Failed to add some cookies:", e);
      }
    }
    this.initialized = true;
  }
  /**
   * DOM 模拟：通过真实浏览器交互发送消息，绕过 Bard RPC 协议复杂度
   */
  async chatCompletionsViaDOM(params) {
    if (!this.page) {
      throw new Error("GeminiWebClientBrowser not initialized");
    }
    const sent = await this.page.evaluate((msg) => {
      const inputSelectors = [
        '[placeholder*="Gemini"]',
        '[placeholder*="\u95EE\u95EE"]',
        '[data-placeholder*="Gemini"]',
        '[contenteditable="true"]',
        'div[role="textbox"]',
        "textarea",
        '[aria-label*="message"]',
        '[aria-label*="prompt"]'
      ];
      let inputEl = null;
      for (const sel of inputSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) {
          inputEl = el;
          break;
        }
      }
      if (!inputEl) {
        return { ok: false, error: "\u627E\u4E0D\u5230\u8F93\u5165\u6846" };
      }
      inputEl.focus();
      if (inputEl.tagName === "TEXTAREA" || inputEl.tagName === "INPUT") {
        inputEl.value = msg;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        inputEl.innerText = msg;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const sendSelectors = [
        'button[aria-label*="Send"]',
        'button[aria-label*="send"]',
        'button[aria-label*="\u63D0\u4EA4"]',
        'button[aria-label*="\u53D1\u9001"]',
        'button[type="submit"]',
        'button[data-icon="send"]',
        'button[data-testid*="send"]',
        "form button[type=submit]",
        'button[class*="send"]',
        '[aria-label*="Send message"]',
        ".send-button"
      ];
      let sendBtn = null;
      for (const sel of sendSelectors) {
        sendBtn = document.querySelector(sel);
        if (sendBtn && !sendBtn.disabled) {
          break;
        }
      }
      if (sendBtn) {
        sendBtn.click();
        return { ok: true };
      }
      const formSubmit = inputEl.closest("form")?.querySelector("button[type=submit]");
      if (formSubmit) {
        formSubmit.click();
        return { ok: true };
      }
      inputEl.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true
        })
      );
      return { ok: true };
    }, params.message);
    if (!sent.ok) {
      throw new Error(`Gemini DOM \u6A21\u62DF\u5931\u8D25: ${sent.error}`);
    }
    console.log("[Gemini Web Browser] DOM \u6A21\u62DF\u5DF2\u53D1\u9001\uFF0C\u8F6E\u8BE2\u7B49\u5F85\u56DE\u590D...");
    const maxWaitMs = 12e4;
    const pollIntervalMs = 2e3;
    let lastText = "";
    let stableCount = 0;
    const signal = params.signal;
    for (let elapsed = 0; elapsed < maxWaitMs; elapsed += pollIntervalMs) {
      if (signal?.aborted) {
        throw new Error("Gemini \u8BF7\u6C42\u5DF2\u53D6\u6D88");
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      const result = await this.page.evaluate(() => {
        const clean = (t) => t.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        const skipTexts = [
          "Ask Gemini",
          "\u95EE\u95EE Gemini",
          "Enter a prompt",
          "\u8F93\u5165\u63D0\u793A",
          "\u9700\u8981\u6211\u4E3A\u4F60\u505A\u4E9B\u4EC0\u4E48",
          "\u53D1\u8D77\u65B0\u5BF9\u8BDD",
          "\u6211\u7684\u5185\u5BB9",
          "\u8BBE\u7F6E\u548C\u5E2E\u52A9",
          "\u5236\u4F5C\u56FE\u7247",
          "\u521B\u4F5C\u97F3\u4E50",
          "\u5E2E\u6211\u5B66\u4E60",
          "\u968F\u4FBF\u5199\u70B9\u4EC0\u4E48",
          "\u7ED9\u6211\u7684\u4E00\u5929\u6CE8\u5165\u6D3B\u529B",
          "\u5347\u7EA7\u5230 Google AI Plus",
          "\u6B63\u5728\u52A0\u8F7D"
        ];
        const isGreeting = (t) => /sage[,，]?\s*你好/i.test(t) || t.includes("\u4F60\u597D") && (t.includes("\u9700\u8981") || t.includes("\u505A\u4E9B\u4EC0\u4E48")) || t.startsWith("\u9700\u8981\u6211\u4E3A\u4F60\u505A\u4E9B\u4EC0\u4E48");
        const isSkip = (t) => skipTexts.some((s) => t.includes(s)) || isGreeting(t) || t.length < 20;
        const sidebarRoot = document.querySelector('[aria-label*="\u5BF9\u8BDD"], [class*="sidebar"], nav');
        const notInSidebar = (el) => !sidebarRoot?.contains(el);
        const inputEl = document.querySelector(
          '[contenteditable="true"], textarea, [placeholder*="Gemini"], [placeholder*="\u95EE\u95EE"]'
        );
        const inputRoot = inputEl?.closest("form") ?? inputEl?.closest("[class*='input']") ?? inputEl?.parentElement?.parentElement;
        const notInInputArea = (el) => !inputRoot?.contains(el);
        const main = document.querySelector("main") ?? document.querySelector('[role="main"]') ?? document.querySelector('[class*="chat"]') ?? document.body;
        const scoped = main === document.body ? document : main;
        let text = "";
        const modelSelectors = [
          '[data-message-author="model"]',
          '[data-sender="model"]',
          '[class*="model-turn"]',
          '[class*="modelResponse"]',
          '[class*="assistant-message"]',
          '[class*="response-content"]',
          "article",
          "[class*='markdown']"
        ];
        for (const sel of modelSelectors) {
          const els = scoped.querySelectorAll(sel);
          for (let i = els.length - 1; i >= 0; i--) {
            const el = els[i];
            if (!notInSidebar(el) || !notInInputArea(el)) {
              continue;
            }
            const t = clean(el.textContent ?? "");
            if (t.length >= 30 && !isSkip(t)) {
              text = t;
              break;
            }
          }
          if (text) {
            break;
          }
        }
        if (!text) {
          const candidates = [];
          scoped.querySelectorAll("p, div[class], li, span[class]").forEach((el) => {
            if (!notInSidebar(el) || !notInInputArea(el)) {
              return;
            }
            const t = clean(el.textContent ?? "");
            if (t.length > 50 && !isSkip(t) && !candidates.some((c) => c.text === t)) {
              candidates.push({ el, text: t });
            }
          });
          if (candidates.length > 0) {
            text = candidates[candidates.length - 1].text;
          }
        }
        const stopBtn = document.querySelector('[aria-label*="Stop"], [aria-label*="stop"]');
        const isStreaming = !!stopBtn;
        return { text, isStreaming };
      });
      const minLen = 40;
      if (result.text && result.text.length < minLen && result.text.length > 0) {
        console.log(
          `[Gemini Web Browser] \u5FFD\u7565\u8FC7\u77ED\u5185\u5BB9(${result.text.length}\u5B57): ${result.text.slice(0, 50)}...`
        );
      }
      if (result.text && result.text.length >= minLen) {
        if (result.text !== lastText) {
          lastText = result.text;
          stableCount = 0;
        } else {
          stableCount++;
          if (!result.isStreaming && stableCount >= 2) {
            break;
          }
        }
      }
    }
    if (!lastText) {
      throw new Error(
        "Gemini DOM \u6A21\u62DF\uFF1A\u672A\u68C0\u6D4B\u5230\u56DE\u590D\u3002\u8BF7\u786E\u4FDD gemini.google.com \u9875\u9762\u5DF2\u6253\u5F00\u3001\u5DF2\u767B\u5F55\uFF0C\u4E14\u8F93\u5165\u6846\u53EF\u89C1\u3002"
      );
    }
    const sseLine = `data: ${JSON.stringify({ text: lastText })}
`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseLine));
        controller.close();
      }
    });
  }
  async chatCompletions(params) {
    if (!this.page) {
      throw new Error("GeminiWebClientBrowser not initialized");
    }
    const { message } = params;
    console.log("[Gemini Web Browser] \u4F7F\u7528 DOM \u6A21\u62DF\u53D1\u9001\u6D88\u606F...");
    return this.chatCompletionsViaDOM({
      message,
      signal: params.signal
    });
  }
  async close() {
    await releaseSharedBrowser();
    this.page = null;
    this.context = null;
    this.browser = null;
    this.initialized = false;
  }
};

// src/zero-token/streams/gemini-web-stream.ts
function stripInboundMetaBlocks(text) {
  let result = text;
  result = result.replace(
    /Conversation info \(untrusted metadata\):\s*```json\n[\s\S]*?```\s*/g,
    ""
  );
  result = result.replace(
    /Sender \(untrusted metadata\):\s*```json\n[\s\S]*?```\s*/g,
    ""
  );
  result = result.replace(
    /Thread starter \(untrusted, for context\):\s*```json\n[\s\S]*?```\s*/g,
    ""
  );
  result = result.replace(
    /Replied message \(untrusted, for context\):\s*```json\n[\s\S]*?```\s*/g,
    ""
  );
  result = result.replace(
    /Forwarded message context \(untrusted metadata\):\s*```json\n[\s\S]*?```\s*/g,
    ""
  );
  result = result.replace(
    /Chat history since last reply \(untrusted, for context\):\s*```json\n[\s\S]*?```\s*/g,
    ""
  );
  return result.replace(/\n{3,}/g, "\n\n").trim();
}
function buildXmlToolPromptSection2(tools) {
  if (!tools || tools.length === 0) {
    return "";
  }
  let section = "\n## Available Tools\n";
  for (const tool of tools) {
    section += `- ${tool.name ?? "unknown"}: ${tool.description ?? ""}
`;
  }
  return section;
}
function getXmlToolReminder2() {
  return "\nRemember to use tools when needed.";
}
var conversationMap2 = /* @__PURE__ */ new Map();
function createGeminiWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = typeof parsed === "string" ? { cookie: parsed, userAgent: "Mozilla/5.0" } : parsed;
  } catch {
    options = { cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new GeminiWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream5();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let conversationId = conversationMap2.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        const toolPrompt = buildXmlToolPromptSection2(tools);
        let prompt = "";
        if (tools.length > 0) {
          if (!conversationId) {
            const historyParts = [];
            let systemPromptContent = systemPrompt;
            if (toolPrompt) {
              systemPromptContent += toolPrompt;
            }
            if (systemPromptContent && !messages.some((m) => m.role === "system")) {
              historyParts.push(`System: ${systemPromptContent}`);
            }
            for (const m of messages) {
              const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
              let content = "";
              if (m.role === "toolResult") {
                const tr = m;
                let resultText = "";
                if (Array.isArray(tr.content)) {
                  for (const part of tr.content) {
                    if (part.type === "text") {
                      resultText += part.text;
                    }
                  }
                }
                content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
              } else if (Array.isArray(m.content)) {
                for (const part of m.content) {
                  if (part.type === "text") {
                    content += part.text;
                  } else if (part.type === "toolCall") {
                    const tc = part;
                    content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                  }
                }
              } else {
                content = String(m.content);
              }
              if (m.role === "user" && content) {
                content = stripInboundMetaBlocks(content) || content;
              }
              historyParts.push(`${role}: ${content}`);
            }
            prompt = historyParts.join("\n\n");
          } else {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role === "toolResult") {
              const tr = lastMsg;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
            } else {
              const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
              if (lastUserMessage) {
                if (typeof lastUserMessage.content === "string") {
                  prompt = lastUserMessage.content;
                } else if (Array.isArray(lastUserMessage.content)) {
                  prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
                }
                prompt = stripInboundMetaBlocks(prompt) || prompt;
              }
            }
            if (toolPrompt) {
              prompt += getXmlToolReminder2();
            }
          }
        } else {
          const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
          if (lastUserMessage) {
            if (typeof lastUserMessage.content === "string") {
              prompt = lastUserMessage.content;
            } else if (Array.isArray(lastUserMessage.content)) {
              prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
            }
          }
        }
        if (!prompt) {
          throw new Error("No message found to send to Gemini API");
        }
        const cleanPrompt = stripInboundMetaBlocks(prompt);
        if (!cleanPrompt) {
          throw new Error("No message content to send after stripping metadata");
        }
        console.log(`[GeminiWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[GeminiWebStream] Conversation ID: ${conversationId || "new"}`);
        console.log(
          `[GeminiWebStream] Tools: ${tools.length}, prompt length: ${cleanPrompt.length}`
        );
        const responseStream = await client.chatCompletions({
          conversationId,
          message: cleanPrompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("Gemini API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const contentParts = [];
        const accumulatedToolCalls = [];
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const createPartial = () => ({
          role: "assistant",
          content: [...contentParts],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          timestamp: Date.now()
        });
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta) => {
          if (!delta) {
            return;
          }
          if (tools.length === 0) {
            if (contentParts.length === 0) {
              contentParts[0] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: 0, partial: createPartial() });
            }
            contentParts[0].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: 0,
              delta,
              partial: createPartial()
            });
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "toolcall") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "tool_start") {
                currentMode = "toolcall";
                currentToolName = first.name ?? "";
                emitDelta("toolcall", "", first.id ?? void 0);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  let argStr = accumulatedToolCalls[currentToolIndex]?.arguments ?? "{}";
                  let cleaned = argStr.trim();
                  if (cleaned.startsWith("```json")) {
                    cleaned = cleaned.slice(7);
                  } else if (cleaned.startsWith("```")) {
                    cleaned = cleaned.slice(3);
                  }
                  if (cleaned.endsWith("```")) {
                    cleaned = cleaned.slice(0, -3);
                  }
                  cleaned = cleaned.trim();
                  try {
                    part.arguments = JSON.parse(cleaned);
                  } catch {
                    part.arguments = { raw: argStr };
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
                currentToolName = "";
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "toolcall" ? "toolcall" : "text";
                emitDelta(mode === "toolcall" ? "toolcall" : "text", tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                emitDelta(currentMode === "toolcall" ? "toolcall" : "text", safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.conversation_id) {
              conversationMap2.set(sessionKey, data.conversation_id);
            }
            const delta = data.text || data.content || data.delta;
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tools.length > 0 && tagBuffer) {
          const mode = currentMode;
          if (mode === "toolcall") {
            emitDelta("toolcall", tagBuffer);
          } else {
            emitDelta("text", tagBuffer);
          }
        }
        const stopReason = accumulatedToolCalls.length > 0 ? "toolUse" : "stop";
        const assistantMessage = {
          role: "assistant",
          content: contentParts.length > 0 ? contentParts : [{ type: "text", text: "" }],
          stopReason,
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          timestamp: Date.now()
        };
        stream.push({
          type: "done",
          reason: stopReason,
          message: assistantMessage
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/glm-intl-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream6
} from "@mariozechner/pi-ai";

// src/zero-token/providers/glm-intl-web-client-browser.ts
init_shared_browser();
import crypto5 from "node:crypto";
var SIGN_SECRET = "8a1317a7468aa3ad86e997d08f3f31cb";
function generateSign() {
  const e = Date.now();
  const A = e.toString();
  const t = A.length;
  const o = A.split("").map((c) => Number(c));
  const i = o.reduce((acc, v) => acc + v, 0) - o[t - 2];
  const a = i % 10;
  const timestamp = A.substring(0, t - 2) + a + A.substring(t - 1, t);
  const nonce = crypto5.randomUUID().replace(/-/g, "");
  const sign = crypto5.createHash("md5").update(`${timestamp}-${nonce}-${SIGN_SECRET}`).digest("hex");
  return { timestamp, nonce, sign };
}
var GlmIntlWebClientBrowser = class {
  options;
  browser = null;
  context = null;
  page = null;
  initialized = false;
  accessToken = null;
  deviceId = crypto5.randomUUID().replace(/-/g, "");
  constructor(options) {
    this.options = options;
  }
  parseCookies() {
    return this.options.cookie.split(";").filter((c) => c.trim().includes("=")).map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return {
        name: name?.trim() ?? "",
        value: valueParts.join("=").trim(),
        domain: ".z.ai",
        path: "/"
      };
    }).filter((c) => c.name.length > 0);
  }
  getRefreshToken() {
    const cookies = this.parseCookies();
    const refreshCookieNames = [
      "chatglm_refresh_token",
      "refresh_token",
      "auth_refresh_token",
      "glm_refresh_token",
      "zai_refresh_token"
    ];
    for (const name of refreshCookieNames) {
      const cookie = cookies.find((c) => c.name === name);
      if (cookie?.value) {
        console.log(`[GLM Intl Web Browser] Found refresh token cookie: ${name}`);
        return cookie.value;
      }
    }
    return null;
  }
  getAccessTokenFromCookie() {
    const cookies = this.parseCookies();
    const accessTokenCookieNames = [
      "chatglm_token",
      "access_token",
      "auth_token",
      "glm_token",
      "zai_token",
      "token"
    ];
    for (const name of accessTokenCookieNames) {
      const cookie = cookies.find((c) => c.name === name);
      if (cookie?.value) {
        console.log(`[GLM Intl Web Browser] Found access token cookie: ${name}`);
        return cookie.value;
      }
    }
    return null;
  }
  async init() {
    if (this.initialized) {
      return;
    }
    const { context, page } = await getSharedBrowser("GLM Intl Web Browser", "https://chat.z.ai/");
    this.context = context;
    this.page = page;
    const cookies = this.parseCookies();
    if (cookies.length > 0) {
      try {
        await this.context.addCookies(cookies);
      } catch (e) {
        console.warn("[GLM Intl Web Browser] Failed to add some cookies:", e);
      }
    }
    await this.refreshAccessToken();
    this.initialized = true;
  }
  async refreshAccessToken() {
    const cookieToken = this.getAccessTokenFromCookie();
    if (cookieToken) {
      this.accessToken = cookieToken;
      console.log("[GLM Intl Web Browser] Using chatglm_token from cookies");
      return;
    }
    if (this.context) {
      try {
        const browserCookies = await this.context.cookies(["https://chat.z.ai"]);
        const browserToken = browserCookies.find((c) => c.name === "chatglm_token");
        if (browserToken?.value) {
          this.accessToken = browserToken.value;
          console.log("[GLM Intl Web Browser] Using chatglm_token from browser cookies");
          return;
        }
      } catch {
      }
    }
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || !this.page) {
      console.warn(
        "[GLM Intl Web Browser] No chatglm_token found, will rely on browser cookies for auth"
      );
      return;
    }
    console.log("[GLM Intl Web Browser] Refreshing access token via API...");
    const sign = generateSign();
    const requestId = crypto5.randomUUID().replace(/-/g, "");
    const result = await this.page.evaluate(
      async ({ refreshToken: refreshToken2, deviceId, requestId: requestId2, sign: sign2 }) => {
        try {
          const res = await fetch("https://chat.z.ai/chatglm/user-api/user/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken2}`,
              "App-Name": "chatglm",
              "X-App-Platform": "pc",
              "X-App-Version": "0.0.1",
              "X-Device-Id": deviceId,
              "X-Request-Id": requestId2,
              "X-Sign": sign2.sign,
              "X-Nonce": sign2.nonce,
              "X-Timestamp": sign2.timestamp
            },
            credentials: "include",
            body: JSON.stringify({})
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              return { ok: false, status: res.status, error: `\u767B\u5F55\u5DF2\u8FC7\u671F\uFF08HTTP ${res.status}\uFF09\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55 chat.z.ai` };
            }
            return { ok: false, status: res.status, error: await res.text() };
          }
          const data = await res.json();
          const accessToken = data?.result?.access_token ?? data?.result?.accessToken ?? data?.accessToken;
          if (!accessToken) {
            return {
              ok: false,
              status: 200,
              error: `No accessToken in response: ${JSON.stringify(data).substring(0, 300)}`
            };
          }
          return { ok: true, accessToken };
        } catch (err) {
          return { ok: false, status: 500, error: String(err) };
        }
      },
      { refreshToken, deviceId: this.deviceId, requestId, sign }
    );
    if (result.ok && result.accessToken) {
      this.accessToken = result.accessToken;
      console.log("[GLM Intl Web Browser] Access token refreshed successfully");
    } else {
      console.warn(`[GLM Intl Web Browser] Failed to refresh access token: ${result.error}`);
    }
  }
  async chatCompletions(params) {
    if (!this.page) {
      throw new Error("GlmIntlWebClientBrowser not initialized");
    }
    const page = this.page;
    const model = params.model;
    console.log(`[GLM Intl Web Browser] UI mode send... model=${model}`);
    if (!page.url().includes("chat.z.ai")) {
      await page.goto("https://chat.z.ai/", { waitUntil: "domcontentloaded", timeout: 12e4 });
    }
    const beforeCount = await page.locator(".chat-assistant").count();
    let sent = false;
    const textarea = page.locator("textarea").first();
    if (await textarea.count() > 0) {
      await textarea.click({ timeout: 5e3 });
      await textarea.fill(params.message);
      await textarea.press("Enter");
      sent = true;
    }
    if (!sent) {
      const editable = page.locator('[contenteditable="true"]').first();
      if (await editable.count() > 0) {
        await editable.click({ timeout: 5e3 });
        await page.keyboard.type(params.message, { delay: 5 });
        await page.keyboard.press("Enter");
        sent = true;
      }
    }
    if (!sent) {
      const input = page.locator('input[type="text"]').first();
      if (await input.count() > 0) {
        await input.click({ timeout: 5e3 });
        await input.fill(params.message);
        const sendBtn = page.locator('button.sendMessageButton, button[aria-label*="Send"], button:has-text("\u53D1\u9001")').first();
        if (await sendBtn.count() > 0) {
          await sendBtn.click();
          sent = true;
        } else {
          await input.press("Enter");
          sent = true;
        }
      }
    }
    if (!sent) {
      throw new Error("GLM Intl UI send failed: no chat input found.");
    }
    await page.waitForFunction(
      (prev) => document.querySelectorAll(".chat-assistant").length > prev,
      beforeCount,
      { timeout: 12e4, polling: 500 }
    ).catch(() => {
    });
    const deadline = Date.now() + 12e4;
    let stableRounds = 0;
    let lastText = "";
    while (Date.now() < deadline) {
      const text = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll(".chat-assistant"));
        const latest = nodes[nodes.length - 1];
        return (latest?.innerText ?? "").trim();
      });
      if (text && text === lastText) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
        lastText = text;
      }
      if (lastText && stableRounds >= 3) {
        break;
      }
      await new Promise((r) => setTimeout(r, 900));
    }
    if (!lastText) {
      throw new Error("GLM Intl UI reply capture failed: assistant message not found.");
    }
    const payload = `data: ${JSON.stringify({ text: lastText })}

`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(payload));
        controller.close();
      }
    });
  }
  async close() {
    await releaseSharedBrowser();
    this.page = null;
    this.context = null;
    this.browser = null;
    this.initialized = false;
    this.accessToken = null;
  }
};

// src/zero-token/streams/glm-intl-web-stream.ts
var sessionMap4 = /* @__PURE__ */ new Map();
function createGlmIntlWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new GlmIntlWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream6();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let conversationId = sessionMap4.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = "\n## Available Tools\n";
          for (const tool of tools) {
            toolPrompt += `- ${tool.name}: ${tool.description}
`;
          }
        }
        let prompt = "";
        if (!conversationId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        if (toolPrompt && conversationId) {
          prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>. Using plain text to describe your action will FAIL to execute the tool.';
        }
        if (!prompt) {
          throw new Error("No message found to send to GLM International API");
        }
        console.log(`[GlmIntlWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[GlmIntlWebStream] Conversation ID: ${conversationId || "new"}`);
        console.log(`[GlmIntlWebStream] Tools available: ${tools.length}`);
        console.log(`[GlmIntlWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          conversationId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("GLM International API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[GlmIntlWebStream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.conversation_id) {
              sessionMap4.set(sessionKey, data.conversation_id);
            }
            let delta = "";
            if (data.text) {
              delta = data.text;
            } else if (data.content) {
              delta = data.content;
            } else if (data.delta) {
              delta = data.delta;
            } else if (data.message) {
              delta = data.message;
            } else if (data.parts && Array.isArray(data.parts)) {
              for (const part of data.parts) {
                if (part && typeof part === "object") {
                  const p = part;
                  const content = p.content;
                  if (Array.isArray(content)) {
                    for (const c of content) {
                      if (c && typeof c === "object") {
                        const cc = c;
                        if (cc.type === "text" && typeof cc.text === "string") {
                          delta = cc.text;
                          break;
                        }
                      }
                    }
                  }
                  if (delta) {
                    break;
                  }
                }
              }
            }
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[GlmIntlWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/glm-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream7
} from "@mariozechner/pi-ai";

// src/zero-token/providers/glm-web-client-browser.ts
init_shared_browser();
import crypto6 from "node:crypto";
var ASSISTANT_ID_MAP = {
  "glm-4-plus": "65940acff94777010aa6b796",
  "glm-4": "65940acff94777010aa6b796",
  "glm-4-think": "676411c38945bbc58a905d31",
  "glm-4-zero": "676411c38945bbc58a905d31"
};
var DEFAULT_ASSISTANT_ID = "65940acff94777010aa6b796";
var SIGN_SECRET2 = "8a1317a7468aa3ad86e997d08f3f31cb";
var X_EXP_GROUPS = "na_android_config:exp:NA,na_4o_config:exp:4o_A,tts_config:exp:tts_config_a,na_glm4plus_config:exp:open,mainchat_server_app:exp:A,mobile_history_daycheck:exp:a,desktop_toolbar:exp:A,chat_drawing_server:exp:A,drawing_server_cogview:exp:cogview4,app_welcome_v2:exp:A,chat_drawing_streamv2:exp:A,mainchat_rm_fc:exp:add,mainchat_dr:exp:open,chat_auto_entrance:exp:A,drawing_server_hi_dream:control:A,homepage_square:exp:close,assistant_recommend_prompt:exp:3,app_home_regular_user:exp:A,memory_common:exp:enable,mainchat_moe:exp:300,assistant_greet_user:exp:greet_user,app_welcome_personalize:exp:A,assistant_model_exp_group:exp:glm4.5,ai_wallet:exp:ai_wallet_enable";
function generateSign2() {
  const e = Date.now();
  const A = e.toString();
  const t = A.length;
  const o = A.split("").map((c) => Number(c));
  const i = o.reduce((acc, v) => acc + v, 0) - o[t - 2];
  const a = i % 10;
  const timestamp = A.substring(0, t - 2) + a + A.substring(t - 1, t);
  const nonce = crypto6.randomUUID().replace(/-/g, "");
  const sign = crypto6.createHash("md5").update(`${timestamp}-${nonce}-${SIGN_SECRET2}`).digest("hex");
  return { timestamp, nonce, sign };
}
var ZWebClientBrowser = class {
  options;
  browser = null;
  context = null;
  page = null;
  initialized = false;
  accessToken = null;
  deviceId = crypto6.randomUUID().replace(/-/g, "");
  constructor(options) {
    this.options = options;
  }
  parseCookies() {
    return this.options.cookie.split(";").filter((c) => c.trim().includes("=")).map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return {
        name: name?.trim() ?? "",
        value: valueParts.join("=").trim(),
        domain: ".chatglm.cn",
        path: "/"
      };
    }).filter((c) => c.name.length > 0);
  }
  getRefreshToken() {
    const cookies = this.parseCookies();
    const refreshCookie = cookies.find((c) => c.name === "chatglm_refresh_token");
    return refreshCookie?.value ?? null;
  }
  getAccessTokenFromCookie() {
    const cookies = this.parseCookies();
    const tokenCookie = cookies.find((c) => c.name === "chatglm_token");
    return tokenCookie?.value ?? null;
  }
  async init() {
    if (this.initialized) {
      return;
    }
    const { context, page } = await getSharedBrowser("Z Web Browser", "https://chatglm.cn");
    this.context = context;
    this.page = page;
    const cookies = this.parseCookies();
    if (cookies.length > 0) {
      try {
        await this.context.addCookies(cookies);
      } catch (e) {
        console.warn("[Z Web Browser] Failed to add some cookies:", e);
      }
    }
    await this.refreshAccessToken();
    this.initialized = true;
  }
  async refreshAccessToken() {
    const cookieToken = this.getAccessTokenFromCookie();
    if (cookieToken) {
      this.accessToken = cookieToken;
      console.log("[Z Web Browser] Using chatglm_token from cookies");
      return;
    }
    if (this.context) {
      try {
        const browserCookies = await this.context.cookies(["https://chatglm.cn"]);
        const browserToken = browserCookies.find((c) => c.name === "chatglm_token");
        if (browserToken?.value) {
          this.accessToken = browserToken.value;
          console.log("[Z Web Browser] Using chatglm_token from browser cookies");
          return;
        }
      } catch {
      }
    }
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || !this.page) {
      console.warn("[Z Web Browser] No chatglm_token found, will rely on browser cookies for auth");
      return;
    }
    console.log("[Z Web Browser] Refreshing access token via API...");
    const sign = generateSign2();
    const requestId = crypto6.randomUUID().replace(/-/g, "");
    const result = await this.page.evaluate(
      async ({ refreshToken: refreshToken2, deviceId, requestId: requestId2, sign: sign2 }) => {
        try {
          const res = await fetch("https://chatglm.cn/chatglm/user-api/user/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken2}`,
              "App-Name": "chatglm",
              "X-App-Platform": "pc",
              "X-App-Version": "0.0.1",
              "X-Device-Id": deviceId,
              "X-Request-Id": requestId2,
              "X-Sign": sign2.sign,
              "X-Nonce": sign2.nonce,
              "X-Timestamp": sign2.timestamp
            },
            credentials: "include",
            body: JSON.stringify({})
          });
          if (!res.ok) {
            return { ok: false, status: res.status, error: await res.text() };
          }
          const data = await res.json();
          const accessToken = data?.result?.access_token ?? data?.result?.accessToken ?? data?.accessToken;
          if (!accessToken) {
            return {
              ok: false,
              status: 200,
              error: `No accessToken in response: ${JSON.stringify(data).substring(0, 300)}`
            };
          }
          return { ok: true, accessToken };
        } catch (err) {
          return { ok: false, status: 500, error: String(err) };
        }
      },
      { refreshToken, deviceId: this.deviceId, requestId, sign }
    );
    if (result.ok && result.accessToken) {
      this.accessToken = result.accessToken;
      console.log("[Z Web Browser] Access token refreshed successfully");
    } else {
      console.warn(`[Z Web Browser] Failed to refresh access token: ${result.error}`);
    }
  }
  async chatCompletions(params) {
    if (!this.page) {
      throw new Error("ZWebClientBrowser not initialized");
    }
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    const { conversationId, message, model } = params;
    const assistantId = ASSISTANT_ID_MAP[model] ?? DEFAULT_ASSISTANT_ID;
    console.log(`[Z Web Browser] Sending request... model=${model} assistantId=${assistantId}`);
    const fetchTimeoutMs = 12e4;
    const sign = generateSign2();
    const requestId = crypto6.randomUUID().replace(/-/g, "");
    const body = {
      assistant_id: assistantId,
      conversation_id: conversationId || "",
      project_id: "",
      chat_type: "user_chat",
      meta_data: {
        cogview: { rm_label_watermark: false },
        is_test: false,
        input_question_type: "xxxx",
        channel: "",
        draft_id: "",
        chat_mode: "zero",
        is_networking: false,
        quote_log_id: "",
        platform: "pc"
      },
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: message }]
        }
      ]
    };
    const evalPromise = this.page.evaluate(
      async ({ accessToken, bodyStr, deviceId, requestId: requestId2, timeoutMs, sign: sign2, xExpGroups }) => {
        let timer;
        try {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), timeoutMs);
          const headers = {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "App-Name": "chatglm",
            Origin: "https://chatglm.cn",
            "X-App-Platform": "pc",
            "X-App-Version": "0.0.1",
            "X-App-fr": "default",
            "X-Device-Brand": "",
            "X-Device-Id": deviceId,
            "X-Device-Model": "",
            "X-Exp-Groups": xExpGroups,
            "X-Lang": "zh",
            "X-Nonce": sign2.nonce,
            "X-Request-Id": requestId2,
            "X-Sign": sign2.sign,
            "X-Timestamp": sign2.timestamp
          };
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
          }
          const res = await fetch("https://chatglm.cn/chatglm/backend-api/assistant/stream", {
            method: "POST",
            headers,
            credentials: "include",
            body: bodyStr,
            signal: controller.signal
          });
          clearTimeout(timer);
          if (!res.ok) {
            const errorText = await res.text();
            return { ok: false, status: res.status, error: errorText.substring(0, 500) };
          }
          const reader = res.body?.getReader();
          if (!reader) {
            return { ok: false, status: 500, error: "No response body" };
          }
          const decoder = new TextDecoder();
          let fullText = "";
          let chunkCount = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            chunkCount++;
          }
          return { ok: true, data: fullText, chunkCount };
        } catch (err) {
          if (timer) {
            clearTimeout(timer);
          }
          const msg = String(err);
          if (msg.includes("aborted") || msg.includes("signal")) {
            return {
              ok: false,
              status: 408,
              error: `ChatGLM API request timed out after ${timeoutMs}ms`
            };
          }
          return { ok: false, status: 500, error: msg };
        }
      },
      {
        accessToken: this.accessToken,
        bodyStr: JSON.stringify(body),
        deviceId: this.deviceId,
        requestId,
        timeoutMs: fetchTimeoutMs,
        sign,
        xExpGroups: X_EXP_GROUPS
      }
    );
    const externalTimeoutMs = fetchTimeoutMs + 1e4;
    const responseData = await Promise.race([
      evalPromise,
      new Promise(
        (_, reject) => setTimeout(
          () => reject(
            new Error(
              `[Z Web Browser] page.evaluate timed out after ${externalTimeoutMs / 1e3}s`
            )
          ),
          externalTimeoutMs
        )
      )
    ]);
    if (!responseData || !responseData.ok) {
      if (responseData?.status === 401) {
        console.log("[Z Web Browser] Access token expired, refreshing...");
        await this.refreshAccessToken();
        throw new Error("Authentication expired. Token has been refreshed, please retry.");
      }
      throw new Error(
        `ChatGLM API error: ${responseData?.status || "unknown"} - ${responseData?.error || "Request failed"}`
      );
    }
    console.log(
      `[Z Web Browser] Response: ${responseData.chunkCount} chunks, ${responseData.data?.length || 0} bytes`
    );
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseData.data));
        controller.close();
      }
    });
  }
  async close() {
    await releaseSharedBrowser();
    this.page = null;
    this.context = null;
    this.browser = null;
    this.initialized = false;
    this.accessToken = null;
  }
};

// src/zero-token/streams/glm-web-stream.ts
var sessionMap5 = /* @__PURE__ */ new Map();
function createGlmWebStreamFn(cookieOrJson) {
  return createZWebStreamFn(cookieOrJson);
}
function createZWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new ZWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream7();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let sessionId = sessionMap5.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = "\n## Available Tools\n";
          for (const tool of tools) {
            toolPrompt += `- ${tool.name}: ${tool.description}
`;
          }
        }
        let prompt = "";
        if (!sessionId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        if (toolPrompt && sessionId) {
          prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>. Using plain text to describe your action will FAIL to execute the tool.';
        }
        if (!prompt) {
          throw new Error("No message found to send to ChatGLM API");
        }
        console.log(`[ZWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[ZWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[ZWebStream] Tools available: ${tools.length}`);
        console.log(`[ZWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          conversationId: sessionId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("ChatGLM API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[Qwen Stream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.conversation_id) {
              sessionMap5.set(sessionKey, data.conversation_id);
            }
            let delta = "";
            if (data.parts && Array.isArray(data.parts)) {
              for (const part of data.parts) {
                if (part && typeof part === "object") {
                  const p = part;
                  const content = p.content;
                  if (Array.isArray(content)) {
                    for (const c of content) {
                      if (c && typeof c === "object") {
                        const cc = c;
                        if (cc.type === "text" && typeof cc.text === "string") {
                          delta = cc.text;
                          break;
                        }
                      }
                    }
                  }
                  if (delta) {
                    break;
                  }
                }
              }
            }
            if (!delta) {
              delta = data.text || data.content || data.delta || "";
            }
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[ZWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/grok-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream8
} from "@mariozechner/pi-ai";

// src/zero-token/providers/grok-web-client-browser.ts
init_shared_browser();
var GrokWebClientBrowser = class {
  options;
  browser = null;
  context = null;
  page = null;
  initialized = false;
  lastConversationId;
  lastResponseId;
  constructor(options) {
    this.options = options;
  }
  parseCookies() {
    return this.options.cookie.split(";").filter((c) => c.trim().includes("=")).map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return {
        name: name?.trim() ?? "",
        value: valueParts.join("=").trim(),
        domain: ".grok.com",
        path: "/"
      };
    }).filter((c) => c.name.length > 0);
  }
  async init() {
    if (this.initialized) {
      return;
    }
    const { context, page } = await getSharedBrowser("Grok Web Browser", "https://grok.com");
    this.context = context;
    this.page = page;
    const cookies = this.parseCookies();
    if (cookies.length > 0) {
      try {
        await this.context.addCookies(cookies);
      } catch (e) {
        console.warn("[Grok Web Browser] Failed to add some cookies:", e);
      }
    }
    this.initialized = true;
  }
  /**
   * DOM 模拟：通过真实浏览器交互发送消息，绕过 403 anti-bot
   * 参考 ChatGPT Web 的 chatCompletionsViaDOM 实现
   */
  async chatCompletionsViaDOM(params) {
    if (!this.page) {
      throw new Error("GrokWebClientBrowser not initialized");
    }
    const sent = await this.page.evaluate((msg) => {
      const inputSelectors = [
        '[contenteditable="true"]',
        "textarea[placeholder]",
        "textarea",
        'div[role="textbox"]',
        'div[contenteditable="true"]'
      ];
      let inputEl = null;
      for (const sel of inputSelectors) {
        inputEl = document.querySelector(sel);
        if (inputEl && inputEl.offsetParent !== null) {
          break;
        }
      }
      if (!inputEl) {
        return { ok: false, error: "\u627E\u4E0D\u5230\u8F93\u5165\u6846" };
      }
      inputEl.focus();
      if (inputEl.tagName === "TEXTAREA" || inputEl.tagName === "INPUT") {
        inputEl.value = msg;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        inputEl.innerText = msg;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const sendSelectors = [
        'button[aria-label*="Send"]',
        'button[aria-label*="send"]',
        'button[type="submit"]',
        'button[data-testid*="send"]',
        "form button[type=submit]",
        "button:has(svg)",
        ".send-button",
        "[class*='send']"
      ];
      let sendBtn = null;
      for (const sel of sendSelectors) {
        sendBtn = document.querySelector(sel);
        if (sendBtn && !sendBtn.disabled) {
          break;
        }
      }
      if (sendBtn) {
        sendBtn.click();
        return { ok: true };
      }
      const textarea = inputEl.closest("form")?.querySelector("button[type=submit]");
      if (textarea) {
        textarea.click();
        return { ok: true };
      }
      const keyEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      inputEl.dispatchEvent(keyEvent);
      return { ok: true };
    }, params.message);
    if (!sent.ok) {
      throw new Error(`Grok DOM \u6A21\u62DF\u5931\u8D25: ${sent.error}`);
    }
    console.log("[Grok Web Browser] DOM \u6A21\u62DF\u5DF2\u53D1\u9001\uFF0C\u8F6E\u8BE2\u7B49\u5F85\u56DE\u590D...");
    const maxWaitMs = 9e4;
    const pollIntervalMs = 2e3;
    let lastText = "";
    let stableCount = 0;
    const signal = params.signal;
    for (let elapsed = 0; elapsed < maxWaitMs; elapsed += pollIntervalMs) {
      if (signal?.aborted) {
        throw new Error("Grok \u8BF7\u6C42\u5DF2\u53D6\u6D88");
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      const result = await this.page.evaluate(() => {
        const clean = (t) => t.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        const selectors = [
          '[data-role="assistant"]',
          '[class*="assistant"]',
          '[class*="response"]',
          '[class*="message"]',
          "article",
          "[class*='markdown']",
          ".prose"
        ];
        let text = "";
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          const last = els.length > 0 ? els[els.length - 1] : null;
          if (last) {
            const t = clean(last.textContent ?? "");
            if (t.length > 10) {
              text = t;
              break;
            }
          }
        }
        if (!text) {
          const all = document.querySelectorAll("p, div[class]");
          for (let i = all.length - 1; i >= 0; i--) {
            const el = all[i];
            const t = clean(el.textContent ?? "");
            if (t.length > 20 && !t.includes("Ask Grok")) {
              text = t;
              break;
            }
          }
        }
        const stopBtn = document.querySelector('[aria-label*="Stop"], [aria-label*="stop"]');
        const isStreaming = !!stopBtn;
        return { text, isStreaming };
      });
      console.log(
        `[Grok Browser] Poll ${elapsed}: textLen=${result.text?.length || 0}, isStreaming=${result.isStreaming}, stableCount=${stableCount}`
      );
      if (result.text && result.text !== lastText) {
        lastText = result.text;
        stableCount = 0;
        console.log(`[Grok Browser] New text detected, length: ${result.text.length}`);
      } else if (result.text) {
        stableCount++;
        console.log(`[Grok Browser] Text stable, count: ${stableCount}`);
        if (!result.isStreaming && stableCount >= 2) {
          console.log(`[Grok Browser] Breaking - not streaming and stable`);
          break;
        }
      } else {
        console.log(`[Grok Browser] No text detected`);
      }
    }
    if (!lastText) {
      throw new Error(
        "Grok DOM \u6A21\u62DF\uFF1A\u672A\u68C0\u6D4B\u5230\u56DE\u590D\u3002\u8BF7\u786E\u4FDD grok.com \u9875\u9762\u5DF2\u6253\u5F00\u3001\u5DF2\u767B\u5F55\uFF0C\u4E14\u8F93\u5165\u6846\u53EF\u89C1\u3002"
      );
    }
    const ndjsonLine = JSON.stringify({ contentDelta: lastText }) + "\n";
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(ndjsonLine));
        controller.close();
      }
    });
  }
  async chatCompletions(params) {
    if (!this.page) {
      throw new Error("GrokWebClientBrowser not initialized");
    }
    const { conversationId, parentResponseId, message, model } = params;
    console.log(
      `[Grok Web Browser] Sending request... conversationId=${conversationId ?? "(\u5C06\u4ECE\u9875\u9762\u6216 API \u83B7\u53D6)"} messageLen=${message.length}`
    );
    const evalPromise = this.page.evaluate(
      async ({
        conversationId: conversationId2,
        parentResponseId: parentResponseId2,
        message: message2,
        model: model2
      }) => {
        let convId = conversationId2;
        let parentId = parentResponseId2;
        if (!convId) {
          const m = window.location.pathname.match(/\/c\/([a-f0-9-]{36})/);
          convId = m?.[1] ?? void 0;
        }
        if (!convId) {
          const urls = [
            "https://grok.com/rest/app-chat/conversations?limit=1",
            "https://grok.com/rest/app-chat/conversations"
          ];
          for (const url of urls) {
            const listRes = await fetch(url, { credentials: "include" });
            if (listRes.ok) {
              const list = await listRes.json();
              convId = list?.conversations?.[0]?.conversationId ?? null;
              if (convId) {
                break;
              }
            }
          }
        }
        if (!convId) {
          console.log("[Grok] \u6CA1\u6709\u73B0\u6709\u5BF9\u8BDD\uFF0C\u521B\u5EFA\u65B0\u5BF9\u8BDD...");
          const createRes = await fetch("https://grok.com/rest/app-chat/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({})
          });
          if (createRes.ok) {
            const createData = await createRes.json();
            convId = createData?.conversationId ?? createData?.id ?? null;
            if (convId) {
              console.log(`[Grok] \u65B0\u5BF9\u8BDD\u521B\u5EFA\u6210\u529F: ${convId}`);
            }
          }
        }
        if (!convId) {
          throw new Error(
            `\u9700\u8981 conversationId\u3002\u5F53\u524D\u9875\u9762: ${window.location.href}\u3002\u8BF7\u5148\u5728 grok.com \u4E2D\u6253\u5F00\u6216\u65B0\u5EFA\u4E00\u4E2A\u5BF9\u8BDD\uFF08\u70B9\u51FB New chat\uFF09\uFF0C\u518D\u91CD\u8BD5\u3002`
          );
        }
        const body = {
          message: message2,
          parentResponseId: parentId ?? globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
          disableSearch: false,
          enableImageGeneration: true,
          imageAttachments: [],
          returnImageBytes: false,
          returnRawGrokInXaiRequest: false,
          fileAttachments: [],
          enableImageStreaming: true,
          imageGenerationCount: 2,
          forceConcise: false,
          toolOverrides: {},
          enableSideBySide: true,
          sendFinalMetadata: true,
          isReasoning: false,
          metadata: { request_metadata: { mode: "auto" } },
          disableTextFollowUps: false,
          disableArtifact: false,
          isFromGrokFiles: false,
          disableMemory: false,
          forceSideBySide: false,
          modelMode: "MODEL_MODE_AUTO",
          isAsyncChat: false,
          skipCancelCurrentInflightRequests: false,
          isRegenRequest: false,
          disableSelfHarmShortCircuit: false,
          deviceEnvInfo: {
            darkModeEnabled: false,
            devicePixelRatio: 1,
            screenWidth: 2560,
            screenHeight: 1440,
            viewportWidth: 1440,
            viewportHeight: 719
          }
        };
        const response = await fetch(
          `https://grok.com/rest/app-chat/conversations/${convId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body)
          }
        );
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(
            `Grok API error: ${response.status} ${response.statusText} - ${errText.slice(0, 300)}`
          );
        }
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          chunks.push(Array.from(value));
        }
        return { chunks, conversationId: convId };
      },
      { conversationId, parentResponseId, message, model }
    );
    const timeoutMs = 12e4;
    const result = await Promise.race([
      evalPromise,
      new Promise(
        (_, reject) => setTimeout(
          () => reject(
            new Error(
              `Grok \u8BF7\u6C42\u8D85\u65F6\uFF08${timeoutMs / 1e3}\u79D2\uFF09\u3002\u8BF7\u786E\u4FDD grok.com \u5DF2\u767B\u5F55\u4E14\u9875\u9762\u53EF\u8BBF\u95EE\u3002`
            )
          ),
          timeoutMs
        )
      )
    ]).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("403") || msg.includes("anti-bot")) {
        console.log(
          "[Grok Web Browser] 403 anti-bot \u89E6\u53D1\uFF0C\u5207\u6362\u5230 DOM \u6A21\u62DF\uFF08\u7531\u771F\u5B9E\u6D4F\u89C8\u5668\u4EA4\u4E92\u53D1\u8D77\uFF0C\u4E0D\u6613\u89E6\u53D1\u98CE\u63A7\uFF09"
        );
        return this.chatCompletionsViaDOM({
          message: params.message,
          signal: params.signal
        });
      }
      console.error(`[Grok Web Browser] evaluate error:`, msg);
      throw err;
    });
    if (result instanceof ReadableStream) {
      return result;
    }
    const apiResult = result;
    this.lastConversationId = apiResult.conversationId ?? void 0;
    const fullBytes = apiResult.chunks.flatMap((c) => c);
    const fullText = new TextDecoder().decode(new Uint8Array(fullBytes));
    console.log(`[Grok Web Browser] Response length: ${fullBytes.length} bytes`);
    console.log(
      `[Grok Web Browser] NDJSON sample:
${fullText.slice(0, 1200)}${fullText.length > 1200 ? "\n...(truncated)" : ""}`
    );
    const lines = fullText.split("\n").filter((line) => line.trim());
    const parsedChunks = [];
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const content = data.contentDelta ?? data.textDelta ?? data.content ?? data.text ?? data.delta;
        if (content) {
          parsedChunks.push(content);
        }
      } catch {
      }
    }
    let index = 0;
    return new ReadableStream({
      pull(controller) {
        if (index < parsedChunks.length) {
          const line = JSON.stringify({ contentDelta: parsedChunks[index] }) + "\n";
          controller.enqueue(new TextEncoder().encode(line));
          index++;
        } else {
          controller.close();
        }
      }
    });
  }
  async close() {
    await releaseSharedBrowser();
    this.page = null;
    this.context = null;
    this.browser = null;
    this.initialized = false;
  }
};

// src/zero-token/streams/grok-web-stream.ts
var sessionMap6 = /* @__PURE__ */ new Map();
function createGrokWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new GrokWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream8();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let sessionId = sessionMap6.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = "\n## Available Tools\n";
          for (const tool of tools) {
            toolPrompt += `- ${tool.name}: ${tool.description}
`;
          }
        }
        let prompt = "";
        if (!sessionId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        if (toolPrompt && sessionId) {
          prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>. Using plain text to describe your action will FAIL to execute the tool.';
        }
        if (!prompt) {
          throw new Error("No message found to send to GrokWeb API");
        }
        console.log(`[GrokWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[GrokWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[GrokWebStream] Tools available: ${tools.length}`);
        console.log(`[GrokWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          conversationId: sessionId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("GrokWeb API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[Qwen Stream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line) {
            return;
          }
          const dataStr = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.sessionId) {
              sessionMap6.set(sessionKey, data.sessionId);
            }
            const delta = data.contentDelta ?? data.choices?.[0]?.delta?.content ?? data.text ?? data.content ?? data.delta;
            if (typeof delta === "string" && delta) {
              console.log(`[GrokWebStream] Delta: ${delta.slice(0, 100)}...`);
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[GrokWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/kimi-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream9
} from "@mariozechner/pi-ai";

// src/zero-token/providers/kimi-web-client-browser.ts
init_shared_browser();
var KimiWebClientBrowser = class {
  cookie;
  accessToken;
  refreshToken;
  userAgent;
  baseUrl = "https://www.kimi.com";
  browser = null;
  page = null;
  running = null;
  constructor(options) {
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        this.cookie = parsed.cookie || "";
        this.accessToken = parsed.accessToken || "";
        this.refreshToken = parsed.refreshToken || "";
        this.userAgent = parsed.userAgent || "Mozilla/5.0";
      } catch {
        this.cookie = options;
        this.accessToken = "";
        this.refreshToken = "";
        this.userAgent = "Mozilla/5.0";
      }
    } else {
      this.cookie = options.cookie || "";
      this.accessToken = options.accessToken || "";
      this.refreshToken = options.refreshToken || "";
      this.userAgent = options.userAgent || "Mozilla/5.0";
    }
  }
  async ensureBrowser() {
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
        const cookie = {
          name: nameStr,
          value: valueStr,
          domain,
          path: "/"
        };
        if (nameStr.startsWith("__Secure-") || nameStr.startsWith("__Host-")) {
          cookie.secure = true;
        }
        return cookie;
      });
      const cookies = rawCookies.filter((c) => c !== null);
      if (cookies.length > 0) {
        try {
          await this.browser.addCookies(cookies);
        } catch (err) {
          console.warn(
            `[Kimi Web] addCookies failed (page may already have session): ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
    return { browser: this.browser, page: this.page };
  }
  async init() {
    await this.ensureBrowser();
  }
  async chatCompletions(params) {
    const { browser, page } = await this.ensureBrowser();
    const cookies = await browser.cookies([this.baseUrl]);
    const kimiAuthCookie = cookies.find((c) => c.name === "kimi-auth")?.value;
    const authToken = this.accessToken || kimiAuthCookie;
    if (!authToken) {
      throw new Error(
        "Kimi: \u672A\u627E\u5230\u8BA4\u8BC1\u51ED\u8BC1\uFF08accessToken \u6216 kimi-auth Cookie\uFF09\u3002\u8BF7\u91CD\u65B0\u767B\u5F55 www.kimi.com\u3002"
      );
    }
    const result = await page.evaluate(
      async ({
        baseUrl,
        message,
        kimiAuthToken,
        scenario
      }) => {
        const req = {
          scenario,
          message: {
            role: "user",
            blocks: [{ message_id: "", text: { content: message } }],
            scenario
          },
          options: { thinking: false }
        };
        const enc = new TextEncoder().encode(JSON.stringify(req));
        const buf = new ArrayBuffer(5 + enc.byteLength);
        const dv = new DataView(buf);
        dv.setUint8(0, 0);
        dv.setUint32(1, enc.byteLength, false);
        new Uint8Array(buf, 5).set(enc);
        const res = await fetch(`${baseUrl}/apiv2/kimi.gateway.chat.v1.ChatService/Chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/connect+json",
            "Connect-Protocol-Version": "1",
            Accept: "*/*",
            Origin: baseUrl,
            Referer: `${baseUrl}/`,
            "X-Language": "zh-CN",
            "X-Msh-Platform": "web",
            Authorization: `Bearer ${kimiAuthToken}`
          },
          body: buf
        });
        if (!res.ok) {
          const text = await res.text();
          if (res.status === 401 || res.status === 403) {
            return { ok: false, error: `\u767B\u5F55\u5DF2\u8FC7\u671F\uFF08HTTP ${res.status}\uFF09\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55 www.kimi.com` };
          }
          return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 400)}` };
        }
        const arr = await res.arrayBuffer();
        const u8 = new Uint8Array(arr);
        const texts = [];
        let o = 0;
        while (o + 5 <= u8.length) {
          const len = new DataView(u8.buffer, u8.byteOffset + o + 1, 4).getUint32(0, false);
          if (o + 5 + len > u8.length) {
            break;
          }
          const chunk = u8.slice(o + 5, o + 5 + len);
          try {
            const obj = JSON.parse(new TextDecoder().decode(chunk));
            if (obj.error) {
              return {
                ok: false,
                error: obj.error.message || obj.error.code || JSON.stringify(obj.error).slice(0, 200)
              };
            }
            if (obj.block?.text?.content && ["set", "append"].includes(obj.op || "")) {
              texts.push(obj.block.text.content);
            }
            if (obj.done) {
              break;
            }
          } catch {
          }
          o += 5 + len;
        }
        return { ok: true, text: texts.join("") };
      },
      {
        baseUrl: this.baseUrl,
        message: params.message,
        kimiAuthToken: authToken,
        scenario: params.model.includes("search") ? "SCENARIO_SEARCH" : params.model.includes("research") ? "SCENARIO_RESEARCH" : params.model.includes("k1") ? "SCENARIO_K1" : "SCENARIO_K2"
      }
    );
    if (!result.ok) {
      throw new Error(`Kimi API \u9519\u8BEF: ${result.error}`);
    }
    console.log(`[Kimi Web] API response: textLen=${result.text.length}`);
    const escaped = JSON.stringify(result.text);
    const sse = `data: {"text":${escaped}}

data: [DONE]

`;
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sse));
        controller.close();
      }
    });
  }
  async close() {
    await releaseSharedBrowser();
    this.browser = null;
    this.page = null;
  }
  async discoverModels() {
    return [
      {
        id: "moonshot-v1-128k",
        name: "Moonshot v1 128K",
        api: "kimi-web",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128e3,
        maxTokens: 4096
      }
    ];
  }
};

// src/zero-token/streams/kimi-web-stream.ts
var sessionMap7 = /* @__PURE__ */ new Map();
function createKimiWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new KimiWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream9();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let sessionId = sessionMap7.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = '\n\n[CRITICAL TOOL CALLING INSTRUCTION]\nYou have tools available. To call ANY tool, you MUST output this EXACT XML format:\n<tool_call id="unique_id" name="tool_name">{"param1": "value1", "param2": "value2"}</tool_call>\n\nExamples:\n<tool_call id="call_1" name="read">{"file_path": "/path/to/file.txt"}</tool_call>\n<tool_call id="call_2" name="write">{"file_path": "/path/to/file.txt", "content": "Hello World"}</tool_call>\n<tool_call id="call_3" name="exec">{"command": "echo hello"}</tool_call>\n<tool_call id="call_4" name="exec">{"command": "python hello.py"}</tool_call>\n\nRULES:\n1. Only use tools when the user EXPLICITLY requests file/system operations (create file, read file, run command, edit file, etc.). For questions, code writing, explanations, etc., reply directly in text WITHOUT calling any tool.\n2. ABSOLUTELY NO self-talk, reasoning, or planning. NEVER output "The user wants...", "Let me try...", etc.\n3. When calling a tool, output ONLY the <tool_call> XML tag. NOTHING else.\n4. After receiving a tool result, respond with a brief confirmation ONLY.\n5. For creating files with content, use the write tool. For creating empty files on Windows, use exec with New-Item.\n6. ALWAYS reply in the SAME language the user used. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u4F60\u5FC5\u987B\u5168\u7A0B\u7528\u4E2D\u6587\u56DE\u590D\u3002\n7. If a tool call fails, try a different approach silently.\n8. When user asks to run/execute a file or program, use the exec tool (e.g. exec with "python file.py", "node file.js", "code file.py"). NEVER tell the user to run it manually.';
        }
        let prompt = "";
        if (!sessionId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        const toolsAvailable = (context.tools || []).length > 0;
        if (toolsAvailable) {
          if (sessionId) {
            prompt += `

[CRITICAL TOOL CALLING INSTRUCTION]
To call ANY tool, you MUST output this EXACT XML format:
<tool_call id="unique_id" name="tool_name">{"param1": "value1"}</tool_call>

Examples:
<tool_call id="call_1" name="exec">{"command": "python hello.py"}</tool_call>
<tool_call id="call_2" name="write">{"file_path": "path", "content": "text"}</tool_call>

RULES: Only use tools for explicit file/system operations. When user asks to run a file, use exec. No self-talk. Reply in user's language. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u7528\u4E2D\u6587\u56DE\u590D\u3002`;
          } else {
            prompt += `

[IMPORTANT REMINDER] Tool format: <tool_call id="call_1" name="tool_name">{"param": "value"}</tool_call>
Only use tools for explicit file/system operations. When user asks to run/execute a file, use exec tool.
No self-talk. Reply in user's language. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u7528\u4E2D\u6587\u56DE\u590D\u3002`;
          }
        }
        if (!prompt) {
          throw new Error("No message found to send to KimiWeb API");
        }
        console.log(`[KimiWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[KimiWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[KimiWebStream] Tools available: ${tools.length}`);
        console.log(`[KimiWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          conversationId: sessionId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("KimiWeb API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[KimiWebStream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.sessionId || data.conversationId) {
              sessionMap7.set(sessionKey, data.sessionId || data.conversationId);
            }
            const delta = data.choices?.[0]?.delta?.content ?? data.text ?? data.content ?? data.delta;
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[KimiWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/perplexity-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream10
} from "@mariozechner/pi-ai";

// src/zero-token/providers/perplexity-web-client-browser.ts
init_shared_browser();
var PERPLEXITY_BASE_URL = "https://www.perplexity.ai";
var PerplexityWebClientBrowser = class {
  options;
  browser = null;
  context = null;
  page = null;
  initialized = false;
  lastConversationId;
  constructor(options) {
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        this.options = { cookie: parsed.cookie, userAgent: parsed.userAgent };
      } catch {
        this.options = { cookie: options, userAgent: "Mozilla/5.0" };
      }
    } else {
      this.options = options;
    }
  }
  parseCookies() {
    return this.options.cookie.split(";").filter((c) => c.trim().includes("=")).map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      return {
        name: name?.trim() ?? "",
        value: valueParts.join("=").trim(),
        domain: ".perplexity.ai",
        path: "/"
      };
    }).filter((c) => c.name.length > 0);
  }
  async init() {
    if (this.initialized) {
      return;
    }
    const { context, page } = await getSharedBrowser("Perplexity Web Browser", PERPLEXITY_BASE_URL);
    this.context = context;
    this.page = page;
    const cookies = this.parseCookies();
    if (cookies.length > 0) {
      try {
        await this.context.addCookies(cookies);
      } catch (e) {
        console.warn("[Perplexity Web Browser] Failed to add some cookies:", e);
      }
    }
    this.initialized = true;
  }
  async chatCompletions(params) {
    if (!this.page) {
      throw new Error("PerplexityWebClientBrowser not initialized");
    }
    const { conversationId, message, model } = params;
    console.log(
      `[Perplexity Web Browser] Sending request... conversationId=${conversationId ?? "(new)"} messageLen=${message.length}`
    );
    const evalResult = await this.page.evaluate(
      async ({
        conversationId: conversationId2,
        message: message2,
        model: model2
      }) => {
        const MODEL_MAP_INTERNAL = {
          "perplexity-web": "sonar",
          "perplexity-pro": "sonar-pro"
        };
        const modelInternal = MODEL_MAP_INTERNAL[model2] || model2 || "sonar";
        let convId = conversationId2;
        if (!convId) {
          const m = window.location.pathname.match(/\/search\/([a-zA-Z0-9_-]+)/);
          convId = m?.[1] ?? void 0;
        }
        if (!convId) {
          const m = window.location.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
          convId = m?.[1] ?? void 0;
        }
        const paramsObj = {
          q: message2,
          source: "search",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language || "en-US"
        };
        if (convId) {
          paramsObj["session"] = convId;
        }
        const queryString = new URLSearchParams(paramsObj).toString();
        const response = await fetch(`https://www.perplexity.ai/search?${queryString}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({
            query: message2,
            model: modelInternal,
            source: "default",
            mode: "copilot",
            ...convId ? { session_id: convId } : {}
          }),
          credentials: "include"
        });
        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              `Perplexity \u767B\u5F55\u5DF2\u8FC7\u671F\uFF08HTTP ${response.status}\uFF09\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55 www.perplexity.ai`
            );
          }
          throw new Error(
            `Perplexity API error: ${response.status} ${response.statusText} - ${errText.slice(0, 300)}`
          );
        }
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          chunks.push(Array.from(value));
        }
        return { chunks, conversationId: convId };
      },
      { conversationId, message, model }
    );
    const timeoutMs = 12e4;
    const result = await Promise.race([
      evalResult,
      new Promise(
        (_, reject) => setTimeout(
          () => reject(
            new Error(
              `Perplexity request timed out (${timeoutMs / 1e3}s). Please ensure perplexity.ai is logged in.`
            )
          ),
          timeoutMs
        )
      )
    ]).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Perplexity Web Browser] Error:`, msg);
      throw err;
    });
    const apiResult = result;
    this.lastConversationId = apiResult.conversationId ?? void 0;
    const fullBytes = apiResult.chunks.flatMap((c) => c);
    const fullText = new TextDecoder().decode(new Uint8Array(fullBytes));
    console.log(`[Perplexity Web Browser] Response length: ${fullBytes.length} bytes`);
    const lines = fullText.split("\n").filter((line) => line.trim());
    const parsedChunks = [];
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const content = data.text ?? data.content ?? data.delta ?? data.choices?.[0]?.delta?.content;
        if (typeof content === "string" && content) {
          parsedChunks.push(content);
        }
      } catch {
      }
    }
    let index = 0;
    return new ReadableStream({
      pull(controller) {
        if (index < parsedChunks.length) {
          const line = JSON.stringify({ contentDelta: parsedChunks[index] }) + "\n";
          controller.enqueue(new TextEncoder().encode(line));
          index++;
        } else {
          controller.close();
        }
      }
    });
  }
  async close() {
    await releaseSharedBrowser();
    this.page = null;
    this.context = null;
    this.browser = null;
    this.initialized = false;
  }
  async discoverModels() {
    return [
      {
        id: "perplexity-web",
        name: "Perplexity (Sonar)",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128e3,
        maxTokens: 4096
      },
      {
        id: "perplexity-pro",
        name: "Perplexity Pro",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128e3,
        maxTokens: 8192
      }
    ];
  }
};

// src/zero-token/streams/perplexity-web-stream.ts
function stripForWebProvider3(prompt) {
  return prompt;
}
function createPerplexityWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = typeof parsed === "string" ? { cookie: parsed, userAgent: "Mozilla/5.0" } : parsed;
  } catch {
    options = { cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new PerplexityWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream10();
    const run = async () => {
      try {
        await client.init();
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const historyParts = [];
        if (systemPrompt && !messages.some((m) => m.role === "system")) {
          historyParts.push(`System: ${systemPrompt}`);
        }
        for (const m of messages) {
          const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
          let content = "";
          if (m.role === "toolResult") {
            const tr = m;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            content = `
[Tool Result: ${tr.toolName}]
${resultText}
`;
          } else if (Array.isArray(m.content)) {
            for (const part of m.content) {
              if (part.type === "text") {
                content += part.text;
              }
            }
          } else {
            content = String(m.content);
          }
          if (m.role === "user" && content) {
            content = stripForWebProvider3(content) || content;
          }
          historyParts.push(`${role}: ${content}`);
        }
        const prompt = historyParts.join("\n\n");
        if (!prompt) {
          throw new Error("No message found to send to Perplexity API");
        }
        console.log(`[PerplexityWebStream] Starting run`);
        const responseStream = await client.chatCompletions({
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("Perplexity API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const contentParts = [];
        const createPartial = () => ({
          role: "assistant",
          content: [...contentParts],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        });
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            const delta = data.text || data.content || data.delta;
            if (typeof delta === "string" && delta) {
              if (contentParts.length === 0) {
                contentParts[0] = { type: "text", text: "" };
                stream.push({ type: "text_start", contentIndex: 0, partial: createPartial() });
              }
              contentParts[0].text += delta;
              stream.push({ type: "text_delta", contentIndex: 0, delta, partial: createPartial() });
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        const assistantMessage = {
          role: "assistant",
          content: contentParts.length > 0 ? contentParts : [{ type: "text", text: "" }],
          stopReason: "stop",
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          timestamp: Date.now()
        };
        stream.push({ type: "done", reason: "stop", message: assistantMessage });
      } catch (err) {
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage: err instanceof Error ? err.message : String(err),
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/qwen-cn-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream11
} from "@mariozechner/pi-ai";

// src/zero-token/providers/qwen-cn-web-client-browser.ts
init_shared_browser();
var QwenCNWebClientBrowser = class {
  cookie;
  xsrfToken;
  userAgent;
  deviceId;
  ut;
  baseUrl = "https://chat2.qianwen.com";
  browser = null;
  page = null;
  running = null;
  constructor(options) {
    let finalOptions;
    if (typeof options === "string") {
      try {
        finalOptions = JSON.parse(options);
      } catch {
        finalOptions = { cookie: options, xsrfToken: "" };
      }
    } else {
      finalOptions = options;
    }
    this.cookie = finalOptions.cookie || "";
    this.xsrfToken = finalOptions.xsrfToken || "";
    this.userAgent = finalOptions.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    this.ut = finalOptions.ut || "";
    if (!this.ut && this.cookie) {
      const match = this.cookie.match(/(?:^|;\\s*)b-user-id=([^;]+)/i);
      if (match) {
        this.ut = match[1];
      }
    }
    this.deviceId = finalOptions.deviceId || this.ut || "random-" + Math.random().toString(36).slice(2);
  }
  async ensureBrowser() {
    if (this.browser && this.page) {
      return { browser: this.browser, page: this.page };
    }
    const { context, page } = await getSharedBrowser("Qwen CN Web Browser", "https://chat2.qianwen.com/");
    this.browser = context;
    this.page = page;
    const cookies = this.cookie.split(";").filter((c) => c.trim().includes("=")).map((c) => {
      const [name, ...valueParts] = c.trim().split("=");
      return {
        name: name?.trim() ?? "",
        value: valueParts.join("=").trim(),
        domain: ".qianwen.com",
        path: "/"
      };
    }).filter((c) => c.name.length > 0);
    if (cookies.length > 0) {
      try {
        await this.browser.addCookies(cookies);
      } catch (err) {
        console.warn(
          `[Qwen CN Web Browser] addCookies failed (page may already have session): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    return { browser: this.browser, page: this.page };
  }
  async init() {
    await this.ensureBrowser();
  }
  async chatCompletions(params) {
    const { page } = await this.ensureBrowser();
    const model = params.model || "Qwen3.5-Plus";
    const sessionId = params.sessionId || Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    console.log(`[Qwen CN Web Browser] Sending message`);
    console.log(`[Qwen CN Web Browser] Model: ${model}`);
    console.log(`[Qwen CN Web Browser] Session ID: ${sessionId}`);
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).slice(2);
    const responseData = await page.evaluate(
      async ({
        baseUrl,
        sessionId: sessionId2,
        model: model2,
        message,
        parentMessageId,
        ut,
        xsrfToken,
        deviceId,
        nonce: nonce2,
        timestamp: timestamp2
      }) => {
        try {
          const url = `${baseUrl}/api/v2/chat?biz_id=ai_qwen&chat_client=h5&device=pc&fr=pc&pr=qwen&nonce=${nonce2}&timestamp=${timestamp2}&ut=${ut}`;
          const bodyObj = {
            model: model2,
            messages: [
              {
                content: message,
                mime_type: "text/plain",
                meta_data: {
                  ori_query: message
                }
              }
            ],
            session_id: sessionId2,
            parent_req_id: parentMessageId || "0",
            deep_search: "0",
            req_id: "req-" + Math.random().toString(36).slice(2),
            scene: "chat",
            sub_scene: "chat",
            temporary: false,
            from: "default",
            scene_param: parentMessageId ? "continue_chat" : "first_turn",
            chat_client: "h5",
            client_tm: timestamp2.toString(),
            protocol_version: "v2",
            biz_id: "ai_qwen"
          };
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream, text/plain, */*",
              Referer: `${baseUrl}/`,
              Origin: baseUrl,
              "x-xsrf-token": xsrfToken,
              "x-deviceid": deviceId,
              "x-platform": "pc_tongyi",
              "x-req-from": "pc_web"
            },
            body: JSON.stringify(bodyObj)
          });
          if (!res.ok) {
            const errorText = await res.text();
            if (res.status === 401 || res.status === 403) {
              return { ok: false, status: res.status, error: `\u767B\u5F55\u5DF2\u8FC7\u671F\uFF08HTTP ${res.status}\uFF09\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55 chat2.qianwen.com` };
            }
            return { ok: false, status: res.status, error: errorText };
          }
          const reader = res.body?.getReader();
          if (!reader) {
            return { ok: false, status: 500, error: "No response body" };
          }
          const decoder = new TextDecoder();
          let fullText = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
          }
          return { ok: true, data: fullText };
        } catch (err) {
          return { ok: false, status: 500, error: String(err) };
        }
      },
      {
        baseUrl: this.baseUrl,
        sessionId,
        model,
        message: params.message,
        parentMessageId: params.parentMessageId,
        ut: this.ut,
        xsrfToken: this.xsrfToken,
        deviceId: this.deviceId,
        nonce,
        timestamp
      }
    );
    console.log(
      `[Qwen CN Web Browser] Response data: ok=${responseData?.ok}, status=${responseData?.status}, data length=${responseData?.data?.length}`
    );
    if (responseData?.data && responseData.data.length > 0) {
      console.log(
        `[Qwen CN Web Browser] Response preview: ${responseData.data.substring(0, 200)}...`
      );
    }
    if (!responseData || !responseData.ok) {
      throw new Error(
        `Qwen CN API error: ${responseData?.status || "unknown"} - ${responseData?.error || "Request failed"}`
      );
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseData.data));
        controller.close();
      }
    });
    return stream;
  }
  async close() {
    await releaseSharedBrowser();
    this.browser = null;
    this.page = null;
  }
  async discoverModels() {
    return [
      {
        id: "Qwen3.5-Plus",
        name: "Qwen 3.5 Plus (\u56FD\u5185\u7248)",
        api: "qwen-cn-web",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128e3,
        maxTokens: 4096
      },
      {
        id: "Qwen3.5-Turbo",
        name: "Qwen 3.5 Turbo (\u56FD\u5185\u7248)",
        api: "qwen-cn-web",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32768,
        maxTokens: 4096
      }
    ];
  }
};

// src/zero-token/streams/qwen-cn-web-stream.ts
var sessionMap8 = /* @__PURE__ */ new Map();
function createQwenCNWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = parsed;
  } catch {
    options = { cookie: cookieOrJson, xsrfToken: "" };
  }
  const client = new QwenCNWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream11();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let sessionId = sessionMap8.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = "\n## Available Tools\n";
          for (const tool of tools) {
            toolPrompt += `- ${tool.name}: ${tool.description}
`;
          }
        }
        let prompt = "";
        if (!sessionId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        if (toolPrompt && sessionId) {
          prompt += '\n\n[SYSTEM HINT]: Keep in mind your available tools. To use a tool, you MUST output the EXACT XML format: <tool_call id="unique_id" name="tool_name">{"arg": "value"}</tool_call>. Using plain text to describe your action will FAIL to execute the tool.';
        }
        if (!prompt) {
          throw new Error("No message found to send to Qwen API");
        }
        console.log(`[QwenCNWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[QwenCNWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[QwenCNWebStream] Tools available: ${tools.length}`);
        console.log(`[QwenCNWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          sessionId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("Qwen API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[Qwen Stream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        let hasExtractedContent = false;
        let lastExtractedContent = "";
        const processLine = (line) => {
          if (!line) {
            return;
          }
          if (line.startsWith("event:")) {
            const eventType = line.slice(6).trim();
            console.log(`[QwenCNWebStream] SSE event type: ${eventType}`);
            return;
          }
          if (!line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            console.log(`[QwenCNWebStream] Parsed data keys: ${Object.keys(data).join(", ")}`);
            if (Object.keys(data).length > 0) {
              console.log(
                `[QwenCNWebStream] Data sample: ${JSON.stringify(data).substring(0, 200)}...`
              );
            }
            if (data.data && typeof data.data === "object") {
              console.log(`[QwenCNWebStream] data.data keys: ${Object.keys(data.data).join(", ")}`);
              if (data.data.messages && Array.isArray(data.data.messages)) {
                console.log(
                  `[QwenCNWebStream] messages array length: ${data.data.messages.length}`
                );
                for (let i = 0; i < data.data.messages.length; i++) {
                  const msg = data.data.messages[i];
                  console.log(
                    `[QwenCNWebStream] messages[${i}] keys: ${Object.keys(msg).join(", ")}`
                  );
                  if (msg.content) {
                    console.log(
                      `[QwenCNWebStream] messages[${i}].content: "${String(msg.content).substring(0, 100)}"`
                    );
                  }
                  if (msg.text) {
                    console.log(
                      `[QwenCNWebStream] messages[${i}].text: "${String(msg.text).substring(0, 100)}"`
                    );
                  }
                  if (msg.delta) {
                    console.log(
                      `[QwenCNWebStream] messages[${i}].delta: "${String(msg.delta).substring(0, 100)}"`
                    );
                  }
                }
              }
            }
            if (data.sessionId || data.sessionId) {
              sessionMap8.set(sessionKey, data.sessionId || data.sessionId);
            }
            console.log(
              `[QwenCNWebStream] Debug data.data: ${JSON.stringify(data.data)?.substring(0, 200)}`
            );
            console.log(
              `[QwenCNWebStream] Debug data.communication: ${JSON.stringify(data.communication)?.substring(0, 200)}`
            );
            if (data.data?.messages && Array.isArray(data.data.messages) && data.data.messages.length > 0) {
              console.log(
                `[QwenCNWebStream] Debug messages[0]: ${JSON.stringify(data.data.messages[0])?.substring(0, 300)}`
              );
              const msg = data.data.messages[0];
              console.log(`[QwenCNWebStream] Debug msg keys: ${Object.keys(msg).join(", ")}`);
              if (msg.content) {
                console.log(
                  `[QwenCNWebStream] Debug msg.content: ${typeof msg.content} = "${String(msg.content).substring(0, 100)}"`
                );
              }
              if (msg.text) {
                console.log(
                  `[QwenCNWebStream] Debug msg.text: ${typeof msg.text} = "${String(msg.text).substring(0, 100)}"`
                );
              }
              if (msg.delta) {
                console.log(
                  `[QwenCNWebStream] Debug msg.delta: ${typeof msg.delta} = "${String(msg.delta).substring(0, 100)}"`
                );
              }
            }
            let delta = "";
            if (data.data?.messages && Array.isArray(data.data.messages)) {
              for (let i = data.data.messages.length - 1; i >= 0; i--) {
                const msg = data.data.messages[i];
                if (msg.content && typeof msg.content === "string") {
                  delta = msg.content;
                  console.log(
                    `[QwenCNWebStream] Extracted content from messages[${i}], length: ${delta.length}`
                  );
                  break;
                }
              }
            }
            if (!delta) {
              delta = data.choices?.[0]?.delta?.content;
              if (!delta && data.data) {
                delta = data.data.text ?? data.data.content ?? data.data.delta;
              }
              if (!delta && data.communication) {
                delta = data.communication.text ?? data.communication.content;
              }
              if (!delta) {
                delta = data.text ?? data.content ?? data.delta;
              }
            }
            console.log(`[QwenCNWebStream] Delta extracted: ${typeof delta}, value="${delta}"`);
            if (typeof delta === "string" && delta) {
              if (delta !== lastExtractedContent) {
                lastExtractedContent = delta;
                pushDelta(delta);
              } else {
                console.log(`[QwenCNWebStream] Skipping duplicate content`);
              }
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[QwenCNWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/zero-token/streams/qwen-web-stream.ts
import {
  createAssistantMessageEventStream as createAssistantMessageEventStream12
} from "@mariozechner/pi-ai";

// src/zero-token/providers/qwen-web-client-browser.ts
init_shared_browser();
import crypto7 from "node:crypto";
var QwenWebClientBrowser = class {
  sessionToken;
  cookie;
  userAgent;
  baseUrl = "https://chat.qwen.ai";
  browser = null;
  page = null;
  running = null;
  constructor(options) {
    if (typeof options === "string") {
      const parsed = JSON.parse(options);
      this.sessionToken = parsed.sessionToken;
      this.cookie = parsed.cookie || `qwen_session=${parsed.sessionToken}`;
      this.userAgent = parsed.userAgent || "Mozilla/5.0";
    } else {
      this.sessionToken = options.sessionToken;
      this.cookie = options.cookie || `qwen_session=${options.sessionToken}`;
      this.userAgent = options.userAgent || "Mozilla/5.0";
    }
  }
  async ensureBrowser() {
    if (this.browser && this.page) {
      return { browser: this.browser, page: this.page };
    }
    const { context, page } = await getSharedBrowser("Qwen Web Browser", "https://chat.qwen.ai/");
    this.browser = context;
    this.page = page;
    const cookies = this.cookie.split(";").map((c) => {
      const [name, ...valueParts] = c.trim().split("=");
      return {
        name: name.trim(),
        value: valueParts.join("=").trim(),
        domain: ".qwen.ai",
        path: "/"
      };
    });
    await this.browser.addCookies(cookies);
    return { browser: this.browser, page: this.page };
  }
  async init() {
    await this.ensureBrowser();
  }
  async chatCompletions(params) {
    const { page } = await this.ensureBrowser();
    const model = params.model || "qwen3.5-plus";
    console.log(`[Qwen Web Browser] Sending message`);
    console.log(`[Qwen Web Browser] Model: ${model}`);
    console.log(`[Qwen Web Browser] Message: ${params.message.substring(0, 100)}...`);
    const createChatTimeoutMs = 3e4;
    const createChatResult = await page.evaluate(
      async ({ baseUrl, timeoutMs }) => {
        let timer = void 0;
        try {
          const url = `${baseUrl}/api/v2/chats/new`;
          console.log(`[Browser] Creating chat: ${url}`);
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), timeoutMs);
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({}),
            signal: controller.signal
          });
          clearTimeout(timer);
          console.log(`[Browser] Create chat response status: ${res.status}`);
          console.log(
            `[Browser] Create chat response headers:`,
            Object.fromEntries(res.headers.entries())
          );
          if (!res.ok) {
            const errorText = await res.text();
            console.log(`[Browser] Create chat error response: ${errorText.substring(0, 500)}`);
            return { ok: false, status: res.status, error: errorText };
          }
          const data = await res.json();
          const chatId2 = data.data?.id ?? data.chat_id ?? data.id ?? data.chatId;
          console.log(`[Browser] Chat created, chat ID:`, chatId2);
          return { ok: true, chatId: chatId2, fullData: data };
        } catch (err) {
          if (typeof timer !== "undefined") {
            clearTimeout(timer);
          }
          const msg = String(err);
          if (msg.includes("aborted") || msg.includes("signal")) {
            return { ok: false, status: 408, error: `Create chat timed out after ${timeoutMs}ms` };
          }
          console.error(`[Browser] Create chat exception:`, err);
          return { ok: false, status: 500, error: msg };
        }
      },
      { baseUrl: this.baseUrl, timeoutMs: createChatTimeoutMs }
    );
    console.log(`[Qwen Web Browser] Create chat result:`, JSON.stringify(createChatResult));
    if (!createChatResult.ok || !createChatResult.chatId) {
      console.error(`[Qwen Web Browser] Failed to create chat`);
      console.error(`[Qwen Web Browser] Error: ${createChatResult.error}`);
      console.error(`[Qwen Web Browser] Full result:`, JSON.stringify(createChatResult));
      throw new Error(
        `Failed to create Qwen chat: ${createChatResult.error || "No chat_id in response"}`
      );
    }
    const chatId = createChatResult.chatId;
    console.log(`[Qwen Web Browser] Chat ID: ${chatId}`);
    const fetchTimeoutMs = 3e5;
    const fid = crypto7.randomUUID();
    const responseData = await page.evaluate(
      async ({ baseUrl, chatId: chatId2, model: model2, message, fid: fid2, timeoutMs }) => {
        let timer = void 0;
        try {
          const url = `${baseUrl}/api/v2/chat/completions?chat_id=${chatId2}`;
          console.log(`[Browser] Sending message: ${url} (timeout: ${timeoutMs}ms)`);
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), timeoutMs);
          const requestBody = {
            stream: true,
            version: "2.1",
            incremental_output: true,
            chat_id: chatId2,
            chat_mode: "normal",
            model: model2,
            parent_id: null,
            messages: [
              {
                fid: fid2,
                parentId: null,
                childrenIds: [],
                role: "user",
                content: message,
                user_action: "chat",
                files: [],
                timestamp: Math.floor(Date.now() / 1e3),
                models: [model2],
                chat_type: "t2t",
                feature_config: { thinking_enabled: true, output_schema: "phase" }
              }
            ]
          };
          console.log(`[Browser] Request body:`, JSON.stringify(requestBody, null, 2));
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream"
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timer);
          console.log(`[Browser] Response status: ${res.status}`);
          console.log(`[Browser] Response headers:`, Object.fromEntries(res.headers.entries()));
          if (!res.ok) {
            const errorText = await res.text();
            console.log(`[Browser] Error response: ${errorText.substring(0, 500)}`);
            return { ok: false, status: res.status, error: errorText };
          }
          const reader = res.body?.getReader();
          if (!reader) {
            return { ok: false, status: 500, error: "No response body" };
          }
          const decoder = new TextDecoder();
          let fullText = "";
          let chunkCount = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            chunkCount++;
            if (chunkCount <= 3) {
              console.log(`[Browser] Chunk ${chunkCount}: ${chunk.substring(0, 200)}`);
            }
          }
          console.log(`[Browser] Total chunks: ${chunkCount}, Total length: ${fullText.length}`);
          return { ok: true, data: fullText };
        } catch (err) {
          if (typeof timer !== "undefined") {
            clearTimeout(timer);
          }
          const msg = String(err);
          if (msg.includes("aborted") || msg.includes("signal")) {
            return {
              ok: false,
              status: 408,
              error: `Qwen API request timed out after ${timeoutMs}ms`
            };
          }
          console.error(`[Browser] Fetch error:`, err);
          return { ok: false, status: 500, error: msg };
        }
      },
      {
        baseUrl: this.baseUrl,
        chatId,
        model,
        message: params.message,
        fid,
        timeoutMs: fetchTimeoutMs
      }
    );
    if (!responseData || !responseData.ok) {
      console.error(`[Qwen Web Browser] Request failed`);
      console.error(`[Qwen Web Browser] Error: ${responseData?.status} - ${responseData?.error}`);
      if (responseData?.status === 401 || responseData?.status === 403) {
        throw new Error(
          "Authentication failed. Please re-run onboarding to refresh your Qwen session."
        );
      }
      if (responseData?.status === 408) {
        throw new Error(
          `Qwen API request timed out. ${responseData?.error || ""} Ensure chat.qwen.ai is reachable, Chrome is connected, and you are logged in.`
        );
      }
      throw new Error(
        `Qwen API error: ${responseData?.status || "unknown"} - ${responseData?.error || "Request failed"}`
      );
    }
    console.log(`[Qwen Web Browser] Response data length: ${responseData.data?.length || 0} bytes`);
    console.log(
      `[Qwen Web Browser] Response preview: ${responseData.data?.substring(0, 300) || "empty"}`
    );
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseData.data));
        controller.close();
      }
    });
    return stream;
  }
  async close() {
    await releaseSharedBrowser();
    this.browser = null;
    this.page = null;
  }
  async discoverModels() {
    return [
      {
        id: "qwen-max",
        name: "Qwen Max",
        api: "qwen-web",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32768,
        maxTokens: 8192
      }
    ];
  }
};

// src/zero-token/streams/qwen-web-stream.ts
var conversationMap3 = /* @__PURE__ */ new Map();
function createQwenWebStreamFn(cookieOrJson) {
  let options;
  try {
    const parsed = JSON.parse(cookieOrJson);
    if (typeof parsed === "string") {
      options = { sessionToken: parsed, cookie: parsed, userAgent: "Mozilla/5.0" };
    } else {
      options = {
        sessionToken: parsed.sessionToken || parsed.cookie || "",
        cookie: parsed.cookie || parsed.sessionToken || "",
        userAgent: parsed.userAgent || "Mozilla/5.0"
      };
    }
  } catch {
    options = { sessionToken: cookieOrJson, cookie: cookieOrJson, userAgent: "Mozilla/5.0" };
  }
  const client = new QwenWebClientBrowser(options);
  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream12();
    const run = async () => {
      try {
        await client.init();
        const sessionKey = context.sessionId || "default";
        let conversationId = conversationMap3.get(sessionKey);
        const messages = context.messages || [];
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        let toolPrompt = "";
        if (tools.length > 0) {
          toolPrompt = '\n\n[CRITICAL TOOL CALLING INSTRUCTION]\nYou have tools available. To call ANY tool, you MUST output this EXACT XML format:\n<tool_call id="unique_id" name="tool_name">{"param1": "value1", "param2": "value2"}</tool_call>\n\nExamples:\n<tool_call id="call_1" name="read">{"file_path": "D:\\\\Users\\\\111\\\\Desktop\\\\\u6587\u4EF6\u5939\\\\111.txt"}</tool_call>\n<tool_call id="call_2" name="write">{"file_path": "D:\\\\Users\\\\111\\\\Desktop\\\\\u6587\u4EF6\u5939\\\\111.txt", "content": "Hello World"}</tool_call>\n<tool_call id="call_3" name="exec">{"command": "echo hello"}</tool_call>\n<tool_call id="call_4" name="exec">{"command": "python D:\\\\Users\\\\111\\\\Desktop\\\\hello.py"}</tool_call>\n\nRULES:\n1. Only use tools when the user EXPLICITLY requests file/system operations (create file, read file, run command, edit file, etc.). For questions, code writing, explanations, etc., reply directly in text WITHOUT calling any tool.\n2. ABSOLUTELY NO self-talk, reasoning, or planning. NEVER output "The user wants...", "Let me try...", etc.\n3. When calling a tool, output ONLY the <tool_call> XML tag. NOTHING else.\n4. After receiving a tool result, respond with a brief confirmation ONLY.\n5. For creating files with content, use the write tool. For creating empty files on Windows, use exec with New-Item.\n6. ALWAYS reply in the SAME language the user used. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u4F60\u5FC5\u987B\u5168\u7A0B\u7528\u4E2D\u6587\u56DE\u590D\u3002\n7. If a tool call fails, try a different approach silently.\n8. When user asks to run/execute a file or program, use the exec tool (e.g. exec with "python file.py", "node file.js", "code file.py"). NEVER tell the user to run it manually.';
        }
        let prompt = "";
        if (!conversationId) {
          const historyParts = [];
          let systemPromptContent = systemPrompt;
          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }
          if (systemPromptContent && !messages.some((m) => m.role === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }
          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";
            if (m.role === "toolResult") {
              const tr = m;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>
`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>
${part.thinking}
</think>
`;
                } else if (part.type === "toolCall") {
                  const tc = part;
                  content += `<tool_call id="${tc.id}" name="${tc.name}">${JSON.stringify(tc.arguments)}</tool_call>`;
                }
              }
            } else {
              content = String(m.content);
            }
            historyParts.push(`${role}: ${content}`);
          }
          prompt = historyParts.join("\n\n");
        } else {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg?.role === "toolResult") {
            const tr = lastMsg;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `
<tool_response id="${tr.toolCallId}" name="${tr.toolName}">
${resultText}
</tool_response>

Please proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content.filter((part) => part.type === "text").map((part) => part.text).join("");
              }
            }
          }
        }
        const toolsAvailable = (context.tools || []).length > 0;
        if (toolsAvailable) {
          if (conversationId) {
            prompt += `

[CRITICAL TOOL CALLING INSTRUCTION]
To call ANY tool, you MUST output this EXACT XML format:
<tool_call id="unique_id" name="tool_name">{"param1": "value1"}</tool_call>

Examples:
<tool_call id="call_1" name="exec">{"command": "python hello.py"}</tool_call>
<tool_call id="call_2" name="write">{"file_path": "path", "content": "text"}</tool_call>

RULES: Only use tools for explicit file/system operations. When user asks to run a file, use exec. No self-talk. Reply in user's language. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u7528\u4E2D\u6587\u56DE\u590D\u3002`;
          } else {
            prompt += `

[IMPORTANT REMINDER] Tool format: <tool_call id="call_1" name="tool_name">{"param": "value"}</tool_call>
Only use tools for explicit file/system operations. When user asks to run/execute a file, use exec tool.
No self-talk. Reply in user's language. \u5982\u679C\u7528\u6237\u8BF4\u4E2D\u6587\uFF0C\u7528\u4E2D\u6587\u56DE\u590D\u3002`;
          }
        }
        if (!prompt) {
          throw new Error("No message found to send to Qwen API");
        }
        console.log(`[QwenWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[QwenWebStream] Conversation ID: ${conversationId || "new"}`);
        console.log(`[QwenWebStream] Tools available: ${tools.length}`);
        console.log(`[QwenWebStream] Prompt length: ${prompt.length}`);
        const responseStream = await client.chatCompletions({
          conversationId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal
        });
        if (!responseStream) {
          throw new Error("Qwen API returned empty response body");
        }
        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const indexMap = /* @__PURE__ */ new Map();
        let nextIndex = 0;
        const contentParts = [];
        const accumulatedToolCalls = [];
        const createPartial = () => {
          const msg = {
            role: "assistant",
            content: [...contentParts],
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now()
          };
          msg.thinking_enabled = contentParts.some((p) => p.type === "thinking");
          return msg;
        };
        let currentMode = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        const emitDelta = (type, delta, forceId) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;
          if (!indexMap.has(key)) {
            const index2 = nextIndex++;
            indexMap.set(key, index2);
            if (type === "text") {
              contentParts[index2] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index2, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index2] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index2,
                partial: createPartial()
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index2}`;
              contentParts[index2] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {}
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index2,
                partial: createPartial()
              });
            }
          }
          const index = indexMap.get(key);
          if (type === "text") {
            contentParts[index].text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "thinking") {
            contentParts[index].thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial()
            });
          }
        };
        const pushDelta = (delta, forceType) => {
          if (!delta) {
            return;
          }
          if (forceType === "thinking") {
            emitDelta("thinking", delta);
            return;
          }
          tagBuffer += delta;
          const checkTags = () => {
            const thinkStart = tagBuffer.match(/<think\b[^<>]*>/i);
            const thinkEnd = tagBuffer.match(/<\/think\b[^<>]*>/i);
            const toolCallStart = tagBuffer.match(
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);
            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2]
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0
              }
            ].filter((t) => t.idx !== -1).toSorted((a, b) => a.idx - b.idx);
            if (indices.length > 0) {
              const first = indices[0];
              const before = tagBuffer.slice(0, first.idx);
              if (before) {
                if (currentMode === "thinking") {
                  emitDelta("thinking", before);
                } else if (currentMode === "tool_call") {
                  emitDelta("toolcall", before);
                } else {
                  emitDelta("text", before);
                }
              }
              if (first.type === "think_start") {
                currentMode = "thinking";
              } else if (first.type === "think_end") {
                currentMode = "text";
              } else if (first.type === "tool_start") {
                currentMode = "tool_call";
                currentToolName = first.name;
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== void 0) {
                  const part = contentParts[index];
                  const argStr = accumulatedToolCalls[currentToolIndex].arguments || "{}";
                  let cleanedArg = argStr.trim();
                  if (cleanedArg.startsWith("```json")) {
                    cleanedArg = cleanedArg.substring(7);
                  } else if (cleanedArg.startsWith("```")) {
                    cleanedArg = cleanedArg.substring(3);
                  }
                  if (cleanedArg.endsWith("```")) {
                    cleanedArg = cleanedArg.substring(0, cleanedArg.length - 3);
                  }
                  cleanedArg = cleanedArg.trim();
                  try {
                    part.arguments = JSON.parse(cleanedArg);
                  } catch (e) {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[Qwen Stream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                      "\nError:",
                      e
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial()
                  });
                }
                currentMode = "text";
                currentToolIndex++;
              }
              tagBuffer = tagBuffer.slice(first.idx + first.len);
              checkTags();
            } else {
              const lastAngle = tagBuffer.lastIndexOf("<");
              if (lastAngle === -1) {
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };
        const processLine = (line) => {
          if (!line || !line.startsWith("data:")) {
            return;
          }
          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]" || !dataStr) {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.sessionId || data.conversationId) {
              conversationMap3.set(sessionKey, data.sessionId || data.conversationId);
            }
            const delta = data.choices?.[0]?.delta?.content ?? data.text ?? data.content ?? data.delta;
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processLine(buffer.trim());
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const combined = buffer + chunk;
          const parts = combined.split("\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            processLine(part.trim());
          }
        }
        if (tagBuffer) {
          const mode = currentMode === "thinking" ? "thinking" : currentMode === "tool_call" ? "toolcall" : "text";
          emitDelta(mode, tagBuffer);
        }
        console.log(
          `[QwenWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`
        );
        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial()
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stream.push({
          type: "error",
          reason: "error",
          error: {
            role: "assistant",
            content: [],
            stopReason: "error",
            errorMessage,
            api: model.api,
            provider: model.provider,
            model: model.id,
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
            },
            timestamp: Date.now()
          }
        });
      } finally {
        stream.end();
      }
    };
    queueMicrotask(() => void run());
    return stream;
  };
}

// src/index.ts
function emptyPluginConfigSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {}
  };
}
var ZERO_TOKEN_GROUP_ID = "zero-token";
var ZERO_TOKEN_GROUP_LABEL = "Zero Token";
var ZERO_TOKEN_GROUP_HINT = "Use browser sessions instead of API keys.";
var WEB_PROVIDERS = [
  {
    id: "chatgpt-web",
    label: "ChatGPT (Web)",
    envVar: "CHATGPT_WEB_COOKIE",
    defaultModelId: CHATGPT_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildChatGPTWebProvider,
    createStreamFn: createChatGPTWebStreamFn,
    login: loginChatGPTWeb
  },
  {
    id: "claude-web",
    label: "Claude (Web)",
    envVar: "CLAUDE_WEB_COOKIE",
    defaultModelId: CLAUDE_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildClaudeWebProvider,
    createStreamFn: createClaudeWebStreamFn,
    login: loginClaudeWeb
  },
  {
    id: "deepseek-web",
    label: "DeepSeek (Web)",
    envVar: "DEEPSEEK_WEB_COOKIE",
    defaultModelId: DEEPSEEK_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildDeepseekWebProvider,
    createStreamFn: createDeepseekWebStreamFn,
    login: loginDeepseekWeb
  },
  {
    id: "doubao-web",
    label: "Doubao (Web)",
    envVar: "DOUBAO_WEB_COOKIE",
    defaultModelId: DOUBAO_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildDoubaoWebProvider,
    createStreamFn: createDoubaoWebStreamFn,
    login: loginDoubaoWeb
  },
  {
    id: "gemini-web",
    label: "Gemini (Web)",
    envVar: "GEMINI_WEB_COOKIE",
    defaultModelId: GEMINI_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildGeminiWebProvider,
    createStreamFn: createGeminiWebStreamFn,
    login: loginGeminiWeb
  },
  {
    id: "glm-intl-web",
    label: "GLM International (Web)",
    envVar: "GLM_INTL_WEB_COOKIE",
    defaultModelId: GLM_INTL_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildGlmIntlWebProvider,
    createStreamFn: createGlmIntlWebStreamFn,
    login: loginGlmIntlWeb
  },
  {
    id: "glm-web",
    label: "GLM (Web)",
    envVar: "GLM_WEB_COOKIE",
    defaultModelId: Z_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildZWebProvider,
    createStreamFn: createGlmWebStreamFn,
    login: loginZWeb
  },
  {
    id: "grok-web",
    label: "Grok (Web)",
    envVar: "GROK_WEB_COOKIE",
    defaultModelId: GROK_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildGrokWebProvider,
    createStreamFn: createGrokWebStreamFn,
    login: loginGrokWeb
  },
  {
    id: "kimi-web",
    label: "Kimi (Web)",
    envVar: "KIMI_WEB_COOKIE",
    defaultModelId: KIMI_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildKimiWebProvider,
    createStreamFn: createKimiWebStreamFn,
    login: loginKimiWeb
  },
  {
    id: "perplexity-web",
    label: "Perplexity (Web)",
    envVar: "PERPLEXITY_WEB_COOKIE",
    defaultModelId: PERPLEXITY_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildPerplexityWebProvider,
    createStreamFn: createPerplexityWebStreamFn,
    login: loginPerplexityWeb
  },
  {
    id: "qwen-cn-web",
    label: "Qwen CN (Web)",
    envVar: "QWEN_CN_WEB_COOKIE",
    defaultModelId: "Qwen3.5-Plus",
    buildProvider: buildQwenCNWebProvider,
    createStreamFn: createQwenCNWebStreamFn,
    login: loginQwenCNWeb
  },
  {
    id: "qwen-web",
    label: "Qwen (Web)",
    envVar: "QWEN_WEB_COOKIE",
    defaultModelId: QWEN_WEB_DEFAULT_MODEL_ID,
    buildProvider: buildQwenWebProvider,
    createStreamFn: createQwenWebStreamFn,
    login: loginQwenWeb
  }
];
function createAuthProgress(ctx, label) {
  const progress = ctx.prompter.progress(`${label} login`);
  return {
    update: (message) => progress.update(message),
    stop: (message) => progress.stop(message)
  };
}
function serializeBrowserAuth(payload) {
  return JSON.stringify(payload);
}
function resolveModelAliasMap(providerId, provider) {
  const nextModels = {};
  if (Array.isArray(provider.models)) {
    for (const model of provider.models) {
      const modelId = typeof model?.id === "string" ? model.id.trim() : "";
      if (!modelId) {
        continue;
      }
      const alias = typeof model.name === "string" && model.name.trim().length > 0 ? model.name.trim() : modelId;
      nextModels[`${providerId}/${modelId}`] = { alias };
    }
  }
  return nextModels;
}
function buildProviderConfigPatch(desc, provider) {
  const models = resolveModelAliasMap(desc.id, provider);
  models[`${desc.id}/${desc.defaultModelId}`] ??= { alias: desc.label };
  return {
    models: {
      mode: "merge",
      providers: {
        [desc.id]: provider
      }
    },
    agents: {
      defaults: {
        models
      }
    }
  };
}
async function runBrowserAuth(ctx, desc) {
  const progress = createAuthProgress(ctx, desc.label);
  try {
    const authPayload = await desc.login({
      onProgress: progress.update,
      openUrl: async (url) => {
        await ctx.openUrl(url);
        return true;
      }
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
            key: serializedAuth
          }
        }
      ],
      notes: [`${desc.label} credentials were stored as a reusable browser-auth profile.`]
    };
  } catch (error) {
    progress.stop(`${desc.label} login failed.`);
    throw error;
  }
}
async function runCatalog(ctx, desc) {
  const { apiKey, discoveryApiKey } = ctx.resolveProviderApiKey(desc.id);
  const resolvedApiKey = discoveryApiKey ?? apiKey;
  if (!resolvedApiKey) {
    return null;
  }
  return {
    provider: await desc.buildProvider({ apiKey: resolvedApiKey })
  };
}
async function resolveStreamApiKey(api, config, providerId) {
  const configuredApiKey = config?.models?.providers?.[providerId]?.apiKey;
  let resolvedApiKey = typeof configuredApiKey === "string" && configuredApiKey.trim().length > 0 ? configuredApiKey.trim() : void 0;
  if (!resolvedApiKey) {
    const resolved = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: providerId,
      cfg: config
    });
    resolvedApiKey = resolved.apiKey?.trim() || void 0;
  }
  if (!resolvedApiKey) {
    throw new Error(`No browser-auth credentials found for provider "${providerId}".`);
  }
  return resolvedApiKey;
}
function createResolvedStreamFn(api, config, desc) {
  return async (model, context, options) => {
    const resolvedApiKey = await resolveStreamApiKey(api, config, desc.id);
    return await desc.createStreamFn(resolvedApiKey)(model, context, options);
  };
}
function createConfiguredStreamFn(api, ctx, desc) {
  return createResolvedStreamFn(api, ctx.config, desc);
}
function createWrappedStreamFn(api, ctx, desc) {
  return createResolvedStreamFn(api, ctx.config, desc);
}
function buildRegisteredProvider(api, desc) {
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
        run: async (ctx) => await runBrowserAuth(ctx, desc)
      }
    ],
    catalog: {
      order: "late",
      run: async (ctx) => await runCatalog(ctx, desc)
    },
    discovery: {
      order: "late",
      run: async (ctx) => await runCatalog(ctx, desc)
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
        methodId: "browser-login"
      }
    }
  };
}
function syncSleepMs(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
    }
  }
}
function getListeningPids(port) {
  const myPid = String(process.pid);
  const pids = /* @__PURE__ */ new Set();
  if (process.platform === "win32") {
    try {
      const psOut = execSync2(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
        { encoding: "utf-8", timeout: 8e3 }
      ).trim();
      for (const line of psOut.split(/\r?\n/)) {
        const pid = line.trim();
        if (pid && pid !== "0" && pid !== myPid) pids.add(pid);
      }
    } catch {
    }
    if (pids.size === 0) {
      try {
        const out = execSync2(
          `netstat -aon | findstr ":${port} " | findstr "LISTENING"`,
          { encoding: "utf-8", timeout: 5e3 }
        ).trim();
        for (const line of out.split("\n")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== myPid) pids.add(pid);
        }
      } catch {
      }
    }
  } else {
    try {
      const out = execSync2(`lsof -ti :${port}`, { encoding: "utf-8", timeout: 5e3 }).trim();
      for (const pid of out.split("\n")) {
        if (pid.trim() && pid.trim() !== myPid) pids.add(pid.trim());
      }
    } catch {
    }
  }
  return [...pids];
}
function killPid(pid) {
  try {
    if (process.platform === "win32") {
      execSync2(`taskkill /PID ${pid} /T /F`, { timeout: 5e3, stdio: "ignore" });
    } else {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
      }
    }
  } catch {
  }
}
function waitForPortFree(port, maxWaitMs = 6e3) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const pids = getListeningPids(port);
    if (pids.length === 0) return true;
    syncSleepMs(500);
  }
  return getListeningPids(port).length === 0;
}
function findGatewayLockFiles() {
  const results = [];
  const tmpDir = os5.tmpdir();
  const lockDirNames = ["openclaw"];
  const uid = typeof process.getuid === "function" ? process.getuid() : null;
  if (uid != null) {
    lockDirNames.push(`openclaw-${uid}`);
  }
  for (const dirName of lockDirNames) {
    const lockDir = path6.join(tmpDir, dirName);
    try {
      if (!fs6.existsSync(lockDir)) continue;
      for (const file of fs6.readdirSync(lockDir)) {
        if (file.startsWith("gateway.") && file.endsWith(".lock")) {
          results.push(path6.join(lockDir, file));
        }
      }
    } catch {
    }
  }
  return results;
}
function readLockOwnerPid(lockPath) {
  try {
    const raw = fs6.readFileSync(lockPath, "utf-8");
    const payload = JSON.parse(raw);
    return typeof payload.pid === "number" ? payload.pid : null;
  } catch {
    return null;
  }
}
function forceRemoveLockFile(lockPath) {
  try {
    fs6.unlinkSync(lockPath);
    return true;
  } catch {
  }
  if (process.platform === "win32") {
    try {
      execSync2(`cmd /c del /f /q "${lockPath}"`, { timeout: 3e3, stdio: "ignore" });
      return !fs6.existsSync(lockPath);
    } catch {
    }
  }
  return false;
}
function cleanupStaleGateway(port = 18789) {
  try {
    const lockFiles = findGatewayLockFiles();
    const killedPids = /* @__PURE__ */ new Set();
    for (const lockPath of lockFiles) {
      const ownerPid = readLockOwnerPid(lockPath);
      if (ownerPid && ownerPid !== process.pid) {
        let alive = false;
        try {
          process.kill(ownerPid, 0);
          alive = true;
        } catch {
        }
        if (alive) {
          console.log(`[zero-token] Killing lock owner (pid ${ownerPid}) for ${path6.basename(lockPath)}`);
          killPid(String(ownerPid));
          killedPids.add(String(ownerPid));
          syncSleepMs(500);
        }
      }
      if (forceRemoveLockFile(lockPath)) {
        console.log(`[zero-token] Removed lock file: ${lockPath}`);
      } else {
        console.warn(`[zero-token] WARN: Could not remove lock file: ${lockPath}`);
      }
    }
    const portPids = getListeningPids(port);
    for (const pid of portPids) {
      if (!killedPids.has(pid)) {
        console.log(`[zero-token] Killing stale gateway process (pid ${pid}) on port ${port}`);
        killPid(pid);
        killedPids.add(pid);
      }
    }
    if (killedPids.size > 0) {
      const portFree = waitForPortFree(port, 6e3);
      if (!portFree) {
        console.warn(`[zero-token] Port ${port} still occupied after killing ${killedPids.size} process(es)`);
        for (const pid of getListeningPids(port)) {
          console.log(`[zero-token] Final retry: killing pid ${pid}`);
          killPid(pid);
        }
        syncSleepMs(2e3);
      }
    }
    for (const lockPath of findGatewayLockFiles()) {
      forceRemoveLockFile(lockPath);
    }
    const stillOccupied = getListeningPids(port).length > 0;
    const remainingLocks = findGatewayLockFiles().length;
    if (stillOccupied || remainingLocks > 0) {
      console.warn(
        `[zero-token] Cannot fully clean gateway state (port occupied=${stillOccupied}, locks remaining=${remainingLocks}). Setting OPENCLAW_ALLOW_MULTI_GATEWAY=1 to bypass lock.`
      );
      process.env.OPENCLAW_ALLOW_MULTI_GATEWAY = "1";
    }
  } catch (err) {
    console.warn(`[zero-token] Gateway cleanup error: ${err instanceof Error ? err.message : String(err)}`);
    process.env.OPENCLAW_ALLOW_MULTI_GATEWAY = "1";
  }
}
try {
  console.log("[zero-token] Running early gateway cleanup at module load time...");
  cleanupStaleGateway();
} catch {
  process.env.OPENCLAW_ALLOW_MULTI_GATEWAY = "1";
}
var zeroTokenPlugin = {
  id: "zero-token",
  name: "Zero Token Web Providers",
  description: "Use browser-authenticated web models without standard API keys.",
  configSchema: emptyPluginConfigSchema(),
  register(api) {
    const gatewayPort = api.runtime?.config?.gateway?.port ?? 18789;
    cleanupStaleGateway(gatewayPort);
    const webProviderIds = new Set(WEB_PROVIDERS.map((d) => d.id));
    const webProviderMap = new Map(WEB_PROVIDERS.map((d) => [d.id, d]));
    for (const desc of WEB_PROVIDERS) {
      api.registerProvider(buildRegisteredProvider(api, desc));
    }
    const builtinProvider = getApiProvider("openai-completions");
    console.log(`[zero-token] builtinProvider found: ${!!builtinProvider}`);
    if (builtinProvider) {
      const originalStream = builtinProvider.stream;
      const originalStreamSimple = builtinProvider.streamSimple;
      const makeInterceptor = (original) => {
        return async (model, context, options) => {
          const providerId = typeof model.provider === "string" ? model.provider.trim() : "";
          const toolCount = Array.isArray(context.tools) ? context.tools.length : "undefined";
          console.log(`[zero-token] interceptor called: model.provider="${providerId}", model.api="${model.api}", model.id="${model.id}", isWebProvider=${webProviderIds.has(providerId)}, context.tools=${toolCount}, contextKeys=${Object.keys(context).join(",")}`);
          if (webProviderIds.has(providerId)) {
            const desc = webProviderMap.get(providerId);
            const resolved = await api.runtime.modelAuth.resolveApiKeyForProvider({
              provider: desc.id,
              cfg: api.runtime.config
            });
            const apiKey = resolved.apiKey?.trim();
            if (!apiKey) {
              throw new Error(
                `No browser-auth credentials found for provider "${desc.id}".`
              );
            }
            return desc.createStreamFn(apiKey)(model, context, options);
          }
          return original(model, context, options);
        };
      };
      registerApiProvider({
        api: "openai-completions",
        stream: makeInterceptor(originalStream),
        streamSimple: makeInterceptor(originalStreamSimple)
      });
      console.log(`[zero-token] re-registered openai-completions with interceptor`);
    }
  }
};
var index_default = zeroTokenPlugin;
export {
  index_default as default
};
