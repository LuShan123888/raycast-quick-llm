export interface ModelConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ModelResult {
  name: string;
  content: string;
  loading: boolean;
  error?: string;
  duration?: number;
}
