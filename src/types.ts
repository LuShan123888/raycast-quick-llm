export interface ModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AppConfig {
  models: ModelConfig[];
  systemPrompt: string;
  maxTokens: number;
}

export interface ModelResult {
  name: string;
  content: string;
  loading: boolean;
  streaming: boolean;
  error?: string;
  duration?: number;
}
