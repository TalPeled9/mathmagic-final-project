// server/src/services/ai/providers/geminiProvider.ts
import { config } from '../../../config';
import { GeminiJsonClient } from '../geminiClient';
import { systemInstructions } from '../prompts/systemInstructions';
import type { LLMProvider, LLMProviderRequest } from './LLMProvider';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private readonly client = new GeminiJsonClient(config.gemini.apiKey, systemInstructions);

  async generateJson<T>(params: LLMProviderRequest): Promise<T> {
    return this.client.generateJson<T>({
      model: config.gemini.model,
      prompt: params.prompt,
      schema: params.schema,
      temperature: params.temperature,
      maxOutputTokens: params.maxOutputTokens,
    });
  }
}
