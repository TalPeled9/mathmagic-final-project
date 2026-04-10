import type { LLMProvider, LLMProviderRequest } from './providers/LLMProvider';
import { logger } from '../../lib/logger';

export class FallbackLLMClient {
  constructor(private readonly providers: LLMProvider[]) {}

  async generateJson<T>(params: LLMProviderRequest): Promise<T> {
    for (const provider of this.providers) {
      try {
        return await provider.generateJson<T>(params);
      } catch (err) {
        logger.warn({ err }, `Provider "${provider.name}" failed, trying next.`);
      }
    }
    throw new Error('All LLM providers failed.');
  }
}
