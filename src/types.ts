export interface ModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
}

export interface AppConfig {
  models: ModelConfig[];
  promptTemplates: PromptTemplate[];
  activeTemplateIds: string[];
  maxTokens: number;
}

export interface ModelResult {
  name: string;
  content: string;
  loading: boolean;
  streaming: boolean;
  error?: string;
  duration?: number;
  templateId?: string;
  templateName?: string;
}
