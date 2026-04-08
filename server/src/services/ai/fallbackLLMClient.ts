import type { LLMProvider, LLMProviderRequest } from './providers/LLMProvider';

export class FallbackLLMClient {
  constructor(private readonly providers: LLMProvider[]) {}

  async generateJson<T>(params: LLMProviderRequest): Promise<T> {
    for (const provider of this.providers) {
      try {
        return await provider.generateJson<T>(params);
      } catch (err) {
        console.warn(
          `[FallbackLLMClient] Provider "${provider.name}" failed, trying next.`,
          err
        );
      }
    }
    throw new Error('All LLM providers failed.');
  }
}
