import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/ai/avatarValidationService', () => ({
  validateDescription: vi.fn(),
}));

vi.mock('../../config', () => ({
  config: { gemini: { apiKey: 'test-key' } },
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

import { generateAvatar } from '../../services/avatarService';
import { validateDescription } from '../../services/ai/avatarValidationService';

// Mock GoogleGenAI is accessed dynamically in avatarService, so we get it from the mocked module
const mockValidate = validateDescription as any;
let mockGenerateContent: any;
let MockGoogleGenAI: any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockGenerateContent = vi.fn();
  // Get the mocked GoogleGenAI from the dynamic import in avatarService
  const genaiModule = await vi.importMock('@google/genai');
  MockGoogleGenAI = genaiModule.GoogleGenAI;
  MockGoogleGenAI.mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  }));
});

describe('generateAvatar', () => {
  it('throws ApiError 400 with rejectionReason as message when description is invalid', async () => {
    mockValidate.mockResolvedValue({
      valid: false,
      correctedDescription: '',
      rejectionReason: 'gibberish',
    });

    await expect(generateAvatar('Alex', 3, 'asdfjkl')).rejects.toMatchObject({
      statusCode: 400,
      message: 'gibberish',
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('returns imageData and correctedDescription on success', async () => {
    mockValidate.mockResolvedValue({
      valid: true,
      correctedDescription: 'an astronaut wearing a cowboy hat',
    });
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'abc123' } }] },
        },
      ],
    });

    const result = await generateAvatar('Alex', 3, 'an astrounaut wearing a cowbay hat');

    expect(result.imageData).toBe('data:image/jpeg;base64,abc123');
    expect(result.description).toBe('an astronaut wearing a cowboy hat');
  });

  it('returns fallback SVG when Gemini returns no image part', async () => {
    mockValidate.mockResolvedValue({ valid: true, correctedDescription: 'a dragon' });
    mockGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [] } }] });

    const result = await generateAvatar('Alex', 3, 'a dragon');

    expect(result.imageData).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(result.description).toBe('a dragon');
  });

  it('returns fallback SVG when Gemini throws', async () => {
    mockValidate.mockResolvedValue({ valid: true, correctedDescription: 'a robot' });
    mockGenerateContent.mockRejectedValue(new Error('Gemini error'));

    const result = await generateAvatar('Alex', 3, 'a robot');

    expect(result.imageData).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
