export type GeminiResponseSchema = Record<string, unknown>;

interface GenerateJsonParams {
  prompt: string;
  schema: GeminiResponseSchema;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiJsonClient {
  private aiPromise?: Promise<GeminiModelClient>;

  constructor(
    private readonly apiKey: string,
    private readonly systemInstruction: string
  ) {}

  async generateJson<T>({
    prompt,
    schema,
    model,
    temperature = 0.7,
    maxOutputTokens = 2048,
  }: GenerateJsonParams): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is missing. Set GEMINI_API_KEY before calling LLM service.');
    }

    const ai = await this.getClient();

    if (process.env.DEBUG_AI_LOGS) {
      console.info('\n─── Gemini prompt ───────────────────────────────────────');
      console.info(prompt);
      console.info('─────────────────────────────────────────────────────────\n');
    }

    const llmStart = Date.now();
    const response = await ai.models.generateContent({
      model,
      config: {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: schema,
        systemInstruction: this.systemInstruction,
      },
      contents: prompt,
    });
    const llmDurationMs = Date.now() - llmStart;

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty response body.');
    }

    if (process.env.DEBUG_AI_LOGS) {
      console.info(`⏱  LLM: ${(llmDurationMs / 1000).toFixed(1)}s`);
      console.info('\n─── Gemini response ──────────────────────────────────────');
      console.info(rawText);
      console.info('─────────────────────────────────────────────────────────\n');
    }

    return parseJsonResponse<T>(rawText);
  }

  private getClient(): Promise<GeminiModelClient> {
    if (!this.aiPromise) {
      this.aiPromise = createClientPromise(this.apiKey);
    }

    return this.aiPromise;
  }
}

interface GeminiModelClient {
  models: {
    generateContent: (request: unknown) => Promise<{ text?: string }>;
  };
}

interface GoogleGenAIModule {
  GoogleGenAI: new (params: { apiKey: string }) => GeminiModelClient;
}

async function loadGoogleGenAIModule(): Promise<GoogleGenAIModule> {
  return import('@google/genai') as Promise<GoogleGenAIModule>;
}

function createClientPromise(apiKey: string): Promise<GeminiModelClient> {
  return loadGoogleGenAIModule().then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey }));
}

function parseJsonResponse<T>(rawText: string): T {
  const text = rawText.trim();
  const normalized = text.startsWith('```') ? stripMarkdownCodeFence(text) : text;

  try {
    return JSON.parse(normalized) as T;
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text}`);
  }
}

function stripMarkdownCodeFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}
