import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  LocalStorage,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { AppConfig, PromptTemplate } from "./types";

const STORAGE_KEY = "quick-llm-config";

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "translate",
    name: "Translate",
    prompt:
      "You are a professional translator. Translate the following text to Chinese. If the text is already in Chinese, translate it to English. Only output the translation result, nothing else.",
  },
  {
    id: "polish",
    name: "Polish",
    prompt:
      "You are a writing expert. Polish and improve the following text. Fix grammar, enhance clarity and readability. Only output the polished text, nothing else.",
  },
  {
    id: "summarize",
    name: "Summarize",
    prompt:
      "Summarize the following text concisely. Output the summary directly, nothing else.",
  },
  {
    id: "custom",
    name: "Custom",
    prompt: "You are a helpful assistant. Process the following text according to the user's needs.",
  },
];

async function loadConfig(): Promise<AppConfig> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) {
    return {
      models: [],
      promptTemplates: DEFAULT_TEMPLATES,
      activeTemplateIds: ["translate"],
      maxTokens: 2048,
    };
  }
  try {
    const parsed = JSON.parse(raw) as AppConfig;
    // 兼容旧格式
    const hasTemplates = Array.isArray(parsed.promptTemplates) && parsed.promptTemplates.length > 0;
    if (!hasTemplates) {
      parsed.promptTemplates = DEFAULT_TEMPLATES;
      parsed.activeTemplateIds = ["translate"];
      if (parsed.systemPrompt && parsed.systemPrompt !== "") {
        const custom = parsed.promptTemplates.find((t) => t.id === "custom");
        if (custom) custom.prompt = parsed.systemPrompt;
      }
    }
    // activeTemplateId → activeTemplateIds 迁移
    if (!Array.isArray(parsed.activeTemplateIds)) {
      parsed.activeTemplateIds = parsed.activeTemplateId
        ? [parsed.activeTemplateId]
        : [];
    }
    // 过滤无效 ID
    let validIds = parsed.activeTemplateIds.filter((id) => parsed.promptTemplates.some((t) => t.id === id));
    if (validIds.length === 0) {
      validIds = [parsed.promptTemplates[0]?.id || "translate"];
    }
    parsed.activeTemplateIds = validIds;
    return parsed;
  } catch {
    return {
      models: [],
      promptTemplates: DEFAULT_TEMPLATES,
      activeTemplateIds: ["translate"],
      maxTokens: 2048,
    };
  }
}

async function saveConfig(config: AppConfig): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

type View =
  | { type: "list" }
  | { type: "add-template" }
  | { type: "edit-template"; template: PromptTemplate };

export default function TemplatesCommand() {
  const [config, setConfig] = useState<AppConfig>({ models: [], promptTemplates: [], activeTemplateIds: [], maxTokens: 2048 });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>({ type: "list" });

  const refresh = useCallback(async () => {
    const cfg = await loadConfig();
    setConfig(cfg);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isActive = (id: string) => config.activeTemplateIds.includes(id);

  const toggleActive = useCallback(
    (id: string) => async () => {
      const cfg = await loadConfig();
      const wasActive = cfg.activeTemplateIds.includes(id);
      const ids = wasActive
        ? cfg.activeTemplateIds.filter((i) => i !== id)
        : [...new Set([...cfg.activeTemplateIds, id])];
      const updated = { ...cfg, activeTemplateIds: ids };
      await saveConfig(updated);
      setConfig(updated);
      const tpl = cfg.promptTemplates.find((t) => t.id === id);
      await showToast({
        style: Toast.Style.Success,
        title: wasActive ? `${tpl?.name} deactivated` : `${tpl?.name} activated`,
      });
    },
    [],
  );

  if (view.type === "list") {
    return (
      <List isLoading={isLoading} navigationTitle="Prompt Templates">
        {config.promptTemplates.map((tpl) => (
          <List.Item
            key={tpl.id}
            title={tpl.name}
            accessories={isActive(tpl.id) ? [{ icon: Icon.Checkmark }] : []}
            actions={
              <ActionPanel>
                <Action
                  title={isActive(tpl.id) ? "Deactivate" : "Activate"}
                  icon={isActive(tpl.id) ? Icon.Circle : Icon.Checkmark}
                  onAction={toggleActive(tpl.id)}
                  shortcut={{ modifiers: ["cmd"], key: "a" }}
                />
                <Action title="Edit Template" icon={Icon.Pencil} onAction={() => setView({ type: "edit-template", template: tpl })} />
                <Action
                  title="Delete Template"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    const updated = { ...config, activeTemplateIds: config.activeTemplateIds.filter((i) => i !== tpl.id) };
                    await saveConfig(updated);
                    setConfig(updated);
                    await showToast({ style: Toast.Style.Success, title: `${tpl.name} deleted` });
                  }}
                />
                <Action
                  title="Add Template"
                  icon={Icon.Plus}
                  onAction={() => setView({ type: "add-template" })}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List>
    );
  }

  if (view.type === "add-template" || view.type === "edit-template") {
    const template = view.type === "edit-template" ? view.template : undefined;
    const isEdit = !!template;

    return (
      <Form
        navigationTitle={isEdit ? `Edit ${template.name}` : "Add Template"}
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title={isEdit ? "Update" : "Add"}
              onSubmit={async (values) => {
                const cfg = await loadConfig();
                const updated: PromptTemplate = {
                  id: template?.id || Date.now().toString(),
                  name: values.name || "Unnamed",
                  prompt: values.prompt,
                };

                if (isEdit) {
                  const index = cfg.promptTemplates.findIndex((t) => t.id === template.id);
                  if (index >= 0) cfg.promptTemplates[index] = updated;
                } else {
                  cfg.promptTemplates.push(updated);
                }

                await saveConfig(cfg);
                setConfig(cfg);
                await showToast({ style: Toast.Style.Success, title: isEdit ? "Template updated" : "Template added" });
                setView({ type: "list" });
              }}
            />
            <Action title="Cancel" onAction={() => setView({ type: "list" })} />
          </ActionPanel>
        }
      >
        <Form.TextField id="name" title="Name" placeholder="Translate" defaultValue={template?.name || ""} />
        <Form.TextArea id="prompt" title="System Prompt" placeholder="You are a professional translator..." defaultValue={template?.prompt || ""} />
      </Form>
    );
  }

  return null;
}
