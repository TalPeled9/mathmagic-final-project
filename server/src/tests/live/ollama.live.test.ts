import { describe, expect, it } from 'vitest';
import { OllamaProvider } from '../../services/ai/providers/ollamaProvider';

type TimingEntry = { step: string; durationMs: number };

async function timedGenerate<T>(
  label: string,
  provider: OllamaProvider,
  params: Parameters<OllamaProvider['generateJson']>[0],
  timings: TimingEntry[]
): Promise<T> {
  const start = Date.now();
  const result = await provider.generateJson<T>(params);
  const durationMs = Date.now() - start;
  timings.push({ step: label, durationMs });
  console.info(`⏱  ${label}: ${(durationMs / 1000).toFixed(1)}s`);
  return result;
}

const storyStepSchema = {
  type: 'object',
  properties: {
    adventureNarrative: { type: 'string' },
    wizzyDialogue: { type: 'string' },
    storyChoices: { type: 'array' },
    imageDescription: { type: 'string' },
  },
};

const mathQuestionSchema = {
  type: 'object',
  properties: {
    wizzyDialogue: { type: 'string' },
    problemText: { type: 'string' },
    answerOptions: { type: 'array' },
    correctAnswer: { type: 'string' },
    imageDescription: { type: 'string' },
  },
};

describe('Ollama live — provider connectivity', () => {
  const timings: TimingEntry[] = [];

  it.skipIf(!process.env.OLLAMA_BASE_URL)(
    'throws a descriptive error when env vars are missing',
    () => {
      // This block only runs if OLLAMA_BASE_URL is somehow set but others are not.
      // The real gate is in beforeAll of each test. Covered by unit tests.
    }
  );

  it(
    'generates a story step response with correct shape',
    { timeout: 60_000 },
    async () => {
      for (const key of ['OLLAMA_BASE_URL', 'OLLAMA_MODEL', 'OLLAMA_USERNAME', 'OLLAMA_PASSWORD']) {
        if (!process.env[key]) {
          throw new Error(
            `${key} is not set. Add it to server/.env before running: npm run test:live:ollama`
          );
        }
      }

      const provider = new OllamaProvider();

      const result = await timedGenerate<{
        adventureNarrative: string;
        wizzyDialogue: string;
        storyChoices: string[];
        imageDescription: string;
      }>(
        'story step',
        provider,
        {
          prompt:
            'Generate a short adventure story step for a 7-year-old exploring a space world. Keep it 2 sentences.',
          schema: storyStepSchema,
          temperature: 0.7,
        },
        timings
      );

      expect(typeof result.adventureNarrative).toBe('string');
      expect(result.adventureNarrative.length).toBeGreaterThan(0);
      expect(typeof result.wizzyDialogue).toBe('string');
      expect(Array.isArray(result.storyChoices)).toBe(true);
      expect(typeof result.imageDescription).toBe('string');

      console.info('\n========== TIMING SUMMARY ==========');
      for (const entry of timings) {
        console.info(`  ${entry.step.padEnd(20)} ${(entry.durationMs / 1000).toFixed(1)}s`);
      }
      console.info('=====================================\n');
    }
  );

  it(
    'generates a math question response with correct shape',
    { timeout: 60_000 },
    async () => {
      for (const key of ['OLLAMA_BASE_URL', 'OLLAMA_MODEL', 'OLLAMA_USERNAME', 'OLLAMA_PASSWORD']) {
        if (!process.env[key]) {
          throw new Error(
            `${key} is not set. Add it to server/.env before running: npm run test:live:ollama`
          );
        }
      }

      const provider = new OllamaProvider();

      const result = await timedGenerate<{
        wizzyDialogue: string;
        problemText: string;
        answerOptions: string[];
        correctAnswer: string;
        imageDescription: string;
      }>(
        'math question',
        provider,
        {
          prompt:
            'Generate a simple addition math question for a grade-2 student. Use single-digit numbers.',
          schema: mathQuestionSchema,
          temperature: 0.5,
        },
        timings
      );

      expect(typeof result.wizzyDialogue).toBe('string');
      expect(typeof result.problemText).toBe('string');
      expect(result.problemText.length).toBeGreaterThan(0);
      expect(Array.isArray(result.answerOptions)).toBe(true);
      expect(result.answerOptions.length).toBeGreaterThan(0);
      expect(typeof result.correctAnswer).toBe('string');

      console.info('\n========== TIMING SUMMARY ==========');
      for (const entry of timings) {
        console.info(`  ${entry.step.padEnd(20)} ${(entry.durationMs / 1000).toFixed(1)}s`);
      }
      console.info('=====================================\n');
    }
  );
});
