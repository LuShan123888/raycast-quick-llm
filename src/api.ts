import { ModelConfig, ModelResult } from "./types";

const SYSTEM_PROMPT_DEFAULT =
  "You are a professional translator. Translate the following text to Chinese. If the text is already in Chinese, translate it to English. Only output the translation result, nothing else.";

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
          {
            role: "system",
            content: systemPrompt || SYSTEM_PROMPT_DEFAULT,
          },
          {
            role: "user",
            content: text,
          },
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
      duration: Date.now() - startTime,
    };
  } catch (err) {
    return {
      name: config.name,
      content: "",
      loading: false,
      error: err instanceof Error ? err.message : String(err),
      duration: Date.now() - startTime,
    };
  }
}

export async function callAllModels(
  text: string,
  models: ModelConfig[],
  systemPrompt?: string,
  maxTokens?: number,
): Promise<ModelResult[]> {
  const calls = models.map((model) => callModel(text, model, systemPrompt, maxTokens));
  return Promise.all(calls);
}
