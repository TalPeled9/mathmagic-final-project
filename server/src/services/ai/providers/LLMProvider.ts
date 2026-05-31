export interface LLMProviderRequest {
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  generateJson<T>(params: LLMProviderRequest): Promise<T>;
}
