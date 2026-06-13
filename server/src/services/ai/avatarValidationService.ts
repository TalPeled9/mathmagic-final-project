import { OllamaProvider } from './providers/ollamaProvider';
import { GeminiProvider } from './providers/geminiProvider';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';

export interface ValidationResult {
  valid: boolean;
  correctedDescription: string;
  rejectionReason?: 'unsafe' | 'gibberish' | 'unrelated';
}

const VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    valid: { type: 'boolean' },
    correctedDescription: { type: 'string' },
    rejectionReason: { type: 'string' },
  },
};

function buildPrompt(description: string): string {
  return `You are a content moderator for a children's educational app. A child is describing what they want their avatar character to look like.

Evaluate this description: "${description}"

Rules:
- Set valid=true if the text describes any character, creature, animal, or avatar concept — including imaginative ones (e.g. "astronaut with a cowboy hat", "dragon wearing sunglasses", "robot knight"). Fantasy elements like swords, wands, and magic are acceptable.
- Set valid=false, rejectionReason="gibberish" if the text is random characters, numbers only, keyboard mashing, or makes no sense as English words.
- Set valid=false, rejectionReason="unsafe" if the text contains sexual content, extreme gore, or hate speech targeting real groups of people.
- Set valid=false, rejectionReason="unrelated" if the text clearly does not describe a character or avatar at all (e.g. "the weather is nice today", "2 + 2 = 4").
- For valid descriptions: fix all spelling and grammar mistakes in correctedDescription.
- For invalid descriptions: correctedDescription must be an empty string.`;
}

function parseResult(raw: {
  valid: boolean;
  correctedDescription: string;
  rejectionReason?: string;
}): ValidationResult {
  const valid = raw.valid === true;
  const validReasons = ['unsafe', 'gibberish', 'unrelated'];
  return {
    valid,
    correctedDescription: valid ? (raw.correctedDescription ?? '') : '',
    rejectionReason:
      !valid && validReasons.includes(raw.rejectionReason ?? '')
        ? (raw.rejectionReason as ValidationResult['rejectionReason'])
        : undefined,
  };
}

export async function validateDescription(
  description: string,
  provider?: InstanceType<typeof OllamaProvider>
): Promise<ValidationResult> {
  const request = {
    prompt: buildPrompt(description),
    schema: VALIDATION_SCHEMA,
    temperature: 0.1,
    maxOutputTokens: 256,
  };

  const primaryProvider = provider ?? new OllamaProvider();
  try {
    const raw = await primaryProvider.generateJson<{
      valid: boolean;
      correctedDescription: string;
      rejectionReason?: string;
    }>(request);
    return parseResult(raw);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.warn({ err }, 'Ollama validation failed, falling back to Gemini');
  }

  try {
    const raw = await new GeminiProvider().generateJson<{
      valid: boolean;
      correctedDescription: string;
      rejectionReason?: string;
    }>(request);
    return parseResult(raw);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, 'Avatar validation is temporarily unavailable. Please try again.');
  }
}
