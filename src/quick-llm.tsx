import { Action, ActionPanel, Detail, environment, Form, getSelectedText, Icon, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { callModelStream } from "./api";
import { AppConfig, ModelConfig, ModelResult } from "./types";

const STORAGE_KEY = "quick-llm-config";

const DEFAULT_PROMPT = "You are a helpful assistant. Process the following text according to the user's needs.";

const DEFAULT_CONFIG: AppConfig = {
  models: [],
  promptTemplates: [],
  activeTemplateIds: [],
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

async function saveConfig(config: AppConfig): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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

  const getActivePrompts = useCallback((cfg: AppConfig): { id: string; name: string; prompt: string }[] => {
    const ids = cfg.activeTemplateIds?.filter((id) => cfg.promptTemplates.some((t) => t.id === id));
    if (ids.length === 0) return [{ id: "_", name: "Default", prompt: DEFAULT_PROMPT }];
    return ids.map((id) => {
      const tpl = cfg.promptTemplates.find((t) => t.id === id);
      return { id, name: tpl?.name || "Unnamed", prompt: tpl?.prompt || DEFAULT_PROMPT };
    });
  }, []);

  const doProcess = useCallback(
    (text: string, models: ModelConfig[], prompts: { id: string; name: string; prompt: string }[], tokens: number) => {
      if (!text.trim() || models.length === 0 || prompts.length === 0) return;

      abortRef.current = false;
      setView({ type: "result", text });

      const initial: ModelResult[] = [];
      prompts.forEach((p) => {
        models.forEach((m) => {
          initial.push({ name: m.name, content: "", loading: true, streaming: false, templateId: p.id, templateName: p.name });
        });
      });
      setResults(initial);

      // 每个 prompt × 每个 model 独立调用
      let flatIndex = 0;
      prompts.forEach((p) => {
        models.forEach((model) => {
          const idx = flatIndex++;
          callModelStream(text, model, p.prompt, tokens,
            (chunk) => {
              if (abortRef.current) return;
              setResults((prev) => {
                const updated = [...prev];
                const cur = updated[idx];
                if (cur.loading || cur.streaming) {
                  updated[idx] = { ...cur, content: cur.content + chunk, loading: false, streaming: true };
                }
                return updated;
              });
            },
            (duration, error) => {
              if (abortRef.current) return;
              setResults((prev) => {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], streaming: false, duration, error: error || undefined };
                return updated;
              });
            },
          );
        });
      });
    },
    [],
  );

  useEffect(() => {
    return () => { abortRef.current = true; };
  }, []);

  useEffect(() => {
    async function init() {
      const cfg = await loadConfig();
      setConfig(cfg);

      if (cfg.models.length === 0) {
        setView({ type: "unconfigured" });
        return;
      }

      try {
        const text = (await getSelectedText()).trim();
        if (text) {
          const prompts = getActivePrompts(cfg);
          doProcess(text, cfg.models, prompts, cfg.maxTokens);
          return;
        }
      } catch (e) {
        console.error("getSelectedText failed:", e);
      }

      setView({ type: "input" });
    }

    init();
  }, [doProcess, getActivePrompts]);

  // 切换模板并重新执行
  const switchTemplate = useCallback(
    (templateId: string) => async () => {
      const cfg = await loadConfig();
      const ids = cfg.activeTemplateIds.includes(templateId)
        ? cfg.activeTemplateIds.filter((i) => i !== templateId)
        : [...new Set([...cfg.activeTemplateIds, templateId])];
      const updated = { ...cfg, activeTemplateIds: ids };
      await saveConfig(updated);
      setConfig(updated);
      if (view.type === "result" && view.text) {
        const prompts = getActivePrompts(updated);
        doProcess(view.text, updated.models, prompts, updated.maxTokens);
      }
      const tpl = cfg.promptTemplates.find((t) => t.id === templateId);
      await showToast({ style: Toast.Style.Success, title: tpl ? `${tpl.name} activated` : "Template activated" });
    },
    [view, doProcess, getActivePrompts],
  );

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

  if (view.type === "input") {
    return (
      <Form
        navigationTitle="Quick LLM"
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Submit"
              onSubmit={(values) => {
                const text = values.text.trim();
                if (text) {
                  doProcess(text, config.models, getActivePrompts(config), config.maxTokens);
                } else {
                  showToast({ style: Toast.Style.Failure, title: "Please enter text" });
                }
              }}
            />
            <Action.Open title="Configure Models" icon={Icon.Gear} target="raycast://extensions/raycast-quick-llm/configure" />
            <Action.Open title="Prompt Templates" icon={Icon.TextDocument} target="raycast://extensions/raycast-quick-llm/templates" />
          </ActionPanel>
        }
      >
        <Form.TextArea id="text" title="Text" placeholder="Enter or paste text..." />
      </Form>
    );
  }

  const allContent = results
    .filter((r) => r.content && !r.error)
    .map((r) => r.content)
    .join("\n\n");

  return (
    <List navigationTitle="Quick LLM" isShowingDetail>
      {results.map((result, index) => {
        const title = result.templateName ? `${result.templateName} · ${result.name}` : result.name;
        const preview = result.content ? result.content.split("\n").find((l) => l.trim())?.substring(0, 80) : "";
        const duration = result.duration ? `${(result.duration / 1000).toFixed(1)}s` : "";
        const detailContent = result.loading
          ? "*Connecting...*"
          : result.error
            ? `**Error:** ${result.error}`
            : result.content || "";
        return (
          <List.Item
            key={index}
            title={title}
            subtitle={preview || undefined}
            accessories={[
              ...(duration ? [{ text: duration }] : []),
              ...(result.error ? [{ icon: Icon.XMarkCircle }] : []),
              ...(result.loading ? [{ icon: Icon.Clock }] : []),
            ]}
            detail={
              <List.Item.Detail
                markdown={`## Input\n\n> ${view.text}\n\n---\n\n${detailContent}`}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title="Template" text={result.templateName || "Default"} />
                    <List.Item.Detail.Metadata.Label title="Model" text={result.name} />
                    {duration && <List.Item.Detail.Metadata.Label title="Duration" text={duration} />}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action title="Re-run" icon={Icon.ArrowClockwise} onAction={() => doProcess(view.text, config.models, getActivePrompts(config), config.maxTokens)} />
                <Action title="New Input" icon={Icon.Document} onAction={() => { setView({ type: "input" }); setResults([]); }} shortcut={{ modifiers: ["cmd"], key: "n" }} />
                <Action.Open title="Configure Models" icon={Icon.Gear} target="raycast://extensions/raycast-quick-llm/configure" shortcut={{ modifiers: ["cmd", "shift"], key: "c" }} />
                <Action.Open title="Prompt Templates" icon={Icon.TextDocument} target="raycast://extensions/raycast-quick-llm/templates" shortcut={{ modifiers: ["cmd", "shift"], key: "p" }} />
                {allContent && (
                  <Action.CopyToClipboard title="Copy All Results" content={allContent} shortcut={{ modifiers: ["cmd"], key: "c" }} />
                )}
                {result.content && !result.error && (
                  <>
                    <Action.CopyToClipboard title="Copy Result" content={result.content} />
                    <Action.Paste title="Paste Result" content={result.content} />
                  </>
                )}
                {config.promptTemplates.length > 0 && (
                  <ActionPanel.Submenu title="Switch Template" icon={Icon.SpeechBubble}>
                    {config.promptTemplates.map((tpl) => (
                      <Action
                        key={tpl.id}
                        title={config.activeTemplateIds.includes(tpl.id) ? `${tpl.name} ✓` : tpl.name}
                        icon={config.activeTemplateIds.includes(tpl.id) ? Icon.Checkmark : undefined}
                        onAction={switchTemplate(tpl.id)}
                      />
                    ))}
                  </ActionPanel.Submenu>
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
