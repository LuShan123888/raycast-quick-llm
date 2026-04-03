import { Action, ActionPanel, Detail, environment, getPreferenceValues, Icon, showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { callAllModels, callModel } from "./api";
import { ModelConfig, ModelResult } from "./types";

interface Preferences {
  model1Name: string;
  model1BaseUrl: string;
  model1ApiKey: string;
  model1Model: string;
  model2Name: string;
  model2BaseUrl: string;
  model2ApiKey: string;
  model2Model: string;
  model3Name: string;
  model3BaseUrl: string;
  model3ApiKey: string;
  model3Model: string;
  systemPrompt: string;
  maxTokens: string;
}

function getModelsFromPreferences(prefs: Preferences): ModelConfig[] {
  const models: ModelConfig[] = [];

  const entries: Array<[string, string, string, string]> = [
    [prefs.model1Name, prefs.model1BaseUrl, prefs.model1ApiKey, prefs.model1Model],
    [prefs.model2Name, prefs.model2BaseUrl, prefs.model2ApiKey, prefs.model2Model],
    [prefs.model3Name, prefs.model3BaseUrl, prefs.model3ApiKey, prefs.model3Model],
  ];

  for (const [name, baseUrl, apiKey, model] of entries) {
    if (baseUrl && apiKey && model) {
      models.push({
        name: name || model,
        baseUrl,
        apiKey,
        model,
      });
    }
  }

  return models;
}

function buildMarkdown(selectedText: string, results: ModelResult[]): string {
  const parts: string[] = [];

  parts.push(`## Original\n\n${selectedText}\n\n---\n`);

  for (const result of results) {
    if (result.loading) {
      parts.push(`### ${result.name}\n\n*Loading...*\n`);
    } else if (result.error) {
      parts.push(`### ${result.name}\n\n**Error:** ${result.error}\n`);
    } else {
      const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : "";
      parts.push(`### ${result.name}${duration}\n\n${result.content}\n`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

export default function Command() {
  const [selectedText, setSelectedText] = useState<string>("");
  const [results, setResults] = useState<ModelResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<ModelConfig[]>([]);

  const prefs = getPreferenceValues<Preferences>();
  const systemPrompt = prefs.systemPrompt;
  const maxTokens = parseInt(prefs.maxTokens || "2048", 10);

  const doTranslate = useCallback(
    async (text: string, modelConfigs: ModelConfig[]) => {
      if (!text.trim() || modelConfigs.length === 0) return;

      setIsLoading(true);

      // Initialize with loading states, then update each model as it completes
      const initialResults: ModelResult[] = modelConfigs.map((m) => ({
        name: m.name,
        content: "",
        loading: true,
      }));
      setResults(initialResults);

      // Call each model independently and update state progressively
      const promises = modelConfigs.map(async (model, index) => {
        const result = await callModel(text, model, systemPrompt, maxTokens);
        setResults((prev) => {
          const updated = [...prev];
          updated[index] = result;
          return updated;
        });
        return result;
      });

      await Promise.all(promises);
      setIsLoading(false);
    },
    [systemPrompt, maxTokens],
  );

  useEffect(() => {
    async function init() {
      const modelConfigs = getModelsFromPreferences(prefs);

      if (modelConfigs.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "No models configured",
          message: "Please configure at least one model in extension settings",
        });
        setIsLoading(false);
        return;
      }

      setModels(modelConfigs);

      try {
        const text = await environment.getSelectedText();
        const trimmed = text.trim();

        if (trimmed) {
          setSelectedText(trimmed);
          await doTranslate(trimmed, modelConfigs);
        } else {
          setSelectedText("(no text selected)");
          setIsLoading(false);
        }
      } catch {
        setSelectedText("(failed to get selected text — grant Accessibility permission in System Settings)");
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const markdown = selectedText ? buildMarkdown(selectedText, results) : "# Loading...";

  const allContent = results
    .filter((r) => r.content)
    .map((r) => r.content)
    .join("\n\n");

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle="Multi Translate"
      actions={
        <ActionPanel>
          <Action
            title="Re-translate"
            icon={Icon.ArrowClockwise}
            onAction={() => doTranslate(selectedText, models)}
          />
          {allContent && (
            <Action.CopyToClipboard
              title="Copy All Translations"
              content={allContent}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          )}
          {results.map(
            (result, index) =>
              result.content && (
                <Action.CopyToClipboard
                  key={index}
                  title={`Copy ${result.name} Result`}
                  content={result.content}
                  shortcut={{ modifiers: ["cmd", "shift"], key: String(index + 1) as "1" | "2" | "3" }}
                />
              ),
          )}
          <Action.Paste
            title="Paste First Result"
            content={results[0]?.content || ""}
            shortcut={{ modifiers: ["cmd"], key: "p" }}
          />
        </ActionPanel>
      }
    />
  );
}
