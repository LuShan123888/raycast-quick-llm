import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  LocalStorage,
  showToast,
  Toast,
  pop,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { AppConfig, ModelConfig } from "./types";

const STORAGE_KEY = "quick-llm-config";

const DEFAULT_CONFIG: AppConfig = { models: [], promptTemplates: [], activeTemplateIds: [], maxTokens: 2048 };

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

type View = { type: "list" } | { type: "add-model" } | { type: "edit-model"; model: ModelConfig } | { type: "settings" };

export default function ConfigureCommand() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
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

  // 列表视图
  if (view.type === "list") {
    return (
      <List isLoading={isLoading} navigationTitle="Configure Models">
        {config.models.map((model) => (
          <List.Item
            key={model.id}
            title={model.name}
            subtitle={model.model}
            accessories={[{ text: model.baseUrl.replace(/https?:\/\//, "") }]}
            actions={
              <ActionPanel>
                <Action title="Edit Model" icon={Icon.Pencil} onAction={() => setView({ type: "edit-model", model })} />
                <Action
                  title="Delete Model"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    const updated = { ...config, models: config.models.filter((m) => m.id !== model.id) };
                    await saveConfig(updated);
                    setConfig(updated);
                    await showToast({ style: Toast.Style.Success, title: `${model.name} deleted` });
                  }}
                />
                <Action title="Add Model" icon={Icon.Plus} onAction={() => setView({ type: "add-model" })} shortcut={{ modifiers: ["cmd"], key: "n" }} />
                <Action title="Settings" icon={Icon.Gear} onAction={() => setView({ type: "settings" })} shortcut={{ modifiers: ["cmd"], key: "," }} />
              </ActionPanel>
            }
          />
        ))}
        {config.models.length === 0 && !isLoading && (
          <List.EmptyView
            icon={Icon.Plus}
            title="No models configured"
            description="Add a model to get started"
            actions={
              <ActionPanel>
                <Action title="Add Model" icon={Icon.Plus} onAction={() => setView({ type: "add-model" })} />
              </ActionPanel>
            }
          />
        )}
      </List>
    );
  }

  // 添加/编辑模型表单
  if (view.type === "add-model" || view.type === "edit-model") {
    const model = view.type === "edit-model" ? view.model : undefined;
    const isEdit = !!model;

    return (
      <Form
        navigationTitle={isEdit ? `Edit ${model.name}` : "Add Model"}
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title={isEdit ? "Update" : "Add"}
              onSubmit={async (values) => {
                const cfg = await loadConfig();
                const updated: ModelConfig = {
                  id: model?.id || Date.now().toString(),
                  name: values.name || values.model || "Unnamed",
                  baseUrl: values.baseUrl.replace(/\/+$/, ""),
                  apiKey: values.apiKey,
                  model: values.model,
                };

                if (isEdit) {
                  const index = cfg.models.findIndex((m) => m.id === model.id);
                  if (index >= 0) cfg.models[index] = updated;
                } else {
                  cfg.models.push(updated);
                }

                await saveConfig(cfg);
                setConfig(cfg);
                await showToast({ style: Toast.Style.Success, title: isEdit ? "Model updated" : "Model added" });
                setView({ type: "list" });
              }}
            />
            <Action title="Cancel" onAction={() => setView({ type: "list" })} />
          </ActionPanel>
        }
      >
        <Form.TextField id="name" title="Model Name" placeholder="GPT-4o" defaultValue={model?.name || ""} />
        <Form.TextField
          id="baseUrl"
          title="Base URL"
          placeholder="https://api.openai.com"
          defaultValue={model?.baseUrl || ""}
        />
        <Form.PasswordField id="apiKey" title="API Key" placeholder="sk-..." defaultValue={model?.apiKey || ""} />
        <Form.TextField id="model" title="Model ID" placeholder="gpt-4o" defaultValue={model?.model || ""} />
      </Form>
    );
  }

  // 系统设置表单
  if (view.type === "settings") {
    return (
      <Form
        navigationTitle="Settings"
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Save"
              onSubmit={async (values) => {
                const updated = {
                  ...config,
                  maxTokens: parseInt(values.maxTokens, 10) || 2048,
                };
                await saveConfig(updated);
                setConfig(updated);
                await showToast({ style: Toast.Style.Success, title: "Settings updated" });
                setView({ type: "list" });
              }}
            />
            <Action title="Cancel" onAction={() => setView({ type: "list" })} />
          </ActionPanel>
        }
      >
        <Form.TextField id="maxTokens" title="Max Tokens" placeholder="2048" defaultValue={String(config.maxTokens)} />
      </Form>
    );
  }

  return null;
}
