import type { StreamFn } from "@mariozechner/pi-agent-core";
import {
  createAssistantMessageEventStream,
  type AssistantMessage,
  type TextContent,
  type ThinkingContent,
  type ToolCall,
  type ToolResultMessage,
} from "@mariozechner/pi-ai";
import {
  XiaomiMimoWebClientBrowser,
  type XiaomiMimoWebClientOptions,
} from "../providers/xiaomimo-web-client-browser.js";

const sessionMap = new Map<string, string>();

export function createXiaomiMimoWebStreamFn(cookieOrJson: string): StreamFn {
  let options: XiaomiMimoWebClientOptions;
  try {
    const parsed = JSON.parse(cookieOrJson);
    options = { cookie: parsed.cookie || cookieOrJson };
  } catch {
    options = { cookie: cookieOrJson };
  }
  const client = new XiaomiMimoWebClientBrowser(options);

  return (model, context, streamOptions) => {
    const stream = createAssistantMessageEventStream();

    const run = async () => {
      try {
        const messages = context.messages;
        const systemPrompt = context.systemPrompt || "";
        const tools = context.tools || [];
        const sessionKey = model.id;
        const sessionId = sessionMap.get(sessionKey);

        let toolPrompt = "";
        if (tools.length > 0) {
          // MiMo has strict 3000 char limit - keep tool prompt very concise
          toolPrompt = '\n\n[工具格式] <tool_call id="call_1" name="工具名">{"参数":"值"}</tool_call>\n工具：read、write、exec、edit、browser\n例：<tool_call id="call_1" name="browser">{"action":"navigate","url":"https://baidu.com"}</tool_call>\n例：<tool_call id="call_2" name="exec">{"command":"python hello.py"}</tool_call>\n[规则] 用户要求操作文件、运行命令、打开浏览器时调用工具。写代码、回答问题直接文本回复。\n思考过程放在<think></think>内，回复只输出最终结果。用中文简短回复。';
        }

        let prompt = "";

        if (!sessionId) {
          const historyParts: string[] = [];
          let systemPromptContent = systemPrompt;

          if (toolPrompt) {
            systemPromptContent += toolPrompt;
          }

          if (systemPromptContent && !messages.some((m) => (m.role as string) === "system")) {
            historyParts.push(`System: ${systemPromptContent}`);
          }

          for (const m of messages) {
            const role = m.role === "user" || m.role === "toolResult" ? "User" : "Assistant";
            let content = "";

            if (m.role === "toolResult") {
              const tr = m as unknown as ToolResultMessage;
              let resultText = "";
              if (Array.isArray(tr.content)) {
                for (const part of tr.content) {
                  if (part.type === "text") {
                    resultText += part.text;
                  }
                }
              }
              content = `\n<tool_response id="${tr.toolCallId}" name="${tr.toolName}">\n${resultText}\n</tool_response>\n`;
            } else if (Array.isArray(m.content)) {
              for (const part of m.content) {
                if (part.type === "text") {
                  content += part.text;
                } else if (part.type === "thinking") {
                  content += `<think>\n${part.thinking}\n
</think>\n`;
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
            const tr = lastMsg as unknown as ToolResultMessage;
            let resultText = "";
            if (Array.isArray(tr.content)) {
              for (const part of tr.content) {
                if (part.type === "text") {
                  resultText += part.text;
                }
              }
            }
            prompt = `\n<tool_response id="${tr.toolCallId}" name="${tr.toolName}">\n${resultText}\n</tool_response>\n\nPlease proceed based on this tool result.`;
          } else {
            const lastUserMessage = [...messages].toReversed().find((m) => m.role === "user");
            if (lastUserMessage) {
              if (typeof lastUserMessage.content === "string") {
                prompt = lastUserMessage.content;
              } else if (Array.isArray(lastUserMessage.content)) {
                prompt = lastUserMessage.content
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("");
              }
            }
          }
        }

        // Add tool reminder at END of prompt (both first turn and continuing)
        const toolsAvailable = (context.tools || []).length > 0;
        if (toolsAvailable) {
          if (sessionId) {
            prompt +=
              '\n\n[工具格式] <tool_call id="call_1" name="工具名">{"参数":"值"}</tool_call>\n工具：read、write、exec、edit、browser\n例：<tool_call id="call_1" name="browser">{"action":"navigate","url":"https://baidu.com"}</tool_call>\n思考放<think></think>内，回复只输出结果。用中文。';
          } else {
            prompt +=
              '\n\n[提醒] 工具：read、write、exec、edit、browser。格式：<tool_call id="call_1" name="exec">{"command":"命令"}</tool_call>\n思考放<think></think>内，回复只输出结果。用中文。';
          }
        }

        if (!prompt) {
          throw new Error("No message found to send to XiaomiMimo Web API");
        }

        // MiMo Web API 限制非常严格，截断时保留工具指令和用户消息
        const MAX_PROMPT_LENGTH = 3000;
        if (prompt.length > MAX_PROMPT_LENGTH) {
          console.log(
            `[XiaomiMimoWebStream] Truncating from ${prompt.length} to ${MAX_PROMPT_LENGTH}`,
          );
          // 精简系统提示 + 工具指令 + 用户消息
          const sysPrefix = '你是AI助手。思考过程放在<think></think>内，回复只输出最终结果，禁止自言自语。简短回复。';
          const toolInst = toolPrompt || '';
          const userParts = prompt.split("User:");
          const lastUser = userParts[userParts.length - 1];
          const endReminder = toolsAvailable ? '\n[提醒]调用工具只输出XML标签，禁止自言自语，用中文简短回复。' : '';
          const headerLen = sysPrefix.length + toolInst.length + endReminder.length + 20;
          const remainingLen = MAX_PROMPT_LENGTH - headerLen;
          prompt = "System: " + sysPrefix + toolInst + "\n\nUser:" + (lastUser || "").slice(-remainingLen) + endReminder;
        }

        console.log(`[XiaomiMimoWebStream] Starting run for session: ${sessionKey}`);
        console.log(`[XiaomiMimoWebStream] Conversation ID: ${sessionId || "new"}`);
        console.log(`[XiaomiMimoWebStream] Tools available: ${tools.length}`);
        console.log(`[XiaomiMimoWebStream] Prompt length: ${prompt.length}`);

        const responseStream = await client.chatCompletions({
          conversationId: sessionId,
          message: prompt,
          model: model.id,
          signal: streamOptions?.signal,
        });

        if (!responseStream) {
          throw new Error("XiaomiMimo Web API returned empty response body");
        }

        const reader = responseStream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const indexMap = new Map<string, number>();
        let nextIndex = 0;
        const contentParts: (TextContent | ThinkingContent | ToolCall)[] = [];
        const accumulatedToolCalls: {
          id: string;
          name: string;
          arguments: string;
          index: number;
        }[] = [];

        const createPartial = (): AssistantMessage => {
          const msg: AssistantMessage = {
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
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
            },
            stopReason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
            timestamp: Date.now(),
          };
          (msg as AssistantMessage & { thinking_enabled?: boolean }).thinking_enabled =
            contentParts.some((p) => p.type === "thinking");
          return msg;
        };

        let currentMode: "text" | "thinking" | "tool_call" | "error" = "text";
        let currentToolName = "";
        let currentToolIndex = 0;
        let tagBuffer = "";
        let totalTextEmitted = 0;
        let currentEvent = "";
        // MiMo self-talk filter: buffer text before tool calls,
        // if tool call found → discard buffered text (self-talk)
        // if no tool call by stream end → flush buffer as normal text
        let hasSeenToolCall = false;
        const preToolTextBuffer: string[] = [];

        const emitDelta = (
          type: "text" | "thinking" | "toolcall",
          delta: string,
          forceId?: string,
        ) => {
          if (delta === "" && type !== "toolcall") {
            return;
          }
          // MiMo: buffer text until we know if tools will be called
          if (toolsAvailable && type === "text" && !hasSeenToolCall) {
            preToolTextBuffer.push(delta);
            totalTextEmitted += delta.length;
            return; // buffer, don't emit yet
          }
          const key = type === "toolcall" ? `tool_${currentToolIndex}` : type;

          if (!indexMap.has(key)) {
            const index = nextIndex++;
            indexMap.set(key, index);
            if (type === "text") {
              contentParts[index] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index, partial: createPartial() });
            } else if (type === "thinking") {
              contentParts[index] = { type: "thinking", thinking: "" };
              stream.push({
                type: "thinking_start",
                contentIndex: index,
                partial: createPartial(),
              });
            } else if (type === "toolcall") {
              const toolId = forceId || `call_${Date.now()}_${index}`;
              contentParts[index] = {
                type: "toolCall",
                id: toolId,
                name: currentToolName,
                arguments: {},
              };
              accumulatedToolCalls[currentToolIndex] = {
                id: toolId,
                name: currentToolName,
                arguments: "",
                index: currentToolIndex,
              };
              stream.push({
                type: "toolcall_start",
                contentIndex: index,
                partial: createPartial(),
              });
            }
          }

          const index = indexMap.get(key)!;
          if (type === "text") {
            (contentParts[index] as TextContent).text += delta;
            stream.push({
              type: "text_delta",
              contentIndex: index,
              delta,
              partial: createPartial(),
            });
          } else if (type === "thinking") {
            (contentParts[index] as ThinkingContent).thinking += delta;
            stream.push({
              type: "thinking_delta",
              contentIndex: index,
              delta,
              partial: createPartial(),
            });
          } else if (type === "toolcall") {
            accumulatedToolCalls[currentToolIndex].arguments += delta;
            stream.push({
              type: "toolcall_delta",
              contentIndex: index,
              delta,
              partial: createPartial(),
            });
          }
        };

        const pushDelta = (delta: string, forceType?: "text" | "thinking") => {
          if (!delta) {
            return;
          }
          // Filter junk tokens
          if (delta === '[DONE]' || delta === '<|endoftext|>') {
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
              /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i,
            );
            const toolCallEnd = tagBuffer.match(/<\/tool_call\s*>/i);

            const indices = [
              {
                type: "think_start",
                idx: thinkStart?.index ?? -1,
                len: thinkStart?.[0].length ?? 0,
              },
              { type: "think_end", idx: thinkEnd?.index ?? -1, len: thinkEnd?.[0].length ?? 0 },
              {
                type: "tool_start",
                idx: toolCallStart?.index ?? -1,
                len: toolCallStart?.[0].length ?? 0,
                id: toolCallStart?.[1] || toolCallStart?.[3],
                name: toolCallStart?.[2],
              },
              {
                type: "tool_end",
                idx: toolCallEnd?.index ?? -1,
                len: toolCallEnd?.[0].length ?? 0,
              },
            ]
              .filter((t) => t.idx !== -1)
              .toSorted((a, b) => a.idx - b.idx);

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
                currentToolName = first.name!;
                // Tool call found → discard buffered self-talk
                if (!hasSeenToolCall) {
                  hasSeenToolCall = true;
                  preToolTextBuffer.length = 0;
                  console.log(`[XiaomiMimoWebStream] Tool call detected, discarded ${totalTextEmitted} chars of pre-tool text`);
                }
                emitDelta("toolcall", "", first.id);
              } else if (first.type === "tool_end") {
                const index = indexMap.get(`tool_${currentToolIndex}`);
                if (index !== undefined) {
                  const part = contentParts[index] as ToolCall;
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
                  } catch {
                    part.arguments = { raw: argStr };
                    console.error(
                      `[XiaomiMimoWebStream] Failed to parse JSON for tool call ${currentToolName}:`,
                      argStr,
                    );
                  }
                  stream.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: part,
                    partial: createPartial(),
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
                const mode =
                  currentMode === "thinking"
                    ? "thinking"
                    : currentMode === "tool_call"
                      ? "toolcall"
                      : "text";
                emitDelta(mode, tagBuffer);
                tagBuffer = "";
              } else if (lastAngle > 0) {
                const safe = tagBuffer.slice(0, lastAngle);
                const mode =
                  currentMode === "thinking"
                    ? "thinking"
                    : currentMode === "tool_call"
                      ? "toolcall"
                      : "text";
                emitDelta(mode, safe);
                tagBuffer = tagBuffer.slice(lastAngle);
              }
            }
          };
          checkTags();
        };

        const processLine = (line: string) => {
          if (!line) {
            return;
          }

          // 处理 event: 行
          if (line.startsWith("event:")) {
            const event = line.slice(6).trim();
            if (event === "error") {
              currentMode = "error";
            } else if (event === "dialogId") {
              currentEvent = "dialogId";
            } else {
              currentEvent = event;
            }
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

            // Capture conversationId from dialogId event
            if (currentEvent === "dialogId" && data.content) {
              const convId = String(data.content);
              console.log(`[XiaomiMimoWebStream] Captured conversationId: ${convId}`);
              sessionMap.set(sessionKey, convId);
              currentEvent = "";
              return; // Don't push dialogId as text content
            }
            currentEvent = "";

            if (data.sessionId || data.conversationId) {
              sessionMap.set(sessionKey, data.sessionId || data.conversationId);
            }

            // MiMo 格式: {"type":"text","content":"..."}
            if (data.content && typeof data.content === "string") {
              pushDelta(data.content);
              return;
            }

            // OpenAI 格式
            const delta = data.choices?.[0]?.delta?.content ?? data.text ?? data.delta;
            if (typeof delta === "string" && delta) {
              pushDelta(delta);
            }
          } catch {
            // 可能是纯文本
            if (dataStr.length > 0 && !dataStr.startsWith("{")) {
              pushDelta(dataStr);
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

        // If no tool call was made, flush buffered text as normal output
        if (!hasSeenToolCall && preToolTextBuffer.length > 0) {
          console.log(`[XiaomiMimoWebStream] No tool calls, flushing ${preToolTextBuffer.length} buffered text chunks`);
          let fullText = preToolTextBuffer.join("");

          // Post-processing: aggressively clean MiMo self-talk/reasoning
          // MiMo is a small model that frequently dumps its entire chain-of-thought
          if (fullText.length > 200) {
            const selfTalkMarkers = [
              '或许', '我认为', '我决定', '为了', '既然', '让我', '我应该',
              '我需要', '我可以', '我将', '指令说', '用户说', '工具调用',
              '系统提示', '回复草稿', '步骤', '计划', '假设', '风险',
              '另一个想法', '为了简', '为了精确', '为了遵循', '最终回复',
              '意思是', '可能', '看用户', '看提示', '在响应中', '在回复中',
              '在这个', '对于', '作为AI', '作为MiMo', '这是一个矛盾',
              '所以，', '但是，', '然后，', '现在，', '最终，',
              '用户期望', '用户消息', '用户的消息', '用户可能',
              '思考：', '思考过程', '推理', '分析',
            ];
            const lines = fullText.split('\n').filter(l => l.trim());
            const selfTalkCount = lines.filter(l =>
              selfTalkMarkers.some(m => l.includes(m))
            ).length;

            if (selfTalkCount > lines.length * 0.3) {
              console.log(`[XiaomiMimoWebStream] Detected self-talk (${selfTalkCount}/${lines.length} lines), filtering`);

              // Strategy 1: Look for last clean response block
              const paragraphs = fullText.split(/\n\n+/);
              let cleanIdx = -1;
              for (let i = paragraphs.length - 1; i >= 0; i--) {
                const p = paragraphs[i].trim();
                if (!p) continue;
                // Check if this paragraph is NOT self-talk
                const isSelfTalk = selfTalkMarkers.some(m => p.includes(m));
                if (!isSelfTalk && p.length > 5 && p.length < 500) {
                  cleanIdx = i;
                  break;
                }
              }

              if (cleanIdx !== -1) {
                fullText = paragraphs[cleanIdx].trim();
                console.log(`[XiaomiMimoWebStream] Extracted clean paragraph (${fullText.length} chars)`);
              } else {
                // Strategy 2: Take the last sentence/line that isn't reasoning
                const cleanLines = lines.filter(l => {
                  const trimmed = l.trim();
                  return trimmed.length > 2 && !selfTalkMarkers.some(m => trimmed.includes(m));
                });
                if (cleanLines.length > 0) {
                  fullText = cleanLines[cleanLines.length - 1].trim();
                  console.log(`[XiaomiMimoWebStream] Extracted last clean line (${fullText.length} chars)`);
                } else {
                  // Strategy 3: Just take the last non-empty line
                  const lastLine = lines[lines.length - 1]?.trim() || '';
                  fullText = lastLine || '操作完成。';
                  console.log(`[XiaomiMimoWebStream] Fallback to last line`);
                }
              }
            }
          }

          // Strip [DONE] markers that may leak into text
          fullText = fullText.replace(/\[DONE\]/g, '').trim();

          if (fullText) {
            const key = "text";
            if (!indexMap.has(key)) {
              const index = nextIndex++;
              indexMap.set(key, index);
              contentParts[index] = { type: "text", text: "" };
              stream.push({ type: "text_start", contentIndex: index, partial: createPartial() });
            }
            const index = indexMap.get(key)!;
            (contentParts[index] as TextContent).text += fullText;
            stream.push({ type: "text_delta", contentIndex: index, delta: fullText, partial: createPartial() });
          }
        }

        if (tagBuffer) {
          // TypeScript narrows currentMode to "text" inside the conditional due to the
          // control-flow analysis on the closure. Cast through unknown to bypass.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resolvedMode =
            (currentMode as string) === "thinking"
              ? ("thinking" as const)
              : (currentMode as string) === "tool_call"
                ? ("toolcall" as const)
                : ("text" as const);
          emitDelta(resolvedMode, tagBuffer);
        }

        console.log(
          `[XiaomiMimoWebStream] Stream completed. Parts: ${contentParts.length}, Tools: ${accumulatedToolCalls.length}`,
        );

        stream.push({
          type: "done",
          reason: accumulatedToolCalls.length > 0 ? "toolUse" : "stop",
          message: createPartial(),
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
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
            },
            timestamp: Date.now(),
          },
        } as unknown as never);
      } finally {
        stream.end();
      }
    };

    queueMicrotask(() => void run());
    return stream;
  };
}
