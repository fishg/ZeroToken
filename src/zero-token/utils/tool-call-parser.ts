export type ToolCallStartMatch = {
  id?: string;
  name: string;
  index: number;
  length: number;
};

export function matchToolCallStart(buffer: string): ToolCallStartMatch | null {
  const xmlMatch = buffer.match(
    /<tool_call\s+(?:id=['"]?([^'"]+)['"]?\s+)?name=['"]?([^'"]+)['"]?\s*(?:id=['"]?([^'"]+)['"]?\s*)?>/i,
  );
  const legacyMatch = buffer.match(/<tool_call>\s*([A-Za-z_][\w.-]*)\s*:\s*/i);

  const xmlIndex = xmlMatch?.index ?? -1;
  const legacyIndex = legacyMatch?.index ?? -1;

  if (xmlIndex === -1 && legacyIndex === -1) {
    return null;
  }

  if (legacyIndex !== -1 && (xmlIndex === -1 || legacyIndex < xmlIndex)) {
    return {
      id: undefined,
      name: legacyMatch![1],
      index: legacyIndex,
      length: legacyMatch![0].length,
    };
  }

  return {
    id: xmlMatch?.[1] || xmlMatch?.[3],
    name: xmlMatch?.[2] || "",
    index: xmlIndex,
    length: xmlMatch?.[0].length || 0,
  };
}

export function findCompleteJsonPrefix(buffer: string): number | null {
  const start = buffer.search(/\S/);
  if (start === -1) {
    return null;
  }

  const first = buffer[start];
  if (first !== "{" && first !== "[") {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < buffer.length; i++) {
    const ch = buffer[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      depth++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        return i + 1;
      }
    }
  }

  return null;
}

export function parseToolArguments(
  rawArguments: string,
  streamLabel: string,
  toolName: string,
): Record<string, unknown> {
  let cleanedArg = rawArguments.trim();
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
    const parsed = JSON.parse(cleanedArg || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch (error) {
    console.error(
      `[${streamLabel}] Failed to parse JSON for tool call ${toolName}:`,
      rawArguments,
      "\nError:",
      error,
    );
    return { raw: rawArguments };
  }
}
