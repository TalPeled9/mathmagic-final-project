import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateDescription } from '../../services/ai/avatarValidationService';

describe('validateDescription', () => {
  let mockGenerateJson: ReturnType<typeof vi.fn>;
  let mockProvider: any;

  beforeEach(() => {
    mockGenerateJson = vi.fn();
    mockProvider = {
      name: 'ollama',
      generateJson: mockGenerateJson,
    };
  });

  it('returns valid=true and corrected description for a misspelled but valid input', async () => {
    mockGenerateJson.mockResolvedValue({
      valid: true,
      correctedDescription: 'an astronaut wearing a cowboy hat',
      rejectionReason: '',
    });

    const result = await validateDescription('an astrounaut wearing a cowbay hat', mockProvider);

    expect(result.valid).toBe(true);
    expect(result.correctedDescription).toBe('an astronaut wearing a cowboy hat');
    expect(result.rejectionReason).toBeUndefined();
  });

  it('returns valid=false with rejectionReason "gibberish" for keyboard mashing', async () => {
    mockGenerateJson.mockResolvedValue({
      valid: false,
      correctedDescription: '',
      rejectionReason: 'gibberish',
    });

    const result = await validateDescription('asdfjkl qwerty 12345', mockProvider);

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe('gibberish');
    expect(result.correctedDescription).toBe('');
  });

  it('returns valid=false with rejectionReason "unsafe" for harmful content', async () => {
    mockGenerateJson.mockResolvedValue({
      valid: false,
      correctedDescription: '',
      rejectionReason: 'unsafe',
    });

    const result = await validateDescription(
      'a character that kills and hurts people',
      mockProvider
    );

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe('unsafe');
  });

  it('returns valid=false with rejectionReason "unrelated" for non-character text', async () => {
    mockGenerateJson.mockResolvedValue({
      valid: false,
      correctedDescription: '',
      rejectionReason: 'unrelated',
    });

    const result = await validateDescription('the weather is nice today', mockProvider);

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe('unrelated');
  });

  it('throws ApiError 503 when Ollama is unreachable', async () => {
    mockGenerateJson.mockRejectedValue(new Error('Network error'));

    await expect(validateDescription('a dragon', mockProvider)).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('treats unknown rejectionReason values from the model as undefined', async () => {
    mockGenerateJson.mockResolvedValue({
      valid: true,
      correctedDescription: 'a cool robot',
      rejectionReason: 'something_unexpected',
    });

    const result = await validateDescription('a cool robot', mockProvider);

    expect(result.valid).toBe(true);
    expect(result.rejectionReason).toBeUndefined();
  });
});
