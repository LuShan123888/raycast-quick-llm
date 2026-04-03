import { Action, ActionPanel, Clipboard, Detail, environment, Form, Icon, LocalStorage, showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { callModelStream } from "./api";
import { AppConfig, ModelConfig, ModelResult } from "./types";

const STORAGE_KEY = "quick-llm-config";

const DEFAULT_SYSTEM_PROMPT =
  "You are a professional translator. Translate the following text to Chinese. If the text is already in Chinese, translate it to English. Only output the translation result, nothing else.";

const DEFAULT_CONFIG: AppConfig = {
  models: [],
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  maxTokens: 2048,
};

async function loadConfig(): Promise<AppConfig> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as AppConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function buildMarkdown(text: string, results: ModelResult[]): string {
  const parts: string[] = [];

  parts.push(`## Input\n\n${text}\n\n---\n`);

  for (const result of results) {
    if (result.loading) {
      parts.push(`### ${result.name}\n\n*Connecting...*\n`);
    } else if (result.error) {
      parts.push(`### ${result.name} ❌\n\n**Error:** ${result.error}\n`);
    } else if (result.streaming) {
      parts.push(`### ${result.name} ⏳\n\n${result.content || " "}\n`);
    } else {
      const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : "";
      parts.push(`### ${result.name}${duration}\n\n${result.content}\n`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

type View =
  | { type: "input" }
  | { type: "result"; text: string }
  | { type: "unconfigured" };

export default function Command() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [view, setView] = useState<View>({ type: "input" });
  const abortRef = useRef(false);

  const doTranslate = useCallback(
    (text: string, models: ModelConfig[], prompt: string, tokens: number) => {
      if (!text.trim() || models.length === 0) return;

      abortRef.current = false;
      setView({ type: "result", text });

      // 初始化：所有模型为 loading 状态
      const initial: ModelResult[] = models.map((m) => ({
        name: m.name,
        content: "",
        loading: true,
        streaming: false,
      }));
      setResults(initial);

      // 并行启动所有模型的流式调用
      models.forEach((model, index) => {
        callModelStream(
          text,
          model,
          prompt,
          tokens,
          // onChunk: 逐步更新内容
          (chunk) => {
            if (abortRef.current) return;
            setResults((prev) => {
              const updated = [...prev];
              const cur = updated[index];
              if (cur.loading || cur.streaming) {
                updated[index] = { ...cur, content: cur.content + chunk, loading: false, streaming: true };
              }
              return updated;
            });
          },
          // onDone: 标记完成
          (duration, error) => {
            if (abortRef.current) return;
            setResults((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], streaming: false, duration, error: error || undefined };
              return updated;
            });
          },
        );
      });
    },
    [],
  );

  // 组件卸载时中止
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  useEffect(() => {
    async function init() {
      const cfg = await loadConfig();
      setConfig(cfg);

      if (cfg.models.length === 0) {
        setView({ type: "unconfigured" });
        return;
      }

      // 优先获取选中文本
      try {
        const text = (await environment.getSelectedText()).trim();
        if (text) {
          doTranslate(text, cfg.models, cfg.systemPrompt, cfg.maxTokens);
          return;
        }
      } catch {
        // getSelectedText 失败，继续尝试剪贴板
      }

      // 回退到剪贴板内容
      try {
        const clipboard = (await Clipboard.read()).trim();
        if (clipboard) {
          doTranslate(clipboard, cfg.models, cfg.systemPrompt, cfg.maxTokens);
          return;
        }
      } catch {
        // Clipboard 也失败，显示输入表单
      }

      // 都没有，显示输入表单
      setView({ type: "input" });
    }

    init();
  }, [doTranslate]);

  // 未配置模型
  if (view.type === "unconfigured") {
    return (
      <Detail
        markdown="# Quick LLM\n\nNo models configured yet.\n\nOpen **Configure Models** to add your first model."
        actions={
          <ActionPanel>
            <Action.Open title="Configure Models" icon={Icon.Gear} target="raycast://extensions/raycast-quick-llm/configure" />
          </ActionPanel>
        }
      />
    );
  }

  // 输入表单
  if (view.type === "input") {
    return (
      <Form
        navigationTitle="Quick LLM"
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Translate"
              onSubmit={(values) => {
                const text = values.text.trim();
                if (text) {
                  doTranslate(text, config.models, config.systemPrompt, config.maxTokens);
                } else {
                  showToast({ style: Toast.Style.Failure, title: "Please enter text" });
                }
              }}
            />
            <Action.Open title="Configure Models" icon={Icon.Gear} target="raycast://extensions/raycast-quick-llm/configure" />
          </ActionPanel>
        }
      >
        <Form.TextArea id="text" title="Text" placeholder="Enter or paste text to translate..." />
      </Form>
    );
  }

  // 结果视图
  const markdown = buildMarkdown(view.text, results);
  const hasResults = results.some((r) => r.content && !r.error);

  const allContent = results
    .filter((r) => r.content && !r.error)
    .map((r) => r.content)
    .join("\n\n");

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Quick LLM"
      actions={
        <ActionPanel>
          <Action title="Re-translate" icon={Icon.ArrowClockwise} onAction={() => doTranslate(view.text, config.models, config.systemPrompt, config.maxTokens)} />
          <Action title="New Input" icon={Icon.Document} onAction={() => { setView({ type: "input" }); setResults([]); }} shortcut={{ modifiers: ["cmd"], key: "n" }} />
          <Action.Open
            title="Configure Models"
            icon={Icon.Gear}
            target="raycast://extensions/raycast-quick-llm/configure"
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          {allContent && (
            <Action.CopyToClipboard
              title="Copy All Results"
              content={allContent}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          )}
          {results.map(
            (result, index) =>
              result.content && !result.error && (
                <ActionPanel.Submenu key={index} title={result.name} icon={Icon.Bot}>
                  <Action.CopyToClipboard title="Copy Result" content={result.content} />
                  <Action.Paste title="Paste Result" content={result.content} />
                </ActionPanel.Submenu>
              ),
          )}
        </ActionPanel>
      }
    />
  );
}
