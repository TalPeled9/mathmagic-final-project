import { describe, it, expect, vi } from 'vitest';
import { FallbackLLMClient } from '../../services/ai/fallbackLLMClient';
import type { LLMProvider, LLMProviderRequest } from '../../services/ai/providers/LLMProvider';

const params: LLMProviderRequest = { prompt: 'test', schema: {} };

function makeProvider(name: string, result: unknown): LLMProvider {
  return { name, generateJson: vi.fn().mockResolvedValue(result) };
}

function makeFailingProvider(name: string, message = 'provider error'): LLMProvider {
  return { name, generateJson: vi.fn().mockRejectedValue(new Error(message)) };
}

describe('FallbackLLMClient', () => {
  it('returns the result from the first provider when it succeeds', async () => {
    const p1 = makeProvider('p1', { answer: 1 });
    const p2 = makeProvider('p2', { answer: 2 });
    const client = new FallbackLLMClient([p1, p2]);

    const result = await client.generateJson(params);

    expect(result).toEqual({ answer: 1 });
    expect(p2.generateJson).not.toHaveBeenCalled();
  });

  it('falls through to the second provider when the first fails', async () => {
    const p1 = makeFailingProvider('p1');
    const p2 = makeProvider('p2', { answer: 2 });
    const client = new FallbackLLMClient([p1, p2]);

    const result = await client.generateJson(params);

    expect(result).toEqual({ answer: 2 });
    expect(p1.generateJson).toHaveBeenCalledOnce();
  });

  it('throws when all providers fail', async () => {
    const client = new FallbackLLMClient([
      makeFailingProvider('p1'),
      makeFailingProvider('p2'),
    ]);

    await expect(client.generateJson(params)).rejects.toThrow('All LLM providers failed');
  });

  it('passes the same params object to every provider it tries', async () => {
    const p1 = makeFailingProvider('p1');
    const p2 = makeProvider('p2', { ok: true });
    const client = new FallbackLLMClient([p1, p2]);

    await client.generateJson(params);

    expect(p1.generateJson).toHaveBeenCalledWith(params);
    expect(p2.generateJson).toHaveBeenCalledWith(params);
  });

  it('skips a failing middle provider and succeeds on the third', async () => {
    const p1 = makeFailingProvider('p1');
    const p2 = makeFailingProvider('p2');
    const p3 = makeProvider('p3', { answer: 3 });
    const client = new FallbackLLMClient([p1, p2, p3]);

    const result = await client.generateJson(params);

    expect(result).toEqual({ answer: 3 });
  });
});
