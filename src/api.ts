import { ModelConfig, ModelResult } from "./types";

const SYSTEM_PROMPT_DEFAULT = "You are a helpful assistant. Process the following text according to the user's needs.";

// 非流式调用（降级备用）
export async function callModel(
  text: string,
  config: ModelConfig,
  systemPrompt?: string,
  maxTokens?: number,
): Promise<ModelResult> {
  const startTime = Date.now();

  try {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt || SYSTEM_PROMPT_DEFAULT },
          { role: "user", content: text },
        ],
        max_tokens: maxTokens || 2048,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "(empty response)";

    return {
      name: config.name,
      content,
      loading: false,
      streaming: false,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    return {
      name: config.name,
      content: "",
      loading: false,
      streaming: false,
      error: err instanceof Error ? err.message : String(err),
      duration: Date.now() - startTime,
    };
  }
}

// 流式调用
export async function callModelStream(
  text: string,
  config: ModelConfig,
  systemPrompt: string | undefined,
  maxTokens: number,
  onChunk: (content: string) => void,
  onDone: (duration: number, error?: string) => void,
): Promise<void> {
  const startTime = Date.now();

  try {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt || SYSTEM_PROMPT_DEFAULT },
          { role: "user", content: text },
        ],
        max_tokens: maxTokens || 2048,
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      onDone(Date.now() - startTime, `HTTP ${response.status}: ${errorBody || response.statusText}`);
      return;
    }

    const contentType = response.headers.get("content-type") || "";

    // 非 SSE 响应（API 不支持 stream），降级为一次性返回
    if (!contentType.includes("text/event-stream") && !contentType.includes("application/octet-stream")) {
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (content) onChunk(content);
      onDone(Date.now() - startTime);
      return;
    }

    // 解析 SSE 流
    const reader = response.body?.getReader();
    if (!reader) {
      onDone(Date.now() - startTime, "No response body");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按行解析 SSE
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta?: { content?: string } }>;
          };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    onDone(Date.now() - startTime);
  } catch (err) {
    onDone(Date.now() - startTime, err instanceof Error ? err.message : String(err));
  }
}
