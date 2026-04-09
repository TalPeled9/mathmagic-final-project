import { describe, it, expect, vi, afterEach } from 'vitest';
import { OllamaProvider } from '../../services/ai/providers/ollamaProvider';

vi.mock('../../config', () => ({
  config: {
    ollama: {
      baseUrl: 'http://10.10.248.41',
      username: 'student1',
      password: 'pass123',
      model: 'llama3.1:8b',
    },
  },
}));

const schema = {
  type: 'object',
  properties: {
    wizzyDialogue: { type: 'string' },
    answerOptions: { type: 'array' },
    correctAnswer: { type: 'string' },
  },
};

const mockResponse = {
  wizzyDialogue: 'Hello!',
  answerOptions: ['3', '4', '5', '6'],
  correctAnswer: '4',
};

function mockFetch(responseBody: unknown, ok = true, status = 200): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(responseBody),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OllamaProvider', () => {
  it('exposes name "ollama"', () => {
    expect(new OllamaProvider().name).toBe('ollama');
  });

  it('sends a POST to /api/generate with Basic Auth and format: "json"', async () => {
    mockFetch({ response: JSON.stringify(mockResponse) });

    await new OllamaProvider().generateJson({ prompt: 'Generate a question', schema });

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('http://10.10.248.41/api/generate');

    const expectedAuth = `Basic ${Buffer.from('student1:pass123').toString('base64')}`;
    expect((init.headers as Record<string, string>)['Authorization']).toBe(expectedAuth);

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('llama3.1:8b');
    expect(body.format).toBe('json');
    expect(body.stream).toBe(false);
  });

  it('appends JSON format instructions derived from schema properties to the prompt', async () => {
    mockFetch({ response: JSON.stringify(mockResponse) });

    await new OllamaProvider().generateJson({ prompt: 'My base prompt', schema });

    const body = JSON.parse(
      ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit])[1]
        .body as string
    );
    expect(body.prompt).toContain('My base prompt');
    expect(body.prompt).toContain('IMPORTANT: Respond with ONLY a valid JSON object');
    expect(body.prompt).toContain('"wizzyDialogue"');
    expect(body.prompt).toContain('"answerOptions"');
  });

  it('parses and returns the JSON from response.response', async () => {
    mockFetch({ response: JSON.stringify(mockResponse) });

    const result = await new OllamaProvider().generateJson({ prompt: 'test', schema });
    expect(result).toEqual(mockResponse);
  });

  it('forwards temperature and maxOutputTokens to options', async () => {
    mockFetch({ response: JSON.stringify(mockResponse) });

    await new OllamaProvider().generateJson({
      prompt: 'test',
      schema,
      temperature: 0.3,
      maxOutputTokens: 512,
    });

    const body = JSON.parse(
      ((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit])[1]
        .body as string
    );
    expect(body.options.temperature).toBe(0.3);
    expect(body.options.num_predict).toBe(512);
  });

  it('throws with HTTP status when Ollama returns a non-OK response', async () => {
    mockFetch({}, false, 429);
    await expect(
      new OllamaProvider().generateJson({ prompt: 'test', schema })
    ).rejects.toThrow('HTTP 429');
  });

  it('throws when response.response is empty', async () => {
    mockFetch({ response: '' });
    await expect(
      new OllamaProvider().generateJson({ prompt: 'test', schema })
    ).rejects.toThrow('empty response body');
  });

  it('throws when response.response is not valid JSON', async () => {
    mockFetch({ response: 'not json at all' });
    await expect(
      new OllamaProvider().generateJson({ prompt: 'test', schema })
    ).rejects.toThrow('invalid JSON');
  });
});
