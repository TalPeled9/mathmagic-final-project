// server/src/tests/unit/geminiProvider.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GeminiProvider } from '../../services/ai/providers/geminiProvider';
import { GeminiJsonClient } from '../../services/ai/geminiClient';

vi.mock('../../services/ai/geminiClient');
vi.mock('../../config', () => ({
  config: {
    gemini: { apiKey: 'test-api-key', model: 'gemini-2.0-flash' },
  },
}));
vi.mock('../../services/ai/prompts/systemInstructions', () => ({
  systemInstructions: 'test-instructions',
}));

describe('GeminiProvider', () => {
  it('exposes name "gemini"', () => {
    vi.mocked(GeminiJsonClient).mockImplementation(
      () => ({ generateJson: vi.fn() }) as unknown as GeminiJsonClient
    );
    const provider = new GeminiProvider();
    expect(provider.name).toBe('gemini');
  });

  it('calls GeminiJsonClient.generateJson with model from config and all request params', async () => {
    const mockGenerateJson = vi.fn().mockResolvedValue({ result: 'ok' });
    vi.mocked(GeminiJsonClient).mockImplementation(
      () => ({ generateJson: mockGenerateJson }) as unknown as GeminiJsonClient
    );

    const provider = new GeminiProvider();
    const schema = { type: 'object', properties: { result: { type: 'string' } } };
    const result = await provider.generateJson({
      prompt: 'hello',
      schema,
      temperature: 0.5,
      maxOutputTokens: 1024,
    });

    expect(result).toEqual({ result: 'ok' });
    expect(mockGenerateJson).toHaveBeenCalledWith({
      model: 'gemini-2.0-flash',
      prompt: 'hello',
      schema,
      temperature: 0.5,
      maxOutputTokens: 1024,
    });
  });

  it('propagates errors from GeminiJsonClient', async () => {
    vi.mocked(GeminiJsonClient).mockImplementation(
      () => ({
        generateJson: vi.fn().mockRejectedValue(new Error('rate limited')),
      }) as unknown as GeminiJsonClient
    );

    const provider = new GeminiProvider();
    await expect(
      provider.generateJson({ prompt: 'x', schema: {} })
    ).rejects.toThrow('rate limited');
  });
});
