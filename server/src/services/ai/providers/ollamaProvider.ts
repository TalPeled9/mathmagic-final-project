import { config } from '../../../config';
import type { LLMProvider, LLMProviderRequest } from './LLMProvider';

const TIMEOUT_MS = 30_000;

function buildJsonTemplate(schema: Record<string, unknown>): string {
  const props =
    (schema as { properties?: Record<string, { type?: string }> }).properties ?? {};
  const fields = Object.entries(props).map(([key, def]) => {
    if (def.type === 'array') return `  "${key}": ["<string>"]`;
    return `  "${key}": "<${def.type ?? 'string'}>"`;
  });
  return `{\n${fields.join(',\n')}\n}`;
}

function buildPromptWithJsonInstruction(
  prompt: string,
  schema: Record<string, unknown>
): string {
  return `${prompt}

IMPORTANT: Respond with ONLY a valid JSON object — no explanation, no markdown, no code fences.
Use exactly this structure:
${buildJsonTemplate(schema)}`;
}

function buildAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';

  async generateJson<T>(params: LLMProviderRequest): Promise<T> {
    const { baseUrl, username, password, model } = config.ollama;
    const prompt = buildPromptWithJsonInstruction(params.prompt, params.schema);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: buildAuthHeader(username, password),
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: params.temperature ?? 0.7,
            num_predict: params.maxOutputTokens ?? 2048,
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Ollama request failed: HTTP ${response.status}`);
    }

    const body = (await response.json()) as { response?: string };
    const rawText = body.response;
    if (!rawText) {
      throw new Error('Ollama returned an empty response body.');
    }

    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Ollama returned invalid JSON: ${rawText}`);
    }
  }
}
